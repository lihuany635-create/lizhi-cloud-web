# P3｜ChatGPT 專用英文學習 MCP — 隔離候選規格

> **未部署、未接入 ChatGPT。** 本候選僅在開發分支、Draft PR 與 GitHub Actions 測試。不可視為真實登入、即時同步、正式安全驗收或上線。

## 已建立之程式
- `mcp-server.mjs`：MCP 2026-07-28 stateless JSON-RPC（POST、`server/discover`、`tools/list`、`tools/call`）候選，檢查版本 header 與 `params._meta`、Origin、Bearer、權限範圍；HTTP 錯誤依協定回傳
- `auth-boundary.mjs`：僅接受伺服器 introspection 驗證的 OAuth Token，驗證 issuer/audience/client 與受信任的 Google owner 綁定紀錄；不信任 MCP clientInfo、自填 ownerId 或「我批准」文字
- `oauth-resource-metadata.mjs`：RFC 9728 的受保護資源資訊與 401 授權提示草案；**尚無 OAuth 授權伺服器可用，不得宣稱 discovery 上線**
- `memory-backend.mjs`：只用匿名資料驗證限定學習對話範圍、候選卡、錯句片段、同步狀態、重試／去重／衝突、追加式操作紀錄
- `tests/`：無正式資料的協定、權限、同步、OAuth 邊界及 HTTP loopback 測試

## 擬提供 MCP 工具
| 類別 | 工具 | 限制 |
| --- | --- | --- |
| 只讀 | `get_learning_profile`, `get_review_summary`, `list_card_candidates`, `get_sync_status` | 只讀本人；不捏造能力 |
| 低風險候選 | `sync_learning_session`, `create_card_candidates`, `record_language_errors` | **必須先有經網站確認的英文練習 session**；只存必要片段 |
| 本人核准 | `add_vocabulary` | 必須透過受信任服務核對特定 owner/action/request 的批准，不能只根據模型說明 |
| 不開放 | 刪除、重設、SQL 任意執行、白名單修改、部署 | 即使模型要求也不提供工具 |

## 與既有立之雲端庫及私有 ChatGPT Site 的關係

現有工作台透過既有私人 Site `/mcp` 代理到 `lizhi-ai-workbench` Edge，並保留施工照片工具。**不得覆蓋既有 Site 的 route.ts、legacy-route.ts 或 shared secret，也不得自行另建平行私人 Site。**

P3 正式串接需獨立決策：在**既有 Site** 增加經本人批准的英文命名空間轉接，或由既有站建立新路由；原本的 AI 工作台與施工照片功能仍需維持相容。P3 開發核心採用 MCP 2026-07-28 新版協定，但既有 Site 混有舊版 `initialize`／tools/list 形狀，**正式整合前需要版本相容性測試與 adapter**。本次沒有改動它。

## 上線前阻礙（必須保留）

1. **正式授權未完成**：需有可用且符合 MCP 的 OAuth 2.1 授權服務與 RFC 9728 protected-resource metadata，實際連結本人 Google 登入，並允許撤銷。OAuth introspection 回傳必須可驗 issuer、audience、clientId；不能從任意 request header 視為本人。
2. **正式後端未完成**：P1 Supabase schema／RLS/Edge 仍是候選，P3 的 in-memory backend 不是正式儲存。需以交易性資料庫層提供 sync 事件唯一約束、owner 隔離、重試與審計，避免失敗時部分入庫。
3. **正式 Site 未改動**：需在不破壞既有 AI 工作台和照片工具的前提下完成接線、工具發現與實際 ChatGPT 呼叫；不能用 loopback 測試冒充已連線。
4. **對話範圍**：MCP 不會無條件監看使用者的其他 ChatGPT 對話。只有本人指定的英文練習及已確認同步來源才允許新增學習資料。
5. **獨立安全複核**：服務端授權、OAuth 受眾驗證、金鑰保管、操作批准、帳號隔離與回退方案仍待另一個獨立審查者實際覆核。
6. **正式變更需另外批准**：任何正式 Supabase migration、Edge/Site 部署、main 合併、白名單或費用變更均不受「先做能做的部分」一語自動批准。

## 隔離驗證

```bash
node --test english-academy/p3/tests/*.test.mjs
```

在 GitHub Actions `English Academy P3 isolated MCP tests` 執行 Node24，不使用外部 ChatGPT API、本人私人資料或正式 Supabase。測試 PASS 代表所列限制的候選行為受到驗證，**不是** production MCP 完整協定／OAuth 認證／真實 ChatGPT 端到端驗收。

依《AI 員工手冊》，P3 開發報告應寫入 Google Drive `立之英文學習教室` 專案資料夾，工作台 TASK-004 只掛連結。
