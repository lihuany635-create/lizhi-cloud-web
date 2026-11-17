# 立之理財管家｜P3 原 Private Site 擴充交接（正式發布候選）

本任務明確要求只修改**原有**私人 Site：`https://lizhi-finance-agent-20261025.lihuany635.chatgpt.site`，不要建立新 Site、新 MCP、新資料庫、第二份記帳系統，也不要動其他 Site。

## 依賴及版本

- 原 Edge：`lizhi-finance-site-mcp`，原 Supabase 專案 `hrdzywkihfqggiwjgavi`。
- Edge `/mcp` 採 POST JSON-RPC 2.0。既有 `verify_jwt=false`，在 Edge 對 `Bearer LIZHI_FINANCE_SITE_MCP_TOKEN` 與固定 `LIZHI_FINANCE_SITE_OWNER_UID` 作 fail-closed；Site 在轉送前需自己核對目前 ChatGPT 的本人身分。
- 正式 P3 SQL 先新增 `public.lizhi_finance_budget_requests`、`lizhi_finance_budget_site_spending(uuid,text)`、`lizhi_finance_budget_site_set(uuid,uuid,text,text,text,bigint,boolean,bigint)`，皆僅供 service_role 使用。
- 原七項 MCP 一律保留原名稱、schema 與執行路徑，不刪工具、不停用現有交易功能。

## Site 擴充方式

先於**原站點**複製既有 Worker/頁面設定供回退。保留 Private、本人 OAuth 身分、既有 Secrets、單一 `/mcp`、HTTP 401/403、無 CORS、既有舊七工具，**只附加下列三項**到工具註冊清單：

1. `finance_budget_summary`（readOnlyHint）：`{month: YYYY-MM, currency?: TWD}`；呼叫前先檢查本人身分；轉發同名 `tools/call` 到 Edge；不可讓呼叫者傳任意 owner/user_id。
2. `finance_budget_categories`（readOnlyHint）：`{month: YYYY-MM, currency?: TWD}`；回傳分類預算與月份支出，不回傳交易備註。
3. `finance_budget_set`（寫入）：`{request_id: UUID, month: YYYY-MM, currency?: TWD, scope: total|category, category_id?: string, action: set|remove, amount?: integer, expected_version: integer}`。需有當前使用者對「預算設定」的明確指示；`scope=total` 不帶 category_id，`scope=category` 必須帶真實支出類別 ID；`set` 必須含 0..2^53-1 元整數 amount，`remove` 不得帶 amount；新預算 expected_version=0，改/刪請先查目前版號；未知結果重試同一 request_id，禁止生成新 ID 自動重送。

實際 JSON Schema 以`supabase/functions/lizhi-finance-site-mcp/finance-budget-contract.mjs` 的 `FINANCE_BUDGET_TOOLS` 為唯一正式來源，勿在 Site 手寫寬鬆的等價 schema。

## 正式驗收標準

- 原 Site 仍 Private + 本人驗證；非本人/登出/偽造 principal/Origin 仍拒絕。保留舊七工具；新 `tools/list` 實際列出 **10 項**。
- 由本人的 ChatGPT MCP 真實呼叫 `finance_budget_summary({month:"2026-12"})`，可讀回目前已批准測試的 2026-12 **NT$100**（若未被後續用戶修改）。
- `finance_budget_categories` 只顯示分類與累計數字，不能含任何交易備註或金鑰。
- 真實寫入測試原則上不修改使用者原有預算/交易；若需寫入測試，須本人明確批准測試金額／月份。只測語法拒絕、匿名拒絕、schema 錯誤及 Edge 的不可逆副作用不得發生。
- RLS/SQL 指令、服務升級前後皆使用既有 Supabase 流量監控 before/after，避免全量帳本回傳。驗收回退依序：將 Site 回原七工具、Edge 回原 stable 版本、保留新 P3 SQL 資料表（不能擅自刪除正式資料）。

## 絕不可假稱成功

僅原 Edge `tools/list` 出現 10 項**不等於**原私人 Site 能向 ChatGPT 提供 10 項。需分別證實：正式 SQL、正式 Edge、正式原 Private Site、ChatGPT 新載入工具清單及讀回。
