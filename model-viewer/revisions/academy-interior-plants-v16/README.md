# 《現實遊戲》拉乎迪學院｜室內植栽 V16 建模與配置交接

日期：2026-10-24
正式學院模型：`model-viewer/lahudi-academy.glb`
版本：`ACADEMY-V16-INDOOR-GREENERY-PHASE1-REVIEW`
SHA-256：`aa1f5778f9d87672d0df1c7ba36b6202108eb14bbc4aeb4bb322504c7dbf2dc0`
回復 V15：`model-viewer/backups/pre-academy-v16-indoor-plants/lahudi-academy.glb`

## 本輪真實交付

**10 款可分開重用的 GLB 植栽原件**：`model-viewer/staged-output/academy-interior-greenery-v16/plant-assets/PL01.glb` 至 `PL10.glb`，位於工作分支 `rg-ep01-s01-stage-20261023`。
另外，`model-viewer/staged-output/academy-interior-greenery-v16/asset-index-v16.json` 內有每件尺寸、生成種類、SHA-256。
單一正式學院 GLB 額外實際建入 105 盆：B 西教學翼 48、C 東教學翼 36、D 南入口 6、E 北學術翼 8、G 禮堂 4、H 檔案區 3。

其中 44 盆置於已建的 B/C 教室牆邊、40 盆有 V12 家具資料確認的現存桌面、21 盆位於公共室內，建模以低彩度綠葉、石盆、黑鐵及深木色為主，網格按區域/樓層/材質合批以兼顧行動裝置。

模型固定 **V15 的 12067 個原有節點原封不動**，包括 A01 告白場景、現有教室／圖書館家具、V14 校門及 V15 後花園貝西角落植物，沒有把新植物覆蓋到故事點位。

## 植物資產種類

PL01 高窄直立觀葉；PL02 寬葉深綠；PL03 細枝室內小樹；
PL04 叢生耐陰；PL05 窄葉中盆；PL06 低型窗台葉；
PL07 細葉桌上；PL08 圓葉桌上；PL09 垂墜（資產已建、不吊掛）；
PL10 少量花葉（資產已建、不亂放）。

每種材料與葉形在 `model-viewer/revisions/academy-interior-plants-v16/greenery-masterplan-v16.json` 設計，規劃性新增並不是原小說明文指定的物種。

## 實際配置與品質

- 來源：V12 `furniture-placements.json` 的真實家具 XYZ 座標，以及 V9 已鎖定八區平面。
- `model-viewer/staged-output/academy-interior-greenery-v16/plant-placements-v16.json`：每盆的編號、資產種類、空間、XYZ、放置面及支撐桌子。
- `model-viewer/staged-output/academy-interior-greenery-v16/plant-v16-static-qa.json`：105 植栽、10 個獨立 GLB 與 44 教室盆栽位置、40 個桌面支撐源均通過驗證；相對已登錄家具平面重疊 0。

**未完成、不得誤稱完成**：A 主樓和 F 原圖書館有正式設計但尚未埋入盆栽，因為舊原生場景缺精確安全擺放資料；這是刻意保護既有動畫的重要場景，而不是全校 A～H 均完成。現有 102 房間計畫尚未全部做成真房間；植物是簡化的低面數動畫背景素材，尚未逐鏡比對動畫美術參考。依作者要求跳過人物碰撞，靜態驗證不等於全 3D 場景導航檢查。

## 檢視及下一階段

[正式拉乎迪學院檢視器](https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy)，可按「室內植栽 V16」，或在「室內家具」選單選 B/C/D/E/G/H 分區檢視。

下一階段視覺校核：與 A01 走廊美術統一，優先把現有 B/C 教室植栽調整為動畫光影；等取得 A/F 的真實室內家具空間掃描後才安全納入。
