# 立之 AI 多代理協作迴圈｜P5 可重現隔離驗收與證據產出 v1.0

- 日期：2026-10-28（Asia/Taipei）
- 工作台：`61b88bec-9b3e-49e6-8780-d073fc816516`
- 程式：`experimental/ai-loop/acceptance-evidence.mjs`
- 測試：`experimental/ai-loop/acceptance-evidence.test.mjs`
- GitHub：草稿 PR #43，**僅隔離分支；不合併 main、不得部署**
- 前置：`LIZHI-AI-BOOT/1.0.0`、`LIZHI-AI-RULES/1.0.0`

## 使用方式（本地／CI）

只需 Node.js 22.16.0，無 npm install、無正式資料庫、無外部 API token。

```bash
node --disable-warning=ExperimentalWarning experimental/ai-loop/acceptance-evidence.mjs --output ai-loop-acceptance-evidence.json
```

程式只會在同目錄尋找既有 `*.test.mjs`，呼叫 `node --test --test-reporter=tap`；實際 TAP 失敗、取消、略過、摘要不符、少於前一版 120 項或 AT01～AT10 缺少必要直接/獨立對照案例都必須失敗。這個「AT 對照」驗證的是實際執行的測試名稱/測試結果，不能代替獨立稽核程式碼語意。

產出 JSON 證據保留以下欄位：
- `schema: LIZHI-AI-LOOP-P5-EVIDENCE/1`
- Node 執行版本、UTC 時間、總數及 PASS/FAIL/SKIP
- 每項 AT01～AT10 的直接測試與陪伴測試、`LOCAL_SANDBOX_ONLY`
- 沙盒程式碼 SHA-256、測試輸出 TAP SHA-256
- 嚴格聲明 `liveE2e: NOT_TESTED`、`ownerApproval: NOT_OBTAINED`、`workbenchWrite:false`、`independentAiWorkers:false`
- 不包含任何 MCP token、個人資料、原始工作台素材、私有 URL、簽名下載連結

GitHub Actions `.github/workflows/ai-loop-sandbox.yml` 在草稿 PR 更新時執行此指令；若成功，以 `ai-loop-p5-sandbox-evidence` 上傳 JSON artifact（保存 3 日）。**取得 workflow 日誌和證據內容後才可聲稱 GitHub CI 實際 PASS**；僅提交 YAML 不等於完成驗收。

## 已有的驗收階段

P1：角色與狀態機。P2：SQLite 隔離佇列/租約/防重。P3：五角色模擬適配器、窄幅唯讀 MCP 契約、受信任 HTTP 宿主候選。P4：審查/有限修正/交接，以及 P2+P4 的本地可恢復整合。P5：本次驗收證據工具與測試。

所有 P1–P5 的 sandbox PASS 仍非「正式 AI 迴圈已投入使用」。原本 AT01–AT10 的沙盒對照見 `P5_SANDBOX_ACCEPTANCE_MATRIX_v0.9.md`。

## 正式 E2E 待解封項目（預設 NOT_TESTED）

1. **獨立 Worker 本人授權**：正式安全宿主、可驗證且限期的 owner-scoped session、服務端允許清單、撤權、Secrets 不外洩。ChatGPT 本對話的 MCP 權限不能直接轉授權給任意 Node 程序。
2. **真實 MCP 讀回**：只能在本人授權的隔離帳號或只讀工具測試；校驗 projectId、revision、requestId、來源版本及工具結果。
3. **真正 AI 工作角色**：單一 AI 分角色工作中的 Reviewer 需要重新讀取來源；同模型不應自稱跨模型獨立審查。未取得授權與成本界線前不啟用新 API。
4. **正式狀態寫回**：只能在明確測試專案取得核准後由序列化寫回閘門作業，CAS/revision/唯一 key+讀回；正式 CAD、財務、手機等依專業權限另核准。
5. **正式 AUTO 和 UI**：必須先完成開關/停止/核准/稽核與撤權的真正端到端測試；原型預設 OFF，不能因沙盒AUTO測試而上線。
6. **作者正式採用**：獨立於 AI 的 reviewer PASS 或 CI PASS，不可直接設為 `authorApproved:true`。
7. **使用成本**：不啟用付費外部模型 API；任何實際主機費、儲存費或 GitHub Actions 額度需在部署前重新核對。

## 接手規則

新對話先讀上述共用規則與工作台最新 `get_project_context`／`get_project_handoff`；核對分支提交、CI workflow run 和證據附件。再判斷下一步，不得因文件有 PASS 就推定正式 MCP、背景 Worker、UI、Supabase migration 或真實寫入已完成。

下一個有效工作：以目前 P5 證據包完成可重現的 GitHub CI 演練，後續待本人授權才建立真正 owner-scoped host 的隔離端到端測試，不在正式系統自行啟動。
