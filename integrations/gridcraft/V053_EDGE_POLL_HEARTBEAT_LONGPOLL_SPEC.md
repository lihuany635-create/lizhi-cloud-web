# GridCraft v0.5.3｜Supabase Edge Function 相容升級說明

日期：2026-11-19。**這份文件只有規格，不會部署或修改正式 Edge。**
原站：私人 Site v31，原 Edge `lizhi-gridcraft-bridge` v6，原認證／裝置表／P3/P4 工具及路由全部保留。不得建立新服務、MCP、資料庫或公開端點。

## 現行 v6 與新 Windows 客戶端

v6 的 `/device/poll` 只讀 `deviceId`，回 `{job,status}`，不處理 `status` 欄位，也沒有 `heartbeatMerged` / `longPoll`。v0.5.3 照舊在 poll 前另送 heartbeat（每輪一次），普通 poll timeout 7s。沒有新旗標時這個舊行為必須保持。

## 可選 Edge v7 合併 heartbeat

在原 `/device/poll` 路由，**先按既有 `authorizedDevice(req,body.deviceId)` 驗證 Bearer token 並檢查裝置 owner/revoked 狀態**。當 request body `status` 為 `READY`、`GRIDCRAFT_OFFLINE`、`UNAUTHORIZED`、`CONTROL_ERROR` 時：

1. 原子更新既有 `lz_gridcraft_devices` 這個 owner+device 的 `last_status=status`、`last_seen=now`（與原 heartbeat 使用相同白名單及既有資料表）。
2. 更新成功才允許在回應中附帶 `heartbeatMerged:true`；若無法更新，必須回錯誤，**不能**宣稱 heartbeat 已合併。
3. 合併後以更新後的狀態判斷能否 `rpc/lz_gridcraft_claim_job`，不要使用更新前 `device.last_status` 的舊快照。
4. 未提供合法 status 的**舊客戶端**，維持原 v6 poll 行為及回應，不得誤合併。

示意（非可直接部署的完整 Edge 原始碼）：

```ts
if (action === "poll") {
  const device = await authorizedDevice(req, body.deviceId);
  const valid = ["READY","GRIDCRAFT_OFFLINE","UNAUTHORIZED","CONTROL_ERROR"];
  const merged = valid.includes(body.status);
  if (merged) {
    await updateOwnerDeviceHeartbeat(device.owner_id,device.device_id,
                                     body.status,new Date().toISOString());
  }
  // Use updated effective status; claim only for READY and active device.
  const currentStatus = merged ? body.status : device.last_status;
  const job = currentStatus === "READY" ? await claimAllowedJob(device) : null;
  return json({ job, status:job?"CLAIMED":"IDLE",
                ...(merged ? {heartbeatMerged:true} : {}) });
}
```

## 可選 Edge v7 長輪詢

在**已驗證本人裝置**的 /device/poll request 內，若沒有可領取 job，最多在伺服器端等待 **25 秒**，過程中定期檢查同一 owner/device 的工作、撤權、Gate/期限；不能持有 PostgreSQL 長交易或鎖。請採固定小批量輪詢與用量評估，避免降低外部請求卻大量增加非快取 DB 回傳。若長輪詢真正啟用，回應 `longPoll:true`，客戶端之後採 **30 秒 timeout 且每輪不另外等待**。不支援時不回此旗標，客戶端維持 7 秒 timeout／2、6、20 秒間隔。

**v6 設有 20 秒有效 heartbeat 判定：** 如果 poll 等 25 秒而只在進入時更新一次 `last_seen`，其他 Site 查詢會誤判離線。因此長輪詢期間需每隔約 8–10 秒安全更新目前裝置的 last_seen，或先以可驗證的方式延長只適用已驗證長輪詢裝置的有效判斷；不可把過期／已撤權裝置變成在線。完整 owner、認證及有效期檢查必須在每次領取工作前重做。

## HTTP 退避語意

429 和 5xx 回應可附標準 `Retry-After` 秒數／HTTP date。v0.5.3 優先照該值等待（上限以客戶端保護 24 小時處理），未提供時採 6→12→24→48→60 秒，再加 0–20% jitter；成功一次歸零。不得在錯誤時伺服器偷偷重跑 P4 commit（保留 request_id 去重與「結果不明不盲重送」）。

## 正式部署與驗收邊界

此 Windows 改版**不授權** Edge 正式部署。若未來另批准原 Edge v7，需先備份與登記 Supabase 使用前後流量，再對匿名／偽造 owner／撤權／逾期、P3、P4、正反向重試、25 秒截斷、20 秒 heartbeat、跨版本（v0.5.2 與 v0.5.3）完整測試，確認非快取流量不增加過量，最後才啟用 feature flag。原 v6 可以一直保留作安全相容模式。
