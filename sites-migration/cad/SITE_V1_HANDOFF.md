# 立之 CAD｜比照 A22 v9 私人 Site 的 MCP 接線交接

**狀態：隔離候選版。Site 尚未建立／部署，Supabase 新服務尚未部署。不得將本專案標成已連線。**

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

**重要：目前 CI 第一輪顯示 Node adapter PASS，但 Deno 型別檢查與 PostgreSQL 候選驗收 FAIL，尚未達部署門檻。** 不允許使用者在這個狀態套用 REVIEW_ONLY SQL 或手動部署。

## 建立 Site 時的嚴格要求（待 CI 修好）

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
