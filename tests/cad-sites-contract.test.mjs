import test from "node:test";
import assert from "node:assert/strict";
import {CAD_SITE_TOOLS,validateCadSiteTool,SITE_CAD_ENDPOINT} from "../cad/sites/cad-site-contract.mjs";
import {handleCadSiteTool} from "../sites-migration/cad/site-tools.mjs";
import {readBoundedBody} from "../supabase/functions/lizhi-cad-site-mcp/bounded-body.mjs";
const owner={signedIn:true,verifiedUserEmail:"owner@example.test"};
const secrets={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64)};
const sid="11111111-1111-4111-8111-111111111111";
const request_id="22222222-2222-4222-8222-222222222222";
const job_id="33333333-3333-4333-8333-333333333333";
const rectangle={session_id:sid,request_id,p1:[0,0],p2:[800,900]};
test("tool schemas and geometry restrictions",()=>{
 assert.equal(CAD_SITE_TOOLS.length,6);
 assert.equal(validateCadSiteTool("cad_draw_rectangle",rectangle).ok,true);
 assert.equal(validateCadSiteTool("cad_draw_rectangle",{...rectangle,p2:[Infinity,900]}).ok,false);
 assert.equal(validateCadSiteTool("cad_draw_circle",{session_id:sid,request_id,center:[0,0],radius:-1}).ok,false);
 assert.equal(validateCadSiteTool("cad_new_drawing",{session_id:sid,request_id,unexpected:true}).ok,false);
});
test("unverified Site owner cannot invoke upstream",async()=>{
 let calls=0;
 for(const auth of [{signedIn:false,verifiedUserEmail:owner.verifiedUserEmail},{signedIn:true,verifiedUserEmail:"other@example.test"}]){
  const res=await handleCadSiteTool("cad_status",{},auth,secrets,async()=>{calls++;throw Error("unexpected")});
  assert.equal(res.isError,true);
 }
 assert.equal(calls,0);
});
function mockedServer(value,onCall=()=>{}){
 return async(url,options)=>{
  assert.equal(url,SITE_CAD_ENDPOINT);
  assert.equal(options.method,"POST");
  assert.equal(options.redirect,"error");
  assert.equal(options.headers.Authorization,"Bearer "+secrets.siteMcpToken);
  const p=JSON.parse(options.body);onCall(p);
  return Response.json({jsonrpc:"2.0",id:p.id,result:{isError:false,content:[{type:"text",text:JSON.stringify(value)}]}});
 };
}
test("rectangle writes one job and reports queued, not completed",async()=>{
 let n=0;
 const r=await handleCadSiteTool("cad_draw_rectangle",rectangle,owner,secrets,mockedServer({ok:true,job_id,queued:true,completed:false},()=>n++));
 assert.equal(n,1);assert.equal(r.isError,false);
 const v=JSON.parse(r.content[0].text);
 assert.equal(v.completed,false);assert.equal(v.automaticRetryAllowed,false);
});
test("status sanitizes session details",async()=>{
 const r=await handleCadSiteTool("cad_status",{},owner,secrets,mockedServer({ok:true,online:true,sessions:[{session_id:sid,last_seen:"2026-10-25T12:00:00Z",extra:"invisible"}]}));
 assert.equal(r.isError,false);assert.ok(!r.content[0].text.includes("invisible"));
});
test("job completion verified separately",async()=>{
 const r=await handleCadSiteTool("cad_job_status",{job_id},owner,secrets,mockedServer({ok:true,job:{job_id,state:"succeeded",result:{ignored:"yes"}}}));
 assert.equal(r.isError,false);
 const v=JSON.parse(r.content[0].text);assert.equal(v.completed,true);assert.equal(v.state,"succeeded");
 assert.ok(!r.content[0].text.includes("ignored"));
});
test("unknown upstream result never retries a mutation",async()=>{
 let n=0;const r=await handleCadSiteTool("cad_draw_rectangle",rectangle,owner,secrets,async()=>{n++;throw Error("lost")});
 assert.equal(r.isError,true);assert.equal(n,1);assert.match(r.content[0].text,/DO_NOT_RETRY/);
});

test("edge request guard enforces UTF-8 byte limit with or without header",async()=>{
 const make=(body,headers={})=>new Request("https://cad.invalid/mcp",{method:"POST",headers,body});
 assert.equal(await readBoundedBody(make('{"ping":true}')),'{"ping":true}');
 assert.equal(await readBoundedBody(make("{}",{"content-length":"2"})),"{}");
 await assert.rejects(readBoundedBody(make("字".repeat(6000))),/BODY_TOO_LARGE/);
 await assert.rejects(readBoundedBody(make("{}",{"content-length":"16385"})),/BODY_TOO_LARGE/);
 await assert.rejects(readBoundedBody(make("{}",{"content-length":"not-a-number"})),/BODY_TOO_LARGE/);
});

test("CAD browser relay UI must use the private Site MCP entry, not obsolete Plugin OAuth",async()=>{
 const {readFile}=await import("node:fs/promises");
 const {fileURLToPath}=await import("node:url");
 const {resolve,dirname}=await import("node:path");
 const host=await readFile(resolve(dirname(fileURLToPath(import.meta.url)),"../cad/cad-host.js"),"utf8");
 assert.ok(host.includes("私人「立之 CAD 指令代理」Site"));
 assert.ok(host.includes("六個 MCP 工具已載入"));
 assert.equal(host.includes("Plugin 完成 OAuth 授權"),false);
});
