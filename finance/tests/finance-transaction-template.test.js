"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const Template=require("../domain/finance-transaction-template.js");
const FinanceDraft=require("../domain/finance-ai-draft.js");

test("T01 空白模板包含完整 Canonical 欄位且未知值為 null",()=>{
  const draft=Template.createFinanceTransactionTemplate();
  assert.equal(draft.version,"1.0");
  assert.deepEqual(Object.keys(draft),Template.FIELDS);
  for(const field of Template.FIELDS.filter(field=>field!=="version"))assert.equal(draft[field],null);
  assert.equal(Template.isFinanceTransactionTemplateShape(draft),true);
});

test("T02 正常合併只填指定欄位",()=>{
  const result=Template.mergeFinanceTransactionTemplate({}, {amount:850,merchant:"中油"});
  assert.equal(result.amount,850);
  assert.equal(result.merchant,"中油");
  assert.equal(result.category,null);
});

test("T03 多餘欄位不會進入 Draft",()=>{
  const result=Template.sanitizeFinanceTransactionTemplate({amount:850,hack:"x"});
  assert.equal("hack" in result,false);
  assert.equal(Template.isFinanceTransactionTemplateShape(result),true);
});

test("T04 lockedFields 防止後續來源覆寫金額",()=>{
  const base=Template.mergeFinanceTransactionTemplate({}, {amount:850,source:"rule"});
  const result=Template.mergeFinanceTransactionTemplate(base,{amount:8500,source:"ollama"},["amount"]);
  assert.equal(result.amount,850);
  assert.equal(result.source,"ollama");
});

test("T05 字串金額不會被當成合法 amount",()=>{
  const result=Template.sanitizeFinanceTransactionTemplate({amount:"八百五"});
  assert.equal(result.amount,null);
});

test("T06 type 僅接受白名單值",()=>{
  const result=Template.sanitizeFinanceTransactionTemplate({type:"shopping"});
  assert.equal(result.type,null);
});

test("T07 未知帳戶統一為 null",()=>{
  assert.equal(Template.sanitizeFinanceTransactionTemplate({account:"  "}).account,null);
});

test("T08 舊 Draft 可經 adapter 轉成 Canonical Draft",()=>{
  const draft=FinanceDraft.normalizeFinanceDraft({version:1,type:"支出",amount:"850",date:"2026-09-27",category:"交通",account:"現金",note:"中油加油",source:"manual-test",confidence:0.9});
  assert.equal(draft.version,"1.0");
  assert.equal(draft.type,"expense");
  assert.equal(draft.amount,850);
  assert.equal(draft.action,null);
  assert.equal(draft.merchant,null);
  assert.equal(draft.rawText,null);
  assert.equal(draft.source,"manual-test");
  assert.equal(Template.isFinanceTransactionTemplateShape(draft),true);
});

test("中油範例保留鎖定金額並產生固定形狀",()=>{
  const base=Template.mergeFinanceTransactionTemplate(Template.createFinanceTransactionTemplate(),{
    rawText:"中油加油 850，台新卡。",source:"text",amount:850
  });
  const result=Template.mergeFinanceTransactionTemplate(base,{
    action:"create_transaction",type:"credit_card_purchase",amount:8500,category:"交通",creditCard:"台新卡",
    merchant:"中油",dateToken:"today",note:"中油加油",source:"ollama"
  },["amount"]);
  assert.equal(result.amount,850);
  assert.equal(result.type,"credit_card_purchase");
  assert.equal(result.creditCard,"台新卡");
  assert.equal(result.merchant,"中油");
  assert.equal(result.date,null);
  assert.equal(Template.isFinanceTransactionTemplateShape(result),true);
});
