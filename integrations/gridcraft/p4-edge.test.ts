// P4 Edge v4 mock contract tests. Production Edge v3 remains untouched.
Deno.env.set("SUPABASE_URL","https://synthetic.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","synthetic-service-role-key");
const {createHandler}=await import("./p4-edge-v4-candidate.ts");
const token="a".repeat(64),owner="synthetic-owner-2026";
const hex=async(s:string)=>{
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
};
const config={siteSecretSha256:await hex(token),owner,enabled:true,pairingEnabled:false};
const headers={"Content-Type":"application/json","x-lizhi-gridcraft-actor":owner,
 "x-lizhi-gridcraft-bridge":token};
const request=(tool:string,args:unknown,override?:Record<string,string>)=>
 new Request("https://synthetic.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch",{
  method:"POST",headers:override||headers,body:JSON.stringify({
   jsonrpc:"2.0",id:"p4-test",method:"tools/call",
   params:{name:tool,arguments:args,requestId:"d453c523-41e7-4a48-9df9-e72533189dc1"}
  })
 });
const assert=(ok:boolean,msg:string)=>{if(!ok)throw Error(msg);};
const data={doc:"1",sheet:"Sheet1",range:"A3:B3",values:[["P4測試",456]]};
let queries:{url:string,method:string}[]=[];
let fake:(url:string,init:RequestInit)=>Response;
globalThis.fetch=(async(url:string|URL|Request,init?:RequestInit)=>{
 queries.push({url:String(url),method:init?.method||"GET"});
 return fake(String(url),init||{});
}) as typeof fetch;

Deno.test("P4 default gate is OFF even when P3 is enabled",async()=>{
 queries=[];
 fake=()=>Response.json([]);
 const r=await createHandler(config)(request("gridcraft_prepare_write",data));
 const b=await r.json();
 assert(r.status===400 && b.error==="P4_GATE_OFF","P4 must fail closed");
 assert(queries.length===0,"P4 denied before any DB query");
});
Deno.test("P4 owner identity still checked by existing P3 credential",async()=>{
 queries=[];
 fake=()=>Response.json([]);
 const r=await createHandler({...config,p4Enabled:true})(request("gridcraft_prepare_write",data,{
  "Content-Type":"application/json","x-lizhi-gridcraft-actor":"attacker",
  "x-lizhi-gridcraft-bridge":token
 }));
 assert(r.status===401,"attacker should be rejected");
 assert(queries.length===0,"attacker cannot query DB");
});
Deno.test("P4 formula and oversized range rejected before DB",async()=>{
 queries=[];
 fake=()=>Response.json([]);
 const h=createHandler({...config,p4Enabled:true});
 for(const args of [
   {...data,values:[["=CMD()",456]]},
   {...data,range:"A1:ZZ1000"},
   {...data,doc:"../../secret"},
   {...data,path:"c:/Windows"}
 ]){
   const r=await h(request("gridcraft_prepare_write",args));
   assert(r.status===400,"malicious P4 request should fail");
 }
 assert(queries.length===0,"invalid requests must not query DB");
});
Deno.test("P4 commit demands explicit confirmation flag and version",async()=>{
 queries=[];
 fake=()=>Response.json([]);
 const h=createHandler({...config,p4Enabled:true});
 const base={preview_id:"12345678-1234-4234-a234-123456789012",
  expected_version:"e".repeat(64),request_id:"4b5db764-3a8b-4a3d-bf09-123456789012"};
 const r=await h(request("gridcraft_commit_write",{...base,owner_confirmed:false}));
 assert(r.status===400 && queries.length===0,"cannot skip owner approval");
});
Deno.test("P4 valid preview may enqueue only owner-scoped short-lived job",async()=>{
 queries=[];
 fake=(url,init)=>{
  if(url.includes("lz_gridcraft_devices"))
   return Response.json([{device_id:"synthetic-device",last_seen:new Date().toISOString(),
      last_status:"READY"}]);
  if(url.includes("lz_gridcraft_jobs") && init.method==="POST"){
   const job=JSON.parse(String(init.body));
   assert(job.owner_id===owner && job.tool==="gridcraft_prepare_write","scope/tool invalid");
   assert(job.arguments.doc==="1","doc changed");
   assert(Date.parse(job.expires_at)>Date.now(),"task expired");
   return Response.json([job],{status:201});
  }
  if(url.includes("lz_gridcraft_jobs") && init.method==="GET")
   return Response.json([{state:"completed",result:{ok:true,preview_id:"abc",expected_version:"e".repeat(64)}}]);
  return Response.json([]);
 };
 const r=await createHandler({...config,p4Enabled:true})(request("gridcraft_prepare_write",data));
 const response=await r.json();
 assert(r.status===200 && response.result?.isError===false,"valid preview did not complete");
 assert(queries.some(q=>q.method==="POST"&&q.url.includes("lz_gridcraft_jobs")),"no P4 queue job created");
});
