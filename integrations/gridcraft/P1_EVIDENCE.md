# GridCraft P1｜官方 CLI 與 Excel 實測證據（2026-11-18）
狀態：**P1 最低門檻已實際 PASS（限合成測試檔）／待獨立複核**；尚未部署原 Private Site，尚未開啟付費服務，尚未接通雲端存續實例。

## 鎖定版本與真實環境
- 官方發行：`storytold/gridcraft` v0.19.1，Linux x86_64 tarball。
- 下載 SHA256：`8d97bba2d5bb00fd69ed55064852c1fd914de40d5ecd55ca01c8df81b828946d`。
- 官方 CLI 執行回傳：`gridcraft-cli 0.19.1`。
- 環境：GitHub Actions 公開倉庫的標準 `ubuntu-24.04` runner，權限 `contents: read`，8 分鐘上限；僅隔離合成檔，無任何使用者正式 Excel 或 Secrets。
- 工作流程：`.github/workflows/gridcraft-p1-headless.yml`；草稿 PR #88，不合併 main。

## 執行證據（不要用偽測試代替）
| 範圍 | 結果 | 真實證據 |
|---|---|---|
| 官方 CLI 發行檔 SHA256 + 版本 | PASS | [Run #44215564429](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44215564429) |
| STDIO MCP initialize/tools/list、合成讀寫、XLSX ZIP、CLI check | PASS | [Run #44215128865](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44215128865) |
| 外部獨立產生的兩工作表 XLSX 匯入／檢查 | PASS（此合成檔） | [Run #44215497512](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44215497512) |
| GridCraft 修改「估價清單!B3」2300→2500 | PASS（此合成檔） | 同上 |
| 公式 D3 = B3*C3，69000→75000，非指定儲存格語意不變 | PASS（此合成檔） | 同上 |
| 匯入前/後 `gridcraft-cli check --json` | PASS：opened=1、roundTripDiffering=0、mismatched=0 | 同上 |
| 複雜 XLSX 圖表/繪圖、合併、條件格式、驗證 | PASS（此合成檔功能計數與官方比對範圍） | [Run #44215564429](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44215564429) |
| 複雜 XLSX 公式對照 | PASS：3/3 相符、roundTripDiffering=0 | 同上 |
| 更多圖片、樞紐、外部連結、巨集、.xls/.xlsm/.xlsb | NOT_TESTED（另立案例） | 本輪沒有這些外部檔案 |
| 版本鎖、重送去重、雲端持久化、桌面控制 | NOT_TESTED（屬 P2～P5） | 尚無雲端 MCP Gateway 和遠端連線 |
| Excel 原生桌面程式開啟及修復提示測試 | NOT_TESTED（屬 P5） | 本輪只用 CLI 與 OOXML 語意比對 |

## 有失敗、也有修正
- [Run #44215330684](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44215330684)：首次真實匯入測試**失敗**，因本方測試程式將 XML `t=str`→共用字串 `t=s`、`t=n`→省略的**等效儲存表示**當成值變動；不是 GridCraft 修改了那些儲存格的語意。正式修正比對器對同值/同公式採語意正規化；未放寬 B3 目標值、D3 連動值、工作表／合併及 OOXML 部分的檢查。
- [Run #44215497512](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44215497512)：修正後再跑實際官方 CLI，完整成功。保留失敗歷史，不能刪改。

## 固定合成測試資產（GitHub）
- `integrations/gridcraft/gridcraft_mcp_probe.py`：官方 CLI 原生 STDIO 路徑。
- `integrations/gridcraft/p1_fidelity_probe.py`：獨立來源 Excel 檔 SHA、雙工作表、單一指定格、公式連動、完整其他格核對。
- `integrations/gridcraft/p1_complex_probe.py`：獨立來源複雜檔及 chart/merge/CF/validation 結構。
- `integrations/gridcraft/fixtures/engineering_estimate.xlsx.b64`：獨立工具生成的可公開合成 Excel，SHA256 `372da585170c730613e5c83cf78cf027a5815403a3d979eff57a6587fc3fec7f`。
- `integrations/gridcraft/fixtures/engineering_complex.xlsx.b64`：含圖表、格式與驗證的合成 Excel，SHA256 `5284b551cd3fe48e8594d428e864115abdd9dc6ef191087666f30773ebb077aa`。

## P1 Gate 結論與明確限制
**PASS（合成資料範圍）**：可在真正的 Linux GridCraft v0.19.1 Headless CLI 上執行 MCP 讀寫、以獨立生成 XLSX 匯入、指定範圍修改、公式重算、儲存與再開啟；基礎與特定複雜類型的 round-trip 皆未發現該檢測範圍內的差異。

**非全面保真保證**：未涵蓋巨集 VBA、樞紐、圖片、所有圖表細節、未知 Excel OOXML 擴充、密碼、其他格式及 Excel 桌面相容性；依計畫書 v1.1 必須逐檔評估，不支援時不可有損覆寫。

**下一階段 P2**：確認免新增費用／受控制的雲端 Headless 運算與工作簿持久化方案，驗證帳號隔離、版本保存與備份後，再進入原 Site 附加工具開發。未經本人批准不得部署或變更既有正式資料。
