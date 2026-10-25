import test from "node:test";
import assert from "node:assert/strict";
import {handleFinanceSiteRequest} from "../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";
import {FINANCE_SITE_TOOLS,validateFinanceSiteTool} from "../supabase/functions/lizhi-finance-site-mcp/site-contract.mjs";
import {handleFinanceSiteMcp} from "../finance/sites/site-worker-adapter.mjs";
const TOKEN="a".repeat(64);
const OWNER="a99f9786-cf6d-45d3-b7c9-7f48df4d1a2a";
const url="https://edge.example/mcp";
const rpc=(method,params={},id=1)=>new Request(url,{method:"POST",
  headers:{"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id,method,params})});
function makeDb() {
  const filter=[];
  const rows=[
    {kind:"accounts",id:"acc",updated_at:"2026-10-25T01:00:00Z",payload:{name:"銀行",initialBalance:1000}},
    {kind:"creditCards",id:"card",updated_at:"2026-10-25T01:01:00Z",payload:{name:"信用卡"}},
    {kind:"categories",id:"cat",updated_at:"2026-10-25T01:02:00Z",payload:{name:"交通"}},
    {kind:"transactions",id:"in",updated_at:"2026-10-25T01:03:00Z",payload:{date:"2026-10-01",type:"income",amount:400,accountId:"acc",note:"secret"}},
    {kind:"transactions",id:"out",updated_at:"2026-10-25T01:04:00Z",payload:{date:"2026-10-02",type:"expense",amount:100,accountId:"acc",categoryId:"cat"}},
    {kind:"transactions",id:"buy",updated_at:"2026-10-25T01:05:00Z",payload:{date:"2026-10-03",type:"credit_card_purchase",amount:500,creditCardId:"card",categoryId:"cat",cardNumber:"sensitive"}},
    {kind:"transactions",id:"pay",updated_at:"2026-10-25T01:06:00Z",payload:{date:"2026-10-04",type:"credit_card_payment",amount:200,creditCardId:"card",fromAccountId:"acc"}}
  ];
  const query={select(){return this},eq(k,v){filter.push([k,v]);return this},
    is(){return this},order(){return this},async range(){return {data:rows,error:null}}};
  return {filter,db:{from(table){assert.equal(table,"lizhi_finance_records");return query}}};
}
async function query(name,args={}) {
  const {db,filter}=makeDb();
  const result=await handleFinanceSiteRequest(rpc("tools/call",{name,arguments:args}),
    {db,token:TOKEN,ownerUid:OWNER});
  const data=await result.json();
  return {result,data,filter};
}
test("FIN-SITE-01 fixed five read-only tool names",()=>{
  assert.deepEqual(FINANCE_SITE_TOOLS.map(t=>t.name),[
    "finance_status","finance_accounts","finance_cards","finance_month_summary","finance_recent_transactions"]);
  assert.ok(FINANCE_SITE_TOOLS.every(t=>t.annotations.readOnlyHint));
  assert.equal(validateFinanceSiteTool("finance_recent_transactions",{limit:21}).ok,false);
  assert.equal(validateFinanceSiteTool("finance_month_summary",{month:"2026-13"}).ok,false);
  assert.equal(validateFinanceSiteTool("finance_status",{ownerUid:OWNER}).ok,false);
  assert.equal(validateFinanceSiteTool("finance_create_transaction",{}).ok,false);
});
test("FIN-SITE-02 missing server secrets fail closed",async()=>{
  const r=await handleFinanceSiteRequest(rpc("tools/list"),{db:makeDb().db,token:"",ownerUid:OWNER});
  assert.equal(r.status,503);
});
test("FIN-SITE-03 unauthenticated and browser requests blocked",async()=>{
  const invalid=new Request(url,{method:"POST",body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/list"})});
  assert.equal((await handleFinanceSiteRequest(invalid,{db:makeDb().db,token:TOKEN,ownerUid:OWNER})).status,401);
  const browser=new Request(url,{method:"POST",headers:{Origin:"https://example.com"}});
  assert.equal((await handleFinanceSiteRequest(browser,{db:makeDb().db,token:TOKEN,ownerUid:OWNER})).status,403);
});
test("FIN-SITE-04 ledger queries always scoped to configured owner",async()=>{
  const {data,filter}=await query("finance_status");
  assert.equal(data.result.structuredContent.counts.transactions,4);
  assert.deepEqual(filter,[["user_id",OWNER]]);
  assert.equal(data.result.structuredContent.read_only,true);
});
test("FIN-SITE-05 balances and card purchase/payment accounting",async()=>{
  assert.equal((await query("finance_accounts")).data.result.structuredContent.accounts[0].balance,1100);
  assert.equal((await query("finance_cards")).data.result.structuredContent.credit_cards[0].outstanding,300);
  const s=(await query("finance_month_summary",{month:"2026-10"})).data.result.structuredContent;
  assert.equal(s.income,400);assert.equal(s.expense,600);assert.equal(s.credit_card_payments,200);
  assert.equal(s.income_minus_expense,-200);
});
test("FIN-SITE-06 recent transactions exclude freeform notes and card numbers",async()=>{
  const s=(await query("finance_recent_transactions",{limit:20})).data.result.structuredContent;
  assert.equal(s.transactions.length,4);
  assert.doesNotMatch(JSON.stringify(s),/secret|sensitive|cardNumber|note/i);
});
test("FIN-SITE-07 Sites adapter denies unknown/missing owner principal",async()=>{
  const req=new Request(url,{method:"POST",body:"{}"});
  const env={SITE_FINANCE_OWNER_EMAIL:"owner@example.com",LIZHI_FINANCE_SITE_MCP_TOKEN:TOKEN};
  assert.equal((await handleFinanceSiteMcp(req.clone(),env)).status,403);
  assert.equal((await handleFinanceSiteMcp(req.clone(),env,{verifyOwner:async()=>null})).status,403);
  assert.equal((await handleFinanceSiteMcp(req.clone(),env,{verifyOwner:async()=> "other@example.com"})).status,403);
});
test("FIN-SITE-08 Sites adapter forwards owner-only token once, no redirects",async()=>{
  const env={SITE_FINANCE_OWNER_EMAIL:"owner@example.com",LIZHI_FINANCE_SITE_MCP_TOKEN:TOKEN};
  let n=0;
  const got=await handleFinanceSiteMcp(new Request(url,{method:"POST",body:"{}"}),env,{
    verifyOwner:async()=> "OWNER@example.com",
    fetchImpl:async(_url,options)=>{
      n++;
      assert.equal(_url,"https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-finance-site-mcp");
      assert.equal(options.headers.get("authorization"),"Bearer "+TOKEN);
      assert.equal(options.headers.get("cookie"),null);
      assert.equal(options.redirect,"manual");
      return new Response("{}",{status:200,headers:{"Content-Type":"application/json"}});
    }
  });
  assert.equal(got.status,200);assert.equal(n,1);
});
