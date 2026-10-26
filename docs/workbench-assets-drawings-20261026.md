# 專案素材與圖說版本 v1（2026-10-26）

沿用原 Site appgprj_6ad8267ce66c8191899aa5edc0c681af、lizhi-production、同一 owner JSON 與私人圖片 bucket。既有專案 ID、圖片 ID、SHA256、原檔與紀錄關聯保留，沒有另一套圖片資料庫。

## 實作
- 專案內持久化巢狀資料夾，新增／重新命名／批次移動／複製／回收／還原；循環與跨專案目的地拒絕。
- 複製資料夾建立同專案 blob 引用；不重傳原檔。永久清理前檢查共用引用。
- PNG/JPEG/WebP/靜態SVG/PDF，每檔10MiB；多選、拖放、逐檔狀態與整批完成進度、明確重試、縮圖、全螢幕、原檔下載、描述／用途／標籤、批次整理及SHA256去重。
- 回收保留至少30天，沒有自動清空。刪資料夾不刪底下原檔，失去有效父路徑的素材顯示待分類。還原保留原ID與原檔。
- 圖號多版本，來源ID/hash/name快照不可覆寫，保留前版與原因、工作紀錄。狀態草稿／候選／採用／歷史／退回；幾何／外觀／歷史／一般參考分開。
- 多對多素材／圖說／成果引用，待核對／衝突及本人確認；來源回收不自動換基準。大小寫不同圖號仍為同圖號。
- 本人主站JWT操作才能核定基準。Site服務憑證只具AI角色，Site顯示主站核定入口；MCP不提供adopt工具，直接呼叫後端亦拒絕AI採用。
- 並排及透明度疊圖比較，PDF僅並排。比較保留修改說明、問題與人工觀察，不提供自動量測或自動核定。

## 新增MCP（16項，原四項圖片工具保留）
initialize_project_assets, list_project_folders, create_project_folder, manage_project_folders, query_project_assets, get_project_asset, get_asset_references, update_project_assets, recycle_project_assets, get_asset_access, import_project_asset, get_project_drawings, create_drawing_version, update_drawing_status, manage_asset_relations, get_drawing_comparison。

MCP原檔匯入2MiB，網頁10MiB；取得連結不等於實際讀檔。批次結果逐項檢查；過期revision與重複key拒絕，未知寫入結果先讀回。

## Migration與回退
1. assets.schemaVersion=1，放在既有專案JSON。initializeProjectAssets為惰性非破壞性遷移：只填空分類／標籤，新增空資料夾／圖說／關聯／操作歷史。舊圖不建立任何核定版本；沒有建表、改RLS或搬檔。
2. backend/assets-storage-v1.sql只擴充原私有bucket允許的檔案類型，不改public、權限或檔案大小；原檔未轉換。
3. 回退可部署Site23、Edge18、module10，保留新JSON欄位及所有Storage原檔。舊UI不顯示新分類，不能以舊備份覆寫新狀態。需要移除SVG/PDF接收時可還原bucket白名單，但已上傳檔案保留。
4. exportProjectAssets可匯出元資料索引；原始檔逐張下載。沒有自動清空／大量刪除／GLB檢視器重寫。

## 驗證與限制
目前Sites完整163項PASS，0 FAIL、0 skipped；TypeScript、Worker build、native build成功。測試涵蓋兩模型專案隔離、資料夾循環／跨專案、原ID/hash不變、複製原檔引用、回收還原與30天、R00/R01、AI核定拒絕、幾何外觀基準隔離、關聯與人工比較資料，以及後端API與AI橋接持久化一致。
測試程式使用隔離狀態與mock服務；不能替代正式端對端測試。
正式資料核對：哈德斯家24張、學院2張，既有專案ID不變；發布後需再核對完整metadata摘要。
NOT_TESTED：正式新增MCP端對端、正式UI完整流程、實體手機選圖／拖放／比較。本機preview基礎設施被另一個vinext服務占用，未改動他人服務。
PDF與SVG採有限靜態格式檢查及sandbox預覽，並非通用惡意檔掃描器。上傳顯示檔案／批次進度，不顯示網路傳輸位元組百分比。沒有3D原檔上傳或新3D檢視器。
