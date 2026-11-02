# 立之 3D｜雲端 Hew 執行器（電腦關機也能讓 ChatGPT 建模）

> **狀態：分支候選 `feature/hew-full-api-20261102`。未套用 SQL 005、未部署 `lizhi-model-cloud-worker`、未設定 GitHub Secrets。**

## 為什麼要這個

M4 的 `model_call` 需要你在立之雲端庫開著 Hew 並按「連線 AI」。你之前說過不想每次開頁面、按連線。雲端模式讓 ChatGPT 在你電腦關機時也能建模，而且用的是**真正的 Hew 核心**（不是只存方塊資料的 v3 cloud-direct）。

## 架構

```text
ChatGPT ─ 私人 Site「立之 3D 建模代理」
   └─ model_cloud_call ──► Edge lizhi-model-site-mcp
                              ├─ SQL lizhi_model_cloud_hew_enqueue（revision 檢查、冪等）
                              └─ GitHub repository_dispatch（啟動 worker）
GitHub Actions「Hew cloud worker」
   ├─ 下載 lizhi-hew release 的 headless hew-cli
   └─ worker.mjs ──► Edge lizhi-model-cloud-worker（只有 worker token）
          claim → 下載目前 r<N>.hew（簽名網址）
          hew-cli dispatch <method> <params> --file model.hew
          檔案有變 → 上傳 r<N+1>.hew；截圖／匯出 → 上傳私人檔案
          finish → SQL 更新 revision
ChatGPT ─ model_cloud_job_status → 結果、私人檔案連結、截圖直接顯示
```

- **模型本體**：私人 bucket `lizhi-model-files/<uid>/docs/<doc>/r<rev>.hew`，每個 revision 一個檔，舊版本全部保留。
- **revision**：整數遞增；每個工作都綁定送出時的 revision。模型改動後，排在舊 revision 的工作會被取消、不會重播。唯讀指令不改 revision。
- **一次一個**：同一份文件同時只會有一個工作在跑。
- **安全**：service-role 金鑰只在 Edge；GitHub 只拿到 worker 專用 token。所有路徑由 Edge 決定，worker 不能指定。破壞性方法同樣需要 `confirm_destructive`。開新檔／開檔／存檔等文件生命週期由 worker 自己處理，ChatGPT 不能呼叫。
- **費用**：GitHub Actions（public repo 免費；private repo 每月 2000 分鐘免費額度，一次工作約 1 分鐘）＋既有 Supabase。不需新付費服務。

## ChatGPT 工具（雲端模式）

| 工具 | 作用 |
|---|---|
| `model_cloud_documents` | 列出雲端模型文件與目前 revision |
| `model_cloud_new_document` | 建立空白文件（第一個工作寫入 r1） |
| `model_cloud_call` | 對文件排入一個 Hew API 呼叫（同 `model_call` 的方法與參數） |
| `model_cloud_job_status` | 讀結果、新 revision、私人檔案連結、內嵌截圖 |

`model_api_reference` 兩種模式共用。

## 延遲

dispatch 觸發後 Actions 開機約 20–40 秒，加上下載 hew-cli 與執行，一個工作大約 1–2 分鐘。多個工作會在同一次執行中連續處理（最多 10 分鐘）。

## 檔案

- `hew/sql/005_model_cloud_hew.REVIEW_ONLY.sql`：文件／工作表與 6 個 service-role 函式
- `supabase/functions/lizhi-model-cloud-worker/`：worker 專用 Edge
- `hew/cloud-hew/worker.mjs`：worker 本體
- `.github/workflows/hew-cloud-worker.yml`：worker workflow
- lizhi-hew `.github/workflows/lizhi-hew-cli-release.yml`：建置 hew-cli 並發布到 release `lizhi-hew-cli`（含無頭建模與截圖煙霧測試）

## 驗證（實際執行）

- PostgreSQL 16：`tests/sql/hew_model_cloud_hew_isolated.test.sql` → `LIZHI_MODEL_CLOUD_HEW_SQL_TEST_PASS`（本機）
- Node：`tests/hew-cloud-hew.test.mjs`（worker 以假 hew-cli 測試、worker Edge、Site 雲端工具）PASS（本機）
- **NOT_TESTED**：正式部署、真實 GitHub Actions 執行、ChatGPT 端到端

## 上線步驟（需使用者同意與操作）

1. 套用 SQL 004、005。
2. 部署 `lizhi-model-site-mcp` 與 `lizhi-model-cloud-worker`。
3. Supabase Edge Secrets：`LIZHI_MODEL_WORKER_TOKEN`（64 位 hex，自己產生）、`LIZHI_MODEL_WORKER_DISPATCH_TOKEN`（GitHub fine-grained token，只給 worker repo 的 Contents: read & write 以發送 repository_dispatch）、`LIZHI_MODEL_WORKER_REPO`（例如 `lihuany635-create/lizhi-cloud-web`）。
4. GitHub repo Secrets：`LIZHI_MODEL_WORKER_URL`、`LIZHI_MODEL_WORKER_TOKEN`。
5. 在 lizhi-hew 手動跑一次「lizhi hew-cli build」產生 release。
6. 重新發布私人 Site（同一個 Site）。
7. ChatGPT 測：`model_cloud_new_document` → `model_cloud_call`（矩形＋推拉交易）→ `model_cloud_job_status` → `hew.view.snapshot` 看圖。

**注意**：lizhi-cloud-web 目前是 public，Actions 日誌公開。worker 只印工作 ID 與狀態，但建議依原計畫改 private 後再啟用。

## 之後可以做

- 在立之雲端庫打開 Hew 時直接載入雲端最新 revision、存檔時寫回新 revision（把兩種模式接在一起）。
- `model_cloud_documents` 附上目前 .hew 與 GLB 的下載連結，給 model-viewer 動畫場景使用。
