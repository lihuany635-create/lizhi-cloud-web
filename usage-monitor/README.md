# 立之 Supabase 流量監控中心 — 候選版

## 目標與目前驗收狀態

- 目標：使用現有「立之雲端庫」Supabase 專案，逐筆記錄**已接入**的請求、每日彙總、展示風險；依額度在 Supabase **入口之前**保護非必要流量。
- **CANDIDATE ONLY**：所有檔案只在開發分支，沒有合併 main、沒有部署 Edge、沒有套用 SQL、沒有串接正式 22 個 Edge Functions、沒有查到真實帳務用量。
- 現有 Supabase 組織已讀取為 Free，僅用於初始參考額度；部署前仍須核對官方 Dashboard 中的實際方案、帳務週期與每個用量分類。
- GitHub Pages 服務的是靜態程式碼（公開可讀）；登入之後的監控資料由後端 OWNER UID 強制驗證，只有本人可取得。這**不是**把完整網站檔案隱藏起來的 Private Site；如需網站本身 Private，須另使用受本人驗證的私人 Site。

## 檔案與路徑

- `usage-monitor/index.html`、`monitor.js`、`monitor.css`：獨立響應式管理頁。只有在後端確實存在且本人驗證通過後，才會顯示真實已記錄的監測數字；不製造假的用量。
- `supabase/functions/lizhi-usage-monitor/index.ts`：本人唯讀 `GET /snapshot?month=YYYY-MM` 與 `POST /mcp`，六個 MCP 工具皆為唯讀；不暴露 service role key。
- `usage-monitor/schema.draft.sql`：事件表、日統計及事件插入 trigger，草案**尚未套用**。合格的正式 migration 應由 Supabase CLI `supabase migration new` 建立並經過審核。
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
2. 建立備份、驗證還原；確認 GitHub PR 沒有觸發自動合併、main 發布或正式 Edge 操作。
3. 以 CLI 新建正式 migration，對草案做安全審查及 transaction/rollback 測試；確認每個 public 表 RLS 開啟，`anon`、`authenticated` 對兩表沒有授權。
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

- [ ] SQL 備份／還原 PASS，RLS / grants / owner 驗證 PASS。
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
