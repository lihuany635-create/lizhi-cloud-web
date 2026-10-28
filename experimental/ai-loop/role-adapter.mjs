/**
 * P3 sandbox-only role contract. No external AI calls, no MCP, no network.
 * Only injected, explicitly read-only mock handlers are supported.
 * Handover writes exclusively to an injected isolated test recorder.
 */
import { createHash } from 'node:crypto';

export class RoleContractError extends Error {
  constructor(code) { super(code); this.code = code; this.name = 'RoleContractError'; }
}
const need = (ok, code) => { if (!ok) throw new RoleContractError(code); };
const clone = x => structuredClone(x);
const sha = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const id = x => typeof x === 'string' && x.length > 0 && x.length <= 128;

export class ReadOnlySandboxAdapter {
  constructor(handlers) {
    need(handlers && typeof handlers === 'object', 'INVALID_HANDLERS');
    this.handlers = new Map();
    for (const [name, handler] of Object.entries(handlers)) {
      need(id(name) && handler?.readOnly === true && typeof handler.read === 'function', 'WRITE_TOOL_DENIED');
      this.handlers.set(name, handler.read);
    }
  }
  read({tool, projectId, args = {}}) {
    need(id(projectId) && this.handlers.has(tool), 'TOOL_NOT_ALLOWED');
    need(args && typeof args === 'object' && !Array.isArray(args), 'INVALID_ARGUMENTS');
    need(args.projectId === undefined || args.projectId === projectId, 'WRONG_PROJECT');
    const result = this.handlers.get(tool)(clone({...args, projectId}));
    need(result !== null && typeof result === 'object' && !Array.isArray(result), 'INVALID_READBACK');
    need(result.projectId === projectId, 'WRONG_PROJECT');
    return clone(result);
  }
}

/** P3 role orchestration: approval and role functions are deterministic mock code, NOT model agents. */
export class FiveRoleSandboxHarness {
  constructor({adapter, readContext, appendSandboxRecord, readSandboxRecord}) {
    need(adapter instanceof ReadOnlySandboxAdapter, 'INVALID_ADAPTER');
    for (const fn of [readContext, appendSandboxRecord, readSandboxRecord]) need(typeof fn === 'function', 'INVALID_PORT');
    this.adapter = adapter;
    this.readContext = readContext;
    this.appendSandboxRecord = appendSandboxRecord;
    this.readSandboxRecord = readSandboxRecord;
  }
  run({projectId, taskId, tool, args = {}, expected, riskTier = 'L0', paidApi = false, requestId}) {
    need(id(projectId) && id(taskId) && id(requestId), 'INVALID_ID');
    need(riskTier === 'L0' && paidApi === false, 'APPROVAL_REQUIRED');
    need(typeof expected === 'object' && expected !== null && !Array.isArray(expected), 'INVALID_CRITERIA');
    const receipts = [];
    const context = clone(this.readContext(projectId));
    need(context?.projectId === projectId && Number.isSafeInteger(context.revision), 'STALE_CONTEXT');
    receipts.push({role:'Planner',taskId,projectId,revision:context.revision});

    // EXECUTOR: only the declared read-only tool can be used.
    const observation = this.adapter.read({tool,projectId,args});
    receipts.push({role:'Executor',tool,resultHash:sha(observation)});

    // REVIEWER: make a NEW read, independent of Executor's claimed result.
    const fresh = this.adapter.read({tool,projectId,args});
    const actualHash = sha(fresh);
    const consistent = actualHash === sha(observation);
    const criterion = Object.entries(expected).every(([key,val]) => JSON.stringify(fresh[key]) === JSON.stringify(val));
    const accepted = consistent && criterion;
    receipts.push({role:'Reviewer',independentRead:true,accepted,actualHash,scope:'mock read-only'});
    if (!accepted) {
      const defects = !consistent ? ['SOURCE_CHANGED_BETWEEN_READS'] : ['CRITERIA_MISMATCH'];
      // REPAIRER may only propose in P3; no real or mock resource mutation permitted.
      receipts.push({role:'Repairer',action:'PROPOSE_ONLY',defects});
      return {status:'NEEDS_OWNER',authorApproved:false,recordId:null,defects,receipts};
    }

    const proposed = {projectId,taskId,requestId,revision:context.revision,
      status:'REVIEW_PASSED',scope:'mock read-only',resultHash:actualHash,authorApproved:false};
    const write = clone(this.appendSandboxRecord(clone(proposed)));
    need(id(write?.recordId), 'HANDOFF_WRITE_UNCONFIRMED');
    const saved = clone(this.readSandboxRecord({projectId,recordId:write.recordId}));
    need(saved && saved.recordId === write.recordId, 'HANDOFF_READBACK_MISSING');
    for (const [key,value] of Object.entries(proposed)) {
      need(JSON.stringify(saved[key]) === JSON.stringify(value), 'HANDOFF_READBACK_MISMATCH');
    }
    receipts.push({role:'Handover',sandboxReadback:true,recordId:write.recordId});
    return {status:'RECORDED',authorApproved:false,recordId:write.recordId,receipts};
  }
}
