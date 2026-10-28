# 立之 AI 多代理協作迴圈｜單專案唯讀 Grant 參考原型 v1.4

日期：2026-10-28；工作台專案：`61b88bec-9b3e-49e6-8780-d073fc816516`。原 GitHub Draft PR #43，**僅隔離離線測試，不部署、不發真實 token、不改既有認證與資料庫、不合併 main**。

## 本輪實際唯讀核對

- Supabase 管理工具確認 `立之雲端庫` project `hrdzywkihfqggiwjgavi` 狀態 `ACTIVE_HEALTHY`；所屬 organization `huglclrkdejjdzwbpxma` 方案為 `plan=free`、`tier=tier_free`。**工具沒有提供可驗證的即時帳單與用量餘額；不得推論未來所有請求都是 0 元。**
- GitHub `get_repo` 確認 `lihuany635-create/lizhi-cloud-web` 為 `public`。本次只利用既有標準 GitHub Actions 的短時 CI，不啟用大型 runner 或新增計費服務。
- 現有工作台 `production/source/lib/store.ts` 使用 `PRODUCTION_BRIDGE_KEY` 存取 `/bridge`；**這是廣權伺服器憑證，不可直接交給獨立 Worker 再假稱是唯讀授權**。

## 新增原型

- `experimental/ai-loop/scoped-read-grant.mjs`：`ScopedReadGrantLedger`，僅用 Node 內建 crypto 與本地 Map，實作單專案、MANUAL/L0、三個唯讀工具、短效/限次/撤權、回傳最小化、無 token 的稽核與錯誤不盲重試。
- `experimental/ai-loop/scoped-read-grant.test.mjs`：22 個隔離負向與正向測試（GRANT01～GRANT22）。無真實帳號、MCP、雲端網路或正式發證。
- 本機 Node 22.16.0 全套 `node --disable-warning=ExperimentalWarning --test experimental/ai-loop/*.test.mjs` → **186 tests / 186 pass / 0 fail**（原 164＋新增 22）。GitHub CI 須以本次提交後的實際 Run/Job logs 讀回判定，不因本文件自動宣稱 CI PASS。

## 部署與權限限制

1. `verifyOwnerSession`、`canReadProject`、`readTool` 都是**可信宿主未來注入的 port**。目前測試以 fake server 回傳，程式自身**無法驗證本人身分**；不得相信前端 `verifiedByServer` 或 `ownerApproved` 值。
2. 本地 Map 不是多主機持久化授權儲存。正式部署必須實作服務端原子呼叫次數、跨實例撤權、session 停用查核、Grant 稽核、來源端專案權限隔離，並逐一實測 AUTH01～AUTH10。
3. 上游廣權 Bridge token 不得出現在 Worker、瀏覽器、GitHub CI、原始碼或工作台紀錄。正式服務端必須在**每個上游操作之前**獨立限制授權和只讀工具。
4. 尚未執行 Site / Edge 部署、Supabase migration、正式 Secret、外部模型、背景排程、AUTO、專業 MCP 寫入或 `main` 合併。
5. 真正的費用 hard cap 需由平台端方案和用量實測/設定；本地 zero-cost-guard 不是實際帳單保證。

## 下一步與授權閘門

先把本 PR 新增的 CI 結果、GitHub blob SHA 與限制讀回並記錄原工作台。若要轉成真實 L0 唯讀 E2E，應在**本人明確指定並核准的宿主**配置服務端登入/短效授權、可撤權儲存、真實計費用量檢查後，先進行一次 MANUAL 三工具讀取，完成 AUTH01～AUTH10；正式站點、收費或業務寫入另核准。此階段 P3/P4/P5 仍 IN_PROGRESS，AUTO 維持 OFF。
