# 《現實遊戲》拉乎迪學院｜鎖定總平面 V9 建築外殼（2026-10-23）

正式模型：`model-viewer/lahudi-academy.glb`
正式 GLB SHA-256：`ada3ae9c9e55f995b4c8c60f63655c01e572561e523e199ef1cdf298c7e668c3`

## 建築手冊與收納

- Google Docs：《拉乎迪學院｜建築總平面與外觀殼體尺寸手冊 v1.0》
- 已存至 Google Drive／工具書資料夾。
- https://docs.google.com/document/d/1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ/edit?usp=drivesdk

## 本次完成

- 主教學樓 A、圖書館 F：保留原有教室、圖書家具、RB2 走廊與樓梯。
- 西／東教學翼 B/C：移至已鎖定的雙中庭外框。
- 南入口 D：既有鐘樓軸線 X≈-70.1，不強迫在外框中心 X=-60；左右立面採不等長屋頂體量。
- 北前廳 E：一個學術功能區，拆三段相鄰屋頂。
- 西北禮堂 G、圖書館附屬翼 H：建立實體外牆、屋頂、門洞。
- 幾何：新增 678 個外殼/連接構造節點；9個實體分段、10段連接地坪、9個有頂連接廊、9道雙坡屋頂量體。
- 原有五處外牆網格以可回復方式停用，讓門洞接上通道；兩側中庭保留通透空間。
- 正式 V8 備份：`model-viewer/backups/pre-academy-locked-plan-v9/lahudi-academy.glb`。
- 沒有另外建立公開展示 GLB；仍使用原來正式學院檔案。

## 尚未通過的關鍵事項

- 走廊現有 4.50m 外殼跨度和動畫 5.20m 候選淨寬尚未統一。
- A01 高拱頂與三樓樓板可能衝突：不能在二樓挑高廊道上方直接封 3F。
- 本輪是幾何外殼的 AABB／門洞通道檢查；未做角色膠囊碰撞、外牆結構工程簽證及動畫逐鏡視覺驗收。
- 新建側翼的室內隔間尚未規劃，不得回報全部教室完成。

### 非渲染 QA
施工：https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/39917832191
正式合併：https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/39918058037
交接證據：`model-viewer/staged-output/academy-locked-plan-v9/structure-qa.json`（施工分支）。

