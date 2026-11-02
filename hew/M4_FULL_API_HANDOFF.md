# 立之 3D 建模（Hew）｜M4 完整 API 交接 2026-11-02

> **狀態：分支候選 `feature/hew-full-api-20261102`。未合併 main、未套用 SQL、未部署 Edge、未重新發布私人 Site。**
> 對應 Hew 分支：`lihuany635-create/lizhi-hew` 的 `feature/lizhi-model-browser-host-v1`（瀏覽器 host 執行 `call` 工作）。

## 目的

Hew 核心本身已具備 SketchUp 的主要功能（元件、場景、路徑跟隨、偏移、剖切、材質、標籤、參考線、SKP/GLB 匯入匯出）。缺的是 ChatGPT 能用的工具：原本只有 6 個（建方塊、移動等）。本次把 **全部 Hew API（105 個方法）** 開放給 ChatGPT。

## 新增工具（私人 Site → Edge）

| 工具 | 作用 |
|---|---|
| `model_api_reference` | 唯讀、不需連線：列出命名空間／方法摘要／單一方法完整參數 schema 與拒絕碼。資料來自 `hew/sites/hew-api-registry.json` |
| `model_call` | 排入一個 Hew API 呼叫（任何 registry 方法，參數用公尺）。多步驟用 `hew.doc.transact` 包成一次復原 |
| `model_job_status`（擴充） | 回傳 Hew 回覆、核心錯誤細節、私人檔案短效連結（1 小時），截圖 PNG 直接以圖片內容回給 ChatGPT |

原本 6 個工具不變。

## 安全規則（Edge 合約、SQL、瀏覽器 host 三層一致）

- 只允許 registry 內的方法；`hew.meta.hello`、`hew.doc.attach`、`hew.doc.focus` 由 host 處理，不可送。
- 破壞性方法（刪除、開新檔／開檔／關閉／還原／匯入、清除未用、炸開群組／元件、刪標籤／場景／屬性、清參考線）必須 `confirm_destructive: true`，且只能在使用者於對話中同意後使用；交易內的子指令同樣檢查。
- 瀏覽器沒有檔案系統：任何 `path` / `*_path` 參數拒絕；`hew.doc.save` 一律 `return_bytes: true`。
- 單獨指令（存檔、匯出、截圖、相機、復原…）不可放進交易。
- 唯讀指令在同一 revision 完成，不會取消其他排隊工作；會改模型的指令仍需新 revision，並取消過期工作。
- 二進位結果存到私人 bucket `lizhi-model-files/<owner uid>/<job id>/`，RLS 只允許本人資料夾；Edge 只對本人資料夾路徑產生簽名連結。

## 檔案

- `hew/tools/build-hew-registry.mjs`：從 lizhi-hew `docs/API_REFERENCE.gen.md` 產生 registry（同時寫到 Edge bundle）。Hew 更新後重跑即可。
- `hew/sites/model-site-contract.mjs`（與 Edge 內同名檔逐字相同，有測試檢查）。
- `supabase/functions/lizhi-model-site-mcp/edge-core.mjs`：新工具、結果、簽名連結、內嵌截圖。請求上限 64 KB。
- `sites-migration/hew/site-tools.mjs`、`site-mcp-route.mjs`：允許結果帶一張 PNG、文字上限 320 KB、請求上限 64 KB。
- `hew/sql/004_model_full_api.REVIEW_ONLY.sql`：`call` 指令、`lizhi_model_finish_v2`、`lizhi_model_site_job` 回傳結果、私人 bucket 與 RLS。
- 為了讓本分支部署 Edge 時不會覆蓋掉正式環境已有的 v3 cloud-direct 路由，已從 `feature/hew-workbench-cloud-direct-v1-20261026` 帶入 `cloud-edge-core.mjs`、`cloud-model-site-contract.mjs`、`index.ts`、`hew/cloud-direct/`、`003_model_cloud_direct.REVIEW_ONLY.sql`（與正式 Edge v8 內容一致）。

## 驗證（實際執行）

- Node：`node --test tests/hew-sites-contract.test.mjs tests/hew-model-edge-upstream.test.mjs tests/hew-site-edge-chain.test.mjs tests/hew-site-mcp-route.test.mjs tests/hew-full-api.test.mjs` → 36/36 PASS（本機）。
- Deno：Edge core 在 Deno 2.9 下載入 JSON registry 並回應 `model_api_reference` → PASS（本機）。
- PostgreSQL 16：`tests/sql/hew_model_full_api_isolated.test.sql` → `LIZHI_MODEL_FULL_API_SQL_TEST_PASS`（本機）；原有 `hew_model_queue_isolated.test.sql` 仍 PASS。
- Hew 瀏覽器 host：lizhi-hew `vitest run src/api/lizhiModel` → 43/43 PASS（本機）。
- **NOT_TESTED**：正式 Supabase 套用 SQL、Edge 部署、私人 Site 重新發布、真實 Hew WASM 頁面端到端、ChatGPT 實際呼叫。

## 上線步驟（需使用者同意）

1. 審閱並在正式 Supabase 套用 `004_model_full_api.REVIEW_ONLY.sql`。
2. 部署 `lizhi-model-site-mcp`（含本分支全部檔案）。
3. 合併 lizhi-hew 分支並重建 Hew 網頁版。
4. 以本分支的 `site-tools.mjs` 重新發布私人 Site「立之 3D 建模代理」（同一個 Site）。
5. 在立之雲端庫開 Hew、按「連線 AI」，從 ChatGPT 依序測：`model_api_reference` → `model_call hew.query.scene` → 畫矩形＋推拉的交易 → `hew.view.snapshot`（確認看得到圖）→ `hew.doc.export glb`（確認連結可下載）。

電腦關機也能操控的雲端執行器見 `hew/cloud-hew/DESIGN.md`。
