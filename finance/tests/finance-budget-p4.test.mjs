import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const require=createRequire(import.meta.url);
const Defaults=require("../budget/budget-defaults.js");
const Domain=require("../budget/budget-domain.js");
const Ui=require("../budget/budget-ui.js");
const Model=require("../ui-model.js");
const Finance=require("../domain/finance-domain.js");
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=file=>readFileSync(path.join(ROOT,file),"utf8");
const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
function fake(rows=[]){
  const state={rows,calls:[],who:OWNER};
  const auth={getSession:async()=>({data:{session:{user:{id:state.who,email:"owner@test.invalid"}}},error:null}),
    getUser:async()=>({data:{user:{id:state.who,email:"owner@test.invalid"}},error:null})};
  const db={auth,from(table){
    if(table!=="lizhi_finance_budget_defaults")throw new Error("other table");
    const q={filters:[],mode:"read",updates:null,insertValue:null,select(){return q;},
      eq(k,v){q.filters.push([k,v]);return q;},
      order(){return q;},
      range(){const data=state.rows.filter(r=>q.filters.every(([k,v])=>r[k]===v));
        state.calls.push(["list",q.filters]);return Promise.resolve({data,error:null});},
      insert(v){q.mode="insert";q.insertValue=v;return q;},
      update(v){q.mode="update";q.updates=v;return q;},
      async maybeSingle(){
        if(q.mode==="insert"){
          if(state.rows.some(x=>x.user_id===q.insertValue.user_id&&
            x.category_id===q.insertValue.category_id))
            return {data:null,error:{code:"23505"}};
          const row={id:"a".repeat(8)+"-aaaa-4aaa-8aaa-"+"a".repeat(12),
            ...q.insertValue,version:1,disabled_at:null};
          state.rows.push(row);state.calls.push(["insert",row]);
          return {data:row,error:null};
        }
        if(q.mode==="update"){
          const row=state.rows.find(x=>q.filters.every(([k,v])=>x[k]===v));
          if(!row)return {data:null,error:null};
          Object.assign(row,q.updates);state.calls.push(["update",row]);
          return {data:row,error:null};
        }
        throw new Error("unexpected maybeSingle");
      }};
    return q;
  }};
  globalThis.LizhiAuth={client:db,allowedEmail:"owner@test.invalid",
    user:{id:OWNER,email:"owner@test.invalid"}};
  return {db,state};
}
test("P4-01 defaults adapter can list without other owner records",async()=>{
 const {db}=fake([
  {id:"id1",user_id:OWNER,category_id:null,currency:"TWD",amount:100,
    start_month:"2026-12",version:1,disabled_at:null},
  {id:"id2",user_id:OTHER,category_id:null,currency:"TWD",amount:999,
    start_month:"2026-12",version:1,disabled_at:null}]);
 const r=await Defaults.list({client:db});
 assert.equal(r.length,1);assert.equal(r[0].amount,100);
});
test("P4-02 strict owner prevents foreign data disclosure",async()=>{
 const {db,state}=fake();
 state.rows.push({id:"id2",user_id:OTHER,category_id:null,currency:"TWD",amount:999,
  start_month:"2026-12",version:1,disabled_at:null});
 const originalFrom=db.from;
 db.from=()=>({select(){return this},eq(){return this},order(){return this},
  range:async()=>({data:state.rows,error:null})});
 await assert.rejects(Defaults.list({client:db}),/BUDGET_DEFAULT_INVALID_REMOTE/);
 db.from=originalFrom;
});
test("P4-03 can save and disable a future default with CAS",async()=>{
 const {db,state}=fake();
 const created=await Defaults.save({client:db,startMonth:"2026-12",amount:500,expectedVersion:0});
 assert.equal(created.version,1);
 const changed=await Defaults.save({client:db,startMonth:"2027-01",amount:700,expectedVersion:1});
 assert.equal(changed.version,2);
 assert.equal(changed.start_month,"2027-01");
 await assert.rejects(Defaults.save({client:db,startMonth:"2027-01",amount:900,
  expectedVersion:1}),/BUDGET_DEFAULT_VERSION_CONFLICT/);
 const disabled=await Defaults.disable({client:db,expectedVersion:2});
 assert.equal(disabled.version,3);
 assert.ok(disabled.disabled_at);
 assert.equal(state.rows.length,1);
});
test("P4-04 defaults cannot be written across identities",async()=>{
 const {db,state}=fake();
 state.who=OTHER;
 await assert.rejects(Defaults.save({client:db,startMonth:"2026-12",amount:1,
  expectedVersion:0}),/BUDGET_AUTH_REQUIRED|BUDGET_IDENTITY/);
 assert.equal(state.rows.length,0);
});
test("P4-05 invalid months, negative and fractional budget defaults never reach DB",async()=>{
 const {db,state}=fake();
 for(const [startMonth,amount] of [["2026-13",100],["2026-12",-1],["2026-12",1.3]]){
  await assert.rejects(Defaults.save({client:db,startMonth,amount,expectedVersion:0}));
 }
 assert.equal(state.calls.length,0);
});
test("P4-06 linked refund draft explicitly marks only a selected original",()=>{
 const refs={accounts:[{id:"cash"}],creditCards:[],categories:[{id:"salary",type:"income"}],
  transactions:[{id:"meal",type:"expense",amount:1000,date:"2026-11-01"}]};
 const input={type:"income",amount:"200",accountId:"cash",categoryId:"salary",
  date:"2026-11-18",refundOfTransactionId:"meal"};
 const res=Model.validateTransactionDraft(input,refs);
 assert.equal(res.valid,true);assert.equal(res.value.refundVerified,true);
 assert.equal(res.value.refundOfTransactionId,"meal");
 assert.equal(Model.validateTransactionDraft({...input,refundOfTransactionId:"missing"},refs).valid,false);
 assert.equal(Model.validateTransactionDraft({...input,refundOfTransactionId:""},refs).value.refundVerified,false);
 const invalid=Finance.validateTransaction({...res.value,type:"transfer"});
 assert.equal(invalid.valid,false);
});
test("P4-07 original transaction and budget UI remain distinct from preview",()=>{
 const rendered=Ui.render({month:"2026-12",rows:[],
  defaults:[{id:"default",amount:1000,currency:"TWD",category_id:null,start_month:"2026-12"}],
  defaultsState:"synced"});
 assert.match(rendered,/未自動新增或覆寫單月額度/);
 assert.match(rendered,/停用此項預設/);
 assert.match(read("finance/pages/home.js"),/refundOfTransactionId/);
 assert.match(read("finance/storage/finance-db.js"),/REFUND_EXCEEDS_PURCHASE/);
 assert.match(read("finance/budget/sql/p4-linked-refunds-candidate.sql"),/refundVerified/);
 assert.match(read("finance/budget/sql/p4-defaults-candidate.sql"),/enable row level security/);
});
