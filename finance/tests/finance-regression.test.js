"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const Domain=require("../domain/finance-domain.js");
const UiModel=require("../ui-model.js");
const FinanceDraft=require("../domain/finance-ai-draft.js");
const Storage=require("../storage/finance-db.js");
const Ollama=require("../ai/ollama-connector.js");

const references={
  accounts:[{id:"cash",name:"現金",type:"cash",archived:false},{id:"bank",name:"台新銀行",type:"bank",archived:false}],
  categories:[{id:"salary",name:"薪資",type:"income",archived:false},{id:"transport",name:"交通",type:"expense",archived:false}],
  creditCards:[{id:"taishin-card",name:"台新卡",archived:false}]
};

test("既有五種交易仍通過 Domain 驗證",()=>{
  const rows=[
    {type:"income",amount:50000,date:"2026-09-27",accountId:"bank",categoryId:"salary",note:"薪資"},
    {type:"expense",amount:80,date:"2026-09-27",accountId:"cash",categoryId:"transport",note:"車資"},
    {type:"transfer",amount:1000,date:"2026-09-27",fromAccountId:"cash",toAccountId:"bank",note:"存款"},
    {type:"credit_card_purchase",amount:850,date:"2026-09-27",creditCardId:"taishin-card",categoryId:"transport",note:"中油"},
    {type:"credit_card_payment",amount:850,date:"2026-09-27",accountId:"bank",creditCardId:"taishin-card",note:"繳卡費"}
  ];
  for(const row of rows)assert.deepEqual(Domain.validateTransaction(row,references).errors,[]);
});

test("Canonical Draft 仍可解析 reference 並套用既有表單",()=>{
  const result=FinanceDraft.resolveFinanceDraftReferences({
    version:"1.0",action:"create_transaction",type:"credit_card_purchase",amount:850,category:"交通",
    creditCard:"台新卡",merchant:"中油",dateToken:"specific",date:"2026-09-27",note:"中油加油",
    rawText:"中油加油 850，台新卡。",source:"text"
  },references);
  assert.equal(result.valid,true);
  assert.deepEqual(FinanceDraft.applyFinanceDraftToForm(result),{
    type:"credit_card_purchase",amount:"850",date:"2026-09-27",note:"中油加油",creditCardId:"taishin-card",categoryId:"transport"
  });
});

test("既有 UI Draft 驗證仍接受合法手動支出",()=>{
  const result=UiModel.validateTransactionDraft({type:"expense",amount:"120",date:"2026-09-27",accountId:"cash",categoryId:"transport",note:"午餐"},references);
  assert.equal(result.valid,true);
  assert.equal(result.value.amount,120);
});

test("Phase 1 未變更 Finance DB schema 與 Ollama 本機限制",()=>{
  assert.equal(Storage.DB_VERSION,1);
  assert.equal(Storage.STORE_NAMES.includes("transactions"),true);
  assert.equal(Ollama.normalizeSettings({baseUrl:"http://127.0.0.1:11434",model:"qwen2.5:7b"}).baseUrl,"http://127.0.0.1:11434");
  assert.throws(()=>Ollama.normalizeSettings({baseUrl:"https://example.com",model:"x"}),error=>error.code==="UNSAFE_BASE_URL");
});
