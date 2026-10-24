"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),http=require("node:http");
const {createCadJobHistory}=require("./cloud-cad-job-history.cjs");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789",other="bbbbcccc-1234-4abc-8abc-abc123456789";
const hex=n=>String(n).repeat(64);
const entries=[
 {job_data:{project_id:"p1",drawing_id:"ok_drawing",idempotency_key:hex("a"),status:"completed",operation:"create",expected_revision:0,output_revision:1},created_at:"2026-10-24T12:00:00Z"},
 {job_data:{project_id:"p1",drawing_id:"hidden",idempotency_key:hex("b"),status:"queued",operation:"modify",expected_revision:1,output_revision:null},created_at:"2026-10-24T11:00:00Z"}
];
function sample(){
 const calls=[],checks=[];
 const history=createCadJobHistory({
  db:{async query(sql,args){calls.push({sql,args});return {rows:entries};}},
  authorizeDrawing:async args=>{checks.push(args);return args.ownerId===owner&&args.projectId==="p1"&&args.drawingId==="ok_drawing"&&args.clientId==="approved";}
 });
 return {history,calls,checks};
}
test("only verified owner and OAuth client can recover authorized drawing job metadata",async()=>{
 const s=sample(),result=await s.history.list(owner,{projectId:"p1",limit:2},{clientId:"approved"});
 assert.equal(result.project_id,"p1");assert.equal(result.jobs.length,1);
 assert.equal(result.jobs[0].drawing_id,"ok_drawing");
 assert.equal(result.jobs[0].job_key,hex("a"));
 assert.equal(result.jobs[0].output_revision,1);
 assert.equal(s.calls.length,1);
 assert.match(s.calls[0].sql,/owner_id=\$1::uuid/);
 assert.match(s.calls[0].sql,/project_id/);
 assert.deepEqual(s.calls[0].args,[owner,"p1",2]);
 assert.equal(s.checks.length,2);
 assert.equal(JSON.stringify(result).includes("hidden"),false);
 assert.equal(JSON.stringify(result).includes("script"),false);
});
test("reject malformed owner, project, client, and unbounded list size BEFORE SQL",async()=>{
 const s=sample();
 for(const [id,params,context] of [
  [other,{projectId:"p1"},{clientId:""}],
  ["forged",{projectId:"p1"},{clientId:"approved"}],
  [owner,{projectId:"../private"},{clientId:"approved"}],
  [owner,{projectId:"p1"},{clientId:"bad client"}],
  [owner,{projectId:"p1",limit:26},{clientId:"approved"}],
  [owner,{projectId:"p1",limit:0},{clientId:"approved"}]
 ])await assert.rejects(s.history.list(id,params,context));
 assert.equal(s.calls.length,0);
});
test("revoked OAuth read access returns no jobs; no unauthorized item may be returned",async()=>{
 const s=sample();
 const result=await s.history.list(owner,{projectId:"p1"},{clientId:"revoked"});
 assert.deepEqual(result.jobs,[]);
 assert.equal(s.checks.every(x=>x.clientId==="revoked"),true);
});
test("MCP exposes history only when service supports it and binds verified identity",async()=>{
 const calls=[];
 const handler=createCadMcpHttpHandler({
  verifyBearer:async token=>token==="valid"?{userId:owner,clientId:"approved"}:null,
  service:{
   submit:async()=>{},status:async()=>{},
   listJobs:async(user,args,ctx)=>{calls.push({user,args,ctx});return {project_id:"p1",jobs:[]};}
  }
 });
 const server=http.createServer(handler);
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const url="http://127.0.0.1:"+server.address().port+"/mcp";
 const rpc=(method,params)=>({jsonrpc:"2.0",id:1,method,params});
 const post=body=>fetch(url,{method:"POST",headers:{authorization:"Bearer valid","content-type":"application/json"},body:JSON.stringify(body)});
 try{
  const tools=(await (await post(rpc("tools/list",{}))).json()).result.tools;
  assert.deepEqual(tools.map(t=>t.name),["cad_submit_drawing","cad_job_status","cad_list_jobs"]);
  let p=(await (await post(rpc("tools/call",{name:"cad_list_jobs",arguments:{projectId:"p1",limit:5,ownerId:"forged"}}))).json()).result;
  assert.equal(p.isError,false);assert.equal(calls.length,1);
  assert.deepEqual(calls[0],{user:owner,args:{projectId:"p1",limit:5,ownerId:"forged"},ctx:{clientId:"approved"}});
  p=(await (await post(rpc("tools/call",{name:"cad_preview_png",arguments:{projectId:"p1",drawingId:"x",revision:1}}))).json());
  assert.equal(p.error.code,-32602);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
