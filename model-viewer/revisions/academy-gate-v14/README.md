# 《現實遊戲》拉乎迪學院校門｜動畫風格修正版 V14

**正式來源**：`model-viewer/lahudi-academy.glb`
**正式 SHA-256**：`1d2ac5373a3ae9e276048aa647d3f65ef19bc01ada3ee0e0473b1154568c53b2`
**日期**：2026-10-23
**版本**：`ACADEMY-V14-ANIMATION-STYLE-GATE-REVIEW`

## 為動畫修訂的內容
保留原有的 8 區校舍與不對稱鐘樓配置，南向校門沿用 X=-70.1m、Z=79m，未拿純概念圖中的巨大對稱大教堂覆蓋原模型。

- 調整較挺直的門柱剪影、淡冷灰藍石材與低反光鐵件，保留暖色壁燈。
- 減少細碎圍牆鐵欄與尖飾密度、讓外圍視覺降低、前庭鋪面保留安靜的中央軸線。
- 簡化警衛室、增加兩處可供接駁下車／與凱薩等候的木長椅、兩棵冬日落葉樹、少量雪色鋪面。
- 雙開主門仍為固定開啟造型、兩側行人門可供取景。

V13 的 28 個校門網格不再加入渲染場景，但保留在 GLB 結構中以供回溯；V14 可見校門裝飾 295 個構件合併成 29 個網格，原 V12 校舍、44 個暫定房間和 1,734 件家具的前 11,983 個場景節點不變。

## 檢查與界線

[建構及材料報告](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-gate-anime-v14/report.json)

[校門幾何與通道檢查](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-gate-anime-v14/gate-v14-static-qa.json)

幾何檢查：校門中軸、兩側人行門、建築入口橫向步道與等待區共六個矩形抽樣檢查區，未發現本輪新增阻擋；未進行使用者要求跳過的人物碰撞。這不等於正式工程通行審核。

**藝術性校核的限制：** 動畫 A01 走廊提供冷石材／溫暖燈光的美術方向，並沒有明確提供校門的完整尺寸、平立面或校門動畫定稿影格。動畫風格校門屬美術推定修正版，非根據實際動畫校門影格逐像素配對。正式作者視覺驗收仍待進行。

**回復位置**：`model-viewer/backups/pre-academy-v14-animation-gate/lahudi-academy.glb` （正式 V13）。

**展示頁面**：[原本的學院 3D 檢視器](https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy)，點「動畫校門 V14」查看正面鏡頭。
