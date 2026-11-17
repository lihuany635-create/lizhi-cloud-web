import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const require=createRequire(import.meta.url);
const Domain=require("../budget/budget-domain.js");
const Backup=require("../domain/backup.js");
const Local=require("../budget/budget-local-store.js");
const Cloud=require("../budget/budget-cloud-store.js");
const Sync=require("../budget/budget-sync.js");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const budget=(amount,categoryId=null,month="2026-11")=>({
  id:"b-"+(categoryId??"total"),month,categoryId,currency:"TWD",amount
});
const tx=(id,type,amount,categoryId,date="2026-11-16",rest={})=>({
  id,type,amount,categoryId,date,...rest
});
const calculate=(rows=[],budgets=[budget(10000)],extra={})=>Domain.summary({
  month:"2026-11",transactions:rows,budgets,
  categories:[{id:"food",name:"餐飲"},{id:"shopping",name:"購物"}],...extra
});
test("BP1-01 zero expense and missing total budget are distinct",()=>{
  const a=calculate([],[]);assert.equal(a.configured,false);assert.equal(a.budget,null);
  assert.equal(a.status,"unset");assert.equal(a.remaining,null);
});
test("BP1-02 a zero budget with no spending is normal",()=>{
  const a=calculate([],[budget(0)]);assert.equal(a.status,"normal");assert.equal(a.percentage,0);
});
test("BP1-03 a zero budget with spending has no division by zero",()=>{
  const a=calculate([tx("x","expense",1,"food")],[budget(0)]);
  assert.equal(a.status,"over");assert.equal(a.remaining,-1);assert.equal(a.percentage,null);
});
test("BP1-04 normal threshold below 80 percent",()=>assert.equal(Domain.state({amount:100},79),"normal"));
test("BP1-05 exactly 80 percent triggers warning",()=>assert.equal(Domain.state({amount:100},80),"warning"));
test("BP1-06 99 percent remains warning",()=>assert.equal(Domain.state({amount:100},99),"warning"));
test("BP1-07 exactly 100 percent triggers limit",()=>assert.equal(Domain.state({amount:100},100),"limit"));
test("BP1-08 above 100 percent triggers over",()=>assert.equal(Domain.state({amount:100},101),"over"));
test("BP1-09 income, transfer and credit card payment never double count",()=>{
  const rows=[tx("income","income",5000,"salary"),tx("move","transfer",7000,null),
    tx("purchase","credit_card_purchase",3000,"shopping"),
    tx("payment","credit_card_payment",3000,null),
    tx("meal","expense",2000,"food")];
  const a=calculate(rows);
  assert.equal(a.used,5000);assert.equal(a.counted_transactions,2);
});
test("BP1-10 separate transfer fee expense counts, principal does not",()=>{
  const rows=[tx("transfer","transfer",30000,null),
    tx("fee","expense",15,"fees")];
  assert.equal(calculate(rows).used,15);
});
test("BP1-11 a transaction in another month does not consume this month",()=>{
  assert.equal(calculate([tx("old","expense",500,"food","2026-10-30")]).used,0);
});
test("BP1-12 soft-deleted transactions do not count",()=>{
  assert.equal(calculate([tx("deleted","expense",800,"food","2026-11-01",{deletedAt:"2026-11-05"})]).used,0);
});
test("BP1-13 uncategorized consumption still counts toward total",()=>{
  const a=calculate([tx("lost","expense",123,null)]);
  assert.equal(a.used,123);
  assert.equal(a.by_category.find(x=>x.category_id===null).used,123);
});
test("BP1-14 category budget and total are different views, not double spend",()=>{
  const a=calculate([tx("a","expense",2000,"food")],[budget(10000),budget(3000,"food")]);
  assert.equal(a.used,2000);assert.equal(a.by_category.find(x=>x.category_id==="food").used,2000);
});
test("BP1-15 a category without an assigned budget remains unconfigured",()=>{
  const a=calculate([tx("a","expense",100,"shopping")]);
  assert.equal(a.by_category.find(x=>x.category_id==="shopping").configured,false);
});
test("BP1-16 archived/deleted budget rows are ignored",()=>{
  const a=calculate([],[{...budget(1000),deletedAt:"2026-11-16"}]);assert.equal(a.configured,false);
});
test("BP1-17 duplicate total/category scope is rejected",()=>{
  assert.throws(()=>calculate([],[budget(100),{...budget(200),id:"other"}]),/DUPLICATE_BUDGET_SCOPE/);
});
test("BP1-18 malformed budget month or negative amount is rejected",()=>{
  assert.throws(()=>Domain.validateBudget({month:"2026-13",currency:"TWD",amount:12}),/INVALID_BUDGET_MONTH/);
  assert.throws(()=>Domain.validateBudget({month:"2026-11",currency:"TWD",amount:-1}),/INVALID_BUDGET_AMOUNT/);
});
test("BP1-19 unsupported currency is rejected for a budget setting",()=>{
  assert.throws(()=>Domain.validateBudget({month:"2026-11",currency:"USD",amount:1}),/UNSUPPORTED_BUDGET_CURRENCY/);
});
test("BP1-20 foreign currency is not silently counted as TWD",()=>{
  const a=calculate([tx("usd","expense",300,"food","2026-11-17",{accountId:"fx"})],undefined,
    {accounts:[{id:"fx",currency:"USD"}]});
  assert.equal(a.used,0);assert.equal(a.excluded_foreign_currency,1);
});
test("BP1-21 non-integer transactions are rejected rather than silently rounded",()=>{
  assert.throws(()=>calculate([tx("x","expense",12.2,"food")]),/INVALID_BUDGET_TRANSACTION/);
});
test("BP1-22 overflow is rejected",()=>{
  assert.throws(()=>calculate([
    tx("x","expense",Number.MAX_SAFE_INTEGER,"food"),
    tx("y","expense",1,"food")
  ]),/BUDGET_AMOUNT_OVERFLOW/);
});
test("BP1-23 copying budgets creates fresh IDs without overwriting the source",()=>{
  let counter=0;const source=[budget(1000),budget(400,"food")];
  const copy=Domain.copyMonthBudgets({budgets:source,fromMonth:"2026-11",
    toMonth:"2026-12",idFactory:()=>String(++counter)});
  assert.equal(copy.length,2);assert.ok(copy.every(x=>x.dirty&&x.version===0));
  assert.equal(copy[0].month,"2026-12");assert.equal(source[0].month,"2026-11");
});
test("BP1-24 local schema migrates additively to v2",()=>{
  const src=read("finance/storage/finance-db.js");
  assert.match(src,/DB_VERSION=2/);assert.match(src,/if\(event\.oldVersion<1\)/);
  assert.match(src,/if\(event\.oldVersion<2\)/);assert.match(src,/createObjectStore\("budgets"/);
  assert.match(src,/scopeKey/);
});
test("BP1-25 backup v2 retains budget rows",()=>{
  const data=Object.fromEntries(Backup.COLLECTIONS.map(x=>[x,[]]));
  data.budgets=[Local.create({id:"budget01",month:"2026-11",amount:5000})];
  const file=Backup.createBackupEnvelope(data,"2026-11-17T00:00:00.000Z");
  assert.equal(file.schemaVersion,2);
  assert.equal(Backup.createImportPreview(file).counts.budgets,1);
});
test("BP1-26 legacy v1 backup is accepted as a zero-budget preview",()=>{
  const data=Object.fromEntries(Backup.COLLECTIONS.filter(x=>x!=="budgets").map(x=>[x,[]]));
  const file={format:"lizhi-finance-backup",schemaVersion:1,
    exportedAt:"2026-11-17T00:00:00.000Z",data};
  const preview=Backup.createImportPreview(file);
  assert.equal(preview.valid,true);assert.equal(preview.envelope.schemaVersion,2);
  assert.deepEqual(preview.envelope.data.budgets,[]);
});
test("BP1-27 local scope keys distinguish total and categorized budgets",()=>{
  assert.notEqual(Local.scopeKey(budget(1000)),Local.scopeKey(budget(1000,"food")));
});
test("BP1-28 budget cloud table uses an owner-scoped dedicated table",()=>{
  assert.equal(Cloud.TABLE,"lizhi_finance_budgets");
  const sql=read("finance/budget/sql/p1-budgets-candidate.sql");
  assert.match(sql,/enable row level security/);
  assert.match(sql,/finance_budgets_allowlist/);
  assert.match(sql,/lizhi_finance_budget_total_unique/);
  assert.match(sql,/lizhi_finance_budget_category_unique/);
});
test("BP1-29 clean remote budget can be pulled into local store",async()=>{
  const pulled=[],remote={id:"r",month:"2026-11",currency:"TWD",version:1,amount:1000};
  const sync=Sync.create({
    local:{list:async()=>[],applyRemote:async r=>pulled.push(r)},
    cloud:{list:async()=>[remote]}});
  const res=await sync.sync();
  assert.equal(res.ok,true);assert.equal(res.applied,1);assert.equal(pulled[0].id,"r");
});
test("BP1-30 dirty local change with a stale version is never overwritten",async()=>{
  let updates=0,applies=0;
  const sync=Sync.create({
    local:{list:async()=>[{id:"x",month:"2026-11",dirty:true,version:1,
      amount:900,updatedAt:"1"}],applyRemote:async()=>applies++},
    cloud:{list:async()=>[{id:"x",version:2,month:"2026-11"}],
      update:async()=>updates++}});
  const res=await sync.sync();
  assert.equal(res.ok,false);assert.equal(res.conflicts.length,1);
  assert.equal(updates,0);assert.equal(applies,0);
});
test("BP1-31 new local budget creates one cloud row and reads back",async()=>{
  const synced=[];
  const row={id:"x",month:"2026-11",currency:"TWD",categoryId:null,
    amount:100,dirty:true,version:0,updatedAt:"now"};
  const sync=Sync.create({
    local:{list:async()=>[row],markSynced:async (...args)=>synced.push(args)},
    cloud:{list:async()=>[],create:async()=>({id:"x",version:1})}});
  const res=await sync.sync();
  assert.equal(res.ok,true);assert.equal(res.uploaded,1);
  assert.equal(synced[0][0],"x");
});
