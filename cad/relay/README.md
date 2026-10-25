# 立之 CAD × 一般 ChatGPT｜MCP 安全中繼交接（隔離候選版）

**狀態（2026-10-25）：Supabase 指令中繼已上線；正式網站本分支尚未發布；ChatGPT 私人 Plugin 已建立但尚未完成 OAuth 連線。** 此分支基於 `feature/cad-command-port-v1`。它不是新增 CAD 運算伺服器，也不讓 AI 取得 Windows 路徑或原圖。CADCraft Rust/WASM 仍在瀏覽器內執行。

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

## 部署結果與剩餘連線障礙

- **已套用正式 Supabase migration**：版本 `20261025023119`，名稱 `lizhi_cad_mcp_secure_relay_v1`。GitHub 原始碼為 `supabase/migrations/20261025023119_lizhi_cad_mcp_secure_relay_v1.sql`。只新增 `lizhi_private.lizhi_cad_sessions` 與 `lizhi_private.lizhi_cad_commands` 和 8 個 CAD 專用 RPC；未更動 Finance/Engineering 等舊資料表。
- **已部署**：`lizhi-cad-mcp` Edge Function v1 ACTIVE、`verify_jwt=false` 僅為 OAuth discovery，`withSupabase({auth:'user'})` 必須驗證 Bearer；未授權 `tools/list` 實際 **HTTP 401**，OAuth protected resource **HTTP 200**，證據 GitHub Actions 40154885550。
- **隔離測試通過**：PostgreSQL16 RLS、owner isolation、重複命令、撤權與 Deno 型別 GitHub Actions 40154623586；真 Chromium CAD WASM＋模擬 OAuth RPC 40155024156；完整 Finance／Engineering／Library 對比 40155042637；原生 CAD command DXF 800x900 尺寸 40153797800。
- **私人 ChatGPT Plugin 已建立**：`https://chatgpt.com/plugins/plugins_6add6b97056481918c458b7898fcc9c5`（需要使用者明確安裝／OAuth 連線）。不會自動替使用者同意 OAuth。
- **現有阻礙**：正式 Supabase Auth OAuth 2.1 discovery 尚未提供 `registration_endpoint`（[40155305041](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40155305041) FAIL，非假測試）。私人 Plugin 使用 `client.mode=dcr`，必須由有權限的人在 **Supabase Dashboard → Authentication → OAuth Server → Enable dynamic client registration** 開啟。GitHub `supabase/config.toml` 已設定本機 `allow_dynamic_registration=true`，**不代表遠端正式設定也生效**。
- **尚待驗收**：正式立之雲端庫網頁發布本分支與真 Windows/Android File System Access picker，OAuth 有效使用者從 ChatGPT 授權後 `status` → `draw_rectangle` → `get_command_result` E2E。使用者的 CAD 分頁必須開啟並手動按兩個允許按鈕；頁面關閉或設備離線時沒有 CAD 運算主機。

**絕不可因 Database／Edge／Plugin 都存在，就宣稱一般 ChatGPT 對話已經能操作 CAD。工具必須在新對話中真正載入且以有效 OAuth token 端到端驗收才算 PASS。**

## 驗收狀態

| 範圍 | 狀態 |
|---|---|
| Rust 幾何指令 port 實際 Chromium 驗證 | PASS（GitHub Actions 40153194288） |
| AI 自動畫出的 DXF 800×900 座標驗證 | PASS（GitHub Actions 40153797800） |
| 本瀏覽器 Supabase RPC 模擬端到端 | CI 待確認 |
| 真實 PostgreSQL RLS／跨帳號測試 | 未執行 |
| Supabase 產品資料庫 schema/Edge deployment | 已上線，schema 與 Edge v1 驗證存在 |
| ChatGPT 一般對話直接操作工具 | 私人 Plugin 已建立，OAuth DCR 設定尚未完成，未接通 |

**請勿將此分支、SQL 草稿或測試結果標為正式完成。**
