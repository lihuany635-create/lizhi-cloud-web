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
