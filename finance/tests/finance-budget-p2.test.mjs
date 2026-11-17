import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const require=createRequire(import.meta.url);
const Ui=require("../budget/budget-ui.js");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const budgets=[
 {id:"total",month:"2026-11",categoryId:null,amount:10000,currency:"TWD",dirty:true},
 {id:"food",month:"2026-11",categoryId:"food",amount:2000,currency:"TWD",dirty:true}
];
const categories=[
 {id:"food",name:"餐飲",type:"expense"},
 {id:"transport",name:"交通",type:"expense"},
 {id:"salary",name:"薪資",type:"income"}
];
const transactions=[
 {id:"a",date:"2026-11-08",type:"expense",amount:1500,categoryId:"food"},
 {id:"b",date:"2026-11-09",type:"credit_card_purchase",amount:850,categoryId:"transport"},
 {id:"c",date:"2026-11-10",type:"credit_card_payment",amount:800},
 {id:"d",date:"2026-11-11",type:"transfer",amount:9000}
];
const view=(patch={})=>Ui.render({month:"2026-11",rows:budgets,transactions,categories,
  accounts:[],creditCards:[],editScope:"total",ledgerSyncState:"synced",...patch});
test("BU2-01 local month formats Taipei time at UTC boundary",()=>{
  assert.equal(Ui.taipeiMonth(new Date("2026-11-30T16:10:00Z")),"2026-12");
});
test("BU2-02 month shift handles year boundaries",()=>{
  assert.equal(Ui.shiftMonth("2026-01",-1),"2025-12");
  assert.equal(Ui.shiftMonth("2026-12",1),"2027-01");
});
test("BU2-03 month picker rejects invalid months",()=>{
  assert.throws(()=>Ui.shiftMonth("2026-13",1),/BUDGET_INVALID_MONTH/);
});
test("BU2-04 budget accepts zero and integers",()=>{
  assert.equal(Ui.parseAmount("0"),0);
  assert.equal(Ui.parseAmount("10000"),10000);
});
test("BU2-05 budget rejects negative, decimal and exponent",()=>{
  for(const x of ["-1","1.5","1e3",""])assert.throws(()=>Ui.parseAmount(x));
});
test("BU2-06 budget rejects unsafe integer values",()=>{
  assert.throws(()=>Ui.parseAmount("9007199254740992"),/安全範圍/);
});
test("BU2-07 total and category scopes are unambiguous",()=>{
  assert.equal(Ui.parseScope("total"),null);
  assert.equal(Ui.parseScope("cat:food"),"food");
  assert.equal(Ui.scopeOf(null),"total");
  assert.equal(Ui.scopeOf("total"),"cat:total");
});
test("BU2-08 invalid scope fails closed",()=>{
  assert.throws(()=>Ui.parseScope("category"));
  assert.throws(()=>Ui.parseScope("cat:"));
});
test("BU2-09 dashboard opens budget page with month switcher",()=>{
  const html=view();
  assert.match(html,/預算管理/);
  assert.match(html,/data-finance-budget-month/);
  assert.match(html,/budget-month-shift/);
  assert.match(html,/2026-11/);
});
test("BU2-10 dashboard shows total, used and remaining amounts",()=>{
  const html=view();
  assert.match(html,/10,000/);
  assert.match(html,/2,350/);
  assert.match(html,/7,650/);
});
test("BU2-11 card payments and transfers do not double count",()=>{
  const html=view();assert.match(html,/已使用/);
  assert.doesNotMatch(html,/11,150/);
});
test("BU2-12 category budget uses stable category ID",()=>{
  const html=view();
  assert.match(html,/cat:food/);assert.match(html,/餐飲/);
  assert.match(html,/交通/);
});
test("BU2-13 unconfigured category is visible",()=>{
  const html=view();
  assert.match(html,/尚未設定上限/);
});
test("BU2-14 an unconfigured overall budget does not display zero budget",()=>{
  const html=view({rows:[]});
  assert.match(html,/未設定/);
  assert.match(html,/尚未設定/);
});
test("BU2-15 zero budget with positive spending displays overage",()=>{
  const html=view({rows:[{...budgets[0],amount:0}]});
  assert.match(html,/已超支/);assert.match(html,/零元預算已超支/);
});
test("BU2-16 exactly 80% shows warning",()=>{
  const html=view({rows:[{...budgets[0],amount:10000}],transactions:[
    {id:"x",date:"2026-11-13",type:"expense",amount:8000,categoryId:"food"}]});
  assert.match(html,/接近上限（80%）/);
});
test("BU2-17 exactly 100% displays limit",()=>{
  const html=view({transactions:[
    {id:"x",date:"2026-11-13",type:"expense",amount:10000,categoryId:"food"}]});
  assert.match(html,/已達上限（100%）/);
});
test("BU2-18 above 100% displays real negative remainder",()=>{
  const html=view({transactions:[
    {id:"x",date:"2026-11-13",type:"expense",amount:12000,categoryId:"food"}]});
  assert.match(html,/已超支/);
  assert.match(html,/2,000/);
});
test("BU2-19 warning uses text not only color",()=>{
  assert.match(view({transactions:[{date:"2026-11-13",type:"expense",amount:9000,categoryId:"food"}]}),/接近上限/);
});
test("BU2-20 progress includes accessibility labels",()=>{
  const html=view();
  assert.match(html,/role="progressbar"/);
  assert.match(html,/aria-label="每月總預算使用進度"/);
  assert.match(html,/aria-valuenow=/);
});
test("BU2-21 editing form has category select and exact integer amount",()=>{
  const html=view({editScope:"cat:food"});
  assert.match(html,/data-finance-form="budget"/);
  assert.match(html,/name="scope"/);
  assert.match(html,/value="2000"/);
});
test("BU2-22 rendering escapes malicious category names",()=>{
  const html=view({categories:[{id:"food",name:'<img src=x onerror="boom">',type:"expense"}]});
  assert.doesNotMatch(html,/<img src=x onerror/);
  assert.match(html,/&lt;img/);
});
test("BU2-23 rendering escapes malicious category IDs",()=>{
  const html=view({categories:[{id:'evil" onclick="boom',name:"其他",type:"expense"}]});
  assert.doesNotMatch(html,/data-scope="cat:evil" onclick/);
});
test("BU2-24 selected month with no spending works",()=>{
  const html=view({month:"2026-12",transactions:[]});
  assert.match(html,/2026-12/);
  assert.match(html,/未設定/);
});
test("BU2-25 copy previous month cannot silently overwrite",()=>{
  const html=view();
  assert.match(html,/複製上月（只補未設定項目）/);
});
test("BU2-26 removing a budget has a second confirmation",()=>{
  const html=view({deleteId:"food"});
  assert.match(html,/data-finance-action="budget-remove-confirm"/);
  assert.match(html,/不會刪除任何交易/);
});
test("BU2-27 uncategorized expense cannot edit the total budget",()=>{
  const html=view({transactions:[{id:"x",date:"2026-11-08",type:"expense",amount:45,categoryId:null}]});
  assert.match(html,/待分類交易：請先補充分類/);
});
test("BU2-28 disabled cloud sync is explicitly local-only",()=>{
  assert.match(view(),/雲端預算服務尚待 P1 驗收/);
  assert.match(view(),/所有修改目前只會儲存在本機/);
});
test("BU2-29 ledger sync errors are disclosed",()=>{
  assert.match(view({ledgerSyncState:"error"}),/帳本同步失敗/);
});
test("BU2-30 ledger pending is disclosed",()=>{
  assert.match(view({ledgerSyncState:"pending"}),/本機已記錄支出/);
});
test("BU2-31 budget stylesheet includes small screen layout",()=>{
  const css=read("finance/budget/budget-ui.css");
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/grid-template-columns/);
});
test("BU2-32 budget stylesheet includes dark mode",()=>{
  assert.match(read("finance/budget/budget-ui.css"),/prefers-color-scheme:dark/);
});
test("BU2-33 app loads budget modules before FinanceHome",()=>{
  const loader=read("loader.js");
  assert.ok(loader.indexOf("finance/budget/budget-domain.js")<loader.indexOf("finance/budget/budget-ui.js"));
  assert.ok(loader.indexOf("finance/budget/budget-ui.js")<loader.indexOf("finance/pages/home.js"));
});
test("BU2-34 candidate service worker caches new assets",()=>{
  const sw=read("sw.js"),html=read("index.html");
  assert.match(sw,/finance\/budget\/budget-ui.js\?v=2/);
  assert.match(sw,/finance\/budget\/budget-ui.css\?v=1/);
  assert.match(html,/finance\/budget\/budget-ui.css\?v=1/);
});
test("BU2-35 finance route preserves all original features",()=>{
  const home=read("finance/pages/home.js");
  for(const part of ["overview","transactions","accounts","cards","categories","reports","settings","budgets"])assert.ok(home.includes(part));
  assert.match(home,/data-finance-form="budget"/);
  assert.match(home,/budgetPage/);
  assert.match(home,/financeSync\.schedule/);
});
test("BU2-36 budget writes only use local store",()=>{
  const home=read("finance/pages/home.js");
  assert.match(home,/FinanceBudgetLocalStore\.save/);
  assert.match(home,/FinanceBudgetLocalStore\.remove/);
  assert.doesNotMatch(home,/FinanceBudgetCloudStore\./);
  assert.match(home,/const budgetCloudEnabled=false/);
  assert.match(home,/FinanceBudgetSync\.create/);
});
test("BU2-37 separate status never asserts backend is deployed",()=>{
  assert.match(view(),/雲端預算服務尚待/);
});

test("BU2-38 owner module loads before budget local storage",()=>{
  const loader=read("loader.js");
  assert.ok(loader.indexOf("finance/budget/budget-owner.js")>=0);
  assert.ok(loader.indexOf("finance/budget/budget-owner.js")<loader.indexOf("finance/budget/budget-local-store.js"));
});
test("BU2-39 budget UI clears rows when identity changes",()=>{
  const home=read("finance/pages/home.js");
  assert.match(home,/FinanceBudgetOwner\.invalidate\(\)/);
  assert.match(home,/ui\.budget\.rows=\[\]/);
  assert.match(home,/BUDGET_OWNER_CHANGED/);
});
test("BU2-40 owner-aware DB v3 and secure backup are registered",()=>{
  const loader=read("loader.js"),storage=read("finance/storage/finance-db.js");
  assert.match(storage,/DB_VERSION=3/);
  assert.match(loader,/finance\/storage\/finance-db\.js\?v=46/);
});

test("BU2-41 unauthenticated budget route never renders stale spending totals",()=>{
  const home=read("finance/pages/home.js");
  assert.ok(home.includes("if(!ui.budget.ownerId)"));
  const guard=home.indexOf("if(!ui.budget.ownerId)"),render=home.indexOf("return FinanceBudgetUi.render({",guard);
  assert.ok(guard>=0&&render>guard);
  assert.match(home,/為保護帳號隱私，本頁暫不顯示舊使用者的預算或消費統計/);
});

test("BU2-42 cloud adapter and reconciler load before candidate page",()=>{
 const loader=read("loader.js");
 assert.ok(loader.indexOf("budget-cloud-store.js?v=1")>0);
 assert.ok(loader.indexOf("budget-cloud-store.js?v=1")<loader.indexOf("budget-sync.js?v=1"));
 assert.ok(loader.indexOf("budget-sync.js?v=1")<loader.indexOf("finance/pages/home.js?v=71"));
});
test("BU2-43 disabled production rollout cannot attempt cloud sync",()=>{
 const home=read("finance/pages/home.js");
 assert.match(home,/const budgetCloudEnabled=false/);
 assert.match(home,/if\(!budgetCloudEnabled\)return \{ok:false,state:"disabled"\}/);
});
test("BU2-44 candidate budget sync guards Auth and state",()=>{
 const home=read("finance/pages/home.js");
 assert.match(home,/FinanceBudgetOwner\.requireOwner/);
 assert.match(home,/budgetSync\.sync\(\{month:targetMonth\}\)/);
 assert.match(home,/result\.state==="auth_required"/);
 assert.match(home,/BUDGET_IDENTITY_CHANGED/);
});
