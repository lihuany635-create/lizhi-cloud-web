# 立之 CAD｜原生圖面辨識與編輯 v1 交接（開發中）

## 已有正式證據
- 2026-10-25：一般 ChatGPT 六個 Site-backed MCP 工具已載入。
- 使用者確認一次 800×900 mm 矩形實際顯示，`cad_job_status=succeeded`；這證明現有六工具繪圖鏈路，**不代表**可讀取原生物件。

## 新開發範圍
- CADCraft Fork 專屬分支：`lihuany635-create/lizhi-cad:feature/lizhi-cad-entity-inspect-v1`；以原本正式編譯基準 `47cb518c96877bb479c8fb45d4ced214cf843f65` 建立。
- 在真正 Rust/WASM `apps/cadcraft-web/src/host.rs` 加入兩個 **browser-local** 訊息命令：
  - `lizhi.inspect {}`：來自 native `drawing.inspect`，回傳有限圖面統計、範圍、圖層、revision，刪除本機檔案路徑、文字內容、原始 DXF。
  - `lizhi.entities {type?,layer?,selected?,limit?:1..8,offset?:0..10000}`：透過 native `entities`，只顯示至多八筆 handle、類型、圖層和限制尺寸的基本幾何資料。對文字等複雜/敏感物件不返回完整 geometry；JSON 必須符合輸出位元組上限。
- 立之雲端庫 `cad/cad-host.js` 加入相同允許清單（僅本機 postMessage），不允許任意 `execute`、文件路徑、含檔名或無上限讀取；Node 用假的同源 iframe 驗證。
- 這兩項**尚未**列入正式 Sites MCP 工具／Supabase 佇列。現有正式六個工具不動，避免在 Rust/WASM 驗證前造成不相容。

## 下一階段：真正在 ChatGPT 讀取 CAD 原生圖面
要完成通用 `cad_list_entities`、`cad_get_entity`，還須 **另外** 做專用資料庫 read-job 命令、最小權限/防偽造 `request_id`、新 Site/Edge Tool contract、CAD worker result 安全投影，以及不超過 4 KiB 的結果回執。新建功能只能經過真人在網頁按「允許 AI 操作」與短效 session，不上傳 DXF 本體。這些依序通過 Postgres、Deno、Node、安全 E2E 後才考慮獨立正式部署。

## 下一階段：物件精確修改
- CADCraft 原生支援 `move`、`erase`、`undo`，但**不能直接**把裸命令開放給 AI。
- 必須先讀取 handle + `revision`；修改時做 `expected_revision` 樂觀鎖，避免人手改圖後 AI 操作過期物件。
- 第一波寫入僅開 `move {handles:[...],delta:[x,y]}`，先做範圍、個數、鎖圖層、當前圖面版本與手動確認；刪除／裁剪待下一波。
- 每筆修改要具備不可重複 request ID，回執查到 `succeeded` 後才宣稱成功；撤銷及檔案保存仍由本機 CAD 引擎負責。
- 對於「看圖」：現在開發的是**語意幾何資料**，不是螢幕截圖 OCR，也不是任意 DXF 匯出；視覺化截圖需要獨立使用者許可與渲染輸出界線。

## 安全限制
不可新增公開 CAD 引擎、不共用手機 Agent 憑證、不接收本機任意路徑、不讀取原始圖檔、不修改 `main`／正式站／Supabase schema，除非另有明確版本、隔離測試與審核。

## 實際第二階段候選（2026-10-25）
- CADCraft Fork `feature/lizhi-cad-entity-inspect-v1` 的 native Rust read/move commit `cb256cf8a383c422482e8a455e3013887fa39a74`。GitHub Actions `40169757520` 已 PASS：原生 engine query test、WASM target compile、bridge 限制檢查。這是**編譯**與引擎級單元測試，真實瀏覽器 E2E 另測。
- 立之雲端庫獨立 `feature/cad-entity-inspect-v1`：除了 browser-local `lizhi.inspect`／`lizhi.entities`，`lizhi.move` 新增單一實體 handle、位移量、`expectedRevision` 與同步 `window.confirm` 本人確認；native 再次比對實際圖面 revision，過期拒絕。**不提供對話端 move 工具**，待實機驗收及人工復原要求。
- 已準備候選 `cad_inspect_drawing`、`cad_list_entities` 兩個新增 MCP 工具，保留既有六工具。站端 `cad_job_status` 對 read job 的結果只投影 entity handle/type/layer/有限幾何與圖面摘要，不回傳 `path`、檔案或任意 XData。Edge 與 Sites 通道均由原 owner 身分與 server Secret 保護。
- SQL `cad/sites/sql/002_entity_read_queue.REVIEW_ONLY.sql`：只擴充既有 CAD command CHECK 為接受 `lizhi.inspect`、`lizhi.entities`，新增獨立 `service_role`-only `lizhi_cad_site_enqueue_read`；原本 geometry enqueue RPC、手機服務、原圖檔都不修改。狀態**REVIEW_ONLY，未正式執行**。
- CLI/Edge/PG16 隔離測試新 `eight-tool` contract 與 `cad-sites-postgres` 讀取工作回執已通過（GitHub Actions `40170349337`），但這不代表能在正式 ChatGPT 列出八工具；Site 正式仍保留 v3 六工具。
- 獨立候選 Rust/WASM source-build + Playwright Chromium `tests/cad-entity-native-e2e.cjs` 用真正原生引擎測：前置 AI opt-in、畫矩形、原生 inspect/entities 實際 handles、單一 handle move +100 mm、圖面 revision 比對、過期 revision 再移動被拒絕。執行和截圖證據以 `cad-entity-native-e2e.yml` 當輪結果為準，成功前不能列 PASS。

## 發布限制
正式 Site 私人 v3 目前與 GitHub 中的 Sites 伺服器候選不是自動同步；想啟用第七及第八個 MCP 工具，須另行整合現有 Site 原始碼、私人發布 v4、驗證新 SQL／Edge 及 Browser WASM 版本。**不可**直接拿 GitHub 合約通過宣稱已在一般對話可用；在使用者授權新的正式 SQL/Edge 發版之前，也不得改動既有正式服務或 CAD 歷史圖檔。
