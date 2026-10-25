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

## 額外完成：具備 Feature Flag 的遠端讀取候選
- `supabase/functions/lizhi-cad-site-mcp/index.ts` 提供預設關閉的 `LIZHI_CAD_ENTITY_READ_V1` Gate。沒啟用時 **仍只有六項工具**；只有明確啟用才會把三項讀取候選列入工具清單。
- `entity-read-handler.mjs`：根據受限參數只呼叫 `lizhi_cad_site_read_enqueue` 或 `lizhi_cad_site_read_job`，不重送、不直連 DXF，讀回結果由純數值白名單投影。
- `sites-migration/cad/site-entity-read.mjs`：可攜式私人 Sites 端候選，使用真實 owner session 與 server-only token，`redirect:manual` 並拒絕轉址；在 `entityReadEnabled===true` 前拒絕讀圖。**不是已經更新的 Site Worker**，也不會自行註冊工具。
- 新增 Node stub Edge/Site 間單次呼叫、登入權限、去敏與轉址拒絕測試，以及 Deno Edge 編譯 CI；這些仍須真正原生 WASM/正式 Private Site 適配後才能實機驗收。

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

## 2026-10-25｜固定來源真實 WASM／Chromium 隔離驗收

- GitHub Actions [#40173654439](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40173654439)：`build-native-wasm`、`native-browser-e2e` **兩項均 success**。
- 不是模擬畫布：在 runner 使用 Rust 1.95.0 + Trunk 0.22.0 重新編譯真正 CADCraft fork 固定提交 `cb256cf8a383c422482e8a455e3013887fa39a74`，產出 GitHub Actions artifact `lizhi-cad-entity-wasm-preview-candidate`（無正式部署，保留 7 天）。
- Chromium 開啟同源的原始「立之雲端庫 CAD」工作檯，使用真實 WASM；在取得人工 AI 授權後，原生 new / line 指令畫出線條 `(0,0) → (800,900)`，再以 `lizhi.inspect`、`lizhi.entities` 讀回唯一 LINE 的 `handle`、`revision` 和精確 `geometry.a/b` 座標。
- 實際測試判定：無 AI 授權不能讀圖；限量讀取成功；兩次 read 之間 revision 不變；原始路徑、檔案、文字資料不得被意外回傳；無界 read / 任意路徑 / erase 拒絕；按 STOP 後再次讀圖必須拒絕。GitHub artifact `lizhi-cad-entity-read-real-wasm-evidence` 留存 JSON 與 Chromium 畫面。
- 這項成功代表**瀏覽器本機 CAD 原生讀圖功能真實可執行**；它不是正式 ChatGPT MCP 7–9 工具的 E2E。後者仍須同一新版 WASM、正式 SQL、Edge Feature Gate、Site MCP 授權與配置整條路徑發布後才能驗收。
- 後續再修正候選 `cad/cad-host.js` 的人工同意對話，明確告知「限量讀取圖元」及移動需二次確認，測試檔 `tests/cad-entity-local-bridge.test.mjs` 加入回歸。維持使用者控制與 local-first。

## 2026-10-25｜原生精確改線條（隔離 Chromium）驗收

- 新增 `tests/cad-entity-native-move-e2e.cjs` 與 `.github/workflows/cad-entity-native-move-qa.yml`，**沿用上一個已通過源碼驗證的 WASM artifact**（同一固定原生 Rust SHA，不重新下載不明二進位）。
- GitHub Actions [#40174310191](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40174310191)：`native-move-chromium` **SUCCESS**。
- 測試具體順序：新公制圖面 → 原生畫直線 (0,0)–(800,900) → `lizhi.inspect/entities` 取 handle+revision → 以錯誤 revision 請求移動遭 `CAD_REVISION_CONFLICT` 拒絕且不改座標 → 人工確認按「取消」後 revision 不變 → 正確 revision 配合瀏覽器人工確認將直線向右移 100mm → 重新讀取線條座標是 (100,0)–(900,900)，同一 handle，revision 增加 → 使用舊 revision 再移動被拒絕、無重複修改。
- 以 GitHub Actions artifact `lizhi-cad-native-move-chromium-evidence` 保存隔離測試畫面與 JSON；沒有修改使用者現有 `Drawing1` 或正式 DXF。
- `cad/cad-host.js` 本地許可提示同步更正，**明確揭露會限量讀取圖面圖元幾何**及修改需二次確認。Node 同源宿主回歸 + Deno/PG16 CI [#40174036159](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40174036159)：4/4 PASS。
- **能力界線**：只能確認候選新版 Native WASM 在隔離瀏覽器可精確改線；ChatGPT v3 Site 正式工具仍六個，沒有 `cad_move_entity` MCP API、正式 SQL 写入/工具曝光或正式改圖驗收。必須經過明確授權、API 安全審查及人工確認，才可接遠端編輯，且不可自行重新發送結果不明的移動指令。


## 2026-10-25｜私有 Site → Deno Edge → 隔離 Supabase RPC 綜合驗證

- [GitHub Actions #40175228806](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40175228806)：**5/5 PASS**，工作包括 `read-site-to-edge-to-rpc`、`read-contract`、`edge-check`、`read-postgres`、`no-deployment`。
- 新增 `tests/cad-entity-read-fake-postgrest.mjs` 與 `tests/cad-entity-read-full-loopback.test.mjs`。在 CI runner 真正啟動 `site-entity-read.mjs` 呼叫 Deno Edge HTTP，Edge 透過 Supabase JS Client 向**本地假 PostgREST** 送出獨立 `lizhi_cad_site_read_enqueue/read_job` RPC。驗證逐筆入列與結果查詢各發送一次，原生樣式 LINE 的 handle/revision/幾何座標 (0,0)-(800,900) 正確回傳，檔名與任意 text/path 欄位移除；非本人、未設定 Secret、Gate OFF 均不發出上游請求。正式 Supabase 無變更。
- SQL 002 候選 `lizhi_cad_site_read_job` 已追加**再次檢查 owner session 是否 enabled、租約與 30 秒心跳**的條件，已完成的幾何讀取結果在使用者 STOP/會話逾期後也無法再讀。隔離 PostgreSQL 新測試驗證 STOP 之後完成回執取回是 NULL、入列拒絕，未放寬使用者角色權限。
- 上述實測的真正 Rust/WASM 是另一段 [#40173654439](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40173654439) 的獨立 Chromium；本次全鏈路 HTTP 到**模擬 PostgREST**，仍不能宣稱正式九項工具已部署或生產端 CAD 圖元已可被 ChatGPT 查詢。
- 正式發布閘門：須審核 source-pinned WASM 相容更新及原 CAD 使用者授權、僅在使用者另行同意新資料庫變更後套用 002 SQL、部署預設關閉新讀取 Gate 的 Edge，原私人 Site 於同一專案完成新工具真實註冊與本人授權，再開 Gate 做真正 ChatGPT→Supabase→本機 WASM 讀圖/STOP E2E。移動/刪除/修剪仍不在此釋出範圍。
