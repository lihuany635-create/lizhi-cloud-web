// P2 isolated FSRS adapter. Zero production data access.
// Uses open-spaced-repetition/ts-fsrs v6.0.0 + FSRS-7, Node >=24.
import { DefaultScheduler, Rating } from 'ts-fsrs';
export {Rating};

export const ENGINE_VERSION = Object.freeze({
  library: 'ts-fsrs',
  libraryVersion: '6.0.0',
  modelVersion: 'FSRS-7',
});

const RATINGS = new Set([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]);
const ID_RE = /^[A-Za-z0-9_-]{12,100}$/;

function validDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
export async function createEnglishScheduler({ desiredRetention = 0.9 } = {}) {
  if (typeof desiredRetention !== 'number' || !Number.isFinite(desiredRetention) ||
      desiredRetention < 0.7 || desiredRetention > 0.97) {
    throw new RangeError('RETENTION_OUT_OF_RANGE');
  }
  return DefaultScheduler({
    version: ENGINE_VERSION.modelVersion,
    desiredRetention,
    enableShortTerm: true,
    learningSteps: ['1m', '10m'],
    relearningSteps: ['10m'],
    enableFuzz: false, // deterministic tests; policy can be revised later
    maximumInterval: 36_500,
  });
}
export function createReviewCard(scheduler, { cardId, now }) {
  if (typeof cardId !== 'string' || !cardId.trim()) throw new TypeError('INVALID_CARD_ID');
  if (!validDate(now)) throw new TypeError('INVALID_DATE');
  return scheduler.newCard({ cardId, now });
}
export function reviewEnglishCard({
  scheduler, card, rating, now, requestId, history = [],
}) {
  if (!scheduler || !card || typeof card.cardId !== 'string') throw new TypeError('INVALID_CARD');
  if (!RATINGS.has(rating)) throw new RangeError('INVALID_RATING');
  if (!validDate(now)) throw new TypeError('INVALID_DATE');
  if (!ID_RE.test(String(requestId||''))) throw new TypeError('INVALID_REQUEST_ID');
  if (!Array.isArray(history)) throw new TypeError('INVALID_HISTORY');
  if (validDate(card.lastReviewAt) && now < card.lastReviewAt) {
    throw new RangeError('REVIEW_CLOCK_BEFORE_LAST_REVIEW');
  }
  const previous = history.find(event=>event.requestId===requestId);
  if (previous) {
    if (previous.cardId!==card.cardId || previous.rating!==rating) throw new Error('IDEMPOTENCY_CONFLICT');
    return { card, history, replay:true, nextDueAt:card.dueAt.toISOString() };
  }
  const { card: nextCard, revlog } = scheduler.review({ card, grade:rating, now });
  if (!validDate(nextCard.dueAt)) throw new Error('INVALID_FSRS_DUE_DATE');
  const nextHistory = [
    ...history,
    {
      requestId,
      cardId:card.cardId,
      rating,
      reviewedAt:now.toISOString(),
      dueAt:nextCard.dueAt.toISOString(),
      model:ENGINE_VERSION.modelVersion,
      library:ENGINE_VERSION.libraryVersion,
      revlog,
    },
  ];
  return {
    card:nextCard,
    history:nextHistory,
    replay:false,
    nextDueAt:nextCard.dueAt.toISOString(),
  };
}
export function dueCards(cards, now) {
  if (!Array.isArray(cards) || !validDate(now)) throw new TypeError('INVALID_INPUT');
  return cards.filter(c=>c?.scheduleStatus!=='suspended' && validDate(c?.dueAt) &&
       c.dueAt.getTime()<=now.getTime())
    .sort((a,b)=>a.dueAt-b.dueAt || String(a.cardId).localeCompare(String(b.cardId)));
}
export function serializeCard(card) {
  if (!card || !validDate(card.dueAt)) throw new TypeError('INVALID_CARD');
  const copy = { ...card, dueAt:card.dueAt.toISOString() };
  if (validDate(card.lastReviewAt)) copy.lastReviewAt=card.lastReviewAt.toISOString();
  else copy.lastReviewAt=null;
  return copy;
}
export function hydrateCard(stored) {
  if (!stored || typeof stored.cardId!=='string') throw new TypeError('INVALID_CARD');
  const card={...stored,dueAt:new Date(stored.dueAt),
    lastReviewAt:stored.lastReviewAt?new Date(stored.lastReviewAt):null};
  if (!validDate(card.dueAt) || (card.lastReviewAt && !validDate(card.lastReviewAt))) {
    throw new TypeError('INVALID_STORED_DATES');
  }
  return card;
}
