# 立之 CAD｜比照 A22 v9 私人 Site 的 MCP 接線交接

**狀態（2026-10-25）：使用者已建立私人 Site v1 並儲存，尚未發布；正式 Supabase 專用三個 RPC 與 Edge 已部署。但一般 ChatGPT 六工具、正式 Sites identity／Token 及實機 CAD 繪圖尚未完成端到端驗收。不得標成『ChatGPT 已連線／已繪圖』。**

## 已驗證的手機路徑

手機的最終實機路徑是：
`一般 ChatGPT → 既有私人 Site v9 的 /mcp → 原 lizhi-mobile-mcp → 本人 A22`。
不是另外建立的 `lizhi-mobile-oauth-mcp`。成功的關鍵是**ChatGPT 真正使用中的 Site 端點直接註冊六個工具，並在此路徑做工具掃描及實機操作**。

CAD 改為：
`一般 ChatGPT → 私人「立之 CAD 指令代理」Site /mcp → lizhi-cad-site-mcp → 現有 Supabase 短效幾何命令佇列 → 使用者已開啟的立之雲端庫 CADCraft WASM`。

CAD 繪圖 UI 仍使用 `https://lihuany635-create.github.io/lizhi-cloud-web/?open=cad`；Site **只是 ChatGPT MCP 工具入口**，不可當成第二個 CAD 引擎或另一份圖檔倉庫。

## 目前實作候選（GitHub 分支）

- `cad/sites/cad-site-contract.mjs`：六個工具（`cad_status`, `cad_draw_rectangle`, `cad_draw_line`, `cad_draw_circle`, `cad_new_drawing`, `cad_job_status`）、嚴格數值／座標／UUID 驗證。不允許腳本、任意檔案路徑、下載 DXF 或其他工具名稱。
- `sites-migration/cad/site-tools.mjs`：**私人 Sites 伺服器專用**的 tool adapter。要求 Sites 可信登入上下文的 `signedIn===true` 和 `verifiedUserEmail===SITE_CAD_OWNER_EMAIL`。絕對不能從自訂 HTTP Header、前端輸入或 MCP 工具參數採信 user/email。**每個動作只呼叫上游一次，不自動重試。**讀回資料有大小限制。
- `supabase/functions/lizhi-cad-site-mcp/index.ts`：類似手機既有 `lizhi-mobile-mcp`，站對站 bearer token 限制，來源固定，只有 MCP 六工具。需要 Edge server-only token、owner UID，以及 Edge 本身的 service-role credential，不暴露給 Site。
- `cad/sites/sql/001_sites_bridge.REVIEW_ONLY.sql`：三個僅供 `service_role` 呼叫的 CAD 專用 RPC；保留本機瀏覽器 original JWT `begin/heartbeat/claim/finish`，不修改 Finance、Engineering、手機或圖書館。僅傳有限幾何 JSON 和作業結果，不傳 DXF。
- `tests/cad-sites-contract.test.mjs`／`tests/cad-sites-postgres.sql`：隔離測試。
- `.github/workflows/cad-sites-bridge-qa.yml`：Node 24、Deno 2、Postgres 16，一律不部署。

**候選版三項 CI Job 均 PASS**：[GitHub Actions 40161330829](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40161330829) — Node Site 合約 7/7、Deno Edge 型別檢查與匿名／錯誤 Bearer／Origin／有效 Bearer／超大 UTF-8 位元組負載的真實 HTTP 測試、PostgreSQL 16 service-only 權限／佇列／瀏覽器完成確認。前一輪 Deno union narrowing 與 PostgreSQL 測試誤讀私有 schema 均已修復。這不代表已建立／部署私人 Site，也不是已在真實 ChatGPT 對話讀到六工具。**新 SQL 仍是 REVIEW_ONLY，不可直接套正式 Supabase，需先完成獨立 Secret/owner UID 和 Site 部署審查。**

## 2026-10-25 追加防護與驗證

- 最新原始碼提交 `a3c10a48dbfcd77d9f7c45222fc24025133199a9`（PR #11 仍 Draft）。
- Edge HTTP 以 streaming 限制整個 request body 至 16 KiB **實際 UTF-8 位元組**；不信任 Content-Length，也不會先讀取無限制本文。修正了有效 Content-Length 會被錯誤判成 HTTP 413 的缺陷。
- Node Site adapter 的合約 7/7 PASS；另新增兩項 Edge 真 HTTP smoke tests，確認匿名 401、錯誤 Secret 401、帶 Origin 403、正確測試專用 bearer tools/list 200 且正好六工具、超限 413。HTTP CI 用的假金鑰不是正式 Secret，也未呼叫正式 Supabase。
- SQL 先辨識完全相同的 `request_id`，即使近一分鐘已達 20 筆上限，仍回原 job_id；相同 request_id 改參數會拒絕，新指令仍受限速。已由 disposable PostgreSQL 16 驗證；沒有套用正式 schema。
- 這些安全測試只涵蓋 **GitHub Actions 臨時服務與模擬登入提供者**。並未實際驗證 ChatGPT Sites 私人 owner middleware、正式 Secret 配置或一般對話載入工具。正式發布閘門持續關閉；不得將 `verify_jwt=false` 誤當匿名公開授權。

## Site /mcp 伺服器註冊候選（不是已部署）

- 新增 `sites-migration/cad/site-mcp-route.mjs`，提供 `handleSiteCadMcpRequest(request,trustedSiteAuth,serverOnlySecrets)`。僅支援 `POST /mcp`、JSON-RPC `initialize/ping/tools/list/tools/call`，server-side 驗證本人後才列六工具或轉呼叫上游。假冒 Header、工具參數均不能作身份來源。
- 這是無法直接變更 Sites 編輯器時的 **可攜式處理器**，不是完整 ChatGPT Sites 平台部署程式。Sites 原生 MCP runtime 若已提供工具註冊 API，優先直接註冊 `cadSiteTools`，再將每個工具綁至 `handleCadSiteTool`，不建立第二個並行 MCP server；確切整合方式需以實際私人 Site runtime 驗證。
- 若採用 portable handler，Sites 伺服器必須將 `POST /mcp` route 映射到它，並從可信 session middleware 取得 `signedIn` 和 `verifiedUserEmail`；不能傳 HTTP header 代替。Site /mcp 在未登入時 HTTP 401、非本人 403、帶瀏覽器 Origin 403、超長 body 413；這些在 Node mock Site Request 環境有測試，正式 Site 平台仍待獨立驗收。
- Site 的 `serverOnlySecrets` 只能由 server secure environment 注入：`{ownerEmail: SITE_CAD_OWNER_EMAIL,siteMcpToken:LIZHI_CAD_SITE_MCP_TOKEN}`。不要在公開頁面、bundle 或 log 內出現內容。
- JSON-only handler 是否與正式 ChatGPT Sites 的 MCP 傳輸要求相容，仍須在 Site 編輯器以真實 `tools/list` 與 `tools/call` E2E 驗證；不能以 Node 測試通過推定相容。

## 建立 Site 時的嚴格要求（隔離 CI 已通過，尚未部署）

1. 在 ChatGPT Sites 中建立**獨立私人 Site「立之 CAD 指令代理」**。不修改手機 v9 Site、不改手機工具／Secret，也不另外建立 CAD 繪圖網站。Site 設定 **PRIVATE / 僅你可見**。
2. Sites **伺服器端**儲存 `SITE_CAD_OWNER_EMAIL`、`LIZHI_CAD_SITE_MCP_TOKEN`，絕對不顯示其內容或放入 frontend/env-public。
3. 將 `sites-migration/cad/site-tools.mjs` 和 `cad/sites/cad-site-contract.mjs` 整合到 Site 的安全伺服器 runtime，在 Site **自己的** `/mcp` tools/list 公布六工具，tools/call 傳給 `handleCadSiteTool(name, arguments, trustedSiteAuth, serverOnlySecrets)`。不能只顯示六個按鈕或在前端發起 fetch，就假裝 ChatGPT 已能操控。
4. `trustedSiteAuth.verifiedUserEmail` 一定要由 Sites 可信登入 middleware 提供。不能使用任何 ChatGPT 推測的身份或前端 JSON。非本人返回 401/403。
5. Supabase 必須另設 `LIZHI_CAD_SITE_MCP_TOKEN`（和 Sites 同一**新**隨機值）與 `LIZHI_CAD_SITE_OWNER_UID`（本人的 Auth UUID），它們不是手機 Secret，也不是 Supabase service-role key；既有 Supabase Edge 自己安全使用 service-role，不交給 Site。此兩項設置若需要手動設定，請要求本人在 Dashboard 操作，**不要把 Secret 輸入對話或 GitHub**。
6. 先在 disposable PG、Deno 與 Site contract 全 PASS 才把新的 SQL 以獨立 migration 套正式 Supabase，部署 `lizhi-cad-site-mcp` 並驗證匿名 tools/list 401、錯誤 Secret 401、正確 Site Secret 列六工具。
7. 真正 Site 私人部署後，在 ChatGPT **連這個 Site**，新一般對話先檢查當次工具清單，確實有六項 CAD 工具，不能只拿 Edge tools/list 作證。
8. 開啟已部署的立之雲端庫 CAD，登入本人、手動按「允許 AI 操作」及「連線 ChatGPT MCP」開始短效佇列，確認 `cad_status` 讀到該 session，執行一筆 800×900 mm `cad_draw_rectangle` 並以 `cad_job_status` 確認 `succeeded`。真正 DXF 存檔仍在 CAD 本機，必要時另外確認 SHA-256 save-ack。

## 保留 / 不做的事

- 不修改手機 Site v9 或它的六工具；不共用手機 Token 或 OAuth Client ID。
- 不因使用者「手機可離線」就聲稱「CAD Browser 關閉後可繪圖」：本架構 CAD 引擎在打開的瀏覽器執行。關頁後 session 會過期。
- 原 `lizhi-cad-mcp` OAuth Edge 及私人 Plugin 保留，不刪除、不再當主連線途徑，避免中途破壞可回退資訊。
- Site 可以顯示工作狀態，但沒有圖面渲染或 file read/write 工具，請保留 CAD DXF 本機優先與使用者明確操作許可。


## 2026-10-25｜正式 Supabase CAD Site 專用中繼部署與核查

> 本節覆蓋本文上方記錄的「SQL 尚未套用／Edge 尚未部署」歷史狀態；上方其餘測試及安全要求仍有效。

- 使用者已明確授權部署專用 SQL 與 Edge Function，並回覆已完成 Sites 與 Supabase 的 CAD Secret 設定；**Secret 真實值與是否一致未能由此對話讀取，不能視為已驗證。**
- 正式 Supabase 專案 `hrdzywkihfqggiwjgavi`：使用 `apply_migration` 成功建立 migration `20261025044952_lizhi_cad_site_bridge_v1`。SQL 來自 Draft PR #11 固定提交 `db8bf0a7` 的 `cad/sites/sql/001_sites_bridge.REVIEW_ONLY.sql`，其來源 SHA 為 `fcdab187aa2d4828f185709e56a4ad1df47f8c13`。
- 實際 SQL 權限查核：`public.lizhi_cad_site_active(uuid)`、`lizhi_cad_site_enqueue(uuid,uuid,text,jsonb,uuid)`、`lizhi_cad_site_job(uuid,uuid)` 均成功建立；三者 `anon_execute=false`、`authenticated_execute=false`、`service_role_execute=true`。未改原有 CAD sessions/commands/claim/finish RPC，也未修改圖檔。
- 成功部署 Edge `lizhi-cad-site-mcp` v1，狀態 ACTIVE；獨立自原本 `lizhi-cad-mcp`。由於 Edge 程式以**自己核對 Bearer Secret**，`verify_jwt=false` 是預期配置，絕非開放匿名呼叫。以 `get_edge_function` 實際讀回正式程式檔，`index.ts`、`cad-site-contract.mjs`、`bounded-body.mjs` 均與固定 GitHub 提交內容逐字相同。
- Supabase Security Advisors 有一些既存的 RLS/definer/auth 警示；查核未觀察到命名為 `lizhi_cad_site_*` 的新函式警示。未擅自調整其他系統權限。
- GitHub Actions 隔離 CI `40162054896`（Node Site 路由、Deno Edge HTTP、PG16）三組 PASS，但它是**模擬驗證**，非正式 HTTP 上游實測。
- 目前環境無法從網際網路對正式 Edge 發起 POST；因此尚未完成正式匿名 401、錯誤 token 401、實際 Site token /tools/list 六工具 E2E。需由 Sites 已設定 Secret 的 server 端正式測試；不得貼出或展示金鑰。
- 私人 Site v1 的狀態根據使用者轉交：已儲存、15/15 模擬測試 PASS、尚未發布。正式 ChatGPT 對話尚未發現六工具，CAD 頁面尚未以 `cad_job_status=succeeded` 實機驗收。
- 下一步：在同一私人 Site 原專案中安全驗證伺服器端 Site Secret 可用與自己 Owner 身份後私人發布；由一般 ChatGPT 真正列出六工具，登入開啟 CAD 頁面並手動 AI consent，依序 `cad_status` → 一筆 800×900 mm 矩形 → `cad_job_status=succeeded`。若未成功，僅回報錯誤狀態，不自動重送繪圖指令。
