# 立之 AI 多代理協作迴圈｜v1.9 Grant／Audit 保存量唯讀預檢

日期：2026-10-28（Asia/Taipei）。唯一工作台專案 `61b88bec-9b3e-49e6-8780-d073fc816516`。原 GitHub 分支 `feature/ai-loop-p1-spec-sandbox-20261028`、原 Draft PR #43。

## 目的與界線

在 v1.8 的服務端本人驗證、Sites/D1 當期額度、源站防繞過及正式 AUTH01–10 **仍未完整驗證**的前提下，先補足未來 D1 容量審查必須有的**只讀數量預檢**。本版不建立 Worker、不啟用 MANUAL/AUTO、不配置 Secrets、不發布原私人 Site v24、不執行候選 D1 SQL，也不新增任何付費服務。

- 程式：`experimental/ai-loop/retention-inventory.mjs`。
- 測試：`experimental/ai-loop/retention-inventory.test.mjs`，10 項 RETAIN-01～10，使用**本機真實 SQLite**及只允許 `SELECT` 的 D1 介面 shim。
- P5 acceptance evidence 工具會自動發現新增 `*.test.mjs`、記錄來源 SHA 與測試總數。**本版仍為離線沙盒，不是正式 D1 或費用查核。**

## 只讀輸出

`previewRetention({db,owner,projectId,now,candidateDays})` 接收受信任伺服器傳入的 owner，不提供身分授權能力；只能在本地測試環境或未來由真正驗證過身份的伺服器內部呼叫，不可直接作公開 API。

讀取固定的 `ai_loop_grants_v15` / `ai_loop_audit_v15`，只使用參數化 `SELECT`。限定精確 project ID 與 owner，輸出只含：

1. 本人此專案 Grant 筆數，以及撤權、過期、可能仍有效的數量。
2. 已分配 `request_id` 的防重紀錄筆數（只顯示筆數，沒有原始 request ID）。
3. 可核對到 Grant 的 Audit 總筆數，以及「比候選保存天數更舊」的筆數（預設 30 日，**只是計畫值，尚未獲准**）。
4. 標示 `deletionAuthorized=false`、`scheduledCleanup=false`、`actualSiteQuota=NOT_VERIFIED`、`liveD1Consistency=NOT_TESTED`。

它**不**輸出本人 subject、token、requestId、來源內容、私有 URL 或稽核明細，也不估算不存在的 D1 真實儲存容量。若無表、SQL錯誤、異常資料、跨專案或參數違規，即失敗關閉。未連到 grant 的 audit 筆數仍需另一個受保護的管理端完整性稽核，目前標示 `NOT_ASSESSED`，不當作零筆。

## 為何不能直接「30 天刪除 Grant」

現有 `UNIQUE(owner,request_id)` 保存在 Grant 表。**直接刪除已過期/撤銷的 Grant，會刪除舊 request_id 的唯一性保護，令過往請求可以重新使用。** 因此本版連過期 Grant 都不刪，保留墓碑（tombstone）作防重；若日後需要壓縮，必須另行設計不可重放的歷史鍵儲存、核實跨 session/期間防重語義、測試資料搬移及重新核准 schema/費用，不能任意加 `DELETE` 或 `cron`。

Audit 的「30 日」僅供估算；真正刪除前須先確認資料保存期限、完整性證據、可重讀封存副本的雜湊、隱私與合規需求、容量/帳單和本人核准。不得將本工具輸出的 candidate count 視為獲准刪除的筆數。

## 尚待解除的阻礙

- **Site 身分**：v1.8 真實 401 負向證據屬前門檢查，未完成原 Site server principal、源站防繞過、跨帳號、登出後撤權即時性。候選 `INGRESS_VERIFIER_REQUIRED` 繼續 fail closed。
- **費用**：帳號為 Plus、auto top-up OFF、credit 0、Sites 管理頁用量/重置曾實讀；但**不是** Sites 目前 D1 rows、CPU、容量剩餘與 hosting 超額/硬上限。這些仍 `NOT_VERIFIED`，不靠本工具推定免費可部署。
- **雲端 D1**：atomic grant issue + audit batch 的正式 rollback／副本一致性／跨實例撤權與成本仍 `NOT_TESTED`，本版 SQLite 測試不取代真實 D1。
- **權限與部署**：此輪沒有正式建表、啟用 MANUAL/AUTO、發真實 Grant、修改原 Site v24、Secret 或合併 main。正式 AUTH01～10 仍 `NOT_TESTED`。

下一步：先取得 Sites 真正平台身份與實際用量/超額行為的可信證據，並在本人單次授權前保持所有正式操作關閉。具體測試和結果須以 GitHub CI 實際 job log、工作台最新 Revision 為準；不能從文件推論已通過。
