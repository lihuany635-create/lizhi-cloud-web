# 《現實遊戲》拉乎迪學院｜薇媞後花園 V15 3D 建模交接

**交付**：2026-10-23
**唯一正式學院模型**：`model-viewer/lahudi-academy.glb`
**GLB SHA-256**：`e269a295159f0f7d3e82df864376579e66f4b92be204ce66667a3c78b9d3ea41`
**版本**：`ACADEMY-V15-VITTI-REAR-GARDEN-REVIEW`

## 原著依據、空間定義

依據 `07_發現女主.md`：薇媞後花園冬季冷清，花圃裡有耐寒植物，貝西站在角落的一盆植物前，主角在此遇到她。並未指出該花園一定與圖書館相連；**選在圖書館北側是動畫場景規劃，不是小說明文確定的地理設定**。

V15 新增後花園區域 X=[-44,-8]，Z=[-212,-184]，36m×28m=1008㎡；位於原 F_LIBRARY 北牆 Z=-183.2 以北，完全保留既有八區主建築外框。

## 實際 3D 場景內容
- 原 F_LIBRARY **北側實牆**單一網格拆除；原 mesh ID 留在 node.extras 作回復證據。拆分成兩塊石牆與上部牆身，開出寬 3m、高 3.6m 真後門，深色雙扇木門固定敞開。
- 圖書館後門平台、接續步道、長方形冬季草地與四邊環形石板路。
- 3 張長椅，含主要對話長椅與兩個安靜角落；6 組耐寒花圃、獨立的貝西角落盆栽、4 棵冬季落葉樹、4 盞暖色庭園燈。
- 簡化矮石牆與鍛鐵邊界、少量積雪，保持「冬天不熱鬧」的視覺留白。
- 新增 261 個幾何構件，按材質與分區合併成 27 個 GLB mesh batches。
- 原來 12040 個 GLB nodes 全部保留，僅原圖書館北端實牆這一個 Node 關閉舊 mesh 改成可通行開口；V14 校門、V12 教學空間、原圖書館書架及 1734 件家具皆保留。
- 正式 V14 備份：`model-viewer/backups/pre-academy-v15-vitti-rear-garden/lahudi-academy.glb`。

## 驗收與尚待完成項

[V15 建模報告](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-rear-garden-v15/report.json)

[V15 後花園七條動線靜態檢查](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-rear-garden-v15/garden-v15-static-qa.json)

門口、圖書館往花園、草地外圈四條路及貝西角落取景位置的 AABB 靜態阻擋均為 0；本次未做人物碰撞或動畫真實鏡頭核准。注意這只證明新構件的抽樣通道未阻擋，不代表完整場景精確三角形或施工規範驗收。

尚待：公開網站實際 3D 截圖、動畫參考圖對照、作者美術接受度。庭園冬雪與照明目前為低面數基礎材質，不是概念圖那種高精細最終渲染。

**[直接檢視 V15 學院／薇媞後花園](https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy)**，按「薇媞後花園 V15」切換花園視角。
