# 《現實遊戲》拉乎迪學院 V12｜室內家具初稿

建立日期：2026-10-23
正式 GLB：`model-viewer/lahudi-academy.glb`
模型版本：`ACADEMY-V12-INTERIOR-FURNITURE-PHASE1-REVIEW`
SHA256：`b975ace3cd12744621688f4f5a0a8aa27f5dff1fbed4beb7ae5b9306dbbd3a66`

## 已完成（第一階段，不是全校完成）

- 主樓 A01、一年 A/C 班以及原有 F 圖書館的全部歷史場景節點原封不動保留。
- B 西教學翼、C 東教學翼：44 個暫定教室/專科室，內牆、真實通道洞口、二樓地板及各一座 26 級折返樓梯。
- B、C、D、E、G、H：合計 **1,734** 個獨立家具擺放位置，依材質/區域/樓層合併為 **60** 個 GPU mesh batches。
- 家具的具體世界 X/Y/Z 座標、來源型號、尺寸可在分支 `model-viewer/staged-output/academy-interior-furniture-v12/furniture-placements.json` 讀到。
- 正式版 V11 備份：`model-viewer/backups/pre-academy-v12-interior-furniture/lahudi-academy.glb`。
- 除正式學院模型/檢視器/版本清單/備份外，沒有改動其他四個 GLB。

## 重要：不得混淆來源和完成狀態

**原先 62 款獨立家具 GLB 並沒有直接合併原始網格。** 本次在單一校園 GLB 裡依照相同編號和真實 L/W/H 尺寸另建低面數程式化家具幾何，現階段實際用到 30 種；62 原件仍在作者的獨立資產包 `拉乎迪學院_62款3D家具模型庫_v1.zip`，待匯入時應保留原編號並替換這些草模。

本版不是全部 102 房間裝潢完成。主樓/圖書館已存在物件只受保護，沒有重新記入這 1,734 件。
新 B/C 教學間格是暫定位置，未和正式動畫逐鏡重新對位。北學術區 E 二樓因尚未具備完整樓板而沒有放入家具。
家具位置及已鎖定八區邊界的 AABB/尺寸範圍檢查通過；使用者已要求跳過角色碰撞。
作者視覺驗收仍待確認。

## 模型檢視

[完整模型與室內分區選擇](https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy)

可於檢視器選擇「室內家具」中的 B1/B2/C1/C2/D1/E1/G1/H1，會切換樓層高度並俯視該區。
