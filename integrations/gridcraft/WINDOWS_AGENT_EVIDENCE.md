# 立之 GridCraft Windows 連線代理 v0.1｜實際打包與安全驗收｜2026-11-18

## 範圍及已完成事項
用原 GitHub Draft PR #88 的開發分支，開發可攜、可雙擊開啟的 Windows GUI `LizhiGridCraftAgent.exe`。
本版可選擇 **本人本機的** `gridcraft.exe`，以 `--control 7979` 啟動／檢查 GridCraft；可自行勾選 Windows 登入後啟動代理及是否同步啟動 GridCraft；可按停止關閉代理。
控制僅連 `127.0.0.1:7979`，權杖留在本機，無公開監聽、沒有正式 ChatGPT MCP、沒有遠端寫入。

## 真實 Windows 打包證據
- [GitHub Actions Run #44220483691](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44220483691)：**completed / success**。
- 來源 commit：`cbce902f95472d5af00eeea5ed2d236e44f9e452`；Windows 2022 GitHub-hosted runner，Python 3.12，PyInstaller 6.16.0。
- **14/14 PASS**：本機 JSON-lines mock 控制安全測試 6 個；新增 Windows 啟動／設定／路徑限制／登錄模擬／重複啟動避免等 8 個。記錄 `Ran 6 tests ... OK`、`Ran 8 tests ... OK`。
- 已產出 **Windows 64-bit GUI EXE**，實際 `Start-Process ... --self-test -Wait` 退出碼 0；未在 Windows 真機手動點擊 GUI。
- `LizhiGridCraftAgent.exe` 大小 **11,397,364 bytes**，SHA-256 `1c1e7586b66fd25b33069517b9c620b690ba7505f8dfd66b03a7dd3b086d40cb`；下載 ZIP 內附 `SHA256.txt`，模型工作容器已實際解壓查核 SHA 相符，EXE PE/MZ 標記存在。
- [GitHub Actions Artifact 14389787698](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44220483691) 保存約 7 天，實際 2026-11-25T02:04:42Z 到期；本產物由原 PR 的開發 CI 而非正式 Site 發布。
- 已額外備份 ZIP 至**原 GridCraft 計畫資料夾**的私人 Google Drive：[立之GridCraft_Windows連線代理_v0.1_20261118.zip](https://drive.google.com/file/d/1ilAnsV0TKQZ9d41N5OLmugz34CXFKZls/view)。

## 失敗紀錄與修正
[GitHub Actions #44220275420](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44220275420) 首輪 FAIL：Windows 8.3 短路徑 `RUNNER~1` 與完整使用者路徑文字不相同，測試誤認路徑錯誤。修正比較已解析目錄的路徑，保留失敗測試紀錄，之後 [#44220357424](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44220357424) PASS。補上既有 GridCraft 不重複啟動及權杖失效拒絕重啟的測試後，最終 Run #44220483691 PASS。

## 操作與授權
1. 從上述私人 Drive 或 GitHub Actions 取得 ZIP，在本人 Windows 解壓縮並核對 `SHA256.txt`。
2. 雙擊 `LizhiGridCraftAgent.exe`；本版不依賴另一個 Python 安裝。
3. 在代理視窗中自行選擇本機 `gridcraft.exe`、按「啟動 GridCraft」；狀態 READY 僅表示**本機 GridCraft 已可讀取**。
4. 如果願意，勾「登入 Windows 後自動啟動代理」，程式把 EXE 複製至 `%LOCALAPPDATA%\Lizhi\GridCraftAgent\`，只寫目前使用者的 HKCU Run，沒有系統管理員授權；取消勾選會撤銷登錄。可另勾登入時也啟動 GridCraft。
5. 按「停止代理」只關閉本機代理，不強制退出使用者的 GridCraft；P3 尚未接通，所以這不會讓 ChatGPT 立刻可以遠端控制電腦。
6. 本檔未數位簽章。若 Windows 安全工具阻擋，應核對安全性及來源，不應無條件略過警告。

## PASS / NOT_TESTED / BLOCKED
- **PASS**：Windows CI 程式測試 14/14、GUI EXE 真實打包、自我診斷、檔案 SHA256、交付 ZIP、私人 Drive 檔案讀回。
- **NOT_TESTED**：本人實際 Windows 11 開機、GridCraft 桌面程式實際 7979 控制、實際 GUI 點擊與重登入自啟動、停止/撤銷、第二帳號、正式 Excel 讀寫。
- **BLOCKED**：正式可信出站 HTTPS 中繼、原 Private Site 的 gridcraft_* 工具與 ChatGPT 端到端尚未開發／接線；如需修改正式 Site/Edge/DB 必須本人另批准。

## 下一步
(1) 本人 Windows 上實際啟動 ZIP 執行檔，選擇 GridCraft 程式並報告 READY/GRIDCRAFT_OFFLINE/UNAUTHORIZED；(2) AI 以候選分支完成受控安全出站中繼、owner/device 授權與 ChatGPT 新工具；(3) 正式部署權限及端到端驗收另行核准。切勿把 P2 本機代理打包成功誤標為 P3 MCP 已連上。
