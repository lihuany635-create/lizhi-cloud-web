# 立之 AI 多代理協作迴圈｜v2.3 零新增付費 MANUAL L0 可用路徑（既有 MCP）

日期：2026-10-28 Asia/Taipei。原工作台專案 ID `61b88bec-9b3e-49e6-8780-d073fc816516`。GitHub 原 Draft PR #43。**本文件不是新 Worker 正式發布或新的 Site 授權驗收。**

## 本次解決的問題

原 P3 曾被兩個事項卡住：ChatGPT Sites 原私人 Site 的可信 owner principal / bypass / 登出撤權尚未完成完整平台測試；原 Site 當期 D1、CPU、hosting 剩餘額度／硬限制沒有可讀的計量介面。

不再把「**在現有對話手動讀取**」與「**另外部署獨立 Worker**」混為一談：

### A. 現在可立即使用：MANUAL L0 三項唯讀協作

直接沿用已連線、已授權的「立之雲端庫製作工作台」MCP。每次由使用者在 ChatGPT 對話發起，依序呼叫：

1. `list_projects`，只接受**恰有一筆**指定專案。
2. `get_project_context({projectId})`。
3. `get_project_handoff({projectId})`。

服務端沿用原有的 MCP/Bridge 授權與 owner 資料隔離，**不向新的 Worker 發放廣權 Bridge Key**。ChatGPT 接收後交叉驗證 projectId、revision、任務狀態及任務 ID 唯一性；版本不一致或缺少內容應拒絕當作成功並可另行重新讀取。只輸出專案版本、任務數和未完成數，未經使用者需要不輸出原始私人來源文字。

#### 本輪真實 MCP 操作證據（不是 mock）

當前 ChatGPT 對話已實際透過連線的工作台工具呼叫以上三個操作，沒有調用寫入工具：

- **結果**：`MANUAL_L0_THREE_READS_PASS`（此時專案 revision 131）。
- 精確命中 **1** 個指定專案。
- Context 與 Handoff 的 revision **131** 一致，list 中的目標 revision 亦為 131。
- Context 中 8 項任務均有已知狀態，task ID 無重複；handoff 的未完成數 **6**。
- 無網站部署、Secrets、Grant、SQL、刪除、交易、付費 API 或 GitHub main 合併。

上面是**既有 MCP 上的真實 MANUAL 唯讀業務流程**，不是獨立 Worker 的服務端身分防偽、持久隊列、權限撤銷或真實 AUTH01～10。

### B. 後續獨立 Worker：維持關閉

v2.2 的 compact Bridge 尚在 Draft PR。原私人 Site v24 沒有發布新入口；`AI_LOOP_VERIFIED_INGRESS_CALLBACK` 只是尚未從平台證實可使用的候選接口。任何直接在此入口信任可偽造的 HTTP header 都不能替代可信 owner principal。真實源站繞過、跨帳號、登出撤權即時測試**仍未完成**。

*如需真正背景或可跨對話獨立運作的 Worker，仍須另外驗證的平台 server principal 或重新選用已獲授權的代理宿主，並取得原站差分部署、D1、Secrets/Grant 的明確核准。*

## 零新增付費判斷（依官方條款；非本站即時用量核對）

- OpenAI 官方 ChatGPT Sites FAQ：Plus、Pro **目前包含託管**，建置/編輯計入 Codex 方案用量；用量與儲存空間共用限制，單站 D1 上限 10GB。來源：https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites 。
- Supabase 官方 Cost Control：**Free 方案不收費**，超量可能發生 Fair Use 服務限制；不能在未經本人核准時切換付費方案。來源：https://supabase.com/docs/guides/platform/cost-control 及 https://supabase.com/docs/guides/platform/billing-faq 。
- 實際帳戶連接器唯讀核對：原 Supabase organization `plan=free`，project `ACTIVE_HEALTHY`。既有交接已於本人登入後核對 ChatGPT Plus／自動加值 OFF／credits 0；**本輪沒有重新進入 Sites 私人管理介面或取得帳單**。

因此若維持現有方案、無新付費 API／升級／手動加值／其他外部付費服務，本輪 **MANUAL L0 三項讀取不需新建任何會收費的服務**。但 ChatGPT Sites 的當期 D1/CPU/hosting 可用餘量及臨界時的執行失效仍 **NOT_VERIFIED**；「本輪沒有加購」不等於「全帳單已實讀核算為零」。

## 可操作的簡短使用方式

使用者在現有 ChatGPT 對話說：

> 使用立之雲端庫製作工作台，以 MANUAL L0 唯讀模式讀取「立之 AI 多代理協作迴圈」：依序 list_projects、get_project_context、get_project_handoff；只限專案 61b88bec-9b3e-49e6-8780-d073fc816516，核對 revision、一致性、狀態及未完成數；不要寫入、建 Grant、啟用 Worker、部署或使用付費 API。

## 未完成的正式驗收

1. 原 Site 可信 principal、源站防繞過、跨帳號與登出撤權即時驗證。
2. 原 Site hosting/D1 真正當期使用量、服務限制或硬上限證據。
3. v2.2 compact Supabase Edge 正式差分部署與真實對照。
4. 兩張原 Site D1 隔離表／Grant＋audit 的真實交易、回滾與跨實例撤權。
5. 原私人 Site MANUAL Worker 差分發布與 AUTH01～10 真正 E2E。

這些不能因本輪三工具 MANUAL L0 實測成功而標 PASS。**AUTO OFF，不新建平行專案，不改正式 Site/Secrets/D1，不合併 main。**
