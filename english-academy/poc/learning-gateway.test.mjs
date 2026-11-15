import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeLearningAction, createCandidateInMemory } from './learning-gateway.mjs';

const owner = 'demo-user';
const client = 'english-teacher';
const actor = { userId: owner, channel: 'mcp', verifiedMcpClientId: client, isAnonymous: false };
const context = { verifiedActor: actor, resourceOwnerId: owner, allowedMcpClientId: client };

test('valid authorized read', () => {
  assert.equal(authorizeLearningAction({ ...context, action: 'learning_status' }).allowed, true);
});
test('fail closed on unknown action', () => {
  assert.equal(authorizeLearningAction({ ...context, action: 'arbitrary_sql' }).code, 'UNKNOWN_ACTION');
});
test('refuse cross-owner read and write', () => {
  assert.equal(authorizeLearningAction({ ...context, resourceOwnerId: 'someone-else', action: 'learning_status' }).code, 'OWNER_MISMATCH');
  assert.equal(authorizeLearningAction({ ...context, resourceOwnerId: 'someone-else', action: 'create_card_candidates' }).allowed, false);
});
test('refuse anonymous callers and unauthorized MCP clients', () => {
  assert.equal(authorizeLearningAction({ ...context, verifiedActor: { ...actor, isAnonymous: true }, action: 'learning_status' }).code, 'UNAUTHENTICATED');
  assert.equal(authorizeLearningAction({ ...context, allowedMcpClientId: 'other', action: 'learning_status' }).code, 'UNAUTHORIZED_MCP_CLIENT');
});
test('privileged operations require server verified action-specific approval', () => {
  for (const action of ['delete_learning_record', 'reset_learning_progress', 'change_allowlist', 'deploy']) {
    assert.equal(authorizeLearningAction({ ...context, action }).code, 'EXPLICIT_APPROVAL_REQUIRED');
    assert.equal(authorizeLearningAction({ ...context, action, serverApproval: { verified: true, userId: owner, action: 'not-this-action' } }).allowed, false);
    assert.equal(authorizeLearningAction({ ...context, action, serverApproval: { verified: true, userId: owner, action } }).allowed, true);
  }
});
test('formal card admission requires server approved action', () => {
  assert.equal(authorizeLearningAction({ ...context, action: 'add_vocabulary' }).allowed, false);
  assert.equal(authorizeLearningAction({ ...context, action: 'add_vocabulary', serverApproval: { verified: true, userId: owner, action: 'add_vocabulary' } }).allowed, true);
});
test('candidate creation is idempotent per owner and request id', () => {
  const store = { candidates: new Map(), requests: new Map() };
  const args = { store, ...context, requestId: 'valid-request-000001', term: 'Hungry' };
  const first = createCandidateInMemory(args);
  const second = createCandidateInMemory(args);
  assert.equal(first.code, 'CANDIDATE_RECORDED');
  assert.equal(second.replay, true);
  assert.equal(store.candidates.size, 1);
});
test('case and spaces are normalized to avoid duplicate vocabulary candidates', () => {
  const store = { candidates: new Map(), requests: new Map() };
  const common = { store, ...context };
  createCandidateInMemory({ ...common, requestId: 'valid-request-000002', term: '  Have   Eaten  ' });
  createCandidateInMemory({ ...common, requestId: 'valid-request-000003', term: 'have eaten' });
  assert.equal(store.candidates.size, 1);
});
test('different owners do not deduplicate into each other', () => {
  const store = { candidates: new Map(), requests: new Map() };
  createCandidateInMemory({ store, ...context, requestId: 'valid-request-000004', term: 'hungry' });
  createCandidateInMemory({ store, verifiedActor: { ...actor, userId: 'another-user' }, resourceOwnerId: 'another-user', allowedMcpClientId: client, requestId: 'valid-request-000004', term: 'hungry' });
  assert.equal(store.candidates.size, 2);
});
test('invalid idempotency token and blank term rejected without side effects', () => {
  const store = { candidates: new Map(), requests: new Map() };
  assert.equal(createCandidateInMemory({ store, ...context, requestId: 'short', term: 'word' }).code, 'INVALID_REQUEST_ID');
  assert.equal(createCandidateInMemory({ store, ...context, requestId: 'valid-request-000005', term: '  ' }).code, 'INVALID_TERM');
  assert.equal(store.candidates.size, 0);
});

test('reused request ID with a different term is rejected rather than silently replayed', () => {
  const store = { candidates: new Map(), requests: new Map() };
  const common = { store, ...context, requestId: 'valid-request-000006' };
  const original = createCandidateInMemory({ ...common, term: 'apple' });
  const conflict = createCandidateInMemory({ ...common, term: 'orange' });
  assert.equal(original.candidate.term, 'apple');
  assert.equal(conflict.allowed, false);
  assert.equal(conflict.code, 'IDEMPOTENCY_CONFLICT');
  assert.equal(store.candidates.size, 1);
  assert.equal(store.requests.size, 1);
});
