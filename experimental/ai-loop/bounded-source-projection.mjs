/**
 * v2.1 SOURCE-SIDE projection candidate. Intended to be called INSIDE the
 * already authenticated workbench Bridge, BEFORE the HTTP response is sent.
 * Not an endpoint, an authentication mechanism, an upstream deployment, or a
 * substitute for real owner + project authorization.
 */
export const PROJECT='61b88bec-9b3e-49e6-8780-d073fc816516';
export const MAX_PROJECTED_BYTES=65536;
export const MAX_TASKS=1000;
const STATES=new Set(['PLANNED','IN_PROGRESS','PASS','FAIL','BLOCKED','NOT_TESTED']);
const KEYS=new Set(['list_projects','get_project_context','get_project_handoff']);
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
const isRecord=x=>x&&typeof x==='object'&&!Array.isArray(x);
const fail=code=>{const e=new Error(code);e.code=code;throw e;};
const insist=(v,code='SOURCE_PROJECTION_INVALID')=>{if(!v)fail(code);};
const pid=x=>x?.projectId??x?.id;
const checkRevision=x=>Number.isSafeInteger(x)&&x>=0;
const exact=(record)=>{insist(isRecord(record)&&pid(record)===PROJECT,'SOURCE_SCOPE_INVALID');insist(checkRevision(record.revision));return record;};
const bytes=data=>new TextEncoder().encode(JSON.stringify(data)).length;

/**
 * Accepts ONLY trusted, freshly read workbench results.
 * Owner authentication and project visibility MUST be checked by its caller.
 * No pagination/truncation: too many tasks or a large allowlisted summary fails.
 */
export function projectSourceResult(tool,source,{projectId=PROJECT}={}){
 insist(KEYS.has(tool),'TOOL_DENIED');
 insist(projectId===PROJECT,'PROJECT_DENIED');
 let projected;
 if(tool==='list_projects'){
  insist(Array.isArray(source));
  const hits=source.filter(x=>pid(x)===PROJECT);
  insist(hits.length===1,'SOURCE_SCOPE_INVALID');
  const p=exact(hits[0]);
  projected=[{projectId:PROJECT,revision:p.revision}];
 }else if(tool==='get_project_context'){
  const p=exact(source);
  insist(Array.isArray(p.tasks)&&p.tasks.length<=MAX_TASKS,'SOURCE_PROJECTION_TOO_MANY_TASKS');
  const taskIds=new Set();
  const tasks=p.tasks.map(t=>{
   insist(isRecord(t)&&validId(t.id)&&validId(t.key)&&STATES.has(t.status));
   insist(!taskIds.has(t.id),'SOURCE_PROJECTION_DUPLICATE_TASK');
   taskIds.add(t.id);
   return {id:t.id,key:t.key,status:t.status};
  });
  projected={projectId:PROJECT,revision:p.revision,tasks};
 }else{
  const p=exact(source);
  insist(Array.isArray(p.unfinished)&&p.unfinished.length<=MAX_TASKS,'SOURCE_PROJECTION_TOO_MANY_TASKS');
  const workKey=p.lastWork?.key??null;
  insist(workKey===null||validId(workKey));
  projected={projectId:PROJECT,revision:p.revision,
   lastWork:workKey===null?null:{key:workKey},
   unfinishedCount:p.unfinished.length};
 }
 insist(bytes(projected)<=MAX_PROJECTED_BYTES,'SOURCE_PROJECTION_TOO_LARGE');
 return Object.freeze(projected);
}

/** Optional verification for the server-owned JSON response bytes. No source text returned. */
export function projectionReceipt(tool,result){
 insist(KEYS.has(tool),'TOOL_DENIED');
 insist(bytes(result)<=MAX_PROJECTED_BYTES,'SOURCE_PROJECTION_TOO_LARGE');
 insist((Array.isArray(result)?result.length===1:pid(result)===PROJECT),'SOURCE_SCOPE_INVALID');
 return Object.freeze({tool,projectId:PROJECT,projectedBytes:bytes(result),
  fullSourceVerified:false,liveBridgeInstalled:false,authorApproved:false});
}
