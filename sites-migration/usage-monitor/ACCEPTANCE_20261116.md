# 專屬 Site MCP 接通驗收｜2026-11-16 v1.0

## 結論

**後端已發布，Site 未接通。** 依本次要求，先完成原監控 Edge 九工具與測試；監控中心尚無專屬 Site，停在回報建立唯一 Private Site 的必要事項。不建立或借用 AI 工作台 Site。所有正式 Site 完全未修改。

- 原監控 Edge：ACTIVE v3；`ezbr_sha256=0fdbff839ddc14f854da7ccb89a926b1c08cb0984465255d88b68e465acab4e3`；部署後重新下載來源，確認使用九工具 dispatcher。
- 原 Git main：`5c6bd66fec008e4b9e2fba8415e6c98634b5c394`。
- [QA 43788451151](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/43788451151)：completed/success。Node 230/230、Deno、PostgreSQL 隔離回歸及正式匿名／異站拒絕均 PASS。
- [Pages 43788451111](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/43788451111)：completed/success。網站程式沒有重做。
- Sites 完整 owner 清單 8 項、editor 0 項、兩者 cursor=null，均沒有監控中心。沒有監控 Site ID、網址、版本或已建立橋接身分。

## 九項工具

`usage_status`、`usage_summary`、`usage_services`、`usage_events`、`usage_alerts`、`usage_policy`、`usage_log_before`、`usage_log_after`、`usage_budget_set`。

九項已存在於正式 Edge v3 原始碼並在隔離 Edge/Auth/PostgREST 整合中執行。因 Site 不存在且本次未取得直接本人 HTTP 登入憑證，**九項全部尚未通過正式 Site 呼叫驗收**。不能把部署、源碼中的九個名稱或隔離結果當成正式 tools/list 成功。

## 正式發布後驗收矩陣

以下狀態嚴格指使用者要求的「專屬 Site 正式 MCP 路徑」。NOT_TESTED 不代表隔離測試失敗。

|編號|驗收項目|狀態|原因與證據|
|---|---|---|---|
|1|正式 MCP 列出九工具|NOT_TESTED|無監控專屬 Site；Edge v3 源碼九工具已讀回，隔離 list=9 PASS|
|2|六項查詢正常|NOT_TESTED|隔離查詢 PASS；無正式 Site／本人 HTTP 成功呼叫|
|3|before 正式保存|NOT_TESTED|隔離 INSERT/readback PASS；本次正式 Side 前記為原已連線 Side 工具寫入，不能算新監控 MCP|
|4|after 正式保存|NOT_TESTED|隔離保存 PASS；同上，尚無新監控 MCP 成功證據|
|5|重新讀取 before/after|NOT_TESTED|隔離事件查詢及持久檔案重新載入 PASS；原 Side 真實讀回 PASS，專屬 MCP 未測|
|6|正確統計工具次數|NOT_TESTED|隔離與 CI PASS，正式 MCP 成功資料未取得|
|7|顯示專案／任務／原因|NOT_TESTED|隔離資料及既有 Side 已核對，專屬 Site 實際輸出未測|
|8|重複不重計|NOT_TESTED|隔離完整重送、穩定 UUID/主鍵衝突與一次計數 PASS；正式 MCP 未測|
|9|失敗操作仍留存|NOT_TESTED|隔離 failure/unknown/零次中止與 DB 寫入錯誤 PASS；正式 MCP 未測|
|10|本人修改上限並讀回|NOT_TESTED|隔離本人流程 PASS；沒有擅自替本人設定正式月份上限|
|11|達上限停止非必要操作|NOT_TESTED|隔離 cap=1/2 與 pending 併行保守 hold PASS；正式上限未設定|
|12|匿名／非本人遭拒|NOT_TESTED|正式匿名 MCP401、匿名 ledger401、異站403、偽造 bridge403 PASS；真實第二帳號與撤權仍未測|
|13|非本人不能讀／改上限|NOT_TESTED|正式三表 RLS 與匿名/authenticated 無 SELECT PASS；隔離他人403 PASS；真實非本人 MCP 尚未測|
|14|原網站能查新資料|NOT_TESTED|隔離同一 Edge 的 /ai-ledger 已讀到新 MCP 寫入資料；正式網站本人登入畫面未操作|
|15|新 ChatGPT 對話可載入／呼叫|NOT_TESTED|無專屬 Site／工具安裝，不能開新對話冒充測試|
|16|跨對話自動登記|NOT_TESTED|平台未提供本任務可用的全域工具 hook；未做真實新對話前後登記。工具存在不等於自動執行|

## 本次真實寫入及讀回（輔助證據，不抵正式 Site 驗收）

透過原已連線 Side 工具，真實寫入並讀回下列事件：

- `6fd1ef5c-2311-41b3-a380-d1a453f4d33c`：監控儲存權限核對，before/after 同 ID，實際 SQL 工具 2 次。只查權限及原 owner 綁定，未執行 DDL。
- `5fbc7df4-51db-46e0-83c8-f018261bd429`：監控後端正式發布，before/after 同 ID，實際 Edge 部署工具 1 次。

這些是真實 Side 保存結果，**不是透過新 usage_log_before/after 的正式 Site 呼叫**。沒有宣稱本工作階段所有啟動查詢已被自動攔截記帳。初始部署狀態查詢與後續來源下載也不能當成自動流程驗收證據。

## 安全與限制

- 沿用本人綁定及 `/auth/v1/user` 驗證，或 server-only 橋接密鑰＋固定已核實 Site actor；沒有傳入／公開 service_role，沒有替不存在的 Site 編造 actor 或共用其他 Site actor。
- 寫入只追加既有 Side，不改工作台業務、schema 或 Site。欄位白名單、任務一致性、可信證據 URL、時間、次數、月份驗證；舊資料不刪不改。
- 上限未設定明示 UNCONFIGURED，非必要操作 hold；不能說保護已啟用。pending／不完整資料也保守 hold。
- 記帳動作不遞迴記帳；無全域攔截，不能保證未來所有對話自動呼叫；AI 自報次數不能換算官方計費量。
- Side 原本仍有管理／修改權限，本次不能宣稱整張資料表是不可竄改的稽核庫。
- 未進行獨立人工安全複核；無真實非本人或撤權測試。

## 唯一必要的下一步

向本人回報並取得「建立監控中心唯一專屬 Private Site」的明確決定，再部署薄 MCP bridge；不重建原監控網頁與資料庫。須在該 Site 取得平台核實的 owner principal，配置專用橋接 Secret，正式發布後完成上表的本人、非本人、網站、新對話及跨對話驗收。

## 回退

原 Edge v2 完整來源對應 Git `19a1b8ae553c6e0177124c4715243fc3afb4c342`。只重部署原 lizhi-usage-monitor 所需檔案；保留既有本人驗證與 verify_jwt=false 設定。不要回退整個共享倉庫、不要修改 AI 工作台、不要刪 Side 日誌或重套 migration。專屬 Site 不存在，沒有可報告的 Site 舊版本。
