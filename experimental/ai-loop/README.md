# 立之 AI 多代理協作迴圈｜P2 隔離佇列

本目錄包含 **P1 純記憶體模擬** 與 **P2 SQLite 持久化調度核心**，全部不連正式雲端服務、不進行真實 MCP 工具呼叫、不發送 API 或付費請求。

## 需求

Node.js >= 22.16.0。P2 使用 Node 內建實驗性 `node:sqlite`（此 Node 版本可能顯示 ExperimentalWarning），無需另外安裝 npm 套件。

## 測試

```bash
node --disable-warning=ExperimentalWarning --test experimental/ai-loop/*.test.mjs
```

目前本機測試：P1 15 項、P2 20 項，總計 **35 項**。此測試僅代表本地模擬實測，**不是** GitHub CI／Supabase／ChatGPT MCP 端到端驗收。

## P2 核心使用方式

```js
import { DurableSandboxQueue } from './durable-queue.mjs';
const q = new DurableSandboxQueue('/tmp/lizhi-ai-loop-test-only.sqlite');
q.setMode('MANUAL', {at:100000});
const {job} = q.enqueue({projectId:'sandbox-P',jobId:'test-job',eventId:'manual-1',kind:'manual',payload:{mock:true},at:100000});
const claimed = q.claim({jobId:'test-job',projectId:'sandbox-P',workerId:'test-worker',expectedRevision:job.revision,at:100001,leaseMs:60000});
const running = q.begin({jobId:'test-job',projectId:'sandbox-P',workerId:'test-worker',expectedRevision:claimed.revision,at:100002});
q.close(); // 重新開啟時能讀回 RUNNING 和原 attempt
```

重啟後先用 `sweepExpired({at})` 將逾時任務轉 `RECONCILE_REQUIRED`，**不會自動重新派工**。查證目標服務並取得人工確認後，才以 `reconcile` 決定保留 `SUBMITTED`、繼續 `NEEDS_OWNER`，或明確證明無副作用且本人允許時回到 `QUEUED`。

## 安全與限制

- 只有本地 SQLite、mock 輸入與測試工作；沒有 Supabase 雲端佇列、Webhook、AI 模型或正式 MCP。
- `allowlisted` 和 `ownerApproved` 在此只是測試參數，不是真實登入或核准憑證；不得連正式服務。
- P2 使用同步 SQLite、WAL、`BEGIN IMMEDIATE` 交易、事件鍵唯一、防重請求帳本、單工領取限制、原子租約、心跳、過期對帳、STOP 阻斷。
- P2 `SUBMITTED` 表示佇列中有一筆 mock 提交，未通過 Reviewer，更不是工作台 `PASS` 或作者核定。
- `RECONCILE_REQUIRED` 保守優先，unknown 外部結果禁止自動重試。真實 target 讀回需下一階段獨立實作，不能靠填一個 readback 字串充當查驗。
- SQLite 資料夾只放隔離資料，須限制檔案權限；目前未設計多租戶身份登入、服務端稽核權限，也不應把此檔放入正式 Site Worker。

## 檔案

- `loop-core.mjs`, `loop-core.test.mjs`：P1 既有 15 個模擬測試
- `durable-queue.mjs`, `durable-queue.test.mjs`：P2 本地持久化調度核心與 20 個測試
- `queue-claim-cli.mjs`：P2 跨程序競爭領取測試用
- `docs/ai-loop/P2_HANDOFF_v0.4.md`：P2 完整交接與剩餘阻礙
