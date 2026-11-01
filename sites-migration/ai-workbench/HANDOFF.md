# AI 工作台 v2｜私人 Site 更新交接

日期：2026-11-01　狀態：Edge 與資料表已上線並實測；**私人 Site 尚待本人更新**。

## 已完成（有實測）
- Supabase 資料表 `aiwb_projects / aiwb_tasks / aiwb_checks / aiwb_reports / aiwb_notices / aiwb_events`（migration 012），RLS 開啟、無公開存取；`aiwb_events` 只能新增。
- Edge Function `lizhi-ai-workbench`：`/mcp`（10 個工具）、`/board`、`/task`、`/approve`、`/ack`、`/archive`。
- 臨時測試憑證跑過 32 項端對端測試（權限、編號、勾選必附證據、只有經理能標完成、需本人批准才可完成、通知去重、已讀限收件角色、完成後鎖定與重開、紀錄完整）。測試憑證已作廢。
- 網站 `?open=animationflow` 改為新的 `production/ai-workbench.js`，移到「工作」選單。

## 待本人操作：更新原工作台私人 Site
1. 在 ChatGPT 打開原「工作台」私人 Site 的編輯對話。
2. 把 Site 的 `app/mcp/route.ts` 整個換成本資料夾的 [`route.ts`](./route.ts)。其他檔案、Secrets、網址都不要改。
3. 確認 Site 原有 Secrets 還在：`PRODUCTION_BRIDGE_KEY`（lzp_ 開頭）、`PRODUCTION_CHATGPT_OWNER`。
   `PRODUCTION_CHATGPT_OWNER` 必須等於 `lizhi_production_ai_keys.chatgpt_owner`（原 Site 就是這樣設定）。
4. 部署到同一個 Site（不要建新站）。
5. 開新的 ChatGPT 對話選用這個 Site，呼叫 `aiwb_overview`（role 任選），應回傳空的專案清單。

## 之後改工具
工具清單與規則都在 `supabase/functions/lizhi-ai-workbench/index.ts`，重新部署 Edge 即可，Site 不必再動。

## 刻意保留
- 舊 Edge `lizhi-production` 保留：施工照片工具（photo-sheet）仍使用它的 workspace／images 介面。
- `production/source` 舊 React 工作台原始碼保留作參考，不再建置發佈。
- 舊工作台完整資料在 `lizhi_production_state_backup_20261101`。
