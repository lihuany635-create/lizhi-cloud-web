# 《現實遊戲》｜拉乎迪學院 RG-GAME-02｜3D 模型流程與交接總紀錄

**整理日期**：2026-10-24（台灣時間）  
**紀錄範圍**：建築鎖定 V9 → 動線修復 V10 → 外觀 V11 → 家具 V12 → 校門 V13 / V14 → 後花園 V15 → 室內植栽 V16  
**歸屬**：作品共用 3D 模型，不等同 EP01 某一個鏡頭已核定；EP02 後續集數應引用同一份模型版本索引。  
**模型 key**：`RG-GAME-02`；**唯一正式檔**：`model-viewer/lahudi-academy.glb`。  
**當前正式部署來源（GitHub main）**：`ACADEMY-V16-INDOOR-GREENERY-PHASE1-REVIEW`，SHA-256 `aa1f5778f9d87672d0df1c7ba36b6202108eb14bbc4aeb4bb322504c7dbf2dc0`。  
**作者正式美術採用**：尚無工作台「採用模型」核定，不能因 GitHub 已部署就代填採用。  
**角色碰撞檢查**：作者明確要求不用人物碰撞，故跳過；完成的僅為特定幾何/AABB/家具座標查核，非人物動畫包絡證明。

## 一、工作流水：V9–V16

| 版本 | 主要工作與差異 | 實際交付與驗證 | 尚未解決／美術限制 |
|---|---|---|---|
| **V9** | 建立 A–H 八區鎖定平面與 Gothic 校舍主要外殼、外觀量體。 | `staged-output/academy-locked-plan-v9/` 有 GLB、`report.json`、`structure-qa.json`、碰撞稽核；`revisions/academy-locked-plan-v9/masterplan-v1.json` 為後續單一平面依據。 | A01 4.5m 原走廊外跨度與動畫候選 5.2m 淨寬有歧異；屋頂、三樓與挑空關係需再審。 |
| **V10** | 修復西/東教學翼及入口通道開口、A01 北側樓梯與高架連廊，保留原有八區。 | `staged-output/academy-route-repair-v10/`；一樓 10 段動線、樓梯與上層 3 段、26 階踏步及連廊頭頂高度靜態 QA 有通過紀錄。 | 是 0.4m 半徑中心線 AABB 判斷，不能外推為全角色行走與所有視角無障礙。 |
| **V11** | 南北量體哥德式外立面、窗、老虎窗等裝飾與冬季風格第一版。 | `staged-output/academy-exterior-finish-v11/`；模型 SHA `caab8cba4cbb9af22252ea2b05a35588b9529fb4af5720b787cf96b33229a9ae`；有 `report.json` 及 renderer/mobile 截圖。 | 已知老虎窗高程、E 分段假立面、尖拱窗洞口及入口屋頂左右坡度問題，後續不能稱完全修好。 |
| **V12** | 分區初步室內隔間、家具及樓梯。 | 正式校舍實際增加 **44 個 B/C 暫定房間**、**1,734 件低面數家具**，橫跨 B/C/D/E/G/H 六區；B/C 各一座 26 階折返樓梯。`staged-output/academy-interior-furniture-v12/furniture-placements.json` 有每件座標；`placement-qa.json` 檢查家具界限。 | 原先 62 款獨立家具 GLB **沒有逐件原網格直接合併**，本版依相同家具 ID 和尺寸程序化建立，實際用到 30 種；並非完成全校規劃的 102 房間。A01/F 原生場景優先保護。 |
| **V13** | 校園主校門、兩側人行門、圍界、南前庭、警衛室及接送點，對齊 X=-70.1 的鐘樓軸線。 | `staged-output/academy-gate-v13/` 有實際 GLB、`gate-static-qa.json`、公共視角截圖。 | 校門的具體鐵門、門柱和警衛室造型是美術新增，不是原著逐字設定。 |
| **V14** | 依動畫氣氛重設校門材質、造型、細節密度、樹與等候區；保留校門結構軸線與 V12 校舍內裝。 | `staged-output/academy-gate-anime-v14/`；真 GLB、公眾瀏覽器校門截圖、門前 6 區靜態通道檢查通過；V13 備份存在。 | 鐵門固定開啟 75°，非可動畫化門扇；實際截圖仍見平整外牆、簡化屋頂及偏厚石拱，**未達動畫美術定稿**。 |
| **V15** | 以第七章「薇媞後花園」冬季冷清、耐寒植物、貝西角落盆栽為敘事錨點，建造後庭。 | `staged-output/academy-rear-garden-v15/`；在圖書館北側新增 **36×28m＝1,008㎡** 後花園、**261 構件**、3 長椅、6 花圃、4 冬樹、4 燈、特殊角落盆栽。圖書館北實牆改為 **3m 寬 × 3.6m 高真門洞**，7 條抽樣路徑靜態 QA 通過，公共渲染有截圖。 | **原著沒有明文規定後花園緊接圖書館**，目前為動畫場景規劃。材質/樹型/圖書館後牆仍偏低多邊形，未美術完成。 |
| **V16（目前）** | 做全校室內植栽初稿，控制走道與教室家具避讓。 | `staged-output/academy-interior-greenery-v16/`：**10 款真正可獨立重用 GLB 植栽** PL01–PL10、**105 盆已建入正式學院 GLB**：B48、C36、D6、E8、G4、H3；其中教室牆邊 44、桌面 40、公共空間 21。登錄家具平面重疊 0；公開 V16 GLB 雜湊與教室視角截圖確認。 | **A 主樓告白走廊與 F 原圖書館內部未新增植栽**，需原生家具與鏡位定位後再處理；10 款為低面數造型、非寫實最終版。 |

所有 `staged-output/` 路徑均相對於 GitHub 倉庫 `model-viewer/`，在工作分支 `rg-ep01-s01-stage-20261023`；正式 GLB 與 `model-viewer/current-models.json` 位於 `main`。

## 二、模型製作流程 M01–M08（工作台規格）

### M01｜原檔盤點與備份
- 唯一正式校舍檔 `model-viewer/lahudi-academy.glb`；所有修改採 V9→V16 可追溯版本。
- V16 正式 SHA-256 `aa1f5778f9d87672d0df1c7ba36b6202108eb14bbc4aeb4bb322504c7dbf2dc0`；V15 SHA `e269a295159f0f7d3e82df864376579e66f4b92be204ce66667a3c78b9d3ea41`。
- V15 復原檔 `model-viewer/backups/pre-academy-v16-indoor-plants/lahudi-academy.glb`；其他四個正式 GLB 模型不變。
### M02｜設定、尺度及世界觀
- 八區 A～H 世界座標固定，米制，Y 朝上；主樓告白走廊 A01、班級和原圖書館既有內容優先保留。
- 原著佐證：章 05「校門接送、朋友等候」；章 07「薇媞後花園、冬季耐寒植栽、貝西角落盆栽」。座標/外觀/庭園緊鄰圖書館則是動畫規劃。
- 全校室內 A～H 植栽設計規範 `revisions/academy-interior-plants-v16/greenery-masterplan-v16.json`；A/F 植栽只規劃未實作。
### M03｜補件與差異
- 保留：V15 校門、後花園、原學院 12,067 個 GLB 節點；V12 已登記 1,734 家具以及原 A01/F 場景。
- 增加：10 獨立植物資產 GLB、學院 105 件盆栽配置及其分區/樓層材質網格；每盆穩定 `GRN-xxx` ID 與世界 XYZ 座標。
- 暫不加入：懸吊植物（缺核定吊掛支點）、原 A01/F 植栽（避免動畫畫面及書架家具衝突）。
### M04｜實際建模與候選
- 建模程式 `revisions/academy-interior-plants-v16/build_v16_greenery.py`，使用 Python 生成 glTF 2.0 的 geometry + indexed mesh，正確寫出 GLB BIN/JSON。
- 候選：`staged-output/academy-interior-greenery-v16/lahudi-academy_INDOOR-GREENERY-V16.glb`；10 植物來源：同資料夾 `plant-assets/PL01.glb` 至 `PL10.glb`；所有 SHA 見 `asset-index-v16.json`。
- 候選產生/自動測試成功後發布回「**原本**」的 `lahudi-academy.glb`；另外存 V15 備份。工作台登記不是再次覆寫原檔。
### M05｜幾何與可用性檢查
- `plant-v16-static-qa.json`：105 件植栽座標、44 教室側盆、40 桌面支撐、10 GLB 的 SHA 都檢驗，登錄家具重疊 0，舊節點保留。
- 結果**只證明按資料登錄的 XYZ / 植栽對家具碰撞**，不是所有三角形穿模、完整材質表現或實際 Android 性能的最終證明。
### M06｜鏡位與美術檢查
- `public-qa/plants-actual-cdp.png` 是實際公開 V16 教室俯視截圖；公開網站顯示 V16 版標，載入同 SHA 的 GLB。
- 俯視圖看得到一盆牆邊觀葉與桌上植栽；葉片和盆器仍偏符號化/低面數。無完整鏡位 FOV、A01 動畫逐鏡視覺驗收。
### M07｜修正與複核
- 第一次 V16 build 成功但驗證腳本誤用 `room` 欄位（實際是 `id`），已改驗證程式並重跑通過。原 GLB 並非該錯誤。
- V16 自動生成、註冊物件 QA、GitHub 官方發布與 Public GLB 完整性檢查通過。手機截圖中可見成果但美術未完成。
### M08｜交接與採用
- **工作台沒有作者正式核准 / 採用事件**；只登記程式已發佈及 AI 初稿驗證，保留待作者視覺裁定。
- 下一位 AI 先讀此文、`current-models.json` 以及 V16 的 QA、`plant-placements-v16.json`，再依照工作台精確版本領取上下文包。
- 下一步優先：A/F 原生場景家具與植物的真實位置掃描→可安全加植栽；V15 花園立面與樹木動畫美術精修；V11 老虎窗與假窗等歷史遺留修正；A01 走廊/3F 挑空高度仍未裁決。

## 三、驗證入口及機器可讀來源

- [正式模型與分區檢視器](https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#lahudi-academy)
- [GitHub 最新模型版號與 SHA](https://github.com/lihuany635-create/lizhi-cloud-web/blob/main/model-viewer/current-models.json)
- [V16 建模報告](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-interior-greenery-v16/report.json)
- [V16 模型植栽靜態 QA](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-interior-greenery-v16/plant-v16-static-qa.json)
- [V16 所有植栽 XYZ 位置](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-interior-greenery-v16/plant-placements-v16.json)
- [V16 公開教室截圖](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-interior-greenery-v16/public-qa/plants-actual-cdp.png)
- [V15 後花園 QA](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-rear-garden-v15/garden-v15-static-qa.json)
- [V14 校門 QA](https://github.com/lihuany635-create/lizhi-cloud-web/blob/rg-ep01-s01-stage-20261023/model-viewer/staged-output/academy-gate-anime-v14/gate-v14-static-qa.json)
- [學院設定暨尺寸手冊](https://docs.google.com/document/d/1seSK9uMrnNV2_Mh1RwmG50JtjFgXqJzHOQoCqiNFTPQ/edit)
- [V9 碰撞預防手冊](https://docs.google.com/document/d/1UlrxFUNmu6-3u3vPwPkSDj7EOJcXICY74ms1m34wUNc/edit)

## 四、接手指令（給 AI）

讀取作品《現實遊戲》 > RG-GAME-02 拉乎迪學院 > V16；先呼叫立之雲端庫動畫模型的 `read_animation_models`，再使用 `acquire_animation_model_context` 取得精確階段 M01～M08 的工作包；比對本紀錄、最新 `current-models.json`、V16 位置/QA 與實際模型 GLB。不要把網站上目前使用的版本認作已被作者美術採用，不能修改其他四個模型，不可把 F 圖書館及 A01 沒有新增植物說成已完成。任何超出原著的佈置都要標示動畫設計推定。新版本先在獨立候選產出、保存備份和 QA，完成後再透過驗證流程發布。
