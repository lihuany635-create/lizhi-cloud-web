# P5｜英文學習教室完整整合候選與正式上線閘門

> **開發狀態：隔離整合／合成測試；正式環境未驗收、未部署。**
> 本文件不是本人正式批准、不是正式安全複核，也不是 P5 交付驗收證明。

## 目前可查證的整合工程

- `tests/learning-loop.test.mjs`：合成資料串起 P3 指定英文學習對話 → 候選單字 → 拒絕未批准正式入卡 → 模擬受信任批准 → 正式卡 → P2 答題／FSRS-7 → P4 自適應計畫、弱點補強與週報；另驗證跨 owner、無授權 session、主觀題與 CEFR 虛構拒絕。
- `release-gate.mjs`：12 項必要正式驗收依據的 fail-closed 閘門。必須提供**外部可信驗證**的證據及對特定 commit/action 的本人批准；單元測試提供的驗證器只是假資料。這個模組永不呼叫任何部署工具。
- `schema/20261115_p5_aggregate_candidate.sql`：**未套用正式環境**的補充資料表草案，為 P2/P3/P4 加入 FSRS 狀態、不可覆寫複習事件、技能證據、經本人授權的學習 session、語言錯誤片段、分技能測驗與每日學習計畫。預設前端只有經 RLS 驗證的本人讀取權限，不可直接寫入。
- `.github/workflows/english-academy-p5-ci.yml`：合成資料的 P0～P5 回歸、P1/P4 行動／桌面瀏覽器、Supabase Edge Deno 編譯及一次性 PostgreSQL 17 完整備份還原（兩個**臨時**資料庫）。

## 正式上線：全部必要驗收都不能省略

| 驗收 ID | 項目 | 2026-11-15 現況 |
|---|---|---|
| p1_google_oauth | 本人 Google OAuth、未授權／過期憑證拒絕 | NOT_TESTED |
| p1_real_rls | 正式 Supabase RLS、跨 owner 負面測試 | NOT_TESTED |
| p1_android | A22 實機瀏覽、朗讀、操作 | BLOCKED：裝置此前離線 |
| p2_fsrs_persistence | 真實 FSRS 卡片／歷史同步、跨裝置 | NOT_TESTED |
| p2_assessment | 所有題型、初測、主觀評分覆核 | NOT_TESTED |
| p3_chatgpt_mcp | ChatGPT 真實 MCP 查詢與候選寫入 | NOT_TESTED |
| p3_oauth_metadata | 真實 OAuth resource metadata、client／audience／撤銷 | NOT_TESTED |
| p4_real_adaptation | 本人真實數據來源的課程與 AI 評分 | NOT_TESTED |
| p5_security | 第二位獨立安全審查與驗證 | NOT_TESTED |
| p5_legacy_regression | 讀書室、工作台、施工照片、圖書館等實際回歸 | NOT_TESTED |
| p5_disaster_restore | 已授權的正式資料備份／測試還原／回退演練 | NOT_TESTED（只有合成 PG17 PASS） |
| p5_end_to_end | 真實英文對話到課程調整整體流程 | NOT_TESTED（只有合成閉環 PASS） |

## 已知發布阻礙

1. **不能將 P5 模擬通過寫成正式 PASS。** 正式 P1 英文資料表及 `lizhi-english-academy` Edge Function 尚不存在於所讀取的正式 Supabase（以最新唯讀查核為準）。
2. **關鍵授權不可只有前端。** 真實 Google OAuth 驗證、用戶清單、P3 MCP OAuth 的 ChatGPT 帳號／本人 Supabase owner 綁定，必須交給受信任後端及獨立安全複核。
3. **P2/P3/P4 持久化不可只依賴記憶體**，須把跨階段正式資料寫入具交易一致性與 RLS 的資料表，保持去重及可追溯歷史。候選 migration 尚未套用。
4. **新舊 MCP 協定需兼容。** 現有私人工作台 Site 同時處理工作台與施工照片工具；需要獨立 adapter 並對舊工具做全套回歸，不得覆蓋既有路由或建立新的正式平行 Site。
5. **Supabase API 金鑰正在遷移**。官方 2026 指引建議改用 publishable/secret keys，已將舊 `anon`／`service_role` 列為淘汰項；P1 目前候選程式仍使用舊環境變數，正式驗收前要完成兼容性與高權限金鑰防洩漏評估。參考：https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
6. P1 的候選新增／略過和 P3 同步**尚未具備正式資料庫原子化交易覆核**，正式同意／撤銷、跨多請求競態、資料保存期限與錯誤更正亦需要補測。
7. P5 的合成備份只允許在 GitHub Actions ephemeral PostgreSQL，**不得把測試備份上傳**；正式備份回復流程必須另核准，不能以刪除正式資料當作預設回退方法。
8. **正式合併 main、Edge 部署、Site 變更、白名單／權限更改、資料庫 migration 或新增費用**均要取得各自明確批准，不能從本次單字指令「P5」推定。

## 發布步驟提案（不是可直接執行的指令）

1. 提交正式系統資料備份、監測、擴權範圍、回退方案、成本估算及由獨立審查者確認的安全分析。
2. 獲得本人對測試環境、資料庫、Edge、主站及 Site **各自**的明確批准後，依受控變更單執行。
3. 在實際環境使用本人及未授權帳號執行驗收矩陣；任何安全重點失敗立即停下並保留證據。
4. 全部必過項目通過後，將正式驗收報告交本人核准。最終部署及上線後回歸需另外留痕。

本分支 Draft PR 不執行這些部署步驟。

## 證據與交接

- P5 草稿 PR：https://github.com/lihuany635-create/lizhi-cloud-web/pull/64
- P5 開發分支：https://github.com/lihuany635-create/lizhi-cloud-web/tree/feature/english-academy-p5-isolated-20261115
- 階段報告目錄：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
- AI 工作台：TASK-006，狀態 doing；`needs_approval=true`，未經本人批准不得標記正式上線完成
