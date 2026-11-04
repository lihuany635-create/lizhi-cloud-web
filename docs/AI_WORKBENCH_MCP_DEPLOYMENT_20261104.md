# AI 工作台 MCP 正式部署回報（2026-11-04）

本紀錄取代「候選待部署」的目前狀態，但保留先前報告作歷史證據。使用者於對話明確「核准」PR #59 合併及原 Site／Edge 指定候選部署。

## 已實際完成

- PR #59 已合併，merge commit `0f2753df339595c044cc9497b59f5c6a53a3401e`；核准候選 `58dc3f04b8799cec82444529450df0b069ad1046`。
- 原 Supabase Project `hrdzywkihfqggiwjgavi` 的既有 Edge `lizhi-ai-workbench` 更新為 **ACTIVE v5**；讀回原始碼確認批准防護存在，verify_jwt 保持原 false，handler 驗證不移除。
- 原私人 Site source main 已推送指定候選 `460d97761222fd5632814050bb5ec7c3da0f67fb`，沿用 project_id `appgprj_6ad8267ce66c8191899aa5edc0c681af`。
- Site **v25** 發布 **succeeded**；deployment `appgdep_6aea8cb3ee388191b7a3947da9bf9044`，has_mcp=true。原網址 https://lizhi-animation-flow.lihuany635.chatgpt.site 與 /mcp 保留。
- Site 存取設定讀回：仍只有 owner、無群組、無外部訪客；未修改 Secrets、本人綁定、資料庫 schema、既有業務資料或付費服務，未新建 Site／外掛／資料庫。
- 同一原生外掛的既有 `list_projects` 成功回傳空清單。這是經新路由保留之 legacy photo 通道的原生本人成功呼叫，不可冒充 aiwb_overview 已成功。
- 發布後正式 Edge：無 token、無效 lzp、無效 lza 均回 HTTP 401。
- 重跑候選工作台與立剪測試 10/10 PASS；前輪原 Site 回歸163/163、建置通過，未再改動其來源。

## 尚未通過的正式驗收

| 工具 | 開發隔離測試 | 本次原生正式呼叫 |
| --- | --- | --- |
| aiwb_overview | PASS | NOT_TESTED |
| aiwb_save_project | PASS | NOT_TESTED |
| aiwb_list_tasks | PASS | NOT_TESTED |
| aiwb_get_task | PASS | NOT_TESTED |
| aiwb_create_task | PASS | NOT_TESTED |
| aiwb_update_task | PASS | NOT_TESTED |
| aiwb_tick_check | PASS | NOT_TESTED |
| aiwb_attach_report | PASS | NOT_TESTED |
| aiwb_notify | PASS | NOT_TESTED |
| aiwb_inbox | PASS | NOT_TESTED |
| side_overview | PASS | NOT_TESTED |
| side_log_save | PASS | NOT_TESTED |
| side_log_list | PASS | NOT_TESTED |
| side_todo_save | PASS | NOT_TESTED |
| side_todo_tick | PASS | NOT_TESTED |
| side_todo_list | PASS | NOT_TESTED |
| side_delete | PASS | NOT_TESTED |

- **BLOCKED 工具載入**：本次對話 ALL_TOOLS 仍只有舊工作台工具，沒有 aiwb_* 或 side_*。Sites 已正式發布且回 has_mcp=true；原外掛查詢回 Already installed，未建立第二個外掛。不能從 has_mcp 或建置成功宣稱正式34工具清單已逐項讀回。
- **BLOCKED 真實網頁驗收**：實際打開主站 AI 工作台，顯示「請使用核准的 Google 帳號登入」。未登入、未點批准、未用其他途徑偽裝本人；真實看板／資料庫同步尚未驗證。
- 真實跨帳號讀寫、正式17工具寫入讀回與獨立複核均 NOT_TESTED。
- Site 無訪客身分的服務探測仍401；此結果不作為本人原生工具失敗證據。沒有偽造可信身分標頭或取得 Secret 來迴避限制。
- 本次正式資料庫唯讀確認：原2個封存測試專案、4個任務、4個side待辦未改；僅另附加已授權交接並讀回。沒有刪除既有測試資料。

## 下一步

【本人】開新的「一般 ChatGPT 對話」，選用已存在的原工作台外掛，輸入「請呼叫 aiwb_overview（role=manager）與 side_overview，接續 PR #59 部署後驗收」。若仍未出現新工具，重新整理／重連同一外掛；不要新建外掛或提供金鑰。

【AI】新工具實際載入後，先核對本報告及正式工具清單，再用獨立測試資料完成17工具與網頁同步驗收，保留既有資料。核准已涵蓋上述指定部署，**不需要重複請示同一部署**；其他資料刪除、擴權或更動驗證仍須另行授權。

這是「正式部署成功、完整正式驗收尚未完成」，不是全部功能已驗收通過。
