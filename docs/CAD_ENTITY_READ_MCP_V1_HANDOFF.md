# 立之 CAD 原生物件讀取｜MCP 遠端擴充候選 v1

**開發分支：** `feature/cad-entity-read-mcp-v1`。僅候選，不修改正式私人 Site、正式 Supabase、CAD 網頁或 CADCraft WASM。

## 既有證據
- Site v3 的六項 MCP 已能在一般 ChatGPT 對話真實使用。矩形 `800×900mm` 經 `cad_job_status=succeeded`，並獲使用者目視確認。
- CADCraft Fork `lihuany635-create/lizhi-cad` 的 `feature/lizhi-cad-entity-inspect-v1` 已在原生 Rust/WASM browser message port 增加限定 `lizhi.inspect`、`lizhi.entities` 與人工確認的 `lizhi.move` 候選；瀏覽器同源宿主的限定命令也已有 Node 測試。不代表正式頁面已更新。
- **目前正式六工具不變**；可驗證源碼在 PR #11 的 `cad/sites/cad-site-contract.mjs`。

## 本輪實際程式
- `cad/sites/cad-entity-read-v1.mjs`：三個未啟用的工具 schema：`cad_inspect_drawing`、`cad_list_entities`、`cad_read_job`。前兩種工具只排入原生讀取工作，結果另查 `cad_read_job`；參數限制 session/request UUID、單頁 1–8、offset 0–10000、有限 type/layer/selected；只投影 revision、統計、有限純數值幾何的至多八筆圖元，不曝光圖檔文字、路徑、任意額外屬性。
- `cad/sites/sql/002_entity_read_jobs.REVIEW_ONLY.sql`：只候選 schema，在原有 `lizhi_private.lizhi_cad_commands` CHECK 擴充 `lizhi.inspect/entities` 兩個讀取命令；新的 `lizhi_cad_site_read_enqueue`、`lizhi_cad_site_read_job` 僅 `service_role`，查 owner+session+心跳，舊 OAuth `lizhi_cad_enqueue` 的 command validator 仍維持舊四種幾何操作。read_job 不返回任何寫入工作的 result。
- Node／PG16 隔離測試檔驗證訊息約束、越權、去敏、單筆入列、claim→finish→受限回執。

## 不可提前部署的原因
現有正式 CAD 網頁仍使用舊編譯的 CADCraft WASM，不認識新增 `lizhi.inspect/entities`；Site v3 與 Edge 仍只有六項工具。**以上只完成候選合約與 SQL，尚不代表 ChatGPT 已能讀取現有線條。**

## 後續實作順序
1. 核對 Fork Rust/WASM 與網站 CAD 本地宿主 `lizhi.inspect/entities` 回傳結構；編譯真實 WASM 並在非正式環境驗證同源 iframe 與使用者 opt-in。
2. 在 Edge 新增受特別 feature flag 保護的 read enqueue/result RPC 呼叫與讀回去敏；在私人 Site MCP 伺服器加入相同兩個讀取排隊工具和一個工作回執工具，**發版前先確保 DB、Edge、Site 和 WASM 相容**。
3. 發版採先相容的新 WASM／資料庫（審核後）、再 Edge、最後私人 Site；所有讀取必須本人短效授權，結果不得上傳或回傳完整 DXF、文字內容、路徑或隱藏資料。
4. 真正移動、刪除與修剪屬於另一條必須人工確認的寫入流程。限定原生 `lizhi.move` 尚未發布；必須檢查 handle、圖面 revision、圖層鎖定、原子性及 undo，成功後才擴充 MCP，不能透過 prompt 直接讓它編輯既有線條。

## 驗收基準
- 在實際 CADCraft 開啟且本人授權後，ChatGPT 讀回一筆已知矩形/線條：`cad_inspect_drawing` 入列 → `cad_read_job` succeeded → `cad_list_entities` 入列 → `cad_read_job` succeeded。
- 單頁最多 8 筆、最多 2.8–3.5KiB 受限資料，無 DXF bytes；反向 ID／越權拒絕；逾時不自動重送；關頁/STOP 撤銷。
- 圖面已變更必須修訂 `revision`；修改命令只允許針對事先讀取的版本和穩定 handle，先二次確認才可更動。
