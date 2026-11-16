> 最新狀態（2026-11-16）：唯一專屬 Private Site 已建立並發布 v6，原監控 Edge ACTIVE v4。九工具本人正式讀寫與原站顯示已驗證；新對話／跨對話、本月達限及真實第二帳號仍待驗。以 [SITE_RELEASE_20261116.md](./SITE_RELEASE_20261116.md) 為目前交接；以下保留建立前歷史。

# 流量監控中心｜專屬 Site MCP 接線交接 v0.3.0

2026-11-16，本次使用者指示取代本檔舊版「加入 AI 工作台 Site」方案。

## 已核對現況

- 監控中心專屬 Site **不存在**：Sites owner 清單 8 項、cursor=null；editor 清單 0 項、cursor=null。沒有可沿用的監控 Site ID、網址或發布版本。未建立新 Site。
- **禁止修改 AI 工作台或其他 Site**；工作台僅讀取進度並新增本專案交接紀錄。
- 原倉庫 `lihuany635-create/lizhi-cloud-web`，原 PR #77 merged；基線 `19a1b8ae553c6e0177124c4715243fc3afb4c342`。
- 原 Supabase `hrdzywkihfqggiwjgavi`，原 Edge `lizhi-usage-monitor` v2 是回退基線。
- 原網站 `https://lihuany635-create.github.io/lizhi-cloud-web/?open=usage` 保留；無新資料庫、無第二套網站或付費服務。

## 本次後端增量

原 Edge `/mcp` 使用 `_shared/lizhi-usage-ai-mcp.mjs`，九工具皆使用既有 Side AI 自登記來源；原觀測 `/snapshot` 保留。舊 `_shared/lizhi-usage-mcp-core.mjs` 僅保留歷史相容函式及測試，不是正式 `/mcp` dispatcher。

|工具|資料或行為|
|---|---|
|usage_status|來源、完整性、本人上限、連線限制|
|usage_summary|AI 每月／每日操作、未知官方帳務|
|usage_services|全已讀紀錄依服務、功能與任務統計|
|usage_events|事件列表；帶 eventId 可讀 before/after 的 plannedCalls、實際次數、完成時間|
|usage_alerts|已設定上限、已登記次數、未設定／接近／到達／不完整狀態|
|usage_policy|AI 流程約束、無全域攔截、無跨對話自動化保證|
|usage_log_before|實際 INSERT Side，讀回比較；回 saved/verified/decision；重送不另增|
|usage_log_after|同 eventId 與原用途，成功／失敗／未知均留存；讀回、去重、拒絕改寫|
|usage_budget_set|本人授權下追加每月 cap，重新查詢驗證；不改寫舊上限歷史|

`usage_log_before` 必填 eventId、at、service、feature、taskLabel、actionDetail、operation、plannedCalls。
`usage_log_after` 必填同一 eventId 及五項原用途欄位、completedAt、toolCalls、outcome；evidenceUrl 可選，限可信來源且不可含 query/hash/登入資料。
`usage_budget_set` 必填 month（YYYY-MM）、cap（1～1000000 正整數）。驗證本人由 Edge 執行，不接受工具參數自稱 owner。

寫入只 INSERT `aiwb_side_logs`，owner_id 僅來自既有已核對專案的 owner；固定 agent=ChatGPT、project=Supabase 流量監控中心。事件 phase 對應穩定 UUID 主鍵，409 必須讀回比較，不使用 upsert/UPDATE/DELETE。紀錄官方 Edge/Egress/費用一律 null。完整月份查詢最多掃描 5000 筆，截斷時 fail-closed；晚送 after 與補登按原事件時間納入，不以資料列建立時間猜月份。

## 使用流程及限制

1. 查 status/summary/alerts，依已登記歷史預估 plannedCalls。
2. before 返回 **saved=true、verified=true、decision=allow** 才執行非必要操作。
3. 上限未設定、記帳不完整、其他 pending、已達上限均 hold；hold 仍保存 planned 紀錄，未執行時應以 after failure/unknown、toolCalls=0 完成，不刪紀錄。
4. 真正執行後，同 eventId 登記 after；失敗也記，補登禁止重跑操作。
5. 查 events(eventId) 讀回。記帳工具本身不遞迴記帳。

上限僅管理遵守流程的 AI 操作。沒有全域攔截，不能限制外部程式；actual 超過預估仍誠實保存並回 overEstimate。並行 pending 採保守停止，不是官方計費原子閘道。既有 Side 管理介面仍有其原本權限，本次不能將其宣稱為資料庫不可竄改儲存。

## 身分與唯一必要 Site 建立事項

依使用者指示：**先回報需要建立監控中心唯一的專屬 Private Site；本次未擅自建立，也不借用工作台 Site。**

Site 獲准建立後，只需部署薄轉接層，不重做監控網頁。manifest capabilities 加 mcp，POST /mcp 先驗證平台提供的本人身分，再用 server-only 專用 Secret 呼叫原 Edge。

- Edge 固定上游 `https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-usage-monitor/mcp`。
- Edge 專用 Secrets：`LIZHI_USAGE_MCP_BRIDGE_KEY`、`LIZHI_USAGE_MCP_ALLOWED_ACTOR`；Site 保管對應橋接密鑰與本站 owner principal。
- 不借用其他 Site 的 Site-scoped actor；應在新 Site 取得平台核實身分後綁定，不接受請求本文或瀏覽器自報 actor。
- Bridge Secret 與 actor 任一缺失或不符均拒絕。service_role 只在原 Edge。
- Site 私人發布後原生工具安裝／連接、新對話載入、跨對話實際 before/after 都須另做真實驗收。

## 已執行驗證

- Node 230/230 PASS：原 204 項回歸，加九工具／持久重新載入／去重／失敗／上限及 Edge/Auth/PostgREST 隔離整合。
- Deno check 原 Edge PASS；移除未使用且會要求遠端下載的 functions-js 型別匯入，保留 Deno 原生型別。
- 正式唯讀 SQL PASS：Side、events、daily 三表 RLS=true；anon/authenticated 無 SELECT，service_role 有 INSERT；原監控專案 owner 綁定唯一。
- 以上隔離成功不能取代正式本人 HTTP、Site 或跨對話驗收。

## 回退

保存的原 v2 來源對應 Git 基線 `19a1b8ae553c6e0177124c4715243fc3afb4c342`。若 v3 有回歸，只將 `lizhi-usage-monitor` 與所需 `_shared` 檔案重新部署為 v2 來源，verify_jwt 保留 false 並保留應用層本人驗證。不要回退全倉庫 main，不改工作台、不刪 Side 新增歷史、不重套 migration。因專屬 Site 尚未建立，無 Site 回退版本。
