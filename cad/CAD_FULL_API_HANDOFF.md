# 立之 CAD｜完整指令＋雲端執行器交接 2026-11-02

> **狀態：分支候選 `feature/cad-full-api-20261102`（立之雲端庫）與 `feature/lizhi-cad-full-api`（lizhi-cad）。未套用 SQL、未部署 Edge、未重新發布私人 Site、未重建 CAD 網頁執行檔。**

## 目的

原本 ChatGPT 只能在 CAD 畫矩形、線、圓、開新圖（加上少量唯讀）。現在開放 CADCraft **全部 431 個指令**，並新增電腦關機也能用的雲端模式。

## ChatGPT 工具（同一個私人 Site「立之 CAD」）

| 工具 | 作用 |
|---|---|
| `cad_api_reference` | 搜尋 431 個指令，或看單一指令的參數說明（不需連線） |
| `cad_call` | 對開著且已允許 AI 的 CAD 頁面執行一個操作 |
| `cad_job_status_v2` | 讀結果：輸出、提示狀態、revision 前後、錯誤、渲染圖直接顯示 |
| `cad_cloud_documents` / `cad_cloud_new_document` | 雲端圖面清單／新建 |
| `cad_cloud_call` / `cad_cloud_job_status` | 雲端執行（電腦關機也可）／讀結果 |

`cad_call` 與 `cad_cloud_call` 的 `op`：
- `execute {command, params}`：任何指令的 JSON 形式，不開對話框
- `cmdline {text}`：像打字一樣，例如 `line 0,0 @10,0 @0,5 c`
- `script {text}`：多行腳本
- `commands {filter}`：指令清單
- `inspect {entities?, limit?}`：圖面摘要
- `render {width?, height?, window?}`：PNG

原本的 6 個工具與唯讀工具不變。

## 安全規則（Edge、資料庫、CAD 引擎三層）

- **封鎖**：開檔／關檔／復原、載入程式（appload、lisp）、`.scr` 檔、出圖設備等會換掉或關掉你開著的圖、或碰到檔案系統的指令。
- **需要確認**：破壞性指令（erase、purge、new、audit、`*.delete`、overkill…）必須 `confirm_destructive: true`，而且只能在你在對話裡同意後使用。別名也會檢查，例如 `e` = erase。
- **不接受路徑**：任何 `path`、`file`、`template`、`url` 等參數一律拒絕。
- **存檔**：瀏覽器模式沿用你原本的存檔確認流程；雲端模式由執行器自動存成新 revision，每版都保留。
- **私人檔案**：渲染圖存到私人 bucket `lizhi-cad-files/<uid>/<job>/`，只對本人資料夾產生 1 小時簽名連結。

## 檔案

- **lizhi-cad**：
  - `apps/cadcraft-web/src/lizhi_call.rs`：瀏覽器端完整指令與安全檢查，附 Rust 測試
  - `host.rs` 接上 `lizhi.call`
  - `.github/workflows/lizhi-cadcraft-cli-release.yml`：手動建置雲端用 cadcraft-cli
- **立之雲端庫**：
  - `cad/cad-host.js`、`cad/cad-remote-relay.js`：轉送 `lizhi.call`，渲染圖上傳私人 bucket
  - `cad/build-runtime.sh`：CAD 版本改為 lizhi-cad `d3c9394`
  - `supabase/functions/lizhi-cad-site-mcp/`：完整工具（`cad-full-contract.mjs`、`cad-full-core.mjs`、指令 registry）
  - `supabase/functions/lizhi-cad-cloud-worker/`：雲端 worker 專用 Edge
  - `cad/sql/006_cad_full_api.REVIEW_ONLY.sql`（瀏覽器模式）、`cad/sql/007_cad_cloud.REVIEW_ONLY.sql`（雲端模式）
  - `cad/cloud/worker.mjs`、`.github/workflows/cad-cloud-worker.yml`

## 驗證（實際執行）

- **Rust**：`cargo test -p cadcraft-web lizhi_call` → 4/4 PASS；`cargo clippy --target wasm32-unknown-unknown` 編譯通過（本機）
- **Node**：`tests/cad-full-api.test.mjs` → 9/9 PASS（本機）
- **Deno**：`deno check` CAD Site Edge 通過（本機）
- **PostgreSQL 16**：`tests/sql/cad_full_api_isolated.test.sql`，套用正式 CAD 遷移＋Sites bridge＋006＋007 → `LIZHI_CAD_FULL_API_SQL_TEST_PASS`（本機）
- **真實 cadcraft-cli 0.12.0 ＋ worker 端到端**：矩形 → 圓 → 新圖層各自存成新 revision 並在下一個工作正確讀回；inspect 不改 revision；render 輸出 PNG；錯誤指令回傳引擎錯誤 → PASS（本機）
- **NOT_TESTED**：正式部署、瀏覽器 CAD 網頁重建後的 `lizhi.call` 實機、GitHub Actions worker 實跑、ChatGPT 端到端

## 上線步驟（需使用者同意）

1. Supabase：套用 `cad/sql/006`、`007`
2. 部署 `lizhi-cad-site-mcp`（整個資料夾）與 `lizhi-cad-cloud-worker`
3. **Secrets**：
   - Supabase Edge：`LIZHI_CAD_WORKER_TOKEN`（64 位 hex）。`LIZHI_MODEL_WORKER_DISPATCH_TOKEN`、`LIZHI_MODEL_WORKER_REPO` 與 Hew 共用。
   - GitHub：`LIZHI_CAD_WORKER_URL`、`LIZHI_CAD_WORKER_TOKEN`
4. lizhi-cad 手動跑「lizhi cadcraft-cli build」
5. 合併立之雲端庫分支（GitHub Pages 會用新版本重建 CAD 網頁執行檔）
6. 重新發布私人 Site「立之 CAD」，同一個 Site，加入新工具
