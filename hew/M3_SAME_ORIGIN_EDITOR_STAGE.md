# 立之 3D｜Hew 同源編輯器候選版驗收與交接（2026-10-25）

## 與現有 3D 檢視器完全區分

- 舊 `?open=model3d` 保留原 `./model-viewer/` GLB 模型檢視，不修改既有動畫場景。
- 新的候選頁 `?open=hew3d` 是 **Hew 原生 WASM 編輯器**入口，在立之雲端庫 GitHub Pages 主頁驗證本人後，只嵌入**相同 origin** 的 `./hew-editor/?lizhi-model-queue=1`。
- 目前尚未在正式 GitHub Pages main 部署 `hew-editor/`，故前端先用 HEAD 驗證 `./hew-editor/index.html` 存在；不存在時以明確文字表示未部署，**不退回假 3D 檢視器**。
- 候選程式全部保留在 `feature/hew-3d-mcp-v1-20261025`（Draft PR #12），不等於正式使用者可開啟。

## 登入與權限

- 頁面來源是 `lihuany635-create.github.io`，相同 origin 的 iframe 可以從已登入的父頁 `window.LizhiAuth.client` 取得同源使用者 Supabase client；父頁 `auth.getUser()` 先確認本人，子頁再次 `auth.getUser()`。
- Hew 叉庫 `lihuany635-create/lizhi-hew` 的 `app/src/api/lizhiModelSameOriginAuth.ts` 只允許 `window.parent!==window`、**origin 完全一致**且 `LizhiAuth` 具合法 getUser / rpc 的父頁。獨立正式 Hew 視窗、cross-origin iframe / window、缺失 auth 均拒絕顯示 AI 工作面板。
- 以 `?lizhi-model-queue=1` 明確 opt-in；使用者須親自按 `本人授權 120 秒` 才產生資料庫工作階段，`領取並處理一筆工作` 才會領取單筆指令。離頁／分頁隱藏撤銷。
- 只允許既有 owner RLS 函式；**不透過 URL、postMessage、iframe src 傳任何 JWT、Token、Service Role**。AI MCP 端仍走正式已測通的私人 Site v2 → Supabase Edge。
- 原生模型檔案留在使用者電腦；工作 `succeeded` 只表示當前 WASM 場景內交易完成和資料庫 ACK，**不代表 .hew 已儲存**。

## 目前實測

- 正式 ChatGPT `model_status` 已驗證 `ok:true, online:false, sessions:[]`，表示 Site v2→Supabase Edge 可用、尚未開啟 Hew 使用者會話。
- Portal 單元測試：GitHub Actions [40182110321](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40182110321) **4/4 PASS**，檢查同源嵌入路徑、404 未部署、未登入拒絕、舊檢視器與新編輯器分流（模擬網頁與 mock Auth）。
- Hew 同源登入單元、產物建置及 Chromium WASM 測試以 fork 分支最新 CI 為準；未取得結果前不可寫 PASS。
- Hew `.github/workflows/lizhi-model-host-ci.yml` 準備編譯 `app/dist` 成 `--base=./` 的**可嵌入候選產物**，並另驗證 production iframe 中 mock 同源 Supabase Auth/RPC → 真 Hew WASM → 版本 ACK。此流程 **非正式 Supabase E2E**，亦不會部署網站。

## 待完成的正式發版

1. 確認 fork 最新 Rust/WASM + production iframe Chromium 及同源安全測試全部 PASS。
2. 將**固定且已驗收版本**的 `app/dist`（相對路徑打包）部署到原 Github Pages 同源 `hew-editor/`，不能把主網站改指向跨來源 Hew 服務，也不能用遠端視覺檢視器替代。
3. 驗證 `?open=hew3d` 的父頁 Google 登入及子頁 `window.parent.LizhiAuth`，開啟本人操作 120 秒。
4. 回到一般 ChatGPT 呼叫 `model_status` 確認出現授權 session_id；只在使用者明確授權下送出一筆 1200×600×750mm `model_create_box`；以 `model_job_status` 查 `succeeded`；必要時按「領取並處理一筆工作」，單次不重試。
5. 驗證 .hew 真正儲存、重開之後的文件 ID/revision 是否可穩定關聯（目前 per-page UUID，**跨重載文件身分尚未完成**）。
6. 只有通過上述 E2E，才合併既有 Draft PR；目前 **main 和正式 Pages 都沒變**。

開發與驗收均不得修改原「立之 CAD 指令代理」、手機 MCP、GLB 模型檢視器或現有模型檔。
