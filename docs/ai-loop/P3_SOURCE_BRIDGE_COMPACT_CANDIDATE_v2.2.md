# 立之 AI 多代理協作迴圈｜v2.2 原工作台 Bridge 來源端 compact 接線候選

日期 2026-10-28（Asia/Taipei）。原專案 `61b88bec-9b3e-49e6-8780-d073fc816516`。原 GitHub Draft PR #43／分支 `feature/ai-loop-p1-spec-sandbox-20261028`。

## 目標

在不變更已正式提供的 `listManagedProjects/getProjectContext/getProjectHandoff` 三個既有 API，也不擴張其他 MCP 工具的前提下，解決 v2.1 辨識的 **上游 context/handoff 可能先於傳輸時超過 256 KiB** 問題。

本次只是修改原 GitHub **未合併草稿分支**的候選來源碼；**沒有**部署 `lizhi-production` Supabase Edge、沒有發布原私人 ChatGPT Site v24、未改 D1／正式資料／Secrets／GitHub main，也未啟動 MANUAL/AUTO。

## 已完成的候選程式

1. `production/source/lib/ai-loop-compact.mjs`：將 v2.1 的純粹 `projectSourceResult` 改成適合既有 owner-scoped server 使用的 `compactOwnedProjectOperation`，固定 projectId、revision、每筆 task ID／key／status，以及 handoff 的最新 work key／全部 unfinished 任務計數。使用 `MAX_PROJECTED_BYTES=65536` 與 `MAX_TASKS=1000`；超過上限、格式非法或重複任務時拒絕，不截斷。
2. `production/source/backend/index.ts`：原 `/bridge` 仍先驗證 `lzp_` 工具 key 的 hash，並依查核 owner 從 `lizhi_production_state?owner_id=eq.<owner>` 取得資料。僅在驗證與該資料讀取**之後**，選擇新版本化操作，使用 `managedOf(state,AI_LOOP_PROJECT)` 取得同一 owner 的專案；**原本操作繼續走舊 `operate()`，不覆蓋既有 API**。
3. 新 API 操作名稱：`listManagedProjectsCompactV1`（無參數）、`getProjectContextCompactV1`（僅指定 projectId）、`getProjectHandoffCompactV1`（僅指定 projectId）。額外參數、外部 project、未授權操作皆拒絕。
4. `production/source/lib/ai-loop-v15.mjs`：候選 Worker Bridge adapter 只有 `AI_LOOP_COMPACT_SOURCE_MODE==='verified-v1'` 才呼叫新操作，沒有設定時保留既有操作；未知值拒絕、404 或其他錯誤**不回退**舊 API。
5. `experimental/ai-loop/compact-bridge-integration.test.mjs`：新增 CB-01～CB-14 隔離測試，驗證超大私人歷史只輸出白名單、外部 project 拒絕、任務多寡/重複/狀態/byte limit 防錯、compact op 的 Bridge request mapping、未部署導致 404 時不退回 legacy、原有操作不變。
6. `.github/workflows/ai-loop-sandbox.yml`：將新的上游 backend/compact 模組列為 CI 觸發路徑；增加 backend TypeScript 與純 JS module 的**語法**檢查，不執行部署或付費工具。

## 目前證據與誠實界線

- 最終 GitHub Actions Run **40672411470**／Job **122762251677**，真正讀取 job log：`SANDBOX_PASS total266 passed266 liveE2e=NOT_TESTED`、`BACKEND_HANDLER_SIMULATION_PASS cases=7`、`LOCAL_MOCK_PREFLIGHT_PASS localPass10 liveOwnerAuthorization=NOT_TESTED`。
- 原 `/bridge` 的工具憑證、owner DB 範圍與新版本操作僅有**原始碼核對和隔離測試**；沒有用真 Bridge key 呼叫、沒有部署到 Supabase Edge、沒有在 ChatGPT Sites 真實 MCP 使用此新操作。
- **已補上原始候選 handler 隔離運行**：`experimental/ai-loop/compact-bridge-handler.mjs` 透過 Node TypeScript transform 及僅測試使用的 `ts-extension-loader.mjs`，實際載入 `production/source/backend/index.ts`。Deno 服務註冊、Supabase key lookup 和 owner DB 讀取皆使用本機虛構資料／fake fetch，驗證 7 組請求：三個新操作、外部 project、額外參數、匿名及舊版操作保留。日誌包含 `BACKEND_HANDLER_SIMULATION_PASS cases=7 sourceScoped=owner-db liveE2e=NOT_TESTED`。
- 離線測試使用 mock fetch、虛構資料及候選處理器。**沒有使用真實 Supabase session、真 D1、正式 Bridge、Sites 登入、真網路**；Node 模擬不是平台實測。
- 源端投影會減少**回傳的 HTTP body**，但舊工作台資料仍須先在原服務端 owner-scoped DB 讀取。它不是減小原本 Supabase 主資料列，也不是 D1 用量/費用估算器。
- 來源端之後若正式升級，需核對正式 `getProjectContext` 與新操作的 task ID+status 集合及 revision 完全一致，並確認匿名/跨 owner、跨 project、錯誤/過量回應與舊工具相容性。

## 尚需核准的階段與障礙

目前不可直接啟動 Worker；未驗證／未完成事項：

1. **Sites**：本人真實 session principal、源站拒繞過、跨帳號與登出／撤權即時生效，仍 `NOT_TESTED`。v1.8 三項 401 僅是匿名/假標頭前門負向證據。
2. **Sites 費用**：已登入 Plus、看過建置用量、auto top-up OFF；但原私人 Site/D1 當期讀寫/剩餘 quota、CPU、託管超額費用硬上限仍 `NOT_VERIFIED`。
3. **正式 Bridge**：本候選 source compact op 尚未部署；必須另行取得本人對 `lizhi-production` 差分部署的明確核准，先驗不破壞既有 MCP；不可用本次「繼續」當部署同意。
4. **原 Site v24**：需另核准才可差分發布新 Worker route、候選 D1 兩表、MANUAL 短時 L0 三唯讀 AUTH01～10 真實測試；任何測試前要有可回退來源碼與資料完整性策略。
5. **保留與清理**：v1.9 僅本地 D1 ledger 數量預檢，不准自行刪除 requestId 防重墓碑，不開啟 cron。
6. **外部模型**：不使用付費 AI API、不會變成五個真實獨立 AI；現在只處理安全唯讀來源契約。

完成後再建立必須以真實服務端證據判定的驗收矩陣；`CI 266/266` 的 PASS 範圍只是隔離原始碼測試，不能當 `AUTH01-10`、帳單或雲端 D1 正式 PASS。
