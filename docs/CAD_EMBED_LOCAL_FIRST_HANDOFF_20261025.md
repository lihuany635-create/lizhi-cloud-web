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

### 完整單輪 source-build → browser E2E 最新確認

- [CI 40120106720](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40120106720) **三個 job 全部 completed success**：host-contract、wasm-preview、browser-e2e。確認同一輪已將 Rust Fork 編成 WebAssembly，直接在真正立之雲端庫頁面載入與驗證。
- Browser job `120951210849` 的實際 console `LIZHI_CAD_PORTAL_E2E passed:true`、六個步驟與 `[0,0]-[800,900]` DXF geometry，與快速 CI 獨立得到相同結果。
- 同一輪產物：真 WASM bundle artifact `12570214924`（ZIP SHA256 `0c53ce5c99ecaaf615c2b35e7bb37e94bf65ace096a9c15165c5f680f864b1d7`）；Chromium 證據 artifact `12571041874`（ZIP SHA256 `89d04fb0eb43e9aa7b251dbe73e8929d35227762a87b3e8daeafefd510246f4c`）。這些 SHA256 是各**ZIP 包**的雜湊，不是圖檔或源碼的雜湊。
- 之前較舊的 [40119960763](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40119960763) 在 browser-e2e 失敗，原因僅是測試程式誤用 Playwright `locator.text()`；已修為 `locator.textContent()` 後，40120106720 全數成功；不可在驗收表上把舊失敗留作未修復問題。
- **仍保留 Draft PR #6 未合併**。真實 OS File System Access picker、Windows/Android 真正檔案落盤、IndexedDB handle 重新開啟、PWA offline、手機 UX 和 ChatGPT OAuth MCP 仍為開放驗收。

## 本機檔案可靠性與離線 E2E 驗證新增（2026-10-25）

- 本機宿主 `cad/cad-host.js` 現已做 **DXF 寫入完成後重新讀取、檔案大小與完整 SHA-256 比對**，才會顯示「已驗證本機 DXF」。先前僅收到 `postMessage` 就報成功的父頁存檔狀態已取消。
- 為減少寫入權限失效造成的資料損失，父頁先將每次輸出的資料建立**瀏覽器本機 IndexedDB 救援副本（DB v2，recovery store）**；檔案驗證成功後移除救援副本，驗證失敗時保留，並提供「救援存檔→再次下載／確認已有備份後刪除」。救援副本絕不傳至 Supabase 或遠端伺服器。
- `cadcraft:save` 父頁採 Promise 串列執行，頁面正在儲存時會啟用 beforeunload 警告。未取得可驗證檔案時，文案只會說「已要求下載」，不可把觸發下載當作完成保存。
- 修改版本檔名為完整 UUID 防碰撞，並同時支援舊版短 UUID 名稱解碼，避免打開歷史版後意外帶著時間戳再次存檔。
- 真 Chromium 自動回歸 [40122252623](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40122252623) **PASS**：800×900 mm DXF 真實 CADCraft save→本機模擬資料夾版控→拒絕權限保留 IndexedDB 救援檔→手動再次下載，以及另外的 **真實 Chromium OPFS** / IndexedDB native directory handle 寫入兩個版本、重載後恢復均 PASS。
- 真 Chromium 離線回歸 [40122385606](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/40122385606) **PASS**：在線快取真正 Rust/CADCraft WASM 後，用 Chromium `context.setOffline(true)` 斷網再載入同一個雲端庫 CAD 頁面，CAD 繪圖引擎仍成功初始化，並可列出真正 OPFS 的兩個 DXF 版本。所有通過狀態來自實際 GitHub job 日誌。佐證 artifact `12571139886`，ZIP SHA256 `039e7969da466ea0ed1ba60936ba5f5e059c087fa929cbb1b25dacf895967a11`。
- 新增 Windows 原生目錄選取器操作手冊 `docs/CAD_WINDOWS_DEVICE_ACCEPTANCE_20261025.md`。**仍未做 Windows/Android 真正 OS picker、真磁碟資料夾、真手機的 E2E**；OPFS 是真瀏覽器本機儲存，並非使用者指定的 Windows 目錄。
- 已拆開 GitHub Actions 頻率：Rust/source-build 只在固定 source build 設定變更時重跑，宿主與測試程式更新則走重用經核實 WASM 的 Chromium/contract 快速 CI，避免每一筆 HTML 修改都重編 Rust。

### 仍待排除的底層保存語意

CADCraft 目前在 iframe host mode 的 Rust `deliver()` 只要成功 `postMessage` 就讓 CAD 引擎把圖面視為已保存；父頁真正磁碟/IndexedDB 的寫入是**之後**才完成。這次父頁已加入緊急備份與雜湊驗證，但極短時間內頁面／程序崩潰的窗口仍然存在。正式版若要求 **CAD 引擎自身的未存檔狀態也必須以磁碟提交成功為準**，後續要修改 CADCraft Rust 檔案交付契約，加入有界且同源的 `save-ack` 以及 pending／失敗提示；不能宣稱這項引擎級 ack 已完成。此項屬 M4/P8 發布阻礙，應先在隔離分支做相容 E2E，再變更正式源碼。

**正式站/main／Supabase／工程中心仍未更新；Draft PR #6 不合併。**
