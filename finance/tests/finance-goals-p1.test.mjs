import test from "node:test";
import assert from "node:assert/strict";
import { createGoal, editGoal, recordAllocation, goalProgress } from "../goals/p1-goal-model.mjs";

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const SAVINGS = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INVEST = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const REQUEST2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const goal = (extra = {}) => createGoal({
  ownerId: OWNER, id: SAVINGS, month: "2026-12",
  kind: "savings", targetAmount: 5000, accountId: "first-bank-savings", ...extra
});
const entry = (extra = {}) => ({
  ownerId: OWNER, goalId: SAVINGS, requestId: REQUEST,
  kind: "allocate", amount: 3000, sourceReference: "salary-dec-savings-slice",
  confirmedByUser: true, ...extra
});
const apply = (goals, events, input) => recordAllocation({ goals, events }, input);
const code = (fn, value) => assert.throws(fn, { code: value });

test("P1-01 both goal kinds have distinct meaning; initial status is planned", () => {
  const saved = goal(), invest = goal({ id: INVEST, kind: "investible_cash", targetAmount: 14650, accountId: null });
  assert.equal(saved.currency, "TWD");
  assert.equal(invest.kind, "investible_cash");
  const summary = goalProgress(invest, [], OWNER);
  assert.equal(summary.userConfirmedReserved, 0);
  assert.equal(summary.investedPrincipal, null);
  assert.equal(summary.bankVerified, false);
  assert.equal(summary.status, "in_progress");
});

test("P1-02 validates month, amount, account and identifiers", () => {
  for (const data of [
    { month: "2026-13" }, { targetAmount: -1 }, { targetAmount: 2 ** 53 },
    { accountId: "" }, { kind: "credit_card_payment" },
    { ownerId: "arbitrary-user" }
  ]) code(() => goal(data), "GOAL_VALIDATION_ERROR");
});

test("P1-03 owner and expected version checked for changes", () => {
  const g = goal();
  code(() => editGoal(g, { ownerId: OTHER, expectedVersion: 1, targetAmount: 6000 }), "GOAL_NOT_FOUND");
  code(() => editGoal(g, { ownerId: OWNER, expectedVersion: 0, targetAmount: 6000 }), "GOAL_VERSION_CONFLICT");
  const changed = editGoal(g, { ownerId: OWNER, expectedVersion: 1, targetAmount: 6000 });
  assert.equal(changed.version, 2);
  assert.equal(changed.id, g.id);
  assert.equal(g.targetAmount, 5000);
  const removed = editGoal(changed, { ownerId: OWNER, expectedVersion: 2, targetAmount: 6000, remove: true });
  code(() => goalProgress(removed, [], OWNER), "GOAL_NOT_FOUND");
});

test("P1-04 allocation requires explicit confirmation and positive integer", () => {
  const goals = [goal()];
  code(() => apply(goals, [], entry({ confirmedByUser: false })), "GOAL_VALIDATION_ERROR");
  code(() => apply(goals, [], entry({ amount: 0 })), "GOAL_VALIDATION_ERROR");
  code(() => apply(goals, [], entry({ amount: 0.25 })), "GOAL_VALIDATION_ERROR");
  code(() => apply(goals, [], entry({ arbitraryOwner: OTHER })), "GOAL_VALIDATION_ERROR");
});

test("P1-05 attested allocation progress is not mislabelled as bank verified", () => {
  const goals = [goal()];
  const result = apply(goals, [], entry());
  assert.equal(result.replayed, false);
  const summary = goalProgress(goals[0], result.events, OWNER);
  assert.equal(summary.userConfirmedReserved, 3000);
  assert.equal(summary.remaining, 2000);
  assert.equal(summary.percentage, 60);
  assert.equal(summary.bankVerified, false);
  assert.equal(summary.investedPrincipal, null);
});

test("P1-06 idempotency returns original receipt, conflicting request rejected", () => {
  const goals = [goal()];
  const once = apply(goals, [], entry());
  const same = apply(goals, once.events, entry());
  assert.equal(same.replayed, true);
  assert.equal(same.events.length, 1);
  code(() => apply(goals, once.events, entry({ amount: 1000 })), "GOAL_DUPLICATE_REQUEST");
});

test("P1-07 one source slice cannot be allocated to two goals", () => {
  const goals = [goal(), goal({ id: INVEST, kind: "investible_cash", targetAmount: 14650 })];
  const once = apply(goals, [], entry());
  code(() => apply(goals, once.events, entry({ goalId: INVEST, requestId: REQUEST2 })),
    "GOAL_SOURCE_ALREADY_ALLOCATED");
});

test("P1-08 release requires an existing slice and cannot exceed confirmed reserve", () => {
  const goals = [goal()];
  code(() => apply(goals, [], entry({ kind: "release" })), "GOAL_SOURCE_NOT_ALLOCATED");
  const once = apply(goals, [], entry());
  const base = { kind: "release", amount: 3001, requestId: REQUEST2 };
  code(() => apply(goals, once.events, entry(base)), "GOAL_RELEASE_EXCEEDS_SOURCE");
  code(() => apply(goals, once.events, entry({ ...base, amount: 2000, sourceReference: "unknown-slice" })),
    "GOAL_SOURCE_NOT_ALLOCATED");
});

test("P1-09 partial release and subsequent release are bounded and auditable", () => {
  const goals = [goal()];
  const first = apply(goals, [], entry());
  const released = apply(goals, first.events, entry({ requestId: REQUEST2, kind: "release", amount: 2000 }));
  assert.equal(goalProgress(goals[0], released.events, OWNER).userConfirmedReserved, 1000);
  code(() => apply(goals, released.events, entry({
    requestId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", kind: "release", amount: 1500
  })), "GOAL_RELEASE_EXCEEDS_SOURCE");
  assert.equal(first.events.length, 1);
});

test("P1-10 different owner's goal cannot be touched", () => {
  const goals = [goal()];
  code(() => apply(goals, [], entry({ ownerId: OTHER })), "GOAL_NOT_FOUND");
  code(() => goalProgress(goals[0], [], OTHER), "GOAL_NOT_FOUND");
});

test("P1-11 user-confirmed funding over target is visible, never a broker trade", () => {
  const goals = [goal({ targetAmount: 1000 })];
  const result = apply(goals, [], entry());
  const s = goalProgress(goals[0], result.events, OWNER);
  assert.equal(s.percentage, 300);
  assert.equal(s.remaining, 0);
  assert.equal(s.status, "target_confirmed");
  assert.equal(s.investedPrincipal, null);
});

test("P1-12 zero target has no division by zero", () => {
  const g = goal({ targetAmount: 0 });
  const s = goalProgress(g, [], OWNER);
  assert.equal(s.percentage, null);
  assert.equal(s.status, "zero_target");
});

test("P1-13 allocations are pure and contain no Finance ledger side effects", () => {
  const g = goal();
  const goals = [g], events = [];
  const result = apply(goals, events, entry());
  assert.equal(goals.length, 1);
  assert.equal(events.length, 0);
  assert.equal(result.receipt.evidence, "user_confirmed");
  assert.equal(Object.keys(result.receipt).includes("bankTransferId"), false);
});
