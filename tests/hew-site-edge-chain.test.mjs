import test from "node:test";
import assert from "node:assert/strict";
import {handleModelSiteTool} from "../sites-migration/hew/site-tools.mjs";
import {handleModelEdgeRequest} from "../supabase/functions/lizhi-model-site-mcp/edge-core.mjs";

const uid="11111111-1111-4111-8111-111111111111";
const session="33333333-3333-4333-8333-333333333333";
const doc="44444444-4444-4444-8444-444444444444";
const request="55555555-5555-4555-8555-555555555555";
const job="66666666-6666-4666-8666-666666666666";
const token="b".repeat(64);
const auth={signedIn:true,verifiedUserEmail:"owner@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:token};
const dbCallNames=[];
const db={rpc:async(name,args)=>{
 dbCallNames.push(name);
 const data={
  lizhi_model_site_sessions:[{session_id:session,document_id:doc}],
  lizhi_model_site_scene:{document_id:doc,revision:"rev-1",entities:[{id:"obj_1",kind:"solid",name:"Box"}]},
  lizhi_model_site_enqueue:job,
  lizhi_model_site_job:{job_id:job,state:"succeeded"}
 }[name];
 return {data,error:null};
}};
let posts=0;
const fetcher=async(url,init)=>{
 posts++;
 const req=new Request(url,{method:init.method,headers:init.headers,body:init.body});
 return handleModelEdgeRequest(req,{db,ownerUid:uid,token});
};
test("Site → real Edge core → mock SQL status verified",async()=>{
 dbCallNames.length=0;posts=0;
 const r=await handleModelSiteTool("model_status",{},auth,secrets,fetcher);
 assert.equal(r.isError,false);assert.equal(posts,1);
 const data=JSON.parse(r.content[0].text);
 assert.equal(data.online,true);assert.equal(data.sessions[0].document_id,doc);
 assert.deepEqual(dbCallNames,["lizhi_model_site_sessions"]);
});
test("Site → Edge → mock SQL enqueues one bounded box without claiming built",async()=>{
 dbCallNames.length=0;posts=0;
 const r=await handleModelSiteTool("model_create_box",{
  session_id:session,request_id:request,origin_mm:[0,0,0],
  width_mm:1200,depth_mm:600,height_mm:750
 },auth,secrets,fetcher);
 assert.equal(r.isError,false);assert.equal(posts,1);
 const data=JSON.parse(r.content[0].text);
 assert.equal(data.queued,true);assert.equal(data.completed,false);
 assert.equal(data.job_id,job);
 assert.deepEqual(dbCallNames,["lizhi_model_site_sessions","lizhi_model_site_scene","lizhi_model_site_enqueue"]);
});
test("Site → Edge → mock SQL job check is read only and confirms result",async()=>{
 dbCallNames.length=0;posts=0;
 const r=await handleModelSiteTool("model_job_status",{job_id:job},auth,secrets,fetcher);
 assert.equal(r.isError,false);
 const data=JSON.parse(r.content[0].text);
 assert.equal(data.state,"succeeded");assert.equal(data.completed,true);
 assert.deepEqual(dbCallNames,["lizhi_model_site_job"]);
});
test("wrong identity is denied before any request reaches Edge",async()=>{
 dbCallNames.length=0;posts=0;
 const r=await handleModelSiteTool("model_status",{},{signedIn:true,verifiedUserEmail:"different@example.test"},secrets,fetcher);
 assert.equal(r.isError,true);assert.equal(posts,0);assert.equal(dbCallNames.length,0);
});
