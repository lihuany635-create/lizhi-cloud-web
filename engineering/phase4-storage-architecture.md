# Phase 4 Attachment Storage Architecture

## Current Storage Findings

- 一般立之雲端庫將 record 與 blob 放在既有 App DB，但 API 是 `app.js` 私有函式，直接復用會讓 Engineering 與 Knowledge／Media 耦合。
- Engineering 已有獨立 `lizhi-engineering` v2，保存 projects、settings、calculations。
- Phase 0 Platform Adapter 的 `uploadFile` 目前只是 unavailable contract，沒有可安全復用的正式附件實作。

## Decision

採方案 B：Metadata 與 Binary 分離。

- Metadata：`lizhi-engineering` v3 的 `attachments` store。
- Binary：獨立 `lizhi-engineering-attachment-binaries` v1 的 `payloads` store。
- 關聯：stable attachment UUID 與不可變 `storage_key = project/{project_id}/attachment/{attachment_id}`。
- UI 只呼叫 Project Data Service；不接觸 IndexedDB 或 Blob store。

## Operational Contract

- MIME whitelist：`image/jpeg`、`image/png`、`image/webp`、`application/pdf`。
- 單檔上限：10 MiB；空檔拒絕。
- Quota：攔截 `QuotaExceededError`，回傳 `ATTACHMENT_QUOTA_EXCEEDED` 與明確中文訊息。
- Write：先寫 binary，再寫 metadata；metadata 失敗時刪除 binary 作為 compensation。Binary 失敗時不建立 metadata。
- Delete：保留 payload 於記憶體，先刪 binary、再刪 metadata；metadata 刪除失敗時恢復 binary。Binary 刪除失敗時 metadata 不動。
- Orphan：提供 project-scoped diagnostic 與明確 cleanup helper，不啟動背景排程。
- Duplicate filename：允許；filename 不作為 key。
- Backup：一般資料目錄備份不含 binary；Phase 4 UI 明確視為此瀏覽器本機資料。完整附件匯出留待後續專案備份設計。
- Future cloud：保留 `storage_provider`、`storage_key` 與 metadata，可日後映射 Supabase Storage，但本階段沒有任何雲端寫入或同步。

## Migration

`lizhi-engineering` v2 → v3，新增 `measurements`、`notes`、`attachments`、`project_records`。所有新 store 使用 `id` keyPath 與 `project_id` index；依查詢增加 type/kind/record_type/created_at/updated_at indexes。Upgrade 只建立缺少的 store，不修改或清除既有 projects、settings、calculations。

Downgrade 不安全：已開啟 v3 的瀏覽器不可改用只宣告 v2 的舊程式。Rollback 必須保留 v3 相容 open layer，且不得刪除資料庫。
