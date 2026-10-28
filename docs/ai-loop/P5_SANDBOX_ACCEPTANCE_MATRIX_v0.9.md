# 立之 AI 多代理協作迴圈｜P5 AT01–AT10 隔離驗收矩陣 v0.9

- 日期：2026-10-28，Asia/Taipei
- 工作台：`61b88bec-9b3e-49e6-8780-d073fc816516`
- 分支：`feature/ai-loop-p1-spec-sandbox-20261028`；PR #43 仍為 Draft，不合併 main。
- **限制**：此文件只映射本地/CI 沙盒測試。所有項目「沙盒範圍 PASS」≠真正獨立多 AI、永久授權宿主、正式 MCP E2E 或本人核定；後者仍標 NOT_TESTED。

| 規格 | 沙盒檢查 / 對應實測案例 | 沙盒範圍 | 尚未驗收 |
|---|---|---|---|
| AT01 手動五角色執行與讀回交接 | `loop-core.test.mjs: AT01`、`role-adapter.test.mjs: P3-01`、`durable-review-integration.test.mjs: INT-01` | PASS：人工啟動、模擬角色、隔離SQLite交接讀回 | 真實五角色模型操作與正式工作台寫回 |
| AT02 AUTO與事件防重 | `loop-core.test.mjs: AT02`、`durable-queue.test.mjs: P2-01,P2-03`、`INT-04,INT-09` | PASS：AUTO模擬白名單、重複事件拒絕，OFF預設 | 正式UI、本人身份驗證、實際AUTO事件來源，均未啟用 |
| AT03 Reviewer退回及Repairer再審 | `loop-core.test.mjs: AT03`、`review-repair-sandbox.test.mjs: P4-02`、`INT-02` | PASS：缺陷→修正→重新讀回→sandbox handoff | 真實 AI 獨立審查與真正成果讀回 |
| AT04 修正上限 | `loop-core.test.mjs: AT04`、`P4-03`、`INT-03` | PASS：兩輪後仍不合格轉NEEDS_OWNER | 真正模型 token、時間與額外API費用上限 |
| AT05 防重與版本/逾時對帳 | `loop-core.test.mjs: AT05（三項）`、`P2-06,P2-09,P2-17,P2-19`、`INT-05,INT-06,INT-12,INT-13,INT-14` | PASS：事件/請求ID、SQLite重開及跨程序租約到期後只讀對帳 | 正式MCP 目標冪等/真正外部寫入副作用 |
| AT06 暫停及STOP | `loop-core.test.mjs: AT06`、`P2-11,P2-12`、`P4-13,P4-14`、`INT-10` | PASS：不領新任務，執行中不虛稱已取消 | 正式遠端job撤銷及不能撤銷時的服務端補償 |
| AT07 未授權正式寫入與付費拒絕 | `loop-core.test.mjs: AT07（兩項）`、`P3-09,P3-10`、`P3-HTTP-05~11`、`INT-08` | PASS：測試回呼阻擋L2/L3/付費操作，mock宿主只允許唯讀 | 真正服務端owner session與核准回呼，付費帳戶未接入 |
| AT08 缺證據不可PASS | `loop-core.test.mjs: AT08`、`P4-08~12`、`INT-15,INT-16` | PASS：缺SHA/讀回/偽造核定不能算已證實 | 真正artifact 原檔檢查、外部版本、現場/圖片等 |
| AT09 中斷恢復 | `loop-core.test.mjs: AT09`、`P2-04,P2-19`、`INT-01,INT-12,INT-13,INT-14` | PASS：SQLite重開、獨立Node子程序中斷後安全對帳，不盲重試 | 多主機/雲端Worker、實際背景復原與告警 |
| AT10 跨專案隔離 | `loop-core.test.mjs: AT10`、`P2-13`、`P3-MCP-06,P3-MCP-07`、`INT-11` | PASS：test projectId隔離，拒絕跨專案回傳 | 真實服務端跨帳號/跨專案安全實測 |

## 實測統計與證據

- 本地 Node 22.16.0：`node --disable-warning=ExperimentalWarning --test experimental/ai-loop/*.test.mjs` → 120/120 pass，0 fail。
- GitHub Actions Workflow：AI loop isolated sandbox tests；Run `40642921965`，job `122664999151`，**已實際核對 log** `# tests 120 / # pass 120 / # fail 0`。對應原始碼測試提交 `6302d105370d2b4616802ec2e413aa913d46c7ad`；其後文件提交不應自動推定需要重新部署。
- 主要新源碼：`experimental/ai-loop/durable-review-integration.mjs`，blob `3d4546ab6914ac5944210d5b19f1f50b190fac8c`；測試 `durable-review-integration.test.mjs`，blob `49477751d12d76bbc8d2f2e503129465b381da7b`。
- PR #43 正式合併/發布：**未執行**。工作台正式交接 write-back：**未由獨立worker執行**。作者驗收：**未取得**。
- P5 真實 E2E 驗收應等待 owner-scoped 服務端宿主具備正式授權、分級寫入閘門、必要使用者確認，以及可讀回外部副作用的 mock->staging 過程；不應擅自解鎖。

## 後續
本次只可標示「AT01–AT10 沙盒範圍證據彙整完成；正式端到端 NOT_TESTED」。下一步建立 P5 的可重現測試資料包/腳本，讓使用者未來授權時逐項由真正 MCP 套件進行驗證。保持 AUTO OFF、額外付費API停用、正式業務資料不動、草稿PR未合併。新對話須重新讀取 LIZHI-AI-BOOT / AI-RULES 與工作台當下revision。
