import test from "node:test";
import assert from "node:assert/strict";
const endpoint="http://127.0.0.1:8000/";
const token="a".repeat(64);
const rpc={jsonrpc:"2.0",id:"edge-http-ci",method:"tools/list"};
async function call({bearer,origin,body=JSON.stringify(rpc)}={}){
 const headers={"Content-Type":"application/json"};
 if(bearer)headers.Authorization="Bearer "+bearer;
 if(origin)headers.Origin=origin;
 return fetch(endpoint,{method:"POST",headers,body});
}
test("actual Edge HTTP rejects anonymous, bad Site secret and browser Origin",async()=>{
 assert.equal((await call()).status,401);
 assert.equal((await call({bearer:"b".repeat(64)})).status,401);
 assert.equal((await call({bearer:token,origin:"https://untrusted.test"})).status,403);
 const allowed=await call({bearer:token});
 assert.equal(allowed.status,200);
 const envelope=await allowed.json();
 assert.equal(envelope.result.tools.length,6);
 assert.deepEqual(envelope.result.tools.map(x=>x.name).sort(),
   ["cad_status","cad_draw_rectangle","cad_draw_line","cad_draw_circle","cad_new_drawing","cad_job_status"].sort());
});
test("actual Edge HTTP rejects oversized authenticated payload by bytes",async()=>{
 const body=JSON.stringify({...rpc,padding:"字".repeat(6000)});
 assert.ok(body.length<16384);
 assert.equal((await call({bearer:token,body})).status,413);
});
