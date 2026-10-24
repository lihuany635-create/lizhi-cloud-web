"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createCadMcpService}=require("./cloud-cad-mcp-service.cjs");
const {createQueue,createMemoryStorage}=require("./cloud-cad-queue.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789",other="bbccddee-1234-4abc-8abc-abc123456789";
const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"cab",revision:9},entities:[{type:"polyline",layer:"FURNITURE",closed:true,points:[[0,0],[10,0],[10,20],[0,20]]}]};
const args={projectId:"p1",drawingId:"d1",baseRevision:0,requestId:"req1",operation:"create",spec};
function fixture(){
 const intentsMap=new Map(),queueMap=new Map(),calls=[];
 const intents={
 async putIfAbsent({ownerId,key,value}){
  const k=ownerId+":"+key;
  if(intentsMap.has(k))return intentsMap.get(k);
  intentsMap.set(k,value);return value;
 },
 async get({ownerId,key}){return intentsMap.get(ownerId+":"+key)??null;}
 };
 const service=createCadMcpService({
  intents,
  authorizeDrawing:async({ownerId,...rest})=>{calls.push({ownerId,...rest});return ownerId===owner;},
  queueForOwner:(ownerId)=>{if(!queueMap.has(ownerId))queueMap.set(ownerId,createQueue(createMemoryStorage()));return queueMap.get(ownerId);}
 });
 return {service,calls};
}
test("authenticated cloud CAD creates a queued drawing and reads its status",async()=>{
 const {service,calls}=fixture();
 const j=await service.submit(owner,args);
 assert.equal(j.status,"queued");assert.equal(j.expected_revision,0);assert.equal(j.drawing_id,"d1");
 const state=await service.status(owner,{projectId:"p1",drawingId:"d1",jobKey:j.job_key});
 assert.equal(state.status,"queued");assert.equal(calls.length,2);
 assert.equal(calls[0].action,"create");assert.equal(calls[1].action,"read");
});
test("identical requests reuse the same job; changed geometry conflicts",async()=>{
 const {service}=fixture();
 const a=await service.submit(owner,args),b=await service.submit(owner,args);
 assert.equal(a.job_key,b.job_key);
 const altered={...args,spec:{...spec,entities:[{...spec.entities[0],points:[[0,0],[12,0],[12,20],[0,20]]}]}};
 await assert.rejects(service.submit(owner,altered),{code:"CAD_INTENT_CONFLICT"});
});
test("no user can submit to another owner's project",async()=>{
 const {service}=fixture();
 await assert.rejects(service.submit(other,args),{code:"CAD_ACCESS_DENIED"});
 await assert.rejects(service.status(other,{projectId:"p1",drawingId:"d1",jobKey:"f".repeat(64)}),{code:"CAD_ACCESS_DENIED"});
});
test("job status cannot be read under the wrong project or drawing",async()=>{
 const {service}=fixture(),j=await service.submit(owner,args);
 await assert.rejects(service.status(owner,{projectId:"p2",drawingId:"d1",jobKey:j.job_key}),{code:"CAD_JOB_NOT_FOUND"});
 await assert.rejects(service.status(owner,{projectId:"p1",drawingId:"d2",jobKey:j.job_key}),{code:"CAD_JOB_NOT_FOUND"});
});
test("only create/modify and valid drawing revisions are accepted",async()=>{
 const {service}=fixture();
 await assert.rejects(service.submit(owner,{...args,operation:"shell"}),{code:"CAD_OPERATION_DENIED"});
 await assert.rejects(service.submit(owner,{...args,baseRevision:2}),{code:"CAD_CREATE_REVISION"});
 await assert.rejects(service.submit(owner,{...args,operation:"modify"}),{code:"CAD_MODIFY_REVISION"});
 await assert.rejects(service.submit(owner,{...args,projectId:"../escape"}),{code:"CAD_ID_INVALID"});
});
test("cloud drawing revision is distinct from design revision",async()=>{
 const {service}=fixture();
 const j=await service.submit(owner,{...args,baseRevision:3,operation:"modify"});
 assert.equal(j.expected_revision,3);
 assert.equal(spec.source_identity.revision,9);
});
