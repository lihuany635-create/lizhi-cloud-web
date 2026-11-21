# GridCraft｜P2 跨 Runner 實測補充報告 v1.1｜2026-11-18
狀態：**跨雲端執行環境的合成 Excel 交接實測 PASS**；**私人永久保存與 HTTPS MCP 仍 BLOCKED**。原 PR #88 草稿，未部署正式服務。

## 任務
補測 P2 原本「只有同一 runner 本機 SQLite 重開、尚未在新 runner 取回」的缺口：一個完全獨立的 runner 產生測試工作簿與版本，將僅合成資料的短期交接包交由第二個 runner 重新開啟，驗證原件、內容、版本及修改／還原。

## 實際 GitHub Actions 證據
- Workflow：`.github/workflows/gridcraft-p2-cross-runner.yml`（候選分支自動執行，標準 `ubuntu-24.04`，權限 `contents: read`）。
- Test script：`integrations/gridcraft/p2_cross_runner_probe.py`；沿用 `p2_synthetic_store.py` 與兩工作表合成 `engineering_estimate.xlsx.b64`。
- [Run 44218172814](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44218172814)／兩個 jobs `producer`、`consumer` **都 completed/success**，前後確實是不同 GH-hosted runner。
- `producer` 日誌：官方 GridCraft CLI `gridcraft-cli 0.19.1`，原件 v1（B3=2300、D3=69000），透過 CLI 修改 B3=2500 產生 v2（D3=75000），原件與修改後 SHA256／公式與版本保存 PASS。
- `consumer` 日誌：從獨立 runner 下載短期快照，重新開啟 SQLite 並核對 v1/v2 原件和雜湊 PASS；模擬 owner B 讀取拒絕 PASS；用真正 GridCraft CLI 修改 B3=2600 產生 v3（D3=78000）PASS；重複 request_id 去重 PASS；過期 expected_version 拒絕 PASS；還原 v1 內容為 v4 且來源 SHA256 不變 PASS。
- 短期交接檔案名稱 `gridcraft-p2-public-synthetic-snapshot`，實際 GitHub artifact ID `14388943556`、大小 9,615 bytes、**expires_at=2026-11-19T01:45:12Z（1 天）**。僅包含合成 SQLite 及 manifest，沒有私人 Excel、token、Supabase 金鑰；GitHub 公開倉庫測試資產。

## 驗收分級
| 專項 | 結果 | 證據／界線 |
|---|---|---|
| 真實 GridCraft CLI 能在兩台雲端 runner 運作 | PASS | 兩個 job logs |
| 合成原件與編輯版可跨 runner 交接、雜湊核對 | PASS | 原件 v1 + 修改版 v2 |
| 新 runner 再修改、公式重算、歷史快照與還原 | PASS | v3 與 v4 |
| 身分欄位拒絕他人、CAS、去重 | PASS（模擬） | 不是真人 OAuth |
| 永久私人雲端儲存（跨天/跨帳期仍保留） | BLOCKED | GitHub artifact 一日到期，不屬於正式永久儲存 |
| 正式 ChatGPT HTTPS MCP 即時操作 | NOT_TESTED | 無本人成員驗證/正式 gateway/雲端服務 |
| 真實私人檔案 E2E、撤權、完整 Excel 保真 | NOT_TESTED | 本測試只使用可公開的合成 Excel |
| Supabase 當期官方用量／新增費用安全界線 | BLOCKED（仍需查核） | 未新增付費服務或查詢正式帳務 |

## 安全與後續條件
此次**未**修改正式 main／Private Site／Edge／DB／Storage／真實 Excel；沒有將使用者的私人資料放進公開 GitHub。

**結論：**先前 P2 隔離 SQLite 的局限已有部分解除——確實證明 *跨雲端 runner* 的測試資料可經短期 artifact 交接、重開、編輯與還原。但一日到期的 artifact **不能充當永久私人工作簿儲存**，且沒有可由 ChatGPT 持續連線的 HTTPS 運算端。P2 主驗收狀態必須維持 **BLOCKED**。

**下一個尚需實測的條件：**使用本人核准的私人永久儲存（例如經費用/額度核對的既有 private Storage 或授權的 Drive API）與不依賴本機的可調用雲端運算服務，實測第一任務結束後隔日新任務仍能安全讀回/版本化與 owner/OAuth 驗證；必要正式部署/新增費用需另行核准。
