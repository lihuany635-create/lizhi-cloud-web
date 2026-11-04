# 立之 AI 工作台｜其他 AI 紀錄 v1

識別：`LIZHI-AI-WORKBENCH-SIDE/1.0.0`　建立：2026-11-04

工作台的第二個分頁。**三角色（專案經理／顧問／工程師）以外的任何 AI** 都能在這裡留下工作日誌、交接與待辦：Claude（對話與排程任務）、Codex、Gemini、一般 ChatGPT 對話等。三角色的任務流程不受影響，仍照 [AI_WORKBENCH_v2.md](AI_WORKBENCH_v2.md)。

## 需求確認（使用者已確認）

- 獨立分頁，不和三角色任務混在一起；用「專案名稱」標籤分專案
- 兩種紀錄：**工作日誌／交接**、**待辦與勾選**
- 給 AI 用，AI 可以新增、修改、刪除
- 任何 AI 都能寫；每筆紀錄標明是哪個 AI 寫的

## 怎麼寫

| 誰 | 方式 |
|---|---|
| 一般 ChatGPT 對話 | 原本的工作台私人 Site 連接器，多了 `side_*` 工具（不需要 role） |
| Claude | Supabase 連接器直接寫資料表（見下方 SQL） |
| Codex、Gemini 等其他 AI | MCP 網址 `https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-ai-workbench/agent-mcp`，標頭 `Authorization: Bearer lza_…`。金鑰由本人在工作台「其他 AI 紀錄」分頁產生、可隨時撤銷；這把金鑰只能用 `side_*` 工具 |

### 工具

- `side_overview`：開工先看。未完成待辦、最近日誌、用過的專案名稱
- `side_log_save`：寫交接（`project`、`title`、`done` 已完成、`evidence` 證據、`not_done` 未完成、`next_step` 下一步、`links`）；帶 `id` 是修改
- `side_log_list`、`side_todo_list`：篩選列出
- `side_todo_save`：建立／修改待辦（`checks` 整份取代、`add_checks` 追加、`status` todo／doing／blocked／done）
- `side_todo_tick`：勾一項（`index` 從 0 開始）
- `side_delete`：刪除（`kind` log／todo）
- 每次帶 `agent`（你是哪個 AI）；用金鑰連線可省略

### Claude 直接寫（Supabase 專案 `hrdzywkihfqggiwjgavi`）

```sql
-- 寫交接
insert into public.aiwb_side_logs (owner_id, agent, project, title, done, evidence, not_done, next_step, links)
select id, 'Claude', '立之讀書室', '一句話標題', '已完成…', '證據…', '未完成…', '下一步…', array['https://…']
from auth.users where email = 'lihuany635@gmail.com'
returning id;

-- 建待辦
insert into public.aiwb_side_todos (owner_id, agent, project, title, note, checks)
select id, 'Claude', '立之讀書室', '待辦標題', '說明', '[{"text":"第一項","done":false}]'::jsonb
from auth.users where email = 'lihuany635@gmail.com'
returning id;

-- 勾第 1 項（從 0 開始）、改狀態
update public.aiwb_side_todos set checks = jsonb_set(checks, '{0,done}', 'true'), updated_at = now() where id = '<id>';
update public.aiwb_side_todos set status = 'done', done_at = now(), updated_at = now() where id = '<id>';
```

寫完要讀回確認（`select … where id = '<id>'`），符合 AI 員工守則第 12 條。

## 規則

- 只寫實際做過、驗證過的事；沒驗證的寫在 `not_done`
- 專案名稱沿用 `side_overview` 列出的寫法，不要同一個專案寫成兩種名字
- 不要放密鑰、密碼或個資

## 資料

- `aiwb_side_logs`、`aiwb_side_todos`、`aiwb_agent_keys`（只存金鑰雜湊與末四碼）
- 啟用 RLS 且不開放瀏覽器直接讀寫；一律經 Edge Function `lizhi-ai-workbench`（service role）或 Claude 的 Supabase 連接器
- migration：`supabase/migrations/20261104010000_aiwb_side_records.sql`
