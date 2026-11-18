立之 GridCraft Windows 連線代理 v0.2｜配對與出站候選（未正式發布）｜2026-11-18

本版完成「Windows 可攜式一鍵啟動程式」的候選製作。
只在本人 Windows 電腦操作，不公開 7979 控制埠，不上傳 Excel，不傳送權杖，也沒有接上遠端 ChatGPT MCP（P3 尚未完成）。

【P3 v0.2 預覽新增功能｜尚未能正式配對】
這個版本增加「輸入配對碼」、「授權目前工作簿」、「開始遠端」及「停止遠端」按鈕。
配對碼必須由原 Private Site 本人驗證後產生，且 2 分鐘內有效；目前 Site 與 Edge 尚未部署，所以現在按配對仍無法成功。
每次程式啟動後，工作簿授權必須由你在本機親自選取；不會自動把整台電腦所有 Excel 開放給 ChatGPT。
若未配對或未開啟「開始遠端」，代理不會主動連接遠端。配對成功時專屬裝置密鑰將以 Windows DPAPI 保護並保存到目前登入使用者，不會存進一般設定檔。
只有你按下「開始遠端」才會儲存 opt-in 並開始每約 6 秒的出站 HTTPS 查詢；這會產生正常網路流量，是否採用及用量須在正式服務上線前審核。
「停止遠端」只中斷本機連線，不等於立即撤銷遠端已配對裝置；正式服務必須另外提供 owner 撤權工具才可進入最終驗收。
正式私人 Site、Supabase SQL/Edge 尚未部署、ChatGPT 新工具尚未載入，本版 Windows 真機 GUI/網路配對也未經本人實測。

【安裝與啟動】
1. 進 GitHub Actions 的「GridCraft Windows local agent package」成功執行紀錄，在 Artifacts 下載 LizhiGridCraftAgent-Windows-v0.2-unsigned.zip。
2. 在本人電腦解壓縮、核對 SHA256.txt，再開啟 LizhiGridCraftAgent.exe；不需安裝 Python。
3. 在代理介面按「選擇 GridCraft.exe」指定官方軟體的安裝位置。
4. 按「啟動 GridCraft」，程式只會開啟指定的 GridCraft.exe --control 7979。狀態為 READY 才表示本機控制已接通。
5. 若希望每次登入 Windows 自動啟動代理，再自行勾選「Windows 登入後自動啟動此代理」，程式會將 EXE 複製到 %LOCALAPPDATA%\Lizhi\GridCraftAgent\，僅寫入目前使用者 HKCU\Software\Microsoft\Windows\CurrentVersion\Run。
6. 若也希望登入後自動啟動 GridCraft，先指定 GridCraft.exe，才勾選「登入後也自動啟動 GridCraft」。
7. 取消勾選「Windows 登入後自動啟動此代理」即可撤銷登錄啟動；按「停止代理」即關閉本機程式，不會強制關閉你自己正在使用的 GridCraft。

【安全界線】
- 控制僅連線到本機 127.0.0.1:7979；所有本機控制連線均使用原廠的 token 檔案進行驗證。
- 本版預設只支援狀態與安全唯讀：window.list / document.inspect / sheet.read / cell.get。
- 不提供跨網路監聽、不開防火牆入站、沒有任意 shell / cmd / UI 模擬或檔案路徑遠端指令。
- 原生 token 僅在本機使用，不應傳給 ChatGPT、公開 GitHub、網站或他人。
- 目前已開發出站 HTTPS / owner-device 驗證候選，但正式服務與 ChatGPT Site MCP 未部署，因此即使此處 READY，**也不代表 ChatGPT 已能從雲端控制你的電腦**。
- 這是 unsigned 預覽版：若 Windows 安全防護系統提出異常警示，應先檢查檔案來源、SHA256 與掃描結果，不要直接略過警示。

【測試與發佈界線】
- CI Windows 2022 runner 測試 Python 模擬控制協定、HKCU opt-in 邏輯（假 registry，不改 runner 真實開機設定）、啟動路徑限制、設定檔保護及 .exe --self-test。
- Windows GUI 人工點擊、真正 Windows GridCraft --control 7979 連線、電腦開／關機、重登錄與 ChatGPT MCP 連線：尚待本人實機驗收（NOT_TESTED）。
- GitHub Actions Artifact 僅保存 7 天；PR #88 保持 Draft，未合併 main、未正式發布、未部署站點/Edge/DB。
- 開發來源：https://github.com/lihuany635-create/lizhi-cloud-web/pull/88
- P1/P2 原計畫：https://docs.google.com/document/d/17JBEggCL-h0GPsXCt6szi4cE7O-NzlILTlPrJzfjuQg/edit
