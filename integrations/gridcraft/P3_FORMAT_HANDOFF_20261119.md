# GridCraft v0.5.4｜P3 格式與版面受限命令候選

日期：2026-11-19　狀態：候選開發與隔離 CI；沒有發布到原私人 Site / Edge。

## 目標

沿用 PR #105 v0.5.3、P1/P2 已合併的候選基底。P3 透過「一項動作、一份預覽、一份備份」增加格式、合併及頁面設定。透過現有本人驗證、原 Windows 本地 Gate、`P4SafeWriter` 的 CAS／備份與持久防重播索引，以及 P1 來源 OOXML 結構解析，保持受控執行。

## 本階段允許的動作（純白名單）

- `style`：粗斜體、底線、換行、字型、字級、文字色、填滿色、框線（不包含清除外側格線）、數字格式、垂直對齊。
- `merge`：合併／取消合併。合併前拒絕包含非空值／公式的覆蓋儲存格；也不許與既有其他合併範圍相交。
- `rowHeight`：1～40 行，每行 6～120 pt；`columnWidth`：1～16 欄，每欄 1～80 字元。
- `pageSetup`：方向 portrait/landscape、A3/A4/A5/Letter/Legal、列印範圍（上限 200,000 格）、水平／垂直置中。

同一筆請求只能包含 **1 項**動作。格式最多影響 50 格；所有非必要參數都拒絕。**不支援** `horizontalAlign`（原生切換命令在特定情境可能變回 General）、形狀圖片、條件式格式、頁首頁尾、保護、公式編輯、未經驗證的多頁列印進階設定；回傳 `UNSUPPORTED`，不推測成功。

## 安全界線

1. 原生 `engine.execute` **沒有被對外開放**。P3Local 僅接受可由嚴格格式編譯器重組、完全一致比對的命令及參數，固定本機 `127.0.0.1:7979` 與原控制 token。
2. `P3FormatWriter.prepare` 僅讀取本機 XLSX snapshot 結構，產生短效 90 秒預覽；不返回私人格值。`commit` 需要本人逐筆核准旗標＋本機 P4 寫入 Gate，先核對整本工作簿語意指紋、建立 XLSX 備份、再次核對，再持久寫入 request_id 防重播收據後才送出單一 native 格式命令。
3. 執行後會重新擷取本地 XLSX 進行 P1 OOXML 結構比對。要求儲存格值／公式沒有被改動，且目標結構確實產生差異；結果 `EFFECT_OBSERVED_NOT_SAVED` 僅是**受限結構效果**，不宣稱與原 Excel 樣式完全一致、沒有未知 OOXML 損失或已存回磁碟。
4. 逾時、結果不明或讀回異常時不重送，保留本機收據、備份及狀態查詢；重新啟動或工作簿切換後拒絕對舊收據宣稱同一 session 驗證。
5. 沒有 `app.save`／`file.save`／絕對路徑／非本機控制埠／第二套 Site／第二個 MCP。原本 P3 read-only 及 P4/P2 工具必須完全回歸。

## 限制與後續

本候選沒有 Windows 真機操作 GridCraft v0.19.1，沒有視覺像素校驗、原檔 roundtrip、完整 Excel 公式與圖形保留驗收。原始 `P1` 解析器遇未知部件以雜湊比對，但不能視為支援重建。`P4` 階段才會做安全存檔與關閉重開，`P5` 做實際使用者 Windows 端到端。正式 Site/Edge MCP schema 新增要另獲本人批准。

## 參考

- GridCraft v0.19.1 `crates/engine/src/cmd/format.rs`、`crates/engine/src/cmd/print.rs`、`crates/engine/src/cmd/inspect.rs`：官方命令規格。
- 原站 P3/P4 操作手冊與正式《AI 員工手冊》v1.5。
- 前置 P1 PR #106、P2 PR #107，已合併至候選 v0.5.3 branch；PR #105 尚未合併 main。
