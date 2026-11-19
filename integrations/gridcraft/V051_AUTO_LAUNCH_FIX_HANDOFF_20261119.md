# GridCraft v0.5.1｜開啟代理後自動啟動 GridCraft 主程式

日期：2026-11-19（Asia/Taipei）。修復範圍：**Windows 本機代理**；原私人 Site、Supabase Edge v6、MCP 名稱及權限不變。

## 現場重現與原因

- Windows v0.5 代理在使用者電腦成功回報雲端 MCP 心跳，但 `gridcraft_status` 連續回 `GRIDCRAFT_OFFLINE`，無法列出工作簿。
- 使用者手動執行 `"C:\Program Files\ArtCraft\GridCraft\gridcraft.exe" --control 7979` 後，正式 MCP `gridcraft_status` 立即 `READY`，`list_workbooks` 回 `Book1`，`read_range Book1/Sheet1/A1:B2` PASS。
- 檢查 v0.5 程式：啟動任務只排程一次且僅對 `GRIDCRAFT_OFFLINE` 嘗試一次 Popen；遇 `CONTROL_ERROR` 立即略過、若找不到 settings.json 裡的 EXE 路徑就直接略過；Popen 成功但 GridCraft 未 READY 或快速退出時**沒有啟動後狀態追蹤及重試**。此為代碼已驗證的缺陷；當時實機具體失敗分支尚未確認。

## v0.5.1 最小修復

- 開代理時一定排程一次本機自動啟動檢查；即使 settings 裡沒有路徑，也只搜尋**既有本機標準 GridCraft 安裝位置**（Program Files/ArtCraft/GridCraft/gridcraft.exe），不執行任何遠端提供的路徑。
- 追蹤正在啟動的 Windows 子程序。已有 GridCraft `READY` 時不重複啟動，`UNAUTHORIZED` 時停止；`CONTROL_ERROR` 先等待狀態，不搶啟第二份；只有真正 `GRIDCRAFT_OFFLINE` 且沒有存活的受控子程序才重試啟動。
- 每 2 秒觀察一次，最多 18 次狀態檢查；程式若提前退出則最多再啟動總計 **3 次**，不無限重試、不卡住介面。
- 顯示「找不到程式」、「本機認證失效」、「啟動程序失敗／程序提前結束」、「未收到 READY」等摘要；保留 Windows 本機檔案與秘密資料，不對雲端回報路徑與憑證。
- 停止遠端或關閉代理立即中止尚待執行的自動啟動流程。僅修復主程式啟動，**不改變 P3/P4 寫入權限或 Site v30 原確認頁**。

## 測試及交付

[Windows v0.5.1 CI](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44442773937)：10 項自動啟動回歸、v0.5 一鍵操作、P3/P4 舊測、打包與自檢；以 CI 最終結果為準。

真實使用者 Windows v0.5.1 **NOT_TESTED**。請先關閉舊 v0.5 代理（保留現有配對資料），再開啟新候選 EXE，**不要手動開 GridCraft**。由 ChatGPT 實測 `gridcraft_status`、`gridcraft_list_workbooks`、`gridcraft_read_range`。如未 READY，回報代理畫面中的具體錯誤文字，可直接定位。

- 未修改任何使用者 Excel 工作簿。
- 未部署原 Site / Edge 或建立新 Site、資料庫、MCP。
- 不合併正式主線前完成本人實機驗收。
