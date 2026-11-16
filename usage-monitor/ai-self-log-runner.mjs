// Call wrapper for AI tools: no official Supabase Usage API dependency.
// Caller injects its connected Workbench Side logger, readback, and tool action.
import {createAiActionEntry} from "./ai-operation-ledger.mjs";
import {aiPreflight,SIDE_PROJECT} from "../supabase/functions/_shared/lizhi-ai-side-ledger.mjs";
export class AiLogError extends Error {
  constructor(code){super(code);this.code=code;}
}
const title=entry=>"AI_USAGE "+entry.phase+" "+entry.eventId;
function toSide(entry){
  return {agent:"ChatGPT",project:SIDE_PROJECT,title:title(entry),
    done:JSON.stringify(entry),
    evidence:"AI 自行登記；數字為這次工具呼叫，不是 Supabase 官方計費。",
    next_step:entry.phase==="before"?"待執行並補登 after":""};
}
const validSave=(r,expected)=>r?.log?.id && r.log.title===expected;
const normalizeResult=r=>r?.result?.log?r.result:r?.log?r:r?.structuredContent?.log?r.structuredContent:null;
/**
 * @param {object} o
 * @param {(record:object)=>Promise<object>} o.writeSide
 * @param {()=>Promise<{logs:object[]}>} o.readSide
 * @param {()=>Promise<unknown>} o.invoke
 * @param {string} o.eventId
 * @param {string} o.at
 * @param {string} o.service
 * @param {string} o.feature
 * @param {string} o.taskLabel
 * @param {string} o.actionDetail
 * @param {string} o.operation
 * @param {object} [o.capSnapshot]
 * @param {boolean} [o.enforceCap]
 * @param {number} [o.plannedCalls]
 */
export async function runTrackedAiOperation({
  writeSide,readSide,invoke,eventId,at,service,feature,taskLabel,
  actionDetail,operation,capSnapshot=null,enforceCap=false,plannedCalls=1
}={}){
  if(typeof writeSide!=="function"||typeof readSide!=="function"||
     typeof invoke!=="function")throw new AiLogError("TRACKER_NOT_CONNECTED");
  if(enforceCap){
    const checked=aiPreflight(capSnapshot,plannedCalls);
    if(checked.decision!=="allow")throw new AiLogError("AI_ACTION_CAP_HOLD");
  }
  const common={eventId,at,service,feature,taskLabel,actionDetail,operation};
  const before=createAiActionEntry({...common,phase:"before",outcome:"planned"});
  const first=normalizeResult(await writeSide(toSide(before)));
  if(!validSave(first,title(before)))throw new AiLogError("BEFORE_LOG_WRITE_FAILED");
  let toolResult=null,outcome="unknown",toolError=false;
  try{
    toolResult=await invoke();outcome="success";
  }catch{outcome="failure";toolError=true;}
  const after=createAiActionEntry({...common,phase:"after",outcome,toolCalls:1});
  let second=null;
  try{second=normalizeResult(await writeSide(toSide(after)));}
  catch{return {executed:true,verified:false,outcome,reason:"AFTER_LOG_WRITE_FAILED",
    toolError,toolResult:toolError?null:toolResult};}
  if(!validSave(second,title(after)))
    return {executed:true,verified:false,outcome,reason:"AFTER_LOG_WRITE_FAILED",
      toolError,toolResult:toolError?null:toolResult};
  let logs;
  try{
    const result=await readSide();
    logs=(result?.result??result)?.logs;
  }catch{return {executed:true,verified:false,outcome,reason:"READBACK_FAILED",
    toolError,toolResult:toolError?null:toolResult};}
  if(!Array.isArray(logs))return {executed:true,verified:false,outcome,
    reason:"READBACK_FAILED",toolError,toolResult:toolError?null:toolResult};
  const matches=logs.filter(row=>row?.project===SIDE_PROJECT&&
    (row.title===title(before)||row.title===title(after)));
  const phases=new Set();
  for(const row of matches){
    try{
      const x=JSON.parse(row.done);
      if(x?.eventId===eventId&&x?.phase&&
        (row.title===title(x))&&x.service===service&&x.feature===feature&&
        x.taskLabel===taskLabel&&x.actionDetail===actionDetail&&
        x.operation===operation)
        phases.add(x.phase);
    }catch{}
  }
  if(!phases.has("before")||!phases.has("after"))
    return {executed:true,verified:false,outcome,reason:"READBACK_INCOMPLETE",
      toolError,toolResult:toolError?null:toolResult};
  return {executed:true,verified:true,outcome,reason:null,toolError,
    toolResult:toolError?null:toolResult,eventId,observedToolCalls:1};
}
