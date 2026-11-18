# GridCraft P0｜驗收與 P1 交接 v1.0
2026-11-18｜範圍 P0（技術盤點＋安全規格＋測試設計），不包含 P1 真實引擎測試及正式部署。

## P0 交付與可核對證據
| ID | 驗收事項 | 結果 | 證據 |
|---|---|---|---|
| P0-01 | 讀正式 AI 員工手冊 v1.4、路徑總索引 v1.2、AI 工作台操作手冊 v2.1、計畫書 v1.1 | PASS | Drive 正式文件 |
| P0-02 | 核對官方 GridCraft Rust workspace v0.19.1、原生 STDIO MCP / Headless / Remote 授權 | PASS（原始碼與文件層） | upstream Cargo.toml / docs/mcp.md / docs/control-protocol.md |
| P0-03 | 核對原 Site route.ts 保留 AI 工作台及 7 個施工照片工具；要求新工具獨立 namespace | PASS（原始碼層） | main/sites-migration/ai-workbench/route.ts |
| P0-04 | 原 repo 草稿 PR #88、README 與合成 MCP probe 建立、GitHub 讀回 | PASS（候選檔案） | PR #88 / integrations/gridcraft/ |
| P0-05 | 將 Excel 原件唯讀、完整盤點、局部變更預覽、差異核對、T01–T08 寫入規格 | PASS（規格） | EXCEL_FIDELITY_SPEC.md + 計畫書第 12 章 |
| P0-06 | 固定 P1 測試程序、可判定的結果及回退條件 | PASS（設計） | EXCEL_FIDELITY_SPEC.md + 本檔 |
| P0-07 | 真正執行 v0.19.1 CLI / XLSX round-trip | NOT_TESTED（屬 P1） | 無真實引擎測試紀錄 |
| P0-08 | 確認可免新增費用且符合安全限制的雲端 Headless 與持久化 | BLOCKED（屬 P2） | 尚無經驗證託管環境 |
| P0-09 | 原 Site /mcp 正式部署、新對話工具可用、桌面操控 | NOT_TESTED（屬 P3～P5） | 無正式發布／操作證據 |

## 安全邊界／未解阻礙
- 正式 main、Site、Edge、資料庫、機密與既有工作簿**均不得因本 P0 改動**；草稿 PR 不得自行合併。原 7 個施工照片工具及原工作台工具必須保持。
- 以使用者本人身分驗證 + 工作簿 owner 索引為權限根源；公開網路不能直接連接 7979；原生 `execute_command` 不對 ChatGPT 直接開放；所有檔案讀寫都經安全 ID 轉換。
- 原始 Excel 一律唯讀＋SHA256；修改後另存可還原版本；`gridcraft-cli check --json` 之外還需要未涵蓋物件的獨立保真檢查。
- Supabase 監控的非快取 GB 只有歷史人工讀數，未驗證官方即時帳單。不可因此假設配額足夠、啟動新付費執行環境。

## Gate 判定
**P0 文件規格及技術盤點：PASS（候選文件自查，待獨立技術複核）。**
這只表示已具備有依據的 P1 測試計畫，**不**表示 CLI、Excel 匯入、MCP 連通、雲端關機操作已通過。
P1 第一個實際工作：固定官方 v0.19.1 二進位版本／原始碼 commit，隔離運行合成 `gridcraft_mcp_probe.py`，補測 `gridcraft-cli check --json` 和真實 XLSX 回存。任何結果均按 PASS/FAIL/NOT_TESTED/BLOCKED 分開記錄。

來源：
- https://github.com/lihuany635-create/lizhi-cloud-web/pull/88
- https://github.com/storytold/gridcraft/blob/main/docs/cli.md
- https://github.com/storytold/gridcraft/blob/main/docs/mcp.md
- https://docs.google.com/document/d/17JBEggCL-h0GPsXCt6szi4cE7O-NzlILTlPrJzfjuQg/edit
