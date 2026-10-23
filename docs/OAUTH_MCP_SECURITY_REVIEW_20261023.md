# OAuth MCP 整合前的正式資料庫權限審核（2026-10-23）

狀態：**僅調查與草案，沒有變更任何現有 RLS 政策**。

## 已通過，不需再測試的工作

私人 Galaxy A22 5G → Supabase Edge Function → MCP 的 `initialize`、`tools/list`、`phone_status` 由使用者在 PowerShell 回報通過，`active=True`、`touchAllowed=False`。服務僅有三個唯讀工具；手機端仍需本人啟動工作階段。

## 為什麼不能立即開啟 Supabase OAuth Server？

實際檢視正式 Supabase 的 `pg_policies` 及 GRANT 後，發現下列**12 張資料表**已有 `authenticated` 存取權，且政策主要以 `auth.uid()` 判斷使用者，未檢查第三方 OAuth token 的 `client_id`：

1. `lizhi_ai_runs`
2. `lizhi_finance_ai_hosts`
3. `lizhi_finance_ai_jobs`
4. `lizhi_finance_records`
5. `lizhi_finance_rule_memories`
6. `lizhi_library_items`
7. `lizhi_licut_commands`
8. `lizhi_licut_projects`
9. `lizhi_licut_thumbs`
10. `lizhi_production_state`
11. `lizhi_web_chat_messages`
12. `lizhi_web_records`

注意：一旦經 Supabase OAuth Server 授權第三方用戶端，此用戶端拿到的 JWT 仍可攜帶同一使用者的 `sub`、`auth.uid()`，且往往包含 `client_id`。如果其取得直接使用資料 API 的憑證，可能也能在原本 RLS 下存取其他私人資料。**OAuth 的 `openid`、`email` 等 scope 只控制 OIDC 身分資料，不是 Postgres 資料權限。**

另外，`public.lizhi_web_send_message`、`public.lizhi_library_mcp_take_rate_limit` 是目前 `authenticated` 可呼叫的 `SECURITY DEFINER` RPC，雖然有 `lizhi_web_is_allowed()` 檢查，但該函式尚未區分第三方 OAuth client。

## 防護方案（草案；不得自動套用）

[參考 SQL 草案](security/oauth_rls_draft_REVIEW_ONLY.sql)：

1. 在上述 12 張表加上 **RESTRICTIVE** RLS `deny_third_party_oauth_client`；當 JWT 存在 `client_id` 時拒絕所有讀寫，保留一般網站直接登入。
2. 將 `lizhi_web_is_allowed()` 的必要條件增加 `auth.jwt()->>'client_id' IS NULL`，阻止 OAuth 用戶端透過既有 Security Definer RPC 寫入聊天室等資料。
3. 已無 `authenticated` 權限或沒有其 RLS 政策的 LINE/Mobile Agent/AI Keys 表格不需賦予新的權限。
4. 先確認目前既有整合是否已有真正使用 Supabase OAuth 2.1 Server 的客戶端。這份修改**可能阻止它們**，不可跳過影響分析。
5. 先備份及檢查正式政策，於獨立交易測試後，**需要擁有者另行明確允許**才可操作正式資料庫。

不能只在 MCP Edge Function 檢查使用者：相同 OAuth JWT 仍可能直接傳給 Supabase REST API。必須確保所有既有資料表同時隔離，或改用專門的獨立 OAuth 授權專案。

## 後續 OAuth 建置順序

1. 確認以上資料權限不會讓 OAuth token 操作既有資料表，並完成回歸。
2. 依 Supabase 官方 OAuth 2.1 Server 文件建立 GitHub Pages 的獨立授權頁，顯示授權者、用戶端、redirect URI、scope，必須明確允許／拒絕。
3. Supabase Authentication → OAuth Server 才能安全地開啟；先關閉動態客戶端註冊，直到信任名單與使用者審核就緒。
4. 在**獨立的** OAuth MCP Edge Function 中驗證 issuer、signature、exp、`client_id`、使用者及 resource/audience；回傳 MCP resource metadata / 401 challenge。保留既有 Bearer MCP，不修改已通過的測試端點。
5. 確認 ChatGPT 的實際 callback URL 與 OAuth client 註冊方式，才連接私人 plugin；不在 GitHub 或對話中暴露任何金鑰。

參考官方規範：
- https://supabase.com/docs/guides/auth/oauth-server/token-security
- https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- https://developers.openai.com/plugins/build/auth

## 驗收門檻

- OAuth 新 token 不能用來讀取/寫入既有理財、圖書館、LINE、動畫與聊天資料表或寫入 SECURITY DEFINER RPC。
- 正常登入者之原本功能無退化。
- MCP 未授權 401、有授權僅三項唯讀工具；不存在任何直接遠端點擊工具。
- 手機紅色停止、螢幕鎖定、30 分鐘到期立即使手機操作無效。
