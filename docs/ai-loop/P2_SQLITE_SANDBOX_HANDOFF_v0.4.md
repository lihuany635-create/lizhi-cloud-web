# 立之 AI 多代理協作迴圈｜P2 隔離調度器交接 v0.4

日期：2026-10-28（Asia/Taipei）；工作台 projectId `61b88bec-9b3e-49e6-8780-d073fc816516`。
狀態：本地原型實作與測試；**沒有正式部署或連接正式 MCP 寫入**。

## 已確認的需求
使用者決定：第一版單一 AI 分 Planner／Executor／Reviewer／Repairer／Handover 角色；手動與自動模式可切換；逐步開放寫入，但重大操作必須本人核准；暫不啟用新增付費 API，亦不得修改正式業務資料。

## P2 在本地容器實際完成
以 Node v22.16.0 內建實驗性 `node:sqlite` 完成 `DurableSandboxQueue`，採 SQLite WAL、`synchronous=FULL`、`BEGIN IMMEDIATE` 交易，執行期資料全存隔離的本地 SQLite 檔：
- 首次建立預設 OFF；MANUAL／AUTO 僅允許相符觸發；AUTO 的白名單目前是**mock 測試參數**，不是正式身份驗證。
- projectId + eventId 事件去重；同 eventId 搭配不同任務或內容拒絕；專案 ID 必須一致。
- 單一活動租約、revision CAS、worker owner 核對、`claim`／`begin`／`heartbeat` 與操作稽核。
- 對同 projectId + requestId 建立防重帳本；重播相同結果不會再提交，內容不同則拒絕；未知結果轉 NEEDS_OWNER。
- PAUSE 保留待處理任務但不能領取；STOP 取消未開始任務，已開始者轉 NEEDS_OWNER。
- `expire` 與 `sweepExpired` 處理原執行者失聯，轉 `RECONCILE_REQUIRED`，**不盲目重送**。要重新進佇列，需先模擬讀回 NO_EFFECT 並模擬本人同意；EFFECT_PRESENT 保留 SUBMITTED；UNKNOWN 進 NEEDS_OWNER。
- 內部記錄 jobs、triggers、effects、attempts、audit，所有 SQL 寫入經本地交易。

## 實測結果與嚴格範圍
本地 Node `--test` 實際跑 35/35 PASS（P1 15、P2 20），0 FAIL。P2 涵蓋檔案關閉重開、模式切換與事件防重、CAS 與全域單工、租約心跳與逾期、失聯重啟掃描、人工對帳決定、防重結果存檔、PAUSE／STOP、權限界線、transaction rollback、跨專案隔離，以及**兩個獨立 Node 子程序同時競爭同一筆佇列任務**只允許一方成功。

本次測試僅是本地 mock 行為，不等於 GitHub CI、真實 Supabase Queues、真實多 AI、正式 MCP、ChatGPT 背景排程或站點 Web UI。另沒有做真正的目標服務讀回；`readbackId` 和 `ownerApproved=true` 目前只是 mock 參數，**在真實環境不可作授權或證據**。

## 可下載原型包（本對話附件）
`lizhi_ai_loop_p2_sandbox_v0.4.zip`
SHA-256：`fd0922c09ab1b27aed3003a48d7e414a2f32ca62147c3ac360def79b6aeb4196`
包內有 `experimental/ai-loop/durable-queue.mjs`、`durable-queue.test.mjs`、`loop-core.mjs`、`loop-core.test.mjs`、`queue-claim-cli.mjs`、README、P1/P2 文件與 TAP 報告。**此分支目前只有文件；完整 P1/P2 程式碼與測試仍在對話附件內，未放進 GitHub PR，不可將 PR 說成 CI 已驗收。**

## 後續接手步驟
1. 先讀 `docs/AI_NEW_CHAT_BOOTSTRAP_v1.0.md` 和 `docs/AI_EMPLOYEE_HANDBOOK_v1.0.md`，再使用 `list_projects`、`get_project_context`、`get_project_handoff` 讀取本專案最新修訂與實際阻礙。
2. 將完整原始碼與 35 項測試納入隔離 GitHub 分支，安排 CI；只有實際讀到 CI Run 才能標記 CI PASS。
3. 下一階段 P3：單一 AI 五角色接入隔離 adapter 和唯讀工具，實作真實證據讀回及授權 gate。不得用 mock allowlisted/ownerApproved 直接連上正式服務。
4. 保留工作台的正式任務/紀錄為唯一業務真相；此本地佇列不是第二份正式專案狀態。新增正式資料庫 schema、常駐 worker、AUTO 真正開啟或付費服務前要另外核准。
