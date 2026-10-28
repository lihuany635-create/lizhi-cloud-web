/**
 * P3 real MCP *response* contract with server-injected read-only call capability.
 * Offline-friendly: no credentials, network, autonomous worker, or write transport.
 * The owner-scoped ChatGPT host (NOT project documents or callers) must inject invoke.
 */
import {createHash} from 'node:crypto';

const READ_TOOLS = Object.freeze(['list_projects','get_project_context','get_project_handoff']);
const cleanId = s => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(s);
const hash = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const check = (condition, code) => {if (!condition) throw new WorkbenchReadError(code);};
const clone = x => structuredClone(x);

export class WorkbenchReadError extends Error {
  constructor(code) {super(code);this.name='WorkbenchReadError';this.code=code;}
}
function decoded(raw) {
  // Host MCP calls can supply parsed JSON or a text/content envelope.
  check(raw!==null && typeof raw==='object','READ_RESULT_INVALID');
  check(raw.isError !== true,'MCP_READ_ERROR');
  let payload=raw;
  if (typeof raw.text==='string') payload=raw.text;
  else if (typeof raw.result?.content==='string') payload=raw.result.content;
  else if (Array.isArray(raw.content)) {
    const entries=raw.content.filter(x=>x?.type==='text' && typeof x.text==='string');
    check(entries.length===1,'READ_RESULT_INVALID');
    payload=entries[0].text;
  }
  if (typeof payload==='string') {
    try {payload=JSON.parse(payload);} catch {throw new WorkbenchReadError('READ_JSON_INVALID');}
  }
  check(payload!==null && typeof payload==='object' && !Array.isArray(payload),'READ_RESULT_INVALID');
  check(!('error' in payload) && payload.ok!==false,'MCP_READ_ERROR');
  return payload;
}
function projectIdOf(x) {return x?.projectId ?? x?.id;}
function metadata(projectId, context, handoff) {
  check(context && typeof context==='object' && handoff && typeof handoff==='object','READ_RESULT_INVALID');
  check(projectIdOf(context)===projectId && projectIdOf(handoff)===projectId,'CROSS_PROJECT_RESULT');
  check(Number.isSafeInteger(context.revision) && context.revision>=0 && context.revision===handoff.revision,'REVISION_CHANGED');
  check(Array.isArray(context.tasks) && Array.isArray(handoff.unfinished),'READ_RESULT_INVALID');
  const tasks=context.tasks.map(t=> {
    check(cleanId(t.id) && cleanId(t.key) && typeof t.status==='string','READ_RESULT_INVALID');
    return {id:t.id,key:t.key,status:t.status};
  });
  check(new Set(tasks.map(t=>t.id)).size===tasks.length,'DUPLICATE_TASK');
  const lastWork=handoff.lastWork?.key ?? null;
  check(lastWork===null || cleanId(lastWork),'READ_RESULT_INVALID');
  // Never copy source texts, artifact URLs, signed links, secrets, or model prompts.
  return {projectId,revision:context.revision,tasks,lastWork};
}

export class WorkbenchReadOnlyBridge {
  constructor({invoke,allowedProjectIds}) {
    check(typeof invoke==='function','INVALID_CAPABILITY');
    check(Array.isArray(allowedProjectIds) && allowedProjectIds.length>0 && allowedProjectIds.every(cleanId),'INVALID_SCOPE');
    this.invoke=invoke;this.allowed=new Set(allowedProjectIds);
    this.audit=[];
  }
  async _read(name,args) {
    check(READ_TOOLS.includes(name),'WRITE_TOOL_DENIED');
    // This is a capability supplied by a trusted host, never an arbitrary tool name from a document.
    let raw;
    try {raw=await this.invoke(name,clone(args));}
    catch {throw new WorkbenchReadError('MCP_READ_ERROR');}
    const result=name==='list_projects'?raw:decoded(raw);
    if (name==='list_projects') {
      if (Array.isArray(result)) return clone(result);
      if (typeof result?.text==='string') {
        try {return JSON.parse(result.text);}catch{throw new WorkbenchReadError('READ_JSON_INVALID');}
      }
      if (Array.isArray(result?.result)) return clone(result.result);
      throw new WorkbenchReadError('READ_RESULT_INVALID');
    }
    return result;
  }
  async snapshot(projectId) {
    check(cleanId(projectId) && this.allowed.has(projectId),'PROJECT_NOT_ALLOWED');
    const all=await this._read('list_projects',{});
    check(Array.isArray(all),'READ_RESULT_INVALID');
    const item=all.find(x=>projectIdOf(x)===projectId);
    check(!!item,'PROJECT_NOT_VISIBLE');
    const context=await this._read('get_project_context',{projectId});
    const handoff=await this._read('get_project_handoff',{projectId});
    const brief=metadata(projectId,context,handoff);
    check(item.revision===brief.revision,'REVISION_CHANGED');
    const receipt={...brief,role:'Planner',readTools:[...READ_TOOLS],sourceHash:hash(brief),
      policy:'LIZHI-AI-BOOT/1.0.0',authorApproved:false};
    this.audit.push({kind:'READ',projectId,revision:brief.revision,sourceHash:receipt.sourceHash});
    return clone(receipt);
  }
  async reviewFresh(receipt) {
    check(receipt && this.allowed.has(receipt.projectId),'PROJECT_NOT_ALLOWED');
    check(Number.isSafeInteger(receipt.revision) && typeof receipt.sourceHash==='string','READ_RESULT_INVALID');
    // Reviewer must make another live tool read, not copy Executor's own report.
    const context=await this._read('get_project_context',{projectId:receipt.projectId});
    const handoff=await this._read('get_project_handoff',{projectId:receipt.projectId});
    const now=metadata(receipt.projectId,context,handoff);
    const digest=hash(now);
    check(now.revision===receipt.revision && digest===receipt.sourceHash,'REVIEW_SOURCE_CHANGED');
    this.audit.push({kind:'REVIEW',projectId:now.projectId,revision:now.revision,sourceHash:digest});
    return {projectId:now.projectId,revision:now.revision,result:'READBACK_MATCH',freshRead:true,
      authorApproved:false,scope:'real MCP read-only response contract'};
  }
  handoffDraft(receipt,review) {
    check(receipt?.projectId===review?.projectId && receipt?.revision===review?.revision &&
      review?.result==='READBACK_MATCH' && review?.freshRead===true,'HANDOFF_NOT_VERIFIED');
    // Deliberately no append_work_record or other write tool.
    return {projectId:receipt.projectId,revision:receipt.revision,status:'NOT_TESTED',
      mode:'document',authorApproved:false,kind:'LOCAL_DRAFT_ONLY',
      summary:'MCP project context and handoff were read and independently rechecked in this session',
      limitations:'No AI model inference, no server-side persistent worker, no workbench write performed'};
  }
  allowedTools() {return [...READ_TOOLS];}
}
