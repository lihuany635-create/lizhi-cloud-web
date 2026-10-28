# 立之 AI 多代理協作迴圈｜v2.0 真實唯讀契約與防重寫入預算

- 日期：2026-10-28（Asia/Taipei）
- 專案：`61b88bec-9b3e-49e6-8780-d073fc816516`
- 位置：既有 `lihuany635-create/lizhi-cloud-web` Draft PR #43，分支 `feature/ai-loop-p1-spec-sandbox-20261028`
- **狀態：原有工作台本人MCP已唯讀；獨立 Worker 授權 E2E、原私人 Site 發布、D1 實庫建表與費用仍 NOT_TESTED。**

## 1. 真實 MCP 資料契約唯讀核對

使用已連線的現有製作工作台工具（**不是候選 Worker**）實際讀取：
- `list_projects`：成功，回傳陣列；目標 `projectId` 等於本專案，且有整數 `revision`。
- `get_project_context({projectId})`：成功；Revision 108；有 `projectId`、`revision`、`tasks`。已見 `tasks[].id`、`key`、`status` 等必要欄位。
- `get_project_handoff({projectId})`：成功；Revision 108；有 `projectId`、`revision`、`unfinished` 陣列及 `lastWork`。
- 實際三種回應的資料大小粗量為 list ~10.5k、context ~111k、handoff ~53.5k 字元，均低於候選 Bridge `262144 bytes` 的單次 body limit。**這是該時間點抽樣，不是未來所有紀錄的容量保證。**
- 從 GitHub `production/source/lib/project-management.ts` / `backend/index.ts` 讀回確認 `listManagedProjects`、`getProjectContext`、`getProjectHandoff` 確為原後端已知操作，參數型態與候選 `bridgeSource` 固定映射相符。

**安全邊界**：沒有將原始私人工作紀錄、來源、Secrets、完整 JSON 寫入公開 GitHub；只報告工具成功、結構、revision 與抽樣量。原工作台 MCP 的讀取成功僅證實原有通路，不能代替獨立 Worker 的 AUTH01～AUTH10 正式授權驗收。

## 2. 發現的 D1 免費額度風險：重試也會產生多餘紀錄

舊版流程 `issue(owner)` 建立並稽核新 Grant，然後 `claim(token, requestId)` 才由 `UNIQUE(owner,request_id)` 擋住重複請求。重送相同 `requestId` 時，即使 **不重讀 MCP**，資料庫仍可能增加一筆未被 claim 的 Grant 與至少一筆 ISSUED 稽核事件。長期重送可能耗費 D1 每次寫入及保存空間，與零新增費用目標衝突。

v2.0 候選修正（**尚未部署**）：
1. `D1Ledger.issue(owner,now,ttl,requestId)` 允許在 **batch 原子交易**的 Grant INSERT 當下預先保存 requestId，原有 `UNIQUE(owner,request_id)` 於重送時拒絕；Audit 仍與 Grant 一起提交／一起 rollback。
2. `ManualReadHost.run` 驗證輸入 requestId 後便使用上述預留方式；若重試碰到同 owner 同 key，連 Grant/Audit 都不建立。
3. `claim` 僅允許 `request_id IS NULL`（兼容本地既有舊測試）或與預留值完全一致；禁止以不同 ID 覆蓋既有預留鍵。
4. `UNIQUE` 是 owner-scoped。不同 owner 可使用相同 requestId，但同 owner 不可。
5. 原有授權/時效/驗證/撤權與 API 限權仍保留；任何 SQL 錯誤回給 caller 的都是泛化安全錯誤。

新增 `V19-01..04` SQLite 實測：同 ID 重送無新增 Grant 或稽核、雙資料庫連線並發防重、claim 不得換鍵、跨 owner 不混淆。CI 結果請以當次 GitHub Actions job 的實際日誌為準。

## 3. 不得混淆的未完成工作

- ChatGPT Sites 最新私人本人 session 的可信來源、源站繞過與立即撤權：**未完成**，保持 `INGRESS_VERIFIER_REQUIRED`。
- 原私人 Site 的當期 D1 容量／rows／CPU 與 hosting 額度、超額失敗行為、帳單硬上限：**NOT_VERIFIED**。ChatGPT Plus 建置用量與自動加值 OFF 不等於 Site 託管費用硬上限。
- 真實 D1 `batch` 交易一致性、跨 instance read-after-write、到期墓碑、正式授權測試：**NOT_TESTED**。
- 任何新增付費 API、MANUAL／AUTO 啟用、Cloudflare 外部 Worker、新網站、D1 Migration、Secrets 或原私人 Site v24 更動：**本版均未執行／未授權**。

下一步先取得原私人 Site 可信身份及 Sites 費用計量的**平台端**證據，再在本人另外明確核准後考慮短期 MANUAL 唯讀真正測試；不再要求使用者重複登入。
