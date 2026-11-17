import test from "node:test";
import assert from "node:assert/strict";
import {handleFinanceSiteRequest} from "../../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";
import {FINANCE_BUDGET_TOOLS,validateFinanceBudgetTool} from "../../supabase/functions/lizhi-finance-site-mcp/finance-budget-contract.mjs";
const TOKEN="a".repeat(64),OWNER="11111111-1111-4111-8111-111111111111",OTHER="22222222-2222-4222-8222-222222222222";
const REQUEST_ID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const URL="https://finance-edge.test/mcp";
const frame=(method,params={},id=1,bearer=TOKEN)=>new Request(URL,{
  method:"POST",headers:{"authorization":"Bearer "+bearer,"content-type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id,method,params})});
const row=(amount=2000)=>({id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  user_id:OWNER,month:"2026-11",category_id:null,currency:"TWD",amount,version:1,
  updated_at:"2026-11-17T00:00:00Z",deleted_at:null});
function fake({settings=[row()],spend={month:"2026-11",currency:"TWD",used:1800,
  by_category:[{category_id:"food",used:1300}],counted_transactions:2,excluded_foreign_currency:1},
  categories=[{id:"food",payload:{name:"餐飲",type:"expense"}}],
  setReceipt=null,setError=null}={}){
  const calls=[];
  const db={
    from(name){
      calls.push({type:"from",name,where:[]});
      const call=calls.at(-1);
      const q={select(fields){call.fields=fields;return q;},
        eq(k,v){call.where.push([k,v]);return q;},is(k,v){call.where.push([k,v]);return q;},
        order(){return q;},async range(){return {data:name==="lizhi_finance_budgets"?settings:categories,error:null}}};
      return q;
    },async rpc(name,args){
      calls.push({type:"rpc",name,args});
      if(name==="lizhi_finance_budget_site_spending")return {data:spend,error:null};
      if(name==="lizhi_finance_budget_site_set")return setError?
        {data:null,error:{message:setError}}:
        {data:setReceipt??{status:"created",request_id:REQUEST_ID,budget:{
          id:row().id,month:"2026-11",category_id:null,currency:"TWD",
          amount:0,version:1,updated_at:"2026-11-17T00:00:00Z"}},error:null};
      throw new Error("UNEXPECTED_RPC");
    }
  };
  return {db,calls};
}
async function invoke(name,args={},db=fake().db,auth=TOKEN){
  const response=await handleFinanceSiteRequest(frame("tools/call",{name,arguments:args},1,auth),
    {db,token:TOKEN,ownerUid:OWNER});
  return {status:response.status,body:await response.json()};
}
const write=(overrides={})=>({
  request_id:REQUEST_ID,month:"2026-11",scope:"total",
  action:"set",amount:0,expected_version:0,...overrides
});
test("P3-01 exact three budget tool names; existing seven are unchanged",async()=>{
  assert.deepEqual(FINANCE_BUDGET_TOOLS.map(x=>x.name),[
    "finance_budget_summary","finance_budget_categories","finance_budget_set"]);
  const {db}=fake();
  const r=await handleFinanceSiteRequest(frame("tools/list"),{db,token:TOKEN,ownerUid:OWNER});
  const list=(await r.json()).result.tools.map(x=>x.name);
  assert.deepEqual(list.slice(0,7),["finance_status","finance_accounts","finance_cards",
    "finance_month_summary","finance_recent_transactions",
    "finance_references","finance_create_transaction"]);
  assert.deepEqual(list.slice(7),FINANCE_BUDGET_TOOLS.map(x=>x.name));
});
test("P3-02 no caller owner or arbitrary fields",()=>{
  assert.equal(validateFinanceBudgetTool("finance_budget_set",{...write(),ownerUid:OTHER}).ok,false);
  assert.equal(validateFinanceBudgetTool("finance_budget_summary",{month:"2026-11",user_id:OTHER}).ok,false);
});
test("P3-03 invalid dates, currency and amounts are rejected",()=>{
  assert.equal(validateFinanceBudgetTool("finance_budget_summary",{month:"2026-13"}).ok,false);
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({amount:-1})).ok,false);
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({amount:2**53})).ok,false);
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({currency:"USD"})).ok,false);
});
test("P3-04 strict category and remove scopes",()=>{
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({scope:"category"})).ok,false);
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({category_id:"food"})).ok,false);
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({scope:"category",category_id:"food"})).ok,true);
  assert.equal(validateFinanceBudgetTool("finance_budget_set",write({action:"remove",amount:0})).ok,false);
  const args=write({action:"remove"});delete args.amount;
  assert.equal(validateFinanceBudgetTool("finance_budget_set",args).ok,true);
});
test("P3-05 missing token and cross-browser Origin blocked before any DB query",async()=>{
  const x=fake();
  const bad=await invoke("finance_budget_summary",{month:"2026-11"},x.db,"b".repeat(64));
  assert.equal(bad.status,401);
  assert.equal(x.calls.length,0);
  const browser=new Request(URL,{method:"POST",headers:{"Origin":"https://attacker.test"}});
  const forbidden=await handleFinanceSiteRequest(browser,{db:x.db,token:TOKEN,ownerUid:OWNER});
  assert.equal(forbidden.status,403);
});
test("P3-06 zero budget is configured, over-limit math avoids divide by zero",async()=>{
  const x=fake({settings:[row(0)]});
  const result=(await invoke("finance_budget_summary",{month:"2026-11"},x.db)).body.result.structuredContent;
  assert.equal(result.budget.configured,true);
  assert.equal(result.budget.amount,0);
  assert.equal(result.used,1800);
  assert.equal(result.state,"over");
  assert.equal(result.percentage,null);
  assert.equal(result.remaining,-1800);
  assert.ok(x.calls.every(c=>c.type!=="from"||!c.fields.includes("note")));
});
test("P3-07 no budget is null not zero and not over-limit",async()=>{
  const r=(await invoke("finance_budget_summary",{month:"2026-11"},fake({settings:[]}).db)).body.result.structuredContent;
  assert.equal(r.budget.configured,false);assert.equal(r.budget.amount,null);
  assert.equal(r.state,"not_configured");
});
test("P3-08 two queries return a bounded cloud snapshot",async()=>{
  const x=fake();
  const r=(await invoke("finance_budget_summary",{month:"2026-11"},x.db)).body.result.structuredContent;
  assert.equal(x.calls.length,2);
  assert.deepEqual(x.calls[0].where,[["user_id",OWNER],["month","2026-11"],["currency","TWD"]]);
  assert.equal(x.calls[1].name,"lizhi_finance_budget_site_spending");
  assert.equal(x.calls[1].args.p_owner,OWNER);
  assert.equal(r.used,1800);
});
test("P3-09 categories returned without transaction memos",async()=>{
  const x=fake();
  const r=(await invoke("finance_budget_categories",{month:"2026-11"},x.db)).body.result.structuredContent;
  assert.equal(r.categories.length,1);
  assert.equal(r.categories[0].name,"餐飲");
  assert.equal(r.categories[0].used,1300);
  assert.equal(r.categories[0].budget.amount,null);
  assert.doesNotMatch(JSON.stringify(r),/accountId|cardNumber|secretNote/);
});
test("P3-10 service RPC write passes fixed owner and CAS version",async()=>{
  const x=fake();
  const r=(await invoke("finance_budget_set",write(),x.db)).body.result.structuredContent;
  assert.equal(r.committed,true);
  assert.equal(r.status,"created");
  assert.deepEqual(x.calls.map(c=>c.name),["lizhi_finance_budget_site_set"]);
  assert.equal(x.calls[0].args.p_owner,OWNER);
  assert.equal(x.calls[0].args.p_amount,0);
  assert.equal(x.calls[0].args.p_expected_version,0);
});
test("P3-11 modified request id, stale CAS and invalid category are safe failures",async()=>{
  for(const [error,expected] of [
    ["BUDGET_VERSION_CONFLICT","BUDGET_VERSION_CONFLICT"],
    ["BUDGET_DUPLICATE_REQUEST","BUDGET_DUPLICATE_REQUEST"],
    ["BUDGET_CATEGORY_NOT_FOUND","BUDGET_CATEGORY_NOT_FOUND"]]){
    const x=fake({setError:error});
    const result=(await invoke("finance_budget_set",write(),x.db)).body.result;
    assert.equal(result.isError,true);
    assert.equal(result.content[0].text,expected);
  }
});
test("P3-12 untrusted cloud row belonging to another owner is rejected",async()=>{
  const x=fake({settings:[{...row(),user_id:OTHER}]});
  const result=(await invoke("finance_budget_summary",{month:"2026-11"},x.db)).body.result;
  assert.equal(result.isError,true);
  assert.equal(result.content[0].text,"BUDGET_INVALID_REMOTE_OWNER");
});
test("P3-13 credentials must be valid even to list tools",async()=>{
  const res=await handleFinanceSiteRequest(frame("tools/list"),{db:fake().db,token:"",ownerUid:OWNER});
  assert.equal(res.status,503);
});
test("P3-14 write rejects missing version before contacting database",async()=>{
  const x=fake(),bad=write();delete bad.expected_version;
  const r=(await invoke("finance_budget_set",bad,x.db)).body.result;
  assert.equal(r.isError,true);
  assert.equal(x.calls.length,0);
});
