# 立之 AI 工作台 MCP 修復與開發驗收

日期：2026-11-04（Asia/Taipei）。狀態：**開發完成、開發測試通過、未部署、待正式驗收、待獨立複核**。

## 根因與修復

1. 原私人 Site `/mcp` 仍使用舊製作工作台路由，未套用 `sites-migration/ai-workbench/route.ts`。正式 Site source 基準 `8055ebb0860f8bb2ca1593588072a4fe56b512b5`；既有外掛仍暴露舊動畫／模型工具，本次對話沒有 aiwb/side 工具。
2. 舊遷移候選未支援現行 Sites `server/discover`；上游清單錯誤可能被包成非工具呼叫的成功結果，照片清單失敗也會被靜默略過。候選加上探索、JSON-RPC 錯誤、完整清單檢查、逾時及一致本人驗證。
3. 正式 Edge v4 早已有 17 項工作台工具和 10 項立剪工具。新轉接動態保留這 27 項，再接回 7 項施工照片，共 34 項；沒有重建業務功能或新增 MCP。
4. 開發測試重現：manager 可在同次更新把 `needs_approval` 改 false 並標 done，略過未獲本人批准的條件。Edge 候選拒絕所有 AI 取消既有批准需求，並檢查 boolean；原 `/approve` 本人 JWT 路徑不變。回歸測試修正前失敗、修正後通過。

## 來源與正式狀態核對

已實際讀取 Drive 正式《AI 員工手冊 v1.1》、路徑總索引 v1.2、操作手冊目錄及《工作｜AI 工作台 操作手冊 v2.1》（2026-11-04 更新）。

- 路徑索引仍標 v2.0、10 工具；最新手冊已有 side 七工具。操作手冊目錄仍稱「製作工作台」且分類過期。未修改正式文件，差異記於本報告。
- Edge `lizhi-ai-workbench`：ACTIVE v4，`verify_jwt=false`，由 handler 驗證 lzp/key hash 與 ChatGPT actor；agent-mcp 使用 lza/key hash。
- 正式資料庫唯讀確認：2 個已封存測試專案、4 項既有測試任務、2 筆 side 日誌、4 項 side 待辦（新增本次交接前快照）。讀到既有勾選、報告連結與交接。沒有從資料庫現況推論 MCP 已通。
- 9 張 aiwb 資料表均啟用 RLS、無 public policies；事件表保留 append-only trigger。未新增資料庫或調整授權。
- 原 Site access 為 custom，僅 owner，無外部訪客；原網址與設定均未更動。Secrets 僅確認名稱存在，未取得或修改值。
- 直接 Site 探測 `server/discover`、`tools/list`、無訪客身分的 `tools/call` 均收到 HTTP 401；只證明此探測未通過正式入口，無法推定是 handler 的本人驗證結果。未偽造正式身分標頭。
- 正式 Edge 無 token 回 401「請先登入立之雲端庫」；無效 lzp 憑證回 401「工具憑證無效」。有效本人原生呼叫尚未測到。

## 17 項工具矩陣

以下 PASS 僅限 **Node 執行真實候選 Site 路由 → 真實候選 Edge handler → 隔離記憶體 REST fixture**，不是 Supabase/PostgreSQL 實庫，也不是 ChatGPT 原生工具載入測試。fixture 證據網址均為 example.invalid，不存入正式系統。

| 工具 | 開發測試 | 正式一般對話 | 已測範圍 |
| --- | --- | --- | --- |
| aiwb_overview | PASS | NOT_TESTED | 專案、待辦讀回 |
| aiwb_save_project | PASS | NOT_TESTED | 建立測試專案、拒絕 advisor |
| aiwb_list_tasks | PASS | NOT_TESTED | 依專案列出測試任務 |
| aiwb_get_task | PASS | NOT_TESTED | 任務、勾選、報告、事件；與 task API 一致 |
| aiwb_create_task | PASS | NOT_TESTED | 編號、勾選、批准需求；拒絕 engineer |
| aiwb_update_task | PASS | NOT_TESTED | 狀態更新、完成門檻、拒絕取消批准需求 |
| aiwb_tick_check | PASS | NOT_TESTED | 無證據拒絕、有證據成功、完成後鎖定 |
| aiwb_attach_report | PASS | NOT_TESTED | 執行報告、驗收報告限經理 |
| aiwb_notify | PASS | NOT_TESTED | 指定角色、報告關聯、dedupe 防重 |
| aiwb_inbox | PASS | NOT_TESTED | 讀通知、只有收件角色可 ack |
| side_overview | PASS | NOT_TESTED | 讀剛建立日誌與完成待辦 |
| side_log_save | PASS | NOT_TESTED | 建立、修改、讀回 |
| side_log_list | PASS | NOT_TESTED | 專案篩選與日誌內容讀回 |
| side_todo_save | PASS | NOT_TESTED | 建立、更新狀態 |
| side_todo_tick | PASS | NOT_TESTED | 逐項勾選、進度讀回 |
| side_todo_list | PASS | NOT_TESTED | 完成待辦讀回 |
| side_delete | PASS | NOT_TESTED | 僅刪本輪本機 fixture 日誌／待辦；正式資料未刪 |

目前一般對話載入新 17 工具：**FAIL（尚未接上正式 Site）**。候選動態 tools/list：**PASS（34 項，保留全部既有工具）**。

## 驗證與具體限制

- `node --test tests/ai-workbench-mcp.test.mjs tests/licut-chatgpt-bridge.test.mjs`：10/10 通過。含全 17 工具生命週期、缺失／不同 Site identity 在呼叫上游前遭拒、Edge 無效 key／錯 actor／外站 Origin 被拒、agent key 僅列 7 個 side 工具、不能呼叫三角色工具。
- fixture 網頁 `/board`、`/task`、`/side` API 與 MCP 建立資料一致；另一個 fixture JWT 無法讀到 owner 資料。**真實登入網頁顯示與真實跨帳號驗收 NOT_TESTED**，未截圖宣稱實測。
- 原 Site `node --test tests/*.test.mjs`：163/163 通過。舊 API 測試改驗 `legacy-route.ts`，保留歷史流程回歸；新路由由上列串接測試驗證。首次回歸因舊測試仍載入新 route，未替換 cloudflare import 而失敗，修正測試目標後通過。
- 原 Site `build-site.mjs`：建置通過。原 route 完整保留為 legacy-route，SHA256 `2cc1b488e7070f6355db08804c0946a5227397eae553aa50456584f6c962e1c7` 與基準位元一致。
- 三角色沿用本人帳號內的 `role` 參數分工，非各角色獨立 OAuth 身分；測試證明 role=advisor/engineer 的限制，**不能宣稱能阻止同一位已授權本人改傳 role=manager**。本次未新增角色憑證、改變本人驗證或擴權。
- 未使用有效正式 Secret、未新增測試金鑰、未寫正式測試任務、未刪既有測試資料、未修改正式業務資料。交接紀錄另依明確授權附加並讀回。
- 未做 PostgreSQL/正式 Supabase 寫入 E2E、原生本人工具成功呼叫、真實跨帳號操作或獨立第二位 AI 複核；不以本機測試代替正式驗收。

## 交付與待批准

GitHub 開發分支 `fix/ai-workbench-mcp-20261104`；修改遷移 route、Edge 批准防護、串接測試、本交接與本報告。
原 Site 候選已推同名開發分支，commit `460d977`（完整 SHA 可由 Site source git 查）。未改 main、未建立正式 Site 版本、未部署。

需要本人批准：審核合併 GitHub PR、更新原 Edge、將已測原 Site 候選發布到同一個私人 Site。無須手動轉貼程式、開電腦、提供金鑰、新建外掛、付費或更改驗證。
部署後再由原外掛刷新／重連，完成一般對話本人讀寫與網頁同步驗收；如出現平台連線提示，需本人完成該既有外掛的連接。正式資料刪除、驗證設定變更及角色身分綁定不包含在此批准範圍。
