# 立之 GridCraft v0.5｜真正一鍵使用（Windows 已建置，原 Site 發布待完成）

2026-11-18，使用者明確要求：「打開代理就能用；不需要再配對／按開始／授權／跳網頁確認。」

## 已完成（候選、未取代現場 v0.3）

Windows 代理 v0.5（直接基於 v0.4）已改成：

- 預先配對的本人 Windows 裝置**啟動即自動回連**，即使之前上次「停止遠端」，再次開啟 EXE 就重新開始；本機裝置認證 Token 仍由 Windows 使用者本機安全保存，不公開、不經網頁。
- 若上次指定過 GridCraft.exe，啟動代理時自動啟動 GridCraft（避免開啟重複實例）。
- **目前在本機 GridCraft 開啟中的工作簿**自動列入本次可用清單，包含未儲存的 Book1；不再要求逐本點「授權」。每項遠端 P3/P4 工作開始前都重新確認本機實際開啟的工作簿 UID；關閉、離線或停止遠端即撤回。
- P4 本機寫入開關依本人已配對、GridCraft READY、存在目前開啟的工作簿、遠端未停止自動開啟，不另按授權按鈕；寫入只能經原本人身份 MCP、指定工具、最多 50 格、合法值且必須經本機原 P4SafeWriter 預覽版控、備份、單次去重、寫入後讀回。
- UI 僅有「停止連線」「重新連線」「關閉代理」，新安裝／無既有配對才顯示首次配對入口。保留本機停止按鍵，沒有 Internet listener，不開 TCP 公開端口。
- **程式不會因啟動代理而自行改動任何工作簿**。必須由 ChatGPT 確實收到本人編輯指令才會執行 MCP 寫入流程。

[Windows + Site CI](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44311486158)：兩個 job 全 PASS，Windows 11 項新測試及 P3/P4 回歸，Windows EXE PyInstaller 打包與自檢；Node Site 無確認頁候選與既有 P3/P4 guard 全部 PASS。

[Windows v0.5 候選版 ZIP（原本人私人 Drive）](https://drive.google.com/file/d/1-Ppispj2OxlAqFLa4vQa8F2_ohW0w4DS/view)

**真機 Windows v0.5 启動／工作簿讀寫尚未驗收；不得假稱已安裝到使用者 Windows。**

## 待原 Site v30 原地發布（不是另建新 Site）

正式原 Site：
https://lizhi-animation-flow.lihuany635.chatgpt.site

**正式 v30 仍以網頁 approval_url 確認頁作為必要門檻。這個 Chat 對話沒有 Sites 編輯／發布工具，因此尚未將免跳頁模式部署到原 Site。不能透過 Edge v6 的 P4 Gate 開關代替 Site 修改。**

目標由原 Site v30 升下一版時，必須只在既有 GridCraft P4 轉接區修改，不能動 P3、施工照片、工作台、其他 MCP：

1. 保留原 Verified Principal／本人身分／Site 到 Edge 橋接 Secret／原單一 /mcp／Private 可見性；匿名及偽造 Owner 一律拒絕。
2. 將 `gridcraft_prepare_write` 保留為**唯讀預覽**，不准直接在此工具修改工作簿。
3. `gridcraft_commit_write` 於「使用者已在本人 ChatGPT 對話主動要求本次儲存格寫入」且通過已登入同一本人 principal 的 MCP 後，使用候選 `sites-migration/ai-workbench/gridcraft-v05-no-click-addon.mjs` 直接轉接原 Edge `/site/dispatch`，**不再要求另到網頁按「確認這次寫入」**。把 `owner_confirmed:true` 視為「已由同一已驗證的本人 MCP 發出的寫入意圖」，但 caller 明確 false 時仍拒絕。不接受匿名、跨身分或任意 RPC/文件路徑。
4. 必須沿用**原短效 preview_id／expected_version／唯一 request_id**，且原 Windows P4SafeWriter 繼續保證：90 秒有效、一個預覽、一次提交、範圍 CAS、完整 XLSX 本機備份、讀回驗證、結果未知不重試、無自動覆寫原件。
5. 原 Site 僅透過本人的私有 MCP 暴露工具；不因網頁任何 GET/POST、URL 參數、假標頭而自動核准寫入。
6. 移除原 approval_url 必按的路由限制，而不是移除本人身份驗證。更新 MCP 描述文字、任何站內 P4 預覽提示；若平台另有強制 tool confirmation，不可宣稱能由 Site 取消。
7. 切換採**單一受控 Gate** `GRIDCRAFT_P4_NO_CLICK_ENABLED`，預設關閉；原 Site 全部測試、匿名／跨身份拒絕與原 P3 及其他工具回歸後，再於同一原 Site 原地發布。保留關閉 Gate 的回退能力。

必要驗收：

- 真實登入本人 ChatGPT → 原 MCP status/list/read PASS；開啟 Windows v0.5 時**不需要任何 UI 授權**。
- 真實收到本人「把測試副本 Sheet1!A3 改成 X」指令 → 先 MCP preview，程式自行帶合法 previewId/version／requestId 提交，**不開確認頁**，本機建備份，成功後讀回；只在測試副本使用，禁止真實文件首測。
- 還原防護：兩部同時在線拒絕，另一帳號/匿名/失效裝置無法寫入；關閉 GridCraft／關閉代理後拒絕；版本衝突、同 requestId 重送、備份失敗都拒絕。
- 正式 Site 其他工具全清單與原 v30 比對；不能只測 GridCraft。

## 目前狀態

- Windows v0.5 候選程式：**CODE + CI PASS，真人 Windows NOT_TESTED，未替換正式 v0.3**。
- 原 Private Site v30：**仍是原逐筆人工確認流程**，未發布新的 Site。
- Edge v6：維持原正式；只有既有 owner 驗證和 P3/P4 Gate，不做新服務或新 DB。
- 新 GitHub 分支：`feat/gridcraft-p4-oneclick-v05-20261118`，從 v0.4 草稿分支分出，禁止無理由合併正式 main。
