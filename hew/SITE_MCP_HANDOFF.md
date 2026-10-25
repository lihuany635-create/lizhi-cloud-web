# 立之 3D 建模（Hew）｜M0–M5 接線與執行交接 2026-10-25

> **狀態：隔離分支候選；未合併 main、未部署 Site / Supabase、未開啟正式模型的 AI 寫入。**
> **工作台專案**：`f1dd7512-ce86-4268-b7cb-b4edd11ce8d7`
> **上游固定來源**：`hew3d/hew@f7734a5dfa262c03822d0eae918206705223e6b3`（審閱時的 main；正式測試需按 commit 鎖定）
> **既有 CAD 分支**：`feature/cad-sites-bridge-v1`、Draft PR #11；**不複製現有 CAD Secret**。

## 1. 來源與實際確認

官方 README、`docs/API_GUIDE.md`、`docs/SELF_HOSTING.md`、`docs/agents/HEW_API.md` 均已閱讀（2026-10-25）。核心事實：

- Hew 完整核心／網頁應用為 **AGPL-3.0-only + Plugin API Exception**；修改與網站部署涉及開源義務，不能私自當成閉源「立模」程式。
- `hew-cli` 原生 MCP 是 **stdio、本機 headless**；`--live` 連 **桌面版** per-user socket/named pipe，**不是遠端 HTTPS** 也不是瀏覽器 API。
- 瀏覽器版是靜態 React / Three.js / WebAssembly，由同個 Rust kernel 執行，但若要 ChatGPT 改使用者眼前的模型，必須先建安全的 **browser job host adapter**，用瀏覽器端模型實例執行有限操作，並自行加入 session / job ACK；不能把 `hew-cli --live` 假設成可連網頁。
- 自架 Hew Web build 使用 root-relative assets，官方 **不能直接部署 /hew/** 路徑而不修改 build；建議獨立 origin 或嚴格單獨 host 再由工程中心入口開啟。
- Hew API 以**公尺**為固定單位，右手座標 +Z，`hew.doc.transact` 是 atomic undo entry；可用 `hew.sketch.draw_rect`→`hew.solid.extrude`→`hew.entity.rename` 生成長方體。
- Hew 的官方原生 headless CLI 確有模型建立、snapshot、.hew 輸出能力；**本分支尚未實際編譯 Hew CLI 或產生 3D 檔案**。

官方來源：
- https://github.com/hew3d/hew
- https://github.com/hew3d/hew/blob/main/docs/API_GUIDE.md
- https://github.com/hew3d/hew/blob/main/docs/SELF_HOSTING.md
- https://github.com/hew3d/hew/blob/main/docs/agents/HEW_API.md
- https://github.com/hew3d/hew/blob/main/LICENSE
- https://github.com/hew3d/hew/blob/main/LICENSE-EXCEPTION

## 2. 安全分層：不複製 CAD 的不安全假設

```text
一般 ChatGPT 對話（不是 Work）
   ↓ 私人 Site「立之 3D 建模代理」/mcp [尚未建立]
   ↓ Site 身分驗證 + server-only 獨立 Model token
Supabase lizhi-model-site-mcp [尚未部署]
   ↓ owner/session/file-version 限制的短效工作佇列 [尚未部署]
   ↓ 使用者開啟且明確允許 AI 的立之雲端庫 Hew 瀏覽器 host [尚未開發]
   ↓ 僅官方 Hew JSON-RPC allowlist 轉接
Hew WebAssembly 核心（本地模型、Undo、手動存檔）
```

網頁關閉即失去 browser host；不得宣稱可在關閉瀏覽器／電腦關機後背景建模。未來如有明確資源與授權，再建立按需 headless executor（例如 GitHub Actions 專用 job），其私有模型取用方式需另行設計。

### 第一階段已提交的候選元件

- `hew/sites/model-site-contract.mjs`：嚴格六工具，`model_status`、`model_new_document`、`model_create_box`、`model_move`、`model_scene`、`model_job_status`；檢核 UUID / 物件 ID / 尺寸 / 有限數字／多餘欄位；mm→m；限定官方三步驟 atomic 建模。**只有候選合約，不是已發布的 ChatGPT 工具。**
- `sites-migration/hew/site-tools.mjs`：私人 Site server-only adapter；由可信 Site middleware 提供已驗證本人，獨立 secret，固定上游 URL，有限回應、一次 POST、結果不明禁止重試。**尚沒有正式上游**。
- `tests/hew-sites-contract.test.mjs`：合約／驗證／隔離／單次佇列／錯誤型別 mock Node 測試。**只驗證代理程式的隔離合約，不是 Hew 真引擎 E2E**。
- `.github/workflows/hew-mcp-contract.yml`：獨立 Node 24 CI，不進正式 Supabase，不需 Secret。

### 設計上特意保留的防護閘

1. `model_new_document` 仍需要瀏覽器對未存檔狀態的原生守衛；`toHewJsonRpc` **故意拒絕**此方法，不能將未實作誤當成功。
2. 一個 session **必須綁定唯一 document ID + revision**，由已登入的一方 browser host 發放；工具參數不可指定路徑或伺服器自選其他開啟的文檔。
3. 首次模型建立與每次 model_move 必須由可見頁面本人勾選 AI 權限；每筆 `request_id` 去重、工作回報 `succeeded` 後才可稱成功。
4. Side effect 發生而 ACK 遺失時，不可自動 retry；必要時比對文件 revision 與實體 ID。
5. 使用者既有 CAD 專用 `lizhi-cad-site-mcp`、手機 Site、Finance、Engineering DB、現有 `main` 均不變更。
6. 不允許任意 Python、shell、Hew `dispatch` method、文件路徑、刪除及批次文件上傳經由自訂 MCP 任意轉送。

## 3. 階段驗收

| 階段 | 狀態 | 所需真實證據 |
|---|---|---|
| M0：原始碼、授權、官方 API | source read / draft | 版本與授權證據、限制表及可重現測試 |
| M1：Hew Fork、Web 建置 | NOT_TESTED | 專屬 Fork、AGPL 告示、獨立 origin 網頁 WASM 已載入、可手動生成形體 |
| M2：代理合約與短效佇列 | IN_PROGRESS | Node CI 通過；其後需隔離 PG16 + RLS/owner/idempotency 真測試 |
| M3：私人 Site MCP | NOT_TESTED | 正式本人登入、真正 Site tools/list、Edge 401/403/503、六工具實際載入 |
| M4：一般 ChatGPT→Web Hew | NOT_TESTED | 頁面 AI 授權，1200×600×750 mm 方體；job succeeded + scene 單位、重載、Undo |
| M5：進階與輸出 | NOT_TESTED | .hew 原檔、SKP/GLB round-trip、snapshots + 不同文件的 isolation |

## 4. 下一個可執行實作環節

1. Fork `hew3d/hew` 到使用者自己的獨立 GitHub 倉庫，或明確決定保持隔離子專案。GitHub App 若無 fork mutation，需 GitHub 帳號介面操作，**不能宣稱已 Fork**。
2. 在 Fork 上以鎖定 commit 實際 build `pnpm --dir app build`，測試 Web WASM 和已存在模型保存流程。
3. 從 Hew 的 React app 真實 document instance 找出受控入口，實作只允許有限 JSON-RPC 的本地 browser host，不從外站不明訊息取 identity。
4. 在隔離 PostgreSQL 新建獨立 `lizhi_model_*` session/jobs/RLS + edge HTTP；先 CI 再審查，正式庫勿直接套 migration。
5. 建立私人 Site、專屬 token（Sites／Edge 對應）、本人身分驗證，通過真正 ChatGPT E2E 才可將 workbench 記為 PASS。

**本文件不可當作已完成部署、Hew 已編譯、ChatGPT 已能操控 3D 的證據。**
