# 立之 AI 多代理協作迴圈｜服務端本人限定唯讀授權契約草案 v1.2

- 日期：2026-10-28（Asia/Taipei）
- 原專案：`61b88bec-9b3e-49e6-8780-d073fc816516`，GitHub 草稿 PR #43
- 狀態：**設計草案 / 未部署 / 無新增 Secrets / 無任何新授權 / 無外部AI費用**
- 前提：AUTH01–AUTH10 離線負向測試、GitHub CI 驗證及工作台紀錄都**不**構成「真正 owner-scoped MCP 授權已完成」。

## 1. 信任邊界與目的

既有 ChatGPT 工具的登入身分與原本 Bridge Key 不可傳遞給另外獨立的 Node/AI Worker。Bridge Key 原先可調度多項工作台操作，不能把它交給新 Worker，再相信 Worker 自律只呼叫三項唯讀工具。

未來需要新建**受信任的服務端閘門**，由原本人已驗證的登入上下文簽發短期、單專案、單用途的唯讀授權，再由**真正處理請求的服務端**執行工具與專案限制。伺服器可在內部使用已受保護的存取管道，但必須在每次上游操作前核對授權，不可讓新 Worker 取得廣權祕鑰。

第一版只允許：`list_projects`、`get_project_context`、`get_project_handoff`。所列工具名稱是**上限**，不代表已經為任何外部 Worker 開放存取。

## 2. 建議最小資料契約（尚無正式 migration）

```json
{
  "grant_id": "server-generated-uuid",
  "owner_subject": "verified-server-side-user-id",
  "audience": "lizhi-ai-loop-readonly",
  "project_id": "61b88bec-9b3e-49e6-8780-d073fc816516",
  "tools": ["list_projects", "get_project_context", "get_project_handoff"],
  "mode": "MANUAL",
  "write_allowed": false,
  "paid_api_allowed": false,
  "created_at": "server-time",
  "expires_at": "server-time-plus-short-ttl",
  "revoked_at": null,
  "max_calls": "server-enforced-finite-number",
  "grant_revision": 1
}
```

上述 JSON **只是 schema 示意，不是可信權杖或授權輸入**。真實授權需由後端對照資料庫中的伺服器簽發/保存紀錄、驗證真正登入身分、撤銷狀態與作用域，不能只解碼/相信使用者傳入的 JSON、`authenticated:true`、`ownerApproved:true` 或沒有可驗證簽名/伺服器狀態的 JWT claim。授權 bearer 應設計為不可猜測、受限、短效，資料庫只存雜湊；需支援撤權、過期與額度限制。不可把 credential 寫入工作台、GitHub、CI、前端 log 或測試報告。

## 3. 必須在伺服器執行的檢查順序

1. HTTPS 與正確端點、HTTP POST、限制請求/回應大小，拒絕轉址，拒絕不存在的工具。
2. 驗證本人當前登入 session，從後端取得 owner subject；未登入/過期/被撤權直接拒絕，不能依賴前端旗標。
3. 取出伺服器發行的 grant：核對 audience、subject、`project_id`、有效期限、未撤銷、可用次數與目前 MANUAL 模式；AUTO 必須拒絕。
4. 工具名稱以**服務端常數白名單**比對；只有三項唯讀，對應輸入固定 schema：
   - `list_projects` → `{}`，回應只能顯示允許 project 的摘要，不可把全部私人專案清單提供新 Worker。
   - `get_project_context`、`get_project_handoff` → `{projectId: grant.project_id}`，忽略/拒絕任意外加欄位。
5. 每個工具真正執行**同一個 subject 的專案可見性與授權**檢查；不能僅靠 gateway 限制前端參數。
6. 返回前削減來源至必要的 `projectId`、revision、任務鍵/狀態、有限交接摘要，不外露私人來源全文、私人 URL、Secret、不可驗證含敏感資訊的 fields。
7. 重新取得資料以驗證 revision/hash；變動就拒絕 PASS、不可自動提升至寫入工具。所有操作採單次請求，未知結果不盲重試。
8. 以不含 token 的 requestId、grantId、projectId、工具、時間、判決、revision、錯誤類別寫入受控後端稽核。確保 grant 撤權後再試是明確拒絕。

## 4. 保留的隔離限制

- **零正式 MCP 寫入**：不得放行 `append_work_record`、`update_project_task`、手機觸控、理財、CAD、3D寫入或管理工具。
- **零新外部 AI 付費**：現有 ChatGPT 訂閱不自動授權獨立 API，任何新增費用須明確核准。
- **AUTO OFF**：測試階段以本人觸發一次性 MANUAL 唯讀請求；不部署 cron/queue worker，不能假稱關閉對話後仍運作。
- **完全可回退**：若將來實作，須保持現有私人 Site、原 `/mcp`、正式 Edge、Secrets、工作台 schema 不被覆蓋，獨立 feature branch/測試與部署回退點分開。
- **兩層授權不是 mock**：真正的 bearer/token 發行、後端校驗、撤銷、安全稽核、跨帳號拒絕皆需真實伺服器端到端證據。

## 5. AUTH01～AUTH10 真實驗收條件

以 `P3_OWNER_AUTHORIZATION_PREFLIGHT_v1.0.md` 的十項實際跨 session／跨帳號／跨 project／跨工具／撤權／讀回為驗收基準，保留逐項 HTTP/JSON-RPC 讀回、server audit（只存非敏感摘要）、subject/scope 對照及無副作用證據。CI 中 `auth-preflight.test.mjs` 的 10/10 與 `auth-evidence.mjs` 的輸出只能標 `LOCAL_MOCK_PREFLIGHT_PASS`；正式欄位維持 `NOT_TESTED`。

## 6. 待本人實際核准事項

正式宿主位置（原私人 Site 的隔離端點或受控新測試服務）、信任的登入/session 來源、服務端短期 grant 發行方式、必要 DB/Site/Edge/Secrets 權限、部署/額度及試驗範圍。本人逐項同意前，只能寫文件與離線測試；**不得產生真實 credential、修改正式資料或部署**。

完成正式準備後，才可以進入第一個 MANUAL L0 真實 E2E。即使正式唯讀通過，P3 的多 AI、P4 真正修正/寫回、P2-A AUTO 與 P5 正式完整驗收仍各自待驗，不得批次改為 PASS。
