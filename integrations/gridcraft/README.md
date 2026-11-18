# GridCraft → 立之雲端庫 Private MCP｜v1.2 電腦在線優先候選

狀態：**開發候選／尚未正式接通**（2026-11-18）。本分支不更動既有 Private Site、Supabase 正式資料、main 或原有 MCP。這不是部署完成證明。

## P3 開發候選（2026-11-18）：已通過隔離測試、正式連線尚未部署
- P3 嚴格沿用**原 Private Site、原 Supabase 專案**，無新 Site、無新資料庫、無正式 Edge 或 SQL 變更；[P3_HANDOFF.md](P3_HANDOFF.md) 是最新候選、安全與接續依據。
- 原 Site 擬追加 `gridcraft_status / gridcraft_list_workbooks / gridcraft_read_range`，另設獨立 Gate 的 `gridcraft_pair_start`；原 AI 工作台與施工照片工具不可移除。預設 `GRIDCRAFT_P3_ENABLED=false`、`GRIDCRAFT_PAIRING_ENABLED=false`。
- Windows v0.2 候選：一鍵開啟 GridCraft、本人一次性配對碼、工作簿本機授權、DPAPI 裝置密鑰、按鍵啟停 HTTPS 主動出站（不公開 7979）。已由 Windows 真實 runner [#44223637530](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223637530) 驗證 **32/32 自動測試與 EXE 自檢通過**；ZIP 已存[原私人 Drive](https://drive.google.com/file/d/10nQSbwjfSTOE8uyDmNBf3Nvo1BpKEVkn/view)，可先保留原 v0.1，不必立即替換。
- Node 受限 relay＋Site 模擬、Windows 出站代理、Deno Edge 候選及隔離 PostgreSQL 16 均已有獨立 CI 證據，**但沒有實際雲端中繼發布與本人新對話 MCP 工具**，標記 NOT_DEPLOYED／NOT_TESTED。
- **正式 Gate**：獨立安全審查／歷史與即時流量核對、本人批准原 Site 及既有 Supabase 的最小 migration+Edge，部署 Gate OFF→驗證→配對→逐項 Gate ON；P4 才開指定格寫入。

## 2026-11-18 最新使用者決策：電腦開機才需連線（優先於下列歷史規格）
- **主線更改**：Windows 電腦在線且已啟動本機代理、GridCraft 桌面程式後才允許 ChatGPT 在私人 Site 以 gridcraft_* 工具操作。關機與代理離線回報 `DEVICE_OFFLINE`；GridCraft 未開回報 `GRIDCRAFT_OFFLINE`，撤權回報 `UNAUTHORIZED`。
- **不再要求**永久雲端 GridCraft 執行／雲端 Storage 作為 P2 前置條件。原本 P2 雲端 runner 及跨 runner 的合成成果仍保留歷史；不等於本人電腦已連接。
- **必須**有 Windows 本機代理「主動出站」連到既有本人驗證的安全中繼，不能讓遠端 ChatGPT 直接連 `127.0.0.1:7979`；該控制埠和權杖只留本機。
- 新候選檔 [gridcraft_desktop_local.py](gridcraft_desktop_local.py) 僅支援 `window.list`、`document.inspect`、`sheet.read`、`cell.get`，**寫入及正式雲端中繼尚未實作**；[test_desktop_local.py](test_desktop_local.py) 的 6 個模擬協定測試 PASS（GitHub Actions [#44219256668](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44219256668)）。
- Google Drive 原計畫書 [v1.2](https://docs.google.com/document/d/17JBEggCL-h0GPsXCt6szi4cE7O-NzlILTlPrJzfjuQg/edit) 第 13 章是最新覆蓋條款；原下方過去雲端優先與 BLOCKED 叙述僅保留歷史，**不再作為新 P2 的先決條件**。
- **目前尚缺**：雲端出站中繼／owner、device 身分驗證、Windows 真機上安裝啟動代理並確認 GridCraft 授權、開關機與寫入實測、原 Site MCP 正式接線。原 PR #88 維持 draft，未合併／未部署。

## P0 本次補齊（2026-11-18）
- 計畫書目前以 [Google Drive v1.2](https://docs.google.com/document/d/17JBEggCL-h0GPsXCt6szi4cE7O-NzlILTlPrJzfjuQg/edit)，P0～P5 共六階段。
- **Excel 高保真匯入與局部修改為核心成功條件**：原件永不覆寫、整本工作簿盤點、指定格／範圍才可修改、差異報告與恢復版本；不支援的巨集／物件不能宣稱完整複製。
- 詳細導入、受限工具契約與 T01～T08 驗收：[EXCEL_FIDELITY_SPEC.md](EXCEL_FIDELITY_SPEC.md)。
- P0 驗收與 P1 接手：[P0_ACCEPTANCE.md](P0_ACCEPTANCE.md)。
- 官方 `gridcraft-cli check <file-or-dir> --json` 有 round-trip 與公式檢查；對其沒有列出的 Excel 物件仍須獨立驗證。此能力是官方文件盤點，**尚未執行測試**。
- P0 文件盤點和規格 PASS（候選自查、待獨立技術複核）；GridCraft CLI 與真實 Excel 檔案的 T01–T08 仍全部 NOT_TESTED。

## P2 雲端引擎與持久化的實際狀態（2026-11-18）
- **原生運算 PASS**：GitHub Actions 的標準雲端 Linux runner 已真實執行 GridCraft v0.19.1 CLI，無須使用者電腦在線；但 runner 是單次運算，**不是長期運行的 HTTP MCP**。
- **版本化儲存契約 PASS（隔離合成測試）**：`p2_synthetic_store.py`＋`p2_synthetic_test.py` 在同一 runner 的 SQLite 中通過 6/6：owner 欄位隔離、CAS、去重、損毀偵測、恢復、重新開啟及真正 CLI 局改。此模組必須設定 `GRIDCRAFT_P2_SYNTHETIC_ONLY=1`，不可用於真人 Excel。
- **P2 主驗收仍 BLOCKED**：runner 關閉後工作簿沒有永久保存；尚無正式 Private Storage/Drive API 權限、被批准的即時雲端引擎及可核對的 Supabase 官方帳期／剩餘額度。P3 不可在此基礎上宣告可用。
- 真實執行：[CI #44217406071](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44217406071)；[P2_EVIDENCE.md](P2_EVIDENCE.md)。不合併或部署、沒有變更正式 Supabase 或使用者檔案。

## 已核對的依據

- 使用者最新指定（2026-11-18）：GridCraft v0.19.1，**Windows 電腦開機且代理／程式在線即能連線**；雲端 Headless 改為日後選配。
- 原作者原始碼：https://github.com/storytold/gridcraft
- 官方 MCP 規格：https://github.com/storytold/gridcraft/blob/main/docs/mcp.md
- 官方桌面控制與認證：https://github.com/storytold/gridcraft/blob/main/docs/control-protocol.md
- 官方 CLI：https://github.com/storytold/gridcraft/blob/main/docs/cli.md
- 規則來源：Drive 最新《AI 員工手冊》、全功能路徑索引及《工作｜AI 工作台 操作手冊 v2.1》。
- 已有 AI 工作台 Private Site：`sites-migration/ai-workbench/route.ts`，目前 `tools/list` 會合併工作台及施工照片工具。不得直接用 GridCraft 替換既有工具。
- 截至 2026-11-18 的非快取流量監控為人工歷史資料（2026-11-16 觀察 10.549 GB／5 GB 基準），**非即時官方帳務證明**。不得在未確認餘額及費用時新增大量回傳或輪詢。

## 技術事實與接法

1. 原生 `gridcraft-cli mcp` 是 **STDIO JSON-RPC**，沒有可直接填入 ChatGPT Private Site 的 HTTPS MCP URL。
2. **雲端**需要受控的常駐／按需運算環境執行 GridCraft Headless 引擎，外層提供經本人驗證的 HTTPS MCP 轉接、工作簿隔離及持久儲存；Cloudflare/Sites Worker 不能直接啟動本機 CLI。不得將「已編寫轉接程式」混同「已配置雲端運算」。
3. **桌面**：`gridcraft --control 7979`，本機 `gridcraft-cli mcp --connect 7979`；桌面控制通道位於 localhost，需 GridCraft 原生權杖驗證。禁止把 7979 Port 或 token 暴露到公網，PC 離線時此模式不可用。
4. 雲端 Site 仍沿用原本人驗證及工具發現流程；以 `gridcraft_*` 命名空間附加工具，不移除或破壞原工具，禁止未批准新建 Site 或第二套公開 MCP。
5. 雲端運算主機、持久工作簿儲存、備份位置及費用目前**尚未選定或驗證**，正式接通標示 BLOCKED；不為了宣稱完成而建立新付費服務。

## 候選架構

```text
ChatGPT
  ↓ 本人驗證（原 Private Site /mcp）
原站工具路由（保留現有工具） → GridCraft 限權 HTTP 轉接
                                   ↓ 授權的會話管理
                         Cloud GridCraft Headless 運算執行個體
                                   ↓
                      有版本與還原能力的私有工作簿儲存
```

桌面增補路徑：同一組受限工具經**有本人授權的本機橋接代理**，才可連到 `127.0.0.1:7979`；沒有在線且已授權代理就回報 `DEVICE_OFFLINE`，不得自動打開公網 Port。

## 安全限制（正式上線前必備）

- 只讓伺服器端取得 owner 身分、保密憑證及檔案索引；禁止客戶端提交任意磁碟路徑、shell 指令或服務網址。
- 每個 owner／workbook 嚴格分隔，採用明確工作簿 ID、白名單目錄及檔案大小上限；限制 `open_workbook`/`save_workbook`、`execute_command` 的能力範圍，避免任意系統檔案存取。
- 讀取先行；寫入需要檔案版本預期值、同工作簿寫入鎖、快照備份、失敗回滾／可恢復、重試去重。
- 工具回應預設只回傳必要儲存格範圍及上限列數，不一次回傳整個工作簿；流量計費與 AI 自登記數分開。
- 跨帳號、過期／撤銷、匿名、指令越權、公式計算、XLSX round-trip 與不中斷現有 MCP 的回歸測試必須逐項驗證。
- 不要把原生 `execute_command` 無限制暴露給遠端使用者；先使用受限、明確 schema 的操作白名單。

## P0 合成資料探測

本分支提供 `integrations/gridcraft/gridcraft_mcp_probe.py`，僅操作**暫存目錄的合成試算表**，不讀取你的私人 Excel，無需憑證，也不修改正式系統。

```sh
python integrations/gridcraft/gridcraft_mcp_probe.py --cli /path/to/gridcraft-cli
```

程式啟動 `gridcraft-cli mcp`，實際進行 initialize、tools/list、new_workbook、write_range、read_range、save_workbook，驗證 XLSX ZIP 完整性；通過才可把「原生 Headless MCP」記為實測 PASS。未執行前均為 NOT_TESTED。

## 階段與驗收門檻

| 階段 | 要求 | 本分支狀態 |
| --- | --- | --- |
| P0 | 官方協定、既有架構、Excel 規格 | 候選規格 PASS，待獨立複核 |
| P1 | 官方 v0.19.1 CLI、Excel 匯入/修改/回存 | 合成資料實測 PASS，待獨立複核 |
| P2 | Windows 本機代理、開機／登入後可連、離線辨識與本機版本保存；不再以雲端永久儲存為前提 | localhost 協定模擬 6/6 PASS，Windows 真機／出站連線 NOT_TESTED |
| P3 | 原 Private Site 增加 GridCraft MCP 限權工具，經受保護出站中繼連 Windows 本機代理 | 尚未實作雲端中繼、未部署 |
| P4 | Windows 真機 GridCraft 授權工作簿讀／寫／存與停止/撤權、關機離線 | NOT_TESTED |
| P5 | 本人電腦開/關兩態、新對話、權限、T01～T08（T07 以在線/離線為準）、原 MCP 回歸 | NOT_TESTED、未部署 |

正式 Site／Edge／資料庫／main 變更、外部付費運算及安全敏感權限，依員工手冊另經本人批准。此候選 PR 不具備正式上線效力。
