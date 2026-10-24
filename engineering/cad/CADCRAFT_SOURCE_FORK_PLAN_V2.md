> **產品路線 v2.1 更正（2026-10-25；後續開發以此為準）**：使用者已要求移除獨立雲端 CAD 運算、Windows 關機遠端繪圖及為 CAD 新建雲端 DB/Worker 作為必要功能。已查核立之圖書館 `library/library-computer.js`、`library/library-device.js`、`library/MCP.md` 與 `supabase/functions/library-mcp/index.ts`：其做法是「原檔可留裝置、只同步使用者授權的索引／摘錄，ChatGPT 透過 OAuth MCP 查詢」，不是雲端 CAD 運算。立之 CAD 現改成 **Fork 本機／瀏覽器 WebAssembly 引擎 + 使用者授權本機 DXF + 原生 MCP + 選擇性圖書館式索引／指令草稿**；裝置離線時不得假裝已實際修改原圖。開發主文件： [自有 Fork 的 LOCAL-FIRST v2.1](https://github.com/lihuany635-create/lizhi-cad/blob/feature/lizhi-native-mcp-v0120/docs/lizhi/LIBRARY_PATTERN_LOCAL_FIRST_V21.md)；正式 Google Docs 原位修訂 v2.1：[Google 計畫](https://docs.google.com/document/d/1sG3epjnOYpwVS55YOZA1d5bVFT4T71GHs9VJQi7_8QU/edit)。以下 v2.0 表格中的 cloud-first P5/P6 敘述**已作廢，只供歷史追溯，不得繼續當 active TODO／部署要求**。

# CADCraft 自有原始碼改造 × ChatGPT 原生 MCP 整合計畫 v2.0

更新：2026-10-24。**本文件優先於此分支舊有 cloud-first 開發方向**，代表產品範圍修正，不表示已完成 Fork、部署或使用者驗收。

正式 Google 計畫書（原檔原位修改）：https://docs.google.com/document/d/1sG3epjnOYpwVS55YOZA1d5bVFT4T71GHs9VJQi7_8QU/edit

## 產品目標
1. 從官方 https://github.com/storytold/cadcraft **完整 Fork Rust monorepo 原始碼**（apps、crates、docs、examples、Cargo.* 等），建立我們自己的可編譯、可修改、可發布 CAD 軟體。不是從零開發 CAD，也不是只有外部 CLI Bridge。
2. 優先使用官方 **原生 MCP**：`cadcraft-cli mcp`（stdio headless）及 `--connect`（桌面 control channel）；官方 MCP 有 `command_line`、`execute`、`inspect_drawing`、`query_entities`、`render`，有桌面 GUI session 時才有 `screenshot`、`ui_click`。上游工具與版本需以鎖定 commit 實測。
3. 整合使用者**已發布於 ChatGPT 的 CAD App**；確認現有 App 連線與授權後，在一般 ChatGPT 對話直接操作原生 CADCraft，**不依賴 ChatGPT Work**。若只有本機 stdio，遠端需要最薄受控 MCP gateway，但不可藉此另造 CAD 引擎。
4. 最終驗收包括使用者 Windows **完全關機**，手機 ChatGPT 仍可建立／修改既有圖面，持久保存、版本復原；雲端 Worker 或 GitHub Actions 僅是部署／執行選項，不是產品本體。
5. 立之雲端庫工程中心圖面同步是後續整合階段，保留既有功能與正式資料。

## P0～P8 路線及驗收

| 階段 | 工作 | 完成門檻 | 目前 |
|---|---|---|---|
| P0 基線盤點 | 鎖上游 SHA/tag；授權/NOTICE/依賴；盤點現有 ChatGPT App、MCP、Bridge | 清楚區分官方原始碼與既有 CLI 接線 | 部分資料有，未全驗 |
| P1 原始碼 Fork | 建立**獨立自有 Git 倉庫**，完整保留上游 source/history/license，建立 upstream sync | 可重現完整 Rust workspace | **未完成** |
| P2 自有原生 CAD | 從 Fork 編譯 Rust CLI、desktop、WebAssembly，驗 DXF/幾何/圖層/標註/輸出 | 驗收使用**自有原始碼編譯**產品，不是下載上游執行檔 | **未完成** |
| P3 原生 MCP | 驗 initialize/tools/list，真實命令→查圖元→render，授權與薄遠端傳輸 | 自有 Fork MCP 操控同一張圖，拒絕越權 | **未完成** |
| P4 ChatGPT CAD App | 串現有已發布 CAD App；本人驗證、權限、撤銷、指令與錯誤結果 | **真實一般 ChatGPT 對話** 建圖→修改→讀取→預覽 | **未完成** |
| P5 持久圖面與安全 | 儲存原生可編輯圖、版本、所有者 ACL、冪等、衝突、備份 | 新對話可找回原圖並續作，未授權讀寫被拒 | **未完成** |
| P6 PC 關機雲端執行 | 檢驗按需 GitHub Actions 或受控 Worker；安全觸發與私人保存 | 手機 ChatGPT 且 PC 關機仍能繪圖、改圖、讀回 | **未完成** |
| P7 立之雲端庫整合 | 工程中心圖面／歷史／WASM UI 編輯與共用 drawingId/revision | 真實端到端，既有工程中心與 Finance 不回歸 | **未完成** |
| P8 發布與維運 | 自有版本發行、測試矩陣、License、回滾、上游同步 | 可重建、可操作、可恢復、證據齊全 | **未完成** |

## 既有成果，不混為新版本進度
- `engineering/cad/*` 具 CADCraft **官方 0.12.0 CLI** Linux 真實 DXF/SVG/PNG、HTTP MCP、queue、PostgreSQL/S3、ACL、修訂版本等**有限範圍 CI 測試**，保留當作可重用組件。
- 這些證據**不是**自有 Rust Fork 已建置、已發布 CAD App 真正直接連到官方 MCP、雲端持續服務或使用者 PC 關機 E2E。
- 原來 M0～M4 工程中心工作台任務視為歷史執行紀錄；新產品開發以 P0～P8 為主線。舊 M2 的 PASS 僅代表舊流程當時限定範圍，不等於 P7 完成。

## 操作界線
- 修改、部署與工具串接在隔離環境測試；未經明確授權**不得動既有正式 Supabase、正式 Site、main、Finance 或真實工程圖**；未經同意不購買雲端資源。
- 公開 GitHub 不存私人工程圖、token、密鑰。Actions artifact 不可作唯一永久圖面保存。
- 先核查雙授權 MIT OR Apache-2.0 與第三方依賴/圖示/商標；保留 LICENSE、NOTICE、出處與版本。不要宣稱 Fork 帶來官方商標所有權。
- MCP 是控制通道，**不是**雲端運算設備；ChatGPT 不能以未授權本機 stdio 作遠端連線。
- 依序優先：P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8。後續可並行非阻擋工項，但不可跳過證據驗收。

## 下一個應實際執行的任務
**P1：建立完整 CADCraft 自有 Fork 並從原始碼編譯**。啟動前 P0 盤點已發布 ChatGPT CAD App 連線身份與目前工具。Fork 倉庫名稱、是否需要外部發布等事項待實際開發時安全處理。每個 P 階段都需附上來源 commit、可重現命令、測試輸出和畫面／圖面證據。
