const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FinanceDraft = require("../domain/finance-ai-draft.js");
const RuleEngine = require("../domain/finance-rule-engine.js");
const SmallModelParser = require("../ai/finance-small-model-parser.js");
const Template = require("../domain/finance-transaction-template.js");

const currentDate = "2026-09-27";
const references = Object.freeze({
  accounts: Object.freeze([
    Object.freeze({id: "cash", name: "現金", archived: false}),
    Object.freeze({id: "cathay", name: "國泰銀行", archived: false}),
    Object.freeze({id: "post", name: "郵局", archived: false})
  ]),
  creditCards: Object.freeze([Object.freeze({id: "taishin", name: "台新卡", archived: false})]),
  categories: Object.freeze([
    Object.freeze({id: "food", name: "餐飲", type: "expense", archived: false}),
    Object.freeze({id: "transport", name: "交通", type: "expense", archived: false}),
    Object.freeze({id: "salary", name: "薪資", type: "income", archived: false})
  ])
});

function connectorReturning(value, capture) {
  return {
    async generateConstrainedFinancePatch(promptPackage) {
      if (capture) capture(promptPackage);
      return {rawText: typeof value === "string" ? value : JSON.stringify(value), model: "phase3-mock"};
    }
  };
}

function run(input, output, refs = references, capture) {
  return FinanceDraft.generateConstrainedFinanceDraft(input, refs, {}, {
    currentDate,
    connector: connectorReturning(output, capture)
  });
}

test("T01 core card purchase only lets AI fill the missing type", async () => {
  let prompt;
  const result = await run("中油加油 850，台新卡。", {type: "credit_card_purchase"}, references, value => { prompt = value; });
  assert.equal(result.draft.type, "credit_card_purchase");
  assert.equal(result.draft.amount, 850);
  assert.equal(result.draft.merchant, "中油");
  assert.equal(result.draft.category, "交通");
  assert.equal(result.draft.creditCard, "台新卡");
  assert.deepEqual(result.context.missingFields, ["type"]);
  assert.equal(result.context.allowedValues.accounts, undefined);
  assert.equal(result.context.allowedValues.creditCards, undefined);
  assert.deepEqual(Object.keys(prompt.schema.properties), ["type"]);
});

test("T02 breakfast keeps deterministic cash, category and amount", async () => {
  const result = await run("早餐80現金", {type: "expense"});
  assert.equal(result.draft.type, "expense");
  assert.equal(result.draft.amount, 80);
  assert.equal(result.draft.category, "餐飲");
  assert.equal(result.draft.account, "現金");
});

test("T03 salary preserves the rule-resolved account", async () => {
  const result = await run("薪水42000進國泰", {type: "income", category: "薪資"});
  assert.equal(result.draft.type, "income");
  assert.equal(result.draft.amount, 42000);
  assert.equal(result.draft.account, "國泰銀行");
  assert.equal(result.draft.category, "薪資");
});

test("T04 transfer can fill only a missing allowed transfer endpoint", async () => {
  const result = await run("郵局轉5000到國泰", {type: "transfer", fromAccount: "郵局"});
  assert.equal(result.draft.type, "transfer");
  assert.equal(result.draft.amount, 5000);
  assert.equal(result.draft.fromAccount, "郵局");
  assert.equal(result.draft.toAccount, "國泰銀行");
});

test("T05 card payment language is classified as payment", async () => {
  const result = await run("國泰繳台新卡費12850", {type: "credit_card_payment", account: "國泰銀行"});
  assert.equal(result.draft.type, "credit_card_payment");
  assert.equal(result.draft.amount, 12850);
  assert.equal(result.draft.account, "國泰銀行");
  assert.equal(result.draft.creditCard, "台新卡");
});

test("T06 an unspecified payment source is not invented", async () => {
  const result = await run("中油850", {type: "expense", account: null, creditCard: "台新卡"});
  assert.equal(result.draft.type, "expense");
  assert.equal(result.draft.account, null);
  assert.equal(result.draft.creditCard, null);
  assert.ok(result.aiResult.issues.includes("ai_field_not_requested:creditCard"));
});

test("T07 an unknown category must be allowed or null", async () => {
  const result = await run("買滑鼠1200現金", {type: "expense", category: "電子產品"});
  assert.equal(result.draft.category, null);
  assert.ok(result.aiResult.issues.includes("ai_value_not_allowed:category"));
});

test("T08 a nonexistent credit card is rejected", async () => {
  const result = await run("玉山卡買咖啡100", {type: "credit_card_purchase", category: "餐飲", creditCard: "玉山卡"});
  assert.equal(result.draft.creditCard, null);
  assert.ok(result.aiResult.issues.includes("ai_value_not_allowed:creditCard"));
});

test("T09 a model cannot overwrite locked amount", async () => {
  const result = await run("中油加油 850，台新卡。", {type: "credit_card_purchase", amount: 8500});
  assert.equal(result.draft.amount, 850);
  assert.ok(result.aiResult.issues.includes("ai_attempted_locked_field:amount"));
});

test("T10 a type outside the five canonical types becomes null", async () => {
  const result = await run("早餐80現金", {type: "shopping"});
  assert.equal(result.draft.type, null);
  assert.ok(result.aiResult.issues.includes("ai_value_not_allowed:type"));
});

test("T11 one Markdown fence repair is allowed", async () => {
  const result = await run("早餐80現金", "```json\n{\"type\":\"expense\"}\n```");
  assert.equal(result.draft.type, "expense");
  assert.equal(result.aiResult.repaired, true);
  assert.deepEqual(result.aiResult.repairs, ["strip_markdown_fence"]);
});

test("T12 non-JSON prose stops safely with the Phase 2 draft", async () => {
  const result = await run("早餐80現金", "這是一筆支出");
  assert.equal(result.draft.type, null);
  assert.deepEqual(result.aiResult.issues, ["ai_invalid_json"]);
  assert.equal(result.draft.amount, 80);
});

test("T13 timeout keeps the Phase 2 draft", async () => {
  const connector = {async generateConstrainedFinancePatch() { const error = new Error("timeout"); error.code = "TIMEOUT"; throw error; }};
  const result = await FinanceDraft.generateConstrainedFinanceDraft("早餐80現金", references, {}, {currentDate, connector});
  assert.equal(result.draft.type, null);
  assert.equal(result.draft.amount, 80);
  assert.deepEqual(result.aiResult.issues, ["ai_timeout"]);
});

test("T14 unavailable model keeps the Phase 2 draft", async () => {
  const connector = {async generateConstrainedFinancePatch() { const error = new Error("offline"); error.code = "CONNECTION_FAILED"; throw error; }};
  const result = await FinanceDraft.generateConstrainedFinanceDraft("早餐80現金", references, {}, {currentDate, connector});
  assert.equal(result.draft.type, null);
  assert.equal(result.draft.account, "現金");
  assert.deepEqual(result.aiResult.issues, ["ai_unavailable"]);
});

test("T15 multiple transactions block the AI call", async () => {
  let calls = 0;
  const connector = {async generateConstrainedFinancePatch() { calls += 1; return {rawText: "{}"}; }};
  const result = await FinanceDraft.generateConstrainedFinanceDraft("早餐80，然後午餐120", references, {}, {currentDate, connector});
  assert.equal(calls, 0);
  assert.equal(result.aiResult.called, false);
  assert.equal(result.aiResult.skippedReason, "blocking_issue");
});

test("T16 a complete canonical draft skips the AI call", async () => {
  const draft = Template.sanitizeFinanceTransactionTemplate({type: "expense", amount: 80, category: "餐飲", account: "現金", dateToken: "today", date: currentDate, rawText: "早餐80現金", source: "text"});
  let calls = 0;
  const result = await SmallModelParser.parseFinanceWithSmallModel({draft, rawText: draft.rawText, references, ruleResult: {draft, lockedFields: ["amount", "category", "account", "dateToken", "date", "type"], sourceTrace: {}, issues: [], typeHints: ["expense"]}, connector: {async generateConstrainedFinancePatch() { calls += 1; }}});
  assert.equal(calls, 0);
  assert.equal(result.aiResult.skippedReason, "no_missing_fields");
});

test("T17 ambiguous duplicate card references stay null", async () => {
  const duplicateRefs = {...references, creditCards: [{id: "card-1", name: "台新卡"}, {id: "card-2", name: "台新卡"}]};
  const result = await run("台新卡刷100", {type: "credit_card_purchase", category: null, creditCard: null}, duplicateRefs);
  assert.equal(result.draft.creditCard, null);
  assert.ok(result.ruleResult.issues.includes("ambiguous_alias"));
});

test("T18 unknown output keys are dropped", async () => {
  const result = await run("早餐80現金", {type: "expense", unknownKey: "x"});
  assert.equal(Object.prototype.hasOwnProperty.call(result.draft, "unknownKey"), false);
  assert.ok(result.aiResult.issues.includes("ai_unknown_field:unknownKey"));
});

test("T19 all five existing transaction types still normalize", async () => {
  const cases = [
    ["早餐80現金", {type: "expense"}, "expense"],
    ["薪水42000進國泰", {type: "income", category: "薪資"}, "income"],
    ["郵局轉5000到國泰", {type: "transfer", fromAccount: "郵局"}, "transfer"],
    ["中油加油 850，台新卡。", {type: "credit_card_purchase"}, "credit_card_purchase"],
    ["國泰繳台新卡費12850", {type: "credit_card_payment", account: "國泰銀行"}, "credit_card_payment"]
  ];
  for (const [input, output, expected] of cases) {
    const result = await run(input, output);
    assert.equal(result.draft.type, expected);
  }
});

test("T20 parser does not write transactions and DB remains version 1", async () => {
  let writes = 0;
  const guardedRefs = {...references, transactions: {create() { writes += 1; }}};
  const result = await run("早餐80現金", {type: "expense"}, guardedRefs);
  const dbSource = fs.readFileSync(path.join(__dirname, "../storage/finance-db.js"), "utf8");
  assert.equal(result.draft.type, "expense");
  assert.equal(writes, 0);
  assert.match(dbSource, /DB_VERSION=1/);
});
