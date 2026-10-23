# 《現實遊戲》拉乎迪學院｜V10 真實碰撞點修正與樓層連通

日期：2026-10-23

## 正式唯一模型
- 路徑：`model-viewer/lahudi-academy.glb`
- 版本：`ACADEMY-LOCKED-PLAN-COLLISION-REPAIR-V10`
- SHA-256：`f2b4c82a7ea3b6625a7ffef3157c56b8e7f288bf9cd2d3bbf699c7ca67ef1b5c`
- 原 V9 備份：`model-viewer/backups/pre-academy-v10-collision-repairs/lahudi-academy.glb`

## 已修正 P0
1. D 西入口真正打洞、重建立柱及門楣（不移動外框）。
2. C 東側翼南門洞移到 X=-34..-29 並與連廊對中。
3. E 西北前廳北門洞移到 X=-107..-103 並接往 G 禮堂。
4. 主樓北門保留原約 3.2m 開口、連接地坪縮至2.90m；主樓南門保留原約2.66m 開口、連接地坪縮至2.40m；不修改 RB2 主走廊或 A01 故事位置。
5. 北側增設 1F→2F 26 階折返梯、轉折平台與二樓高架連接路線，保留原主樓及圖書館核心；北側頂棚抬高至下緣 Y=7.55m，二樓連通通行面約 Y=4.0m，模型淨高約3.55m。

## 已執行 QA
- 官方 V9 為來源：`ada3ae9c9e55f995b4c8c60f63655c01e572561e523e199ef1cdf298c7e668c3`。
- 真實 V10 GLB 11,316,780 bytes、11,827 節點；新增 52 節點，停用 15 個舊件，調整10個北廊柱件。
- 首輪 AABB 發現二樓護欄侵入 13 階上行梯；外移護欄並擴大支承走道後重新檢查成功。
- AABB + 0.40m 人物膠囊水平掃描中心線，10段地面路線與3段樓梯接近／二樓高架路線均零候選阻擋。
- 26階梯的上表面高度連續，每級0.149m，所有踏面中心 1.9m 高保護空間未被列為障礙的 AABB 侵入。
- GitHub QA:
  - https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/39922371517
  - https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/39922463967
  - https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/39922669202

## 未完成
- A01 主廊寬度：現有幾何跨度4.50m與動畫候選5.20m淨寬仍需依原影格人工校核。
- 尚未建立完整三樓樓板，二樓拱頂與未來3F構造相容性仍待設計剖面。
- 其他 P1/P2 屋頂交界、圖書館門框側向淨空、動畫人物真正動作/三角面碰撞尚待逐項驗收。
- 本次無渲染；GLB 幾何 QA 不等於動畫正式驗收，也不代表真實建築建照法規或結構安全驗證。

## 設計書
- [建築總平面與外觀殼體尺寸手冊 v1.0](https://docs.google.com/document/d/1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ/edit)
- [結構碰撞點檢查與預防手冊 v1.0](https://docs.google.com/document/d/1UlrxFUNmu6-3u3vPwPkSDj7EOJcXICY74ms1m34wUNc/edit)
