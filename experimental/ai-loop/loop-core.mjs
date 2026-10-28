/**
 * LIZHI AI LOOP P1: deterministic, dependency-free, IN-MEMORY sandbox.
 * No network, database, model calls, MCP calls, payments, or persistence.
 * Not a production scheduler. All 'worker' roles are mock actors.
 */
const MODES = new Set(['OFF', 'MANUAL', 'AUTO']);
const RISK_LEVEL = { L0: 0, L1: 1, L2: 2, L3: 3 };
const SHA256 = /^[a-f\d]{64}$/i;
const TERMINAL = new Set(['RECORDED', 'NEEDS_OWNER', 'BLOCKED', 'CANCELLED']);
export class LoopError extends Error {
  constructor(code, message = code) { super(message); this.name = 'LoopError'; this.code = code; }
}
function need(condition, code) { if (!condition) throw new LoopError(code); }
function clone(x) { return structuredClone(x); }
function now(iso) { const n = Date.parse(iso); need(Number.isFinite(n), 'INVALID_TIME'); return n; }

export class SandboxLoop {
  constructor({ maxRepairCycles = 2, externalApiBudget = 0 } = {}) {
    need(Number.isInteger(maxRepairCycles) && maxRepairCycles >= 0, 'INVALID_LIMIT');
    need(externalApiBudget === 0, 'PAID_API_DISABLED');
    this.mode = 'OFF'; this.paused = false; this.stopped = false;
    this.maxRepairCycles = maxRepairCycles; this.externalApiBudget = 0;
    this.tasks = new Map(); this.triggered = new Map(); this.effects = new Map();
    this.events = []; this.nextEventId = 1;
  }
  _event(t, event, detail = {}) {
    this.events.push({ seq: this.nextEventId++, taskId: t?.id ?? null, projectId: t?.projectId ?? null, event, detail: clone(detail) });
  }
  _task(id, projectId) {
    const t = this.tasks.get(id);
    need(t, 'TASK_NOT_FOUND');
    need(!projectId || t.projectId === projectId, 'WRONG_PROJECT');
    return t;
  }
  _state(t, expected) { need(t.state === expected, 'INVALID_TRANSITION'); }
  _change(t, expected, next, detail = {}) { this._state(t, expected); t.state = next; t.revision++; this._event(t, next, detail); }
  _cas(t, expectedRevision) { need(Number.isInteger(expectedRevision) && expectedRevision === t.revision, 'STALE_REVISION'); }
  setMode(mode) {
    need(MODES.has(mode), 'INVALID_MODE');
    need(!this.stopped || mode === 'OFF', 'STOPPED');
    this.mode = mode; this._event(null, 'MODE', { mode });
  }
  pause() { this.paused = true; this._event(null, 'PAUSE'); }
  resume() { need(!this.stopped, 'STOPPED'); this.paused = false; this._event(null, 'RESUME'); }
  stop() {
    this.stopped = true; this.mode = 'OFF'; this.paused = true;
    for (const t of this.tasks.values()) {
      if (t.state === 'QUEUED' || t.state === 'READY') this._change(t, t.state, 'CANCELLED', { reason: 'STOP' });
      else if (!TERMINAL.has(t.state)) { const old = t.state; this._change(t, old, 'NEEDS_OWNER', { reason: 'STOP_UNVERIFIED_EXTERNAL_EFFECT' }); }
    }
    this._event(null, 'STOP', { outstandingEffectsRequireReadback: true });
  }
  plan({ taskId, projectId, goal, acceptanceCriteria, allowedTools = [], riskTier = 'L1', expectedWorkbenchRevision = 0 }) {
    need(typeof taskId === 'string' && taskId.length > 0 && typeof projectId === 'string' && projectId.length > 0, 'INVALID_ID');
    need(typeof goal === 'string' && goal.length > 0 && typeof acceptanceCriteria === 'string' && acceptanceCriteria.length > 0, 'INVALID_PLAN');
    need(RISK_LEVEL[riskTier] !== undefined && Array.isArray(allowedTools), 'INVALID_POLICY');
    need(Number.isInteger(expectedWorkbenchRevision) && expectedWorkbenchRevision >= 0, 'INVALID_REVISION');
    need(!this.tasks.has(taskId), 'DUPLICATE_TASK');
    const t = { id: taskId, projectId, goal, acceptanceCriteria, allowedTools: clone(allowedTools),
      riskTier, expectedWorkbenchRevision, state: 'READY', revision: 1, repairCycles: 0,
      attempt: 0, executorId: null, lastSubmitted: null, review: null, lease: null, handoff: null };
    this.tasks.set(taskId, t); this._event(t, 'PLAN', { role: 'Planner', scope: 'sandbox' }); return clone(t);
  }
  trigger({ taskId, projectId, kind, eventId, allowlisted = false }) {
    const t = this._task(taskId, projectId); need(!this.paused && !this.stopped, 'PAUSED_OR_STOPPED');
    need(kind === 'manual' || kind === 'auto', 'INVALID_TRIGGER');
    need((kind === 'manual' && this.mode === 'MANUAL') || (kind === 'auto' && this.mode === 'AUTO' && allowlisted), 'TRIGGER_NOT_AUTHORIZED');
    need(typeof eventId === 'string' && eventId.length > 0, 'INVALID_EVENT_ID');
    const id = `${projectId}:${eventId}`;
    if (this.triggered.has(id)) {
      need(this.triggered.get(id) === taskId, 'EVENT_ID_CONFLICT');
      return { duplicate: true, task: clone(t) };
    }
    this._change(t, 'READY', 'QUEUED', { eventId, kind }); this.triggered.set(id, taskId);
    return { duplicate: false, task: clone(t) };
  }
  claim({ taskId, projectId, workerId, expectedRevision, leaseUntil }) {
    const t = this._task(taskId, projectId); need(!this.paused && !this.stopped && this.mode !== 'OFF', 'PAUSED_OR_STOPPED');
    this._cas(t, expectedRevision); need(typeof workerId === 'string' && workerId.length > 0, 'INVALID_WORKER');
    now(leaseUntil); this._change(t, 'QUEUED', 'CLAIMED', { workerId, leaseUntil });
    t.lease = { owner: workerId, until: leaseUntil }; return clone(t);
  }
  begin({ taskId, projectId, workerId, expectedRevision }) {
    const t = this._task(taskId, projectId); this._cas(t, expectedRevision);
    need(t.lease?.owner === workerId, 'LEASE_OWNER_MISMATCH'); this._change(t, 'CLAIMED', 'RUNNING');
    t.attempt++; t.executorId = workerId; return clone(t);
  }
  expireLease({ taskId, projectId, timestamp }) {
    const t = this._task(taskId, projectId);
    need(['CLAIMED', 'RUNNING'].includes(t.state), 'INVALID_TRANSITION');
    need(t.lease && now(timestamp) >= now(t.lease.until), 'LEASE_STILL_VALID');
    this._change(t, t.state, 'EXPIRED', { readbackRequired: true }); return clone(t);
  }
  authorize({ taskId, projectId, toolName, approval = null, paidApi = false, at = '2026-10-28T00:00:00.000Z' }) {
    const t = this._task(taskId, projectId);
    need(t.allowedTools.includes(toolName), 'TOOL_NOT_ALLOWLISTED');
    need(!this.stopped, 'STOPPED'); need(!paidApi, 'PAID_API_DISABLED');
    if (RISK_LEVEL[t.riskTier] >= 2) {
      need(approval?.approvedBy === 'owner' && approval?.projectId === t.projectId && approval?.taskId === t.id && approval?.toolName === toolName && approval?.riskTier === t.riskTier && !approval?.revokedAt && now(approval.expiresAt) > now(at), 'OWNER_APPROVAL_REQUIRED');
    }
    this._event(t, 'AUTH_ALLOWED', { toolName, riskTier: t.riskTier }); return true;
  }
  submit({ taskId, projectId, workerId, expectedRevision, requestId, result, uncertain = false }) {
    const t = this._task(taskId, projectId);
    need(typeof requestId === 'string' && requestId.length > 0, 'INVALID_REQUEST_ID');
    const effectKey = `${projectId}:${requestId}`;
    // A request with an already-seen id returns its ORIGINAL outcome, even if
    // the task revision/state has since advanced. Different payload = conflict.
    if (this.effects.has(effectKey)) {
      const effect = this.effects.get(effectKey);
      need(effect.taskId === taskId && effect.workerId === workerId &&
        effect.uncertain === uncertain && JSON.stringify(effect.result) === JSON.stringify(result), 'REQUEST_ID_CONFLICT');
      return { duplicate: true, readbackRequired: effect.uncertain, task: clone(t) };
    }
    this._cas(t, expectedRevision);
    need(!this.stopped, 'STOPPED'); this._state(t, 'RUNNING');
    need(t.executorId === workerId, 'WORKER_MISMATCH');
    this.effects.set(effectKey, { taskId, workerId, uncertain, result: clone(result) });
    t.lastSubmitted = { requestId, result: clone(result), uncertain };
    if (uncertain) this._change(t, 'RUNNING', 'NEEDS_OWNER', { reason: 'UNKNOWN_WRITE_RESULT_CHECK_TARGET_FIRST' });
    else this._change(t, 'RUNNING', 'SUBMITTED', { role: 'Executor', requestId });
    return { duplicate: false, readbackRequired: uncertain, task: clone(t) };
  }
  readEffect(projectId, requestId) { return clone(this.effects.get(`${projectId}:${requestId}`) ?? null); }
  review({ taskId, projectId, reviewerId, expectedRevision, actualReadback, artifactSha256, scope, accept, defects = [] }) {
    const t = this._task(taskId, projectId); this._cas(t, expectedRevision);
    this._state(t, 'SUBMITTED');
    need(typeof reviewerId === 'string' && reviewerId !== t.executorId, 'REVIEW_NOT_SEPARATED');
    need(actualReadback === true && typeof artifactSha256 === 'string' && SHA256.test(artifactSha256) && typeof scope === 'string' && scope.length > 0, 'MISSING_REAL_EVIDENCE');
    need(typeof accept === 'boolean', 'INVALID_REVIEW');
    t.review = { reviewerId, artifactSha256, scope, accept, defects: clone(defects), attempt: t.attempt };
    this._change(t, 'SUBMITTED', 'REVIEWING', { role: 'Reviewer' });
    if (accept) this._change(t, 'REVIEWING', 'REVIEW_PASSED', { scope });
    else if (t.repairCycles >= this.maxRepairCycles) this._change(t, 'REVIEWING', 'NEEDS_OWNER', { reason: 'REPAIR_LIMIT' });
    else this._change(t, 'REVIEWING', 'NEEDS_REVISION', { defects });
    return clone(t);
  }
  repair({ taskId, projectId, workerId, expectedRevision }) {
    const t = this._task(taskId, projectId); this._cas(t, expectedRevision); this._state(t, 'NEEDS_REVISION');
    need(!this.stopped && !this.paused, 'PAUSED_OR_STOPPED');
    t.repairCycles++; this._change(t, 'NEEDS_REVISION', 'REPAIRING', { role: 'Repairer', repairCycle: t.repairCycles });
    this._change(t, 'REPAIRING', 'RUNNING'); t.attempt++; t.executorId = workerId;
    return clone(t);
  }
  handoff({ taskId, projectId, expectedRevision, workbenchRecordId, workbenchRevision, readbackVerified }) {
    const t = this._task(taskId, projectId); this._cas(t, expectedRevision); this._state(t, 'REVIEW_PASSED');
    need(readbackVerified === true && typeof workbenchRecordId === 'string' && workbenchRecordId.length > 0 && Number.isInteger(workbenchRevision) && workbenchRevision >= 0, 'HANDOFF_NOT_VERIFIED');
    this._change(t, 'REVIEW_PASSED', 'HANDOFF_PENDING', { role: 'Handover' });
    t.handoff = { workbenchRecordId, workbenchRevision, verified: true, scope: t.review.scope };
    this._change(t, 'HANDOFF_PENDING', 'RECORDED', { role: 'Handover' }); return clone(t);
  }
  get(taskId, projectId) { return clone(this._task(taskId, projectId)); }
  snapshot() { return clone({ mode: this.mode, paused: this.paused, stopped: this.stopped, maxRepairCycles: this.maxRepairCycles, tasks: [...this.tasks], triggered: [...this.triggered], effects: [...this.effects], events: this.events, nextEventId: this.nextEventId }); }
  static restore(snapshot) {
    const x = new SandboxLoop({ maxRepairCycles: snapshot.maxRepairCycles });
    x.mode = snapshot.mode; x.paused = snapshot.paused; x.stopped = snapshot.stopped;
    x.tasks = new Map(clone(snapshot.tasks)); x.triggered = new Map(clone(snapshot.triggered));
    x.effects = new Map(clone(snapshot.effects)); x.events = clone(snapshot.events); x.nextEventId = snapshot.nextEventId;
    return x;
  }
}
