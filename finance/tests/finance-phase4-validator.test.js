const test = require("node:test");
const assert = require("node:assert/strict");

const Template = require("../domain/finance-transaction-template.js");
const Validator = require("../domain/finance-draft-validator.js");
const Payload = require("../domain/finance-commit-payload.js");
const CommitController = require("../domain/finance-commit-controller.js");

const references = Object.freeze({
  accounts: Object.freeze([
    Object.freeze({id:"cash",name:"現金",type:"cash",archived:false}),
    Object.freeze({id:"cathay",name:"國泰銀行",type:"bank",archived:false}),
    Object.freeze({id:"post",name:"郵局",type:"postal",archived:false})
  ]),
  creditCards: Object.freeze([Object.freeze({id:"taishin",name:"台新卡",archived:false})]),
  categories: Object.freeze([
    Object.freeze({id:"food",name:"餐飲",type:"expense",archived:false}),
    Object.freeze({id:"transport",name:"交通",type:"expense",archived:false}),
    Object.freeze({id:"salary",name:"薪資",type:"income",archived:false})
  ])
});

function draft(type,changes={}){
  const typed={
    expense:{account:"現金",category:"餐飲"},
    income:{account:"國泰銀行",category:"薪資"},
    transfer:{fromAccount:"郵局",toAccount:"國泰銀行"},
    credit_card_purchase:{creditCard:"台新卡",category:"交通"},
    credit_card_payment:{account:"國泰銀行",creditCard:"台新卡"}
  }[type]||{};
  return Template.sanitizeFinanceTransactionTemplate({type,amount:850,dateToken:"specific",date:"2026-09-27",rawText:"Phase 4 test",source:"text",...typed,...changes});
}

function validate(value,options={}){
  return Validator.validateFinanceDraftForCommit(value,{references,...options});
}

test("T01 complete expense is READY and produces the formal payload",()=>{
  const result=validate(draft("expense"));
  assert.equal(result.status,"ready");
  assert.equal(result.commitEligible,true);
  assert.deepEqual(Payload.buildFinanceCommitPayload(result),{type:"expense",amount:850,date:"2026-09-27",note:"",accountId:"cash",categoryId:"food"});
});

test("T02 complete income is READY",()=>{
  const result=validate(draft("income"));
  assert.equal(result.status,"ready");
  assert.equal(result.resolved.account.id,"cathay");
  assert.equal(result.resolved.category.id,"salary");
});

test("T03 complete transfer with different endpoints is READY",()=>{
  const result=validate(draft("transfer"));
  assert.equal(result.status,"ready");
  assert.deepEqual(Payload.buildFinanceCommitPayload(result),{type:"transfer",amount:850,date:"2026-09-27",note:"",fromAccountId:"post",toAccountId:"cathay"});
});

test("T04 complete credit card purchase is READY",()=>{
  const result=validate(draft("credit_card_purchase",{merchant:"中油"}));
  assert.equal(result.status,"ready");
  assert.deepEqual(Payload.buildFinanceCommitPayload(result),{type:"credit_card_purchase",amount:850,date:"2026-09-27",note:"中油",creditCardId:"taishin",categoryId:"transport"});
});

test("T05 complete credit card payment uses the explicit fromAccount contract",()=>{
  const result=validate(draft("credit_card_payment"));
  assert.equal(result.status,"ready");
  assert.deepEqual(Payload.buildFinanceCommitPayload(result),{type:"credit_card_payment",amount:850,date:"2026-09-27",note:"",fromAccountId:"cathay",creditCardId:"taishin"});
});

test("T06 amount zero is BLOCKED",()=>{
  const result=validate({...draft("expense"),amount:0});
  assert.equal(result.status,"blocked");
  assert.ok(result.invalidFields.some(item=>item.code==="invalid_amount"));
});

test("T07 negative amount is BLOCKED",()=>{
  const result=validate({...draft("expense"),amount:-100});
  assert.equal(result.status,"blocked");
  assert.ok(result.invalidFields.some(item=>item.field==="amount"));
});

test("T08 NaN and Infinity amounts are BLOCKED",()=>{
  for(const amount of [Number.NaN,Number.POSITIVE_INFINITY]){
    const result=validate({...draft("expense"),amount});
    assert.equal(result.status,"blocked");
    assert.ok(result.invalidFields.some(item=>item.code==="invalid_amount"));
  }
});

test("T09 null type is NEEDS_INPUT",()=>{
  const result=validate({...draft("expense"),type:null});
  assert.equal(result.status,"needs_input");
  assert.ok(result.missingFields.includes("type"));
  assert.equal(result.commitEligible,false);
});

test("T10 nonexistent account is NEEDS_INPUT",()=>{
  const result=validate({...draft("expense"),account:"不存在帳戶"});
  assert.equal(result.status,"needs_input");
  assert.ok(result.missingFields.includes("account"));
});

test("T11 nonexistent credit card is NEEDS_INPUT",()=>{
  const result=validate({...draft("credit_card_purchase"),creditCard:"不存在信用卡"});
  assert.equal(result.status,"needs_input");
  assert.ok(result.missingFields.includes("creditCard"));
});

test("T12 nonexistent category is NEEDS_INPUT",()=>{
  const result=validate({...draft("expense"),category:"不存在分類"});
  assert.equal(result.status,"needs_input");
  assert.ok(result.missingFields.includes("category"));
});

test("T13 transfer with the same endpoint is BLOCKED",()=>{
  const result=validate({...draft("transfer"),fromAccount:"郵局",toAccount:"郵局"});
  assert.equal(result.status,"blocked");
  assert.ok(result.invalidFields.some(item=>item.code==="same_transfer_account"));
});

test("T14 changed locked amount is BLOCKED",()=>{
  const baseline=draft("expense",{amount:850});
  const result=validate({...baseline,amount:900},{lockedFields:["amount"],lockedDraft:baseline});
  assert.equal(result.status,"blocked");
  assert.ok(result.invalidFields.some(item=>item.code==="locked_field_changed"&&item.field==="amount"));
});

test("T15 multiple transaction issue is BLOCKED",()=>{
  const result=validate(draft("expense"),{issues:["multiple_transactions_not_supported"]});
  assert.equal(result.status,"blocked");
  assert.equal(result.commitEligible,false);
});

test("T16 a complete rule draft stays READY when Ollama is unavailable",()=>{
  const result=validate(draft("expense"),{issues:["ai_unavailable"]});
  assert.equal(result.status,"ready");
  assert.equal(result.commitEligible,false);
  assert.ok(result.warnings.some(item=>item.code==="ai_unavailable"));
});

test("T17 quick duplicate commit is blocked on the second attempt",async()=>{
  let writes=0;
  const controller=CommitController.createFinanceCommitController({createTransaction:async payload=>{writes+=1;return {id:`tx-${writes}`,...payload};}});
  const validation=validate(draft("expense"));
  const first=await controller.commit(validation),second=await controller.commit(validation);
  assert.equal(first.status,"committed");
  assert.equal(second.code,"duplicate_transaction");
  assert.equal(writes,1);
});

test("T18 commit API failure is surfaced and does not report success",async()=>{
  const controller=CommitController.createFinanceCommitController({createTransaction:async()=>{throw new Error("database unavailable");}});
  await assert.rejects(()=>controller.commit(validate(draft("expense"))),error=>error.code==="COMMIT_FAILED"&&error.cause.message==="database unavailable");
});

test("T19 dry-run produces payload without changing transaction count",async()=>{
  let writes=0;
  const controller=CommitController.createFinanceCommitController({createTransaction:async()=>{writes+=1;}});
  const result=await controller.commit(validate(draft("expense")),{dryRun:true});
  assert.equal(result.status,"dry_run");
  assert.equal(result.committed,false);
  assert.equal(writes,0);
  assert.equal(result.payload.accountId,"cash");
});

test("T20 core CPC case is READY with the card and NEEDS_INPUT without it",()=>{
  const core=draft("credit_card_purchase",{amount:850,category:"交通",creditCard:"台新卡",merchant:"中油",rawText:"中油加油 850，台新卡。"});
  const ready=validate(core),missingCard=Validator.validateFinanceDraftForCommit(core,{references:{...references,creditCards:[]}});
  assert.equal(ready.status,"ready");
  assert.equal(ready.commitEligible,true);
  assert.equal(missingCard.status,"needs_input");
  assert.ok(missingCard.missingFields.includes("creditCard"));
});
