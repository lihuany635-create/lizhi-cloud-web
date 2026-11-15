# 立之 Supabase 流量監控 MCP｜操作手冊（待正式發布）

版本 v0.2.0，2026-11-15。使用者網頁、MCP 與前置限流閘道是三個**不同的層次**。本手冊的程式只在 Draft PR #77；尚無正式 MCP 可供 ChatGPT 呼叫。

## 1. 用途
- 透過既有私人 Site 的本人驗證，讓 ChatGPT 查詢流量監控。
- **不**允許直接修改政策、刪除事件、變更 Supabase、部署任何服務。
- 官方帳務資料未完成同步前，必須用「觀測下限／未知」說明，不能宣稱準確剩餘流量或阻擋成功。

## 2. 六項 MCP 工具

| 工具 | 參數 | 用途 | 注意事項 |
| --- | --- | --- | --- |
| `usage_status` | 無 | 監控/正式部署狀態 | 程式候選不等於正式上線 |
| `usage_summary` | 可選 `month=YYYY-MM` | 觀測次數、Bytes、配額卡 | `official_used=null` 表示未知 |
| `usage_services` | 可選 `month` | 已接入服務統計 | 未接入服務不包含 |
| `usage_events` | 可選 `month`,`limit=1..100` | 最多 100 筆事件 | 不儲存授權標頭或正文 |
| `usage_alerts` | 可選 `month` | 顯示額度警訊 | 無來源與採樣時間則 UNKNOWN |
| `usage_policy` | 無 | 檢視候選限流規則 | 不提供任何寫入設定功能 |

`month` 沒填時採 Asia/Taipei 當月，但觀測資料在 PostgreSQL 仍依 UTC 日期彙總，**不能**當作 Supabase 真實計費週期。

## 3. 授權鏈與端點
- UI `GET /snapshot?month=YYYY-MM`：Supabase Auth JWT → Edge 向 auth/v1/user 確認 UID = `LIZHI_USAGE_OWNER_UID` → Service role 僅在 Edge 讀資料庫。
- MCP `POST /mcp`：使用 JWT 同上；或可信的私人 Site 完成 `identity(req,'ai')` 身分驗證，再以專用 Shared Secret + `x-lizhi-usage-actor` 做伺服器端代理。必須**兩者都相符**。
- 任何匿名者、未授權 ID、錯誤 bridge Secret、錯誤月份、過大 JSON、不能接受 JSON 的 client，都不應取得私人監控資料。
- 伺服器不暴露 Supabase service role、PAT、Site Bridge Secret；絕不把它們寫到 GitHub／前端／文件中。

## 4. 狀態碼
- `401`：欠缺或失效的 Supabase JWT。
- `403`：跨帳號，或 bridge key / actor 不匹配。
- `400`：JSON 解析/月份格式錯誤。
- `405`：不是唯讀 GET /snapshot 或 MCP POST。
- `406` / `415`：MCP Accept / Content-Type 不符。
- `413`：MCP 請求本文超過 32 KB。
- `503`：尚未設定 Secret、正式 DB 尚未套用、或 Supabase 後端不可用。
- Tool `isError:true`：MCP 工具無法可靠讀取資料；**不能**把結果改為 0 來顯示正常。

## 5. 開發驗證
```sh
node --test usage-monitor/*.test.mjs supabase/functions/_shared/lizhi-usage-payload.test.mjs
deno check supabase/functions/lizhi-usage-monitor/index.ts
```
隔離 PostgreSQL 17 需先建立模擬 `service_role`／`anon`／`authenticated` 角色，然後執行：
```sh
psql -v ON_ERROR_STOP=1 -f usage-monitor/schema.draft.sql
psql -v ON_ERROR_STOP=1 -f usage-monitor/sql-regression.sql
```
推薦直接看 `.github/workflows/usage-monitor-qa.yml` 的 CI logs，不得只看「等待執行」就宣稱 PASS。

## 6. Site 交接
詳細操作依 `sites-migration/usage-monitor/SITE_HANDOFF.md`。原私人 Site 的全部既有工具、Secrets、權限、網址、MCP 路由必須保留。新增六工具時需對原清單做聯集，不可複製舊清單硬編碼後漏工具。

## 7. 故障與回退
- 對帳用量缺失：全部官方值為 null，告警 UNKNOWN；不回傳自信剩餘值。
- MCP 未連接：先查 Edge 是否已部署及 401/403/503，再查原 Site 是否已實際加入六工具，不要任意開新 Site。
- RLS 或事件表錯誤：停止正式部署，保留原業務表，使用隔離資料庫修正再測。
- 任何原 Site 工具缺失：立刻退回原 Site 版本，不刪舊 MCP。
- 正式切換需先完成備份/還原與本人批准；目前尚未取得。

## 8. 尚待正式驗收
- 原 Site 本人身分、多帳號/退出授權回歸、CORS 及端對端實機。
- 正式 DB migration、正式 Secret、Edge 發布、監控 DB 容量／延遲。
- 與 Supabase 官方 Usage 對帳；外部閘道與原子預算預留。
- 所有現有工作台、手機、CAD、理財、圖書館、LINE、模型工具回歸。

原始碼與證據：
- PR：https://github.com/lihuany635-create/lizhi-cloud-web/pull/77
- Drive：https://drive.google.com/drive/folders/1eRbwHussumM9TJU51ztxjkgKjPLCC-K6
