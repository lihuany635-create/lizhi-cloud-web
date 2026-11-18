# GridCraft P4｜原私人 Site 原地發布交接（2026-11-18）

## 本人批准與實際正式變更
使用者已於 2026-11-18 本對話明確指示「P4 正式部署」；**不需再次詢問相同範圍的發布授權**。此批准不等同於讓 AI 未經確認就修改本人 Book1，也不授權新增費用或開放其他帳號。

**已完成正式端：**
- 原 Supabase 專案 `hrdzywkihfqggiwjgavi` 已套用 `gridcraft_p4_add_readwrite_tools_with_ephemeral_job_ttl_20261118`。
- 原資料表 `public.lz_gridcraft_jobs` 的 tool CHECK 已擴為 P3 `gridcraft_list_workbooks`／`gridcraft_read_range` + P4 `gridcraft_prepare_write`／`gridcraft_commit_write`，現有 P3 rows 保留，RLS 與一般帳號拒絕未放寬。
- 既有 `pg_cron` 排程 `lizhi-gridcraft-p4-ttl` 每小時清理**只限 P4** 建立超過 23 小時的命令／結果記錄；保留 P3 queue，不碰任何 Windows Excel。
- 原 `lizhi-gridcraft-bridge` 已由 Edge v3 升為 **ACTIVE v4**。entrypoint 以既有本人 owner 與橋接憑證設定原封不動保留 `enabled:true,pairingEnabled:true`，**新增 `p4Enabled:false`**，所以 P4 工具不會在 Site 未接通前被允許。正式 `get_edge_function` 已讀回 gate OFF。
- 真實 ChatGPT MCP 在 Edge v4 發布後測得 `gridcraft_status:READY`、`gridcraft_list_workbooks:Book1`，而且 `gridcraft_read_range Book1/Sheet1/A1:B2` 回 `立之測試123`／`456` 正確，原 P3 保持 PASS。
- 2026-11-18 正式 SQL 讀回 `active_ttl_jobs=1`、`existing_p4_jobs=0`、`rls_enabled=true`、`public_read_denied=true`。
- 新版 Windows v0.3 P4 CI 完整 PASS 候選已保存原私人 Drive：https://drive.google.com/file/d/1Wgtr-5pMbTvph50bXAHasCCv2_yVVhgl/view 。

## 目前無法在此對話直接完成的項目
本對話提供原 AI 工作台工具（含 P3 三項唯讀及一次性配對）和 GitHub／Supabase，但**沒有原 `lizhi-animation-flow.lihuany635.chatgpt.site` 的 Sites 編輯／私人發布操作**。因此**未修改原 Private Site v29**，不能宣稱 P4 MCP 工具已在 ChatGPT 新對話載入，更不可宣稱本人 Windows v0.3 的真實寫入 PASS。

## 下一步：請使用原 Private Site 編輯權限，不建立新站
1. 開啟原站 `https://lizhi-animation-flow.lihuany635.chatgpt.site` 的 Site 原專案（目前 v29），唯讀核對其 `/mcp` 工具列表、身份驗證、Secrets；完整保留 AIWB、施工照片、P3 GridCraft 與既有所有工具。
2. 在 Site MCP 中以**新增方式**合併 [P4 兩工具與驗證器](https://github.com/lihuany635-create/lizhi-cloud-web/blob/feat/gridcraft-p4-safe-write-20261118/sites-migration/ai-workbench/gridcraft-p4-site-addon.mjs)。工具：`gridcraft_prepare_write` (預覽唯讀)、`gridcraft_commit_write` (具有副作用)；原 P3 不替換。沿用本人驗證、原 Site→Edge 短效橋接設定，固定送至 Edge `/site/dispatch`；嚴禁傳送任意本機埠／檔案路徑。
3. Edge v4 的 `p4Enabled:false` 是獨立安全 Gate。Site 完成合成 P4 驗證且本人身份/其他帳號拒絕、原本 P3 回歸都 PASS 之後，才用**原 Edge 的同一組 owner/hash 設定**修改為 `p4Enabled:true` 重新部署 v5；原 `enabled:true` 和 `pairingEnabled:true` 維持。不可輸出或硬編碼新的正式長效金鑰到 GitHub。
4. 在正式 Private Site 原地私人發布（預期 v30，實際版本以 Site 發布結果為準），驗證身份綁定、匿名/第二帳號拒絕、原工具清單完整，正式 `/mcp` 列出新增兩項 P4 工具（且提交工具不可標為唯讀）。
5. Windows P4 真機：本人安裝 v0.3 ZIP，先使用**測試副本**，本機選擇 GridCraft.exe、Grant 指定工作簿、按「開始遠端」，再按「P4 寫入授權（本次執行）」。ChatGPT 先 `prepare` 讀回預覽、使用者核對並明確確認這次寫入後才呼叫 `commit`，讀回指定格且保留本機備份。意外結果維持 UNKNOWN、不盲目重試。
6. 實測完成後，執行停止遠端、離線、撤權與原工具回歸；記錄正式證據、更新原 GridCraft 操作手冊與工作台。

## 原始碼與測試
- 草稿 PR #89： https://github.com/lihuany635-create/lizhi-cloud-web/pull/89
- 完整 P4 5 工作 CI： https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44249621542
- 原 Site add-on： `sites-migration/ai-workbench/gridcraft-p4-site-addon.mjs`
- 依實際 Edge v3 改進的 v4 code： `integrations/gridcraft/p4-edge-v4-candidate.ts`（正式已發布為 v4、gate OFF）
- P4 安全寫入原始碼：`integrations/gridcraft/gridcraft_p4_safe_write.py`, `gridcraft_p4_desktop.py`, `gridcraft_outbound_worker.py`, `gridcraft_windows_agent.py`
- 正式 SQL migration 版：`integrations/gridcraft/P4_SQL_CANDIDATE.sql`（已套用）

## 已知限制
- `expected_version` 只驗證目標區域內容，並非全工作簿版本。
- `file.saveBytes` 的 XLSX 快照未獨立證實所有進階 Excel 物件完整無損；真機首先使用合成測試副本。
- 提交結果不明不自動重試，備份保留 Windows 本機、不透過 Edge 上傳。
- User approval P4 **只是正式部署授權**，每次實際寫入仍應有該次使用者確認，不可假設已授權改 Book1。

**交接結論：正式 DB/Edge v4 安全門控完成；原 Site MCP 與真實 Windows 寫入仍 NOT_TESTED。**
