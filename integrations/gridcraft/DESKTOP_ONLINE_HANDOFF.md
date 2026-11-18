# GridCraft｜Windows 電腦開機才連線｜v1.2 操作與開發交接
2026-11-18；原專案計畫書 v1.2 第 13 章為現行有效決策。
狀態：**localhost 模擬控制 6/6 PASS；Windows 實機、雲端中繼與 ChatGPT MCP 均 NOT_TESTED。**
任何下列操作均不代表已安裝到本人電腦。

## 使用者最終 UX（目前是目標，不是已上線）
- Windows 開機、本人登入、授權代理已啟動、GridCraft 開啟 → ChatGPT 的 `gridcraft_status` 顯示 READY，可讀取授權工作簿，後續再開放有版本檢查的修改。
- Windows 關機／代理沒開 → `DEVICE_OFFLINE`；GridCraft 沒開 → `GRIDCRAFT_OFFLINE`；權杖失效或本人撤權 → `UNAUTHORIZED`。
- 本機 XLSX 原件與版本在本人選定的電腦資料夾；禁止因斷線自動發送完整 XLSX 到公共服務。電腦關機時不提供遠端存取能力。
- 不需要額外購買雲端 GridCraft 主機，也不依賴 GitHub Actions 給真人即時操作。

## 本機 GridCraft 的官方啟動方式
官方 `storytold/gridcraft` v0.19.1 `docs/control-protocol.md`：
```powershell
# 在已安裝 GridCraft、且本人允許本機控制時，在自己的 Windows 終端機：
& "C:\\你的已安裝路徑\\gridcraft.exe" --control 7979
# 僅 Windows 本機：同樣使用者執行附帶候選程式（需安裝 Python 3）
py -3 gridcraft_desktop_local.py
```
- GridCraft 必須由實際本人 Windows 帳號啟動；安全控制權杖會保存在 `%USERPROFILE%\.gridcraft\control-7979.token`（本機專用）。權杖不能貼到 ChatGPT、GitHub、公開文件、截圖或雲端工具日誌。
- 控制 TCP 預設只在 `127.0.0.1:7979`。不得設定路由器埠轉發、公開防火牆入站或把該埠用 ngrok 暴露。
- `gridcraft_desktop_local.py` 可執行本機狀態 probe；READY 代表本機控制回應，**不代表遠端 ChatGPT 已接通**。

## 實測（已完成）
- 使用官方 v0.19.1 控制規格的本機 JSON-lines 模擬伺服器，在 Linux 標準 runner 測試 `window.list` 認證，`sheet.read` 範圍讀取，離線，錯誤權杖，禁止任意檔案開啟/寫入/UI 指令，以及權杖檔案缺失。
- [GitHub Actions #44219256668](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44219256668)：`Ran 6 tests ... OK`，其餘 P1/P2 原生 CLI 合成測試亦通過。
- 單獨的 GridCraft Linux Headless CLI 已在 P1 與 P2 實測；**這無法代替 Windows 桌面應用程式實機測試**。
- 新的 `gridcraft_desktop_local.py` **預設只讀**，allowlist `window.list`、`document.inspect`、`sheet.read`、`cell.get`；不提供 `engine.execute`、`ui.key`、`app.open` 或任何外部程式啟動。

## 尚未完成的正式連線工作（下一步）
1. 【工程候選】基於原 Private Site 與原 AI 工作台，設計 owner + device + request_id + expiry 的受限命令中繼；**只能由 Windows 代理發起出站 HTTPS**，不新增公網 TCP 入站；中繼採短期佇列、不保存私人 XLSX、不盲重試未確定的寫入。
2. 【工程候選】Windows 本機橋接代理用本人授權的短期 device credential 取用佇列，與 `gridcraft_desktop_local.py` 配合，回傳最小必要狀態；電腦鎖定／登出／斷線按政策安全暫停。
3. 【本人 PC 現場驗收】確認 GridCraft 安裝實際路徑，啟動 `--control 7979`，讀取本人真機 window.list，檢查離線/錯誤權杖、停止代理；若要登入 Windows 後自動啟動，應由本人本機選擇授權並能一鍵取消。
4. 【權限 Gate】完成 owner 身分（由 Site 可信伺服器推導，非 ChatGPT 輸入）、本機 device 綁定、要求指定工作簿與明確的修改範圍、expected_version／請求去重／本機快照；通過後才增加寫入工具。
5. 【正式部署 Gate】只更新原 Private Site／必要既有 Edge，保留所有舊工具及 Secret，需本人對**實際正式 Site 修改/發布**明確批准；當前 PR #88 維持草稿。若中繼使用 Supabase，須依員工手冊第 26–30 條逐次登記，先確認非快取流量風險。

## 真正需驗收的狀態矩陣
| Windows | GridCraft | Agent | 預期 | 當前 |
|---|---|---|---|---|
| 關機 | 任意 | 離線 | DEVICE_OFFLINE | NOT_TESTED（非真機） |
| 開機 | 未啟動 | 在線 | GRIDCRAFT_OFFLINE | PASS（本機假伺服器測試），真機 NOT_TESTED |
| 開機 | 已啟動 | 未授權 | UNAUTHORIZED | PASS（模擬錯誤權杖），真機 NOT_TESTED |
| 開機 | 已啟動 | 已配對 | READY、授權工作簿唯讀 | PASS（localhost 模擬），真正遠端 NOT_TESTED |
| 開機 | 已啟動 | 已配對且授權寫入 | 修改、備份、回退 | NOT_TESTED |

資料來源：
- 正式計畫書 v1.2：https://docs.google.com/document/d/17JBEggCL-h0GPsXCt6szi4cE7O-NzlILTlPrJzfjuQg/edit
- 官方控制協定：https://github.com/storytold/gridcraft/blob/v0.19.1/docs/control-protocol.md
- 草稿 PR #88：https://github.com/lihuany635-create/lizhi-cloud-web/pull/88
