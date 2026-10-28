# 立之 AI 多代理協作迴圈｜P3 真正本人授權 MCP 宿主驗收前置 v1.0

日期：2026-10-28（Asia/Taipei）。專案ID `61b88bec-9b3e-49e6-8780-d073fc816516`。僅為**已核對現有架構的接線規格與待測清單**，沒有授權、部署、發行Secrets、啟動常駐Worker、付費API或正式業務寫入。

## 已確認現況
- 現有工作台可由此ChatGPT已授權MCP工具 `list_projects`、`get_project_context`、`get_project_handoff` 成功唯讀。每次開新對話仍須重新讀最新revision。
- GitHub main 源碼 `production/source/app/mcp/route.ts` 的 `tools/call` 依 `identity(req,'ai')` 帶入actor，而 `production/source/lib/store.ts` 會檢查 `PRODUCTION_CHATGPT_OWNER`，用server-only `PRODUCTION_BRIDGE_KEY` 呼叫正式Bridge；獨立Worker **無權繼承本對話的ChatGPT身分或讀取任何existing Secret**。
- 正式Edge `production/source/backend/index.ts` 區分已登錄的Bridge token（雜湊比對）及Supabase auth User；兩者均不是「測試程式設ownerApproved=true」就可替代的服務端認證。
- 草稿 PR #43 已有 `trusted-mcp-host.mjs`，但 `verifyOwnerSession()` 與 `getBearerToken()` 必須由**受信任且已獨立核驗**的伺服器提供，現在的單元測試只是模擬函式。不能把本檔當部署就緒。

## 決策閘門：仍待本人另外核准的事項
1. **執行宿主的位置**：沿用既有私人Site、另設測試Site或使用獨立隔離伺服器；哪一處能長時間運作，必須實測，不由ChatGPT一般對話假定。
2. **身分授權來源**：明確指定由何種服務端已驗證的本人登入/session供應owner subject及到期時間；不接受前端傳來的 `authenticated:true`／`ownerApproved:true`。
3. **正式可用MCP憑證**：由何種已核准的短期、唯讀、限定專案工具scope憑證供應；不能複製現有Bridge key、Service Role、ChatGPT OAuth token到新Site／GitHub／CI／對話紀錄。若原系統未提供唯讀憑證，應先設計並審查授權策略，不能沿用廣權token假裝唯讀。
4. **費用/部署許可**：新的Cloud Worker、cron、資料庫、托管、外部AI API不得自行啟用；新增付費AI API保持停用。即使現有免費額度，也須核對額度及變更權限。
5. **觸發模式**：預設OFF；第一個實際E2E只能在本人明確啟動之下讀取同專案，AUTO需後續另外審核。

## 真實授權宿主驗收矩陣（以下均 NOT_TESTED）
- AUTH01 無本人有效session → 無MCP讀取、無第三方呼叫、不可洩漏錯誤中的token。
- AUTH02 有效本人session及限定target project → 三個白名單工具的真正唯讀呼叫成功；projectId/revision一致。
- AUTH03 不同帳號／跨projectId／過期與撤銷session → 403或等效拒絕；不得只靠前端projectId。
- AUTH04 `append_work_record`、`finance_create_transaction`、`phone_tap`、`cad_*` 等非白名單工具 → 宿主和上游雙層拒絕。
- AUTH05 401、403、503、timeout、轉址、JSON-RPC錯誤 → 不記憑證、不盲重試、不回報PASS。
- AUTH06 Planner取現況後、Reviewer獨立再次讀取；revision/雜湊不一致時拒絕進入handoff。
- AUTH07 STOP／撤權在session中途生效，阻止下一個讀取；已送出未確認請求轉只讀對帳。
- AUTH08 新對話重新連接，不使用舊conversation session receipt或舊revision；作者核定永遠獨立。
- AUTH09 任何額外API費用/外部模型未授權，必須拒絕；不應暗中請求付款。
- AUTH10 權限/測試/成功與失敗之安全稽核包含requestId、projectId、工作類型與時間但不包含token／私人來源全文。

## 治理與下一步
P5沙盒132/132 CI PASS只證明隔離Node測試與證據管線，以上AUTH01–10均需新的一次真實宿主E2E驗證。正式部署、Secrets、新角色模型/任務排程、MCP寫入及作者核准皆維持未授權／NOT_TESTED。

下一個可由AI安全執行的工作，是在**不啟用新服務**情況下，為AUTH01–10準備只讀測試腳本和測試資料隔離。若涉及正式Secrets或新私人Site部署，再取得本人的對應授權，並維持原Site可回退。
