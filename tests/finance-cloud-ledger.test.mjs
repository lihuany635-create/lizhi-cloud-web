import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {FINANCE_CLOUD_TOOLS,validateFinanceCloudTool} from "../supabase/functions/lizhi-finance-site-mcp/site-contract.mjs";
import {handleFinanceSiteRequest} from "../supabase/functions/lizhi-finance-site-mcp/edge-core.mjs";

const OWNER="84b34232-26ed-49c2-b160-e7fdbf80e8cf";
const REQUEST_ID="a08265bb-a1aa-4cdf-b767-1eb7a49c3e53";
const TOKEN="a".repeat(64);
const action=(name,args={})=>new Request("https://finance.invalid/mcp",{method:"POST",
  headers:{"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id:4,method:"tools/call",params:{name,arguments:args}})});
const txn=(type,overrides={})=>({
  type,amount:850,date:"2026-10-26",
  ...(type==="credit_card_purchase"?{creditCardId:"card-1",categoryId:"transport"}:
  type==="credit_card_payment"?{fromAccountId:"bank-1",creditCardId:"card-1"}:
  type==="transfer"?{fromAccountId:"bank-1",toAccountId:"cash-1"}:
  {accountId:"bank-1",categoryId:type==="income"?"salary":"transport"}),
  ...overrides
});
async function run(name,args,db){
  const response=await handleFinanceSiteRequest(action(name,args),{db,token:TOKEN,ownerUid:OWNER});
  return (await response.json()).result;
}
test("FIN-CLOUD-01 browser-free cloud tools are explicitly available",()=>{
  assert.deepEqual(FINANCE_CLOUD_TOOLS.map(x=>x.name),["finance_references","finance_create_transaction"]);
  assert.equal(FINANCE_CLOUD_TOOLS[0].annotations.readOnlyHint,true);
  assert.equal(FINANCE_CLOUD_TOOLS[1].annotations.readOnlyHint,false);
});
test("FIN-CLOUD-02 validate all five independent transaction types",()=>{
  for(const type of ["income","expense","transfer","credit_card_purchase","credit_card_payment"]){
    const r=validateFinanceCloudTool("finance_create_transaction",{request_id:REQUEST_ID,transaction:txn(type)});
    assert.equal(r.ok,true,type);
  }
});
test("FIN-CLOUD-03 reject wrong date, missing references, unknown keys, payment with category and aliases",()=>{
  const base={request_id:REQUEST_ID,transaction:txn("expense")};
  for(const item of [
    {...base,transaction:txn("expense",{date:"2026-02-30"})},
    {...base,transaction:txn("expense",{amount:0})},
    {...base,transaction:txn("expense",{amount:2.7})},
    {...base,transaction:txn("expense",{categoryId:undefined})},
    {...base,transaction:txn("expense",{evil_sql:"DELETE"})},
    {...base,transaction:txn("expense",{user_id:OWNER})},
    {...base,transaction:txn("credit_card_payment",{categoryId:"food"})},
    {...base,transaction:txn("credit_card_payment",{accountId:"bank-1"})},
    {...base,transaction:txn("transfer",{toAccountId:"bank-1"})},
    {...base,transaction:txn("expense",{note:"x".repeat(241)})},
    {...base,user_id:OWNER}
  ]) assert.equal(validateFinanceCloudTool("finance_create_transaction",item).ok,false,
    JSON.stringify(item));
});
test("FIN-CLOUD-04 model cannot choose owner, RPC receives fixed server owner",async()=>{
  const calls=[];
  const db={from:()=>{throw Error("should not read ledger on write")},rpc:async(name,args)=>{
    calls.push({name,args});
    return {data:{status:"created",id:"cloud-a1",type:"expense",amount:850,date:"2026-10-26"},error:null};}};
  const r=await run("finance_create_transaction",{request_id:REQUEST_ID,transaction:txn("expense")},db);
  assert.equal(r.structuredContent.committed,true);
  assert.equal(r.structuredContent.id,"cloud-a1");
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0],{name:"lizhi_finance_cloud_create_transaction",
    args:{p_owner:OWNER,p_request_id:REQUEST_ID,p_data:txn("expense")}});
});
test("FIN-CLOUD-05 no ledger success on invalid or rejected RPC",async()=>{
  const db={from:()=>{throw Error("no read")},rpc:async()=>({data:null,error:{message:"FINANCE_CLOUD_CARD_OVERPAYMENT"}})};
  const r=await run("finance_create_transaction",{request_id:REQUEST_ID,transaction:txn("credit_card_payment")},db);
  assert.equal(r.isError,true);
  assert.equal(r.content[0].text,"FINANCE_CLOUD_CARD_OVERPAYMENT");
  const invalid=await run("finance_create_transaction",{request_id:REQUEST_ID,transaction:txn("expense",{amount:0})},db);
  assert.equal(invalid.isError,true);
});
test("FIN-CLOUD-06 owner scoped references expose no sensitive payload",async()=>{
  const filters=[];
  const rows=[
    {kind:"accounts",id:"bank-1",payload:{name:"銀行",initialBalance:2000,secret:"hidden"}},
    {kind:"creditCards",id:"card-1",payload:{name:"台新卡",cardNumber:"hidden"}},
    {kind:"categories",id:"transport",payload:{name:"交通",type:"expense"}},
    {kind:"categories",id:"salary",payload:{name:"薪資",type:"income",archived:true}},
  ].map((r,i)=>({...r,updated_at:"2026-10-26T00:00:00Z"}));
  const q={select(){return this},eq(k,v){filters.push([k,v]);return this},
    is(){return this},order(){return this},async range(){return {data:rows,error:null}}};
  const db={from:()=>q};
  const r=await run("finance_references",{},db);
  assert.equal(r.structuredContent.credit_cards[0].name,"台新卡");
  assert.equal(r.structuredContent.categories.length,1);
  assert.deepEqual(filters,[["user_id",OWNER]]);
  assert.doesNotMatch(JSON.stringify(r),/hidden|cardNumber|secret/);
});
test("FIN-CLOUD-07 SQL confines writes to owner, locks request and prevents replay",()=>{
  const sql=fs.readFileSync(new URL("../supabase/migrations/20261026001000_lizhi_finance_cloud_transactions.sql",import.meta.url),"utf8");
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/primary key\(user_id,request_id\)/);
  assert.match(sql,/owner_role <> 'service_role'/);
  assert.match(sql,/previous\.intent<>p_data/);
  assert.match(sql,/grant execute on function public\.lizhi_finance_cloud_create_transaction[\s\S]+?to service_role/);
  assert.doesNotMatch(sql,/grant execute on function public\.lizhi_finance_cloud_create_transaction[\s\S]+?to authenticated/);
  assert.doesNotMatch(sql,/\b(?:delete from|update)\s+public\.lizhi_finance_records\b/i);
});
