# 素材與圖說版本正式驗收補登（2026-10-26）
本輪核對既有 PR #34 的實作與正式部署，補上先前 NOT_TESTED 的 MCP 端對端及部分桌面介面驗證；沒有重新建立網站。

## 正式版本
- 原私人 Site：appgprj_6ad8267ce66c8191899aa5edc0c681af，v24。
- 原 Site 部署 appgdep_6adf5b0f5f588191bb75da8b3f6e1096：succeeded / has_mcp=true。
- GitHub PR #34 已合併；功能 commit e6ee848f694824aa1cadfb8a58c980a0bea80dad。
- Pages run 40334892621 / job 121613698602：success；包括 native workspace build、Upload Pages Artifact、Deploy to GitHub Pages。
- 正式入口：https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow
- 沿用 Supabase、owner JSON、私人 lizhi-production-images bucket。實查 public=false，10MiB，PNG/JPEG/WebP/SVG/PDF。

## 本輪實際驗證
所有寫入只針對兩個新建隔離模型測試專案，未以正式素材進行刪改測試。
- A：026461ac-0713-4d12-80f6-727925a7c167
- B：b0cfe0a3-a47a-48fd-a822-9f1a80992e99

1. 建立兩個獨立模型專案及各自持久化資料夾；A 建立子資料夾。
2. B 嘗試引用 A 父資料夾：拒絕「找不到本專案資料夾」。
3. A 真正匯入兩張由 PIL 產生的 320×200 PNG；回應 readBack=true，SHA256 與原檔相同。
4. 兩圖批次移動、用途／標籤／描述更新後，獨立 query 讀回原 ID、SHA256 與新資料夾均正確。
5. B 嘗試取得 A 素材：拒絕「找不到本專案素材」。B 起初素材數為0。
6. 查得 A 原圖的圖說版本及外觀關聯引用。
7. A 原圖移回收區後讀取遭拒；還原後 read_project_image 真正返回 image block 並核對 SHA256。
8. 回收期限為 2026-11-25，至少30天；未執行永久刪除。
9. 資料夾複製建立新素材 ID，但保留相同 SHA256；原檔未重新壓縮。
10. 資料夾回收、還原及重新命名成功，子資料夾及素材引用仍在。
11. 過期 revision=1 的寫入遭拒「專案已更新，請先重新讀取」。
12. 同圖號 QA-C001 建立 R00、R01，前版來源與雜湊保留；狀態僅草稿／候選。
13. 建立 geometry 圖說到 appearance 素材關聯，保留 needs_check；查詢及比較回應來源與原因正確。
14. update_drawing_status 成功由草稿改候選，沒有正式核定。
15. get_asset_access 成功取得短效授權；未把簽名連結寫入本報告。
16. 舊 import_project_image、update_project_image 在 B 真正寫入及讀回成功；舊 list_project_images 正確只列可讀圖片格式，SVG/PDF 經新 query 查詢。
17. 真正建立及匯入靜態 SVG、ReportLab PDF；readBack=true，兩檔 SHA256 與原檔一致。
18. 同 SVG 以新 request key 再匯入：回傳原素材 ID，未新增重複檔案。
19. 正式已登入桌面頁面能看到 A/B；MCP 匯入素材在 UI 顯示縮圖、用途與詳情。
20. UI 修改測試檔名後由 MCP 讀回確認保存；UI 建立「網頁建立驗收」資料夾亦由 MCP 讀回。
21. UI 圖說版本頁顯示 R00/R01、幾何角色、修改原因、外觀關聯與「待核對」。
22. UI 真正開啟左右並排及50%透明度疊圖，顯示兩原圖、圖號、版本、修改說明及待處理事項。
23. 獨立安裝 production/source 鎖定依賴，重新執行 npm test：75 PASS / 0 FAIL / 0 skipped；npm run build 成功。
上述是23組驗證情境，不是23個自動測試；沒有與既有163項Sites測試相加。

## 暫時錯誤與恢復
資料夾還原一次回覆「工作台儲存服務暫時無法使用」。沒有盲目重送；先以 MCP 查到資料夾仍在回收區、revision18，再用只讀 SQL 確認 restore request key 尚不存在，才以相同 key 與最新 revision 明確續作，還原成功。此事件保留，不宣稱從未出錯。

## 既有資料保存核對
發布後以 SQL 對原圖片完整 metadata 陣列計算摘要，與交接中發布前摘要一致：
| 專案 | 圖片數 | metadata MD5 |
|---|---:|---|
| 場景模型製作 |24|e69dc09aa4b12c12295fddbe0191663d|
| 拉乎迪學院 |2|8400483c0ca905cf215649e0e7db8976|
這是完整 metadata 比對，不是本輪逐一下載26張原圖的位元組驗證。正式專案 ID、原圖 ID、SHA256、工作紀錄與原始檔未由本輪改動。Library 包未刪除。原資料未猜測分類或核定。

## 已載入並使用的新增16項 MCP
initialize_project_assets、list_project_folders、create_project_folder、manage_project_folders、query_project_assets、get_project_asset、get_asset_references、update_project_assets、recycle_project_assets、get_asset_access、import_project_asset、get_project_drawings、create_drawing_version、update_drawing_status、manage_asset_relations、get_drawing_comparison。
原四圖片工具保留，本輪均已實際呼叫。

## 尚未驗證與交付限制
- NOT_TESTED：實體Android/iPhone、手機多檔選取、拖放上傳、正式瀏覽器批次上傳／失敗重試、全螢幕／下載完整流程。
- NOT_TESTED：本人正式基準核定／替換。AI沒有點擊「本人確認採用」。後端AI拒絕與角色分離已有自動測試，本輪未冒充作者。
- SVG/PDF 真正MCP匯入已測；PDF瀏覽器嵌入與SVG完整渲染未逐一驗收。
- 多對多關聯編輯的後端已測；網頁建立／修改關聯的完整互動未測。
- 上傳進度為逐檔狀態與整批完成比例，未提供網路位元組百分比。
- PDF只支援並排；疊圖僅圖片。未新增GLB/GLTF上傳或3D檢視器。
- 沒有自動AI比對、AI核定、永久清空或AI自動接手功能。
- 回退與惰性非破壞 migration 見 workbench-assets-drawings-20261026.md。無新資料表、無新增RLS授權。
本輪結論：功能程式及正式部署已確認，MCP核心操作驗收通過；完整裝置/UI驗收仍未全數完成。
