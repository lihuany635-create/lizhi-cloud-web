# GridCraft P0｜Excel 高保真匯入與指定範圍修改規格 v1.0
日期：2026-11-18｜需求來源：Google Drive「GridCraft…整合計畫書 v1.1」第十二章。
狀態：**開發規格候選 PASS（來源核對）、真實 Excel 匯入／回存 NOT_TESTED**；沒有任何使用者附件被讀取或修改。

## 目的與非目標
使用者上傳既有 Excel 後，在 ChatGPT 以自然語言指定修改「一部分」，保持整本工作簿中**未授權修改的內容與支援物件不變**，另存新版本與差異報告。絕不把「讀到儲存格的值」當作「完整複製整本 Excel」。

初期 .xlsx 優先；.xls/.xlsm/.xlsb/.ods 各自獨立評估與分級。不能將 GridCraft 能開啟某格式視為保證無損。

## 官方來源能力與界線（已核對程式庫文件，未執行）
- 官方 `docs/mcp.md`：原生 MCP 支援 `open_workbook`、`save_workbook`、`read_range`、`write_range`、`set_cell`、`get_cell` 等；全部須由受限 gateway 包裝，不對外暴露任意 path 或 `execute_command`。
- 官方 `docs/cli.md`：`gridcraft-cli check <file-or-dir> --json` 可產生計算與 round-trip 差異；包含 `package,sheets,values,formulas,numFmts,merges,names,tables,condFormats,validations,charts,comments,hyperlinks,pivots` 類別。工具檢查通過僅代表**其所比較類別**，不保證所有 Excel 物件位元級保真。
- 官方 `docs/cli.md`：.xls 匯入尚不保留 fonts/fills/borders/charts/其他物件；不支援輸出 .xls。.xlsb/.ods 主要是工作表資料匯入，格式與其他功能省略。因此這三類預設標為「無損未證實」，不能逕行以 GridCraft 回存覆蓋來源。
- .xlsm 及 VBA、巨集、樞紐與外部連結、嵌入圖片、圖形、列印設定、表單元件等：必須分項驗證並明示不支援時的策略，不能由 `check` 成功推論全數保留。

## 執行契約：五步驟
1. **取得原始檔**：上傳附件經使用者授權導入後，產生受限 `source_file_id`、原件 hash/大小/格式、owner 綁定。原件唯讀；阻止巨量解壓、外部連結載入、未授權巨集執行。原生磁碟路徑不得由 ChatGPT 工具參數提供。
2. **盤點與相容性**：列出工作表順序、儲存格類型/值/公式、樣式與合併、條件格式/資料驗證、圖表/圖片/形狀、列印設定、命名範圍、外部關聯、巨集等；為每類標 `PRESERVED`、`PARTIAL`、`UNSUPPORTED`、`NOT_TESTED`。P1 使用官方 `check --json` 加獨立檢查器核對其未涵蓋的類別。
3. **預覽與定界**：將自然語言轉成 `workbook_id`、`sheet`、`range`、`action`、`expected_version`、`request_id`。只准更改白名單範圍。涉及刪除工作表/大量影響的動作應先明確確認；不能自行修整其他格。
4. **安全寫入**：建立獨立版本副本，owner 驗證、request-id 去重、版本 CAS、同一本工作簿寫入鎖、可回退快照。禁止輸入任意程式/ shell、網路目標或本機路徑。公式相依造成的值更新單獨列為 `DEPENDENT_RECALC`。
5. **儲存／比對／交付**：回存副本，重新開啟，比對原件與修改後內容，差異類型 `REQUESTED` / `DEPENDENT_RECALC` / `UNEXPECTED`。任何非預期物件流失＝FAIL／禁止標記無損。輸出新版 XLSX 與精簡差異摘要，原件 hash 不變。未知/不支援時應**拒絕有損交付**或經驗證改走「保留 OOXML 未修改物件」的局部編輯路徑。

## 預計新增的受限工具（尚未實作）
- `gridcraft_import_excel(source_file_id)`：產生隔離工作簿 ID 和盤點；僅接受系統簽發的安全來源引用。
- `gridcraft_inspect_import(workbook_id)`：相容性矩陣/警告/版本，不回傳整本私人資料。
- `gridcraft_preview_changes(workbook_id, changes[], expected_version)`：列出受影響的範圍/公式連動；不寫入。
- `gridcraft_compare_versions(workbook_id, baseline_version, candidate_version)`：結構與語意差異、受影響物件。
- `gridcraft_restore_version(workbook_id, version, request_id)`：經本人授權，保留恢復前版本。
- `gridcraft_export_workbook(workbook_id, version)`：帶權限/過期的下載，限制檔名/大小。
保留已有 `gridcraft_read_range`、`gridcraft_set_cell`、`gridcraft_write_range` 的範圍/數量上限；前後端都須重新授權校驗。

## 固定驗收（P5 需全部逐項判定）
| 測項 | PASS 條件 | 目前 |
|---|---|---|
| T01 多工作表 | 名稱、順序、值、格式及重新開啟一致 | NOT_TESTED |
| T02 單格局改 | 只改授權格，無非預期格式/物件更動 | NOT_TESTED |
| T03 公式修改 | 公式正確、依賴重算標示清楚 | NOT_TESTED |
| T04 複雜版面 | 合併/圖表/圖片/條件格式/驗證/列印皆各類盤點 | NOT_TESTED |
| T05 特殊檔案 | .xlsm/巨集/樞紐/外連先偵測，不支援不有損覆寫 | NOT_TESTED |
| T06 版本與重試 | 原始 hash 不變；CAS、去重、還原成功 | NOT_TESTED |
| T07 雙模式 | 電腦關機雲端可操作；本機授權才可桌面操作 | NOT_TESTED |
| T08 XLSX 交叉查驗 | Excel 相容程式可開啟並與差異報告一致 | NOT_TESTED |

## P1 的最低可執行測試
1. 固定 upstream v0.19.1 的 commit/tag、CLI 的 build SHA，隔離環境啟動官方 `gridcraft-cli mcp`；用既有 `gridcraft_mcp_probe.py` 作 handshake/合成讀寫/存檔初測。
2. 合成多工作表 .xlsx，留存來源 SHA256，先跑 `gridcraft-cli check input.xlsx --json`，收集 `roundTrip.categories`/import warnings/公式 mismatch；另做對照編輯後重開檔。
3. 為 T01～T05 準備帶公式、樣式、圖片、圖表、條件格式、資料驗證、外部連結或巨集的安全合成夾具。另用 OOXML 結構/Excel 開檔檢查補足 `check` 未涵蓋欄位。
4. 僅在以上**真實執行**之後才把任一測項改 PASS；測試未執行時仍 NOT_TESTED。

來源：
- https://github.com/storytold/gridcraft/blob/main/docs/mcp.md
- https://github.com/storytold/gridcraft/blob/main/docs/cli.md
- https://docs.google.com/document/d/17JBEggCL-h0GPsXCt6szi4cE7O-NzlILTlPrJzfjuQg/edit
