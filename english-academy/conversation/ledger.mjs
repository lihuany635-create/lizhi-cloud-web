// TASK-015 candidate-only conversation study ledger.
// This is a pure in-memory model. No cloud writes, browser persistence or AI grading.
export const LEDGER_SCHEMA = 'lizhi-english-chat-ledger/v1';
const KINDS = new Set(['sentence', 'word']);
const VERDICTS = new Set(['correct', 'incorrect', 'unsure']);
const REVIEWERS = new Set(['self', 'human']);
const MAX_ITEMS = 2000;
const MAX_EVENTS = 10000;

function field(value, name, max, required = false) {
  if (typeof value !== 'string') throw new TypeError(name + ' must be a string');
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new RangeError(name + ' length is invalid');
  return result;
}
function stamp(value) {
  const d = new Date(value);
  if (!value || !Number.isFinite(d.getTime())) throw new RangeError('invalid timestamp');
  return d.toISOString();
}
function validateId(value, name) {
  const id = field(value, name, 90, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new RangeError('invalid ' + name);
  return id;
}
function normalized(value) {
  return String(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}
function copy(ledger) {
  if (ledger?.schema !== LEDGER_SCHEMA || !Array.isArray(ledger.entries) || !Array.isArray(ledger.events)) {
    throw new TypeError('unsupported ledger');
  }
  return { schema: LEDGER_SCHEMA, entries: [...ledger.entries], events: [...ledger.events] };
}
export function createLedger() {
  return { schema: LEDGER_SCHEMA, entries: [], events: [] };
}
export function addCandidate(ledger, input, { id, at } = {}) {
  const next = copy(ledger);
  if (next.entries.length >= MAX_ITEMS) throw new RangeError('entry limit reached');
  const kind = field(input.kind, 'kind', 20, true);
  if (!KINDS.has(kind)) throw new RangeError('unsupported kind');
  const original = field(input.original, 'original', 1500, true);
  const correction = field(input.correction, 'correction', 1500, true);
  const meaning = field(input.meaning || '', 'meaning', 350);
  const topic = field(input.topic || '', 'topic', 160);
  const entryId = validateId(id, 'entry id');
  const candidate = { id: entryId, kind, original, correction, meaning, topic, createdAt: stamp(at) };
  const existing = next.entries.find(row => row.id === entryId);
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(candidate)) return next;
    throw new Error('entry id collision');
  }
  // A phrase repeated in one chat is one candidate, not extra mistakes.
  const duplicate = next.entries.find(row => row.kind === kind &&
    normalized(row.original) === normalized(original) &&
    normalized(row.correction) === normalized(correction));
  if (duplicate) return next;
  next.entries.push(candidate);
  return next;
}
export function recordReview(ledger, { entryId, answer, verdict, reviewer, reviewId, at }) {
  const next = copy(ledger);
  const id = validateId(entryId, 'entry id');
  if (!next.entries.some(row => row.id === id)) throw new RangeError('unknown entry');
  if (next.events.length >= MAX_EVENTS) throw new RangeError('event limit reached');
  if (!VERDICTS.has(verdict) || !REVIEWERS.has(reviewer)) throw new RangeError('invalid review evidence');
  const event = {
    id: validateId(reviewId, 'review id'), entryId: id, action: 'review',
    answer: field(answer, 'answer', 1500, true),
    verdict, reviewer, at: stamp(at)
  };
  const old = next.events.find(row => row.id === event.id);
  if (old) {
    if (JSON.stringify(old) === JSON.stringify(event)) return next;
    throw new Error('review id collision');
  }
  next.events.push(event);
  return next;
}
export function entryProgress(ledger, entryId) {
  const snapshot = copy(ledger);
  const reviews = snapshot.events.filter(e => e.entryId === entryId && e.action === 'review')
    .sort((a, b) => a.at.localeCompare(b.at));
  const last = reviews.at(-1);
  const humanCorrectDays = new Set(reviews.filter(e =>
    e.reviewer === 'human' && e.verdict === 'correct').map(e => e.at.slice(0, 10)));
  let status = 'candidate';
  if (last?.verdict === 'incorrect') status = 'needs-practice';
  else if (humanCorrectDays.size >= 2 && last?.reviewer === 'human' && last?.verdict === 'correct') status = 'mastered';
  else if (reviews.length) status = 'reviewing';
  // Self-assessment never proves mastery. A later mistake revokes prior mastery.
  const anchor = new Date(last?.at || snapshot.entries.find(e => e.id === entryId)?.createdAt || 0);
  const days = status === 'mastered' ? 7 : status === 'reviewing' ? 3 : 1;
  const nextDue = new Date(anchor.getTime() + days * 86400000).toISOString();
  return { status, reviews: reviews.length, verifiedDays: humanCorrectDays.size,
    nextDueAt: nextDue, lastVerdict: last?.verdict || null };
}
export function importLedger(json) {
  if (typeof json !== 'string' || json.length > 4_000_000) throw new RangeError('import too large');
  const data = JSON.parse(json);
  if (data?.schema !== LEDGER_SCHEMA || !Array.isArray(data.entries) ||
      !Array.isArray(data.events) || data.entries.length > MAX_ITEMS ||
      data.events.length > MAX_EVENTS) throw new Error('invalid ledger schema');
  let next = createLedger();
  for (const row of data.entries) {
    const before = next.entries.length;
    next = addCandidate(next, row, { id: row.id, at: row.createdAt });
    if (next.entries.length === before) throw new Error('duplicate imported entry');
  }
  for (const row of data.events) {
    const before = next.events.length;
    if (row.action !== 'review') throw new Error('invalid event action');
    next = recordReview(next, { entryId: row.entryId, answer: row.answer,
      verdict: row.verdict, reviewer: row.reviewer, reviewId: row.id, at: row.at });
    if (next.events.length === before) throw new Error('duplicate imported review');
  }
  return next;
}
export function exportLedger(ledger) {
  return JSON.stringify(copy(ledger), null, 2);
}
