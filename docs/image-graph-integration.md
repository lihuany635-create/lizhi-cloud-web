# 映構整合 v26

入口：`?open=imagegraph`；獨立視窗：`image-graph/?v=26`。

## 首次使用

1. 雲端庫選單 → 映構圖片工作台。畫布、資料夾與專案在本瀏覽器運作。
2. 按「連接私人交接」，在映構視窗完成登入並按「允許連接」，保留視窗。
3. 按「接續原入口專案」，選擇原瀏覽器中的映構專案。原資料保留，同 ID 不覆蓋。
4. 按「連回原圖資料夾」，逐個選回原始根資料夾。核對檔案內容後才重新綁定來源；舊版映構原圖使用原工具連接。
5. 任務可直接送出與接收，無須下載交接 ZIP。候選預覽、核定與另存流程相同。

跨網址無法沿用瀏覽器資料夾授權；原入口與新入口的本機專案之後各自保存，並非雙向同步。原圖不批次搬移，任務私人後端和 ChatGPT MCP 仍由既有映構提供。若瀏覽器限制彈出視窗，允許後重按連接；手機休眠或關閉連接視窗會中斷交接，可重試。本機編輯不需要此連接。

## 維護

`node scripts/vendor-image-graph.mjs /path/to/image-graph-workbench` 從經驗證的 Site checkout 複製完整公開前端，只替換 runtime-config；source-manifest 記錄來源 commit 與每檔 SHA。不複製私人資料、設定、handle、憑證或 Worker storage。

GitHub Pages 既有 main workflow 發布；新增版本同步升 Service Worker cache。原 Supabase 身分、Finance DB、Engineering DB 與既有業務模組維持原樣。本機 Node server 支援 .mjs MIME。

## 驗證

映構 332 項測試通過；新增雲端庫模組測試檢查檔案完整性、離線資產與 iframe 保留。Finance/Engineering 1317 項回歸：1308 通過、9 個既有測試失敗；在未修改基線 3a412bbddbb7caf97be1641ecdb09a871f065af7 比對，9 項名稱完全一致，主要為舊版本字串斷言。沒有將這些既有失敗宣稱通過。

跨來源登入視窗、手機資料夾選擇與休眠恢復仍待實機驗收；程式及部署通過不等於已驗證每款手機行為。
