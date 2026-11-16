// 立之 Supabase 監控後端（開發候選）：僅本人唯讀快照。
// IMPORTANT: No deployment, database migration or external request instrumentation is implied.
import {usageMonth} from "../_shared/lizhi-usage-mcp-core.mjs";
import {BRIDGE_SECRET_SHA256,BRIDGE_ACTOR_SHA256} from "../_shared/lizhi-usage-site-binding.mjs";
import {dispatchAiUsageMcp,stableUsageId} from "../_shared/lizhi-usage-ai-mcp.mjs";
import {validateEgressInput,parseEgressRows} from "../_shared/lizhi-uncached-egress.mjs";
import {authorizeUsage,UsageAccessError,TRUSTED_ORIGIN,originAllowed} from "../_shared/lizhi-usage-access.mjs";
import {SIDE_PROJECT,SIDE_AGENT,buildAiSideSnapshot,createBudgetRow}
  from "../_shared/lizhi-ai-side-ledger.mjs";
import {resolveUsageOwner,WORKBENCH_USAGE_PROJECT_ID}
  from "../_shared/lizhi-ai-owner-binding.mjs";
const ORIGIN = TRUSTED_ORIGIN;
const BASE = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OWNER_UID = Deno.env.get("LIZHI_USAGE_OWNER_UID") || "";
const BYTE_GB = 1000 ** 3;
const allowOrigin = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin" };
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...allowOrigin, "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff" }
  });
}
// Bind owner to the exact existing AI Workbench project, not to browser
// user_metadata or a client-supplied actor. No new secret or project is needed.
async function owner(req: Request, forMcp = false): Promise<string> {
  if (!forMcp && !req.headers.get("Authorization")?.toLowerCase().startsWith("bearer "))
    throw new UsageAccessError(401,"缺少登入憑證。");
  if (!BASE || !ANON || !SERVICE) throw new UsageAccessError(503,"監控後端環境尚未設定。");
  const linkedUid=await resolveUsageOwner({
    queryProject:()=>readRows("aiwb_projects?select=owner_id&id=eq."+
      WORKBENCH_USAGE_PROJECT_ID+"&limit=2"),
    ownerUid:OWNER_UID
  });
  await authorizeUsage(req,{
    forMcp,base:BASE,anon:ANON,service:SERVICE,ownerUid:linkedUid,
    bridgeSecret:Deno.env.get("LIZHI_USAGE_MCP_BRIDGE_KEY"),
    bridgeActor:Deno.env.get("LIZHI_USAGE_MCP_ALLOWED_ACTOR"),
    bridgeSecretDigest:BRIDGE_SECRET_SHA256,bridgeActorDigest:BRIDGE_ACTOR_SHA256
  });
  return linkedUid;
}
async function readRows(path: string): Promise<Record<string, any>[]> {
  const r=await fetch(BASE + "/rest/v1/" + path, {
    headers:{ apikey:SERVICE, Authorization:"Bearer " + SERVICE, Accept:"application/json" },
    signal:AbortSignal.timeout(10000)
  });
  if (!r.ok) throw new HttpError(503, "監控資料表讀取失敗（" + r.status + "）。");
  const value=await r.json();
  if (!Array.isArray(value)) throw new HttpError(503, "資料表回應格式錯誤。");
  return value;
}
function totals(rows: Record<string,any>[]) {
  const zero=()=>({request_count:0,request_bytes_known:0,response_bytes_known:0,
    unknown_request_count:0,unknown_response_count:0,blocked_count:0,throttled_count:0,error_count:0});
  const all=zero();
  const per=new Map<string,ReturnType<typeof zero>>();
  for(const r of rows){
    const key=String(r.source || "unknown").slice(0,80);
    const target=per.get(key)||zero();
    for(const field of Object.keys(all) as (keyof typeof all)[]) {
      const amount=Number(r[field] || 0);
      if (!Number.isSafeInteger(amount) || amount<0) throw new HttpError(503,"監控計數格式錯誤。");
      target[field]+=amount; all[field]+=amount;
    }
    per.set(key,target);
  }
  return {
    summary:all,
    sources:[...per.entries()].map(([source,s])=>({source,...s})).sort((a,b)=>b.request_count-a.request_count)
  };
}
function quotaCards(s: ReturnType<typeof totals>["summary"]) {
  return [
    {key:"edge_invocations",label:"Edge Invocations（已接入下限）",limit:500000,unit:" 次",observed:s.request_count,official_used:null},
    {key:"egress",label:"Egress（已知回應大小）",limit:5*BYTE_GB,unit:" B",observed:s.response_bytes_known,official_used:null},
    {key:"cached_egress",label:"Cached Egress",limit:5*BYTE_GB,unit:" B",observed:null,official_used:null},
    {key:"db_storage",label:"Database Size",limit:500*1000*1000,unit:" B",observed:null,official_used:null},
    {key:"storage",label:"Storage Size",limit:BYTE_GB,unit:" B",observed:null,official_used:null},
    {key:"realtime_messages",label:"Realtime Messages",limit:2000000,unit:" 則",observed:null,official_used:null}
  ];
}
async function snapshotForMonth(month: string) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400,"month 必須是 YYYY-MM。");
  const start=month+"-01T00:00:00Z";
  const next=new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5)), 1)).toISOString().slice(0,10)+"T00:00:00Z";
  const dayStart=start.slice(0,10),dayEnd=next.slice(0,10);
  const dailyPath="lz_usage_daily?select=source,request_count,request_bytes_known,response_bytes_known,unknown_request_count,unknown_response_count,blocked_count,throttled_count,error_count&and="+encodeURIComponent("(day.gte."+dayStart+",day.lt."+dayEnd+")")+"&limit=5000";
  const eventsPath="lz_usage_events?select=occurred_at,source,route,status_code,request_bytes,response_bytes,duration_ms,decision&and="+encodeURIComponent("(occurred_at.gte."+start+",occurred_at.lt."+next+")")+"&order=occurred_at.desc&limit=100";
  const [daily,events]=await Promise.all([readRows(dailyPath),readRows(eventsPath)]);
  const t=totals(daily);
  return {month,coverage:"instrumented_only",source:"app_telemetry_not_official_billing",
    summary:t.summary,sources:t.sources,quotas:quotaCards(t.summary),events,
    note:"只有已接入服務的觀測下限。官方帳務尚未同步，實際剩餘額度未知。"};
}
// The AI itself wrote these entries to EXISTING Side logs. Reading them does
// not depend on the Supabase official Usage/Management API.
function aiMonthBounds(month: string) {
  if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new HttpError(400,"month 必須是 YYYY-MM。");
  const y=Number(month.slice(0,4)),m=Number(month.slice(5));
  // Include an extra day on both sides for delayed before/after delivery,
  // then filter the payload's original at time in Asia/Taipei.
  return [
    new Date(Date.UTC(y,m-1,1)-48*3600000).toISOString(),
    new Date(Date.UTC(y,m,1)+24*3600000).toISOString()
  ];
}
async function aiLedgerSnapshot(month:string, uid:string, excludeEventId?:string) {
  aiMonthBounds(month); // validate; late after/backfill rows may be created in later months.
  const q=new URLSearchParams({select:"agent,project,title,done,created_at",
    owner_id:"eq."+uid,project:"eq."+SIDE_PROJECT,agent:"eq."+SIDE_AGENT,
    title:"like.AI_USAGE *",order:"created_at.desc,id.desc"});

  const rows:Record<string,any>[]=[];
  const pageSize=500;
  let moreRows=false;
  for(let offset=0;offset<=5000;offset+=pageSize){
    q.set("limit",String(offset===5000?1:pageSize));
    q.set("offset",String(offset));
    const page=await readRows("aiwb_side_logs?"+q.toString());
    if(offset===5000){moreRows=page.length>0;break;}
    rows.push(...page);
    if(page.length<pageSize)break;
  }
  const bq=new URLSearchParams({select:"agent,project,title,done,created_at",
    owner_id:"eq."+uid,project:"eq."+SIDE_PROJECT,agent:"eq."+SIDE_AGENT,
    title:"eq.AI_USAGE_BUDGET "+month,order:"created_at.desc",limit:"10"});
  const budgetRows=await readRows("aiwb_side_logs?"+bq.toString());
  const filtered=rows.filter(r=>{
    if(excludeEventId&&r.title.endsWith(" "+excludeEventId))return false;
    try {const at=JSON.parse(r.done).at;
      if(typeof at==="string"&&Number.isFinite(Date.parse(at)))return usageMonth(new Date(at))===month;
    }catch{/* Keep invalid records visible so admission fails closed. */}
    return true;
  });
  const snap=buildAiSideSnapshot({rows:filtered.slice(0,5000),budgets:budgetRows,month,moreRows});
  return snap;
}
// The uid is returned ONLY by owner(req); never read it from MCP input.
function aiMcpStore(uid:string) {
  return {
    snapshot:(month:string,excludeEventId?:string)=>aiLedgerSnapshot(month,uid,excludeEventId),
    event:async(eventId:string)=>{
      const q=new URLSearchParams({select:"id,agent,project,title,done,created_at",
        owner_id:"eq."+uid,project:"eq."+SIDE_PROJECT,agent:"eq."+SIDE_AGENT,
        or:"(title.eq.AI_USAGE before "+eventId+",title.eq.AI_USAGE after "+eventId+")",
        order:"created_at.asc",limit:"10"});
      const rows=await readRows("aiwb_side_logs?"+q.toString());
      if(rows.length===10)throw new HttpError(503,"事件記錄過多，需核對。");
      return rows;
    },
    append:async(record:Record<string,unknown>)=>{
      const r=await fetch(BASE+"/rest/v1/aiwb_side_logs",{
        method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,
          "Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({...record,owner_id:uid}),signal:AbortSignal.timeout(10000),redirect:"error"
      });
      // A PK conflict is a retry candidate, NEVER an upsert. The caller must
      // read the original row and compare its complete payload before success.
      if(!r.ok&&r.status!==409)throw new HttpError(503,"AI 記帳保存失敗。");
    }
  };
}
async function addAiBudget(req:Request,uid:string) {
  if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new HttpError(415,"需要 JSON 內容。");
  const raw=await boundedJson(req,512);
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new HttpError(400,"預算格式不正確。");
  const body=raw as Record<string,unknown>;
  const month=body.month;
  if(typeof month!=="string")throw new HttpError(400,"月份無效。");
  const record=createBudgetRow(month,body.cap,new Date().toISOString());
  const response=await fetch(BASE+"/rest/v1/aiwb_side_logs",{
    method:"POST",
    headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,
      "Content-Type":"application/json",Prefer:"return=representation"},
    body:JSON.stringify({owner_id:uid,...record}),
    signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)throw new HttpError(503,"AI 自訂上限保存失敗。");
  const saved=await response.json();
  if(!Array.isArray(saved)||saved.length!==1||!saved[0]?.id)
    throw new HttpError(503,"自訂上限沒有取得寫入回應。");
  return {saved:true,month,monthlyToolCap:body.cap};
}

async function boundedJson(req: Request, limit=32768): Promise<unknown> {
  const claimed=Number(req.headers.get("content-length")||0);
  if (Number.isFinite(claimed) && claimed>limit) throw new HttpError(413,"MCP 請求過大。");
  const reader=req.body?.getReader();
  if(!reader) throw new HttpError(400,"缺少 MCP JSON 本文。");
  const chunks:Uint8Array[]=[];
  let length=0;
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>limit)throw new HttpError(413,"MCP 請求過大。");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const all=new Uint8Array(length);let offset=0;
  for(const item of chunks){all.set(item,offset);offset+=item.byteLength;}
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(all));
}
// Organization-level, user-transcribed Usage snapshots; no official billing API access.
async function egressHistory(month:string,uid:string) {
  if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new HttpError(400,"月份格式不正確。");
  const q=new URLSearchParams({
    select:"id,done,created_at",owner_id:"eq."+uid,
    project:"eq."+SIDE_PROJECT,
    title:"like.EGRESS_USAGE "+month+" *",
    order:"created_at.desc",limit:"501"
  });
  const rows=await readRows("aiwb_side_logs?"+q.toString());
  return parseEgressRows(rows,month);
}
async function saveEgress(value:unknown,uid:string) {
  let snap;
  try { snap=validateEgressInput(value); }
  catch { throw new HttpError(400,"官方 Usage 讀數格式錯誤。"); }
  const key=JSON.stringify([uid,snap.month,snap.observedAt,snap.totalBytes,snap.cachedBytes]);
  const id=await stableUsageId('egress:'+key);
  const record={id,owner_id:uid,agent:"Usage Monitor",project:SIDE_PROJECT,
    title:"EGRESS_USAGE "+snap.month+" "+id,done:JSON.stringify(snap)};
  const result=await fetch(BASE+"/rest/v1/aiwb_side_logs",{
    method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,
      "Content-Type":"application/json",Prefer:"return=representation"},
    body:JSON.stringify(record),signal:AbortSignal.timeout(10000),redirect:"manual"
  });
  if(!result.ok && result.status!==409)throw new HttpError(503,"用量快照保存失敗。");
  const query=new URLSearchParams({select:"id,done",id:"eq."+id,owner_id:"eq."+uid,project:"eq."+SIDE_PROJECT});
  const rows=await readRows("aiwb_side_logs?"+query.toString());
  if(rows.length!==1||rows[0].id!==id||rows[0].done!==record.done)
    throw new HttpError(503,"快照保存後讀回核對失敗。");
  return {saved:true,verified:true,id,replayed:result.status===409,
    source:snap.source,providerVerified:false,reading:snap};
}
async function egressRecord(req:Request,uid:string) {
  if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new HttpError(415,"需要 JSON 內容。");
  return await saveEgress(await boundedJson(req,1024),uid);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    if (!originAllowed(req.headers)) return json({error:"來源不允許。"},403);
    return new Response(null,{status:204,headers:{
    ...allowOrigin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Max-Age":"600"
  }});
  }
  try {
    const origin=req.headers.get("Origin");
    if (origin && origin !== ORIGIN) throw new HttpError(403,"來源不允許。");
    const u=new URL(req.url);
    if(u.pathname.endsWith("/mcp")){
      if(req.method!=="POST")throw new HttpError(405,"MCP 僅接受 POST。");
      if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
        throw new HttpError(415,"MCP 必須使用 application/json。");
      const accept=req.headers.get("accept")||"";
      if(!accept.includes("application/json"))throw new HttpError(406,"MCP client 必須接受 application/json。");
      const uid=await owner(req,true);
      let rpcBody:unknown;
      try{rpcBody=await boundedJson(req);}catch(e){
        if(e instanceof SyntaxError)return json({jsonrpc:"2.0",id:null,
          error:{code:-32700,message:"Parse error"}},400);
        throw e;
      }
      const result=await dispatchAiUsageMcp(rpcBody,{store:aiMcpStore(uid),
        siteConnected:req.headers.has("x-lizhi-usage-bridge"),
        egress:{history:(month:string)=>egressHistory(month,uid),record:(value:unknown)=>saveEgress(value,uid)}});
      return result===null?new Response(null,{status:202,headers:{...allowOrigin,"Cache-Control":"no-store"}}):json(result);
    }
    if(u.pathname.endsWith("/egress-history")) {
      if(req.method!=="GET")throw new HttpError(405,"只允許 GET。");
      const uid=await owner(req);
      return json(await egressHistory(u.searchParams.get("month")||"",uid));
    }
    if(u.pathname.endsWith("/egress-record")) {
      if(req.method!=="POST")throw new HttpError(405,"只允許 POST。");
      const uid=await owner(req);
      return json(await egressRecord(req,uid));
    }
    if(u.pathname.endsWith("/ai-ledger")) {
      if(req.method!=="GET")throw new HttpError(405,"AI 紀錄只允許 GET。");
      const uid=await owner(req);
      return json(await aiLedgerSnapshot(u.searchParams.get("month")||"",uid));
    }
    if(u.pathname.endsWith("/ai-budget")) {
      if(req.method!=="POST")throw new HttpError(405,"自訂上限只允許 POST。");
      const uid=await owner(req);
      return json(await addAiBudget(req,uid));
    }
    if(req.method!=="GET")throw new HttpError(405,"只允許唯讀查詢。");
    if(!u.pathname.endsWith("/snapshot"))throw new HttpError(404,"無此監控端點。");
    await owner(req);
    return json(await snapshotForMonth(u.searchParams.get("month")||""));
  } catch(e) {
    const code=e instanceof HttpError||e instanceof UsageAccessError?e.status:503;
    return json({error:e instanceof HttpError||e instanceof UsageAccessError?e.message:"監控讀取暫時失敗。"},code);
  }
});
