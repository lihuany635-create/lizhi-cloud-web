// Deno P3 Edge candidate route tests, synthetic DB replies only. No network.
Deno.env.set("GRIDCRAFT_P3_ENABLED","true");
Deno.env.set("GRIDCRAFT_SITE_SECRET","super-long-test-site-bridge-secret-123456789");
Deno.env.set("GRIDCRAFT_EXPECTED_OWNER","synthetic-owner-2026");
Deno.env.set("SUPABASE_URL","https://test.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","test-service-key-not-real");
const {handler} = await import("./p3-edge-candidate.ts");

const OWNER="synthetic-owner-2026";
const SITE_SECRET="super-long-test-site-bridge-secret-123456789";
const TOKEN="a".repeat(64);
const request=(tail:string,body:Record<string,unknown>,headers:Record<string,string>={}) =>
  new Request("https://test.supabase.co/functions/v1/lizhi-gridcraft-bridge/"+tail,
    {method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(body)});
const siteHeaders={"x-lizhi-gridcraft-actor":OWNER,"x-lizhi-gridcraft-bridge":SITE_SECRET};
const deviceHeaders={"Authorization":"Bearer "+TOKEN};
const tool=(name:string, args:Record<string,unknown>={})=>
  ({jsonrpc:"2.0",id:"edge-test-id",method:"tools/call",
    params:{name,arguments:args,requestId:"e7dd7b91-18fa-4320-889b-7ded594d92db"}});
async function sha(s:string){
 const x=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return [...new Uint8Array(x)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
const savedFetch=globalThis.fetch;
let mocked:any[]=[];
let fake:(url:string,init:RequestInit)=>Response|Promise<Response>;
(globalThis as any).fetch=async(url:string,init:RequestInit)=>{
 mocked.push({url,method:init.method,body:init.body});
 if(fake)return await fake(url,init);
 return Response.json([]);
};
const assert=(bool:boolean,msg:string)=>{if(!bool)throw Error(msg);};

Deno.test("wrong Site identity and missing secret rejected before DB",async()=>{
 mocked=[];
 const r1=await handler(request("site/dispatch",tool("gridcraft_status"),{
    "x-lizhi-gridcraft-actor":"another-owner",
    "x-lizhi-gridcraft-bridge":SITE_SECRET
 }));
 assert(r1.status===400,"wrong owner should fail");
 const r2=await handler(request("site/dispatch",tool("gridcraft_status"),{
    "x-lizhi-gridcraft-actor":OWNER
 }));
 assert(r2.status===400,"missing secret should fail");
 assert(mocked.length===0,"DB not queried");
});
Deno.test("missing devices resolves to DEVICE_OFFLINE",async()=>{
 mocked=[];
 fake=()=>Response.json([]);
 const r=await handler(request("site/dispatch",tool("gridcraft_status"),siteHeaders));
 assert(r.status===200,"expected RPC envelope");
 const x=await r.json();
 const status=JSON.parse(x.result.content[0].text);
 assert(status.status==="DEVICE_OFFLINE","offline status mismatch");
});
Deno.test("untrusted arbitrary GridCraft write methods denied",async()=>{
 mocked=[];
 const r=await handler(request("site/dispatch",tool("gridcraft_write_range",{
    doc:"test",sheet:"Demo",range:"A1",values:[[123]]
 }),siteHeaders));
 assert(r.status===400,"remote write must fail");
 assert(mocked.length===0,"write denied before DB");
});
Deno.test("one-time pairing start generates code but never shares bridge secret",async()=>{
 mocked=[];
 fake=()=>Response.json([{created:true}],{status:201});
 const r=await handler(request("site/pair/start",{},siteHeaders));
 const body=await r.json();
 assert(body.ok===true && /^[a-f0-9]{16}$/.test(body.pairing_code),"pair code invalid");
 assert(body.expires_in_seconds===120,"code TTL");
 assert(!JSON.stringify(body).includes(SITE_SECRET),"do not return Site secret");
 assert(mocked.some(x=>String(x.url).includes("lz_gridcraft_pairings")),"pairing not inserted");
});
Deno.test("device bearer must match SHA256 and owner binding",async()=>{
 const wanted=await sha(TOKEN);
 mocked=[];
 fake=(url,init)=>{
   if(url.includes("lz_gridcraft_devices") && init.method==="GET")
      return Response.json([{owner_id:OWNER,device_id:"synthetic-device",
                             token_sha256:wanted,revoked_at:null}]);
   if(url.includes("lz_gridcraft_devices") && init.method==="PATCH")
      return new Response(null,{status:204});
   return Response.json([]);
 };
 const good=await handler(request("device/heartbeat",{deviceId:"synthetic-device",status:"READY"},deviceHeaders));
 assert(good.status===200,"good device bearer denied");
 const bad=await handler(request("device/heartbeat",{deviceId:"synthetic-device",status:"READY"},
    {"Authorization":"Bearer "+"f".repeat(64)}));
 assert(bad.status===400,"wrong device bearer accepted");
});
Deno.test("device poll returns scoped queued read only",async()=>{
 const wanted=await sha(TOKEN);
 mocked=[];
 fake=(url,init)=>{
   if(url.includes("lz_gridcraft_devices") && init.method==="GET")
      return Response.json([{owner_id:OWNER,device_id:"synthetic-device",token_sha256:wanted,revoked_at:null,last_status:"READY",last_seen:new Date().toISOString()}]);
   if(url.includes("rpc/lz_gridcraft_claim_job"))
      return Response.json([{job_id:"e7dd7b91-18fa-4320-889b-7ded594d92db",
        tool:"gridcraft_read_range",arguments:{doc:"42",sheet:"Demo",range:"A1"},
        expires_at:new Date(Date.now()+5000).toISOString()}]);
   return Response.json([]);
 };
 const r=await handler(request("device/poll",{deviceId:"synthetic-device"},deviceHeaders));
 const body=await r.json();
 assert(body.status==="CLAIMED","poll did not claim job");
 assert(body.job.name==="gridcraft_read_range","wrong tool forwarded");
 assert(body.job.args.doc==="book","wrong document");
});
Deno.test("device pair refuses unknown server-side code",async()=>{
 mocked=[];
 fake=()=>Response.json(null);
 const r=await handler(request("device/pair",{
   code:"0123456789abcdef",deviceId:"gridcraft-abcdef123456",deviceToken:TOKEN
 }));
 assert(r.status===400,"unknown code must be denied");
});


Deno.test("approved one-time pairing stores only token hash in DB adapter",async()=>{
 mocked=[];
 fake=()=>Response.json(OWNER);
 const r=await handler(request("device/pair",{
   code:"0123456789abcdef",deviceId:"gridcraft-device-for-test",deviceToken:TOKEN
 }));
 const b=await r.json();
 assert(r.status===200&&b.ok===true,"valid pairing rejected");
 const data=mocked.map(x=>String(x.body)).join(" ");
 assert(!data.includes(TOKEN),"raw device token must not be sent to database");
 assert(data.includes("p_token_hash"),"token hash not sent to database");
});
Deno.test("revoked device credential rejected even with correct bearer token",async()=>{
 const wanted=await sha(TOKEN);
 mocked=[];
 fake=()=>Response.json([{owner_id:OWNER,device_id:"synthetic-device",
    token_sha256:wanted,revoked_at:new Date().toISOString()}]);
 const r=await handler(request("device/heartbeat",{deviceId:"synthetic-device",status:"READY"},deviceHeaders));
 assert(r.status===400,"revoked device was accepted");
});
