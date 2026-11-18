# GridCraft P3｜已獲正式部署批准後的安全檢查與暫停交接｜2026-11-18

**批准來源：**本人於對話明確回覆「批准 P3 正式部署」；核准範圍為原 Private Site + 原 Supabase 專案最小 SQL/Edge + 本人 Windows 出站代理；禁止新 Site／新資料庫／未批准新增費用，不表示資料覆寫或公開 TCP 7979 已授權。

## 現況判定
- **批准：PASS**。有效授權已收到，不需重問同樣的部署批准。
- **GridCraft P3 候選：安全檢查進行中／CI 待確認**，保持原 PR #88 Draft，不合併 main。
- **正式 Supabase SQL/Edge：NOT_DEPLOYED**，沒有執行正式 SQL migration 或任何 Edge 發布。
- **原私人 Site：NOT_DEPLOYED**，本對話工具沒有可發布原 ChatGPT Private Site 的操作，不能以 GitHub 候選檔自動取代正式 Site。
- **本人 PC 出站配對與新對話 GridCraft MCP：NOT_TESTED**。先前僅使用者回報 v0.1 的 localhost READY。

## 使用者正式規則 Gate
1. 已讀原 Google Drive 最新《AI 員工手冊》（內容 v1.4）。第 27 條規定 usage_status + usage_alerts 成功、usage_log_before saved=true / verified=true / decision=allow 後才執行非必要 Supabase 操作。第 29 條監控故障須暫停與 NOT_LOGGED；第 30 條不能把 AI 工具次數當成官方 egress。
2. 本次監控查詢：`usage_status(2026-11)` 回 `WITHIN_CAP`（只代表 AI 自登記工具數）；`usage_alerts(2026-11)` **HTTP 503**；`usage_egress_history(2026-11)` 為人工抄錄（providerVerified=false），讀數 2026-11-16、期間 2026-10-26～11-26、uncachedGb=10.549，相對 Free 5GB 基準 `LIMIT_REACHED`；尚未取得官方即時方案／剩餘額度。
3. 因為無法滿足上述前置條件，**這一輪沒有呼叫 usage_log_before；沒有執行正式 execute_sql、apply_migration、deploy_edge_function 或其他需要記帳的正式變更**。只使用 connector 讀取一次 list_projects 確認原專案 ID `hrdzywkihfqggiwjgavi`／ACTIVE_HEALTHY（此管理讀取與監控 preflight 同批發出，未做業務寫入）。工作台 P3 作業紀錄 **NOT_LOGGED**，GitHub/Drive 補充報告另存，勿補寫虛構 event。
4. 原候選 Windows v0.2 遠端啟用會約 6 秒輪詢；在未掌握官方 egress/費用之前不能啟用並長期運作。
5. 真正 Edge Device 授權使用自訂 owner+device bearer，需獨立安全驗證、限速及撤權；Supabase 平台 default `verify_jwt=true` 將拒絕隨機裝置 bearer。若最後採自訂授權，部署可設定該**單獨**函數 `verify_jwt=false`，但必須讓 Edge 自行驗證每個路徑並回歸匿名拒絕。絕不可全面取消其他 Edge 認證。參考 Supabase 官方：https://supabase.com/docs/guides/functions/auth-headers

## 發現並在候選分支修復的實際連線錯誤
- 原 `gridcraft-p3-bridge.mjs` 將 GridCraft MCP tool call 送往不存在的 `/site`；實際 Edge handler 只接受 `/site/dispatch`。修正並添加 Site 端路由斷言。
- 原本 GridCraft Desktop `sheet.read` 使用的 `doc` 工作簿 UID 不是任意字串。官方 v0.19.1 `Session::window_list` 的 `doc_uid` 為 u64，`Target::from_json` 要求 JSON number。正式 MCP 以十進位字串傳送防止 JS 丟失精度，Windows local control 轉為 Python int 再發送，並檢查 UID 仍在工作簿清單中；Site/Edge/Worker 候選對文件 UID 採一致驗證。Source：https://github.com/storytold/gridcraft/blob/v0.19.1/crates/engine/src/windows.rs；https://github.com/storytold/gridcraft/blob/v0.19.1/crates/ui-egui/src/control.rs。
- 最新修正需看 CI #44226690703 完整成功及 Windows 最新打包結果。若測試仍 FAIL，不能發布。
- 本輪沒有改使用者真正 Excel，沒有公開使用者 GridCraft 本機控制 Token。

## 正式接線前可執行的最小動作（不需重複詢問部署批准）
1. 在現有 Supabase 官方 Dashboard 查核**此帳期正式 Uncached Egress、實際 Free/Pro 方案與不額外計費的可用量**，恢復原 usage_alerts/usage_log_before/after MCP 功能；若方案費用有變化，依既有使用者授權界線另取得費用批准。
2. 確認 GitHub Draft PR #88 的修復全數 CI PASS，對網路身分／撤權／配對速率／文件授權進行獨立安全複核。
3. 通過成本與安全 Gate 後，在原專案 `hrdzywkihfqggiwjgavi` 先建立最小內部私有表與 RPC（預備復原及具權限限制），再部署 `lizhi-gridcraft-bridge`，**功能 Gate 初始 OFF**；服務只接收可信原 Site 伺服器與配對 Windows 裝置，不開公網 TCP 7979。
4. 使用可操作的**原 Private Site** 發布入口，保留原 `legacy-route.ts`、AIWB、施工照片全部工具及原有 Secrets，只追加 GridCraft 受限工具與 server-only 新 Secret，原地 Private 部署並讀回工具清單／本人／匿名拒絕證據。
5. 在本人 Windows 上安裝 v0.2/修正版，透過獲本人身分確認的一次性配對碼 pairing，授權特定 GridCraft 工作簿，測新 ChatGPT 對話 `gridcraft_status`→`gridcraft_list_workbooks`→`gridcraft_read_range`；關機、停止代理與撤權後應拒絕。此項尚未進行，不能宣稱完成。

**此次交接目的**：保存批准與實測限制造成的安全停止點，避免下一位 AI 未確認額度／本人的 Site 身分便假裝 P3 正式上線，也避免向本人再次索取相同部署授權。
