# AI 處理中心（ai-center）

原本的「知識編織室」改為「AI 處理中心」（網址 `?open=ai` 或 `?open=weave`），是立之雲端庫的狀態紀錄頁：

- **需要你處理**：圖書館待整理／需補備註、記帳等家中電腦、立剪指令失敗等。
- **自動化**：圖書館每日整理（21:52）、理財 AI 家中電腦是否在線、立剪遠端剪輯、影音上傳（21:20）。
- **各區資料**：圖書館、理財管家、工程中心（本機）、立剪、影音庫、即時對話、本機收藏的數量與最近更新。
- **處理紀錄**：`lizhi_ai_runs` 的 AI 執行紀錄，加上各表的近期事件（上傳、上架、剪輯指令、記帳解析）。

雲端資料由 `lizhi_status_summary()` 一次取回（`supabase/migrations/011_lizhi_ai_center.sql`，依登入者權限執行）；
工程中心與本機收藏在瀏覽器裡直接讀，不上傳。

## 給 Claude：寫處理紀錄

Claude 替使用者做完一件跟網站資料有關的事（整理圖書館、送立剪指令、修理財資料……），最後寫一筆：

```sql
insert into lizhi_ai_runs (user_id, source, kind, status, title, detail)
select id, 'library', 'daily', 'ok', '整理了 5 本，放上 土木工程、英文', '新書架：英文；略過 1 本（掃描檔）'
from auth.users where email = 'lihuany635@gmail.com';
```

- `source`：library / finance / licut / engineering / media / chat / site
- `kind`：daily（排程）、manual（對話中手動）、command、fix …
- `status`：ok / warning（有略過或部分失敗）/ error
- `title` 一句話、`detail` 補充，都用繁體中文；沒做任何事（例如沒有新書）就不用寫。


## 跨 AI 共通工作規則

各類自動化工作紀錄依 [立之雲端庫 AI 員工守則 v1.0](../docs/AI_EMPLOYEE_HANDBOOK_v1.0.md) 統一表述：實際完成內容、驗證範圍、待確認／失敗、下一步及是否須使用者操作。現有 `lizhi_ai_runs` 只記錄執行事件，不代表其他 AI 已實際讀取守則或接受工作交接；未來已讀確認需獨立實作。


## 新 App 建置前訪談

在軟體專案正式開發前，AI 應依 [App 開發需求訪談規範與問題模板 v1.0](../docs/APP_REQUIREMENTS_INTERVIEW_v1.0.md) 分輪釐清核心用途、使用者、平台、資料、AI 權限、成本與驗收標準，產出可追溯的需求確認單並登記工作台。它與「AI 員工守則」一起顯示在製作工作台「員工必知」；現有 AI 處理中心只提供狀態紀錄，不代表各 AI 已自動讀取該規則。
