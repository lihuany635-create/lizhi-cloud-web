// Finance savings/investment goals P1 - isolated candidate; NOT wired to production.
// No account transfers, brokerage trades, ledger mutations or remote calls.
export const GOAL_KINDS = Object.freeze(["savings", "investible_cash", "sinking_fund"]);
export const ENTRY_KINDS = Object.freeze(["allocate", "release"]);
const MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const amountOk = v => Number.isSafeInteger(v) && v >= 0;
const positive = v => amountOk(v) && v > 0;
const invalid = code => { const e = new Error(code); e.code = code; throw e; };
const text = s => typeof s === "string" && s.length > 0 && s.length <= 160;
const uuid = s => typeof s === "string" && UUID.test(s);
const owns = (record, ownerId) => record && record.ownerId === ownerId && !record.deletedAt;
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).every(key => keys.includes(key));

// Confirmed allocations are owner attestations, NEVER inferred from bank balances.
// A goal is a plan; events are separate allocations, not real transfers or purchases.
export function createGoal({ ownerId, id, month, kind, targetAmount, accountId = null }) {
  if (!uuid(ownerId) || !uuid(id) || !MONTH.test(month) ||
      !GOAL_KINDS.includes(kind) || !amountOk(targetAmount) ||
      !(accountId === null || text(accountId))) invalid("GOAL_VALIDATION_ERROR");
  return Object.freeze({
    ownerId, id, month, kind, currency: "TWD", targetAmount,
    accountId, version: 1, deletedAt: null
  });
}

export function editGoal(goal, { ownerId, expectedVersion, targetAmount,
  accountId = goal?.accountId, remove = false }) {
  if (!owns(goal, ownerId)) invalid("GOAL_NOT_FOUND");
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== goal.version)
    invalid("GOAL_VERSION_CONFLICT");
  if (!amountOk(targetAmount) || !(accountId === null || text(accountId)) ||
      typeof remove !== "boolean") invalid("GOAL_VALIDATION_ERROR");
  return Object.freeze({
    ...goal, targetAmount, accountId, version: goal.version + 1,
    deletedAt: remove ? "soft-deleted" : null
  });
}

function eventFingerprint(input) {
  // Identical request_id must represent the exact same business operation.
  return JSON.stringify([input.ownerId, input.goalId, input.requestId,
    input.kind, input.amount, input.sourceReference, input.confirmedByUser]);
}

export function goalProgress(goal, events, ownerId) {
  if (!owns(goal, ownerId)) invalid("GOAL_NOT_FOUND");
  if (!Array.isArray(events)) invalid("GOAL_VALIDATION_ERROR");
  let reserved = 0;
  for (const event of events) {
    if (event.ownerId !== ownerId || event.goalId !== goal.id) continue;
    if (!ENTRY_KINDS.includes(event.kind) || !positive(event.amount))
      invalid("GOAL_INVALID_EVENT");
    reserved += event.kind === "allocate" ? event.amount : -event.amount;
    if (!Number.isSafeInteger(reserved) || reserved < 0) invalid("GOAL_INVALID_EVENT");
  }
  const target = goal.targetAmount;
  return Object.freeze({
    goalId: goal.id, kind: goal.kind, targetAmount: target,
    userConfirmedReserved: reserved, // NOT bank-verified or invested
    remaining: Math.max(0, target - reserved),
    percentage: target === 0 ? null : Math.round(reserved / target * 10000) / 100,
    status: target === 0 ? "zero_target" : reserved >= target ? "target_confirmed" : "in_progress",
    bankVerified: false, investedPrincipal: null
  });
}

// Pure in-memory proposal: storage caller supplies goal and event arrays. No I/O.
// Each sourceReference is a unique funding slice, not a raw salary transaction ID;
// split money must use disjoint source slices to prevent accidental double counting.
export function recordAllocation({ goals, events }, input) {
  if (!Array.isArray(goals) || !Array.isArray(events) ||
      !exact(input, ["ownerId", "goalId", "requestId", "kind",
        "amount", "sourceReference", "confirmedByUser"])) invalid("GOAL_VALIDATION_ERROR");
  const { ownerId, goalId, requestId, kind, amount, sourceReference, confirmedByUser } = input;
  if (!uuid(ownerId) || !uuid(goalId) || !uuid(requestId) ||
      !ENTRY_KINDS.includes(kind) || !positive(amount) ||
      !text(sourceReference) || confirmedByUser !== true)
    invalid("GOAL_VALIDATION_ERROR");
  const prior = events.find(row => row.ownerId === ownerId && row.requestId === requestId);
  if (prior) {
    if (prior.fingerprint !== eventFingerprint(input)) invalid("GOAL_DUPLICATE_REQUEST");
    return Object.freeze({ events: events.slice(), receipt: prior, replayed: true });
  }
  const goal = goals.find(g => g.id === goalId && g.ownerId === ownerId);
  if (!owns(goal, ownerId)) invalid("GOAL_NOT_FOUND");
  const sameRef = events.filter(row =>
    row.ownerId === ownerId && row.sourceReference === sourceReference);
  if (kind === "allocate" && sameRef.some(row => row.kind === "allocate"))
    invalid("GOAL_SOURCE_ALREADY_ALLOCATED");
  if (kind === "release" && !sameRef.some(row => row.kind === "allocate"))
    invalid("GOAL_SOURCE_NOT_ALLOCATED");
  const sourceBalance = sameRef.reduce((total, row) =>
    total + (row.kind === "allocate" ? row.amount : -row.amount), 0);
  if (kind === "release" && (sourceBalance < amount ||
      sameRef.some(row => row.goalId !== goalId)))
    invalid("GOAL_RELEASE_EXCEEDS_SOURCE");
  if (kind === "release" &&
      goalProgress(goal, events, ownerId).userConfirmedReserved < amount)
    invalid("GOAL_RELEASE_EXCEEDS_GOAL");
  const receipt = Object.freeze({
    ...input, fingerprint: eventFingerprint(input),
    // Only user-confirmed; never claim a bank confirmation.
    evidence: "user_confirmed", bankVerified: false
  });
  return Object.freeze({ events: [...events, receipt], receipt, replayed: false });
}
