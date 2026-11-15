// P0 isolated proof of concept. No network calls or production credentials.
// IMPORTANT: verifiedActor and serverApproval MUST be derived by the server,
// NEVER accepted from an untrusted browser/MCP request body.
export const ACTION_CLASS = Object.freeze({
  learning_status: 'read',
  get_learning_profile: 'read',
  get_review_summary: 'read',
  get_assessment_results: 'read',
  get_sync_status: 'read',
  create_card_candidates: 'candidate',
  record_language_errors: 'candidate',
  propose_learning_plan: 'candidate',
  add_vocabulary: 'explicit',
  delete_learning_record: 'privileged',
  reset_learning_progress: 'privileged',
  change_allowlist: 'privileged',
  deploy: 'privileged',
});

const fail = (code) => ({ allowed: false, code });

export function authorizeLearningAction({
  verifiedActor, resourceOwnerId, action, allowedMcpClientId,
  serverApproval = null,
}) {
  const accessClass = ACTION_CLASS[action];
  if (!accessClass) return fail('UNKNOWN_ACTION');
  if (!verifiedActor?.userId || verifiedActor.isAnonymous) return fail('UNAUTHENTICATED');
  if (verifiedActor.userId !== resourceOwnerId) return fail('OWNER_MISMATCH');
  if (verifiedActor.channel === 'mcp' &&
    (!allowedMcpClientId || verifiedActor.verifiedMcpClientId !== allowedMcpClientId))
    return fail('UNAUTHORIZED_MCP_CLIENT');
  if (!['mcp', 'web'].includes(verifiedActor.channel)) return fail('UNKNOWN_CHANNEL');
  if (accessClass === 'read' || accessClass === 'candidate')
    return { allowed: true, code: 'AUTHORIZED' };
  // A server-verified action-specific approval (not a client supplied boolean)
  // is required to promote cards or perform privileged changes.
  if (!serverApproval?.verified || serverApproval.userId !== resourceOwnerId ||
      serverApproval.action !== action || serverApproval.revoked === true)
    return fail('EXPLICIT_APPROVAL_REQUIRED');
  return { allowed: true, code: 'AUTHORIZED_WITH_APPROVAL' };
}

export function createCandidateInMemory({
  store, verifiedActor, resourceOwnerId, allowedMcpClientId,
  requestId, term,
}) {
  const verdict = authorizeLearningAction({
    verifiedActor, resourceOwnerId, action: 'create_card_candidates',
    allowedMcpClientId,
  });
  if (!verdict.allowed) return verdict;
  if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{12,100}$/.test(requestId))
    return fail('INVALID_REQUEST_ID');
  if (typeof term !== 'string' || !term.trim() || term.length > 120)
    return fail('INVALID_TERM');
  const idempotencyKey = resourceOwnerId + ':' + requestId;
  if (store.requests.has(idempotencyKey))
    return { ...store.requests.get(idempotencyKey), replay: true };
  const normalized = term.normalize('NFKC').trim().replace(/\\s+/g, ' ').toLocaleLowerCase('en');
  const uniqueKey = resourceOwnerId + ':' + normalized;
  let card = store.candidates.get(uniqueKey);
  if (!card) {
    card = { ownerId: resourceOwnerId, term: term.trim(), status: 'pending' };
    store.candidates.set(uniqueKey, card);
  }
  const result = { allowed: true, code: 'CANDIDATE_RECORDED', candidate: { ...card }, replay: false };
  store.requests.set(idempotencyKey, result);
  return result;
}
