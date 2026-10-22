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

## 圖書館

上傳檔案並由 Claude 整理上架，說明與 Claude 的整理步驟見 [`library/README.md`](library/README.md)。
資料表遷移檔：`supabase/migrations/008_lizhi_library.sql`。

本機開發可使用 `啟動立之雲端庫.cmd` 啟動 `server.mjs`。

家中電腦要提供 Finance AI 時，可直接點兩下專案根目錄的 `啟動理財AI.cmd`。啟動檔會依序確認 Ollama、啟動僅綁定 `127.0.0.1:4181` 的 Finance AI Gateway、執行健康檢查，並開啟家中 AI Host 頁面；完成後會以 Windows 對話框明確顯示「已連線」或錯誤原因。

## 動畫與模型流程入口

主站 `?open=animationflow` 提供製作工作台與 3D 模型流程入口，工作台以同分頁開啟並使用 ChatGPT 登入。請勿將私有工作台放在 iframe 中，以免瀏覽器阻擋登入；模型入口使用 `?view=models`，登入後保留目的頁。工作台左上角可返回主站流程入口。
