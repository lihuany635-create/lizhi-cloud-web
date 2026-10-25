import test from "node:test";
import assert from "node:assert/strict";
import {handleFinanceSiteRequest} from "../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";
import {FINANCE_SITE_TOOLS,FINANCE_UI_SITE_TOOLS,FINANCE_CLOUD_TOOLS} from "../supabase/functions/lizhi-finance-site-mcp/site-contract.mjs";
const TOKEN="a".repeat(64);
const OWNER="84b34232-26ed-49c2-b160-e7fdbf80e8cf";
const request=(method,params={})=>new Request("https://finance.invalid/mcp",{
  method:"POST",headers:{"Authorization":"Bearer "+TOKEN},
  body:JSON.stringify({jsonrpc:"2.0",id:99,method,params})
});
const db={from:()=>{throw Error("must not read finance records in capabilities check")},
  rpc:()=>{throw Error("retired UI function must not reach SQL")}};
async function invoke(method,params={}){
  const r=await handleFinanceSiteRequest(request(method,params),{db,token:TOKEN,ownerUid:OWNER});
  return (await r.json()).result;
}
test("FIN-SITE-RETIRE-01 advertise exactly five read and two cloud tools",async()=>{
  const result=await invoke("tools/list");
  const names=result.tools.map(x=>x.name);
  assert.deepEqual(names,[...FINANCE_SITE_TOOLS,...FINANCE_CLOUD_TOOLS].map(x=>x.name));
  assert.equal(names.length,7);
  for(const old of FINANCE_UI_SITE_TOOLS)assert.equal(names.includes(old.name),false);
});
test("FIN-SITE-RETIRE-02 old UI sessions/inspect/action/jobs refuse all remote calls",async()=>{
  for(const old of FINANCE_UI_SITE_TOOLS){
    const result=await invoke("tools/call",{name:old.name,arguments:{}});
    assert.equal(result.isError,true);
    assert.equal(result.content[0].text,"FINANCE_UI_RETIRED_USE_CLOUD");
  }
});
test("FIN-SITE-RETIRE-03 no arbitrary methods exposed after retirement",async()=>{
  const r=await invoke("tools/call",{name:"finance_ui_eval",arguments:{script:"1+1"}});
  assert.equal(r.isError,true);
  assert.equal(r.content[0].text,"FINANCE_UNKNOWN_TOOL");
});
