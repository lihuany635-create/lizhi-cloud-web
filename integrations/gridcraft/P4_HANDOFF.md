# GridCraft P4｜安全受控寫入候選交接（2026-11-18）

狀態：**開發候選 / 隔離 CI 通過待最終回歸 / NOT_DEPLOYED / 本人真實 Excel 未寫入。**

## P3 不可破壞的基礎
原私人 Site https://lizhi-animation-flow.lihuany635.chatgpt.site v29 與原 Supabase Edge lizhi-gridcraft-bridge v3 已發布。本人已成功透過 Windows v0.2 授權 Book1，ChatGPT 遠端 status READY、工作簿清單與 Sheet1!A1:B2 中文/數字讀回 PASS。原 P3 三項唯讀及一次性配對工具都要保留，原工作台、施工照片、其他 MCP 不得移除。P3 PR #88 保持草稿。

## P4 實作（全部只在 P4 PR #89 草稿分支，未改正式站）
- gridcraft_p4_safe_write.py：prepare 只讀預覽，commit 在本人 ChatGPT 確認＋Windows 本機寫入開關兩者通過才寫。最多 50 格，不接受公式字串及任意系統指令。
- 預覽產生 90 秒有效 preview_id / expected_version，根據目標格的值與公式原文計算 SHA256。正式寫入前檢查兩次（備份前、備份後）；任何目標區域值改變就中止。
- gridcraft_p4_desktop.py：僅限官方 GridCraft 本機 127.0.0.1:7979，允許無變更的 file.saveBytes 匯出 XLSX 快照，與受限 engine.execute(range.setValues) 寫入，parse=false 防文字自動轉換；數字 u64 workbook doc ID 由本機轉回 JSON number。
- 快照只留在 Windows 本機 %LOCALAPPDATA%/Lizhi/GridCraftAgent/P4Backups，單檔不超過 8MiB，資料夾不超過 512MiB，保留版本不自動刪除，不上傳整本 Excel 至 Supabase。
- P4ReceiptStore 以 request_id 於寫前持久登記與 fsync，遇執行結果未知不重送，寫完再讀回，沒有讀回證據不能標 PASS。完成不會自動存檔/覆寫原件。
- Windows v0.3 候選新增 P4 寫入授權按鈕，每次啟動預設關閉，不儲存允許狀態；仍需先在本機授權指定工作簿。
- OutboundWorker 只有明確帶入 P4 writer 才接受 gridcraft_prepare_write / gridcraft_commit_write；否則 P4_GATE_OFF。P3 原讀取白名單仍有效。
- 原私人 Site P4 additive addon 與 Edge v4 候選採獨立 P4 Gate OFF；只在本人驗證及嚴格工具白名單下送指令；正式站仍 v29、Edge 仍 v3，沒有更新。
- P4_SQL_CANDIDATE.sql 尚未在原 Supabase 執行，將來只擴充 GridCraft jobs 允許的 P4 工具，不建立第二資料庫、不放寬 RLS。

## 可查核成果
- PR #89: https://github.com/lihuany635-create/lizhi-cloud-web/pull/89
- CI P4 多層驗收（最新以 GitHub workflow conclusion 為準）: https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44249621542
- Windows v0.3 unsigned 候選 ZIP（私人 Drive）：https://drive.google.com/file/d/1c1xIDyNIdsZ-h5WQSDV3iY9nQdNUyOau/view
- 合成安全測試：P4 prepare/commit/預覽失效/工作簿白名單/本機寫入確認/CAS/備份/去重/錯誤回執；受限本機 TCP socket JSON 協定；Node Site MCP 校驗；Deno Edge owner/Gate 模擬；既有 P3 讀取回歸。沒有使用本人真正 Excel，沒有進行正式 P4 寫入。

## 未驗收與注意事項
- 目前預覽 expected_version **只覆蓋目標格**，並非整份活頁簿的全域 revision。其他格被人改動，未必能察覺。
- GridCraft file.saveBytes 的 XLSX 快照不保證未知 Excel 進階物件百分百無損；T01～T08 高保真評估未完成。
- 出現 WRITE_OUTCOME_UNKNOWN / VERIFY_MISMATCH，會保留備份給本人手動恢復，不會自動回滾整份工作簿。
- 新工具在 Supabase jobs 可能包含指定格的前後內容；正式發布前要完成 24 小時清理策略、限制操作與後端撤權測試。
- 還需獨立安全複核；正式原 Site/Edge/DB 的 P4 部署、本人 Windows v0.3 安裝及真機測試全部 NOT_DEPLOYED/NOT_TESTED。
- 使用者「P4」在本階段視為開始開發，不視為授權實際修改 Book1 或正式發布高風險寫入功能。正式部署與真正寫入測試仍需明確批准。
- 目前 P3 唯讀功能維持可用；不用先替換已使用 v0.2。

## 下一個接手 AI
先查最新正式《AI 員工手冊》、操作手冊、工作台與本 PR。核對候選程式、所有 CI 和原 Site v29 的工具清單；先完成清理機制、獨立安全複核，再辦理正式 P4 部署批准。上線 Gate 應預設 OFF，第一本真實寫入必須是使用者明確指定的副本，經 prepare → 本人確認 → Windows 授權 → commit → read-back 驗收後再考慮正式原件。
