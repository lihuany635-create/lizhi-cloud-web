# 立之理財管家｜雲端直連 v5（不需開網頁或按連線按鈕）

一般 ChatGPT → 原私人「立之理財管家」Site → Supabase Edge lizhi-finance-site-mcp → Supabase owner-scoped ledger。
沿用既有 Site、本人驗證及 LIZHI_FINANCE_SITE_MCP_TOKEN / LIZHI_FINANCE_SITE_OWNER_UID。所有金鑰只在伺服器端。

## 原五項工具保留

finance_status、finance_accounts、finance_cards、finance_month_summary、finance_recent_transactions。

## 新增兩項雲端直連 MCP

- finance_references：回傳雲端已同步的帳戶、信用卡、分類 ID 與名稱（不暴露卡號／自由備註）。
- finance_create_transaction：直接持久新增五種類型之一：income、expense、transfer、credit_card_purchase、credit_card_payment。需要 UUID request_id；未知成功與否時使用相同 request_id 查證，不能生成新 ID 重試。原子 SQL 同一交易防止重複入帳。只准明確的使用者記帳要求。

範例：「今天中油加油 850 元，台新卡」，先使用 finance_references 查出卡 ID 和交通類別 ID，再使用 finance_create_transaction：
type=credit_card_purchase, amount=850, date=YYYY-MM-DD, creditCardId=..., categoryId=..., note=中油。

一般收入／支出需要 accountId + categoryId；轉帳需要 fromAccountId + toAccountId；卡費繳款需要 fromAccountId（或 accountId）+ creditCardId。超額繳款拒絕，繳卡費不重複計入費用。所謂轉帳是帳本內轉帳**紀錄**，不是實際銀行匯款。

## 後端與同步

新 SQL：supabase/migrations/20261026001000_lizhi_finance_cloud_transactions.sql
新增私有請求防重表及 service_role-only RPC lizhi_finance_cloud_create_transaction。只接受 owner UID 固定由 Edge Secrets 提供；拒絕任意 SQL、未知欄位、偽造 owner、無效日期／金額、封存／不存在的參照。財務紀錄仍存在原 public.lizhi_finance_records，不建立平行帳本，不更改既有 RLS 或本機 IndexedDB v1。

已從主網頁 index.html 撤掉先前 UI 遠控與連線按鈕，毋須持續開啟 Finance。原本 Sync 會在日後開啟網站時將新雲端交易（全新唯一 ID）拉回 IndexedDB。本機尚未同步的新資料仍應由原同步機制保留。原 PR #20 的 UI 中繼程式保留作歷史用途，但不應再使用。

目前範圍只涵蓋**新增雲端交易**；遠端修改／刪除既有交易、重整帳戶／分類定義尚未支援。這類修改需額外設計離線衝突防護，不能跳過以免蓋掉本機資料。

## Site 私人發布

修改原有 Site：https://lizhi-finance-agent-20261025.lihuany635.chatgpt.site

保留原 /mcp 及本人驗證，不新建網站、不變更或揭露金鑰。根據 Supabase Edge 內 site-contract.mjs 的 FINANCE_CLOUD_TOOLS 註冊 finance_references 與 finance_create_transaction，再私人發布下一版本。驗收一般 ChatGPT 可列出七項工具、finance_status 與 finance_references 成功。除非使用者明確提供真實記帳內容，否則不得為測試新增、修改、刪除任何財務交易。
