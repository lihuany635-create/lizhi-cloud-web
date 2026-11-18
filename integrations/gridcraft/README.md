# GridCraft → 立之雲端庫 Private MCP｜P0 候選

狀態：**開發候選／尚未正式接通**（2026-11-18）。本分支不更動既有 Private Site、Supabase 正式資料、main 或原有 MCP。這不是部署完成證明。

## 已核對的依據

- 使用者指定：GridCraft v0.19.1（ArtCraft Launcher），「雲端 MCP 為主、桌面控制為輔」，ChatGPT 直接操作試算表，盡可能電腦關機可用。
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
| P0 | 核對官方原始碼與現有系統；準備無敏感資料的 MCP 探測 | 文件與探測程式開發候選；執行 NOT_TESTED |
| P1 | 實際跑官方 v0.19.1 Headless 並做 XLSX 來回驗證 | NOT_TESTED |
| P2 | 在不新增未批准費用的可用雲端運算環境運行，具工作簿持久化、隔離與權限 | BLOCKED（未選定/驗證雲端執行個體） |
| P3 | 在原 Private Site 附加 `gridcraft_*` 工具並證明原 MCP 無回歸 | 未部署 |
| P4 | 真人 ChatGPT 讀寫、檔案備份讀回、桌面代理、匿名與撤權驗收 | NOT_TESTED |

正式 Site／Edge／資料庫／main 變更、外部付費運算及安全敏感權限，依員工手冊另經本人批准。此候選 PR 不具備正式上線效力。
