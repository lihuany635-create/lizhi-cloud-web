# 立之 AI 多代理協作迴圈｜P2＋P4 持久化交接整合 v0.8

- 日期：2026-10-28 Asia/Taipei
- 專案 ID：`61b88bec-9b3e-49e6-8780-d073fc816516`
- PR：[ #43 ](https://github.com/lihuany635-create/lizhi-cloud-web/pull/43)，保留 **Draft**，未合併 `main`。
- 本文件只代表**本地沙盒集成及已核對的原始碼**，不是正式 MCP / AI Worker / 作者核定。

## 一、需求界線
使用者已確認：一個 AI 先分角色試作，再接獨立多 AI；MANUAL 與 AUTO 可切換；逐步開放寫入，重大操作本人核准。這個測試版不開付費 API、不建立正式 worker、不碰任何正式業務資料；AUTO 預設 OFF，原型整合只接受 MANUAL。

## 二、整合原始碼
- `experimental/ai-loop/durable-review-integration.mjs`：把 P2 的 `DurableSandboxQueue` 與 P4 `SandboxReviewRepair` 串接。額外在**同一測試 SQLite 資料庫**建立 `integration_artifacts` 與 `integration_handoffs`，各自使用 project/job/attempt 或 requestId 的唯一約束。所有資料都是本地模擬成果。
- `experimental/ai-loop/durable-review-integration.test.mjs`：16 項整合測試。

原型使用 `node:sqlite`（Node.js 22.16.0 的實驗性 API），配合 P2 既有 WAL、`BEGIN IMMEDIATE`、revision CAS 與 lease。執行流程：manual enqueue → claim → begin → P4 sandbox artifact write/read → reviewer assess → 最多 2 輪 repair → handoff save/readback → P2 submit。一個 requestId 的已記錄成果不可盲目重複。

## 三、失聯與防重
1. 發出隔離 artifact/handoff 寫入時，對應唯一鍵若已存在，僅在內容一致時返回相同 ID；若內容不同則拒絕，避免覆寫。
2. 已 `SUBMITTED` 任務不允許再次 `runOnce`。
3. 如果程序在寫完成果、但尚未 `queue.submit` 前中斷，狀態仍 `RUNNING`；租約到期後 `sweepExpired` 只會標 `RECONCILE_REQUIRED`。
4. `reconcileAfterInspection` 僅在**本地**證據完整且 SHA 一致的前提下，容許提交「隔離成果存在」的對帳結論。這項函式與測試中的 `ownerApproved` 旗標**不是正式本人認證**，不得直接映射到真實財務、手機、CAD、模型或工作台寫入。
5. STOP / PAUSE 阻止後續派工；未知外部副作用不得依靠重試來消除不確定性。

## 四、測試紀錄
- P1–P4 原有隔離測試 104 項；本輪新增 INT-01 至 INT-16，共 **120 項**。
- 本地 Node.js 執行 `node --disable-warning=ExperimentalWarning --test experimental/ai-loop/*.test.mjs`：**120 pass／0 fail**。
- INT-14 以另一 Node.js 子程序執行並在交接後模擬程序異常退出，再由另一個程序讀取 SQLite；無重複工作重派。
- 本輪新增 GitHub Blob SHA：integration module `3d4546ab6914ac5944210d5b19f1f50b190fac8c`；test module `49477751d12d76bbc8d2f2e503129465b381da7b`。兩者已用本地 `git hash-object` 與 GitHub `fetch_file` 對照。
- GitHub Actions CI：以當前 PR 的最新 Run/Job **實際讀回結果**為準；沒讀到成功前不得宣稱 GitHub CI PASS。

## 五、不能宣稱完成的事
- 未有受信任伺服器憑證供獨立 Node Worker 自主呼叫 owner-scoped MCP。
- 未有完整多 AI 推理與獨立模型審核。
- 沒有持續背景排程、正式 AUTO、Site UI 或 Supabase durable queue；測試中的 SQLite 不跨主機叢集，也不提供生產級高可用。
- P4 readback 來自隔離 SQLite，**不等於正式工作台的 get_project/read-back**；這段尚需真正授權與分層驗收。
- 本輪沒有正式 deployment / migration / Secrets 變動，沒有新增付費 API，也未合併 PR。

## 六、下一個可執行工作
在**沙盒**完成 P5 的 AT01–AT10 對應矩陣與失聯／權限／對帳驗收；檢查協調器、角色隔離 port 和證據鏈。之後獨立規劃真正受信任的 owner-scoped server host，須逐項取得實際授權與實測，不可從 sandbox CI 推導正式可用。接手時先讀 `LIZHI-AI-BOOT`、`LIZHI-AI-RULES` 和工作台最新 revision。
