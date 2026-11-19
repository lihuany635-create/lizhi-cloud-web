# 立之理財管家 — 私人 ChatGPT Site MCP 中繼

## 與既有系統的分工

- **既有理財管家**：瀏覽器 IndexedDB `lizhi-finance` + 正式 Supabase 同步表 `lizhi_finance_records`。不修改 schema、RLS 或交易。
- **既有 ChatGPT OAuth Plugin**：`lizhi-finance-mcp`；保留不動，獨立由 Supabase OAuth JWT 驗證本人。
- **新增 Sites 上游**：`lizhi-finance-site-mcp`，與 CAD / 3D 的獨立 Site Token 模式相同，五項工具只查指定 owner UID 的同步快照。
- **私人 Site**：站點必須先根據 Sites **可信伺服器身分**驗證登入者；驗證通過後才用伺服器環境變數 `LIZHI_FINANCE_SITE_MCP_TOKEN` 發單次 HTTPS JSON-RPC POST 到固定上游 URL。不能把 Token 放前端。
- **明確區分狀態**：GitHub 原始碼、Supabase Edge 部署、Secrets 配置、私人 Site 發布、ChatGPT 真正載入工具、真人帳本端到端，都是不同驗收階段；不能互相代替。

## 上游網址

`https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-finance-site-mcp`

使用 MCP JSON-RPC：
`initialize`、`notifications/initialized`、`ping`、`tools/list`、`tools/call`。

工具：

1. `finance_status` — 雲端快照資料量及更新時間。
2. `finance_accounts` — 帳戶計算餘額。
3. `finance_cards` — 信用卡未繳款。
4. `finance_month_summary({month:"2026-10"})` — 指定月收支，卡費繳款不重複列入支出。
5. `finance_recent_transactions({limit:10})` — 最多 20 筆，不含備註／完整卡號。

## 需要設定的兩端 Secret

Supabase Edge Function 伺服器 Secrets（不要提交至 GitHub）：

- `LIZHI_FINANCE_SITE_MCP_TOKEN` — 隨機 64～128 個十六進位字元。
- `LIZHI_FINANCE_SITE_OWNER_UID` — 既有 Supabase Auth 本人 UUID；**不可由使用者在 MCP 請求指定**。
- `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY`：Supabase 官方環境提供，僅於 Edge 內使用。

私人 Sites Worker **伺服器端 Secrets**：

- `LIZHI_FINANCE_SITE_MCP_TOKEN` — 與 Edge 完全相同的金鑰。
- `SITE_FINANCE_OWNER_EMAIL` — 站點驗證所得本人電子郵件，必須從 Sites 的可信登入 session 取得，**絕不能從請求 body 或自訂 email header 取值**。

使用 `finance/sites/site-worker-adapter.mjs` 中的 `handleFinanceSiteMcp`，映射私人 Site 的 `POST /mcp`。**必須**傳入經 Sites 私人授權系統驗證的 `verifyOwner(request)` callback；若尚未取得可信身分 API，必須保持 403，不准降級成固定 Email 或跳過認證。

Sites 注意：

- 私人可見，絕不公開轉成可讀財務的網站。
- 同時確認 MCP 路由可被 ChatGPT 以使用者身分呼叫。
- 使用 `redirect:"manual"`、固定單次 POST、不重試。
- 從 Site 發往 Supabase 的請求不轉發瀏覽器 Origin、cookie 或用戶輸入的網址。
- Site 不保存／輸出 service-role 或站點 Token。
- `LIZHI_FINANCE_SITE_MCP_TOKEN` 新建或更新後必須**重新私人發布 Sites 版本**並重新實測；曾發生 Secrets 設定已儲存但正式 Worker 還在讀舊修訂的案例。

## 驗收順序

1. `node --test tests/finance-site-mcp.test.mjs` PASS。
2. `deno check --node-modules-dir=auto supabase/functions/lizhi-finance-site-mcp/index.ts` PASS。
3. Site Edge **未配置**時回 503；金鑰缺失／錯誤 401（必須在配置完整且以 POST 時檢查）；Browser Origin 403。
4. 手動配置 Edge Secrets；確認 `tools/list` 精確列出五工具，無寫入工具。
5. Sites 中継單次成功，部署為**私人 Site**；確認正式版持有新修訂 Secrets。
6. 以一般 ChatGPT 重新選取該 Site / App；實際讀 `finance_status` 和一個月收支，確認僅自己的已同步資料。未通過不可宣稱完成。

目前沒有 Sites 建立／私人發布權限的對話，不能自行聲稱第 5～6 步完成。

## P6 儲蓄／投資 Goals（本人登入直接寫入，候選未部署｜2026-11-19）

使用者已明確取消「真人逐筆 Passkey／確認視窗」需求。本候選只變更**理財規劃資料**，不執行銀行轉帳、信用卡付款或證券交易。

- 原十項 MCP 必須保留。設定 `LIZHI_FINANCE_GOALS_MCP_ENABLED=true` 才列出五項新增工具；`LIZHI_FINANCE_GOALS_BROWSER_ENABLED=true` 才開放網站目標 API。上述兩者均不會單獨啟用寫入。
- 寫入獨立總開關 `LIZHI_FINANCE_GOALS_WRITES_ENABLED=true`（預設 false）。尚未設定時，Browser Goals 與 Site MCP 均明確回應 `GOALS_WRITES_DISABLED`、完全不呼叫寫入 RPC。
- 原 Private Site Worker 先驗證平台真人本人 principal 並禁止 browser Origin，使用僅伺服器持有的既有 Site bearer 轉送。Edge 驗證固定 bearer、固定 owner UID，且**每次 Goals 操作**都用 Auth admin `getUserById` 檢查擁有者現況、預期 email 以及 ban 狀態；Edge 必須提供 `LIZHI_FINANCE_SITE_OWNER_EMAIL` 與既有 owner UID，缺少時拒絕。
- 原網頁每次操作使用本人 Supabase JWT，Edge 先以 `auth.getUser(jwt)` 驗證，必須為本人 UID、第一方 `aud=authenticated`、有效 `session_id`、AAL，且 JWT 不含 `client_id`；再以該 JWT 呼叫原 `lizhi_web_is_allowed` 做當下 allowlist 判定。只要任一環節不符就拒絕。
- 無 `prepare/commit`、`approved:true`、Bearer-HMAC、自行產生的「真人同意」憑證或 Passkey。網站單次送出 `action=write`，由 RPC 檢查 request_id 冪等、版本 CAS、唯一資金來源、金額範圍與保護性不可刪除；記錄 receipt，完成後重新讀取。
- **明確剩餘風險：** 放棄逐筆本人再驗證後，若已登入的本人 session / 既有 Private Site bearer 遭竊或遭授權程式誤用，攻擊者可能更改規劃資料。原 Site MFA/Passkey 不是必要條件，且 Auth logout 後 access token 的撤銷即時性尚須真人實測；不應謊稱能阻止所有憑證失竊。
- 本次修正為 PR #97 候選。正式更新前仍需原資料庫備份、隔離還原、整套相依 PR 安全整合、獨立複審、正式 Edge 與**原 Site 原地**接線及手機／電腦跨帳號測試。不建立第二套 Site、MCP 或資料庫。

來源：<https://docs.google.com/document/d/1298KW4gv_BmUYN0p0gMYsvuRyVMEfNvZ9OFg9aw7yVw/edit>
