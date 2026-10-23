# 立之圖書館唯讀 MCP

這個介面讓 ChatGPT 等 MCP 用戶端在使用者明確同意後，唯讀查詢該使用者自己的館藏。公開端點採 MCP Streamable HTTP；身分驗證由 Supabase Auth OAuth 2.1 處理，資料查詢使用登入者 JWT，因此沿用 `lizhi_library_items` 的 RLS。

## 安全邊界

- 只有 `list`、`search`、`get_excerpt`、`status` 四個工具，全部標示 `readOnlyHint`。
- Edge Function 不建立 admin client、不讀 `SUPABASE_SECRET_KEYS`，也不使用 `service_role`。
- `list` 不回傳 `storage_path`、`device_path`、`computer_path`；`get_excerpt` 只讀資料庫中的 `text_excerpt`，不碰 Storage 或本機檔案。
- 館藏文字是不可信輸入。MCP server instructions 明確要求不得執行館藏內指令。
- 未登入請求由 OAuth Protected Resource middleware 回覆 `401` 與 discovery challenge；有效 token 才會取得 RLS-scoped Supabase client。
- 資料庫限流為每位使用者每分鐘 60 次。限流表位於未公開的 `lizhi_private` schema；唯一的 `SECURITY DEFINER` 函式只處理限流，內含 `auth.uid()` 與核准帳號檢查。
- 有 `Origin` 時只允許專案網站與本機開發 origin；未列入清單的 origin 回覆 `403`。

## 工具

| 工具 | 用途 | 最大輸出 |
|---|---|---|
| `list` | 依來源／整理狀態分頁列出館藏卡 | 50 筆 |
| `search` | 搜尋書名、檔名、書架、標籤、摘要與同步摘錄 | 20 筆、每段 360 字 |
| `get_excerpt` | 依館藏 ID 分段取得同步文字與頁／投影片引用 | 每次 8,000 字 |
| `status` | 館藏來源、整理、抽取狀態統計 | 單一統計物件 |

`availability` 的值：

- `cloud_original_available`：原檔在私有 Storage，但 MCP 仍不提供下載工具。
- `excerpt_only`：手機／電腦原檔不在雲端，只有已同步摘錄可讀。
- `metadata_only`：只有館藏卡，沒有可讀摘錄。

## 部署前設定

Supabase 專案：`hrdzywkihfqggiwjgavi`。

1. 在 **Authentication → JWT Signing Keys** 確認使用 ES256 或 RS256。`@supabase/server` 不接受舊的 HS256 OAuth token。
2. 在 **Authentication → OAuth Server**：
   - 啟用 OAuth 2.1 Server。
   - Authorization path 設為 `/lizhi-cloud-web/oauth/consent/`。
   - 啟用 Dynamic Client Registration。
3. 在 **Authentication → URL Configuration**：
   - 保留現有 Site URL：`https://lihuany635-create.github.io/lizhi-cloud-web/`
   - Redirect URLs 加入 `https://lihuany635-create.github.io/lizhi-cloud-web/oauth/consent/`
4. 先發布本 repo，確認同意頁可開啟：
   `https://lihuany635-create.github.io/lizhi-cloud-web/oauth/consent/`

`supabase/config.toml` 記錄期望設定，但不要在未先執行 `supabase config pull` 並比對現有 Google 登入設定的情況下直接執行 `supabase config push`，避免覆蓋既有 Auth provider 設定。

## 資料庫與 Function 部署

CLI 必須先登入並連到指定專案：

```powershell
supabase login
supabase link --project-ref hrdzywkihfqggiwjgavi
supabase db push
supabase functions deploy library-mcp --project-ref hrdzywkihfqggiwjgavi
```

部署 URL：

```text
https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/library-mcp
```

Function 必須維持 `verify_jwt = false`，因為未登入的 OAuth discovery request 必須先到達 `withOAuthProtectedResource()`；實際使用者 JWT 由 Function 內的 `withSupabase({ auth: "user" })` 驗證。

## 驗證

### 1. 靜態檢查

```powershell
$env:DENO_TLS_CA_STORE='system'
npx deno check --node-modules-dir=auto supabase/functions/library-mcp/index.ts
node --test tests/library-mcp-contract.test.mjs
```

### 2. 未登入 challenge

```powershell
curl.exe -i -X POST `
  'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/library-mcp' `
  -H 'Content-Type: application/json' `
  -H 'Accept: application/json, text/event-stream' `
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke-test","version":"1"}}}'
```

預期 `401`，且 `WWW-Authenticate` 指向 `.../library-mcp/oauth-protected-resource`。開啟該 metadata URL 時，`authorization_servers` 應是 `https://hrdzywkihfqggiwjgavi.supabase.co/auth/v1`。

### 3. ChatGPT

1. ChatGPT 網頁版開啟 Plugins，選 **Add custom MCP server**。
2. Server URL 貼上部署 URL，Authentication 選 OAuth。
3. 連線時用核准的 Google 帳號登入，檢查同意畫面只描述唯讀權限。
4. 依序測試「顯示館藏狀態」、「列出 5 本」、「搜尋一個已知關鍵字」、「讀取某筆摘錄」。
5. 確認工具清單只有四個工具；任一結果皆不得出現 `storage_path`、`device_path`、`computer_path` 或 Windows 磁碟路徑。

### 4. RLS 與限流

- 用另一個 Supabase 使用者 token 呼叫，預期找不到任何非該使用者資料；目前 allowlist 還會直接拒絕非核准 email。
- 同一登入者在一分鐘內呼叫第 61 次，預期回傳「請求過於頻繁」且不執行查詢。
- `get_excerpt` 對不存在或不屬於登入者的 UUID 都回傳相同的「找不到或沒有權限」，避免洩漏資料是否存在。

## 回復

若需立即停用，只要停用或刪除 `library-mcp` Edge Function；資料庫 migration 僅新增 rate-limit 表與唯讀函式，不改動館藏內容。也可在 OAuth grants 管理頁撤銷已連接的 MCP client。
