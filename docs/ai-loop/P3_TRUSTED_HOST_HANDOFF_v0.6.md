# 立之 AI 多代理協作迴圈｜P3 受控 MCP 唯讀宿主候選 v0.6

日期：2026-10-28（Asia/Taipei）
工作台專案：`61b88bec-9b3e-49e6-8780-d073fc816516`
PR：`https://github.com/lihuany635-create/lizhi-cloud-web/pull/43`（草稿，不合併 main）

## 使用者已核准的界線

第一版單一 AI 分 Planner／Executor／Reviewer／Repairer／Handover 五角色，未來才接獨立多 AI；啟動可手動／自動切換，但**正式 AUTO 尚未授權啟動**；逐步開放自動寫入，重大操作須本人核准。不得擅自啟用新付費 API、修改正式財務／手機／CAD／模型資料或部署正式站點。

## 完成與測試

新增：
- `experimental/ai-loop/trusted-mcp-host.mjs`：對接現有 `/mcp` 的 JSON-RPC `tools/call`，僅允許 `list_projects`、`get_project_context`、`get_project_handoff`。驗證固定 HTTPS 原點、密鑰由可信伺服器回呼取得、人工單次執行、不跟隨轉址、無自動重試；HTTP 與 JSON-RPC 格式失敗則安全停止。只抽取去識別化最小摘要，不把來源內容或金鑰送給角色。
- `experimental/ai-loop/trusted-mcp-host.test.mjs`：新增 24 項測試，涵蓋工具白名單、伺服器認證回呼、過期與撤回、格式、401、轉址、資料版本和禁止 AUTO。

本機 Node v22.16.0：既有 64 項 + 新增 24 項，**88/88 PASS, 0 FAIL**。
GitHub Actions：**Run #40641564035**、Job #122660661889，Job conclusion=`success`，實際查核 Log 含 `# tests 88` / `# pass 88` / `# fail 0`；對應原始碼 commit `70498b5888e1641dcba8098bb8d9915e37d0b70c`。
GitHub blob SHA：host `0e7a3d5fe5751c17d89a05f1e2018c8d6ab92274`，test `d79e7fdc530c79b04b93862af30c0df4f15af5aa`。兩項均已由 GitHub fetch_file 讀回、與本地 git hash-object 相符。

在**本對話內**使用真正受授權的工作台 MCP 執行五次唯讀操作：list_projects→get_project_context→get_project_handoff→get_project_context→get_project_handoff；同專案、同 revision 36 與任務摘要一致，第二次重新讀取無差異。這是 ChatGPT 的真實 MCP 唯讀驗證，**不是 Node 宿主透過正式 Secret 做的完整 E2E 測試**。

## 尚未完成（不可標作完整 P3 PASS）

- 本地/CI 透過注入的 fake HTTPS fetch 和 fake server verifyOwnerSession 驗證契約。**沒有**任何可由獨立 Node Worker 使用的正式 MCP Bearer Token 或受信任 session verifier；Node 宿主尚未以真實身分直接讀取正式站台，也沒有部署。
- Node 無權沿用 ChatGPT 本對話的私有授權；不得竊取、輸出、轉交既有 ChatGPT plugin/MCP token。未經本人確認不可部署新 OAuth、Secrets、Edge、Site 或連線權限。
- **沒有**自動常駐 Worker、正式排程、真實 AI 模型推理、跨模型交叉審查、正式寫入或即時手機/CAD/理財操作。
- `verifyOwnerSession` / `getBearerToken` 是必須由**實際授權的伺服器宿主**提供的可信回呼；測試代碼 mock `authenticated:true` 僅供模擬，絕不可直接接到正式後端。
- 本次工作台只會保存候選原始碼、CI 證據與交接；P3 任務應保留 `IN_PROGRESS`。P2-A 模式 UI 依舊未完成。

## 下一步（必須另行具備真實授權）

先審查既有私有 Site 是否可在原站加一層**僅本人**的受控唯讀執行宿主，不新建公開入口：其伺服器內部驗證當前身份和 session expiration，將工作台固定三工具的 MCP credential 以 Secret 管理，不回傳給瀏覽器/AI/CI。使用測試專案執行真正的 host→MCP live readback，確定身份不可偽造、撤權立即失效、session receipt 可以跨工作階段接續。**實際需要變更正式 Site 或 Secrets 前需取得本人的明確核准**。權限缺失不能靠 mock 補過驗收。

在授權 E2E 尚未完成前，可以繼續 P4 的**隔離** Reviewer / Repairer / Handover 迴圈，但不得寫正式工作台或宣稱真正多 AI 已連動。
