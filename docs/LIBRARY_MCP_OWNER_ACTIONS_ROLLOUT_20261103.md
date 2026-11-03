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