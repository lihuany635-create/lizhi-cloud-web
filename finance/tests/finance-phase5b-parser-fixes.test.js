"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const AmountParser=require("../parsers/finance-amount-parser.js");
const Engine=require("../domain/finance-rule-engine.js");
const FinanceDraft=require("../domain/finance-ai-draft.js");
const Template=require("../domain/finance-transaction-template.js");
const Validator=require("../domain/finance-draft-validator.js");

const currentDate="2026-09-27";
const references=Object.freeze({
  accounts:Object.freeze([
    Object.freeze({id:"cash",name:"現金",type:"cash",archived:false}),
    Object.freeze({id:"bank",name:"銀行帳戶",type:"bank",archived:false}),
    Object.freeze({id:"post",name:"郵局",type:"bank",archived:false})
  ]),
  creditCards:Object.freeze([Object.freeze({id:"taishin",name:"台新卡",archived:false})]),
  categories:Object.freeze([
    Object.freeze({id:"food",name:"餐飲",type:"expense",archived:false}),
    Object.freeze({id:"transport",name:"交通",type:"expense",archived:false}),
    Object.freeze({id:"daily",name:"日常",type:"expense",archived:false}),
    Object.freeze({id:"salary",name:"薪資",type:"income",archived:false})
  ])
});

function rule(input,refs=references){return Engine.parseFinanceRulesToDraft(input,{...refs,currentDate});}
function connectorReturning(value){return {async generateConstrainedFinancePatch(){return {rawText:JSON.stringify(value),model:"phase5b-test"};}};}
function withAi(input,output,refs=references){return FinanceDraft.generateConstrainedFinanceDraft(input,refs,{}, {currentDate,connector:connectorReturning(output)});}

test("T-FIX-01 quantifier 一筆 is not parsed as amount",()=>{
  const result=rule("幫我隨便記一筆午餐");
  assert.equal(result.draft.amount,null);
  assert.notEqual(result.draft.amount,1);
});

test("T-FIX-02 明天 resolves to current date plus one day",()=>{
  const result=rule("明天午餐150，現金");
  assert.equal(result.draft.amount,150);
  assert.equal(result.draft.date,"2026-09-28");
  assert.equal(result.draft.category,"餐飲");
  assert.equal(result.draft.account,"現金");
});

test("T-FIX-03 Chinese month-day is a date and not an amount conflict",()=>{
  for(const input of ["9月20日午餐180，現金","09月20日午餐180，現金","9 月 20 日午餐180，現金"]){
    const result=rule(input);
    assert.equal(result.draft.amount,180,input);
    assert.equal(result.draft.date,"2026-09-20",input);
    assert.equal(result.issues.includes("amount_conflict"),false,input);
  }
});

test("T-FIX-04 unknown expense category cannot fall back to 日常",async()=>{
  const result=await withAi("花了500",{type:"expense",category:"日常"});
  assert.equal(result.draft.type,"expense");
  assert.equal(result.draft.amount,500);
  assert.equal(result.draft.category,null);
  assert.ok(result.aiResult.issues.includes("ai_value_not_allowed:category"));
});

test("T-FIX-05 generic cash purchase keeps amount and category unknown",async()=>{
  const result=await withAi("現金買東西",{type:"expense",category:"日常"});
  assert.equal(result.draft.amount,null);
  assert.equal(result.draft.category,null);
  assert.equal(result.draft.account,"現金");
});

test("T-FIX-06 nonnumeric amount text never creates a number or category",async()=>{
  const result=await withAi("今天支出 abc 元，現金",{type:"expense",category:"日常"});
  assert.equal(result.draft.amount,null);
  assert.equal(result.draft.category,null);
  assert.equal(result.draft.account,"現金");
});

test("T-FIX-07 colloquial 三千二 remains 3200",()=>{
  const result=rule("早餐三千二，現金");
  assert.equal(result.draft.amount,3200);
  assert.equal(result.draft.category,"餐飲");
});

test("T-FIX-08 colloquial 四萬二 remains 42000",()=>{
  assert.equal(rule("買電腦四萬二，現金").draft.amount,42000);
});

test("T-FIX-09 multiple transactions remain blocked",()=>{
  const result=rule("昨天午餐120，晚上加油800");
  assert.deepEqual(result.issues,["multiple_transactions_not_supported"]);
  assert.equal(result.multipleTransactions,true);
  const validation=Validator.validateFinanceDraftForCommit(result.draft,{references,issues:result.issues});
  assert.equal(validation.status,Validator.STATUS.BLOCKED);
});

test("T-FIX-10 configured Chinese quantity measure words are excluded",()=>{
  for(const word of AmountParser.QUANTITY_MEASURE_WORDS){
    const parsed=AmountParser.parseFinanceAmount(`幫我記一${word}午餐`);
    assert.equal(parsed.amount,null,`一${word} 不得解析成金額`);
    assert.equal(parsed.candidates.length,0,`一${word} 不得產生金額候選`);
  }
});

test("T-FIX-11 unsupported explicit date semantics never default to today",()=>{
  const result=rule("後天午餐150，現金");
  assert.equal(result.draft.date,null);
  assert.equal(result.draft.dateToken,null);
  assert.ok(result.issues.includes("unrecognized_date"));
  const draft=Template.mergeFinanceTransactionTemplate(result.draft,{type:"expense"});
  const validation=Validator.validateFinanceDraftForCommit(draft,{references,issues:result.issues});
  assert.notEqual(validation.status,Validator.STATUS.READY);
});

test("T-FIX-12 existing IndexedDB-shaped references resolve without invention",()=>{
  const accountCases=[
    ["現金午餐150","現金"],
    ["銀行帳戶午餐150","銀行帳戶"],
    ["郵局午餐150","郵局"]
  ];
  for(const [input,name] of accountCases){
    const result=rule(input);
    assert.equal(result.draft.account,name);
    const draft=Template.mergeFinanceTransactionTemplate(result.draft,{type:"expense"});
    assert.equal(Validator.validateFinanceDraftForCommit(draft,{references}).status,Validator.STATUS.READY);
  }
  const card=rule("台新卡買晚餐320");
  assert.equal(card.draft.creditCard,"台新卡");
  const cardDraft=Template.mergeFinanceTransactionTemplate(card.draft,{type:"credit_card_purchase"});
  assert.equal(Validator.validateFinanceDraftForCommit(cardDraft,{references}).status,Validator.STATUS.READY);
});

test("T-FIX-13 required existing parser capabilities do not regress",()=>{
  const cases=[
    ["中油加油850",{amount:850,category:"交通"}],
    ["早餐兩百五",{amount:250,category:"餐飲"}],
    ["前天停車費80",{amount:80,category:"交通",date:"2026-09-25"}],
    ["薪水四萬二",{amount:42000,category:"薪資"}],
    ["從現金轉一千五到銀行帳戶",{amount:1500,fromAccount:"現金",toAccount:"銀行帳戶"}],
    ["繳台新卡5000",{amount:5000,creditCard:"台新卡"}],
    ["台新卡買晚餐320",{amount:320,category:"餐飲",creditCard:"台新卡"}]
  ];
  for(const [input,expected] of cases){
    const draft=rule(input).draft;
    for(const [field,value] of Object.entries(expected))assert.equal(draft[field],value,`${input} ${field}`);
  }
});

test("T-FIX-14 digits inside alphanumeric identifiers are not amounts",()=>{
  const tagged=rule("P9-TEST通勤花了850，錢包",{
    ...references,
    accounts:Object.freeze([...references.accounts,Object.freeze({id:"wallet",name:"錢包",type:"cash",archived:false})])
  });
  assert.equal(tagged.draft.amount,850);
  assert.equal(tagged.issues.includes("amount_conflict"),false);

  const model=AmountParser.parseFinanceAmount("iPhone15花了30000");
  assert.equal(model.amount,30000);
  assert.equal(model.issues.includes("amount_conflict"),false);

  const identifierOnly=AmountParser.parseFinanceAmount("版本A9");
  assert.equal(identifierOnly.amount,null);
  assert.equal(identifierOnly.candidates.length,0);
});
