# 立之雲端庫

個人知識與工作網站的公開前端版本。

目前規劃：

- GitHub Pages 發布網站前端
- Google 帳號登入
- Supabase 保存個人資料並跨裝置同步
- 影音檔案暫不納入第一版雲端同步

## Supabase 設定

瀏覽器端使用 `supabase-config.js` 的 Project URL 與 Publishable key。請勿放入
`service_role`、`secret` 或資料庫密碼。資料表遷移檔位於
`supabase/migrations/001_lizhi_web_records.sql`，只建立 `lizhi_web_*` 專用資料，
不修改其他資料表。

本機開發可使用 `啟動立之雲端庫.cmd` 啟動 `server.mjs`。
