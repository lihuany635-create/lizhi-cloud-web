# 立之 3D 檢視器代理｜操作手冊與 AI 接手 SOP v1.0

**更新：2026-10-28（臺灣時間）｜適用：原私人 Site v9、15 項 Viewer MCP、Supabase Edge lizhi-viewer-cloud v3、PR #41 靜態導航格。**

**重要區分**：這是《立之 3D 檢視器代理》的 GLB 場景／雲端人偶導航功能，**不是**「立之 3D 建模代理（Hew）」或 CAD 指令代理。不能拿 Viewer 工具編輯牆體、家具或 GLB 原檔。

**AI 接手索引**：立之雲端庫 → 製作工作台 → 專案「立之 3D 檢視器代理」，專案 ID：**d2803bc3-cea1-4ddf-9fa3-2cf06eb520c4**。接手應先呼叫工作台 **get_project_context**，閱讀本手冊與最新驗收記錄，再操作；文件是參考來源，實際工具及最新正式回應優先。此指引不代表每個新對話都已自動載入。

## 1. 架構與能力邊界

**資料流：** 一般 ChatGPT 對話 → 原私人 Site 的 /mcp（本人驗證）→ Supabase Edge lizhi-viewer-cloud → owner 隔離的雲端人偶、位置、鏡頭與檢查點資料。

- **不需**開啟網站、保持手機或電腦在線來操作雲端人偶資料。
- 五個正式 GLB 在 GitHub 倉庫 lihuany635-create/lizhi-cloud-web 的 model-viewer/ 內；正式版本與 SHA-256 以 model-viewer/current-models.json 或 viewer_list_models 回傳為準。
- 導航格在 model-viewer/nav/*.nav.json，以正式模型 SHA 比對，0.25 公尺格、可貼地、跟隨樓梯、限制過高台階與部分落差；以**靜態幾何地圖**執行，不是完整的物理碰撞、人物尺寸或真實影像巡查。
- 網頁人工檢視器具有「雲端人偶」按鈕：**藍色**為雲端人偶及行走動畫，**橘色**為原本瀏覽器本機人偶，資料互不等同；可開啟跟隨視角。
- **尚未具備雲端 WebGL/GPU 真正渲染及真實截圖**。viewer_get_screenshot 明確回報 CLOUD_3D_RENDERER_NOT_IMPLEMENTED。視角設定成功 ≠ ChatGPT 已看見場景；導航成功 ≠ 已目視驗收房間。
- Site 私人 URL：https://lizhi-viewer-agent-20261027.lihuany635.chatgpt.site 。不要要求使用者提供 Token，不能輸出 Secrets。

## 2. 使用者操作方式

1. 在一般 ChatGPT 對話選取**立之 3D 檢視器代理**，告知要使用哪個模型、對哪個人偶、要去的明確位置。
2. AI 先讀模型清單與雲端人偶資料，再執行新增、移動、尋路、視角等寫入。**未知房間的座標不可憑空假定**；可先讀模型節點資訊、參考已驗證路徑或向使用者索取具體位置。
3. AI 回報**實際移動距離、最後座標、是否受阻、更新版本**，並在重要操作後讀回。
4. 若要用眼睛看：開啟 https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/ ，選取同版模型，登入獲准的 Google 帳號，按「雲端人偶」，需要時用「跟隨視角」檢視藍色人偶。頁面大致每 2 秒輪詢雲端資料；使用者必須實際看過才能確認視覺效果。
5. 關閉「雲端人偶」顯示不會刪除人偶。要刪除請明確交代 AI；AI 不得擅自刪除正式人偶。

## 3. AI 接手與安全 SOP（每次任務都做）

**步驟 1：先讀工作台。** 用工作台 get_project_context(projectId="d2803bc3-cea1-4ddf-9fa3-2cf06eb520c4")，讀本手冊全文；必要時再 get_project_handoff 讀近期改動與未驗證內容。

**步驟 2：核對 MCP。** 確認本對話實際載入**15 項 viewer_* 工具**，包含 viewer_walk_to、viewer_walk_path。若只有 13 項，重新選取代理或開新對話；不能假裝新工具可用。

**步驟 3：核對雲端狀態。** viewer_status({}) 應回 mode: cloud_direct、requires_browser: false。若變成 online_browser 或讀取失敗，先停止寫入並排查 Site 版本。

**步驟 4：找最新版模型。** viewer_list_models({}) 取得 model 名稱、current_sha256、version。model_key 為不帶 .glb 的檔名，例如 hades-house。

**步驟 5：讀人偶與 revision。** viewer_get_scene({model_key:"hades-house"}) 或 viewer_list_avatars，確認 state.avatars、avatar_id、model_sha、revision。不要直接用以前對話的 ID／版本。

**步驟 6：每次寫入都有防重識別。** 帶 model_key、model_sha（正式清單）、expected_revision（當下讀到的整數）、新產生的 request_id（UUID），再依工具加入 avatar_id、position、delta、target、waypoints 等。每筆新操作使用自己的 UUID；若送出結果不明，**不得換新 UUID 重試同一操作**，先讀雲端 scene，必要時用原 UUID 與相同參數核對防重。

**步驟 7：驗證結果與安全限制。** 看 returned revision、movement.travelled_m、movement.blocked、movement.position、state.avatars[].last_path，然後另行讀回。ok:true 搭配 blocked 可能是**部分完成**。未確認地板、動態障礙、影像等不可稱已驗收。

**步驟 8：紀錄與清理。** 測試前確認使用者授權，臨時人偶可在完成後刪除並讀回。正式人偶禁止擅自刪除。把實測／模擬／未測、工具結果、問題與下一步登記工作台，不得無證據寫 PASS。

## 4. 15 項工具速查

| 工具 | 操作與使用規則 |
|---|---|
| **viewer_status** | 查看 cloud_direct、是否需開網頁、navigation movement_check 等；唯讀。 |
| **viewer_list_models** | 取得五個正式模型、版本與 GLB SHA；唯讀。 |
| **viewer_get_scene** | 讀取 model_key 對應雲端 state / revision；include_model_index:true 可從真正 GLB 讀節點索引，但不是截圖、碰撞驗收；可用 offset/limit。 |
| **viewer_list_avatars** | 唯讀人偶 ID、位置、模式；寫後可用來核對。 |
| **viewer_create_avatar** | 需 name、position:[x,y,z]；有有效導航格時自動貼到就近地面。留意 surface_verified。 |
| **viewer_select_avatar** | 指定 avatar_id；需正確 revision。 |
| **viewer_move_avatar** | delta:[dx,dy,dz] 水平移動，**單次最多 10m**；dy 由導航貼地處理；可能 blocked。 |
| **viewer_teleport_avatar** | position:[x,y,z] 絕對位置，選最近可行走層；不等於路線已巡查，無地板會拒絕。 |
| **viewer_walk_to** | target:[x,z] 或 [x,y,z]，由雲端 A* 尋路；y 指定樓層；以實際回傳位置為準。 |
| **viewer_walk_path** | waypoints 1～30 個路點，每點 [x,z] 或 [x,y,z]，逐段**直線**行走；不是每段自動找路。 |
| **viewer_set_camera** | 儲存指定人偶 first、third、top、free 模式與方向；不會讓 ChatGPT 自動看見 WebGL 畫面。 |
| **viewer_get_screenshot** | 雲端渲染未實作；不得偽造截圖或基於沒有的影像判定瑕疵。 |
| **viewer_save_checkpoint** | 儲存雲端位置、尚未視覺驗證的筆記；不得假造 screenshot_id 或 findings。 |
| **viewer_delete_avatar** | 僅刪已核對、經使用者允許的人偶；事後讀回。 |
| **viewer_stop** | 雲端模式沒有長駐瀏覽器工作階段；不等於取消、回滾已提交的資料庫寫入。 |

## 5. 座標、碰撞、回應判讀

- **單位公尺**，Three.js/glTF **+Y 朝上**；完整座標 [x,y,z]，目標兩元素形式 [x,z]。不可把尺寸單位混成 mm。
- 模型資料依 model_key + model_sha 分版。正式 GLB 改版，必須重建同 SHA 的 nav.json，不能拿舊導航格／舊人偶位置直接當作新模型已驗證。
- 建立或瞬移可能回 **NO_WALKABLE_SURFACE**、**NO_WALKABLE_SURFACE_AT_HEIGHT** 與建議 near／levels_here；應回報並查詢正確位置，不隨便換點繞過地板驗證。
- **MOVE_BLOCKED** 表示完全移動失敗；movement.blocked 非空可能已部分行走，必須回報停下座標。
- **NAV_GRID_UNAVAILABLE**／模型 SHA 不符：不得宣稱已貼地或避障。部分原始工具在 nav 失效時可能退回未驗證座標寫入，須檢查 surface_verified、nav 屬性與回應限制。
- **REVISION_CONFLICT**：先重讀 scene，不覆寫他人改動。**MODEL_VERSION_CONFLICT**：重讀模型清單，確認同 SHA。
- **PATH_SEARCH_LIMIT**：路徑過大或找不到，切分合理範圍並核實，不把未到達段落標示完成。
- **UNKNOWN / timeout**：不可換新 UUID 盲目重試，先讀回；成功與否不明時避免重複寫。
- 一格 0.25m 的導航網格只對格中心及靜態幾何篩選；不處理角色身體半徑、開關門、移動家具或完整物理。**collision_verified:false、visually_inspected:false** 不能擅自改為 true。

## 6. 操作範例：哈德斯家一樓走到二樓

**目的**：驗證真實 MCP 雲端導航，不做影像巡查。此處座標是特定模型 HADES-v3.3 的歷史驗證例，不要移植到其他模型或未核對的新版本。

1. 先 viewer_status、viewer_list_models、viewer_get_scene({model_key:"hades-house"})，取**當時真正的 SHA 與 revision**。
2. 在使用者授權下使用 viewer_create_avatar：model_key = hades-house、model_sha = 查得 SHA、expected_revision = 最新 revision、request_id = 新 UUID、name = 驗收臨時人偶、position = [-2.8,1.6,3.4]。
3. 讀回實際 avatar_id、position、surface_verified、revision；已驗證時貼地為 [-2.8,0.31,3.4]。
4. 用 viewer_walk_to：avatar_id = 上一步 ID、target = [2.8,3.3,2.7]，其他共通參數均用最新版本／新 UUID；查看 returned path、movement、blocked。
5. 過去實際 MCP 回應：**走 17.024m**，經樓梯平台到 [2.875,3.3,2.625]，Y 到 3.30m；這證明當時的**靜態雲端導航**，不證明已實際觀察樓梯或教室。
6. 用 viewer_walk_path：waypoints = [[2.625,3.3,2.375],[1.125,3.31,2.375]]，過去正式回應 **走 1.854m** 至 [1.125,3.31,2.375]，blocked 為 null。
7. 測試後如已授權清理，用 viewer_delete_avatar（實際 avatar_id、最新 revision、新 UUID），最後 viewer_get_scene／viewer_list_avatars 確認刪除成功。
8. **2026-10-28 正式實測**：測試人偶已清理，獨立讀回哈德斯家當時 revision 4、人偶 0、檢查點 0。將來仍須現場查最新狀態。

## 7. 網頁觀看藍色雲端人偶

1. 開啟 https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/#hades-house ，確認載入同 SHA 模型。
2. 使用獲准 Google 帳號登入；點「雲端人偶」，等待雲端狀態輪詢（約每 2 秒）。
3. **藍色人偶**依雲端位置及 last_path 播放行走動畫；可選「跟隨視角」第一／第三人稱。**橘色人偶**為原本瀏覽器本機人偶，不能混淆。
4. 如果看不到，查 Pages 部署是否完成、Google 登入權限、雲端人偶按鈕、模型是否同版、雲端 state 是否有人偶；關閉按鈕不會刪資料。
5. ChatGPT **尚無獨立雲端 WebGL 截圖**。使用者在手機看見畫面不代表 AI 已看見；不得報告未親自取得的畫面瑕疵。

## 8. 錯誤排查與回報模板

| 狀態／錯誤 | 處理 |
|---|---|
| 13 工具、缺 walk_to/path | 重新選取原 Site 代理或開新對話；先確認 15 項 Schema。 |
| online_browser | 錯版；停止導航寫入，確認 Site v9+ cloud_direct。 |
| REVISION_CONFLICT | 重讀 scene，核對其他操作，不強制覆寫。 |
| MODEL_VERSION_CONFLICT | 重新列模型，校對 GLB SHA 與導航格。 |
| NAV_GRID_UNAVAILABLE | 先修導航格及正式部署；不得當安全可走。 |
| GOAL_NOT_WALKABLE / NO_WALKABLE_SURFACE | 根據 near/levels_here 回報合理地點；不憑空造座標。 |
| MOVE_BLOCKED 或 movement.blocked | 回報實際停止位置、是否部分行走。 |
| CLOUD_3D_RENDERER_NOT_IMPLEMENTED | 不做假截圖與虛構畫面驗收。 |
| HTTP 401 / UNAUTHORIZED | 檢查本人驗證／原私人 Site，禁止展示 Secret。 |
| 網頁無藍色人偶 | 檢查登入、模型、按鈕、雲端 state、Pages；別把本機橘人偶當雲端。 |

**AI 完成任務後的報告至少包含**：模型與版本、實際 avatar_id（必要時）、操作內容、起點、目標、實際終點、travelled_m、blocked/reason、前後 revision、是否有真實畫面證據、清理／保存狀態、尚未驗證事項。

## 9. 開發與維護路徑

- 原私人 Site：https://lizhi-viewer-agent-20261027.lihuany635.chatgpt.site （Private；本人與 Secrets 不可更動）。
- GitHub repo：lihuany635-create/lizhi-cloud-web。
- 原檢視器：model-viewer/index.html；模型版本：model-viewer/current-models.json；導航格：model-viewer/nav/*.nav.json；導航產生器：model-viewer/nav/build_nav_grid.py。
- MCP 15 工具 Schema：sites-migration/viewer-cloud-direct/site-cloud-direct-tools.mjs。
- 交接文件：sites-migration/viewer-cloud-direct/WORKBENCH_STYLE_MCP_HANDOFF_v1.md、NAV_AND_BROWSER_SYNC_HANDOFF_v2.md。
- Supabase 專案：hrdzywkihfqggiwjgavi；雲端 Edge：lizhi-viewer-cloud v3（當下應再核對正式版本）。
- 雲端資料表：public.lizhi_viewer_cloud_scenes、public.lizhi_viewer_cloud_requests；雲端 RPC：lizhi_viewer_cloud_read/write；網頁獲准帳號**唯讀** RPC：lizhi_viewer_cloud_browser_read。
- 歷史 PR #40：工作台式雲端直連；PR #41：地板格、樓梯尋路、藍色雲端人偶網頁同步。不要拿舊 lizhi-viewer-control 的在線 session 當作新版必需。
- GLB 變更時須重建 nav grid、確保 SHA 一致、跑 Node + Chromium 回歸、查正式 Pages/Edge/Site 工具契約，再更新本手冊；不可隨意更改 GLB 或其他代理。

## 10. 新 AI 最短接手指令

> 請接手「立之 3D 檢視器代理」，先到立之雲端庫製作工作台用 get_project_context 讀專案 d2803bc3-cea1-4ddf-9fa3-2cf06eb520c4，再讀《操作手冊與 AI 接手 SOP v1.0》全文。確認 15 項工具、viewer_status 為 cloud_direct、正式模型 SHA、最新 scene/revision。寫入時用唯一 request_id 與 expected_revision；移動優先用 viewer_walk_to 或 viewer_walk_path，必須回報實際終點、距離與 blocked，完成後讀回。未經授權不刪除人偶、不把靜態導航當作影像巡查、不捏造雲端截圖。必要時把結果登記工作台。

---
**驗證聲明**：本手冊根據正式 15 項工具 Schema、PR #41 導航交接與 2026-10-28 的 ChatGPT 原生 MCP 實際操作編寫；網頁實機可視驗收及雲端 WebGL 截圖尚未完成，應以新結果更新，而非以本文取代測試。
