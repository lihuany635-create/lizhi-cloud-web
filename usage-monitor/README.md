# 立之 Supabase 流量監控中心 — 候選版

## 目標與目前驗收狀態

- 目標：使用現有「立之雲端庫」Supabase 專案，逐筆記錄**已接入**的請求、每日彙總、展示風險；依額度在 Supabase **入口之前**保護非必要流量。
- **CANDIDATE ONLY**：所有檔案只在開發分支，沒有合併 main、沒有部署 Edge、沒有套用 SQL、沒有串接正式 22 個 Edge Functions、沒有查到真實帳務用量。
- 現有 Supabase 組織已讀取為 Free，僅用於初始參考額度；部署前仍須核對官方 Dashboard 中的實際方案、帳務週期與每個用量分類。
- GitHub Pages 服務的是靜態程式碼（公開可讀）；登入之後的監控資料由後端 OWNER UID 強制驗證，只有本人可取得。這**不是**把完整網站檔案隱藏起來的 Private Site；如需網站本身 Private，須另使用受本人驗證的私人 Site。

## 檔案與路徑

- `usage-monitor/index.html`、`monitor.js`、`monitor.css`：獨立響應式管理頁。只有在後端確實存在且本人驗證通過後，才會顯示真實已記錄的監測數字；不製造假的用量。
- `supabase/functions/lizhi-usage-monitor/index.ts`：本人唯讀 `GET /snapshot?month=YYYY-MM`。無寫入/刪除功能；不暴露 service role key。
- `usage-monitor/schema.draft.sql`：事件表、日統計及事件插入 trigger，草案**尚未套用**。合格的正式 migration 應由 Supabase CLI `supabase migration new` 建立並經過審核。
- `supabase/functions/_shared/lizhi-usage-meter.ts`：在**既有 Edge 的同一次呼叫**中記錄一次 PostgREST INSERT；不能直接保證量測完整，且每次會增加 DB 寫入、傳輸及延遲。
- `usage-monitor/budget-policy.mjs`：在 Supabase **外部閘道**使用的純計算策略與 `budget-policy.test.mjs` 單元測試。尚未接入任何正式入口，也不能在現階段保證防超額。

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
| Uncached Egress | 5 GiB 參考（平台標示 GB，使用前須核對十進位/二進位） |
| Cached Egress | 5 GiB 參考（同上） |
| Database size | 500 MiB 參考 |
| Storage size | 1 GiB 參考 |
| Realtime messages | 2,000,000 則 |

> 重要：以上數字是尚未部署的參考設定，且使用了程式的 1024 制近似值；正式保護閘道應改用官方一致的單位與即時讀回的帳務上限。Data API 請求數通常沒有固定免費「次數上限」，但仍受平台速率／資源政策所限。

## 使用者看到的數字

- `已觀測`：有導入記錄器的 Edge 請求，非全站呼叫數。
- `response_bytes_known`：只有回應存在可用 `Content-Length` 時才有計算；未知的數量用 `unknown_response_count` 另外累積。並非實際 Supabase Egress。
- `official_used`：現在全部 **null**；必須經官方 Usage reconciliation 才能改。
- `日期`：候選版按 UTC 月份歸檔。正式版本需先核對帳單週期與用量重設邊界；不能假設每月 1 日零時清零。
- `逐筆`：有 72 小時保存限制的規劃，觸發早退/崩潰或未接入服務可能漏記，不能保證 100%。
- 監控網站自己打 `/snapshot` 也會消耗一次 Edge invocation，預設只在手動更新或切換月份時查一次，不自動秒級輪詢。

## 預設保護策略（真正執行之前仍須評估）

- 70% 警告，85% 背景請求限流，95% 非必要請求阻擋。
- 保留經過嚴格本人驗證的緊急登入、修復和救援通道；任何白名單不得可由匿名者自我宣告。
- `officialUsed` 不可得時，已記錄用量只是下限。完全未知時，背景和非必要流量可採 fail closed；關鍵救援入口可保留，但這也意味不保證 100% 不超額。
- Edge Function 內判斷 429 **已消耗 invocation**，不能代替前置閘道。Direct PostgREST、Realtime、Storage、未改入口和其他客戶端仍可繞過；需逐項切換成真正受保護的入口並驗證。
- 前置閘道需獨立的高可用執行環境和可靠計數器；不應再放一個 Supabase Edge 當前置閘道，以免反而增加用量。導入其他提供商或付費服務前必須取得使用者批准。

## 驗收清單

- [ ] SQL 備份／還原 PASS，RLS / grants / owner 驗證 PASS。
- [ ] `node --test usage-monitor/budget-policy.test.mjs` PASS。
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
