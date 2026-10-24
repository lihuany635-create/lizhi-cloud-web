# 立之 CAD × 立之雲端庫｜真正內嵌整合交接（2026-10-25）

> 狀態：**隔離開發／待實機驗收**，不是正式網站已上線。開發分支 `feature/embed-lizhi-cad-local-v1`。既有 `main`、正式 Pages、Supabase、工程中心與 Finance 不更動。

## 產品邊界

- 「立之 CAD」加入雲端庫首頁的相同導覽層，不建立第二套 CAD 軟體、不建立獨立 CAD 網站；同來源 iframe 指向 `./cad/runtime/index.html?host=parent`。
- 圖面運算是真正 CADCraft Rust→WASM，**在使用者目前開啟的瀏覽器執行**；不新增雲端 CAD Worker、PostgreSQL 圖面資料庫、付費 VM 或 S3。
- DXF 原始資料從明確選取的本機檔案匯入。宿主採用 CADCraft 已有的 `cadcraft:ready/open/save/dirty/failed` `postMessage` 傳輸協定，不假裝已接上 stdio MCP。
- 完整 CAD 原始碼保留於 [自有 Fork](https://github.com/lihuany635-create/lizhi-cad/tree/feature/lizhi-native-mcp-v0120)。目前使用固定 commit `19e09447345750eaedd33db7a86fbeff3af1210f`；構建程式 `cad/build-runtime.sh` 會驗證該 SHA 並使用 Rust 1.95、Trunk 0.22、WASM target。

## 實際交付的程式

| 檔案 | 功能 |
|---|---|
| `app.js`、`workspace-ui.js`、`index.html` | 新增「立之 CAD」導覽、保留 iframe 工作階段及 CAD 容器 |
| `cad/cad-host.js` | 同來源訊息檢查、開啟 DXF、擷取匯出、File System Access、IndexedDB 授權 handle、版本清單與開啟歷史 |
| `cad/cad.css` | 響應式 CAD 全高繪圖容器 |
| `cad/setup-build-toolchain.sh` | Rust 1.95 WASM 與 Trunk 0.22 的 SHA256 核實安裝 |
| `cad/build-runtime.sh` | 從固定 Fork SHA source-build，放進現有 Pages 的 `cad/runtime/`，而非另一台服務 |
| `.github/workflows/cad-integration-preview.yml` | 僅於開發分支執行 Node 合約與 Rust/WASM 正式 bundle 編譯，輸出候選 artifact，**不部署** |
| `.github/workflows/pages.yml` | 通過審查合併後，原 Pages 部署會內含 CADCraft 真正 WASM 產物；編譯失敗時整次部署失敗，避免發布空殼 CAD |
| `tests/cad-embedded.test.cjs` | 導覽、框架、固定版本、同來源拒絕與本機寫入限制的輕量測試 |

## 本機原圖與版本

1. 開立之雲端庫右側選單 → 立之 CAD；在 CADCraft 介面新建圖面或選擇「開啟 DXF」。
2. 按「選擇 DXF 資料夾」，Chrome/Edge 會要求明確的資料夾存取權；handle 儲存在該瀏覽器的 IndexedDB，非雲端。
3. 從 CADCraft 自己的「儲存」輸出 DXF，父頁接收 bytes 並在已授權資料夾建立 `revisions/<圖名>-<ISO 時間>-<隨機ID>.dxf`，舊版不覆寫。
4. 「歷史版本」列出該資料夾 `revisions` 內的 DXF；需要再次授權時使用者須重新選取；開啟舊版不修改原版。
5. 手機或未支援 File System Access／權限失效時走瀏覽器下載；需要確認瀏覽器實際下載，不宣稱本機版本已儲存。PDF／PNG／SVG 匯出只下載。
6. 檔案大小上限 32 MiB，匯入操作受使用者手勢與受控檔案選擇約束，MCP 沒有本機任意路徑。

## 必要驗收（尚未完成的不可冒稱）

- [ ] `cad-integration-preview.yml` 的 `host-contract` 與 `wasm-preview` **都成功**，收下實際生成的 runtime artifact。歷史首輪測試：40118847140 host 測試失敗（非安全漏洞、為 mock 非同步 timing）；第二輪 40118910890 host 4/4 通過但 WASM Rust toolchain 因 checkout 位置失敗；已補上 `RUSTUP_TOOLCHAIN=1.95.0`，最新 run 40119011236 的結果須另查。
- [ ] 現有 Pages **隔離預覽**實測 iframe 畫布真正載入、使用 CADCraft 新建 800×900 mm 矩形。
- [ ] 實際按儲存 → 本機資料夾中得到不可變 DXF；重新開啟版次，幾何及尺寸一致。
- [ ] 裝置重載、權限拒絕、離線、無資料夾及手機下載退路 E2E。
- [ ] 通過原有理財、工程中心與媒體模組的回歸，再考慮 PR merge；未得到實機證據不發布。
- [ ] ChatGPT CAD App 真實授權連線仍屬**另一階段**。Fork 的原生 stdio MCP 並不會因 iframe 完成便被一般對話遠端呼叫。

## 已知限制與注意

- 目前一般對話不能直接透過這個新入口畫圖；需額外的 OAuth 最小權限 MCP 設計與裝置在線受權執行流程。不可公開本機 CADCraft 的 TCP 控制埠。
- CADCraft WebAssembly `host.rs` 現有傳送 `cadcraft:save` 即認為已交付，即使父頁資料夾寫入後續失敗。因此宿主另有錯誤提示與下載備援；**只有確認資料夾內版本實際存在或下載完成，才算備份成功**。需後續改善儲存回執語意及實測不同瀏覽器。
- 同源 iframe 是本機程式，能否在 ChatGPT App 內直接呈現和經由 MCP 呼叫仍需另行驗證；絕不可把既有圖書館唯讀 `status/list/search/get_excerpt` 當成 CAD 寫入權限。
- 此分支與 `cad/runtime` 構建配置不包含使用者的私人工程圖、密鑰或路徑。公開 Pages 的程式碼本身可被檢視。

## 目前下一步

查 GitHub Actions 40119011236 → 實際 WASM output → 製作隔離的真瀏覽器 E2E → 開 Draft PR 等待驗收（不自動合併）。在製作工作台 `CADCraft × 立之雲端庫整合` 專案留下真實範圍、證據、未完成項。

## 實測補記：WASM + Chromium 真正整合（2026-10-25）

- GitHub Actions [40119011236](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40119011236) **completed success**。`host-contract` 4/4、`wasm-preview` Rust→WASM 實際 source-build、`index.html`/JS/WASM/來源 SHA 驗證與 candidate artifact 上傳皆 SUCCESS。候選 ZIP 8,664,978 bytes，artifact ID `12570543137`。
- GitHub Actions [40120181763](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40120181763) **completed success**，以已核實固定 CADCraft source SHA 的前述真實 WASM 產物執行 Playwright Chromium 141/real Cloud portal。日誌記錄 `LIZHI_CAD_PORTAL_E2E {"passed":true,...}`，6 個順序驗收全部成功，DXF 實際檔案重新解析後邊界 `[0,0]-[800,900]` mm；測試佐證 ZIP artifact ID `12571285882`，sha256 `34ea88644f4ae7de3f0d1137c2b324b9c95897191002fd64cc57ba525977723a`。
- 六項成功：雲端庫的 CAD 路由及真正 WASM iframe 初始化、800×900 mm DXF 匯入、原生 CAD save 經 postMessage 到父頁並寫入版次、解析原生 DXF 尺寸、列版次並重新開啟且保留舊版、切回其他路由後 CAD iframe 不重置，以及權限被拒絕時保留舊版並提供 DXF 下載。
- **關鍵限定**：CI 使用 Chromium 中模擬的 `showDirectoryPicker` handle（獨立記憶體目錄），非實際 Windows/Android 檔案選擇器。真實 OS 資料夾選取、授權跨重載持久化、使用者操作手勢、手機 fallback、真實存檔與重開仍須另做人工／實機測試，不能把這次 6/6 說成全產品上線。
- 另已將相同 Chromium E2E 納入預覽 CI `browser-e2e` job（必須在當次 source-build artifact 成功後才運行）；`cad-embedded-browser-fast.yml` 僅為加速迭代重用上一份明確固定來源 SHA 的 WASM，不應作為日後新引擎 commit 的驗收替代。
- 主線依然 **Draft PR #6**、未合併 `main`、未發布 GitHub Pages、未修改 Supabase 或工程中心。ChatGPT 一般對話 CAD MCP 授權寫入也仍未連通。
