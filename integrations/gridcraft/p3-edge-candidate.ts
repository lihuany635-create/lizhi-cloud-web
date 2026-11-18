// GridCraft P3 SUPABASE EDGE CANDIDATE - NOT DEPLOYED
// After explicit owner approval only: copy to EXISTING Supabase project as
// /functions/v1/lizhi-gridcraft-bridge. Never create a new DB or Site.
// DEFAULT DENY: GRIDCRAFT_P3_ENABLED must be explicitly "true".
// Never reveal device tokens, SQL keys, or private workbooks in logs.

const SB = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_SECRET = Deno.env.get("GRIDCRAFT_SITE_SECRET") ?? "";
const EXPECTED_OWNER = Deno.env.get("GRIDCRAFT_EXPECTED_OWNER") ?? "";
const GATE = Deno.env.get("GRIDCRAFT_P3_ENABLED") === "true";
const DEVICE_REG = /^[A-Za-z0-9._:-]{1,100}$/;
const HEX64 = /^[a-f0-9]{64}$/i;
const CODE = /^[a-f0-9]{16}$/i;
const MAX_QUERY = 8192;
const MAX_DEVICE_RESULT = 24576;
const DEVICE_ACTIVE_MS = 20000;
const JOB_LIFE_MS = 15000;
const EXEC_WAIT_MS = 9000;
const ALLOWED_TOOLS = new Set(["gridcraft_status","gridcraft_list_workbooks","gridcraft_read_range"]);

const json = (body: unknown, status=200) => Response.json(body, {
  status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
});
const enc = (v: string) => encodeURIComponent(v);
const sleep = (ms: number) => new Promise(r=>setTimeout(r,ms));
const toolReply = (id: unknown, result: unknown, isError=false) =>
  ({jsonrpc:"2.0",id:id??null,result:{content:[{type:"text",text:JSON.stringify(result)}],isError}});
const fault = (code: string) => json({ok:false,error:code},400);
const plain = (v:unknown):v is Record<string,unknown> => !!v&&typeof v==="object"&&!Array.isArray(v);

async function sha(input:string) {
  const data=new TextEncoder().encode(input);
  const d=await crypto.subtle.digest("SHA-256",data);
  return [...new Uint8Array(d)].map(n=>n.toString(16).padStart(2,"0")).join("");
}

function safeEqual(a:string,b:string) {
  if (!a||!b||a.length!==b.length) return false;
  let value=0;
  for(let i=0;i<a.length;i++)value|=a.charCodeAt(i)^b.charCodeAt(i);
  return value===0;
}

async function verifySite(req:Request) {
  const owner=req.headers.get("x-lizhi-gridcraft-actor")??"";
  const secret=req.headers.get("x-lizhi-gridcraft-bridge")??"";
  if (!EXPECTED_OWNER||EXPECTED_OWNER.length<8||!SITE_SECRET||SITE_SECRET.length<32||
      owner!==EXPECTED_OWNER||
      !safeEqual(await sha(secret),await sha(SITE_SECRET))) {
    throw Error("SITE_UNAUTHORIZED");
  }
  return owner; // Server-trusted and fixed; NEVER read ownerId from body.
}

async function db(path:string, body?:unknown, method="GET"):Promise<any> {
  if (!/^https:\/\/[^/]+\.supabase\.co$/.test(SB) || !SERVICE) throw Error("NOT_CONFIGURED");
  const address=SB+"/rest/v1/"+path;
  const r=await fetch(address,{
    method,
    headers:{
      apikey:SERVICE,Authorization:"Bearer "+SERVICE,
      Accept:"application/json","Content-Type":"application/json",
      ...(method==="POST"?{Prefer:"return=representation"}:{})
    },
    body:body===undefined?undefined:JSON.stringify(body),
    redirect:"manual",signal:AbortSignal.timeout(8000)
  });
  if(!r.ok)throw Error("DB_UNAVAILABLE");
  const raw=await r.text();
  if(raw.length>MAX_DEVICE_RESULT*2)throw Error("DB_REPLY_LIMIT");
  return raw?JSON.parse(raw):null;
}

async function readBody(req:Request,max:number):Promise<any> {
  if(Number(req.headers.get("content-length")||0)>max)throw Error("BODY_LIMIT");
  const raw=await req.text();
  if(raw.length>max)throw Error("BODY_LIMIT");
  const body=JSON.parse(raw);
  if(!plain(body))throw Error("BODY_INVALID");
  return body;
}

async function authorizedDevice(req:Request,deviceId:unknown):Promise<{owner_id:string;device_id:string;last_status:string;last_seen:string|null}> {
  if(typeof deviceId!=="string"||!DEVICE_REG.test(deviceId))throw Error("DEVICE_UNAUTHORIZED");
  const match=/^Bearer ([a-f0-9]{64})$/i.exec(req.headers.get("authorization")??"");
  if(!match)throw Error("DEVICE_UNAUTHORIZED");
  const rows=await db("lz_gridcraft_devices?device_id=eq."+enc(deviceId)+
    "&select=owner_id,device_id,token_sha256,revoked_at,last_status,last_seen&limit=1");
  if(!Array.isArray(rows)||rows.length!==1||rows[0].revoked_at||
     !safeEqual(rows[0].token_sha256,await sha(match[1]))) throw Error("DEVICE_UNAUTHORIZED");
  return {owner_id:rows[0].owner_id,device_id:rows[0].device_id,last_status:rows[0].last_status,last_seen:rows[0].last_seen};
}

function boundInput(name:unknown,args:unknown):Record<string,unknown> {
  if(typeof name!=="string"||!ALLOWED_TOOLS.has(name)||!plain(args))throw Error("METHOD_DENIED");
  if(name!=="gridcraft_read_range") {
    if(Object.keys(args).length)throw Error("BAD_ARGS");
    return {};
  }
  if(Object.keys(args).sort().join("|")!=="doc|range|sheet")throw Error("BAD_ARGS");
  const {doc,range,sheet}=args;
  if(typeof doc!=="string"||!DEVICE_REG.test(doc)||typeof sheet!=="string"||
     !sheet.length||sheet.length>80||/[\x00-\x1f]/.test(sheet))throw Error("BAD_ARGS");
  const m=typeof range==="string"&&range.length<=22
    ? /^([A-Z]{1,3})([1-9][0-9]{0,5})(?::([A-Z]{1,3})([1-9][0-9]{0,5}))?$/.exec(range):null;
  if(!m)throw Error("BAD_RANGE");
  const col=(v:string)=>[...v].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
  const rows=Number(m[4]||m[2])-Number(m[2])+1;
  const cols=col(m[3]||m[1])-col(m[1])+1;
  if(rows<=0||cols<=0||rows>50||cols>20||rows*cols>200)throw Error("RANGE_LIMIT");
  return {doc,sheet,range};
}

async function activeDevice(owner:string) {
  const rows=await db("lz_gridcraft_devices?owner_id=eq."+enc(owner)+
       "&revoked_at=is.null&select=device_id,last_status,last_seen&order=last_seen.desc&limit=2");
  if(!Array.isArray(rows)||!rows.length)return {status:"DEVICE_OFFLINE",device:null};
  if(rows.length>1)throw Error("MULTIPLE_DEVICES_UNSUPPORTED");
  const device=rows[0];
  if(!device.last_seen||Date.now()-new Date(device.last_seen).getTime()>DEVICE_ACTIVE_MS) {
    return {status:"DEVICE_OFFLINE",device:null};
  }
  return {status:device.last_status,device:device.device_id};
}

async function siteDispatch(req:Request,owner:string) {
  const body=await readBody(req,MAX_QUERY);
  if(body.jsonrpc!=="2.0"||body.method!=="tools/call"||!plain(body.params))throw Error("INVALID_RPC");
  const id=body.id??null;
  const name=body.params.name;
  const args=boundInput(name,body.params.arguments??{});
  const availability=await activeDevice(owner);
  if(name==="gridcraft_status")return json(toolReply(id,{status:availability.status,backend:"desktop",write_enabled:false}));
  if(availability.status!=="READY")return json(toolReply(id,{error:availability.status},true));
  // Site must create a fresh UUID; the device cannot choose this job id.
  const jobId=body.params.requestId;
  if(typeof jobId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
    throw Error("INVALID_JOB_ID");
  }
  const expiresAt=new Date(Date.now()+JOB_LIFE_MS).toISOString();
  await db("lz_gridcraft_jobs",{
    id:jobId,owner_id:owner,device_id:availability.device,tool:name,
    arguments:args,expires_at:expiresAt,state:"queued"
  },"POST");
  for(let i=0;i<6;i++){
    await sleep(EXEC_WAIT_MS/6);
    const rows=await db("lz_gridcraft_jobs?id=eq."+enc(jobId)+
       "&owner_id=eq."+enc(owner)+"&select=state,result&limit=1");
    if(Array.isArray(rows)&&rows.length===1&&rows[0].state==="completed") {
      return json(toolReply(id,rows[0].result,rows[0].result?.ok===false));
    }
  }
  return json(toolReply(id,{error:"DEVICE_TIMEOUT",request_id:jobId},true));
}

async function startPairing(owner:string) {
  // High-entropy one-time code. One code is valid for only 2 min.
  const random=crypto.getRandomValues(new Uint8Array(8));
  const code=[...random].map(v=>v.toString(16).padStart(2,"0")).join("");
  await db("lz_gridcraft_pairings",{
    code_sha256:await sha(code),owner_id:owner,
    expires_at:new Date(Date.now()+120000).toISOString()
  },"POST");
  return json({ok:true,pairing_code:code,expires_in_seconds:120});
}

async function pairDevice(body:Record<string,unknown>) {
  if(typeof body.code!=="string"||!CODE.test(body.code)||
     typeof body.deviceId!=="string"||!DEVICE_REG.test(body.deviceId)||
     typeof body.deviceToken!=="string"||!HEX64.test(body.deviceToken))throw Error("PAIR_INVALID");
  const result=await db("rpc/lz_gridcraft_pair_device",{
    p_code_hash:await sha(body.code.toLowerCase()),
    p_device_id:body.deviceId,
    p_token_hash:await sha(body.deviceToken.toLowerCase())
  },"POST");
  if(typeof result!=="string"||result.length<8)throw Error("PAIR_DENIED");
  return json({ok:true,deviceId:body.deviceId});
}

async function deviceOperation(req:Request,action:string) {
  const body=await readBody(req,MAX_DEVICE_RESULT+2048);
  if(action==="pair")return pairDevice(body);
  const device=await authorizedDevice(req,body.deviceId);
  if(action==="heartbeat") {
    if(!["READY","GRIDCRAFT_OFFLINE","UNAUTHORIZED","CONTROL_ERROR"].includes(body.status))
      throw Error("INVALID_STATUS");
    await db("lz_gridcraft_devices?device_id=eq."+enc(device.device_id)+
       "&owner_id=eq."+enc(device.owner_id),
       {last_status:body.status,last_seen:new Date().toISOString()},"PATCH");
    return json({state:body.status});
  }
  if(action==="poll") {
    if(device.last_status!=="READY" || !device.last_seen ||
       Date.now()-new Date(device.last_seen).getTime()>DEVICE_ACTIVE_MS)
      return json({job:null,status:"GRIDCRAFT_OFFLINE"});
    const rows=await db("rpc/lz_gridcraft_claim_job",{
      p_owner:device.owner_id,p_device:device.device_id
    },"POST");
    const job=Array.isArray(rows)&&rows.length?rows[0]:null;
    if(!job)return json({job:null,status:"IDLE"});
    return json({job:{id:job.job_id,name:job.tool,args:job.arguments,
      expiresAt:new Date(job.expires_at).getTime()},status:"CLAIMED"});
  }
  if(action==="complete") {
    if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||
       !plain(body.result)||new TextEncoder().encode(JSON.stringify(body.result)).length>MAX_DEVICE_RESULT)
      throw Error("INVALID_COMPLETION");
    const ok=await db("rpc/lz_gridcraft_complete_job",{
      p_owner:device.owner_id,p_device:device.device_id,
      p_id:body.id,p_result:body.result
    },"POST");
    if(ok!==true)throw Error("UNKNOWN_OR_EXPIRED_JOB");
    return json({accepted:true});
  }
  throw Error("METHOD_DENIED");
}

async function handler(req:Request):Promise<Response> {
  if(!GATE)return fault("GRIDCRAFT_GATE_OFF");
  if(req.method!=="POST")return fault("METHOD_DENIED");
  try{
    const pathname=new URL(req.url).pathname;
    if(pathname.endsWith("/site/dispatch")) {
      const owner=await verifySite(req);
      return await siteDispatch(req,owner);
    }
    if(pathname.endsWith("/site/pair/start")) {
      const owner=await verifySite(req);
      return await startPairing(owner);
    }
    const match=/\/device\/(pair|heartbeat|poll|complete)$/.exec(pathname);
    if(match)return await deviceOperation(req,match[1]);
    throw Error("NOT_FOUND");
  } catch(e) {
    // Do not leak credentials, SQL statements or workbook contents to clients.
    return fault(e instanceof Error ? e.message.match(/^[A-Z_]+$/)?.[0]??"BACKEND_ERROR":"BACKEND_ERROR");
  }
}

// Pure exported handler supports isolated Deno tests, but this file must NOT be
// deployed until the schema, pairing, RLS, quota, revocation and owner flow pass.
export {handler};
if (import.meta.main) Deno.serve(handler);
