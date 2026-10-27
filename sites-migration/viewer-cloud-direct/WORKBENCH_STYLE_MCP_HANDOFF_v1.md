# 立之 3D 檢視器代理｜工作台式雲端直連交接 v1
## 已完成（有正式變更）
- 現有 Site **沒有**被變更；仍使用舊版 online_browser 的 13 工具。
- 新 Supabase Edge Function: `lizhi-viewer-cloud` v1，已 ACTIVE；使用既有 `lizhi_viewer_config` 存在的 96 hex Site Token hash，**無需新增 Secret**。
- 新原子 Postgres RPC: `lizhi_viewer_cloud_read`、`lizhi_viewer_cloud_write`。
- 表：`lizhi_viewer_cloud_scenes`、`lizhi_viewer_cloud_requests`，RLS ON、anon/authenticated 不可直接存取，僅 Service Role。
- 狀態與寫入防重按 `owner+model_key+model_sha` 隔離、`request_id` 去重與 `expected_revision` 比對。原有 `lizhi-viewer-control`、GLB、Hew、CAD 均未更動。
- Edge 使用官方 GitHub Pages `current-models.json` 核對 SHA；`viewer_get_scene(include_model_index:true)` 真正下載 GLB 並驗 SHA，回傳節點清單（不是渲染、碰撞或實際行走）。
- 寫入人偶、切換、座標、雲端巡查筆記直接進 Postgres；所有位置回報 surface_verified=false/collision_verified=false。
- `viewer_get_screenshot` 一律 `CLOUD_3D_RENDERER_NOT_IMPLEMENTED`；禁止偽稱真實檢查。
- 所有測試均不需打開使用者電腦或手機瀏覽器。

## 需要在**原 Site** 完成的唯一人工網頁版步驟
1. 開啟原「立之 3D 檢視器代理」私人 Site：`https://lizhi-viewer-agent-20261027.lihuany635.chatgpt.site`，**不得建立第二個 Site**。
2. 在 Site 既有 Server Worker 保留原私人發布、本人驗證、`/mcp`、Secret 和單次 POST 拒絕 redirect 的做法。
3. 讀取 `sites-migration/viewer-cloud-direct/site-cloud-direct-tools.mjs`，**將原13個瀏覽器版 schema 改成此雲端版 schema**；尤其原 `session_id/revision` 改為 `model_key/model_sha/expected_revision`，不能混合。
4. 調用 `callViewerCloud`，或等價地把 Site Worker 的 `tools/call` server-to-server 路由指向新 Edge `lizhi-viewer-cloud`。重用原 Site 呼叫 `lizhi-viewer-control` 的 Secret，**不可將 token 放入前端**。
5. 沿用 Site 目前已驗證的 owner 身分產生方式，`owner` 必須由 Worker 認證推導，不得接受使用者提供。控制前完成本人認證。
6. 去除「開啟並連接檢視器」及要求開著 iframe 的入口。GitHub Pages GLB 檢視器仍保留獨立人工操作，現階段不保證其 localStorage 人偶與新的雲端資料自動雙向同步。
7. 新 Site v2 私人發布，查 `tools/list` 正確 13 工具；新對話選取代理讓 schema 重新載入。
8. 驗收 `viewer_status` 回報 `cloud_direct`、`requires_browser:false`，`viewer_get_scene` 查 R09，測試新增／讀回／版本衝突／防重；不得為驗收虛構已巡查房間。
9. 驗證雲端模型 SHA、權限拒絕、停止行為，紀錄進立之雲端庫工作台。

## 尚未完成、不能宣稱完成
- 尚未改 Site /mcp schema、尚未重新私人發布 Site。
- 尚未完成「雲端 GPU/WebGL/實際渲染截圖」、「3D 射線碰撞與樓梯走行」、「ChatGPT 真的看圖巡查」；須另建**真正執行 3D 的雲端渲染服務**。
- 現有 GitHub Pages 人偶 localStorage 並非新雲端人偶資料的鏡像，需要下一步雲端同步設計。
- 原 online_browser 可以回退，但不等於雲端直連成功。

## 安全說明
任何 ChatGPT 工具的寫入都須明確知道模型 SHA、精確 revision 及唯一 `request_id`；未知結果時用相同 request_id 讀回，禁止換新 ID 重試。
