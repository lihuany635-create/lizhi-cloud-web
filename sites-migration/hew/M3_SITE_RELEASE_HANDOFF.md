# 立之 3D 建模｜M3 正式 Site 接線交接（2026-10-25）

**實際狀態：3D SQL 工作佇列與專用 Edge 已部署；3D 私人 ChatGPT Site 尚未建立／發布；Hew 目前只有 DEV 登入工作橋接。**
**請勿把 2D CAD Site v3 誤記成 3D Site 已完成。**

## 本次真正完成

- Supabase 專案：`hrdzywkihfqggiwjgavi`（既有立之雲端庫）。
- 正式 migration：`20261025084659_lizhi_hew_model_queue_v1`；來源 `hew/sql/001_model_queue.REVIEW_ONLY.sql`。只新增 `lizhi_model_private` 獨立表及 `lizhi_model_*` RPC，不修改 2D CAD/手機/Finance 舊表。
- 正式讀回證實：`sessions=0`、`jobs=0`、`anon` 及 `authenticated` 都不能 `EXECUTE lizhi_model_site_enqueue(...)`、`service_role` 可以；`lizhi_model_one_active_claim_per_session` 確實存在。
- 正式獨立 Edge Function：`lizhi-model-site-mcp` **v1 ACTIVE**，`verify_jwt=false` 僅因採用自訂固定 Bearer 並在伺服器端核對。若獨立 token/owner 未配置，Edge **fail closed** `MODEL_UPSTREAM_NOT_CONFIGURED` (503)。**不能把 ACTIVE 誤認成可以登入使用。**
- 從 Supabase `get_edge_function` 讀回 v1 的三份檔案：`index.ts`、`edge-core.mjs`、`model-site-contract.mjs`，逐字對照同 GitHub 分支均完全一致。來源包 `ezbr_sha256=3de19f465bd132916de65f4b5ae226e9902097e3b168bd2804e4de2f7bb1b4c7`。
- Site Worker 僅發出**一次**上游 POST，`redirect:"manual"`，嚴格拒絕 HTTP 3xx；這是從 CAD Site v3 真實失敗中承襲的修正，避免 `redirect:"error"` 在 Sites Worker 內觸發例外。
- 新增 `sites-migration/hew/site-mcp-route.mjs`，可攜式 **PRIVATE Site 的 /mcp route**，在可信 Site server session 確認本人後提供 `initialize/ping/tools/list/tools/call`；六工具 `model_status`、`model_new_document`、`model_create_box`、`model_move`、`model_scene`、`model_job_status`。
- Node Site/Edge 跨層回歸：27/27 PASS（測試用 fake SQL，不是正式 Site）；隔離 PostgreSQL16 領取併發及撤銷測試：`LIZHI_MODEL_POSTGRES_16_ISOLATED_TEST_PASS`。Hew browser repo `lizhi-hew` 的 Chromium 3/3 PASS（mock owner Auth/RPC → 真 WASM 幾何實體與 ACK）。

## 尚未完成，必須處理

### A. Edge 與私人 Site 的獨立 Secret（請直接在各自管理介面安全設定）

由使用者自己產生**全新** 64 字元以上隨機十六進位字串；同一字串分別存放在：

- Supabase Edge `LIZHI_MODEL_SITE_MCP_TOKEN`
- 新的「立之 3D 建模代理」私人 Site **伺服器端** `LIZHI_MODEL_SITE_MCP_TOKEN`

Supabase Edge 另外需要 `LIZHI_MODEL_SITE_OWNER_UID`，值是**本人的** Supabase Auth UUID；這個值不能從 ChatGPT 推測，也不能以其他使用者 UID 代替。
私人 Site 另外需要 `SITE_MODEL_OWNER_EMAIL`，僅用於可信登入 middleware 比對。**絕對不可把上述 Secret、JWT 或 service_role key 貼到 GitHub、ChatGPT 對話、網頁 JS 或前端 Console。**
不要重用任何 CAD、手機、LINE 的 Secret。任何配置尚未透過正式 Site tools/list + tools/call 實測，仍屬 NOT_TESTED。

### B. 建立 ChatGPT 私人 Site「立之 3D 建模代理」

- **PRIVATE / 僅你可見**，不要覆蓋既有的「立之 CAD 指令代理」Site v3。
- 掛載伺服器處理器 `sites-migration/hew/site-mcp-route.mjs` 或 Sites 原生 MCP toolkit：
  - `modelSiteTools` = `hew/sites/model-site-contract.mjs` 的六工具規格。
  - `handleModelSiteTool(name,args,trustedSiteAuth,serverSecrets)`；`trustedSiteAuth` 由 Sites 平台可信本人登入提供。
  - `serverSecrets={ownerEmail:SITE_MODEL_OWNER_EMAIL,siteMcpToken:LIZHI_MODEL_SITE_MCP_TOKEN}` 只准伺服器端注入。
  - 上游固定 `https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-model-site-mcp`。
- 登入本人後由 ChatGPT 真的 `tools/list` 看見六工具；先 `model_status`，不能聲稱只在程式或 Site 頁面顯示六個文字就是連線成功。
- 未開啟並授權的 Hew 模型工作階段時，`model_status` 應該安全回 `online:false`，不是任意啟動模型或提供檔案存取。
- `model_new_document` 仍需防未儲存圖檔守衛，未實作時必須回絕；不能透過其他任意 RPC 旁路執行。

### C. Hew 入口的真實 Owner Auth + 模型持久化

目前 Hew Fork 的 `LizhiModelQueuePilotPanel` 只在 **DEV** 模式有效，僅接受 Hew 頁面**同 origin** 的 `window.LizhiAuth.client`；獨立跨站不能直接取得登入，絕不可用 query string 或 `postMessage` 傳 JWT 來假裝解決。

要在一般 ChatGPT 真正建立模型，仍需把 Hew 建模頁面部署成可信 origin 並完成正式 Supabase Auth（或正確同源嵌入立之雲端庫）及穩定的 .hew 文件 ID/revision。正式使用前完成「登入本人 → 手動允許 AI 120 秒 → `model_status` 看見 session → `model_create_box` 1200×600×750mm → `model_job_status=succeeded` → 確認模型與檔案重新開啟」。

**任何一步未驗證，不標 M4 完成。**

## 檢驗路徑

- Site MCP handler: `sites-migration/hew/site-mcp-route.mjs`
- Edge: `supabase/functions/lizhi-model-site-mcp/{index.ts,edge-core.mjs,model-site-contract.mjs}`
- Site/Edge SQL Test: `tests/hew-site-mcp-route.test.mjs` 等。
- Private Queue SQL: `hew/sql/001_model_queue.REVIEW_ONLY.sql`、`tests/sql/hew_model_queue_isolated.test.sql`
- Hew Fork: `lihuany635-create/lizhi-hew` Draft PR #1；雲端庫 Draft PR #12。
- 立之工作台 ID：`f1dd7512-ce86-4268-b7cb-b4edd11ce8d7`

**明確限制：** 目前沒有可用工具直接在使用者 ChatGPT Sites 管理介面建立/私人發布 Site、配置 Edge secrets 或為正式 Hew 註冊 Google OAuth callback，因此此交接文件不可被當作上述管理動作已完成的證據。


## 2026-10-25｜正式私人 Site v2 真實 MCP 連線成功

- Site: `https://lizhi-model-agent-20261025.lihuany635.chatgpt.site`；使用者回報 v2 已私人發布、僅本人可見，原 CAD Site 未改。
- 使用者回報 v1 Worker 仍採 Secret revision 1（Sites Settings 已到 revision 3）；v2 已更新並補充安全診斷。未顯示任何機密值。
- **這不是只憑報告**：本次一般 ChatGPT 對話實際載入六項 `model_*` MCP 工具，並成功呼叫正式 `model_status({})`。工具實際回應（去識別化）為：

```json
{"ok":true,"online":false,"requiresExplicitPageConsent":true,"sessions":[],"siteConfiguration":{"release":"2.0.0","runtimeSource":"worker_env","secretPresent":true,"tokenFormatValid":true,"ownerEmailConfigured":true}}
```

- 這證明 **ChatGPT → 私人 Site v2 → Supabase Edge 的正式唯讀 MCP 查詢可用**，先前 `MODEL_SITE_NOT_CONFIGURED` 問題已解決。
- 尚不能宣稱正式 ChatGPT 3D 幾何建立成功：`online:false` 與 `sessions:[]` 表示沒有 Hew 授權的工作階段；Hew Browser 的 `LizhiModelQueuePilotPanel.tsx` 現在仍 DEV-only， standalone Hew 未提供可信同源 `window.LizhiAuth`；文件 UUID 仍是 per-page ID； scene 摘要未實作。
- 下一步應在 Hew Fork 建立真正可開啟的本人登入／文件識別入口，保留短時效明確人工允許後才能執行 claim；最後在已授權的模型分頁以 `model_create_box` 入列一次，回報 `model_job_status=succeeded`，並人工確認實體與 .hew 儲存／重新開啟。

