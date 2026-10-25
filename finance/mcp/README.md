# 立之理財管家 ChatGPT MCP (v0.1)

Backend: `supabase/functions/lizhi-finance-mcp/index.ts`

## Data and trust boundary

* The source of truth for device interactions is the existing Finance IndexedDB.
* This MCP reads the four synchronized data types from `lizhi_finance_records` and clearly labels the cloud snapshot as potentially stale.
* Existing third-party OAuth-denying RLS policies on `lizhi_finance_records` are **not changed**.
* The middleware verifies a Supabase OAuth user JWT and retrieves its verified UID. The internal service-role client only uses `SELECT` with `user_id=verifiedUID`, never a caller-provided UID. No service key is sent to ChatGPT or placed in the Plugin manifest.
* Tools are exclusively `finance_status`, `finance_accounts`, `finance_cards`, `finance_month_summary`, `finance_recent_transactions`.
* This version cannot create, change, or delete transactions. A future write-capable version must re-use the existing review/commit path, add idempotency and explicit approval, and have independent security tests.

## Rollout

* The Edge Function was independently deployed to `/functions/v1/lizhi-finance-mcp` on 2026-10-25, initial v0.1.
* The personal ChatGPT plugin `lizhi-finance-readonly` uses OAuth 2.1 / Supabase Auth / DCR, discoverability PRIVATE.
* Do not claim successful user authorization or real ledger reading until the app is connected and the five tools are actually invoked in a newly refreshed ChatGPT conversation.
* Deployment was performed independently from merging this PR; merging is for tracked source history only.

## Tests

`node --test tests/finance-mcp-contract.test.mjs` and `deno check --node-modules-dir=auto supabase/functions/lizhi-finance-mcp/index.ts`.
