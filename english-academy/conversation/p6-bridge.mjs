// TASK-015: convert a proposed chat lesson to the EXISTING P3/P6 English Academy
// candidate contract. Never send requests, persist learner data, or claim consent.
// Only trusted server code may authorize a source session and send these payloads.
import {LEDGER_SCHEMA} from './ledger.mjs';

const MAX_ITEMS = 10;
const safe = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.trim().length <= max;
const clean = s => s.trim();
const normalized = s => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');

export function proposeExistingAcademySync(ledger) {
  if (ledger?.schema !== LEDGER_SCHEMA || !Array.isArray(ledger.entries) || !Array.isArray(ledger.events))
    throw new TypeError('invalid English Academy ledger');
  const errors = [], candidates = [], seenErrors = new Set(), seenWords = new Set();
  for (const entry of ledger.entries) {
    if (!entry || !['sentence', 'word'].includes(entry.kind)) throw new TypeError('invalid learning entry');
    if (!safe(entry.original, 500) || !safe(entry.correction, entry.kind === 'sentence' ? 500 : 120))
      throw new RangeError('entry too long for P6 contract');
    if (entry.kind === 'sentence') {
      if (!safe(entry.meaning, 500)) throw new RangeError('missing explanation');
      const k = normalized(entry.original) + '|' + normalized(entry.correction);
      if (seenErrors.has(k)) continue;
      seenErrors.add(k);
      errors.push({original: clean(entry.original), corrected: clean(entry.correction),
        explanation: clean(entry.meaning)});
    } else {
      if (!safe(entry.meaning, 500)) throw new RangeError('missing Chinese word meaning');
      const k = normalized(entry.correction);
      if (seenWords.has(k)) continue;
      seenWords.add(k);
      candidates.push({term: clean(entry.correction), meaningZh: clean(entry.meaning)});
    }
  }
  // P6 limits each action to ten items. Caller must split by topic and
  // request independently after trusted server verification of session.
  if (errors.length > MAX_ITEMS || candidates.length > MAX_ITEMS)
    throw new RangeError('split proposal into batches of ten');
  return {
    contract: 'existing-english-academy/p3-p6',
    status: 'proposal-only',
    websiteSessionVerified: false,
    userApprovedCards: false,
    requiresTrustedOwnerAndSession: true,
    actions: [
      ...(errors.length ? [{tool:'record_language_errors',errors}] : []),
      ...(candidates.length ? [{tool:'create_card_candidates',candidates}] : [])
    ],
    note: 'No formal cards were created. Website approval and an authenticated MCP backend are required.'
  };
}
