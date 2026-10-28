# 立之 AI 多代理協作迴圈｜v1.5 身分防偽及零新增費用審核 v1.6

- 2026-10-28（Asia/Taipei）；工作台原專案 `61b88bec-9b3e-49e6-8780-d073fc816516`；Draft PR #43。
- 本文件記錄**實際唯讀核對、程式修正與未驗證事項**，不是授權或部署同意。
- **絕對限制**：現有正式 Site、D1、Supabase／Bridge Secrets 均不修改；不新建 Site、不啟用 AUTO、不啟用付費模型、不執行候選 SQL、不合併 main。

## 實際核對的狀態

1. GitHub `lihuany635-create/lizhi-cloud-web` 為 **public**；PR #43 仍是隔離草稿分支。公開 repo 的標準 GitHub-hosted Actions runner 一般無額外 minutes 費用，但不能因此保證所有 GitHub 付費功能免費（[GitHub 官方](https://docs.github.com/en/actions/concepts/billing-and-usage)）。
2. Supabase organization `huglclrkdejjdzwbpxma` 查得 `plan=free`、`tier=tier_free`；專案 `hrdzywkihfqggiwjgavi` 查得 `ACTIVE_HEALTHY`。**未讀取其即時用量或帳單**。
3. Cloudflare Workers Free 官方參考限制：100,000 requests/day、10ms CPU/request；D1 Free 參考限制：5 million rows read/day、100,000 rows written/day、5 GB account total、500 MB/database。Free 方案通常超額會停止服務，不代表已確認使用者的**私人 ChatGPT Site 的底層方案、計量與帳單**（[Workers 限制](https://developers.cloudflare.com/workers/platform/limits/)、[D1 計費](https://developers.cloudflare.com/d1/platform/pricing/)、[D1 限制](https://developers.cloudflare.com/d1/platform/limits/)）。
4. 目前可使用的連接器沒有原私人 Site 的**當期 D1 rows/儲存、Workers 請求與 CPU、套餐、實際剩餘額度或硬性上限**讀取功能；不能稱作已完成零元費用「帳單驗證」。任何上線門檻仍須由本人或可信平台顯示器核對。

## 發現的身分弱點及已做的草稿程式修正

在原 `production/source/lib/ai-loop-v15.mjs` 中，`authenticate(req)` 會比較 `oai-authenticated-user-id` 與 owner。**一個 HTTP 標頭的字面值不能證明請求一定從驗證過的 Sites 前門進來，除非平台明確保證移除外部同名標頭並安全注入**。這項平台行為尚未通過黑盒安全測試；也不能用 `origin` / `sec-fetch-site` 代替驗證。

已修改草稿：
- `ManualReadHost` 建立時強制注入 `verifyIngress(req)` 受信任**服務端**身分驗證 callback；少了 callback 就以 `INGRESS_VERIFIER_REQUIRED` 拒絕。這個 callback 應驗證平台簽章、內部授權上下文或 session，而**不能只讀 HTTP 標頭或 request body**。
- 每次 `authenticate`、`run`、每次 source read 及成功返回前，均重跑驗證；只有 `principal.authenticated===true`、`principal.subjectId===owner` 且原身份標頭一致才通過。
- `/api/ai-loop` 草稿 route 在未取得可信服務端 callback 時即使 `AI_LOOP_MANUAL_ENABLED=true` 仍回 `INGRESS_VERIFIER_REQUIRED`。目前**尚無從 Sites 官方/實機證明可注入的 callback**，所以程式**故意無法上線運作**；不得用環境變數字串、`authenticated:true` 或無簽章任意標頭假裝實作。
- Node 測試可用 mock verifier 驗證拒絕路徑，**但這不能驗證真正 Sites 登入或前門 anti-spoofing**。新加針對缺失 verifier、偽造正確標頭、錯 owner / 被撤銷 principal 的負向測試。

## 上線前不可略過的阻擋條件（保持 NOT_TESTED）

- **ID-01**：以真實的已登入 owner、登出者、跨帳號訪客及可偽造 `oai-authenticated-user-id` 標頭的直連攻擊做黑盒驗證；無服務端可信驗證器即**不能啟用**。
- **ID-02**：釐清 Site origin 能否繞過平台前門直接呼叫。如果可以，必須由原服務端禁止或要求可驗證簽章。
- **DB-01**：原私人 Site 的 D1 免費方案、資料庫大小、當期 rows 與是否可用兩張新表，連同寫入原子性及讀副本一致性全部實測。
- **DB-02**：明確制定 grant/audit 保留期限、人工刪除流程及刪除後的稽核可追溯性；migration 需單獨審核。
- **COST-01**：以本人平台帳號實際核對 Workers/D1 的方案及配額、超額行為與新增月費 NT$0；新執行器若不能保證失敗關閉則停止。
- **ROLLBACK-01**：重新核對 Site 最新版本、MCP schema、D1 binding、Secrets 保留策略與可回退版本。不能用 GitHub 候選版覆蓋整站。
- **AUTH01–10**：正式且可撤權的 MANUAL L0 三工具、單專案端到端驗收；未實測不可標 PASS。

## 狀態判定

- Draft 原始碼修正及本地／GitHub CI：只可按**確切新測試結果**標記。
- `liveOwnerAuthorization`、`liveManualMcp`、`cloudBillingVerified`、`cloudD1Consistency`：全部 **NOT_TESTED**。
- 使用者這次提供 v1.5 開發交接**不構成新部署或建表核准**。不發正式 Grant，不重用廣權 Bridge Key 作獨立 Worker bearer，不擅自新增付費。
