# 立之 AI 多代理協作迴圈｜P3 實際唯讀 MCP 讀取與適配器交接 v0.5

- 日期：2026-10-28（Asia/Taipei）
- 專案 ID：`61b88bec-9b3e-49e6-8780-d073fc816516`
- 狀態：**P3 部分完成／IN_PROGRESS**，不得稱為多 AI、真正後台調度或正式 MCP 寫入已完成。
- GitHub 分支：`feature/ai-loop-p1-spec-sandbox-20261028`，草稿 PR #43（不合併 main）。

## 上游核對

從目前 ChatGPT 已登入並獲得授權的工作台 MCP 實際呼叫下列四個**唯讀**工具：

- `list_projects`
- `get_project_context`
- `get_project_handoff`
- `get_project`（額外稽核核對，尚不屬於 adapter 的三工具 allowlist）

這四項取得相同專案 ID、相同 revision **32**，工作台共有八項任務，當時無未結 issue。這是**本次具體對話中的真實 MCP 回傳驗證**，沒有修改工作台，沒有向其他專案或私密資料進行寫入；不是 GitHub CI 的網路測試。

## 已提交的原始碼

- `experimental/ai-loop/workbench-readonly.mjs`
- `experimental/ai-loop/workbench-readonly.test.mjs`

這是 Node ESM 的**只讀契約／能力注入介面**：受信任的宿主必須提供 `invoke(name,args)` 與允許的 project ID；原始碼自身**不包含任何憑證、外部網路、工具自動認證或長駐 Worker**。只有三項 MCP 工具能被呼叫；不提供 `append_work_record` 或其他寫入路由。

`snapshot` 先確認專案在本人可見清單內，檢查上下文與 handoff revision 對齊，再只抽取任務 key/status/ID、最後紀錄 key、版本與證據摘要 SHA，不洩漏來源全文、私人 token 或簽名 URL。`reviewFresh` 重新呼叫 context/handoff，若結果或版本與第一次不同就拒絕；`handoffDraft` 僅輸出本地草稿 `NOT_TESTED`，不得把 AI 初審冒充作者核定、不得寫正式工作台。

### 實際測試

- 前置 P1/P2/P3 隔離測試：49/49 PASS。
- 本輪 P3-MCP 新增 15 項：回傳格式、來源欄位最小化、Reviewer獨立讀回、版本衝突、跨專案拒絕、身分範圍、MCP錯誤／壞JSON／transport error、寫入工具拒絕、未核准交接等。
- 本地 Node v22.16.0：合計 **64/64 PASS**。
- GitHub Actions Run **#40640429433**、job **#122657041901**：實際讀取 job logs，列出 **# tests 64 / # pass 64 / # fail 0**；Job conclusion=`success`。對應原始碼提交 `7cbd0db71ddae2962f2546abd59d4e97988d4716`。草稿 PR 仍未合併。
- GitHub `fetch_file` 讀回原始碼與測試；Git blob SHA 與本地 `git hash-object` 完全一致：module `24b31bc401ed72835badae22cce4e74d12b7b43c`，tests `55c3efa0bbcc0a51dce0f6bbe318ba5acdf6a9d0`。

## 尚未完成／授權界線

1. **未完成**：能在無人值守情況下自主呼叫 ChatGPT 授權 MCP 的 Worker；Node CI 裡的 `invoke` 是 mock handler，與本對話真實 MCP 呼叫分開驗證，**不能把兩者串成真實 E2E PASS**。
2. **未完成**：真正 AI 模型推理、跨模型交棒、P4 Reviewer→Repairer 真實缺陷修正、任何正式工作台自動寫入。
3. **未完成**：正式 AUTO 模式 UI、Supabase durable queue 雲端執行器、真實 API 費用／限額管控。
4. 即使有未來 MCP 宿主，也須經 owner-scoped server credential 驗證，不得依靠測試旗標或直接將私人 MCP token 放入公開 repo、CI secrets/logs 或前端。
5. 發現外部寫入結果未知，必須先只讀對帳，不自動重試；從不讓 Reviewer 自動核准 L2/L3 正式操作。

## 下一個有效工作

先在受控隔離環境實作宿主 `invoke` 的授權適配器（只開三個工作台 read tools），提供**端到端的真實執行時讀回測試**；須確認它是否能由宿主持續執行、權限是否只限本人、實際 session receipt 與成本邊界。只有實際 readback 與授權 E2E PASS，P3 才能前進到 P4 的安全修正及正式交接協作。此時不可合併正式 main 或啟用排程、付費 API、正式資料自動寫入。

接續時先讀 `LIZHI-AI-BOOT/1.0.0`、`LIZHI-AI-RULES/1.0.0`，再 `list_projects`、`get_project_context`、`get_project_handoff` 取得**當下** revision；本文件 revision32 是 2026-10-28 此工作時的狀態，不可取代未來新鮮讀回。
