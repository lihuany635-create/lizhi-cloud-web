# 立之 Supabase 流量監控中心｜專屬 Private Site 正式發布與驗收 v2.0

日期：2026-11-16（Asia/Taipei）。本紀錄接續並更新先前「Site 不存在」的驗收現況，不刪除舊報告。

## 發布結果

- **唯一專屬 Private Site 已正式發布，僅本人可見。**
- Site：<https://lizhi-usage-monitor-mcp.lihuany635.chatgpt.site>
- Site ID：`appgprj_6afa643e8c548191bc2f720f5a6dba56`
- 最終版本：**v6**；version ID：`appgprj_6afa643e8c548191bc2f720f5a6dba56~appgver_b5154afe0aa48191a5c08e24cac5c3cb`
- Deployment：`appgdep_6afa6c8298e88191ab31de760cc95ba5`，succeeded、has_mcp=true、env revision=1。
- Site source commit：`d83e608b994a00a6f18e87b988c91da7e9215ba3`。
- 權限重新核對：owner 一人、其他允許使用者／群組無、external visitors=0。
- 已生成並安裝專屬插件：`plugin_asdk_app_sites_db502796280481918731424b11c0092c`；管理工具回覆 Already installed。**當前對話的工具清單尚未載入新插件，不能把已安裝當成新對話呼叫通過。**

原 Supabase 專案、原資料庫、原網站完全沿用；原 `lizhi-usage-monitor` 由 v3 加入此專屬 Site 的橋接驗證綁定後發布為 **ACTIVE v4**。九工具業務、既有本人 JWT 驗證與 Side 儲存沿用，沒有建立第二個監控系統。沒有修改 AI 工作台或其他 Site 的程式、工具或設定。

## 橋接與安全

Site 原生可信標頭提供已登入 id/email；伺服器核對原生 owner-private 邊界及已從 Sites 權限回應核實的本人 email。工具參數不能自報 owner。Site 僅將九項 usage_* 送至固定原 Edge /mcp。

新生成的 384-bit 隨機橋接密鑰只保存在本站的 `LIZHI_USAGE_MCP_BRIDGE_KEY` Secret；`USAGE_OWNER_EMAIL` 亦標記為 Secret，讀回值為 null。原 Edge 程式只保存密鑰與本人 principal 的 SHA-256 單向驗證值，沒有保存原始橋接密鑰或本人 email。不能把公開 verifier 本身拿來當密鑰；已測拒絕。

Supabase service_role 仍只存在原 Edge，不傳給 Site、瀏覽器或 ChatGPT 記帳內容。本次沒有變更資料表、RLS 或工作台業務。

修復正式 runtime 相容性：Cloudflare Worker 不接受 redirect:error；改 redirect:manual 並拒絕 3xx，不將橋接密鑰跟隨重新導向送至其他站。補上正式相容回歸測試。驗收曾使用僅本人可存取的臨時表單呼叫正式 /mcp；**v6 已移除臨時表單**，保留薄轉接。/mcp 程式與完成實測的 v5 相同。

## 九工具正式結果

|工具|結果|證據範圍|
|---|---|---|
|usage_status|PASS|本人 Site → 原 Edge HTTP200、isError=false、siteConnected=true|
|usage_summary|PASS|真實 Side 月／日統計；工具呼叫數 10→11|
|usage_services|PASS|真實服務、功能、任務及原因|
|usage_events|PASS|成功讀回新 before/after，包含 plannedCalls、完成時間及實際次數|
|usage_alerts|PASS|本月 UNCONFIGURED；測試月份可讀回上限2及WITHIN_CAP|
|usage_policy|PASS|真實回覆無全域攔截、不保證跨對話自動登記、未設定上限hold_optional|
|usage_log_before|PASS|正式 INSERT、saved=true、verified=true；重送仍同一紀錄|
|usage_log_after|PASS|成功與中止結果保存並讀回；重送不重計；不同任務遭拒|
|usage_budget_set|PASS|測試月份2099-12 cap1→cap2，兩次都saved/verified，alerts重新讀回2|

以上是本人已登入瀏覽器經專屬 Site 正式 MCP 轉接的真實結果，**不是單元測試，也不是當前 ChatGPT 對話已原生載入新工具的證據**。

## 真實事件與統計

- 成功事件 `d4e546ca-b2eb-4df2-b244-856ef89cfc14`：before ID `a73ca02d-f28f-8772-8659-d23c2dcb0ba0`、after ID `3e312ead-5ffb-83ec-a4b0-bd3b082b16ad`。plannedCalls=1，實際 Supabase get_edge_function 1 次，outcome=success。目的為本次本人要求的必要正式來源驗收；本月未設上限，before 對非必要操作回 hold，不將此例冒稱達限放行驗收。
- before 與 after 均重送測試。讀回仍各一筆；統計由10增至11，重送後仍11。
- 改列另一任務的 after 被拒（isError=true），原成功結果未改寫。
- 中止事件 `2d6372c5-62aa-4346-8d30-66c9466e4fa9`：未設定上限，非必要操作實際沒有執行，after outcome=failure、toolCalls=0。保存成功、失敗數=1，沒有偽造工具呼叫。
- 原監控網站本人 Google 登入後，真實畫面顯示總呼叫11、未完成0、失敗1，並列出上述兩筆任務、目的與結果。
- 上限測試只用2099-12，留下真實設定歷史；本月2026-11維持null/UNCONFIGURED，沒有替本人決定數字或宣稱保護已啟用。

## 十六項正式驗收

|#|項目|狀態|原因／證據|
|---|---|---|---|
|1|正式列出九工具|PASS|本人 Site tools/list 明確返回九名稱；發布 has_mcp=true|
|2|六查詢正常|PASS|本人 Site 六項實際 HTTP200/isError=false，逐筆核對回覆ID|
|3|before保存|PASS|新成功事件 saved/verified 與正式行ID|
|4|after保存|PASS|同事件 saved/verified，成功/中止皆保存|
|5|重新讀回前後記錄|PASS|usage_events(eventId) 返回唯一before/after與實際內容|
|6|操作次數統計|PASS|真實必要get_edge_function 1次，總數10→11|
|7|專案／任務／操作原因|PASS|Site查詢及原網站顯示新任務與目的|
|8|重送不重計|PASS|before/after重送後各一筆、總數仍11|
|9|失敗仍留存|PASS|中止事件failure、toolCalls0，原網站failure1；不同任務寫入遭拒|
|10|本人修改上限並讀回|PASS|2099-12 cap1→2、saved/verified；alerts回2，不改本月設定|
|11|達到自訂上限時停止非必要操作|NOT_TESTED|尚未指定本月數值；已真實驗證未設定上限時hold並中止。隔離達限測試PASS不能冒充本月正式達限|
|12|匿名及非本人拒絕|NOT_TESTED|正式Site匿名403/偽造identity403、原Edge匿名401/錯bridge403/異站403 PASS；沒有真實第二個已登入帳號與撤權測試|
|13|非本人不可讀／改上限|NOT_TESTED|owner-private單一本人與伺服器校驗、偽造拒絕PASS；真實第二帳號未測|
|14|原網站查到新資料|PASS|本人Google登入，原?open=usage畫面顯示11次及新success/failure紀錄|
|15|新ChatGPT對話載入／呼叫|NOT_TESTED|插件已安裝；此對話工具目錄未刷新，需本人開新對話實際呼叫|
|16|跨對話自動前後登記|NOT_TESTED|未取得第二對話證據，平台沒有本任務可用全域hook；不得以工具存在推論自動化|

## 自動測試與正式拒絕證據

- 原倉庫 commit `9c204d60787a65eca746083bb73882687fdd3189`。
- [QA43790661689](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/43790661689)：completed/success，Node234/234、Deno、隔離PostgreSQL、正式匿名／異站回歸。
- [Pages43790661641](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/43790661641)：completed/success。
- Site薄轉接7/7測試PASS，含無身分／他人／客戶端自報owner拒絕、固定上游、轉址拒絕、缺少密鑰拒絕、不洩漏後端錯誤。
- 另以無登入HTTP實測：Site匿名403、假身份標頭403；Edge匿名401、錯密鑰403、異站403。

## 限制與必要本人操作

1. 在新ChatGPT對話啟用本插件並實際呼叫usage_status與usage_events，才能完成新對話載入驗收；此處無法替本人開啟並操作另一個真實對話。
2. 本人指定本月AI操作上限後，才做正式達限與預警測試。未設定不假設數字。
3. 真實第二帳號／撤權測試需要相應帳號或本人撤權操作；目前只核對單一本人Private政策及已測拒絕。
4. 工具本身不會全域攔截所有未來AI呼叫；記帳呼叫本身不遞迴。AI次數與官方Edge/Egress/費用仍明確分開。

## 回退

先前Site v5為完成本人正式讀寫驗收的版本，v6僅移除臨時表單；v5 version ID：`appgprj_6afa643e8c548191bc2f720f5a6dba56~appgver_fa90be3770e48191afd6df172ce8f116`。可用原Site的saved version回退，不改其他Site。

原Edge v3完整來源對應 `5c6bd66fec008e4b9e2fba8415e6c98634b5c394`；若必須解除新綁定，只重部署原監控函式至該來源（會使新Site無法橋接），不回退共享工作台或刪Side歷史。本次v4對應 `9c204d6`，保留既有owner-JWT通道。
