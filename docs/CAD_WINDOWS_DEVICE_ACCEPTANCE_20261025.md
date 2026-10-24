# 立之 CAD｜Windows 真實資料夾與離線驗收操作（未發布候選版）

> 此手冊用於 **Windows 本機隔離測試**。不能把 CI 模擬資料夾當作已完成 Windows 授權驗收，也不會發布正式網站、寫入正式工程中心或 Supabase。使用**新的空白測試資料夾**，不要先使用正式工程圖。

## 1. 取得候選檔案（仍不動正式 main）

- GitHub 原始碼 [feature/embed-lizhi-cad-local-v1](https://github.com/lihuany635-create/lizhi-cloud-web/tree/feature/embed-lizhi-cad-local-v1) 必須取同一分支，不是正式 main。
- 自 GitHub Actions 已通過的 [#40120106720](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40120106720) 下載 `lizhi-cad-integrated-runtime-candidate` ZIP；此原生 WASM bundle 由自有 CADCraft Fork SHA `19e09447345750eaedd33db7a86fbeff3af1210f` 實際編譯。
- 把 ZIP 內的 `index.html`、`*.js`、`*.wasm` 等**全部檔案**解壓到上述雲端庫分支的 `cad/runtime/`；需看到 `cad/runtime/index.html`，不可多包一層資料夾。
- 在雲端庫**分支根目錄**用 PowerShell 啟動：`python -m http.server 8771 --bind 127.0.0.1`。不要直接以 `file://` 開啟 HTML，因為瀏覽器 File System Access / wasm / service worker 要求安全來源。
- 用 Chrome 或 Edge 開 `http://127.0.0.1:8771/?open=cad`，選單應指向「立之 CAD」而不是額外站點；CAD 畫布應顯示並可操作。

## 2. 真實 Windows 檔案寫入與版本測試

1. 在本機新建空白目錄 `CAD-Test-Only`（**不要放私人工程資料**）。
2. 在 CAD 工具列按「選擇 DXF 資料夾」；確認 Chrome/Edge 原生目錄視窗選到 `CAD-Test-Only`，由本人授權讀寫。
3. 用「開啟 DXF」匯入一份**非機密**的 DXF，或在 CADCraft 內新建長 800、高 900 mm 的矩形，請確認原生 CAD 繪圖畫布可看到它。
4. 使用 CADCraft 的存檔動作（例如 Ctrl+S）；**必須**看見「已驗證本機 DXF」及 SHA-256 成功資訊後才能把它視為落盤。
5. 用檔案總管到 `CAD-Test-Only\revisions`；應至少有一個含 UUID 的 `.dxf`，大小非零；先備份此候選 DXF 並記下檔名。
6. 再存一次，檢查 `revisions` 出現新的第二個檔案，原版未被覆寫；以 CADCraft 分別開啟並比較尺寸。
7. 重新整理雲端庫網站；按「歷史版本」應能列出同一目錄裡的檔案。如瀏覽器要求重新授權，**先在 UI 重新選擇資料夾**，不能繞過作業系統授權；讀回老版本不得覆寫它。

## 3. 拒絕權限與瀏覽器本機救援

1. **僅在測試圖上操作**，撤銷資料夾權限或關閉權限後，從 CADCraft 再按存檔。
2. 此時不能出現「已驗證本機 DXF」的成功宣稱；應看到「已要求瀏覽器下載」或明確失敗訊息。
3. 開啟瀏覽器下載清單，確認 `.dxf` 真正下載完成。下載命令已發出不等於檔案已保存。
4. 點「救援存檔」會列出保存在同一瀏覽器 IndexedDB 的緊急副本；點「再次下載」檢查下載。救援副本只有確定外部備份完整後才可手動刪除。
5. 如果瀏覽器禁用／清除了網站資料、無痕模式被關閉或磁碟空間不足，IndexedDB 救援可能一起消失；**它不是跨裝置雲端備份**。

## 4. 離線與重新啟動

- 首次必須聯網載入 HTML/JS/WASM 並完成 Service Worker 快取；新裝裝置不能保證第一次離線就能使用。
- 等待網站可正常運作後，於 Chrome 開發者工具 Application → Service Workers／Cache Storage 確認 CAD `.wasm` 及 `cad/runtime/index.html?host=parent` 已快取。
- 在 Chrome DevTools Network 切到 Offline（不要停掉 Python 本機站以免混淆服務與快取），重新整理 `?open=cad`，檢查 CAD 畫布、歷史版本與本機 DXF 是否正常。
- 若離線頁顯示 503 或 CAD 引擎未載入，記錄實際錯誤，不能標 PASS。

## 5. 手機與不同瀏覽器

- 在有 File System Access 資料夾權限的瀏覽器測試真實目錄；Safari/部分 Android 版本可能不支援該 API，應退回 DXF 匯入與下載。
- 需測試 390px 手機寬度、檔案下載後的位置和開啟流程；**不得假設電腦 IndexedDB 的圖檔自動同步到手機**。

## 驗收紀錄（應填實際結果，不可代填）

| 項目 | 設備／日期 | PASS／FAIL／NOT_TESTED | 佐證 |
|---|---|---|---|
| 真實 Windows 檔案對話框授權 |  | NOT_TESTED |  |
| DXF 第一版磁碟檔，hash 驗證 |  | NOT_TESTED |  |
| 第二版建立，第一版未覆蓋 |  | NOT_TESTED |  |
| 重載後讀取舊版與本人再授權 |  | NOT_TESTED |  |
| 無權限時下載、IndexedDB 救援 |  | NOT_TESTED |  |
| PWA 真離線可繪圖 |  | NOT_TESTED |  |
| Android/手機版 UI |  | NOT_TESTED |  |

已通過的 **GitHub Actions Chromium（含真 OPFS／IndexedDB，picker UI 仍模擬）** 是另一份自動測試證據；不能取代本表的真 Windows 實測。工作完成後再審查 Draft PR #6，未驗收前保留正式站不變。
