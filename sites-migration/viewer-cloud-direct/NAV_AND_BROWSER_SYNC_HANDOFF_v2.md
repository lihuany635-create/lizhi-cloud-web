# 立之 3D 檢視器代理｜導航格＋網頁同步 v2（2026-10-28）

延續 `WORKBENCH_STYLE_MCP_HANDOFF_v1.md`，解決兩個操控問題：
1. ChatGPT 移動人偶時，網頁檢視器看不到。
2. 雲端移動不檢查地板，無法上樓梯，會穿牆或浮空。

## 變更內容
- `model-viewer/nav/build_nav_grid.py`：離線從正式 GLB 產生「可行走地板格」（0.25 m 格、每格最多 4 層樓高度、頭頂 1.8 m 淨空檢查）。座標同檢視器（glTF y + y_offset）。
- `model-viewer/nav/*.nav.json`：五個正式模型的地板格，`model_sha` 與 `current-models.json` 一致（CI 測試會擋過期格）。
- `supabase/functions/lizhi-viewer-cloud/nav.mjs`＋`index.ts`：
  - `viewer_create_avatar`／`viewer_teleport_avatar`：自動貼到最接近的地板；沒有地板就拒絕，回傳 `near` 建議點，不寫入。
  - `viewer_move_avatar`：沿地板走（每次最多 10 m，自動跟隨樓梯），撞牆或遇落差停下並回報 `blocked`；完全走不動回 `MOVE_BLOCKED`，不寫入、不增加 revision。
  - 新工具 `viewer_walk_to`（只給目的地，伺服器 A* 找路含樓梯）、`viewer_walk_path`（最多 30 個路點）。
  - 移動後人偶帶 `last_path`（最多 120 點），網頁用來播放走路動畫。
  - `current-models.json` 快取 60 秒、地板格依 SHA 快取，減少每次呼叫延遲。
  - 地板格 SHA 不符或讀取失敗時，`move/create/teleport` 退回舊的未驗證行為；`walk_to/walk_path` 回 `NAV_GRID_UNAVAILABLE`。
- `supabase/migrations/20261028020000_lizhi_viewer_cloud_browser_read.sql`：唯讀 RPC `lizhi_viewer_cloud_browser_read`，只允許已核准 Google 帳號（`lizhi_web_is_allowed()`），網頁不能寫入。
- `model-viewer/index.html`：「雲端人偶」按鈕。開啟後每 2 秒讀雲端狀態，藍色人偶＝ChatGPT 控制的人偶（沿路徑動畫）；「跟隨視角」直接用該人偶的第一／第三人稱看。原本橘色本機人偶與 localStorage 不變。
- `site-cloud-direct-tools.mjs`：13 → 15 個工具，移動類描述更新。

## 驗證（2026-10-28，雲端環境）
- `node --test tests/viewer-cloud-direct.test.mjs tests/viewer-cloud-nav.test.mjs`：12/12 PASS。
  - 哈德斯家：入口（C03）建立人偶貼地 y=0.31；`walk_to` 經 U 型梯平台（約 1.6 m）到二樓 y≈3.3，路徑 17 m；往東 10 m 撞牆停下；在半空瞬移被拒且未寫入。
- 本機 headless Chromium（模擬 Supabase 回應、真實 GLB）：檢視器顯示雲端人偶、rev 3→4 時沿路徑走上二樓、跟隨視角畫面正確、關閉後清除。
- **未測**：正式 Supabase 部署、真實登入下的 RPC、手機實機、`reality-highschool` 等大場景的實際路徑品質。

## 需要使用者處理
1. 授權後由 AI 部署：`lizhi-viewer-cloud` v2（含 nav.mjs）與 migration `20261028020000`。
2. 原私人 Site「立之 3D 檢視器代理」需換成 15 工具的 schema（加入 `viewer_walk_to`、`viewer_walk_path`），重新私人發布，新對話重載工具。
3. GLB 更新後要重跑 `build_nav_grid.py`，否則 CI 測試失敗、雲端移動退回未驗證模式。

## 限制
靜態幾何篩選：不模擬開關門、移動物件、身體半徑（只檢查格中心）；不是畫面驗證，`collision_verified` 仍為 false、`visually_inspected` 仍為 false。
