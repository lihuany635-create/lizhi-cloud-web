# 立之圖書館 MCP 私人操作升級｜發布與回復規格

狀態：Draft / NOT_DEPLOYED / NOT_ACCEPTED（2026-11-03）
專案：既有 library-mcp 與 lizhi-library 私有 Storage。絕不與立剪整合。

## 根因
正式資料庫 lizhi_web_is_allowed() 要求 JWT 不含 client_id；OAuth MCP 帶 client_id，導致 rate-limit RPC 在真正限流前驗證失敗。新的 migration 僅准許事先核准的 OAuth client ID，網站原本白名單不改。

## 功能
原 4 個唯讀工具保留；另新增 11 個館藏整理、公文查詢與登記、軟刪還原及雲端原檔短效收發工具。
上傳票據不代表原檔已上傳；必須有可傳輸原始位元組的用戶端，完成上傳後才可核對與登記。
手機或電腦本機原檔不開放遠端讀取；公文原檔仍在 Google Drive，不透過 MCP 移動或刪除。

## 部署與權限
1. 取得本人另行明確批准、備份正式 policies 與函式定義，確認既有網站及資料庫現況。
2. 只對核准的 ChatGPT OAuth client ID 建立 allowlist；不得自動准許其他動態用戶端，包含 Codex。
3. 先讀取授權 can_write=false；逐項核對原始四工具。寫入權限 can_write=true 需另行批准。
4. 套用 migration 與更新現有 library-mcp Edge，保留 URL、OAuth、本人白名單及現有資料。
5. 測試網站、OAuth、不同 owner、RLS、50MiB 上限、短效連結、資料更新衝突、軟刪還原。
6. 手機本機、電腦本機同步、Drive 實際原檔處理，以及 ChatGPT 附件位元組直接傳輸沒有驗證前保持 NOT_TESTED。

## 回復
有異常先停用指定 OAuth client 的 can_write 或移除核准列；不改網站登入。
Edge 還原為先前已驗證版本；DB policies 依正式快照另備回復 migration，避免動到原始館藏。

## 驗收
PR #56： https://github.com/lihuany635-create/lizhi-cloud-web/pull/56
Deno type check PASS；5 個 Deno handler 測試 PASS；12 個 Node 安全合約測試 PASS。
正式 migration、OAuth E2E、Storage 端到端、獨立安全複核：NOT_TESTED。
不得把 CI PASS 稱為正式上線或所有能力實測 PASS。
## 2026-11-03 本次接續操作紀錄（部署受阻）

- 正式 `library-mcp` 原有 Edge version 10；候選 PR #56 已完成 Deno 型別檢查、handler 模擬測試、Node 安全契約及 PR CI。
- PR #57 的舊 OAuth 只讀政策與 PR #56 的可寫政策衝突已修正，於 PR #56 新 migration 增加舊政策清理。
- `mcp__Supabase__apply_migration` 對正式專案執行 `library_mcp_owner_actions_20261103` 回覆 `success:true`。
- 對已核准的 ChatGPT OAuth client 建立單一 `can_write=false` 的本人白名單資料，沒有替 Codex 或其他 OAuth 用戶端開權限。
- 套用後以原圖書館 MCP 重測 `status` 和 `list`：PASS。原有 6 筆館藏未變；公文登記 0 筆；bucket 仍 private。
- 嘗試由既有 Supabase 工具 `deploy_edge_function` 更新原 `library-mcp`，平台安全檢查直接 BLOCKED，因此**沒有重試繞過**。
- 再用 `list_edge_functions` 讀回：原 `library-mcp` 仍是 version 10，狀態 ACTIVE。新 11 項 MCP 工具沒有上線。
- `get_advisors` 記錄圖書館 rate-limit SECURITY DEFINER 可由 authenticated 角色執行的 WARN（原設計需繼續審查，沒有因此開放他人館藏）。
- 因正式 Edge 尚未部署，**不得將 `can_write` 改為 true**，不得宣稱新增工具可用。

### 安全恢復／交接

現有原四項查詢已可運作，資料庫仍維持 owner + approved OAuth client 限制。後續只有在平台允許且獲本人正式批准的有效部署管道，才更新原 `library-mcp` Edge。完成後必須先驗證新工具的只讀查詢，再考慮開啟 ChatGPT `can_write`，並測試跨帳號拒絕、軟刪、上傳完成檢查與站內功能。不許用其他工具繞過本次平台阻擋。

**當前狀態：SCHEMA_APPLIED / EDGE_NOT_DEPLOYED / WRITE_DISABLED / END_TO_END_NOT_TESTED。**