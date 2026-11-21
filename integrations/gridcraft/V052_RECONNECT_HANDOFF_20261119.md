# GridCraft Windows v0.5.2｜換檔／斷線後自動恢復（2026-11-19）

## 使用者要求
已在原 Site v31 成功將 Book1 測試副本 Sheet1!A3 寫入 123 並備份讀回；之後本人換開另一份檔案，GridCraft MCP 從 READY 變 GRIDCRAFT_OFFLINE。使用者明確要求「修復」。本次限 Windows 代理，不改原私人 Site v31、Edge v6、MCP、DB 或使用者工作簿。

## 經程式碼確認的問題
v0.5.1 啟動時只呼叫一次 launch_on_login()；後續 Tk _poll 只 refresh() 顯示 READY / OFFLINE 與工作簿數目，**不會在連線中斷後再嘗試 launch**。此為確定的程式缺陷。現場是否是新開啟的 GridCraft GUI 未使用 --control 7979、或原程序退出、或轉移文件到新程序，尚不能由雲端 MCP 單獨判定。

## v0.5.2 修復項目
1. 當代理持續運作且遠端未被本人按「停止」時，Tk _poll 會在連續兩次看到 GRIDCRAFT_OFFLINE 後觸發自動重連；每次嘗試有最多 18 次就緒檢查／最多 3 次程序啟動限制，追加 60 秒冷卻，避免暴走。
2. Windows 實際查看 tasklist.exe GridCraft.exe 行程（僅本機）；若另一 GUI 仍在且 7979 沒監聽，**不殺死、不強制重啟、不另開第二份**，本機畫面提示「已開程式但未啟動控制埠」；無法確認行程時 fail-closed。
3. 已成功 READY 的已擁有 Windows 子程序保留 handle，不把它誤認為已退出並重開。
4. Windows 工作簿清單每次重新檢查，目前正在開的文件 doc + title 變化即自動更新授權清單；關閉／離線立即清除許可，P4 pending preview 被丟棄，防止舊 doc ID 在新檔上誤提交。
5. P4SafeWriter 新增 invalidate_previews() 安全清除尚未提交的短效預覽，原備份、一次性 request_id 防重送資料與已保存紀錄不清除。
6. 手動按「停止連線」會停自動重啟；按「重新連線」會重新排程本機狀態檢查。原身分驗證、GridCraft localhost 7979、原 Site v31 免網頁確認寫入流程均保留。

## 測試／發布狀態
GitHub Actions: https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44449124955
Windows runner 自動化 85/85 tests PASS（12 新 reconnect + 10 v0.5.1 + 11 v0.5 + 8 Windows + 8 P3 local + 11 P3 worker + 22 P4 safe-write + 3 P4 desktop）；PyInstaller EXE build 與 --self-test PASS。
Windows v0.5.2 測試候選 ZIP（已存原私人 Google Drive）：https://drive.google.com/file/d/16vMkTf4S4XEFyEV3QAAnnWq1BxQww5Rh/view
EXE: LizhiGridCraftAgent_v052_AutoReconnect.exe。
原 Site v31 及 Edge v6 保持原樣，不新增資料庫或金鑰。候選未合併／未正式部署。

## 真人電腦驗收（待完成）
1. 若舊 GridCraft 有未儲存資料，先手動存好；**關閉舊版 v0.5.1 代理，先關閉 GUI**，啟動 v0.5.2 EXE（保留原使用者 DPAPI 已配對資料、不需新配對）。
2. 啟動後 ChatGPT 讀 status READY；列出 Book1／新工作簿清單；切換開啟另一份測試 Excel 文件，立即或數個週期後再次讀 list，確認新 title/doc。僅做唯讀，不改真實檔案。
3. 關閉該 GridCraft 實例（儲存未保存內容先詢問本人），保持代理執行。驗證自動重新啟動 **--control 7979**，MCP 恢復 READY；若 Windows 存在另一非控制模式 GridCraft GUI，應顯示安全阻擋，而非強制奪取未保存檔案。
4. 驗證按停止連線後不會重啟；對剛換檔後舊預覽 commit 應失敗。真實重連及異常 GUI 切換**NOT_TESTED**。
5. Edge v6 gridcraft_status.write_enabled 字段固定回 false，非 Windows 實際寫入狀態，勿據此錯判。

## 留意
這次修復可處理「受控 GridCraft 程序退出後自動重啟」，並防止自動打開第二份可能損害未保存資料的無控制程序；但如果使用者在檔案總管雙擊 Excel 另開一個 **GUI-only GridCraft.exe** 並保留它的未儲存內容，本代理尚無安全手段把那個**既有**程序附加到 7979。這是 OS/GridCraft 官方控制協定的目前限制，不能宣稱所有切檔路徑都已通過。
