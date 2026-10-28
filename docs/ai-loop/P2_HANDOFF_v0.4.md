# 立之 AI 迴圈｜P2 SQLite 隔離調度器交接 v0.4

日期：2026-10-28，適用工作台專案 `61b88bec-9b3e-49e6-8780-d073fc816516`。

## 授權界線

使用者決定：單一 AI 先分為 Planner / Executor / Reviewer / Repairer / Handover 角色原型，之後才接多模型；模式 MANUAL / AUTO 可切換；逐步開放寫入，但重大操作本人核准。此次工作**僅開發可在離線本地環境測試的佇列**，不新增付費 API，不啟用正式背景排程，不寫入正式業務資料。

## 已實際完成

- P1 `SandboxLoop` 原始碼與十五項測試保留不改。
- 新增 `DurableSandboxQueue`，Node 22.16 內建 `node:sqlite`，資料寫入測試用 SQLite WAL 檔，`BEGIN IMMEDIATE` 確保交易序列化，`synchronous=FULL`。不是 Supabase migration。
- 管理模式：OFF（新建預設）、MANUAL、AUTO（僅 mock 允許事件）、PAUSE、STOP。
- queue 資料與事件去重：project_id + event_id 唯一；同 eventId 若 payload 不同會被拒絕；讀取 projectId 必須匹配。
- 任務 claim / begin / heartbeat：revision CAS、單活躍任務全域上限、worker/lease owner 比對、期限驗證，並保存 attempts 與不可覆寫 audit。
- 工作結果提交：projectId + requestId 去重，對相同 requestId 重送只回原結果；不同 payload 拒絕；外部寫入未知時標 NEEDS_OWNER，不重送。
- 任務期限與恢復：逾時轉 RECONCILE_REQUIRED；重新啟動後 `sweepExpired` 可找到過期工作；回覆未知保持 NEEDS_OWNER；已證明有副作用可標 SUBMITTED；只有聲稱已查清「無副作用」且取得 mock ownerApproved 才重回 QUEUED。**真正的外部查證尚未實作**。
- 離線 Node 測試：P1 15／15，P2 20／20，總計 35／35；測試包括 SQLite 關閉重啟、不同 Node 程序實際並行爭搶一筆任務、資料回滾、請求帳本/租約、AUTO 關閉、STOP、逾期恢復與跨專案限制。

## 可核對的驗收範圍

- 本地 SQLite 持久化、同步交易的 mock queue / 事件 / attempt / lease / heartbeat / expire / reconcile / mode/STOP。
- 沒有任何 Node 子程序長期常駐，測試中所有工作都在當次命令執行結束。
- `P2-15` 使用兩個分開的 Node 程序並行 claim，只有一個成功；不是只用同一程序模擬競爭。
- Node 內建 `node:sqlite` 目前為實驗性 API，需要注意升級相容性；若後續部署 Supabase 需重做資料模型與權限，不能把此本地檔直接等同正式可靠佇列。

## 還不能宣稱已完成

1. 不是 ChatGPT 內建的多 AI Worker，也沒有真正模型呼叫。
2. 尚無真正人工核准驗證；`ownerApproved=true`、`allowlisted=true` 是 MOCK，永遠不可信任作為正式授權憑證。
3. 尚未串工作台與真實 MCP；不包含原站網頁開始/停止按鈕、Supabase RLS、私有站點部署、正式AUTO事件或 24 小時排程。
4. 尚無分散式時間同步、租約續約在多節點的全部競態測試、真實外部副作用對帳。
5. 不含獨立 Reviewer 的真實證據審查、Repairer 的正式修正與 Handover 的工作台實際讀寫全鏈；那些屬 P3/P4/P5。
6. 本地測試 PASS 不能當正式 GitHub CI 成功，除非實際讀到 CI 成功的 job/run。

## 建議下一步

先將 **P1+P2 版本化原始碼與 35 項測試**放入隔離 GitHub 分支，並完成 CI 測試；下一階段 P3 只允許連 sandbox mock adapter 或現有安全唯讀 MCP，實作五角色輸入輸出與真正的 readback 驗證；再討論 Web UI / owner 授權。**不將本機佇列放到正式 Edge，也不開正式 AUTO。**
