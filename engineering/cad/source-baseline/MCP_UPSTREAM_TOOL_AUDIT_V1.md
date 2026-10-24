# CADCraft v0.12.0 原生 MCP 控制與權限初查

核對日期：2026-10-24
固定上游：`storytold/cadcraft` tag `v0.12.0` = `bad1073fdf10a521949f6b542837b564719d0023`。
程式來源：`crates/mcp/src/server.rs`、`crates/mcp/src/tools.rs`、`crates/mcp/src/backend.rs`、`apps/cadcraft-cli/src/main.rs`。

## 已確認的原生 MCP（不是我們建立的另一套 CAD 指令）

- MCP 協定 2025-06-18，stdio 使用一行一筆 JSON-RPC 2.0。初始化 `initialize`、通知 `notifications/initialized`、`tools/list`、`tools/call`。
- Headless `cadcraft-cli mcp` 有 `command_line`、`script`、`execute`、`list_commands`、`inspect_drawing`、`query_entities`、`render`、`find_text`、`new_drawing`、`open`、`save`、`cancel`。
- Desktop `cadcraft-cli mcp --connect 127.0.0.1:7979` 另外有 `screenshot`、`ui_inspect`、`ui_click`；它要求正在運行的桌面控制通道，不是遠端雲端繪圖的依賴。
- `execute` 接受 CADCraft 命令 id 與 JSON params；不要把它誤判為任意 OS shell，但 **CAD 命令可能間接訪問檔案**，因此仍須驗證權限與副作用。

## 在正式 ChatGPT App 對話開啟寫入之前必須有的控制

| 類別 | 上游 MCP | 預期授權 | 主要風險／必要改善 |
|---|---|---|---|
| 查詢 | `list_commands`、`inspect_drawing`、`query_entities`、`find_text` | drawing:read | 本人身分、每張圖的 ACL 與回傳資料遮罩 |
| 預覽 | `render` | drawing:read | 若接受 `path` 參數，視同可寫入檔案，應移除 path／沙盒化；限制解析度與資源 |
| 建圖與修改 | `new_drawing`、`command_line`、`script`、`execute` | drawing:write | 原生命令可涉及文件開關或大量圖元操作；需命令 allowlist、參數檢查、操作限額、版本鎖和使用者同意 |
| 取消 | `cancel` | drawing:write | 限自己的 session／job，避免交叉取消 |
| 開檔／存檔 | `open`、`save` | drawing:files | 絕不能直接接受 ChatGPT 指定任意主機路徑；需 drawingId→私有物件儲存映射、檔名正規化、防穿越、防覆寫 |
| 桌面 UI | `ui_click`、`ui_inspect`、`screenshot` | session:desktop | 僅真實使用者授權之桌面 session；headless 不提供 |

本表是現有功能風險分級與設計建議；**不代表 upstream MCP 已實作所有上述權限**。

## 建議改造位置（必須進入真正自有 Rust Fork）

- 工具白名單／schema：`crates/mcp/src/tools.rs`。
- JSON-RPC 入口、session：`crates/mcp/src/server.rs`。
- 指令與檔案操作實際後端：`crates/mcp/src/backend.rs`；避免僅在 ChatGPT 前端藏按鈕。
- Headless／桌面 MCP 啟動：`apps/cadcraft-cli/src/main.rs`。
- 最薄 HTTPS／OAuth 入口：若 ChatGPT App 無法訪問 stdio，設受信任 gateway 將 user/client/owner/drawingId 透過伺服器身份映射到隔離 session。**MCP 控制通道與雲端引擎執行環境是兩個不同層次**。
- 真正 Fork 發布時：閱讀 `docs/brand/LICENSE-brand.txt`，移除／替換 ArtCraft Marks，不得自稱官方。

## 實際驗收序列

1. 用 **Fork 原始碼**建置（而不僅下載官方 CLI）。
2. 由 `initialize`→`tools/list` 確認預期工具。
3. `new_drawing`→`command_line` 畫矩形→`inspect_drawing`→`query_entities`。
4. `execute` 增加圖元→`render` PNG→`save` DXF→`open` DXF→幾何不變。
5. 無權使用者不能讀／寫；未知命令、任意路徑、跨圖／跨帳戶、越權 UI 均拒絕；不可把測試 stub 當成正式授權。
6. 經本人 OAuth 授權，在一般 ChatGPT 中使用實際已發布的 CAD App 完成同序列；PC 關機與雲端持久性另行驗收。

目前狀態：官方原生程式碼已盤點；source-built/native MCP CI 正在執行；**App 實際授權、Fork 自有倉庫、線上存儲與 Windows 關機場景均未驗收**。
