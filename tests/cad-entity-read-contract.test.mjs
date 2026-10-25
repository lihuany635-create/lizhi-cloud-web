import test from "node:test";
import assert from "node:assert/strict";
import {ENTITY_READ_TOOLS,validateEntityReadTool,projectEntityReadReceipt} from "../cad/sites/cad-entity-read-v1.mjs";
const session_id="11111111-1111-4111-8111-111111111111";
const request_id="22222222-2222-4222-8222-222222222222";
const job_id="33333333-3333-4333-8333-333333333333";
test("two bounded native read enqueue commands and one read receipt tool",()=>{
 assert.deepEqual(ENTITY_READ_TOOLS.map(x=>x.name),["cad_inspect_drawing","cad_list_entities","cad_read_job"]);
 assert.deepEqual(validateEntityReadTool("cad_inspect_drawing",{session_id,request_id}).params,{});
 assert.deepEqual(validateEntityReadTool("cad_list_entities",{session_id,request_id,limit:4,selected:true}).params,{limit:4,offset:0,selected:true});
 assert.equal(validateEntityReadTool("cad_read_job",{job_id}).ok,true);
});
test("reject arbitrary access, unchecked pages, hidden path inputs and write commands",()=>{
 const base={session_id,request_id};
 for(const extras of [{limit:9},{limit:0},{offset:-1},{offset:10001},{path:"C:/secret.dxf"},{type:"\u0000"},{layer:"x".repeat(81)},{selected:"yes"},{limit:Infinity},{request_id:"not-a-uuid"}]){
  assert.equal(validateEntityReadTool("cad_list_entities",{...base,...extras}).ok,false,JSON.stringify(extras));
 }
 for(const names of ["cad_draw_rectangle","cad_move_entity","execute","cad_delete_entity"])
  assert.equal(validateEntityReadTool(names,base).ok,false);
 assert.equal(validateEntityReadTool("cad_inspect_drawing",{...base,includeRawDxf:true}).ok,false);
});
test("project only native numeric geometry, never DXF text, paths or arbitrary attributes",()=>{
 const raw={job_id,kind:"lizhi.entities",state:"succeeded",data:{
 revision:3,count:1,offset:0,hasMore:false,secret:"/private",
 entities:[{handle:"1A",type:"LINE",layer:"0",text:"PRIVATE",geometry:{start:[0,0],end:[800,900]},extra:"leak"}]
 }};
 const result=projectEntityReadReceipt(raw);assert.equal(result.ok,true);
 assert.equal(result.data.entities[0].geometryAvailable,true);
 assert.equal(result.data.entities[0].text,undefined);
 assert.equal(JSON.stringify(result).includes("PRIVATE"),false);
 assert.equal(JSON.stringify(result).includes("/private"),false);
 const malformed=projectEntityReadReceipt({...raw,data:{...raw.data,entities:[{...raw.data.entities[0],geometry:{start:[0,0],text:"PRIVATE"}}]}});
 assert.equal(malformed.data.entities[0].geometryAvailable,false);
});
test("never return data from non-read or unfinished jobs",()=>{
 assert.equal(projectEntityReadReceipt({job_id,state:"succeeded",kind:"rectang",data:{secret:"yes"}}).ok,false);
 assert.equal(projectEntityReadReceipt({job_id,state:"claimed",kind:"lizhi.entities",data:{secret:"yes"}}).data,undefined);
 assert.equal(projectEntityReadReceipt({job_id,state:"succeeded",kind:"lizhi.inspect",data:{revision:7,entityCount:5,selectionCount:0,dirty:true,counts:{LINE:4,SECRET:"no"}}}).data.revision,7);
});

test("real CADCraft native serde geometry survives sanitization, unknown data does not",()=>{
 const native={job_id,kind:"lizhi.entities",state:"succeeded",data:{
 revision:13,count:2,offset:0,entities:[
  {handle:"AF",type:"Line",layer:"0",geometry:{type:"line",a:{x:0,y:0,z:0},b:{x:800,y:900,z:0}}},
  {handle:"B0",type:"Circle",layer:"0",geometry:{type:"circle",center:{x:40,y:50,z:0},radius:12}}
 ]}};
 const result=projectEntityReadReceipt(native);
 assert.equal(result.ok,true);
 assert.equal(result.data.entities[0].geometryAvailable,true);
 assert.equal(result.data.entities[0].geometry.b.y,900);
 assert.equal(result.data.entities[1].geometry.radius,12);
 const unsafe=projectEntityReadReceipt({...native,data:{...native.data,entities:[{
  ...native.data.entities[0],geometry:{type:"line",a:{x:0,y:0,z:0},b:{x:800,y:900,z:0},text:"classified"}
 }]}});
 assert.equal(unsafe.data.entities[0].geometryAvailable,false);
});
