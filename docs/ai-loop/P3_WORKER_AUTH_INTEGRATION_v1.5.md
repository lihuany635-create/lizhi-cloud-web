# Worker 真實授權串接準備 v1.5

2026-10-28（Asia/Taipei）。延續同一專案 `61b88bec-9b3e-49e6-8780-d073fc816516`、分支 `feature/ai-loop-p1-spec-sandbox-20261028`、Draft PR #43。接手工作台 Revision **78**。本版為可執行候選原始碼及隔離測試，**未部署、未發真實 Grant、真實本人授權/MCP E2E 均 NOT_TESTED，P3 IN_PROGRESS**。

## 已查證的現有架構

- LIZHI-AI-BOOT、LIZHI-AI-RULES 均 1.0.0，main 與指定分支的 blob SHA 相同。已讀 v1.2/v1.4，不重建專案或重做歷史 186 項測試實作。
- 既有 Site `appgprj_6ad8267ce66c8191899aa5edc0c681af`，網址 `https://lizhi-animation-flow.lihuany635.chatgpt.site`。get_site 回傳 active、current_user_role=owner、access_mode=custom，allowlist 僅 owner，無外部訪客、無群組、automations=[]。最新保存 v24，source commit `8055ebb0860f8bb2ca1593588072a4fe56b512b5`，deployment `appgdep_6adf5b0f5f588191bb75da8b3f6e1096`；保存版本與 live 內容一致性尚未獨立比對，不將 GitHub 候選碼當成已上線原碼。
- Site 已有 MCP `/mcp`、D1 binding `DB`；唯讀 overview 僅查得 `animation_projects`，**沒有 Grant/audit 表**。不讀取表內私人資料、不修改現有表。
- Supabase `hrdzywkihfqggiwjgavi` ACTIVE_HEALTHY，`lizhi-production` v21 ACTIVE，verify_jwt=false。程式自身在 `/bridge` 驗證雜湊 Bridge Key，並綁定雲端 owner；直接網頁由 `/auth/v1/user` 驗證。不能把 verify_jwt=false 當成匿名可用，也不能把 Bridge 當窄授權。
- 只讀 information_schema 核對既有 `lizhi_production_state`/`lizhi_ai_runs` 欄位。Grant 不寫入這兩張表，不搬移專案、不改 Supabase schema。
- Supabase organization Free/tier_free；GitHub repository public。未取得 Sites/D1 的可驗證當期餘額與硬性費用上限，**不得宣稱免費方案保證任何未來部署/流量都是零元**。本輪不新增訂閱、模型/API、runner 方案或新站點。

## 信任邊界與實作

1. Sites dispatch 驗證登入及 Site 可見性 → 原私人 Site `/api/ai-loop` → 固定 owner 比對 → D1 Grant ledger → 固定唯讀執行序列 → trusted Bridge adapter → 原 Supabase owner 資料。
2. `production/source/app/api/ai-loop/route.ts` 是候選 route；`AI_LOOP_MANUAL_ENABLED` 缺省/非 `true` 時回 503，**連 Grant 儲存都不初始化**。沒有部署或啟用此變數。
3. 身分採 Sites 已驗證 `oai-authenticated-user-id`，比對既有 `PRODUCTION_CHATGPT_OWNER`；不接受 body 中的 verified/ownerApproved，service bypass bearer 本身不提供 visitor 身分。必須由平台入口覆寫/移除來客偽造 headers，不能直接公開 origin 或將本 handler 掛在會信任任意 header 的主機。這項平台防偽保障尚待真實 AUTH01/03 驗證，單純 Node Request 帶 header 不構成真實認證。
4. 不另建 OAuth/session 系統、不索取密鑰。原 Bridge Key 只由同一受信任 Site 的 source adapter 使用，Worker capsule 只取得固定 read 函數；不將 Bridge Key 傳給另一個獨立程序/AI、不提供任何任意 op/URL 的代理端點。本版是 **Site 內短時手動 Worker**，沒有外部常駐 Worker 或跨廠商模型推論。
5. 內部產生 256-bit 隨機 bearer，僅 D1 儲存 SHA256；bearer 不回傳瀏覽器、工作台、CI 或日誌。固定 project/audience（由宿主程式決定，不接受 caller 選擇）、MANUAL、60秒、最多5讀；狀態 ISSUED→RUNNING→DONE，失敗撤銷，不自動重試。這是內部 capability，未建立外部發證 API。
6. `list_projects` / `get_project_context` / `get_project_handoff` 為唯三工具，source adapter 每次獨立驗 schema、project 與固定 HTTPS endpoint，禁止 redirect。先讀三項，再獨立重讀 context/handoff，比 revision 與最小資料 hash。異動回 SOURCE_CHANGED，不標 PASS。
7. 最小摘要只含 project/revision/task id/key/status/unfinished count/hash，不傳來源全文、私有 URL、task title、Secret。response no-store，2KiB client body / 256KiB upstream body / 8秒 deadline，逾時含 stalled body 失敗關閉。
8. D1 UPDATE RETURNING 原子 claim/次數上限；UNIQUE(owner,request_id) 防跨 Grant 與實例重送；每次 source read 前後查持久撤權/期限。稽核含隨機 grant/request ID、固定 event/tool、時間；不含 token、原始 upstream exception 或來源資料。稽核失敗不能成功執行讀取或返回成功摘要。
9. `revoke` / `status` 僅同 owner，撤權永久存 DB，重啟不清除。已送達唯讀 request 無法保證物理取消，但撤權/逾時後丟棄結果、拒絕下一讀。Sites 身分是本次 request 的平台判定，**沒有獨立中途 session introspection**；登出/停用對下一 request 的效果、跨帳號隔離需實測，不能用本地 Grant 撤權代替 session 撤權證據。
10. Worker 不能寫工作台；輸出交接草稿，由已授權 ChatGPT 對原專案登記成果、證據和限制並讀回。本次交接寫入不代表 Worker 有寫權。

## 候選 SQL 與部署界線

`production/source/sql/ai-loop-v15-candidate.sql` 只是需核准的 D1 schema 候選（兩張新隔離表），不在 migration 自動目錄，程式不自動建表。不執行 migration、改正式 Secrets、改 Site audience、合併 main、部署或發正式憑證。只新增 GitHub 候選 route/module/SQL，原 `/mcp` 沒有被修改或增加工具。正式接線需從最新私人 Site source 做精確差分，不能用此 GitHub snapshot 全覆蓋私人 Site。

## AUTH01～AUTH10 證據分類

|案例|本地實際執行範圍|真實平台狀態|
|---|---|---|
|AUTH01|缺 owner、錯 owner、偽造 body flags 拒絕|NOT_TESTED|
|AUTH02|5次固定唯讀、重新審查及最小摘要|NOT_TESTED|
|AUTH03|跨 project/錯 source scope 拒絕|NOT_TESTED|
|AUTH04|三工具、參數、endpoint 白名單|NOT_TESTED|
|AUTH05|HTTP錯誤、redirect、壞 JSON、大小上限、stalled body/timeout|NOT_TESTED|
|AUTH06|revision/hash 改變時拒絕|NOT_TESTED|
|AUTH07|跨 ledger instance 撤權、到期、執行中撤權|NOT_TESTED（真實session撤權亦未測）|
|AUTH08|同 request 並行防重、不同 instance、SQLite 關閉重開|NOT_TESTED（雲端D1未測）|
|AUTH09|OFF/AUTO/CSRF 拒絕|NOT_TESTED|
|AUTH10|真實本地 SQL audit、無 private source/token，audit故障關閉|NOT_TESTED（雲端audit未測）|

本地 Node v24.22.1 執行原186項＋本版16項＝**202/202 PASS**，零失敗/跳過。Node SQLite 真正執行 SQL、重開檔案，Web Request/Response 與超時計時器實際執行；D1 interface shim、Sites identity headers、Bridge fetch 全為模擬，無正式 MCP/AI 網路呼叫。route 以 esbuild 0.28.0 成功 bundle（cloudflare:workers external），非完整 Site 生產 build/平台驗收。CI 另外使用既有 Node22.16.0/ubuntu-latest，需以實際 run/job 日誌核對。

既有 P5 evidence generator 已納入新測試及 candidate module/route/SQL 的 SHA256；`liveE2e=NOT_TESTED` 保留。CI 沒有 Secret、部署步驟或背景排程。

## 一次性待本人核准範圍（尚未獲准，不先執行）

在取得可驗證免費用量/硬限制後：只在原私人 Site 的 DB 建立上述兩張表、部署審查後候選 route/module、保留現有 audience/MCP/Bridge Secrets，確認平台入口 anti-spoof 身分驗證及受控撤權。允許短期將 `AI_LOOP_MANUAL_ENABLED=true` 作單 project MANUAL 逐案 AUTH01～10，只讀上述三工具，不外發 bearer，不開外部AI/API或排程；測後關回 OFF。需要真實第二帳號或登出/撤權操作的案例由本人操作。任一免費額度不明或測試失敗即停止；不得擴權。

啟用前仍需決定 ledger/audit 保存期限及人工清理、核對 D1 primary consistency 和 PRIVATE origin 封鎖，建立回退至原 Site v24（或屆時最新驗證版本）的記錄；不能以本地 SQLite 替代這些驗收。未獲核准前下一步是本人審核這份具體接線與驗收範圍，並補足平台免費用量證據。
