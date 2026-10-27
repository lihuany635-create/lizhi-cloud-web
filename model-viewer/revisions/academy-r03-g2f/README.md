# 《現實遊戲》拉乎迪學院｜R03 分間＋家具（G2F）交接

日期：2026-10-27
正式學院模型：`model-viewer/lahudi-academy.glb`
版本：`ACADEMY-R03-G2F-20261027`
SHA-256：`307bae18db6c2ba1a0425da92b779ac21ce39b00f8525babaae5cfd007bea037`
回復 V16：`model-viewer/backups/pre-academy-r03-g2f/lahudi-academy.glb`（SHA `aa1f5778…3ea41`）

## 本版是什麼
依 2026-10-27 上傳的 119 張圖、《建模尺寸計算書 v0.1》與《3D 模型製作手冊 v1.0》**重新參數化建模**，不是在 V16 上修改。

- 座標：1 單位 = 1 m；+X 東、+Y 北（glTF 為 −Z）、+Z 上；2F 完成面 +5.40。
- 量體：L01～L08、四條雙層連廊；L04 改 48×30（依 F-104／F-204 多數圖面），L08 北移 6 m。
- 外殼：271 扇等邊尖拱窗（真洞口＋玻璃）、外壁柱、L04／L08 真挑空與柱梁、L05 拱廊柱列、L07 尖頂 proxy。
- 垂直動線：7 座雙折梯（30 級、級高 0.18）＋ L07 旋梯 proxy（待作者核定）。
- 室內：L04、L05、L06、L08 一二樓分間與門洞；房間表見 `reports/rooms.json`。
- 家具：16 組共用模組網格、591 件擺放（`reports/furniture_log.json`）。

## 驗證（靜態，非作者驗收）
`reports/QA_G2F_R03.json`：96/96 PASS — 標高、樓板面積、挑空射線、跨棟路線一二樓、室內門洞、271 窗射線、916 件世界座標零穿插、家具離牆 ≥0.15 m、GLB 重開物件數與 extras。
視覺：僅無頭 Workbench 截圖（`previews/`）；**手機實機檢視與作者驗收待辦**。

## 未帶入（V16 才有）
A01 告白場景、V14 動畫校門、V15 後花園、V16 室內植栽、V12 家具。需要時從備份還原，或在 R03 座標上重建。

## 重建
`scripts/lahudi_g2f_build.py`（Blender 5.1／bpy）→ `scripts/lahudi_g2f_qa.py` → `scripts/lahudi_plan_draw.py`。完整衝突與待確認清單見 `reports/工作紀錄_G2F_R03_20261027.md`、`source/圖面筆記_119張_20261027.md`。
