# 立之 AI 多代理協作迴圈｜原私人 ChatGPT Site 身分、費用與 Bridge 相容性檢查 v1.7

- 更新：2026-10-28 Asia/Taipei
- 工作台唯一專案：`61b88bec-9b3e-49e6-8780-d073fc816516`。
- 開發位置：`lihuany635-create/lizhi-cloud-web` 原 Draft PR #43、原 `feature/ai-loop-p1-spec-sandbox-20261028`，未建立平行站點。
- **現況**：候選程式與沙盒測試；**無原 Site 發布、無 D1 實庫建表、無任何正式 Grant／授權切換**。
- 預算上限：**新增 NT$0／月**；任何未能證明免費失效關閉的情形均擋在部署前。

## 1. 費用不可跨平台混用（本版修正）

原有 v1.6 文件引用 Cloudflare Workers Free／D1 Free 的公開配額作參考，**不能將其直接當作 ChatGPT Sites 的當期額度、帳單方案或剩餘可用量**：

- **ChatGPT Sites（本專案真正的宿主）**：官方說明 Sites 在符合條件的 ChatGPT 訂閱中提供，處於 beta 並受**ChatGPT Sites 自身**的計量／使用限制；單 Site D1 容量文件標示 **10 GB**。實際管理、usage 或超限處理應以原 Site 自身可見的管理資訊與適用條款為準。官方：https://learn.chatgpt.com/docs/sites 、https://learn.chatgpt.com/docs/sites/managing-a-site 。
- **Cloudflare 原生 Workers/D1**：另有一套 Workers Free 100,000 requests/day、D1 Free 5m rows read/day/100k rows written/day、5GB account storage 等公開規格。這些**不是 ChatGPT Sites 帳單核定證據**。官方：https://developers.cloudflare.com/workers/platform/limits/ 、https://developers.cloudflare.com/d1/platform/pricing/ 。
- **Supabase**：已從帳戶連接器唯讀確認原組織 `plan=free`，原專案 `ACTIVE_HEALTHY`；但本輪未取得當期 Edge、DB、storage 或帳單計量。
- **GitHub**：原 repo `public`；現有 workflow 使用標準 GitHub-hosted runner，沒有發現新增付費 runner 的設定，但這也不代表所有 GitHub 功能沒有其他帳單。
- **未取得**：目前沒有可直接讀取原 Site 的用量、當期帳戶費用或原 D1 實際 rows／儲存使用量的站點管理工具。**額度核驗：NOT_TESTED**，不是零元保證。

## 2. 官方 Sites 身分資料與候選碼的差異

目前官方 Sites 說明明確列出 Sign in with ChatGPT 時轉送至伺服器的登入欄位包括：

- `oai-authenticated-user-email`
- `oai-authenticated-user-full-name`（可能不存在）

官方：https://learn.chatgpt.com/docs/sites/data-and-connections 。

**此文件不足以證明候選碼的 `oai-authenticated-user-id` 必然由受信任的平台注入、無法被來客偽造、且可用於權限核准**。即使使用官方列出的 email 標頭，仍須證明**原 Site 前門保護及直連源站無法繞過**。不能因「Site 只限本人可見」便讓任意可攜帶 `owner-id` 的請求取得授權。

v1.6 已把 `ManualReadHost.verifyIngress(req)` 設為強制可信服務端驗證器；目前原 Site 內的 `AI_LOOP_VERIFIED_INGRESS_CALLBACK` 僅是**候選注入點**，尚無經核實可在 Sites 環境產生可信函數 callback 的機制。不得將前端 bool、字面字串、同名 HTTP header、一般 Cloudflare `ctx.access` 示例或 Supabase JWT **未經驗證**地替代此 callback。

**結果**：在驗證器沒有被合法提供之前，原 route 必須拒絕執行（503 `INGRESS_VERIFIER_REQUIRED`），MANUAL E2E 仍 `NOT_TESTED`。

### 上線前的實際驗證條件

1. 用原私人 Site 當前平台 / 版本實際證明 authenticated owner 的唯一可信服務端主體來源，並證明其他 HTTP 來客不能覆寫。
2. 驗證未登入／他人登入／Header 偽造／直接連 origin／撤權後請求均拒絕，不得只驗證含有效文字的 mock header。
3. 若 Sites 無法提供可驗證上下文，改由已核對的合法身份提供者**經簽章驗證／server-side session introspection**取得 owner subject，且先審核現有身份對照，不能默認 Supabase user ID 等於 ChatGPT owner ID。
4. 不增加新的廣權 Bridge 憑證，不傳給另外的 Worker；原 Supabase `/bridge` 僅由同一受信任宿主、固定操作映射使用。
5. 未證實來源、方案和可回退版本前，不執行兩張 D1 表 SQL、不設 `AI_LOOP_MANUAL_ENABLED=true`，不提供正式 Grant，不修改 Secrets 或部署。

## 3. 實際修復：Workers 的 redirect 模式

官方 Cloudflare Workers Request 文件寫明 `redirect: 'error'` **不實作**，可於發送 HTTPS 前拋 `TypeError`；如果使用 `follow` 又可能將 Authorization header 傳給重新導向的站點。

因此把 `production/source/lib/ai-loop-v15.mjs` 之 `bridgeSource` 改為：

- `redirect: 'manual'`
- 若 HTTP `300–399`，返回 `SOURCE_REDIRECT_DENIED`，**不再向 Location 送請求**。
- 401、403、503 和其他非 200 狀態仍失敗關閉；不重試、不記錄 Token。
- 新增 `V15-20` 隔離測試：模擬 302，確認請求只送一次、redirect mode 是 manual，不洩漏 bearer。

官方：https://developers.cloudflare.com/workers/runtime-apis/request/ 。

## 4. 權限／部署／驗收狀態

| 項目 | 本版狀態 |
|---|---|
| 安全修正 GitHub 原始碼與隔離測試 | 已提交原 Draft PR #43；具體 CI 狀態依當次實際 job log |
| GitHub／Supabase 帳戶基本方案唯讀核對 | GitHub Public、Supabase Free 已確認 |
| 目前 ChatGPT Site 帳戶用量／硬限制 | **NOT_TESTED** |
| 原 Site 的可信 server principal／直連來源防偽 | **NOT_TESTED／BLOCKED** |
| 原 Site D1 真實原子性與 read-back | **NOT_TESTED** |
| 正式 MANUAL 單專案三項唯讀 MCP AUTH01～10 | **NOT_TESTED** |
| 正式站點部署、兩張 D1 表、Secrets、Grant | **未執行** |
| AUTO／付費 API／跨專案或寫入工具 | **OFF／禁止** |

## 5. 待取得本人單次核准的前置資料

無需再重複要求既定原則。先由可信 Sites 管理環境確定：

- 原私人 Site 當前發布版、可回退版、前門與來源保護、可用真正已驗證 owner context 的方法；
- 原 Site 的用量與剩餘限制、是否會額外收費、超限是否自動拒絕；
- 原 D1 預估容量及兩張隔離表讀寫限額／清理期限；
- 含登出和跨帳號負向測試的可操作平台測試計畫。

以上任一未確認，**只做文件與隔離測試，不發真實能力、不宣稱 Worker 已上線**。確認後才向本人提出原 Site 單次發佈＋隔離 D1 建表＋短期 MANUAL L0 的具體核准請求。
