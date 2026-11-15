// UI-only parsing. Never invent official Supabase usage values from app-side telemetry.
export const REQUIRED_FIELDS = ["request_count","response_bytes_known","blocked_count"];
export function isValidMonth(month) {
  return typeof month==="string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(month);
}
export function taiwanMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Taipei",year:"numeric",month:"2-digit"
  }).formatToParts(date);
  return parts.find(x=>x.type==="year").value+"-"+parts.find(x=>x.type==="month").value;
}
export function formatCount(value) {
  return Number.isSafeInteger(value)&&value>=0 ? value.toLocaleString("zh-TW") : "未知";
}
export function formatBytes(value) {
  if(value===null||value===undefined||!Number.isFinite(value)||value<0)return "未知";
  if(value>=1e9)return (value/1e9).toFixed(3)+" GB";
  if(value>=1e6)return (value/1e6).toFixed(2)+" MB";
  if(value>=1e3)return (value/1e3).toFixed(1)+" KB";
  return Math.round(value).toLocaleString("zh-TW")+" B";
}
export function quotaLabel(value, unit) {
  if(value===null||value===undefined)return "未提供";
  return unit===" B" ? formatBytes(value) : formatCount(value)+(unit||"");
}
export function validateSnapshot(raw, expectedMonth) {
  if(!raw||typeof raw!=="object"||raw.month!==expectedMonth||
      raw.coverage!=="instrumented_only"||raw.source!=="app_telemetry_not_official_billing"||
      !Array.isArray(raw.sources)||!Array.isArray(raw.events)||
      !Array.isArray(raw.quotas)||!raw.summary||typeof raw.summary!=="object") {
    throw new Error("監控資料格式或月份不一致。");
  }
  for (const k of REQUIRED_FIELDS) {
    if(!Number.isSafeInteger(raw.summary[k])||raw.summary[k]<0) {
      throw new Error("監控計數不完整或格式錯誤。");
    }
  }
  if(raw.sources.length>100||raw.quotas.length>40||raw.events.length>100) {
    throw new Error("監控回應超過安全的資料筆數上限。");
  }
  for(const row of raw.sources){
    if(typeof row?.source!=="string"||row.source.length>80||
       !Number.isSafeInteger(row.request_count)||row.request_count<0)throw new Error("來源欄位無效。");
  }
  for(const row of raw.quotas){
    if(typeof row?.label!=="string"||row.label.length>140||
       !Number.isFinite(row.limit)||row.limit<=0||
       (row.official_used!==null&&row.official_used!==undefined&&
       (!Number.isFinite(row.official_used)||row.official_used<0))) throw new Error("配額欄位無效。");
  }
  return raw;
}
export function errorForHttp(status) {
  if(status===404)return "監控後端尚未部署（HTTP 404）。本頁目前僅為開發候選。";
  if(status===401)return "登入已失效或欠缺有效身分（HTTP 401）。";
  if(status===403)return "監控資料僅允許本人存取（HTTP 403）。";
  if(status===429)return "目前請求過於頻繁，請稍後手動更新。";
  return "監控後端讀取失敗（HTTP "+String(status)+"）。";
}
