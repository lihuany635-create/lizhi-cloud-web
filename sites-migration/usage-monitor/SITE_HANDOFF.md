# 立之 Supabase 流量監控 MCP｜接 Site 前交接文件
日期：2026-11-15　狀態：GitHub 候選，未正式發布／未接入任何 Site

## 範圍與嚴格邊界
- 只更新原 GitHub 倉庫的 Draft PR #77；不得先改私人 Site、主站 main、22 個正式 Edge 或正式 Supabase schema。
- 正式站要沿用「AI 工作台」所在的原私人 Site，不建立新的 Site、不另行覆蓋原路由，不影響施工照片、aiwb、side、licut 等既有 MCP 工具。
- 本 MCP 僅 6 個唯讀工具，無任何可修改保護設定、寫資料表、刪事件或部署的工具。
- 接入前，先驗證本站原 Site 的最新工具數及現有 owner principal，不用歷史快照冒充即時證據。

## 已完成的候選檔案
- `supabase/functions/lizhi-usage-monitor/index.ts`：GET /snapshot 及 POST /mcp，同一 Edge；授權後才能讀資料。
- `supabase/functions/_shared/lizhi-usage-mcp-core.mjs`：Stateless JSON-RPC 2.0、tools/list、tools/call、initialize、ping、notifications/initialized。
- `supabase/functions/_shared/lizhi-usage-mcp-bridge-auth.mjs`：Server-to-server shared-secret + 經 Site 驗證的 principal 兩項都正確才允許。
- `usage-monitor/site-bridge-relay.mjs`：Site 側候選代理，主動限定 6 個 usage_* 工具、檢查 owner、20 秒 timeout、固定 Edge 上游 URL。
- `usage-monitor/schema.draft.sql`：初步事件表／日彙總；僅供隔離測試，正式 migration 要經 Supabase CLI 建立、獨立安全審核。
- `usage-monitor/sql-regression.sql`：隔離 Postgres 17 RLS/grants/trigger/replay/NULL/拒絕敏感 route 的測試。
- `.github/workflows/usage-monitor-qa.yml`：PR 候選 CI：Node tests、Postgres 17、Deno Edge check，不部署正式服務。

## 完整六項唯讀工具
1. `usage_status`：取得候選連線與涵蓋狀態；不宣稱 Site 已接上。
2. `usage_summary`：指定月已接入 Edge 的彙總、配額卡片，官方未取得時明確 null。
3. `usage_services`：指定月已接入服務的流量統計。
4. `usage_events`：指定月最近最多 100 筆最小化事件。
5. `usage_alerts`：官方帳務未驗或逾一小時，回 UNKNOWN，不可宣稱安全。
6. `usage_policy`：回傳 70%/85%/95% 候選政策及尚未強制執行的狀態。

## 接線前需核實的 Secrets（**只列名稱，不填值**）
Edge 內部原有：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`。
Edge 新增：`LIZHI_USAGE_OWNER_UID`（Supabase Auth 本人 UID），`LIZHI_USAGE_MCP_BRIDGE_KEY`（長度 >=32 的機密隨機值），`LIZHI_USAGE_MCP_ALLOWED_ACTOR`（既有 Site identity(req,'ai').id）。
原 Site 新增僅 `LIZHI_USAGE_MCP_BRIDGE_KEY`，需與 Edge 端完全一致；不修改現有 `PRODUCTION_BRIDGE_KEY`。
若任一 Secret 未準備妥當，應在外部 Edge 上回 503／403，不能回匿名開放內容。
注意：`x-lizhi-usage-actor` 本身不是本人證明；必須由 Site 使用自身的 `identity(req,'ai')` 驗證後產出，而且 Edge 同時驗證橋接密鑰和允許的 actor。

## 待本人核定後的正式執行順序
1. 取得完整隔離 PG/RLS／端對端 Auth/Edge/CORS/回退證據，對任何 FAIL/NOT_TESTED 修正後才能下一步。
2. Supabase CLI 產生可追溯 migration，先確認備份與還原演練，再批准正式 apply migration。
3. 以只含本人唯讀 GET /snapshot 與 POST /mcp 的正式 `lizhi-usage-monitor` Edge 發布，應配置 `verify_jwt=false` **僅在應用程式層的本人 JWT 或可信 Site 雙重秘密驗證確實經隔離驗收後**。未完成不能開放正式入口。
4. 首先直接用完整授權環境測 Edge 的 MCP initialize、tools/list、六工具呼叫、非本人、匿名、無效轉接密鑰及 CORS。不把 6 工具被列出當成真實官方帳務已接通。
5. 核對原私人 Site 在該次時間點的所有工具名稱，改原路由的 `tools/list` 為既有清單與新增 6 項的聯集，禁止刪掉任何既有工具。
6. 只將 `usage_*` 的 `tools/call` 送到使用 `site-bridge-relay.mjs` 的固定上游，其他工具完全保持原本路由；Site 需先比對 `identity(req,'ai').id === PRODUCTION_CHATGPT_OWNER`，對全部 usage 呼叫做驗證。
7. 在原 Site 發布後，本人在一般 ChatGPT 對話呼叫 `usage_status`、`usage_summary` 並檢查只讀資料；同時抽驗原所有 aiwb、side、licut 及施工照片工具都未消失。
8. 若失敗，回退既有 Site 舊路由與 Edge 舊發布版本，不動既有業務資料，不開放其他使用者。

## MCP 傳輸契約
- 上游：`https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-usage-monitor/mcp`
- 方法：POST；JSON-RPC 2.0；Content-Type: application/json；Accept: application/json, text/event-stream
- 已實作 methods：initialize、ping、tools/list、tools/call、notifications/initialized。
- Site 端 HTTP header：`x-lizhi-usage-bridge`=私密 bridge secret，`x-lizhi-usage-actor`=已驗證的本人 principal。
- 如用直接 Supabase Auth Bearer JWT 存取，Edge 將再向 Supabase auth/v1/user 查 UID，必須匹配 `LIZHI_USAGE_OWNER_UID`。
- 不接受內容本文中的 actor、owner ID 或前端自稱 critical，不能用官方不明用量推算精確餘額。

## 接 Site 的硬性驗收阻擋條件
- 正式 DB 尚未套用／驗證 → STOP。
- 本人 Auth 或 Site bridge 無效 → STOP。
- MCP 非本人可讀／service role 或 PAT 暴露到網頁 → STOP。
- Node、Postgres、Deno/Edge CI 未全部 PASS → STOP。
- 原 Site 任何舊工具遺失／實際資料遭改寫 → STOP。
- 正式部署、付費服務及修改既有路由未獲本人批准 → STOP。

## 目前已知限制
- 即使這 6 個 MCP 上線，仍不等於已經在全部 Supabase 流量前安裝閘道。
- 逐筆事件只包含已接入服務，並有監控自耗；官方帳務同步尚未完成，`official_used` 目前為 null。
- 帳務週期不一定是日曆月；快照 UTC 月份僅為觀測彙總。
- GitHub 候選 URL：https://github.com/lihuany635-create/lizhi-cloud-web/pull/77
- Google Drive 階段報告：https://drive.google.com/drive/folders/1eRbwHussumM9TJU51ztxjkgKjPLCC-K6
