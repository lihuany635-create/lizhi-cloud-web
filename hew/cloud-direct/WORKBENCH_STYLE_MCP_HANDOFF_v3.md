# 立之 3D 建模代理｜工作台式雲端直連改造交接 v3

**2026-10-26 真實範圍：正式資料庫與 Edge cloud route 已部署；私人 Site 仍為 v2 工作佇列模式，尚未發布 v3；Hew 的雲端模型視覺同步及原生 .hew 儲存未完成。**

## 使用者明確要求（取代先前 30 分鐘方案）

以已正式運作的「立之雲端庫製作工作台」為架構模板：

`一般 ChatGPT / 私人 Site MCP → Supabase Edge → 長期持久化 SQL 模型文件 → 使用者開啟 Hew 才載入/呈現`

使用者不想開啟 Hew 才能讓 ChatGPT 新增／移動雲端模型，不想按連線、不想 120 秒／30 分鐘授權、不想等待瀏覽器領取工作，也不想用 Work 進行日常建模。

### 與「工作台」已核實的相同處

- 已部署工作台 Edge `lizhi-production` v16 使用專用伺服器 AI 憑證 → 使用者獨立的 `lizhi_production_state(owner_id,revision,data)` JSONB、帶 revision 比對與持久化。不需要工作台網頁開啟。
- 3D 專案採相同路徑，**不用挪用工作台的狀態表**，有獨立 `lizhi_model_private.cloud_documents` 和 `cloud_requests`。以 Edge 專用 Bearer 識別可信 Site、`LIZHI_MODEL_SITE_OWNER_UID` 限定 owner，僅 service_role 使用雲端模型 RPC。
- `revision` 單調遞增；每次寫入必須有 `request_id`；資料庫以 UNIQUE(owner_uid,request_id)、owner-scoped row-lock 和 revision 比對實現不可重複寫入、不跨文件寫入。

## 已實際部署

- Supabase 正式 migration `lizhi_model_cloud_direct_v1` 已透過 `apply_migration` 成功，只新增兩張私有資料表及三個 `lizhi_model_cloud_*` RPC。
- 正式資料庫讀回 `cloud_documents=0`、`cloud_requests=0`，anon/authenticated 對 cloud_write 沒有 EXECUTE 權限且對私有 schema 沒有 USAGE，service_role 有 EXECUTE。
- 原 `lizhi-model-site-mcp` Edge v6 → **v7 ACTIVE**，保留舊 `/functions/v1/lizhi-model-site-mcp` 路由，新增 opt-in `?cloud=1`。正式五份 Edge 原始碼已逐字與本 PR GitHub 來源核對完全一致。
- 本對話呼叫原 Site v2 的 `model_status` 仍成功，舊代理尚未被破壞。
- GitHub Actions isolated CI（`hew-cloud-direct-contract.yml`）：Node 核心模型合約、Site→Edge mock SQL 三層鏈、Edge 部署來源一致性、PostgreSQL16 owner/revision/idempotency 均成功。**不代表已從使用者 ChatGPT 透過 v3 Site 建立真實模型。**

## 私人 Site v3 升級：同一個 Site，不新建

原站 `https://lizhi-model-agent-20261025.lihuany635.chatgpt.site`

使用者必須在 Sites 編輯器修改**現有**「立之 3D 建模代理」，Private、原 Secret、本人的可信 server login 全部保留。

Site 伺服器採用：

- `sites-migration/hew/site-cloud-direct-tools.mjs`：`cloudModelSiteTools`＋`handleCloudModelSiteTool`。
- `sites-migration/hew/site-cloud-direct-mcp.mjs`：新版 `/mcp`，六個雲端模型工具（JSON-RPC）。
- 上游固定 `https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-model-site-mcp?cloud=1`。
- 沿用兩個**既有** Site Secret：`LIZHI_MODEL_SITE_MCP_TOKEN`、`SITE_MODEL_OWNER_EMAIL`。不要求重新產生/回傳 Secret。
- Trusted Site identity、server-only Bearer、`redirect:'manual'`、單次 POST、不自動 retry 不可去掉。
- 六工具改成：`model_status`、`model_list_documents`、`model_new_document`、`model_create_box`、`model_move`、`model_scene`。沒有 `session_id`、`model_job_status`、`poll`、30 分鐘/120 秒頁面授權。
- 所有模型寫入傳 `document_id`、`revision`、`request_id`；資料庫完整發出新 revision、entity ID 的原子回執，Site 直接回 ChatGPT。保留 MIME/資料大小等限制。

### 上線後必須驗收

1. 私人 Site v3 實際 `tools/list` 在新 ChatGPT 對話載入新版六工具。
2. `model_status` 返回 `mode:'cloud_direct'`、`requires_browser:false`，即使 Hew 未開啟也成功。
3. `model_new_document` 新增一份模型並返回 `document_id`、`revision:1`。
4. `model_create_box` 用 `revision:1` 新增 1200×600×750mm 方體並回傳 `revision:2`、`entity_id`。
5. 以 `model_scene` 唯讀讀回相同物件座標、尺寸與版本；同 `request_id` 重送不新增第二筆、舊 revision 不覆蓋。
6. 原 CAD Site、Finance、手機與工作台完全不改。

## 明確未實作，不能聲稱完成

- `cloud_documents` 為可持久化的**參數化幾何規格**：方體及位移，不是已由 Hew 原生 WASM 生成/儲存的 `.hew`、`.glb` 檔案。
- 下一階段需在 **Hew 編輯器頁面**登入後從此雲端文件取得快照，依照 stable entity ID 物化/對應到 Hew Scene；再實作人工變更後的雲端雙向同步與 .hew 版本化持久儲存。不能將 JSON 物件直接冒充原生 Hew 完成品。
- 正式 Site v2 仍會顯示舊的 30 分鐘架構；完成 v3 私人發布並在一般 ChatGPT 真正查到 cloud status 前，不標示 M3 完成。

## GitHub

- Existing cloud-web main 原 CAD/Hew 頁保持不變。
- 開發分支：`feature/hew-workbench-cloud-direct-v1-20261026`。
- 僅合併實際通過 CI 的檔案；未經核准不刪除既有 queue 相關 SQL 或已建立使用者圖面。
