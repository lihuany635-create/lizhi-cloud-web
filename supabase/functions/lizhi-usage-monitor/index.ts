// 立之 Supabase 監控後端（開發候選）：僅本人唯讀快照。
// IMPORTANT: No deployment, database migration or external request instrumentation is implied.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {dispatchUsageMcp} from "../_shared/lizhi-usage-mcp-core.mjs";
import {verifySiteBridge} from "../_shared/lizhi-usage-mcp-bridge-auth.mjs";
const ORIGIN = "https://lihuany635-create.github.io";
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
async function owner(req: Request, forMcp = false): Promise<void> {
  if (!BASE || !SERVICE || !ANON || !OWNER_UID) throw new HttpError(503, "監控權限尚未設定。");
  if (forMcp && req.headers.has("x-lizhi-usage-bridge")) {
    const verified = await verifySiteBridge(req.headers, {
      secret:Deno.env.get("LIZHI_USAGE_MCP_BRIDGE_KEY"),
      actor:Deno.env.get("LIZHI_USAGE_MCP_ALLOWED_ACTOR")
    });
    if (!verified) throw new HttpError(403, "私人 Site 轉接驗證失敗。");
    return;
  }
  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw new HttpError(401, "缺少登入憑證。");
  const r = await fetch(BASE + "/auth/v1/user", {
    headers: { apikey: ANON, Authorization:"Bearer " + token }, signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new HttpError(401, "登入已失效。");
  const user = await r.json();
  if (!user?.id || user.id !== OWNER_UID) throw new HttpError(403, "只有本人可以查看監控紀錄。");
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
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:{
    ...allowOrigin,"Access-Control-Allow-Methods":"GET,OPTIONS",
    "Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Max-Age":"600"
  }});
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
      await owner(req,true);
      let rpcBody:unknown;
      try{rpcBody=await boundedJson(req);}catch(e){
        if(e instanceof SyntaxError)return json({jsonrpc:"2.0",id:null,
          error:{code:-32700,message:"Parse error"}},400);
        throw e;
      }
      const result=await dispatchUsageMcp(rpcBody,{snapshot:snapshotForMonth});
      return result===null?new Response(null,{status:202,headers:{...allowOrigin,"Cache-Control":"no-store"}}):json(result);
    }
    if(req.method!=="GET")throw new HttpError(405,"只允許唯讀查詢。");
    if(!u.pathname.endsWith("/snapshot"))throw new HttpError(404,"無此監控端點。");
    await owner(req);
    return json(await snapshotForMonth(u.searchParams.get("month")||""));
  } catch(e) {
    const code=e instanceof HttpError?e.status:503;
    return json({error:e instanceof HttpError?e.message:"監控讀取暫時失敗。"},code);
  }
});
