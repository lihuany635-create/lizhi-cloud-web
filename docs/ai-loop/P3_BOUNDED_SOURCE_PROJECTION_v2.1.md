# 立之 AI 多代理協作迴圈｜v2.1 工作台超大回應的來源端安全投影候選

日期：2026-10-28（Asia/Taipei）。唯一專案 `61b88bec-9b3e-49e6-8780-d073fc816516`。原 GitHub `lihuany635-create/lizhi-cloud-web`，原 Draft PR #43 `feature/ai-loop-p1-spec-sandbox-20261028`。不建新網站，不部署，不變更 Secrets、D1 或已發布的原私人 Site。

## 問題根因（已讀原碼）

原 Supabase `production/source/lib/project-management.ts`：

- `getProjectContext` 組合 `tasks`、最近十筆 records、全部 artifacts、sources、images、issues、`handoff` 等內容。
- `getProjectHandoff` 組合 records 的 `passed`、`unverified`、全部 artifacts、blocks、unfinished、nextActions，沒有固定 HTTP body 上限。
- 原私人 Site 內的候選 `bridgeSource` 以 `boundedJSON(res,262144,signal)` 限制上游回應為 256 KiB。**它只能在已收到上游回應後做大小限制**；若來源資料成長超過該上限，會失敗而不是自動摘要。
- 既有 Worker 的 `minimise()` 於完整回應解碼**之後**才挑選需要的 ID、revision 與 status；因此單靠客戶端精簡不能解除 256 KiB 傳輸限制，也不得靠提高上限、偷偷截斷任務清單解決。

## v2.1 已建立的離線候選

1. `experimental/ai-loop/bounded-source-projection.mjs`：**預定在來源伺服器的現有本人驗證／原 Bridge 權限檢查之後、回傳 HTTP 之前**呼叫的純投影函數 `projectSourceResult(tool,source)`。只支援 `list_projects`、`get_project_context`、`get_project_handoff`，固定唯一 projectId。
2. Context 僅傳 `projectId, revision, tasks:[{id,key,status}]`；每筆任務都保留，不保留 title、result、secret、artifact、來源全文或圖片。Handoff 只傳 `projectId, revision, lastWork.key, unfinishedCount`；list 只傳指定專案的版本。
3. 要求正確 project/revision、狀態白名單、task ID 唯一、最大 1000 項任務、**JSON UTF-8 最多 64 KiB**；多一筆、錯一個狀態、超過位元組上限就拒絕，不允許只回部分 task 而標 `READBACK_MATCH`。
4. `production/source/lib/ai-loop-v15.mjs` 的 `minimise('get_project_handoff')` 兼容既有完整 `unfinished[]` 和未來可信來源端的 `unfinishedCount`，但如果兩個欄位同時存在、無效或數量大於 1000，必須拒絕。
5. `experimental/ai-loop/bounded-source-projection.test.mjs`：14 項純離線測試，含超過 256 KiB 的 context/handoff 私人歷史，驗證只投影限定欄位；跨專案、重複 task、超過 1000 task、超過 64 KiB、異常 revision/狀態及非唯讀工具必須拒絕。

## 關鍵：這版**沒有真正接上來源 Bridge**

此檔目前位於 `experimental/`，不是經授權部署的 Supabase Edge 原始碼入口，也不接收 HTTP 或直接索取真實 Bridge Key。它只能說明**來源端應如何投影**及在 Node 測試中證明只輸出白名單欄位，不能因跑過本地測試就宣稱正式 Bridge 已完成 compact mode。

將來若要真正解決超大 HTTP 傳輸，必須另行審查既有來源橋接端：在本來已驗證 Bridge 身分、owner 對照、固定專案與操作白名單的服務端，為三個固定讀取操作加入 source-side projection。應保留現有工作台通用 MCP API／73 工具正常運作，不能修改其他工具的回應。新回應應有可識別的版本、精確 schema 與 64 KiB 容量驗證，且供候選 Worker adapter 在**已驗證新來源模式**才使用；不允許從舊的大回應盲目 fallback 到較寬權限路徑。

新模式上線前，需分別完成（均 **NOT_TESTED**）：

- 原私人 Sites 可信 server-side owner principal、原站防繞過、跨帳號與登出後撤權即時性；
- 原 Sites / D1 實際當期配額、超額拒絕與費用硬上限；管理 UI 已核對 Plus、自動加值 OFF，但目前未提供託管 D1 細項；
- 來源 Bridge 真實的 compact read E2E；與當前 `getProjectContext/getProjectHandoff` 精確同一 revision/同一任務集合比對，確保不漏任務；
- 超限情形、schema 異常及中途變更時，均不發生私人資料洩漏或誤報 PASS；
- 既有正式站點/Supabase Edge 版本、D1 與 Secrets 的獨立部署核准與可回退方案。

本版持續 **AUTO OFF、MANUAL OFF、不發真 Grant、不付費、不合併 main**。若來源端尚未支援精簡模式，應以 `SOURCE_TOO_LARGE` 類狀態拒絕，不可輸出殘缺但看似成功的摘要。
