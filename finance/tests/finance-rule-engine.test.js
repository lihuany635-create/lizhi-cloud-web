"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const Engine=require("../domain/finance-rule-engine.js");
const Template=require("../domain/finance-transaction-template.js");

const context={
  currentDate:"2026-09-27",
  accounts:[{id:"cash",name:"現金",archived:false},{id:"bank",name:"台新銀行",archived:false}],
  creditCards:[{id:"taishin",name:"台新卡",archived:false},{id:"cube",name:"國泰CUBE卡",archived:false}],
  categories:[{id:"food",name:"餐飲",archived:false},{id:"transport",name:"交通",archived:false},{id:"daily",name:"日常",archived:false}]
};

test("T01 中油加油 850 台新卡",()=>{
  const result=Engine.parseFinanceRulesToDraft("中油加油 850，台新卡。",context);
  assert.equal(result.draft.amount,850);
  assert.equal(result.draft.merchant,"中油");
  assert.equal(result.draft.category,"交通");
  assert.equal(result.draft.creditCard,"台新卡");
  assert.equal(result.draft.account,null);
  assert.equal(result.draft.dateToken,"today");
  assert.equal(result.draft.date,"2026-09-27");
  assert.equal(result.draft.rawText,"中油加油 850，台新卡。");
  assert.equal(result.draft.type,"credit_card_purchase");
  assert.deepEqual(result.typeHints,["credit_card_purchase"]);
  assert.equal(result.issues.length,0);
  for(const field of ["type","amount","merchant","category","creditCard","dateToken","date"])assert.equal(result.lockedFields.includes(field),true);
});

test("T02 早餐 80 現金",()=>{
  const result=Engine.parseFinanceRulesToDraft("早餐 80 現金",context);
  assert.equal(result.draft.amount,80);assert.equal(result.draft.account,"現金");assert.equal(result.draft.category,"餐飲");assert.equal(result.draft.dateToken,"today");
});

test("T03 昨天午餐 120 現金",()=>{
  const result=Engine.parseFinanceRulesToDraft("昨天午餐 120 現金",context);
  assert.equal(result.draft.amount,120);assert.equal(result.draft.dateToken,"yesterday");assert.equal(result.draft.date,"2026-09-26");assert.equal(result.draft.category,"餐飲");
});

test("T04 前天加油兩百五",()=>{
  const result=Engine.parseFinanceRulesToDraft("前天加油兩百五",context);
  assert.equal(result.draft.amount,250);assert.equal(result.draft.category,"交通");assert.equal(result.draft.dateToken,"specific");assert.equal(result.draft.date,"2026-09-25");
});

test("T05 加油三千二",()=>assert.equal(Engine.parseFinanceRulesToDraft("加油三千二",context).draft.amount,3200));

test("T06 買東西一千五",()=>{
  const result=Engine.parseFinanceRulesToDraft("買東西一千五",context);assert.equal(result.draft.amount,1500);assert.equal(result.draft.category,null);
});

test("T07 繳費四萬二",()=>assert.equal(Engine.parseFinanceRulesToDraft("繳費四萬二",context).draft.amount,42000));

test("T08 中油 1,280 元 台新卡",()=>{
  const draft=Engine.parseFinanceRulesToDraft("中油 1,280 元 台新卡",context).draft;assert.equal(draft.amount,1280);assert.equal(draft.merchant,"中油");assert.equal(draft.category,"交通");assert.equal(draft.creditCard,"台新卡");
});

test("T09 完整日期",()=>assert.equal(Engine.parseFinanceRulesToDraft("2026/9/20 中油 850",context).draft.date,"2026-09-20"));

test("T10 月日使用目前年份",()=>assert.equal(Engine.parseFinanceRulesToDraft("9/20 午餐 150",context).draft.date,"2026-09-20"));

test("T11 多筆交易拒絕拆單",()=>{
  const result=Engine.parseFinanceRulesToDraft("早餐 80，午餐 120",context);assert.equal(result.multipleTransactions,true);assert.deepEqual(result.issues,["multiple_transactions_not_supported"]);assert.equal(result.draft.amount,null);
});

test("T12 模糊金額維持 null",()=>{
  const result=Engine.parseFinanceRulesToDraft("一百多塊早餐",context);assert.equal(result.draft.amount,null);assert.equal(result.issues.includes("ambiguous_amount"),true);
});

test("T13 多張同別名卡不猜測",()=>{
  const cards=[{id:"one",name:"台新玫瑰卡",archived:false},{id:"two",name:"台新FlyGo卡",archived:false}];
  const result=Engine.parseFinanceRulesToDraft("台新 850",{...context,creditCards:cards});assert.equal(result.draft.creditCard,null);assert.equal(result.issues.includes("ambiguous_alias"),true);
});

test("T14 未知商家只保留明確金額",()=>{
  const draft=Engine.parseFinanceRulesToDraft("未知商家 300",context).draft;assert.equal(draft.amount,300);assert.equal(draft.merchant,null);assert.equal(draft.category,null);
});

test("T15 Canonical sanitize 丟棄多餘欄位",()=>{
  const result=Engine.parseFinanceRules("中油 850",context),draft=Template.mergeFinanceTransactionTemplate({}, {...result.patch,hack:"x"});assert.equal("hack" in draft,false);assert.equal(Template.isFinanceTransactionTemplateShape(draft),true);
});

test("T16 lockedFields 防止後續覆寫規則金額",()=>{
  const result=Engine.parseFinanceRulesToDraft("中油 850",context),later=Template.mergeFinanceTransactionTemplate(result.draft,{amount:8500},result.lockedFields);assert.equal(later.amount,850);
});

test("T17 空字串與 null 安全回傳 issues",()=>{
  for(const value of ["",null]){const result=Engine.parseFinanceRules(value,context);assert.equal(result.issues.includes("invalid_input"),true);assert.deepEqual(result.patch,{});}
});

test("T18 Phase 2 鎖定有明確依據的刷卡消費類型且保持 Canonical shape",()=>{
  const result=Engine.parseFinanceRulesToDraft("中油加油 850，台新卡。",context);assert.equal(result.draft.type,"credit_card_purchase");assert.equal(result.draft.action,null);assert.equal(result.lockedFields.includes("type"),true);assert.equal(Template.isFinanceTransactionTemplateShape(result.draft),true);
});

test("轉帳方向可確定時填入 fromAccount 與 toAccount",()=>{
  const result=Engine.parseFinanceRulesToDraft("從現金轉 3000 到台新銀行",context);
  assert.equal(result.draft.fromAccount,"現金");assert.equal(result.draft.toAccount,"台新銀行");assert.equal(result.draft.account,null);assert.deepEqual(result.typeHints,["transfer"]);
});
