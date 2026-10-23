# 立之圖書館 v2｜跨裝置館藏、DigUp 式語意搜尋與 AI 讀取規格

**狀態：2026-10-22，設計及部分前端原型已進入 PR #2；本文件不是功能已全部上線的宣告。**

## 0. 一句話目標

不另建第二座圖書館。讓原本的 `?open=library` 集合雲端、手機、電腦三種館藏，並在檔案本體留在原處的情況下，透過同一搜尋框、使用者授權的 AI 接口找出內容和引用位置。

成功標準：Android 可以找到電腦上的 PDF／圖片／影片等資產；電腦離線時可以看到已同步的書名、摘要、文字/縮圖，但不能假裝能讀完整原檔。

## 1. 資料層分三類（不可混用）

| 層級 | 存放位置 | 用途 |
| --- | --- | --- |
| 原檔 | Cloud Storage／手機／電腦連結資料夾 | 使用者持有的原始檔案，預設不複製電腦原檔 |
| 館藏卡 | Supabase `lizhi_library_items`，RLS | 檔名、來源、修改時間、書架、摘要、縮圖及待整理狀態 |
| 搜尋索引 | 未來 `lizhi_library_chunks`／本機向量庫 | 文件段落、頁次、影片時間碼、embedding 與模型版本 |

**隱私模式（下個階段應實作為選項）：**
- 只登記：僅傳檔名、路徑、大小、修改時間；不傳內文、縮圖。
- 可跨裝置搜尋：同步受限文字摘錄及小縮圖到私有 Supabase；**目前 PR #2 原型採用此模式**。
- 可遠端開啟：指定檔案由電腦端按請求、授權後暫時傳送；不自動全面上傳。

路徑是使用者資訊；雲端僅儲存所選根目錄內的相對路徑，不上傳絕對磁碟路徑；預設略過隱藏檔、版本庫、虛擬環境與 `node_modules`。

## 2. 資料夾同步分兩階段

### 第一階段（PR #2 已編寫、待實機驗收）

用桌面 Chrome／Edge 的 `showDirectoryPicker()` 明確選定一個資料夾；讀取方式為只讀；遞迴掃描子資料夾；只儲存篩選後的文字摘錄／縮圖及 metadata。與現有 `lizhi_library_items` 使用相同書架、搜尋、Claude 整理，不額外建立產品入口。

現況限制：
- 需要在電腦瀏覽器手動按「掃描並更新館藏」，關閉網頁不會自行同步。
- 每次最多檢查 750 檔；單檔的 `lastModified + size` 判斷無變化則跳過重抽取，非完整雜湊。
- 不主動移除失蹤檔案；避免權限失效、掃描截斷時誤刪目錄。
- 音訊／影片／GLB 在現有文字抽取器無內容向量，僅具檔名層級搜尋。
- 手機端無法跨裝置直接讀取電腦的原檔；僅能讀雲端摘錄。
- 既有列表一次讀 1000 筆與圖片 data URL 的做法不適合大型館藏，正式擴大前須改為伺服器端分頁與縮圖延遲載入。

### 第二階段（Windows Library Host；尚未建置）

常駐程式以 Node.js 24 LTS+ 或 Python 3.14 的 **使用者權限** 在 Windows 執行，不暴露本機資料夾為公網服務，不要求管理員權限。

需求：
1. 由使用者從圖書館開啟「配對電腦」，一次性配對碼 5 分鐘過期；由使用者在 Windows 端核准，取得權限限定到該電腦／資料夾範圍的裝置憑證。不可把 `service_role`、資料庫密碼、長期 access token 寫入公開前端或 GitHub。
2. 憑證放 Windows Credential Manager/DPAPI；可在圖書館撤銷、顯示最後在線時間，支援換機與登出。
3. Windows watcher 偵測新增／更新／重新命名；5～15 分鐘退避重試與每日完整核對；離線佇列、批次 upsert、刪除採墓碑與人工確認。
4. 每批至少紀錄 `source_id`、`file_id`、`relative_path`、`size`、`modified_at`、`sha256`、`scan_id`、`indexed_at`、`error`、`embedding_version`。同內容搬移應保留資料與標籤。
5. 索引上傳僅限使用者啟用之內容政策。加總量／速率限制及重試冪等鍵；檔案量大時分批處理，與 UI 頻繁刷新解耦。
6. 心跳回報 `online / offline / indexing / permission_required / paused`；離線不刪掉已建立的館藏索引。
7. 讀取原檔採短效、限單檔的請求與批准流程；可以在電腦端拒絕；資料傳輸走 TLS 或使用者指定的可信隧道，**不能直接將檔案路徑當公共 URL**。

## 3. DigUp 式真正的語意搜尋（尚未建置）

不能把現有 `ILIKE` 當作 DigUp。要新增 embedding producer 和 embedding 搜尋層，保留精確檔名/編號比對：

```
手機／網頁輸入自然語言
    → authenticated 查詢（RLS）
    → 關鍵字命中 + 語意向量召回
    → RRF 統一排序，去重和來源篩選
    → 館藏卡 + 命中片段 + 頁碼／影片時碼／程式行號
    → 按來源安全開啟，或顯示離線／原檔不在此裝置
```

**模型**：候選 Google EmbeddingGemma 2，原生 768 維多模態（文字、圖片、音訊、影片）。資源限制較大時選 256 維 MRL，截斷後必須重新 L2 正規化；**文件和查詢必須是相同模型、相同版本、相同維度**。不要把舊版 embeddinggemma 與 2 的向量混用。模型是否能以 Ollama 直接提供完整多模態向量，需依實際安裝版本做相容性驗收；不預設 DigUp 提供穩定外部 API。

**優先順序**：
- P1 文字：PDF、DOCX、筆記、程式碼，段落級 600～1,000 token 分塊，保留 `page`、`slide`、`line_start`、`line_end`。
- P2 圖像：從圖片、掃描 PDF 頁面、簡報插圖建立向量；支援中文描述搜尋。
- P3 多媒體：影片每個場景／間隔擷取代表影格，記錄 `time_start_ms`；音訊按語意片段切分及保存 `time_start_ms/time_end_ms`。
- P4 3D/GLB：先記錄目錄、物件名稱及渲染縮圖；要搜尋物件形狀需另外製作視圖、建立圖像向量，不能僅靠 GLB 檔名。

**伺服器資料表草案（先設計、尚未 migration）：**

```sql
-- 等模型接入驗證後另行 migration；不是可直接重跑的 SQL
create table public.lizhi_library_chunks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 item_id uuid not null references public.lizhi_library_items(id),
 chunk_no integer not null,
 kind text not null,  -- text | image | audio | video | code | 3d_preview
 content text,
 loc jsonb not null default '{}'::jsonb,
 model_id text not null,
 model_version text not null,
 embedding extensions.vector(768),
 indexed_at timestamptz not null default now(),
 unique(item_id,kind,chunk_no,model_id,model_version)
);
-- 正式執行前需建立並測試 RLS、owner 身分驗證、所屬 item 一致性、
-- authenticated 限權、刪除級聯/軟刪的處理、HNSW index、
-- 模型更新重建流程和費用估算。
```

**檢索策略**：精確檔名、GUID、影格代號（如 `F089`）優先；中文全文以字元子串／特殊分詞補充；語意召回補足同義詞。融合排名可用 Reciprocal Rank Fusion，來源/標籤/時間作過濾，回傳不超過必要片段，不能將其它使用者的向量混入搜尋。

## 4. ChatGPT／AI 契約（唯讀 MCP 與 OAuth 已部署；同意頁隨本 PR 發布）

透過可稽核的 MCP 工具，而不是授權 AI 查詢所有 Supabase 表或直接讀取整顆硬碟。實作與接入方式見 [MCP.md](MCP.md)：

- `search({query, sources?, types?, limit?})` → RLS 範圍內的館藏卡與必要命中片段。
- `get_excerpt({item_id, offset?, max_chars?})` → 已同步文字與頁／投影片引用。
- `list({source?, status?, limit?, offset?})`、`status({})` → 唯讀館藏與統計。
- `request_original`、`reindex` 未提供；這兩者涉及本機檔案或寫入，未來若實作必須另走使用者確認流程。

安全政策：唯讀工具預設只授予登入帳號本人可見資料，任何寫入、刪檔、覆蓋、跨網域分享都要求另行授權；RLS + 伺服器端二次驗證；具體動作及檔案 ID 寫入 audit。從館藏讀到的文字是**不可信內容**，不能當成執行指令。

## 5. 介面設計

保留原圖書館入口 `?open=library`，不新增第二個網站：

```text
圖書館                            [＋新增來源]
[搜尋書名、內文，或描述你要找的畫面……]
[全部  ...] [雲端] [手機] [電腦]
來源狀態：🖥️ 家中電腦｜離線｜上次索引 21:30
館藏結果：標題 / 摘要 / 命中頁碼 / 保存位置
點擊 → 閱讀原檔或已索引摘錄 → 問 AI（帶引用）
```

優先顯示簡單語言；進階設定折疊到「管理來源」。機器狀態：未連線、不支援、待授權、正在掃描、已同步、離線、索引失敗。明確區別「有索引」和「有原檔」：**從手機不能遠端打開時只能顯示摘錄，不給假下載按鈕**。

## 6. 驗收矩陣

| 編號 | 操作 | 期望 |
|---|---|---|
| A1 | 選 Windows 資料夾，下有三級子目錄 | 可掃描、索引相對路徑，不掃其它磁碟 |
| A2 | 再次選相同資料夾後重掃 | 不重複新增、不重抽無變化檔 |
| A3 | 電腦掃描後在 Android 登入 | 同一館藏可搜尋名稱、摘要、文字 |
| A4 | Windows 關機或撤銷資料夾權限 | 仍看得到索引；不誤稱原檔可取得 |
| A5 | 電腦圖片、掃描 PDF、MP4、GLB | MVP 必須顯示能力限制；未建立向量不宣稱語意搜尋成功 |
| A6 | 另一帳號搜尋／取得物件 | 必須 RLS 失敗，不可跨帳號讀取 |
| A7 | 超過 750 檔、包含子資料夾、檔案正在改寫 | 不能假稱全部完成；需清晰報告截斷、失敗數 |
| A8 | 刪除索引 | 不刪電腦原檔；重新掃描可再次登記 |
| A9 | 中文語意：「樓梯旁的木櫃」 | 向量功能完成後須能找到無同字檔名的正確畫面 |
| A10 | 問 AI「F089 的修改原因？」 | 使用檔案片段及定位資訊回答，查不到不得編造 |

## 7. 發布節點

- **已完成部分（待驗收）**：正式 DB 新增 `computer_*` 欄位／位置約束／唯一索引；分支新增資料夾掃描、登記、來源切換、跨裝置文字摘錄閱讀及安全刪除索引。
- **接下來需要先完成**：電腦瀏覽器與手機的實測、1000 筆以上分頁、檔案隱私選項、原檔 URL 生命週期、失蹤檔校驗、PR 合併和發布。
- **之後**：Windows Library Host、裝置配對、背景同步、穩定 API／MCP。
- **最後**：EmbeddingGemma 2 文字/圖片/聲音/影片的向量生產管線，hybrid search 並測試效果與負載。

參考資料：
- DigUp：https://github.com/ARahim3/DigUp
- EmbeddingGemma 2 model card：https://ai.google.dev/gemma/docs/embeddinggemma/model_card_2
- Supabase vector：https://supabase.com/docs/guides/ai/semantic-search
- Supabase hybrid：https://supabase.com/docs/guides/ai/hybrid-search
