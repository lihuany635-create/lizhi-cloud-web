# 立之 CAD｜原私人 Site v3 → v4 讀圖接線發布閘門（候選，不代表已部署）

> 狀態：**NOT AUTHORIZED FOR PRODUCTION**。本文件是 PR #14 的發布前檢查單；不可視為正式授權、發版完成或 ChatGPT 的九工具驗收。工作台專案：`CADCraft × 立之雲端庫整合`。

## 不變的使用者要求

- 維持**原本的私人「立之 CAD 指令代理」Site**，只更新同一個站點；不可另建正式站。
- 真正操作入口是**一般 ChatGPT 對話**，不是 Work；本人在 CAD 網頁明確啟用短效 AI 授權，頁面離線時不能執行圖面工作。
- DXF 原檔、檔名、任意文字與系統路徑留在本機，MCP 僅返回經白名單投影的少量數值幾何。
- 不新增付費 CAD 雲端運算主機；不改手機代理與圖書館，也不改正式 `main` 或使用者原有 DXF。
- 原六工具 `cad_status / cad_draw_rectangle / cad_draw_line / cad_draw_circle / cad_new_drawing / cad_job_status` 必須保留。
- 本版新增的三項均是**讀取**：`cad_inspect_drawing / cad_list_entities / cad_read_job`。原生 `lizhi.move` 的本機測試不構成遠端 `cad_move_entity` 已核准；移動、刪除、修剪、Undo 均排除於本版。

## 已驗證與尚未驗證的界線

| 層 | 隔離證據 | 正式環境 |
|---|---|---|
| Rust CADCraft fork + source-pinned WebAssembly | 原生 Chromium `LINE` 與單一封閉 `Polyline` 800×900 mm 查詢成功，另有原生單一 MOVE 隔離測試 | **新版尚未部署** |
| Node 嚴格合約與數值幾何投影 | 8 筆分頁，LINE/CIRCLE/ARC/Polyline 等允許類型，拒絕額外路徑/文字；不支援的曲線種類不應假稱已可讀 | **僅候選** |
| SQL 002（`REVIEW_ONLY`） | PostgreSQL 16 測試 owner、service_role、read-only、STOP 後隱藏已完成回執；另新增心跳超過30秒及 lease 逾期測試，須以更新後 CI 確認 | **未套用生產資料庫** |
| Site adapter → Deno HTTP Edge → 假 PostgREST | 確認單次 POST、無敏感文字外洩、原生 LINE 數值投影；mock RPC 不能取代正式 Supabase 驗收 | **未部署** |
| 現有 Site v3 | 一般 ChatGPT 之前已驗證六工具 | **仍維持六工具** |
| 本人同意／STOP／離線 | 原生 Chromium 有隔離行為測試 | **尚未做九工具全鏈路驗收** |

參考：[PR #14](https://github.com/lihuany635-create/lizhi-cloud-web/pull/14)、[候選交接](CAD_ENTITY_READ_MCP_V1_HANDOFF.md)、[原生矩形 CI](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40175639715)、[Node/Edge/PG16 CI](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40175639698)。

## 發布許可：全部通過才可動正式環境

- [ ] **取得使用者明確授權**，範圍單獨包含：原 CAD Site v4 更新、新來源固定的 CAD WASM、正式 SQL 002、Edge Function 部署與 Gate 啟用；對未涵蓋項目不可推定授權。
- [ ] 說明目前 PR #14 基底是 `feature/cad-sites-bridge-v1` **不是 main**；將完整來源與依賴差異審查後再決定整合策略，不能直接把 Draft PR 合併為正式主線。
- [ ] 重新核對 GitHub 最新 HEAD 與工作台 revision；固定 fork native commit 和 build SHA。GitHub Actions 產物可能過期，不能以失效附件作為部署來源。
- [ ] 建立可回滾的舊版 Site v3 與現有 Edge bundle、原六工具合約、正式 DB schema / function definitions 的管理員私有備份（**不得匯出密鑰到 GitHub**）。
- [ ] 先取得 SQL 002 的 DBA 安全審查：它包含 `ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT`、`SECURITY DEFINER` 與授權設定；確認現行 schema、Lock 影響、回退路徑及 service_role-only EXECUTE。絕對不要使用全面 `supabase db push`。
- [ ] 審核同源瀏覽器 host 與新 WASM 間的訊息協定、畫布 revision、使用者 opt-in、30秒心跳、STOP、限量輸出與原始檔本機保存。
- [ ] 審核 Site v4 **實際宿主程式**註冊/呼叫三項工具：`site-entity-read.mjs` 目前只是可攜式 module，GitHub CI **不等於原私人 Sites Worker 已安裝或已發布**。保持站點 PRIVATE、本人登入辨識與 server-only Token，不把上游 Secret 送給前端。
- [ ] 不開放 move/delete/trim/erase 和其他未審核的寫入 RPC。

## 推薦部署順序（獲授權後由管理員逐層核對）

1. 對正式前的隔離預覽先測 source-pinned WASM：授權前不能讀、開啟後可讀 LINE/Circle/封閉 Polyline、讀取不更動 revision、STOP 後拒絕；驗證舊本機 DXF 儲存／救援不回歸。
2. 部署**相容**新版 CAD 靜態資源時，保留可回退舊版；任何真實圖檔變動須獨立人工確認。此時原 Site 仍六工具。
3. 經單獨批准後，在正式 PostgreSQL **只審核套用** `cad/sites/sql/002_entity_read_jobs.REVIEW_ONLY.sql` 的必要內容，記錄 migration/授權/約束前後差異；確認 anon/authenticated 不得執行新 read RPC。
4. 發布相容 Edge，但將 `LIZHI_CAD_ENTITY_READ_V1=false`，檢查 Edge tools/list 仍是原六工具，原 status/draw/job 與錯誤類型不回歸；不改原本 Secret 值。
5. 在**同一個私人 Site** 發布 v4 的三工具註冊與 server-side handler，預設 `entityReadEnabled=false`；原六工具及 owner 保護保留。此步須真實 Sites 程式/部署版本證據，不能只拿可攜式 module 充數。
6. 完整驗收後才由管理員協調開啟 Site + Edge 雙層 Gate，且只在本人 CAD 工作階段在線、短效同意時允許排隊。明確記下開 Gate 的版本/時間/責任者。
7. **一般 ChatGPT 真機測試**：`cad_status` → `cad_inspect_drawing` → `cad_read_job` → `cad_list_entities` → `cad_read_job`。比對實際矩形的 `handle`、`revision`、四角點和數值幾何；每項入列不等於已讀取成功。
8. STOP、30秒以上失去心跳、過期授權後再次讀已完成 job 必須拒絕；模擬錯 owner / session、過大資料、重複 request_id、404 / 401 / 403 / 503 / 轉址、網路不確定結果時皆不得自動重試寫入。重跑最初六工具回歸。
9. 在 PR、工作台逐項登記每一層**實際部署**、真機測試證據與版本；在此之前一律保持 `IN_PROGRESS` 而非整體 PASS。

## 任一階段失敗：安全回退

1. **先關閉雙 Gate**（Site `entityReadEnabled=false` 與 Edge `LIZHI_CAD_ENTITY_READ_V1=false`）；必要時由本人按 CAD STOP。
2. 還原原 Site v3 六工具設定，保留 PRIVATE/owner/token；回退到先前可用的 Edge、瀏覽器 WASM 版本。
3. SQL 不得機械化 `DROP` 後還原舊約束，避免破壞已入列讀取工作。先停用 read function 的可達路徑、檢查是否仍有新命令存量，經 DBA 評估再計畫 schema 回退。
4. 使用 `cad_status`、六工具工具清單、原有本機 DXF 存讀與授權 STOP 作回歸。任何先前結果不明的圖面修改不重送。
5. 工作台明確回報哪一層失敗；不得把 CI 模擬通過宣稱成正式已部署。

## 生產變更現在仍待批准

除非使用者另外**明確授權上述正式發布範圍**，此 PR 只能繼續修正/驗證候選程式、文件與隔離 CI。只讀調查、寫入工作台與在 Draft PR 留審查備註，不代表准許修改正式 Site、Supabase、main 或 DXF。
