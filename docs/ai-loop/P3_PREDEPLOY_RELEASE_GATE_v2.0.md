# 立之 AI 多代理協作迴圈｜v2.0 部署前原始碼安全關卡（僅 CI）

- 日期：2026-10-28（Asia/Taipei）
- 原專案：`61b88bec-9b3e-49e6-8780-d073fc816516`
- 開發：`lihuany635-create/lizhi-cloud-web`／`feature/ai-loop-p1-spec-sandbox-20261028`／Draft PR #43
- **狀態：僅原始碼防回歸，不是正式授權、部署保護措施、帳單硬上限或真實 E2E。**

## 本輪目的

v1.8 已由原帳戶登入並核對 Plus、Site v24 owner-only、管理頁建置用量與自動加值 OFF；原 Site 主動取得的匿名首頁／匿名 MCP／偽造登入標頭 MCP 三個負向 401，不足以構成完整平台身份驗收。v1.9 完成僅在隔離 SQLite/D1 shim 的 Grant／Audit 保存量預檢，沒有刪除資料。這些內容不能被當作正式 MANUAL Worker 已上線的證據。

v2.0 在同一個 GitHub 草稿 PR 追加**可在每次測試中辨識意外放寬權限**的靜態契約檢查：

- `experimental/ai-loop/deployment-contract.mjs`：由 GitHub 專案檔案實際讀取候選路由、宿主、SQL、清理預檢器、CI workflow、P5 evidence 產生器；逐項驗證靜態安全不變量。
- `experimental/ai-loop/deployment-contract.test.mjs`：針對可被誤改的開關、身份、工具、專案、轉址、SQL、CI 權限、稽核清理與證據真實性提供反向測試。
- 本版使用既有 `acceptance-evidence.mjs` 自動發現 `*.test.mjs` 測試，未加入任何部署、排程或付費工具。
- 成功輸出只能標 `STATIC_CANDIDATE_CONTRACT_PASS`，內含 `deploymentApproved=false`、`liveOwnerAuthorization=NOT_TESTED`、`actualSiteQuota=NOT_VERIFIED` 及 `liveD1=NOT_TESTED`。

## 契約防護項目

1. 只針對指定工作台 projectId；不擴大成多專案。
2. Worker 只允許 `list_projects`、`get_project_context`、`get_project_handoff`。
3. 原 Site 候選 route `AI_LOOP_MANUAL_ENABLED` 不是 `true` 時必須明確拒絕。
4. 另外要求可信 `verifyIngress` server-side callback；不能單靠登入標頭／body 旗標；principal 須有未過期、未撤權、非匿名等檢查。
5. Bridge 指向固定來源，`redirect:manual`，拒絕 3xx。
6. SQL 僅允許兩張新增隔離表，不容許 DROP／ALTER 或資料異動語句。
7. v1.9 保存量工具仍只有 SELECT；`deletionAuthorized=false`、`scheduledCleanup=false`，保留 requestId 墓碑。
8. GitHub Actions 仍只有 `contents:read`、標準 runner、無部署或 cron 操作。
9. 既有 P5 evidence 不得自行標示 live PASS 或 authorApproved。

## 檢查器的界線：**不能拿來當正式防護**

這是一組 Source Code **字串／結構模式**的檢查，不是完整 AST 語義分析、形式驗證、供應商簽章或 CI 管理員不可更改的 Branch Protection。惡意／具權限的編輯者能同時修改程式和測試，部分不當程式變更也可能通過模式檢查。**正式授權必須由真正的 Sites / MCP 服務端強制執行**，而不是靠此檢查器。

需要將來另行核准、驗證後才能進行的項目：

- 原 Site 平台提供的真正 server principal、origin 封鎖、跨帳號與登出／撤權即時驗證；
- 原 Site 當期 Sites/D1 額度、hosting 超額費用與配額失敗行為；不能用 Cloudflare 原生 Workers Free 免費數字代替；
- D1 真實交易／一致性、audit 備份及人工清理週期；
- 對原私人 Site 差分部署、兩張候選 D1 表、短期 MANUAL 三唯讀 AUTH01～10 真實驗收及回退計畫。

## 官方費率判讀與帳號狀態

OpenAI Help Center `Creating and using ChatGPT Sites`（2026-10-28 查閱）明確指出 Plus/Pro 託管目前包含在訂閱內，**建置/編輯會耗用 Codex 額度**，Sites 的執行、流量與資料儲存受共用限制；單 Site D1 最多 10GB。這支持「不必為原 Site 另買原生 Cloudflare Workers 方案」的方向，**卻不代表本站實際當期配額或全帳單已驗證為零**。

官方網址：
- https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
- https://learn.chatgpt.com/docs/sites/data-and-connections

現況：**AUTO OFF、MANUAL 未啟動、原私人 Site v24 不修改、無新 Secrets／Migration／付費 API／外部 Worker、PR 維持 Draft**。

驗收方式：以最新 GitHub Actions **實際 Run/Job 日誌**核對，不能用程式碼／文件對測試數量的宣稱取代。
