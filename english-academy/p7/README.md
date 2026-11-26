# P7｜立之英文學習教室：正式環境整合「準備」與分項發布方案

> 狀態：**僅開發分支與合成資料測試／未部署**。本文件不是正式部署指令，也不是本人批准。使用者說「P7」允許先行製作 P7 候選，不授權修改正式 Supabase / 私人 Site / GitHub main / GitHub Pages。

## 2026-11-15 唯讀核查結果

- 原 Supabase 專案：\`hrdzywkihfqggiwjgavi\`，狀態 ACTIVE_HEALTHY，PostgreSQL 17。公開 schema 現有 42 張資料表、Edge 22 項；未找到任何正式 \`english_*\` 資料表，也未找到 \`lizhi-english-academy\` Edge。**不能聲稱 P1～P6 已上線**。
- 雲端庫主站的 GitHub \`main\`：未在 \`auth.js\` / \`app.js\` 配置 \`?open=english\`。P6 隔離分支已有帶本人登入的候選主站路由，會嵌入 \`english-academy/live/\`（後端未部署時應拒絕存取，不顯示假資料），可另開 \`preview/\` 測試。
- 已有私人 Site \`/mcp\` 將 AI 工作台工具經轉接走 Edge，並另保留照片操作；此路由為在職系統一部分，**不得被新英文工具完整替換**，且應實際列舉確認 Side／立剪等工具是否已由最新 Edge 供應。
- P6 已有 P1～P6 合成測試與 REST／RPC 候選；不能把真實 Google/ChatGPT 身份綁定和正式服務端批准視為完成。

## 候選整合模組

1. \`owner-boundary.mjs\`：網站端後端 Google/Supabase Auth 身分驗證，需透過受信任服務驗證 Access Token、實際 session 狀態及本人 owner allowlist；不相信前端 Email、\`user_metadata\` 或 \`ownerId\`。ChatGPT Site 需驗證 Site 原生身份，再透過獨立後端綁定到同一 Google owner。所有未設定真實 verifier 的情況都拒絕。
2. \`site-mcp-compat.mjs\`：保留既有所有 MCP 工具及順序，逐個檢查原工具有無消失。英語工具一律 \`english_\` 前綴，禁止撞名，預設不列出正式卡寫入工具；所有工具呼叫須重新驗證 Site 身份與伺服器持久化 owner 連結，不允許模型自填擁有者或批准。
3. \`safe-p1-edge.mjs\`：已接入**未部署候選** \`supabase/functions/lizhi-english-academy/index.ts\`。在安全批准交易和驗證器正式備妥前，對 \`POST /card\`、\`/accept\`、\`/ignore\` 回 \`403\`；不能直接相信前端傳入 \`userConfirmed:true\`。保留符合登入的資料讀取與暫存候選建立。此防護會**限制正式卡功能**，所以不得僅部署此 guard 就宣稱英文教室可以正常學習。
4. \`schema/20261115_p7_owner_link_and_consent_candidate.sql\`：完全未套用的 PostgreSQL 17 草案；將 Site-to-owner 綁定與正式卡批准記錄放在**未暴露的 \`english_internal\` schema**，拒絕前端 role 讀寫。受限 RPC 在同一 transaction 內消耗受信任批准並呼叫 P1 promotion，保護 requestId、owner、期限、重試一致性。這仍須由正式後端將來自已驗證 JWT 的 owner 綁定上去。
5. \`integration-preflight.mjs\`：只評估必要閘門、永遠沒有部署動作。P5 的 \`release-gate.mjs\` 保留 12 個實際證據與獨立安全審查要求，不被本純函式取代。

## 還需要完成的功能（部署前攔截項目）

- **正式可信批准與身分串接仍是缺口**：P1 原先 \`POST /card\` 可直接建立正式卡、\`POST /accept\` 依賴瀏覽器 \`userConfirmed\`；P7 Edge 候選先拒絕這些路徑，避免錯把 UI 文字當安全憑證。正式恢復需由本人的 Google 登入流程建立後端批准記錄、可撤銷，並由一個原子交易核對權限與完成寫入。
- **實際 OAuth/MCP 還沒實作完成**：P3 的 OAuth/resource metadata 與 P7 Site owner mapping 是契約候選。既有私人 Site 的 Site OAuth 身分與 Supabase Google user 不是相同帳號，必須用本人確認的「雙邊綁定」流程，並進行真實連線、登出與撤銷測試。
- **不要將前端允許的 Google Email 當正式授權**：主站可顯示單一帳號的登入門，但 Edge/DB 要以受信任 \`auth.users.id\`、allowlist 和 RLS 為準。
- **不要把現有 Site 的 \`tools/list\` 直接替換**：需蒐集發布前的完整工具 inventory，逐一比對原 MCP 功能與圖像回應，尤其 AI 工作台、照片、Side、立剪；新版 MCP HTTP 協定 header/_meta/舊 Site 路由要實際相容。
- **正式 Supabase 尚未建立任何 English 表**：若直接啟用網頁將遇到後端不可用，不應顯示虛構學習資料。
- **信任確認／資料保存**：學習錯句及經使用者指定的對話片段在上線前要有保存期限、刪除方式、資料範圍與隱私政策；正式客服或語言模型不能默默擷取所有私聊。

## 分項部署與回復手冊（僅方案，全部待批准）

### Stage A：獨立安全審查（不修改正式環境）
由獨立審查者驗證 P1/P5/P6/P7 schema、RLS/SECURITY DEFINER、OAuth token issuer/audience、RLS 跨 owner、資料保存、單次批准、P3 MCP 適配器、舊 Site 現況與所有測試證據。收集完整同意／回復需求。沒有這份審查不得進到 Stage B。

### Stage B：已核准的測試環境
本人**另行批准**受控測試環境及具體 schema 版本後，先確認備份與退回路徑，才依序套用 P1 → P5 → P6 → P7 SQL，完成正面／負面 owner、RPC、重試、撤銷及正式備份／回復驗證。禁止直接用正式資料充當測試樣本；需要時使用匿名測試帳號。

### Stage C：受控 Edge 與本人 Google/ChatGPT 雙向綁定
本人**另行批准**後才可建立/更新 English Edge，發布最小 scope，嚴格檢驗服務端 Google owner 與 Site owner；Site owner link 初始 disabled，需本人明確確認才啟用。所有後端 service-role 金鑰只存 Secret，永不進 GitHub 或瀏覽器。正式卡入庫需在單一交易消耗批准後才更新。

### Stage D：既有 Site 無損整合
先記錄現有 Site \`tools/list\` 的實際完整快照，再在**原有 Site 的候選程式分支**新增 P7 的 \`english_*\` namespace adapter。禁止另開平行 Site 或覆蓋舊路由。部署前後回歸 AI 工作台/照片/Side/立剪所有既有工具、權限與資料。新 Site 更新需本人批准，版本不相容立即停用英語分支並退回舊路由。

### Stage E：主站與實機端對端驗收
所有依賴驗收成功後，將已核驗之 GitHub commit 經本人批准才能合併 \`main\` / GitHub Pages。測試 \`?open=english\`，真實本人 Google 登入、候選卡/造句/FSRS 跨裝置、ChatGPT MCP 同步以及 A22 Android。不得因 PR/CI PASS 就提前對外發布。

### Rollback 原則
先停用 English 路由/寫入與新 MCP 工具，保留既有 Site/Side/AI 工作台，驗證對外權限已關閉；必要時**依另外批准的備份/回復計畫**回復正式 Edge/Site/main。對正式資料不得自行 DROP、清空或覆蓋；schema 退回可能損失學習事件，需完整備份＋使用者確認。所有錯誤留稽核紀錄。

## 統一驗收清單

G01-G12 以 P5 現有 Google Drive「集中正式驗收矩陣」為準；P7 增加檢查：P7-A1 真實 Site→Google owner 雙向綁定及撤銷；P7-A2 完整現有工具 inventory 不遺失；P7-A3 正式單字受信任批准與原子交易；P7-A4 版本不相容及關閉英語功能的回退；P7-A5 本人**分別**批准 schema、Edge、Site、GitHub main、GitHub Pages 操作。

本階段只有開發資料與合成測試。正式使用者資料、金鑰、Site 設定、main 分支及正式 Supabase 全部不動。

連結：P6 Draft PR #65 https://github.com/lihuany635-create/lizhi-cloud-web/pull/65
P5 驗收矩陣 https://docs.google.com/document/d/1jyTf8jA6Rp9mzFEPBiEHe0eRDjuwUcGSH4YhO18n1Lc/edit
專案資料夾 https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
