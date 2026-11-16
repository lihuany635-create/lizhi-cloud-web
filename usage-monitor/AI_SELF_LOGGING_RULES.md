# AI 自行登記流量／操作用量｜Site 前置規則候選 v0.1
日期：2026-11-16｜適用：原「立之雲端庫」流量監控專案 TASK-001。

## 使用者已更正的原始需求（優先）
不是等待 Supabase 官方 Usage/Management API 提供流量記錄，而是**AI 在自己實際操作前後主動登記操作**、可查詢已登記總數，並在下一次操作前核對自行設定的操作上限。**官方 API 不是主要記帳來源，不需要官方 API 才能開始記錄。**

### 操作前：預估與准入
1. 讀取 AI 工作台 TASK-001 和最新附加式 Side 使用日誌，確認上次已登記範圍。
2. 針對每次即將使用的 Supabase 工具，產生 `eventId`（UUID），記錄時間、靜態服務名稱、操作類型、預計呼叫次數、操作理由與可追溯依據，狀態 `before/planned`。不可記錄 Token、SQL 內容、使用者資訊或本文。
3. 僅以「AI 自行操作次數」作本地預算控制。沒有經使用者設定/核對的本地上限，不能假稱已得知 Supabase 官方剩餘額度，更不可用不完整歷史證明全站可繼續用量；應標示風險未知並依指示限制高風險額外操作。

### 每筆紀錄必填：是哪個功能、為什麼產生操作

每筆 AI 操作都必須有 `feature`（功能代碼，例如 `english_classroom`）、`taskLabel`（使用者這次交代的工作簡稱，例如「英文教室單字卡測試」）、`actionDetail`（當下具體操作目的，例如「查詢單字卡資料」），並與 `service`、`operation`、`at`、`toolCalls` 一起保存。**不能只有「Supabase 用了 1 次」這樣無法追溯的數字。**

`before` 與 `after` 使用同一個 `eventId`，其功能、任務名稱和行為目的必須一致，不允許事後改標籤。不得把整段使用者原始對話、SQL 原文、Token、Email、金鑰、密碼、真實網址參數寫入標籤；一律由 AI 產生簡短、不含敏感資訊的描述。

月報除操作總次數外，需列出依 `feature` 分組的已登記次數，且能追查每一筆的 `taskLabel`、`actionDetail`、`operation`、結果與證據。只有 AI 自行操作的部分可以計數，不能把工具呼叫次數冒充 Supabase 官方計費流量。

### 操作後：自行登記
1. 在真正取得工具結果後，使用同一 `eventId` 追加 `after`：成功/失敗/未知，實際由 AI 送出的工具呼叫數，證據 URL（若有）。
2. **執行失敗仍有機會消耗 Supabase 資源**；不要把失敗記為零消耗。只有已實際知道的工具呼叫次數可以填數字，無法得知的 Supabase Edge Invocation、Egress、DB Compute、讀寫次數及帳務費用都為 `null`，不可推算成零。
3. 每一筆記錄追加至原 Side 工作日誌；必要時在原 AI 工作台 TASK-001 連結批次報告，不能覆蓋已存在歷史。若工具寫入失敗，對帳與可驗收性應標記 `LOG_WRITE_FAILED`，不得說已成功登記。
4. 以 `usage-monitor/ai-operation-ledger.mjs` 的格式校驗、去除重複與彙總。此模組目前為**測試中的資料契約**，尚未接入現場持久化／網站，不會自動從所有對話蒐集事件。

### 不依靠官方 API
- 不主動要求 Supabase Management API Token；`management-api-observer.mjs` 是歷史候選，只允許明確授權的獨立交叉核對，不參與自記帳、不觸發自動查詢、不用其回傳決定 AI 動作預算。
- 存放平台或前端若未來需要讀寫 API，**那是保存/呈現 AI 自己填寫的紀錄，不是依賴 Supabase 官方用量 API 產生紀錄**；不得混為一談。
- 已建立的 `lz_usage_events` 和既有 meter 保留供未來額外觀測，但不得視為目前 AI 自己已經登記或官方全站流量資料，也不要在沒有批准的情況下修改正式表結構、重新部署 Edge。

### 必須說明的界線
- AI 能登記**自己經手且工具提供可追溯結果的操作**。沒有系統層事件攔截與持續執行代理，無法得知其他 AI、使用者瀏覽器、排程、第三方直接呼叫 Supabase 的每筆操作。
- 一次 AI 工具呼叫不一定等於一次 Supabase API 請求、一次 Edge Invocation 或一定的帳務費用。沒有服務端的可驗證使用資料時只能說「AI 工具操作 N 次」，不能說「Supabase 消耗 N 次」。
- 「自行登記」可以降低漏記並提供 AI 操作記帳，不等於全域硬限流。若需要可靠的自動防超額，仍須獨立處理其他來源並有無法繞過的入口；此項是另一個尚未完成、不得偽稱 PASS 的工作。
- 不需新 Site、不需新 Supabase 專案，也不以 Supabase Management API 為前置依賴。

## 操作清單範例（非真實用量）
- BEFORE：eventId=UUID、service=supabase、feature=english_classroom、taskLabel=英文教室單字卡測試、actionDetail=查詢單字卡資料、operation=sql_read、outcome=planned、toolCalls=0。
- AFTER：相同 eventId、相同 feature/taskLabel/actionDetail、operation=sql_read、outcome=success/failure/unknown、toolCalls=1、帳務/Edge/Egress 一律未知。
- 顯示：本月「AI 已自行登記工具操作」；**不顯示**「官方剩餘額度」除非另有真實獨立來源。

## 目前驗收
- 候選模組 / 單元測試：現已由 GitHub Actions 完成 Node、Deno、隔離 PostgreSQL 及正式匿名/外部 Origin HTTP 測試，最新結果以 PR #77 所對應 SHA 為準。
- 原 Side 工作日誌：2026-11-16 已實際寫入並讀回數組 before/after 單筆紀錄；已有 ai-self-log-runner.mjs 候選封裝，但沒有 ChatGPT 全平台、全對話的自動工具攔截能力，這項不能稱為全域自動記錄已驗收。
- 正式流量監控頁面：PR #77 已加入以 GET /ai-ledger 讀取原 Side 記帳、POST /ai-budget 儲存個人自訂上限的新版介面；須該 PR 正式合併及 Pages 發布後才算網站接通。
- 原 Supabase Edge：2026-11-16 已確認原專案 lizhi-usage-monitor ACTIVE v1，正式匿名 401、異站來源 403 測試 PASS；登入本人及跨裝置未完成正式驗收。
- 原 Site：本階段禁止動。
