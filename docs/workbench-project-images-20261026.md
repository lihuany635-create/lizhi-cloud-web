# 工作台專案圖片匯入｜2026-10-26

需求：在既有專案工作台保存圖片、填說明，並與工作紀錄連結。

## 使用方式

開啟專案 → 圖片 → 匯入圖片。可多選 JPG、PNG、WebP，每張上限 10 MiB，逐張保存。可選擇既有工作紀錄與階段；紀錄頁的圖片數量按鈕可直接篩選該筆圖片。圖片支援原圖查看、下載與說明修改。

## 儲存與相容

- 新增私人 Storage bucket `lizhi-production-images`。前端使用本人登入呼叫既有 Edge；後端核對 projectId/owner/revision、檔案簽章、大小、SHA256、紀錄歸屬與防重鍵，產生短效讀取網址。
- 圖片檔名、說明、SHA256、路徑、關聯與異動歷史保存於專案 images 欄位；不修改舊動畫 rows，不將圖片自動認定為 PASS 證據。
- 修改遇到 CAS 衝突不覆蓋新資料；同鍵同檔重試回傳原收據。只有確知未提交成功的 CAS 衝突才清理新物件。未知提交結果保留私人原檔，避免刪除可能已提交的圖片。
- 還原舊專案備份會保留目前圖片與原檔。保留員工必知及既有動畫／模型流程。

## 驗證

- Sites 完整測試：124 PASS、0 FAIL、0 skipped。
- GitHub native source 測試：37 PASS、0 FAIL、0 skipped（包含員工必知、後端、圖片測試；與 Sites 共用測試重疊，不相加）。
- TypeScript noEmit 與 native 正式 build 通過。
- 圖片專用測試 11 項，另新增圖片端點權限測試；覆蓋 PNG/JPEG/WebP 簽章、SVG／假格式／超量拒絕、歸屬、版本、防重、儲存失敗、CAS 清理、未知提交結果、說明歷史、備份保留。
- 正式登入上傳、重新整理與原圖下載：待發布後瀏覽器驗證，不以單元測試冒充。
- 實體手機選圖：NOT_TESTED。

## 主要變更

`app/project-images.tsx`、`app/project-workspace.tsx`、`app/globals.css`、`native/entry.tsx`、`lib/project-images.ts`、`lib/project-management.ts`、`backend/images.ts`、`backend/index.ts`、`backend/project-images-storage.sql`、兩個測試檔，及重建 native bundle／更新快取版本。

## 發布依賴修復

調查前次 Pages run40259051042 的真實失敗 log，確認工作台使用 Vite 8 的 `minify: esbuild`，卻沒有宣告 esbuild，導致獨立 CI 建置失敗。補列 `esbuild: 0.28.0`，與既有 Sites 的實際版本一致。移除本次測試用 node_modules 連結，從 native package.json 重新安裝後，37 項測試全部通過，正式 native build 通過。原始缺漏不是通過狀態，正式瀏覽器仍待新部署。

官方依據：https://v8.vite.dev/guide/migration （esbuild 已改為可選依賴，使用 esbuild 壓縮須自行安裝）。
