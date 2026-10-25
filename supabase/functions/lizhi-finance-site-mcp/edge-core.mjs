import {FINANCE_SITE_TOOLS,validateFinanceSiteTool,FINANCE_UI_SITE_TOOLS,validateFinanceUiTool} from "./site-contract.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX=/^[0-9a-f]{64,128}$/i;
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEAD={"Cache-Control":"private, no-store","Pragma":"no-cache","X-Content-Type-Options":"nosniff"};
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const json=(value,status=200)=>Response.json(value,{status,headers:HEAD});
const rpc=(id,result)=>json({jsonrpc:"2.0",id,result});
const err=(id,code,message)=>json({jsonrpc:"2.0",id,error:{code,message}});
const fail=(id,code)=>rpc(id,{isError:true,content:[{type:"text",text:code}]});
const success=(id,value)=>rpc(id,{isError:false,content:[{type:"text",text:JSON.stringify(value)}],structuredContent:value});
const safeInt=n=>typeof n==="number"&&Number.isSafeInteger(n);
const pos=n=>safeInt(n)&&n>0?n:0;
const str=n=>typeof n==="string"?n.slice(0,100):"";
const id=n=>typeof n==="string"?n:"";
const active=v=>v.archived!==true&&!v.deletedAt;
async function equal(a,b) {
  if(!HEX.test(a)||!HEX.test(b))return false;
  const te=new TextEncoder();
  const x=new Uint8Array(await crypto.subtle.digest("SHA-256",te.encode(a)));
  const y=new Uint8Array(await crypto.subtle.digest("SHA-256",te.encode(b)));
  let delta=0;for(let i=0;i<x.length;i++)delta|=x[i]^y[i];
  return delta===0;
}
async function bodyJson(req,max=16384) {
  const declared=req.headers.get("content-length");
  if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>max))throw Error("BODY_TOO_LARGE");
  if(!req.body)throw Error("EMPTY_BODY");
  const reader=req.body.getReader(),parts=[];let bytes=0;
  try {
    for(;;) {
      const {done,value}=await reader.read();if(done)break;
      if(!value)continue;bytes+=value.byteLength;
      if(bytes>max)throw Error("BODY_TOO_LARGE");
      parts.push(value);
    }
  } finally {try{await reader.cancel()}catch{}}
  const buffer=new Uint8Array(bytes);let offset=0;
  for(const part of parts){buffer.set(part,offset);offset+=part.byteLength}
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buffer));
}
async function snapshot(db,owner) {
  const rows=[],page=250,max=5000;
  for(let offset=0;offset<max;offset+=page) {
    const {data,error}=await db.from("lizhi_finance_records")
      .select("kind,id,payload,updated_at")
      .eq("user_id",owner).is("deleted_at",null)
      .order("kind",{ascending:true}).order("id",{ascending:true})
      .range(offset,offset+page-1);
    if(error||!Array.isArray(data))throw Error("CLOUD_READ_FAILED");
    rows.push(...data);
    if(data.length<page)break;
    if(offset+page>=max)throw Error("CLOUD_ROW_LIMIT_EXCEEDED");
  }
  const out={accounts:[],creditCards:[],categories:[],transactions:[],latest_record_updated_at:null};
  const types=new Set(["accounts","creditCards","categories","transactions"]);
  for(const r of rows) {
    if(typeof r.updated_at==="string"&&(!out.latest_record_updated_at||r.updated_at>out.latest_record_updated_at))
      out.latest_record_updated_at=r.updated_at;
    if(!types.has(r.kind))continue;
    if(!obj(r.payload))throw Error("INVALID_RECORD");
    const v={...r.payload,id:r.id};
    if(!v.deletedAt)out[r.kind].push(v);
  }
  if(out.accounts.some(a=>!safeInt(a.initialBalance)))throw Error("INVALID_ACCOUNT");
  if(out.transactions.some(t=>!safeInt(t.amount)||t.amount<=0||typeof t.date!=="string"))
    throw Error("INVALID_TRANSACTION");
  return out;
}
function balance(a,txs) {
  let sum=a.initialBalance;const who=id(a.id);
  for(const t of txs){
    const v=pos(t.amount);
    if(t.type==="income"&&t.accountId===who)sum+=v;
    if(t.type==="expense"&&t.accountId===who)sum-=v;
    if(t.type==="transfer"&&t.fromAccountId===who)sum-=v;
    if(t.type==="transfer"&&t.toAccountId===who)sum+=v;
    if(t.type==="credit_card_payment"&&(t.fromAccountId===who||t.accountId===who))sum-=v;
  }
  if(!safeInt(sum))throw Error("OVERFLOW");
  return sum;
}
function due(card,txs) {
  let sum=0;for(const t of txs){
    if(t.creditCardId!==card)continue;
    if(t.type==="credit_card_purchase")sum+=pos(t.amount);
    if(t.type==="credit_card_payment")sum-=pos(t.amount);
  }
  if(!safeInt(sum))throw Error("OVERFLOW");
  return Math.max(0,sum);
}
function calculate(name,args,b) {
  if(name==="finance_status")return {counts:{accounts:b.accounts.length,cards:b.creditCards.length,categories:b.categories.length,transactions:b.transactions.length}};
  if(name==="finance_accounts")return {accounts:b.accounts.filter(active).map(a=>({
    id:id(a.id),name:str(a.name),currency:str(a.currency||"TWD"),balance:balance(a,b.transactions)
  }))};
  if(name==="finance_cards")return {credit_cards:b.creditCards.filter(active).map(c=>({
    id:id(c.id),name:str(c.name),outstanding:due(id(c.id),b.transactions)
  }))};
  if(name==="finance_month_summary") {
    const txs=b.transactions.filter(t=>t.date.startsWith(args.month));
    let income=0,ordinary=0,card=0,payment=0;
    const by=new Map(),labels=new Map(b.categories.map(c=>[id(c.id),str(c.name)]));
    for(const t of txs){
      const v=pos(t.amount);
      if(t.type==="income")income+=v;
      if(t.type==="expense")ordinary+=v;
      if(t.type==="credit_card_purchase")card+=v;
      if(t.type==="credit_card_payment")payment+=v;
      if(t.type==="expense"||t.type==="credit_card_purchase")by.set(id(t.categoryId),(by.get(id(t.categoryId))||0)+v);
    }
    if([income,ordinary,card,payment,...by.values()].some(x=>!safeInt(x))||!safeInt(income-ordinary-card))
      throw Error("OVERFLOW");
    return {month:args.month,income,expense:ordinary+card,ordinary_expense:ordinary,credit_card_purchases:card,
      credit_card_payments:payment,income_minus_expense:income-ordinary-card,
      by_category:[...by].map(([k,v])=>({category_id:k,category:labels.get(k)||"未分類",amount:v}))
        .sort((a,c)=>c.amount-a.amount)};
  }
  const names=new Map([...b.accounts,...b.creditCards,...b.categories].map(e=>[id(e.id),str(e.name)]));
  return {transactions:b.transactions.filter(t=>!args.month||t.date.startsWith(args.month))
    .sort((a,c)=>String(c.date).localeCompare(String(a.date))||String(c.createdAt||"").localeCompare(String(a.createdAt||"")))
    .slice(0,args.limit).map(t=>({
      id:id(t.id),date:str(t.date),type:str(t.type),amount:t.amount,
      category:names.get(id(t.categoryId))||null,
      account:names.get(id(t.accountId||t.fromAccountId))||null,
      to_account:names.get(id(t.toAccountId))||null,
      credit_card:names.get(id(t.creditCardId))||null
    }))};
}
/** Dedicated server-to-server Site gateway; never expose the bearer to the browser. */
export async function handleFinanceSiteRequest(req,{db,token,ownerUid,verifyBearer=equal}) {
  if(req.headers.has("origin"))return json({error:"BROWSER_ORIGIN_NOT_ALLOWED"},403);
  if(req.method!=="POST")return json({error:"POST_ONLY"},405);
  if(!HEX.test(token||"")||!UUID.test(ownerUid||"")||!db?.from)
    return json({error:"FINANCE_SITE_NOT_CONFIGURED"},503);
  const bearer=req.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer ")||!await verifyBearer(bearer.slice(7),token))
    return json({error:"FINANCE_SITE_BEARER_REQUIRED"},401);
  let frame;
  try{frame=await bodyJson(req)}
  catch(e){return e instanceof Error&&e.message==="BODY_TOO_LARGE"
    ?json({error:"FINANCE_BODY_TOO_LARGE"},413):err(null,-32700,"Malformed bounded JSON")}
  const requestId=typeof frame?.id==="string"||typeof frame?.id==="number"?frame.id:null;
  if(!obj(frame)||frame.jsonrpc!=="2.0"||typeof frame.method!=="string")
    return err(requestId,-32600,"Invalid JSON-RPC");
  if(frame.method==="notifications/initialized"||requestId===null)
    return new Response(null,{status:202,headers:HEAD});
  if(frame.method==="initialize")return rpc(requestId,{protocolVersion:"2025-06-18",
    capabilities:{tools:{listChanged:false}},serverInfo:{name:"lizhi-finance-private-site",version:"0.1.0"}});
  if(frame.method==="ping")return rpc(requestId,{});
  if(frame.method==="tools/list")return rpc(requestId,{tools:[...FINANCE_SITE_TOOLS,...FINANCE_UI_SITE_TOOLS]});
  if(frame.method!=="tools/call")return err(requestId,-32601,"Method unavailable");
  const p=frame.params;
  if(!obj(p)||typeof p.name!=="string")return err(requestId,-32602,"Invalid tool call");
  if(FINANCE_UI_SITE_TOOLS.some(t=>t.name===p.name)) {
    const v=validateFinanceUiTool(p.name,p.arguments??{});
    if(!v.ok)return fail(requestId,v.code);
    if(!db.rpc)return fail(requestId,"FINANCE_UI_SERVICE_NOT_READY");
    try {
      if(p.name==="finance_ui_sessions") {
        const {data,error}=await db.rpc("lizhi_finance_ui_site_sessions",{p_owner:ownerUid});
        if(error||!Array.isArray(data))return fail(requestId,"FINANCE_UI_SESSIONS_UNAVAILABLE");
        return success(requestId,{sessions:data,engine:"authorized-open-browser",
          note:"必須先在理財管家原網站按『允許理財 AI 操作』，且保持網頁開啟。"});
      }
      if(p.name==="finance_ui_job") {
        const {data,error}=await db.rpc("lizhi_finance_ui_site_job",{p_owner:ownerUid,p_job:v.args.job_id});
        if(error)return fail(requestId,"FINANCE_UI_JOB_UNAVAILABLE");
        if(!data)return fail(requestId,"FINANCE_UI_JOB_NOT_FOUND");
        return success(requestId,{job:data,completed:data.state==="succeeded",
          note:"UI 事件成功送出不等於帳本變更已完成。"});
      }
      const {data,error}=await db.rpc("lizhi_finance_ui_site_enqueue",{
        p_owner:ownerUid,p_session:v.args.session_id,p_request_id:v.args.request_id,
        p_operation:v.args.operation,p_params:v.args.params
      });
      if(error||typeof data!=="string"||!UUID_RE.test(data))
        return fail(requestId,"FINANCE_UI_NOT_AUTHORIZED_ONLINE_OR_ENQUEUE_FAILED");
      return success(requestId,{queued:true,completed:false,job_id:data,automaticRetryAllowed:false,
        note:"只入列，呼叫 finance_ui_job 查詢；逾時不得改 request_id 重試操作。"});
    }catch{return fail(requestId,"FINANCE_UI_UPSTREAM_UNAVAILABLE")}
  }
  const validated=validateFinanceSiteTool(p.name,p.arguments??{});
  if(!validated.ok)return fail(requestId,validated.code);
  try{
    const b=await snapshot(db,ownerUid);
    const result=calculate(p.name,validated.args,b);
    return success(requestId,{...result,source:"supabase_synced_snapshot",
      latest_record_updated_at:b.latest_record_updated_at,snapshot_read_at:new Date().toISOString(),
      read_only:true,notice:"僅查詢雲端同步快照，不含未同步的本機資料；最近紀錄修改時間不代表同步完成時間。"});
  }catch{return fail(requestId,"FINANCE_CLOUD_SNAPSHOT_UNAVAILABLE")}
}
