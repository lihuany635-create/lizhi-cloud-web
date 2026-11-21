# GridCraft v0.5.5｜唯讀工具候選｜2026-11-22

狀態：**候選程式＋隔離測試**。未部署 Edge、未改正式資料庫、未發布 Site、未打包 Windows 代理、未碰本人工作簿。

## 接手核對（LIZHI-AI-BOOT/1.0.0）
- 已讀 `docs/AI_NEW_CHAT_BOOTSTRAP_v1.0.md`、本目錄 README 與 `P5_E2E_HANDOFF_20261121.md`。
- Supabase `aiwb_projects` 沒有 GridCraft 專案（只有英文教室、流量監控），本交接改存 GitHub。
- 正式現況（2026-11-22 唯讀查詢）：
  - Edge `lizhi-gridcraft-bridge` v9 ACTIVE（ezbr `f4f30925…7c22`）。原始碼不在 repo，本次以讀回的 v9 為基礎。
  - 工作佇列允許 7 種工具。
  - 歷史工作只有 `list_workbooks`、`read_range`，沒有任何寫入或存檔工作。
  - 本人電腦的代理是 **0.5.3**，不是 0.5.4。
- 待清理（沒有處理，需要本人批准）：
  - 一台 11/18 配對、3 天未上線、未撤銷的舊裝置。
  - 2 筆 11/19 的工作，過期後仍停在 `queued`／`claimed`。

## 新增工具（全部唯讀，需本機工作簿授權）
| 工具 | 參數 | 行為 |
|---|---|---|
| `gridcraft_inspect_workbook` | `doc` | 原廠 `document.inspect` 經允許清單過濾後回傳：工作表、使用範圍、表格、圖表、名稱、凍結窗格、合併數。**移除** `path`、`undo`/`redo`、`trust`；外部或過長的名稱定義只保留名稱。 |
| `gridcraft_evaluate_formula` | `doc`, `formula`, `cell?` | 只經由 `engine.execute` 呼叫 `formulas.evaluate`，其他引擎命令一律在本機拒絕。結果上限 200 格、單一文字 2000 字。 |
| `gridcraft_read_range`（擴充） | 可選 `mode` = `values`／`formulas`／`formatted` | 舊的 3 參數格式完全不變。 |

### 公式安全規則（代理、Edge、Site 三層相同）
- 必須以 `=` 開頭，長度不超過 500 字，不可含控制字元。
- 拒絕 `[`（外部活頁簿參照）、`\`（路徑）和 `://`（網址）。
- 拒絕下列函數：
  - 路徑或環境資訊：`CELL`、`INFO`
  - 用文字組出參照：`INDIRECT`
  - 網路：`WEBSERVICE`、`FILTERXML`、`ENCODEURL`、`IMAGE`、`STOCKHISTORY`、`HYPERLINK`
  - 外部資料來源：`RTD`、`DDE`、`CALL`、`REGISTER*`、`SQL.REQUEST`、`CUBE*`
  - 其他：`PY`、`COPILOT`、`TRANSLATE`、`DETECTLANGUAGE`、`EUROCONVERT`
- 函數名稱前綴 `_xlfn.`／`_xlws.` 會先去掉再比對。

**原廠實測依據**（GridCraft 0.19.1 `gridcraft-cli`，headless，只用內建範例檔）：
- `=CELL("filename")` 會回傳完整本機路徑，所以必須拒絕。
- `formulas.evaluate` 執行後 `dirty=false`、`undo=[]`，不會改動工作表。
- `document.inspect` 的回應含 `path` 和 undo 標籤，所以必須過濾。

## 檔案
- `gridcraft_readonly_v055.py`：公式檢查、inspect 過濾、結果上限。
- `gridcraft_desktop_local.py`：新增 `engine.execute`，但只允許 `formulas.evaluate`；新增 `inspect_summary`、`evaluate`、`formatted` 讀取。
- `gridcraft_outbound_worker.py`：新增 `V055_READ_TOOLS` 路由和 `_granted_doc`。
- `gridcraft-edge-v10-readonly-candidate.ts`：v9 加上開關 `readonlyV055Enabled`，**預設 false，關閉時行為等同 v9**。
- `sites-migration/ai-workbench/gridcraft-v055-readonly-addon.mjs`：Site 外掛，開關 `readonlyV055Enabled`，預設 false。
- `V055_SQL_CANDIDATE.sql`：工具白名單加 2 個名稱，附回退 SQL。
- 測試：`test_readonly_v055.py`、`gridcraft-edge-v10.test.mjs`、`gridcraft-v055-readonly-site.test.mjs`。
- CI：`.github/workflows/gridcraft-v055-readonly.yml`。

## 驗證
- **PASS（本機 Windows、Python 3.12）**：`test_readonly_v055.py` 18/18，含原廠 CLI headless 探測。
- **PASS（本機 Node 24）**：Edge v10 5/5、Site 外掛 5/5，並交叉比對兩層公式檢查結果一致。
- **無回歸**：`integrations/gridcraft` 全部 Python 測試在修改前後的失敗清單完全相同（13 項，都是本機已有 GridCraft／自動啟動環境造成的既有失敗）。
- **NOT_TESTED**：
  - 透過 7979 連線本人桌面 GridCraft 實際執行 `engine.execute formulas.evaluate`。
  - 正式 Edge、Site、資料庫。
  - ChatGPT 全鏈路。
  - 打包 v0.5.5 EXE。

## 打包（上線第 1 步，2026-11-22）
- 程式版本 `AGENT_VERSION = "0.5.5"`，Windows 版本資源檔是 `version_info_v055.txt`。
- `--self-test` 新增 v0.5.5 檢查，下列三種情況都會在連線本機 GridCraft 之前就被拒絕：
  - 工作簿沒有授權。
  - 公式含 `CELL("filename")`。
  - `engine.execute` 執行 `formulas.evaluate` 以外的命令。
- **CI 打包**：[run 44936975071](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44936975071) 全部通過。
  - 9 組代理與 worker 測試全過。
  - EXE 版本資源是 0.5.5。
  - 打包後的 EXE 自我檢查通過。
- **產物**：`LizhiGridCraftAgent_v055_Windows.zip`，12,323,199 bytes，ZIP SHA256 `5b99c26f…12273a`。
  - 內含 `LizhiGridCraftAgent_v055.exe`，EXE SHA256 `af509111cf411441a079b8fbb30e5b9c91252d9fb5f7d9ec38ec4bce9568cf93`。
- **本機複驗**：在本人電腦對下載的 EXE 執行 `--self-test`，exit 0。已安裝的 0.5.3 檔案雜湊不變，執行中的代理也沒有被替換。
- **Drive**：沒有上傳。連接器單檔上限 10 MB，ZIP 已在對話中直接交給本人。
- **NOT_TESTED**：本人實際安裝、v0.5.3 自動換版、安裝後連線。

## 上線順序（每一步都需要本人批准）
1. 打包 Windows 代理 v0.5.5，本人安裝。目前本人電腦是 0.5.3，要直接升到 0.5.5。
2. 部署 Edge v10，維持 `readonlyV055Enabled=false`，回歸確認舊的 3 個工具正常。
3. 套用 `V055_SQL_CANDIDATE.sql`。
4. Site 加入外掛（開關仍關），再依序開啟 Edge 和 Site 的開關。
5. 用測試副本工作簿實測 3 個工具，並在 ChatGPT 確認 `tools/list` 出現新工具、舊工具沒被移除。

## 下一步
本人確認是否進入上線第 1 步。寫入和存檔（P5-6）仍維持 BLOCKED，與本次變更無關。
