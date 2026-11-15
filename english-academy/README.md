# 立之英文學習教室｜P1 隔離交付說明

> **未正式部署；禁止直接合併 main、執行正式資料庫 migration 或套用服務金鑰。**
> 本目錄屬 Draft PR #60 的候選成果，使用者必須另外批准正式部署與正式資料庫變更。

## P1 構成

- `preview/`：不連接真實帳號的純展示候選網站，適合手機介面與流程驗收
- `live/`：依賴主站已登入 Supabase Session 的正式資料候選頁；**未部署後端前會拒絕載入，不會使用假資料**
- `api/p1-handler.mjs`：以 Supabase Auth `/auth/v1/user` 驗證 JWT，檢查 Google 身分及伺服器白名單，再使用保管於後端的服務金鑰查詢／寫入本人資料
- `schema/20261115_p1_candidate.sql`：**未套用**的 PostgreSQL 17／Supabase RLS schema 草案及原子化候選卡核准 RPC
- `tests/`：權限、候選去重、帳號隔離、RLS、手機／桌面操作等自動化測試
- `../supabase/functions/lizhi-english-academy/index.ts`：未部署的 Deno Edge 入口

## 本地操作（只用展示資料）

於倉庫根目錄執行：

```bash
python -m http.server 5173
```

瀏覽器開啟 `http://localhost:5173/english-academy/preview/`。

`/english-academy/live/` 無主站 Session 時應顯示授權失敗。**這是預期的安全行為**，不能透過假 Session 繞過後端進行正式使用。

## 隔離 CI 測試

工作流程：`.github/workflows/english-academy-ci.yml`，只由 PR 事件觸發，沒有 Pages 或 Supabase 部署步驟。

1. Node 單元／契約測試：候選、授權、路由、API
2. Playwright Chromium 手機 360px／桌面 1280px：Demo、模擬登入 host iframe、拒絕無登入
3. 一次性 PostgreSQL 17 服務：驗證 migration、RLS、匿名禁止存取、跨使用者隔離、原子化核准 RPC、事件留痕
4. Deno 編譯檢查：驗證 Edge 候選入口（若環境允許）

CI pass 只代表所述測試通過。**真實 Google OAuth、正式 Supabase RLS、ChatGPT MCP、Android 實機仍需後續驗證。**

## 正式開通前必要關卡（不得自動執行）

1. 取得本人對正式資料庫 migration／Edge 部署／GitHub main 合併的分別明確批准。
2. 在隔離環境完成 SQL 安全審查和備份／還原演練；新表及政策需逐項核對。
3. 將本人 Google OAuth 經驗證的 Supabase `auth.users.id` 經安全的管理操作加入 `english_authorized_users`；**不得把帳號、JWT 或服務金鑰寫到公有 GitHub**。
4. Edge 需在 Supabase 受控環境使用 `SUPABASE_SERVICE_ROLE_KEY`（僅後端）及 `SUPABASE_ANON_KEY`。前端只能傳自己的登入 token；來源網域嚴格限制為主站。
5. 在正式帳號及獨立測試帳號實測正面／負面授權：本人能讀寫本人資料；未核准帳號與跨 owner 操作一律拒絕。
6. 手機 A22 真實裝置測試：Google 登入、候選卡審核、手動新增、發音、螢幕安全範圍與橫向溢出。
7. 全部通過並保留 Google Drive 階段報告後，才能視情況核准 P1 階段驗收。P2 FSRS 不得使用尚未經安全核准的正式 API。

## 失敗回復

若未部署，直接停留在 Draft PR 即可，不影響正式站。若未來經本人核准部署後發現安全問題，應先停用正式英文入口與 Edge 連線、保留證據並通知本人；刪除或重建私人正式資料另行批准，不能將 `DROP TABLE` 當作預設回退動作。

Google Drive 階段報告：
https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
