import test from "node:test";
import assert from "node:assert/strict";
const enabled=process.env.CAD_READ_TEST_ENABLED==="true";
const token="a".repeat(64);
const endpoint="http://127.0.0.1:8000/";
async function send(method,params={},auth=token,extra={}){
 const id="ci-entity-read";
 const response=await fetch(endpoint,{method:"POST",headers:{
  "Content-Type":"application/json",...(auth===null?{}:{Authorization:"Bearer "+auth}),
  ...extra},body:JSON.stringify({jsonrpc:"2.0",id,method,params})});
 return {response,data:await response.json()};
}
test("server rejects anonymous, wrong token and browser Origin",async()=>{
 assert.equal((await send("tools/list",{},null)).response.status,401);
 assert.equal((await send("tools/list",{},"b".repeat(64))).response.status,401);
 assert.equal((await send("tools/list",{},token,{Origin:"https://unknown.invalid"})).response.status,403);
});
test("read feature never leaks tools when disabled and lists exactly three extra when enabled",async()=>{
 const r=await send("tools/list");
 assert.equal(r.response.status,200);
 const names=r.data.result.tools.map(x=>x.name);
 assert.equal(names.length,enabled?9:6);
 for(const name of ["cad_status","cad_draw_rectangle","cad_draw_line","cad_draw_circle","cad_new_drawing","cad_job_status"])
  assert.ok(names.includes(name));
 for(const name of ["cad_inspect_drawing","cad_list_entities","cad_read_job"])
  assert.equal(names.includes(name),enabled);
});
test("read calls fail closed if feature disabled or backend unavailable",async()=>{
 const args={session_id:"11111111-1111-4111-8111-111111111111",request_id:"22222222-2222-4222-8222-222222222222"};
 const r=await send("tools/call",{name:"cad_inspect_drawing",arguments:args});
 assert.equal(r.response.status,200);
 assert.equal(r.data.result.isError,true);
 const text=r.data.result.content[0].text;
 if(!enabled)assert.match(text,/UNKNOWN_CAD_TOOL/);
 else assert.match(text,/CAD_READ_SESSION_OR_QUEUE_UNAVAILABLE/);
});
