# 立之理財管家｜將既有私人 Site v3 升級為遠端網站操作 v4

## 既有站點（不可建立第二站）

https://lizhi-finance-agent-20261025.lihuany635.chatgpt.site

**目標**：讓一般 ChatGPT 操作原本的 Finance 網頁，不要每新增一種記帳功能就新增財務專用 API。網站按一次「允許理財 AI 操作」，ChatGPT 透過 4 支通用 UI MCP 工具辨識、點選、填寫、等待確認、讀取執行結果。

## 整體架構

ChatGPT → 私人 Site（可信本人認證及 server-only token）→ Supabase Edge `lizhi-finance-site-mcp` → service_role 專用、擁有者 UID 固定的 UI queue RPC → 原 GitHub Pages 理財管家瀏覽器（第一方登入＋使用者按下授權按鈕）→ 既有 FinanceHome UI → 既有交易 CRUD / IndexedDB → 原 Finance Sync → Supabase。

新工具永遠不直接修改 `lizhi_finance_records`，也不接受任意 JS、SQL、CSS 選擇器或外站 URL。

## 現有 5 項唯讀 MCP（不得移除）

- `finance_status`
- `finance_accounts`
- `finance_cards`
- `finance_month_summary`
- `finance_recent_transactions`

## 新增 4 項通用 UI MCP（直接沿用下列 JSON schema）

以 `supabase/functions/lizhi-finance-site-mcp/site-contract.mjs` 中 `FINANCE_UI_SITE_TOOLS` 為唯一準則：

1. `finance_ui_sessions({})` — 確認真正在線、仍有本人授權的瀏覽器工作階段。
2. `finance_ui_inspect({session_id,request_id})` — 排隊讀取目前網頁的可見控制項；回 `job_id`，再呼叫 `finance_ui_job` 取結果，包括 `revision`、`ref`、label、欄位類型。
3. `finance_ui_action({session_id,request_id,revision,ref,action,value?,confirm?})` — 排入一筆 `click`／`fill`／`select`，只可操作前一步 UI 清單中的控制項。
4. `finance_ui_job({job_id})` — 查詢 queued / claimed / succeeded / failed / cancelled / expired 及回報；queued 不是完成。UI event dispatched 不是帳本已寫入，必須另外驗證交易紀錄。

每一步 UI 動作之後，都必須重新 `inspect`，使用**新的** `revision` 和 `ref`，不能重播過期 ref。萬一逾時／網路未知，不得重新產生 request_id 重試財務寫入。

## GitHub 程式

- `finance/remote/finance-browser-ui-agent.js`：限定 Finance 區塊的 DOM 讀取與 click/fill/select 驅動；不讀敏感欄位與輸入現值、不支援任意腳本。
- `finance/remote/finance-browser-relay.js`：第一方 Auth 瀏覽器 heartbeat / claim / complete，單次執行 UI 操作並回傳結果。
- `index.html`：載入兩個新腳本；原 `finance/pages/home.js` 與原存取流程未修改。
- `supabase/migrations/20261025162500_lizhi_finance_ui_control.sql`：私人短效佇列表 + 嚴格權限 RPC。
- `supabase/functions/lizhi-finance-site-mcp/site-contract.mjs`：5+4 MCP 工具列表及界限。
- `supabase/functions/lizhi-finance-site-mcp/edge-core.mjs`：Site Token 和 owner UID 固定的 server-to-server 呼叫。
- `finance/sites/site-worker-adapter.mjs`：既有私人 Site 轉接器，應保持 `verifyOwner()`、HTTPS 固定單次 POST、redirect:manual、不自動重試。

## 安全底線

- 本人需要在理財管家原網站 **真正點擊**「允許理財 AI 操作」，最多授權 30 分鐘；關閉網頁／登出／按「停止理財 AI 操作」立即停止。租約到期不得延長。
- Site 使用者是已經通過 Sites 身分驗證的本人，Supabase Edge 接受原本的 `LIZHI_FINANCE_SITE_MCP_TOKEN`，固定使用 `LIZHI_FINANCE_SITE_OWNER_UID`。
- Token 只在伺服器端環境，不能傳前端、回給模型、記錄日誌。
- 任何帳務真正寫入、刪除、封存、匯入等按鈕都須經**原網站原生**本人確認；Site MCP 傳 `confirm:true` 不能取代真人確認。
- 不准繞過 `FinanceHome` / `FinanceStorage` 既有交易驗證，不准直接以 service_role 寫財務表。
- 不准將「UI 已送出 click」當成交易成功；必須檢查 `finance_ui_job` 收據，且適當再確認雲端同步快照是否更新。

## 真實驗收順序

1. 新 4 個工具在正式私人 Site `tools/list` 可見，舊 5 個工具仍可用，維持僅我可見。
2. `finance_status` 回傳既有真實同步帳本且無回歸。
3. 未開原理財家頁／未按按鈕時：`finance_ui_sessions` → `sessions:[]`，絕不能操作。
4. 開立之雲端庫 Finance 頁、登入並點「允許理財 AI 操作」；`finance_ui_sessions` 顯示新在線 session。
5. `finance_ui_inspect` → `finance_ui_job` 返回可見控制項，無 token / password / 卡號／備註。
6. 用無害的 UI 導覽、輸入測試（不提交）驗證 `finance_ui_action`；操作後重新讀取 UI。
7. 真正寫入演練應由本人在網頁確認，僅在明確指定測試記帳時執行；立即核對本機 Ledger 與成功同步快照。禁止以虛構成功紀錄代替真實執行。
8. 停止授權／登出／到期後的操作應拒絕。
9. 私人發布原 Site 為 v4 或後續版本，確認正式 Worker 使用正確 Secrets 修訂。

## 狀態標記

GitHub branch/PR、SQL migration、Edge Function、Site 私人發布及 ChatGPT 真實 UI 操作都是不同驗收項目。只有五個階段都通過，才能宣稱「ChatGPT 已能完整操作理財網站」。
