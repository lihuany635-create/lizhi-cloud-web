# 原私人 Site v31｜移除 GridCraft P4 網頁確認頁（2026-11-19）

## 已授權的修改

使用者：「把確認頁的流程刪掉我不需要這個」。只移除額外開網頁逐筆確認，不移除本人登入驗證、MCP 本人身分、Windows 既有配對、備份、預覽、版本檢查或寫入限制。不建立其他 Site、MCP、Supabase 專案或資料庫。

## 現況

原 Private Site：https://lizhi-animation-flow.lihuany635.chatgpt.site
正式 v30 仍含 GridCraft 的 /gridcraft/approve 路由、逐筆網頁確認旗標，尚未發布 v31。
原 Edge lizhi-gridcraft-bridge v6 ACTIVE：已有限制 P4 調用、本人 actor 與橋接 Secret；內部仍要 owner_confirmed:true，但原 Edge **不含網頁確認路由**，本次無需修改 Edge。
Windows v0.5.1 具本機自動 P4 許可候選，真人寫入仍未測；正式 gridcraft_status.write_enabled:false 是 Edge v6 硬編碼，不能直接視為 Windows 本機狀態。

## 原地套用（原 Site v30 → v31）

來源分支：fix/gridcraft-site-no-approval-v31-20261119
接線程式：sites-migration/ai-workbench/gridcraft-v05-no-click-addon.mjs
原合約：sites-migration/ai-workbench/gridcraft-p4-site-addon.mjs
測試：integrations/gridcraft/gridcraft-v05-no-click-site.test.mjs

1. 先保留原 Site v30 回退版、原本人私有授權、Secrets、單一 /mcp 及全部已存在工具。
2. 原 MCP tools/list 的兩個 P4 tool 使用 ONE_CLICK_TOOL_DEFINITIONS；公開 commit_write 僅要求 preview_id、expected_version、request_id，不暴露 owner_confirmed 或確認頁連結。
3. 原 MCP tools/call 先驗證當前本人 principal，僅將 P4 兩工具分派至 callGridcraftNoClick；verifiedPrincipal 僅能取自已驗證的原 Site principal，不可從使用者參數或自稱標頭取得；帶入既有原橋接 Secret、expectedPrincipal；仍轉接原 Edge /site/dispatch。
4. **刪除原 Site GridCraft 專屬 /gridcraft/approve 網頁路由、確認按鈕頁面、approval_url 產生、等待網頁授權旗標和逐筆確認資料結構**。其他功能登入及核准功能不許更動。
5. 只在已驗證本人 MCP 的提交動作，由 Site 內部補 Edge 兼容的 owner_confirmed:true；不接受從外界傳 true 或 false 操縱；Gate GRIDCRAFT_P4_NO_CLICK_ENABLED 預設 OFF，成功驗收後才 ON。
6. 仍由原 Windows P4SafeWriter 執行 90 秒短效預覽、50 格上限、值/公式限制、版本 CAS、完整 XLSX 本機備份、單次 request_id 去重、回讀驗收、錯誤停止及不自動儲存原件。
7. 本人於 ChatGPT 直接指定變更內容後，AI 連續呼叫 prepare_write 和 commit_write；不用再次開網頁。多工作簿同時開啟時必須明確選擇目標，避免改錯檔。
8. 不能繞過平台自身的強制工具批准機制，若有須如實說明。

## 驗收

- 原 Site 同一路徑私人發布，保留原工具清單、原 /mcp、本人工具授權、全部其他功能。
- 新 schema 沒有 owner_confirmed；不會返回 approval_url；原 /gridcraft/approve 不再參與寫入。
- 本人 Windows GridCraft Book1 **測試副本** Sheet1!A3 新增 123：prepare→commit→本機備份→讀回 PASS，無需網頁確認；不得拿舊的逾期 preview 重用。
- 匿名、第二帳號、無效身份／裝置、版本衝突、重放、過期、超格、公式、關閉工作簿、備份失敗均須拒絕。

## 驗證與未完成

候選 GitHub CI：https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44443749808 全 PASS（包含新免確認頁與舊 P3/P4 保護）。
本對話**沒有原 Sites 的編輯／發布工具**，未觸及原 Site v30；候選程式碼已寫，但正式 v31 發布、真實 Windows 寫入與回退驗收皆未完成。
