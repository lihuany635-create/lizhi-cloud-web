# 立之 CAD × 一般 ChatGPT｜MCP 安全中繼交接（隔離候選版）

**狀態：尚未部署；未接入此 ChatGPT 對話。** 此分支基於 `feature/cad-command-port-v1`。它不是新增 CAD 運算伺服器，也不讓 AI 取得 Windows 路徑或原圖。CADCraft Rust/WASM 仍在瀏覽器內執行。

## 完成程式

- `cad/cad-host.js`：本機 AI 繪圖開關、白名單命令 `new/line/rectang/circle`、數值座標檢核、逾時／撤銷權限。與 Rust 引擎的同源 `postMessage` 互通。
- `cad/cad-remote-relay.js`：使用者先開本機 AI 權限後**再獨立按「連線 ChatGPT MCP」**；透過網站既有登入者 Supabase JWT，建立隨機 UUID session（每 10 秒心跳、約 2 秒輪詢、90 秒租約）；claim／執行／完成確認。手動斷線與頁面關閉即停，程序意外結束時租約自行到期。**不自動重新送出已領取的幾何指令**。
- `supabase/functions/lizhi-cad-mcp/index.ts`：以 Supabase Auth OAuth 2.1 與 `withSupabase({auth:'user'})` 驗證呼叫者；工具 `status`、`new_drawing`、`draw_rectangle`、`draw_line`、`draw_circle`、`get_command_result`。寫入工具只回傳 `queued:true` 與 `job_id`，不可據此宣稱畫圖完成。需要查到 `state:succeeded`。
- `cad/relay/schema-review.sql`：**評審用草稿，不是遷移、未在正式資料庫執行**；私有 schema 表啟用 RLS 並拒絕客戶端直連；公開 RPC 為限縮的 `SECURITY DEFINER`，檢查 `auth.uid()`、既有個人白名單 `lizhi_web_is_allowed()`、session 租約與使用者 ID；有限命令、速率與冪等 ID；claim 採 `FOR UPDATE SKIP LOCKED`。資料只存有限 JSON 幾何參數與結果，不存圖檔、路徑、截圖。
- `.github/workflows/cad-mcp-relay-staging.yml`：用真實 CADCraft WASM＋**模擬 Supabase RPC**做瀏覽器測試，不能取代實際 PostgreSQL、OAuth consent 或連通 ChatGPT 客戶端。

## 重要安全特性

1. 外部 ChatGPT 呼叫必須有 **OAuth 驗證的登入使用者**，不是 API key/anon 或沒有授權的 HTTP webhook。
2. 原圖檔案只存在使用者選取的本機路徑／瀏覽器儲存，MCP 不提供檔案下載、任意命令、腳本、AutoLISP、CAD 主機檔案系統或 Windows 路徑。
3. 網頁 AI 許可與遠端 MCP 租約是**兩道獨立開關**；使用者可立即按停止，租約在意外中斷後自動過期。
4. 同一請求 ID 只入列一次，不因網路逾時自行重建第二次畫圖命令；須先 `get_command_result` 查原工作。
5. 受理 `queued` 不等於已畫、`claimed` 不等於已存；同一工作有執行結果，存 DXF 仍依靠本機 CAD 內的動作及磁碟 SHA-256 驗證。

## 發布阻礙與接續順序

- **資料庫**：先以 Supabase CLI `supabase migration new lizhi_cad_mcp_relay` 正式生成 migration 檔，再把通過安全審查的 `schema-review.sql` 搬入；獨立 PostgreSQL/RLS 測試通過後才能套用正式專案。禁止 `db push` 重跑現有 001～006，也不得改 Finance/Engineering 表。
- **Edge Function**：在授權資料表啟用後，部署 `lizhi-cad-mcp`；`verify_jwt=false` 只容許 OAuth discovery，middleware 仍須驗證 Bearer JWT，並且必須實際跑 unauthenticated 401、跨帳號 403、同帳號工具清單／入列／撤權／超時。
- **網站**：測試實際 Chrome／Android 目錄授權以及目前 AI 開關後，才將本分支合併到已部署主站。站點關閉或裝置離線時，**無 CAD 引擎可接指令**；用戶先前要求不新增雲端繪圖主機，因此此限制為設計刻意保留。
- **ChatGPT App/MCP**：使用者需在 ChatGPT 的 Plugins / Apps 連接 OAuth MCP URL `https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-cad-mcp`（此網址目前**未部署，不能連**）；先讀取 `status` 確認登入與目前允許中的 CAD session，再畫圖並查原 job。是否可建立與呼叫 write 類工具取決於當下 ChatGPT 帳號／工作區授權，要以實際可見 MCP 清單為準，不能保證。

## 驗收狀態

| 範圍 | 狀態 |
|---|---|
| Rust 幾何指令 port 實際 Chromium 驗證 | PASS（GitHub Actions 40153194288） |
| AI 自動畫出的 DXF 800×900 座標驗證 | PASS（GitHub Actions 40153797800） |
| 本瀏覽器 Supabase RPC 模擬端到端 | CI 待確認 |
| 真實 PostgreSQL RLS／跨帳號測試 | 未執行 |
| Supabase 產品資料庫 schema/Edge deployment | 未執行 |
| ChatGPT 一般對話直接操作工具 | 未接通 |

**請勿將此分支、SQL 草稿或測試結果標為正式完成。**
