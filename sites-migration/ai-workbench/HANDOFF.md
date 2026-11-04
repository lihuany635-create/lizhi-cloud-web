# AI 工作台 v2｜私人 Site 更新交接

日期：2026-11-01　狀態：Edge 與資料表已上線並實測；**私人 Site 尚待本人更新**。

## 已完成（有實測）
- Supabase 資料表 `aiwb_projects / aiwb_tasks / aiwb_checks / aiwb_reports / aiwb_notices / aiwb_events`（migration 012），RLS 開啟、無公開存取；`aiwb_events` 只能新增。
- Edge Function `lizhi-ai-workbench`：`/mcp`（10 個工具）、`/board`、`/task`、`/approve`、`/ack`、`/archive`。
- 臨時測試憑證跑過 32 項端對端測試（權限、編號、勾選必附證據、只有經理能標完成、需本人批准才可完成、通知去重、已讀限收件角色、完成後鎖定與重開、紀錄完整）。測試憑證已作廢。
- 網站 `?open=animationflow` 改為新的 `production/ai-workbench.js`，移到「工作」選單。

## 待本人操作：更新原工作台私人 Site
1. 在 ChatGPT 打開原「工作台」私人 Site 的編輯對話。
2. 把 Site 原本的 `app/mcp/route.ts` **改名**為 `app/mcp/legacy-route.ts`（內容不動），再新增本資料夾的 [`route.ts`](./route.ts) 為 `app/mcp/route.ts`。其他檔案、Secrets、網址都不要改。
   新 route 會把 `aiwb_*` 轉到 Edge `lizhi-ai-workbench`，並保留施工照片要用的 7 個舊工具（`list_projects`、`get_project`、`create_project`、`list_project_images`、`read_project_image`、`import_project_image`、`update_project_image`），照舊走 `legacy-route` → `lizhi-production`。
3. 確認 Site 原有 Secrets 還在：`PRODUCTION_BRIDGE_KEY`（lzp_ 開頭）、`PRODUCTION_CHATGPT_OWNER`。
   `PRODUCTION_CHATGPT_OWNER` 必須等於 `lizhi_production_ai_keys.chatgpt_owner`（原 Site 就是這樣設定）。
4. 部署到同一個 Site（不要建新站）。
5. 開新的 ChatGPT 對話選用這個 Site，呼叫 `aiwb_overview`（role 任選），應回傳空的專案清單；工具清單應有 10 個 `aiwb_*` 加 7 個施工照片工具。

## 之後改工具
工具清單與規則都在 `supabase/functions/lizhi-ai-workbench/index.ts`，重新部署 Edge 即可，Site 不必再動。

## 刻意保留
- 舊 Edge `lizhi-production` 保留：施工照片工具（photo-sheet）仍使用它的 workspace／images 介面。
- `production/source` 舊 React 工作台原始碼保留作參考，不再建置發佈。
- 舊工作台完整資料在 `lizhi_production_state_backup_20261101`。

## 2026-11-04 修復候選（未部署）

前文 2026-11-01 的 10 工具／空專案說明是歷史快照，不是目前驗收結論。
正式 Edge v4 已有 10 個 aiwb、7 個 side、10 個 licut 工具；新轉接保留七個施工照片工具，預期共 **34** 個，不能只留下 17 個。

- 已定位原私人 Site `appgprj_6ad8267ce66c8191899aa5edc0c681af`，沿用 `https://lizhi-animation-flow.lihuany635.chatgpt.site/mcp`；未建立 Site、資料庫、外掛或新網址。
- 正式 Site 原始碼基準 `8055ebb0860f8bb2ca1593588072a4fe56b512b5` 的路由仍是舊工具；未接到新 Edge。
- 已在原 Site 原始碼倉庫開發分支 `fix/ai-workbench-mcp-20261104` 推送候選 `460d977`，**沒有推 main、保存正式版本或部署**。
- 候選完整保留原路由為 `app/mcp/legacy-route.ts`（SHA256 `2cc1b488e7070f6355db08804c0946a5227397eae553aa50456584f6c962e1c7`），新路由來自本目錄 `route.ts`。
- Site 既有 API 測試改讀 legacy-route，以保留原流程回歸；163/163 通過，Site 正式建置通過。
- 新路由支援 `server/discover`、舊 `initialize`、動態清單、全部工具呼叫本人檢查、20 秒上游逾時；清單錯誤不再偽裝成功或靜默遺失照片工具。
- Edge 候選另修正 `needs_approval=false` 可由經理繞過本人批准的漏洞；所有 AI 都不能取消既有批准需求，非 boolean 輸入被拒。這是開發候選，正式 v4 尚未修正。
- 詳細逐工具矩陣與限制見 [驗收報告](../../docs/AI_WORKBENCH_MCP_ACCEPTANCE_20261104.md)。

### 待批准的正式步驟

1. 審核並合併本 GitHub Draft PR（不表示已部署 Edge 或 Site）。
2. 只更新既有 Edge `lizhi-ai-workbench` 的 `index.ts`，保留 `side.ts`、`verify_jwt=false` 及既有 handler 內驗證。不做資料庫 migration 或 Secret／本人綁定修改。
3. 將原 Site 已測候選分支快進至原 source main，使用原 project_id 建置、保存版本，再部署同一個私人 Site；保留 audience 與全部 Secrets。
4. 使用 Sites 發布流程刷新原外掛工具清單；如仍未載入，重新連接既有外掛或開新對話。不要建立第二個外掛。
5. 本人一般對話實際呼叫 `aiwb_overview`、`side_overview` 後，使用獨立測試資料驗證寫入及網頁同步；跨真實帳號驗收另需本人協助。不得將本機 fixture PASS 當成此階段已完成。

正常情況不必本人手動編輯 Site 程式或提供任何金鑰；目前需要的是既有 Site／Edge 正式部署批准。
