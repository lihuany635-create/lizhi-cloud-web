import {test} from "node:test";
import assert from "node:assert/strict";
import {meterPayload} from "./lizhi-usage-payload.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const event=(patch={})=>meterPayload({
  source:"lizhi-ai-workbench",route:"/mcp",statusCode:200,
  decision:"allow",requestId:id,requestHeaders:new Headers(),
  responseHeaders:new Headers(),durationMs:15,...patch
});
test("valid event has only non-sensitive metadata",()=>{
  const x=event();
  assert.equal(x.source,"lizhi-ai-workbench");
  assert.equal(x.route,"/mcp");
  assert.equal(x.request_id,id);
  assert.equal(x.request_bytes,null);
  assert.equal(x.response_bytes,null);
  assert.deepEqual(Object.keys(x).sort(),[
    "decision","duration_ms","request_bytes","request_id","response_bytes","route","source","status_code"
  ].sort());
});
test("counts content-length when present",()=>{
  const x=event({requestHeaders:new Headers({"Content-Length":"103"}),responseHeaders:new Headers({"Content-Length":"0"})});
  assert.equal(x.request_bytes,103);assert.equal(x.response_bytes,0);
});
test("unknown and malformed lengths are null not fake zero",()=>{
  const x=event({responseHeaders:new Headers({"Content-Length":"abc"})});
  assert.equal(x.response_bytes,null);
});
test("oversized Content-Length is unknown and cannot overflow",()=>{
  const x=event({requestHeaders:new Headers({"Content-Length":"9999999999999999"})});
  assert.equal(x.request_bytes,null);
});
test("rejects untrusted raw route with secrets in query string",()=>{
  assert.throws(()=>event({route:"/mcp?access_token=secret"}),/static/);
});
test("rejects paths with personal data spaces",()=>{
  assert.throws(()=>event({route:"/private/my friend"}),/static/);
});
test("allows bounded static parameter template",()=>{
  assert.equal(event({route:"/task/:id"}).route,"/task/:id");
});
test("rejects invalid source name",()=>{
  assert.throws(()=>event({source:"a/b"}),/static/);
});
test("rejects invalid decision",()=>{
  assert.throws(()=>event({decision:"unsafe"}),/decision/);
});
test("preserves block versus throttle classifications",()=>{
  assert.equal(event({decision:"block"}).decision,"block");
  assert.equal(event({decision:"throttle"}).decision,"throttle");
});
test("clamps long duration to schema limit",()=>{
  assert.equal(event({durationMs:99999999}).duration_ms,3600000);
});
test("requires valid UUID and HTTP status",()=>{
  assert.throws(()=>event({requestId:"abc"}),/request ID/);
  assert.throws(()=>event({statusCode:600}),/HTTP status/);
});
