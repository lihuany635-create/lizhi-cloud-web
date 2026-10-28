# 立之 AI 多代理協作迴圈｜P4 審查・修正・交接隔離原型 v0.7

- 日期：2026-10-28（Asia/Taipei）
- 工作台專案 ID：`61b88bec-9b3e-49e6-8780-d073fc816516`
- GitHub 草稿 PR：[ #43 ](https://github.com/lihuany635-create/lizhi-cloud-web/pull/43)
- 狀態：**本地原型與 CI 待核對；不是正式多 AI／MCP 寫入／作者核准**
- 原則：既有工作台為唯一正式任務與驗收真相；本原型只能操作隔離 sandbox port

## 原型範圍

新增 `experimental/ai-loop/review-repair-sandbox.mjs`：

1. 每次 Executor 或 Repairer 交付 sandbox artifact 後，Reviewer 都以獨立 read port 重新讀取目標，確認 projectId、版本與 SHA-256。
2. 使用可信宿主提供的 deterministic `assessArtifact` 回傳 defects；沒有 defects 才可提出 `REVIEW_PASSED` 候選，並不是模型或作者正式核定。
3. Repairer 只提出下一個候選 `content`；每輪重新產生 artifact 和重新 Review，預設最多兩輪修正；仍失敗轉 `NEEDS_OWNER`，避免無限循環。
4. Handover 只寫入注入的隔離 recorder；唯一 recordId 必須再次讀回逐欄核對，`authorApproved` 一律 false。不得改正式工作台 revision。
5. STOP／取消授權停止後續步驟；效果未知的 artifact 或 handoff 寫入不盲目重試，回傳 `NEEDS_OWNER`。
6. 風險 L2/L3、付費 API、AUTO 及跨專案任務在送出任何操作前拒絕。

新增 `experimental/ai-loop/review-repair-sandbox.test.mjs`：16 個本地測試，包含立即通過、一次修正、兩次仍不合格、未確認寫入、交接讀回缺失、偽造本人核准、來源被改變、版本錯誤、STOP 和越權拒絕。

本地 Node v22.16.0 與 P1～P3 測試合併：**104/104 PASS**（64 項先前測試 + P3 HTTP 宿主 24 項 + P4 16 項）；GitHub CI 結果請以最新 workflow run/job log 實際讀回為準。

## 重要限制

- 此程式的 `writeSandboxArtifact`、`readSandboxArtifact`、`appendSandboxHandoff`、`readSandboxHandoff`、`assessArtifact` 和 `proposeRepair` 都是**外部注入**的隔離 port。測試使用 Map 與 deterministic callback，**沒有真實 AI 推理或真正獨立 Reviewer**。
- 外部 port 必須由可信宿主限制為隔離資料；如果有人錯把正式寫入 callback 注入，本模組不會憑空提供保護。正式連接前需獨立資源隔離與權限驗證。
- 來源 readback 的真實性只有在目標 MCP 端真實讀取、驗證 hash 和權限後才成立。對測試 fake map 的讀回不是正式工程資料驗證。
- P3 仍缺獨立 Worker 的真實伺服器授權及身份查核；P4 的 mock PASS 不解除此阻礙。
- 沒有部署、Migration、正式 AUTO、付費 API、手機/CAD/理財/模型正式寫入；GitHub PR 維持 Draft，main 未變。

## 下一步

維持 P3 `IN_PROGRESS`；P4 可標 `IN_PROGRESS` 並將「本地/CI 隔離通過」作為**限縮範圍的實際紀錄**，不能把整個 P4 標成正式 PASS。接續應將 P2 DurableSandboxQueue 與 P4 isolated Reviewer/Repairer/Handover 串成單一可重啟的端到端 mock 工作流，確保依賴、失敗対帳、同 requestId 去重和交接讀回一致，再用實際授權的唯讀 MCP 測試銜接。正式站點／Secrets／雲端背景 Worker 變動前仍須本人核准。

每個新對話先讀 `docs/AI_NEW_CHAT_BOOTSTRAP_v1.0.md`、`docs/AI_EMPLOYEE_HANDBOOK_v1.0.md`，再讀本工作台最新 revision，不要把文件中引用的歷史 revision 當現況。
