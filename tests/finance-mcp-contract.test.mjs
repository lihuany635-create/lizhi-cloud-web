import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../supabase/functions/lizhi-finance-mcp/index.ts", import.meta.url), "utf8");
test("FIN-MCP-01 OAuth user identity is verified by middleware", () => {
  assert.match(source,/withOAuthProtectedResource\(/);
  assert.match(source,/withSupabase\(\{ auth: "user" \}\)/);
  assert.match(source,/const uid = userClaims\?\.id/);
});
test("FIN-MCP-02 every cloud fetch is owner-scoped", () => {
  assert.match(source,/\.from\("lizhi_finance_records"\)/);
  assert.match(source,/\.eq\("user_id", uid\)/);
  assert.match(source,/\.is\("deleted_at", null\)/);
  assert.match(source,/\.range\(offset, offset \+ page - 1\)/);
  assert.match(source,/CLOUD_ROW_LIMIT_EXCEEDED/);
});
test("FIN-MCP-03 only five bounded read tools exist", () => {
  const names = [...source.matchAll(/register\(s, "(finance_[a-z_]+)"/g)].map(m=>m[1]);
  assert.deepEqual(names,["finance_status","finance_accounts","finance_cards","finance_month_summary","finance_recent_transactions"]);
  assert.match(source,/readOnlyHint: true/);
  assert.match(source,/max\(20\)/);
  assert.doesNotMatch(source,/\.(?:insert|upsert|update|delete)\(/);
});
test("FIN-MCP-04 credit card payments are not included twice in expense", () => {
  assert.match(source,/if \(t\.type === "credit_card_purchase"\) cardPurchase \+= v/);
  assert.match(source,/if \(t\.type === "credit_card_payment"\) cardPayment \+= v/);
  assert.match(source,/expense: cashExpense \+ cardPurchase/);
  assert.match(source,/income_minus_expense: income - cashExpense - cardPurchase/);
});
test("FIN-MCP-05 minimize exposure and label snapshot freshness", () => {
  assert.match(source,/source: "supabase_synced_snapshot"/);
  assert.match(source,/synced_at: b\.synced_at/);
  assert.doesNotMatch(source,/select\([^\n]*note/);
  assert.doesNotMatch(source,/SUPABASE_SERVICE_ROLE_KEY.*console/);
});
