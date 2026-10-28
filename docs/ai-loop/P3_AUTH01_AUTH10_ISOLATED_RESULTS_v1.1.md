# 立之 AI 多代理協作迴圈｜AUTH01–AUTH10 本人授權隔離驗收 v1.1

- 日期：2026-10-28（Asia/Taipei）
- 專案：`61b88bec-9b3e-49e6-8780-d073fc816516`
- 開發：原 GitHub Draft PR #43，**未合併、未部署、未啟動 AUTO**
- 安全判定：**全部 10 項僅 `LOCAL_MOCK_PREFLIGHT`，真實服務端身分授權仍 `NOT_TESTED`**。此文件不可替代本人授權、正式 MCP 端到端或作者驗收。

## 已核對原有架構

`production/source/app/mcp/route.ts` 的 `tools/call` 使用 `identity(req,'ai')` 取得角色，然後將該角色傳入 `workspaceOperation`。原本的 Bridge 憑證不等於新獨立 Worker 的專案限定、唯讀身份憑證。

既有 `experimental/ai-loop/trusted-mcp-host.mjs` 依賴可信伺服器注入 `verifyOwnerSession()`、`getBearerToken()`，不是獨立 OAuth 流程、身份供應者、Token 授權伺服器或常駐 Worker。**絕不可將現有較廣權限的 Bridge Key、Supabase Service Role 或 ChatGPT OAuth Token 複製到新執行器。**

## 本輪新增的驗收測試

`experimental/ai-loop/auth-preflight.test.mjs`，使用 Node.js 內建 `node:test` 和注入的**虛構 HTTP 回應、測試專用 token、測試 session**；無外部網路/正式資料/付費 API。

| 編號 | 本地測試範圍 | 真實宿主 |
|---|---|---|
| AUTH01 | 無有效 session：零次 HTTP、零次憑證取得 | NOT_TESTED |
| AUTH02 | mock 本人 session：三工具、五次讀取與二次核對 | NOT_TESTED |
| AUTH03 | 非本人、過期、錯專案：拒絕且不送 HTTP | NOT_TESTED |
| AUTH04 | 寫入/手機/理財/CAD/未知工具，無法通過白名單 | NOT_TESTED（需上游授權額外檢查） |
| AUTH05 | 401/403/503/timeout/redirect/壞 JSON/錯 RPC ID：不重試 | NOT_TESTED |
| AUTH06 | 版本變動：Reviewer 拒絕交接 | NOT_TESTED |
| AUTH07 | session 中途撤權：停止後續讀取 | NOT_TESTED |
| AUTH08 | 兩次手動會話使用不同 receipt、不產生本人核准 | NOT_TESTED（跨 ChatGPT 新對話仍需實測） |
| AUTH09 | AUTO、前端偽造核准不能啟用服務或付費 | NOT_TESTED |
| AUTH10 | 回報與記憶體 audit 不含測試 token/來源全文 | NOT_TESTED（尚無伺服器持久化 requestId/時間稽核） |

現有 132 項純沙盒測試加上本輪 10 項，**本地 142/142 成功**。GitHub CI 應以本輪提交實際 workflow run/log 為準；在讀回前不得宣稱 GitHub 142/142 PASS。

## 真正上線前仍必須設計的安全主體

1. **服務端核准來源**：使用者本人的有效登入 session、發證主體與授權期間，由伺服器端自行驗證；客戶端的 `authenticated`／`ownerApproved` 旗標不具效力。
2. **短期專案限定 token**：需要伺服器端記錄憑證雜湊、受授權 owner subject、唯一 `projectId`、三工具白名單、到期、撤銷及稽核。必須在真正處理 MCP 要求的一端檢查，不只靠 Node 客戶端的工具白名單。
3. **絕不代用廣權金鑰**：即使服務端私藏原 Bridge 金鑰，若新 Worker 的 token/作用域限制只能靠客戶端程式碼，仍不足以通過 AUTH04／AUTH03 的正式驗收。
4. **正式授權 E2E**：本人、未登入、跨帳號、撤銷、到期、跨專案、未知工具、網路異常、獨立新對話，各種回應須以**受控部署後的實際服務端測試**為準。
5. **執行模式**：第一個授權測試只允許 MANUAL + READ ONLY；`AUTO=OFF`，正式業務資料寫入、外部 AI 推理與新增付費 API 全部禁止。
6. **驗收證據**：保存不含秘密的時間、requestId、projectId、工具、權限判決、版本、HTTP/JSON-RPC 結果與接續，不保存 Bearer、私人內容；作者採用獨立記錄。

## 下一步

完成這輪 GitHub CI 的實際讀回並在原工作台記錄。接著在**不部署、不拿 Secrets**前提下，完成「owner-scoped read-only server grant」資料契約與端點最小差異設計及離線反向測試。新的正式 Site、Edge、Secrets、Migration、Cron、模型接線、OAuth callback 改動仍須本人另行核准。沒有正式授權之前，P3 維持 `IN_PROGRESS`。
