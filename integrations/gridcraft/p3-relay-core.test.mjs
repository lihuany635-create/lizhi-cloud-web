import test from "node:test";
import assert from "node:assert/strict";
import {EphemeralP3Relay, RelayFault, validateCall, GRIDCRAFT_TOOLS} from "./p3-relay-core.mjs";

const OWNER="verified-owner-2026";
const OTHER="another-owner-2026";
const ID="gridcraft-personal-pc";
const TOKEN="a".repeat(64);
let number=0;
function relay(config={}) {
  return new EphemeralP3Relay({ownerId:OWNER,deviceId:ID,deviceToken:TOKEN,...config});
}
const cmd=()=> "gridcraft-demo-" + (++number);
const device={deviceId:ID,deviceToken:TOKEN};
const ready=async r =>r.heartbeat({...device,status:"READY"});
function denied(fn,code){return assert.rejects(fn,e=>e instanceof RelayFault&&e.code===code);}

test("Site tools have only 3 read-only names and no writes or arbitrary paths",()=>{
  assert.deepEqual(GRIDCRAFT_TOOLS.map(t=>t.name),["gridcraft_status","gridcraft_list_workbooks","gridcraft_read_range"]);
  assert.ok(GRIDCRAFT_TOOLS.every(t=>t.annotations.readOnlyHint===true));
  for(const name of ["gridcraft_set_cell","gridcraft_write_range","execute_command","app.open","ui.key"]){
    assert.throws(()=>validateCall(name,{}),e=>e.code==="METHOD_DENIED");
  }
});
test("strict range & doc limits, block huge returned workbook and injected params",()=>{
  assert.deepEqual(validateCall("gridcraft_read_range",{doc:"42",sheet:"估價清單",range:"B3:D6"}),
    {doc:"42",sheet:"估價清單",range:"B3:D6"});
  for(const range of ["A1:ZZ1000","A1:A201","Z10:A1","A0","A1;open","A1:Q100","A1:XX20"]){
    assert.throws(()=>validateCall("gridcraft_read_range",{doc:"42",sheet:"Main",range}));
  }
  assert.throws(()=>validateCall("gridcraft_read_range",{doc:"../../windows",sheet:"Main",range:"B2"}));
  assert.throws(()=>validateCall("gridcraft_status",{ownerId:OWNER}));
});
test("device offline initially; online heartbeat; clock TTL expires to DEVICE_OFFLINE",async()=>{
  let current=10000;const r=relay({clock:()=>current,heartbeatMs:12000});
  assert.equal((await r.dispatch({verifiedOwner:OWNER,name:"gridcraft_status"})).status,"DEVICE_OFFLINE");
  await ready(r);
  assert.equal((await r.dispatch({verifiedOwner:OWNER,name:"gridcraft_status"})).status,"READY");
  current+=12001;
  assert.equal((await r.dispatch({verifiedOwner:OWNER,name:"gridcraft_status"})).status,"DEVICE_OFFLINE");
  await denied(()=>r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:cmd()}),"DEVICE_OFFLINE");
});
test("owner verified from server not input; fake / missing owner rejected",async()=>{
  const r=relay();await ready(r);
  await denied(()=>r.dispatch({verifiedOwner:OTHER,name:"gridcraft_status"}),"UNAUTHORIZED");
  await denied(()=>r.dispatch({verifiedOwner:undefined,name:"gridcraft_status"}),"UNAUTHORIZED");
  await denied(()=>r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",args:{ownerId:OTHER},requestId:cmd()}),"INVALID_ARGS");
});
test("device ID/token mismatch denied; control token never in queue",async()=>{
  const r=relay();await ready(r);
  await denied(()=>r.poll({deviceId:"fake",deviceToken:TOKEN}),"UNAUTHORIZED");
  await denied(()=>r.poll({deviceId:ID,deviceToken:"b".repeat(64)}),"UNAUTHORIZED");
  await denied(()=>r.heartbeat({deviceId:ID,deviceToken:"b".repeat(64),status:"READY"}),"UNAUTHORIZED");
});
test("read-only list workbooks queued to authorized outbound device and delivered",async()=>{
  const r=relay();await ready(r);
  const id=cmd();
  const pending=r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:id});
  const answer=await r.poll(device);
  assert.equal(answer.job.name,"gridcraft_list_workbooks");
  assert.equal(answer.job.id,id);
  assert.deepEqual(answer.job.args,{});
  assert.ok(!JSON.stringify(answer).includes(TOKEN));
  await r.complete({...device,id,result:{workbooks:[{doc:"book1",title:"Test",dirty:false}]}});
  assert.deepEqual(await pending,{workbooks:[{doc:"book1",title:"Test",dirty:false}]});
});
test("read_range preserves workbook doc and bounded range and returns precise cells",async()=>{
  const r=relay();await ready(r);
  const id=cmd();
  const pending=r.dispatch({verifiedOwner:OWNER,name:"gridcraft_read_range",requestId:id,
   args:{doc:"42",sheet:"估價清單",range:"B3:D3"}});
  const delivery=await r.poll(device);
  assert.deepEqual(delivery.job.args,{doc:"42",sheet:"估價清單",range:"B3:D3"});
  await r.complete({...device,id,result:{values:[[2500,30,75000]],sheet:"估價清單",range:"B3:D3"}});
  assert.deepEqual((await pending).values,[[2500,30,75000]]);
});
test("device offline or unauthorized local GridCraft status blocks remote data",async()=>{
  const r=relay();
  await r.heartbeat({...device,status:"GRIDCRAFT_OFFLINE"});
  assert.equal((await r.dispatch({verifiedOwner:OWNER,name:"gridcraft_status"})).status,"GRIDCRAFT_OFFLINE");
  await denied(()=>r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:cmd()}),"GRIDCRAFT_OFFLINE");
  await r.heartbeat({...device,status:"UNAUTHORIZED"});
  assert.equal((await r.dispatch({verifiedOwner:OWNER,name:"gridcraft_status"})).status,"UNAUTHORIZED");
});
test("deny replay request_id and mismatching completion or second device",async()=>{
  const r=relay();await ready(r);
  const id=cmd();
  const pending=r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:id});
  await r.poll(device);
  await denied(()=>r.complete({...device,id:"not-the-id",result:{values:[]}}),"UNKNOWN_OR_EXPIRED_REQUEST");
  await denied(()=>r.complete({deviceId:ID,deviceToken:"f".repeat(64),id,result:{values:[]}}),"UNAUTHORIZED");
  await r.complete({...device,id,result:{workbooks:[]}});
  await pending;
  await denied(()=>r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:id}),"REPLAY_DENIED");
});
test("busy and result oversize rejected, no automatic replay",async()=>{
  const r=relay();await ready(r);
  const id=cmd();
  const pending=r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:id});
  await r.poll(device);
  await denied(()=>r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:cmd()}),"DEVICE_BUSY");
  await denied(()=>r.complete({...device,id,result:{text:"x".repeat(30000)}}),"RESULT_LIMIT");
  await r.complete({...device,id,result:{workbooks:[]}});
  await pending;
});
test("timeout fail closed; late completion refused; no reopen of old task",async()=>{
  const r=relay({ttlMs:30});
  await ready(r);
  const id=cmd();
  const pending=r.dispatch({verifiedOwner:OWNER,name:"gridcraft_list_workbooks",requestId:id,waitMs:20});
  await r.poll(device);
  await denied(()=>pending,"DEVICE_TIMEOUT");
  await denied(()=>r.complete({...device,id,result:{workbooks:[]}}),"UNKNOWN_OR_EXPIRED_REQUEST");
  const answer=await r.poll(device);
  assert.equal(answer.job,null);
});
test("no job when GridCraft not READY; invalid device heartbeat rejected",async()=>{
  const r=relay();await ready(r);
  await denied(()=>r.heartbeat({...device,status:"APP_OPEN"}),"INVALID_STATUS");
  await r.heartbeat({...device,status:"CONTROL_ERROR"});
  assert.equal((await r.poll(device)).job,null);
});
