# 立之 Supabase 流量監控中心 — 候選版

## P1-D｜Site 前置工程修復進度（2026-11-16）

- **PR #77 目前已與 `main` 對齊、GitHub mergeable=true**。原 PR 分支採雙親合併 commit `c7a3b4b43dfd59c816d73bf36f35553377f9852e`，以 `main` 上已正式發布的 PR #82 前端資源為準，不再重複覆蓋。**目前仍是 Draft，未正式合併。**
- 本輪增補 `lizhi-usage-access.mjs`：使用 Supabase Auth /user 實際驗證 JWT 與專屬 OWNER UID（不依賴可修改的 `user_metadata`）；缺少 Secret、非本人、驗證服務中斷、轉接密鑰錯誤及不可信 Origin 預檢皆 fail-closed。新增 15 項自動測試，Edge 檔案改以此模組驗證。
- 本輪增補 `management-api-observer.mjs`：只支援 **Management API 的專案 Auth/REST/Realtime/Storage API 請求統計**，需要 server-only、具 `analytics_usage_read` 權限的有效憑證；**此數據不等於官方組織級帳務、Edge Invocation 或 Egress**。沒有憑證一律顯示 unavailable，不能宣稱已完成官方帳務對帳；新增 13 項資料來源/限流/失效測試。
- 本輪增補 `pre-supabase-gate.mjs`：單純外部閘道核心程式；要求可信身分、已驗證組織級官方帳務快照、嚴格服務白名單、分散式原子預留（由外部實作注入），任何缺失對非必要服務 fail-closed。新增 17 項並發/偽造/失效/限額測試。**尚無外部閘道宿主及真正原子預留後端，不得宣稱正式阻擋生效。**
- 正式資料庫 `lz_usage_events`／`lz_usage_daily` 與備份/隔離還原已完成；尚無正式記錄器接線，事件可能仍為 0。
- **正式 Edge `lizhi-usage-monitor` 尚未部署**；仍需要本人確認專屬 `LIZHI_USAGE_OWNER_UID` Secret、原 Site 未來橋接 Secrets、使用者實機登入、匿名/跨帳號/撤權/跨裝置 HTTP 端到端驗收。不能提交 Secrets 到 GitHub。
- **保留明確障礙**：自動串接 22 個既有 Edge、成本/壓力試驗、正式官方帳務對帳（缺乏可核實自動帳務來源及必要憑證）、真正入口前防繞過和外部原子預留均尚未 PASS。若無可靠正式流量閘道，不得啟用強制阻擋或宣稱可阻止超額；沒有足夠實測就不合併 PR 或大規模修改既有服務。
- 正式監控站前端 **PR #82 已發布至原 GitHub Pages**，`?open=usage` 在原系統選單下；實機登入仍需驗收。不要再發布舊版前端以覆蓋 PR #82。
- 此章只記錄 **候選程式與審查**，不是正式 Edge/Site 已部署、全部服務已接線或完整計費保護已完成的宣告。

## P1-E｜需求更正：AI 自行登記為主要來源（2026-11-16）

**使用者明確更正：原需求是 ChatGPT 在每次自己實際操作前、操作後自主登記使用紀錄，不是依靠 Supabase Usage API 或 Management API 來產生紀錄。** 本段取代此前將「官方 API 對帳」設為必備主記帳來源的假設。

- **核心**：新增 `usage-monitor/ai-operation-ledger.mjs`（附測試）與 `usage-monitor/AI_SELF_LOGGING_RULES.md`。操作前記計畫，操作後記實際工具操作數及成功/失敗/未知，使用相同 UUID；追加至原 Side 日誌並在 AI 工作台連結證據。絕不記錄明文 Token、用戶資料、原始 SQL 或 URL 查詢參數。
- **與計費數字區分**：已經觀測到的 AI 工具呼叫數 `assistantObservedToolCalls` 可以求和，但 `officialEdgeInvocations`、`officialEgressBytes`、`officialCost`、`measuredProviderRequestCount` 永遠標為未知 `null`，絕不把 AI 操作次數說成 Supabase 官方消耗。
- **使用前阻擋**：已新增候選本地 AI 操作次數上限檢查，但需有真實完整日誌與使用者設定的上限才能對**AI 自己的下一筆操作**實際判定。這不能阻止其他使用者、排程或第三方直接使用 Supabase。
- **舊 API 程式隔離**：`management-api-observer.mjs` 僅保留為不自動執行、非主流程的歷史研究候選。禁止以它為 AI 自記帳的依賴或部署前置條件；若要獨立交叉驗證須另行明確授權。
- **目前狀態**：只是 Draft PR 候選程式與作業規格；尚未串接正式 Side 每次操作自動寫入，也未把已上線 PR #82 網站換成自記帳資料來源；未合併、未部署，不能宣稱系統已自動記錄全站流量。
- **正式判定**：先驗證 AI 追加式登記、登入、跨對話接續、去重、同步、失敗補登與預檢，再評估網站顯示；不重新建立 Site、資料庫或另開正式服務。

## 目標與目前驗收狀態

- 目標：使用現有「立之雲端庫」Supabase 專案，逐筆記錄**已接入**的請求、每日彙總、展示風險；依額度在 Supabase **入口之前**保護非必要流量。
- **混合狀態（2026-11-16 即時核對）**：已在原 Supabase 專案正式建立 `lz_usage_events`、`lz_usage_daily` 與 `private_lz.usage_rollup()`，Migration `20261115182955` 完成，RLS/匿名拒絕與回滾測試 PASS。**前端 PR #82 已正式合併與發布；後端候選仍在 Draft PR #77**，尚未部署監控 Edge 或 Site、未串接既有 22 個 Edge，尚未取得官方帳務用量。
- 現有 Supabase 組織已讀取為 Free，僅用於初始參考額度；部署前仍須核對官方 Dashboard 中的實際方案、帳務週期與每個用量分類。
- GitHub Pages 服務的是靜態程式碼（公開可讀）；登入之後的監控資料由後端 OWNER UID 強制驗證，只有本人可取得。這**不是**把完整網站檔案隱藏起來的 Private Site；如需網站本身 Private，須另使用受本人驗證的私人 Site。

## 檔案與路徑

- `usage-monitor/index.html`、`monitor.js`、`monitor.css`：獨立響應式管理頁。只有在後端確實存在且本人驗證通過後，才會顯示真實已記錄的監測數字；不製造假的用量。
- `supabase/functions/lizhi-usage-monitor/index.ts`：本人唯讀 `GET /snapshot?month=YYYY-MM` 與 `POST /mcp`，六個 MCP 工具皆為唯讀；不暴露 service role key。
- `usage-monitor/schema.draft.sql`：保留隔離測試用草案；正式 SQL 經已批准的 Supabase Migration 工具部署，版本 `20261115182955`，且已存到 `supabase/migrations/20261115182955_lizhi_usage_monitor_tables_and_rollup_20261116.sql`。不要再次執行草案。
- `supabase/functions/_shared/lizhi-usage-meter.ts`：在**既有 Edge 的同一次呼叫**中記錄一次 PostgREST INSERT；不能直接保證量測完整，且每次會增加 DB 寫入、傳輸及延遲。
- `usage-monitor/budget-policy.mjs`：在 Supabase **外部閘道**使用的純計算策略，官方數字缺失／超過 60 分鐘時對非必要流量 fail-closed；尚未接入正式入口，也沒有分散式原子預留。
- `usage-monitor/monitor-core.mjs`、`official-usage-contract.mjs`：區分觀測值／官方帳務、核對月份與帳單週期、處理過期快照及未知數據。
- `supabase/functions/_shared/lizhi-usage-payload.mjs`：去識別化事件 payload，加入隨機 request_id 與敏感路由輸入限制。
- 既有四組純模組 48 項，加上新 MCP core 21 項、Site bridge 授權 10 項及 Site relay 11 項，候選共 **90/90 Node 測試 PASS**；隔離 PostgreSQL 17 驗證 RLS/grants／原子 rollup／重送去重／NULL／路由限制 PASS，Deno Edge TypeScript check PASS（GitHub Actions run #43731246780）。這仍**不是正式 Edge、Site 或全站實機驗收**。

## MCP 接私人 Site 前的交付（Draft PR #77）

- `supabase/functions/_shared/lizhi-usage-mcp-core.mjs`：無狀態 JSON-RPC、六個唯讀工具 `usage_status`／`usage_summary`／`usage_services`／`usage_events`／`usage_alerts`／`usage_policy`。
- `supabase/functions/_shared/lizhi-usage-mcp-bridge-auth.mjs`：未來只讓已驗證私人 Site 持有的密鑰加本人 actor 登入；也支援直接的 Supabase Auth 本人 JWT。
- `usage-monitor/site-bridge-relay.mjs`：尚未發布的原 Site 導入候選；固定上游、只有 usage_* 六工具、本人身份與 Secret 檢查。
- `sites-migration/usage-monitor/SITE_HANDOFF.md`：等正式審查與本人批准後才更動原私人 Site，必須保留全部既有工具與 Secrets。
- `usage-monitor/MCP_OPERATIONS.md`：操作手冊、錯誤碼、權限範圍與回退規則。
- `usage-monitor/sql-regression.sql`／`.github/workflows/usage-monitor-qa.yml`：完整候選自動測試，不觸及正式 Supabase 資料。

## 階段報告與進度（2026-11-15）

- P0 盤點：已完成唯讀盤點，部分大型匯出 Edge 內容／真實官方帳務仍 NOT_TESTED。[P0 Drive 報告](https://docs.google.com/document/d/1Y5aJcPZMoY20GlIln5QPFTVn10IAa7CEc5I12k8x9kw/edit)
- P1 儀表板：候選修正／12 個純模組測試 PASS；真正登入及手機實機 NOT_TESTED。[P1 Drive 報告](https://docs.google.com/document/d/19qkEE8C_rxuufR_mTe66nzAiweLAlkFXC6LOLbwwg2c/edit)
- P2 逐筆／彙總：候選 schema、資料最小化與去重；12 個 payload 測試 PASS；SQL/交易/自耗量 NOT_TESTED。[P2 Drive 報告](https://docs.google.com/document/d/1GvBQWyq_HLGzE_E51-YyLjt142D3apnv81AHfJQSP7M/edit)
- P3 官方對帳：官方 API 盤點與快照契約，12 個測試 PASS；真實官方帳務接線 NOT_TESTED。[P3 Drive 報告](https://docs.google.com/document/d/1n1VXduxyy9pH19rPPtw--jzhnthaL-5yUhJErH7wHa4/edit)
- P4 限流：只完成純政策候選／12 個測試 PASS；外部閘道、原子計數、繞過防護 NOT_TESTED。[P4 Drive 報告](https://docs.google.com/document/d/1N7xnTZHD-2d69BqNyO8eYzYRquiToYaxLbTVQ0p1GH4/edit)
- P5 全部 22 Edge 接線、P6 正式上線：**BLOCKED**。沒有使用者對正式部署及高風險路由變更的明確核定、資料庫／Edge 隔離驗收及外部閘道實測時，不得自行發布。

## 後端安全與部署前置作業

1. 先讀最新正式《AI 員工手冊》、路徑總索引、AI 工作台操作手冊與工作台目前任務；對齊既有生產維運。
2. **PASS 2026-11-16**：已完成加密完整備份、私人 Drive 保存、隔離 PostgreSQL 17 實際還原與全資料／物件比對；PR 仍 Draft，無 Site／Edge 發布。
3. **PASS 2026-11-16**：原 Supabase 專案 Migration `20261115182955` 已部署並驗證兩表 RLS、deny anon/authenticated、service_role 授權、Trigger 統計、去重及子交易回滾；無測試殘留資料。
4. 將 owner 的 **Supabase Auth User ID** 僅設在正式 Edge Secret `LIZHI_USAGE_OWNER_UID`，不提交到 GitHub；函式也依靠既有 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`。絕不可把 service_role 放前端。
5. 依序在隔離環境測試 401（匿名）、403（他人）、503（缺少 Secret 或 DB 不可用）、200（本人）、CORS、防洩漏、安全性及效能。
6. 人工批准後才部署第一階段的唯讀後端及登入頁。首頁不能把「已接入」的數據當作整個 Supabase 的官方使用量。
7. **按服務逐一導入**記錄器，不能直接同時改動全部正式 Edge。至少先測讀取、寫入、失敗、取消、HTTP 429、長請求和並發。
8. 建立每日彙總和不超過 72 小時的逐筆留存；先驗證彙總正確後才清理明細。設定 DB 容量保護，避免監控資料吃掉免費方案。
9. 從 Supabase 官方 Usage Dashboard / 可用的受支援 Management API 核對各項用量與延遲；同時記錄差異。未核實 API 能取得帳務數字前，`official_used` 必須保持 null。
10. 僅當正式入口已在**進 Supabase 之前**經過保護閘道，且經過直接繞過測試時，才允許宣稱可對該入口執行實際硬阻擋。

## 參考限額（Free，需以官方帳務週期為準）

| 項目 | 初始設定 |
| --- | --- |
| Edge Function Invocations | 500,000 次 |
| Uncached Egress | 5 GB／月，候選使用十進位 bytes（仍需依官方 Billing 校對） |
| Cached Egress | 5 GB／月，與一般 Egress 分開 |
| Database size | 500 MB／專案參考 |
| Storage size | 1 GB 參考 |
| Realtime messages | 2,000,000 則 |

> 重要：以上數字是尚未部署的參考設定。候選 UI 對一般 Egress 已採 1000 進位 GB，但須依官方 Usage 實際計量單位與帳單週期重驗。Data API 請求數通常沒有固定免費「次數上限」，但仍受平台速率／資源政策所限。

## 使用者看到的數字

- `已觀測`：有導入記錄器的 Edge 請求，非全站呼叫數。
- `response_bytes_known`：只有回應存在可用 `Content-Length` 時才有計算；未知的數量用 `unknown_response_count` 另外累積。並非實際 Supabase Egress。
- `official_used`：現在全部 **null**；必須經官方 Usage reconciliation 才能改。官方 Management API 可提供某些專案 API count，不可自動視為完整組織級 Edge/Egress 計費數據。
- `日期`：候選版按 UTC 月份歸檔。正式版本需先核對帳單週期與用量重設邊界；不能假設每月 1 日零時清零。
- `逐筆`：有 72 小時保存限制的規劃，觸發早退/崩潰或未接入服務可能漏記，不能保證 100%。
- 監控網站自己打 `/snapshot` 也會消耗一次 Edge invocation，預設只在手動更新或切換月份時查一次，不自動秒級輪詢。

## 預設保護策略（真正執行之前仍須評估）

- 70% 警告，85% 背景請求限流，95% 非必要請求阻擋。
- 保留經過嚴格本人驗證的緊急登入、修復和救援通道；任何白名單不得可由匿名者自我宣告。
- `officialUsed` 不可得或官方快照超過 60 分鐘時，已記錄用量只能視為下限；候選政策對 background/optional 直接 fail closed，僅可信的 critical 救援入口可保留。這不保證 100% 不超額，而且未導入原子預留。
- Edge Function 內判斷 429 **已消耗 invocation**，不能代替前置閘道。Direct PostgREST、Realtime、Storage、未改入口和其他客戶端仍可繞過；需逐項切換成真正受保護的入口並驗證。
- 前置閘道需獨立的高可用執行環境和可靠計數器；不應再放一個 Supabase Edge 當前置閘道，以免反而增加用量。導入其他提供商或付費服務前必須取得使用者批准。

## 驗收清單

- [x] 正式加密資料庫備份／隔離還原 PASS，RLS / grants PASS，Edge owner HTTP 身分端對端另待驗證。
- [x] 純模組 Node 回歸：48/48 PASS（Git blob SHA 已核對；包含 P1/P2/P3/P4），但未通過 Edge/DB/實機。
- [ ] 前端手機／電腦版、登出失效、非本人、匿名及跨來源 PASS。
- [ ] 模擬事件的每日計數、重複事件、未知 response size、72h 清理 PASS。
- [ ] 監控本身的資料庫容量和 Edge 自耗量已測試並低於自訂上限。
- [ ] 每個已接入專案對帳、直接繞過、防繞過與限流實測 PASS。
- [ ] 正式使用者批准已取得（不可推定）。

## 來源

- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
- https://supabase.com/docs/guides/platform/cost-control
- https://supabase.com/docs/guides/observability/reports
- https://supabase.com/docs/reference/api/v1-get-project-usage-api-count
- https://supabase.com/docs/reference/api/v1-get-project-usage-request-count
- https://supabase.com/docs/guides/observability/metrics
- https://supabase.com/docs/guides/platform/personal-access-tokens
