# 立之英文學習教室｜P1 隔離展示候選版

> **尚未正式部署。** 僅供 UI 與互動流程測試。沒有 Google OAuth、Supabase 寫入、FSRS 排程或 ChatGPT MCP；全部都是模擬資料，重新整理會重置。

## 本地執行

請先取得本分支程式碼，再於專案根目錄執行：

```bash
cd english-academy/preview
python -m http.server 5173
```

瀏覽器開啟 http://localhost:5173/ 。瀏覽器 ES modules 不建議以 file:// 方式直接開啟。

## 目前可操作

- 首頁一鍵開始練習、候選卡審核
- 正式展示卡片新增、搜尋（輸入完成後更新）、基本去重
- 翻卡、選擇題、拼字、聽力瀏覽器語音、造句自評
- 課程階段地圖與示範學習分析
- 深色／淺色與每日新卡目標

## 安全邊界

- 不得把此 demo 的 `isDemo`、`stage`、`audit` 當作真實 Supabase 資料。
- 目前沒有伺服器端存取驗證；正式功能必須經本人批准及後續階段的 Auth/RLS 安全驗收。
- 此分支不應直接合併至 `main` 或部署到正式 GitHub Pages。
- P1 的目前狀態為進行中，詳見 Drive 的《P1 階段進度與測試報告》。
