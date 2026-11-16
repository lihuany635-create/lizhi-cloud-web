// User-transcribed readings from the Supabase Organization Usage dashboard.
// This never claims that numeric values came from an authenticated official API.
export const EGRESS_GB = 1_000_000_000;
export const FREE_UNCACHED_GB = 5;
export const EGRESS_SOURCE = "manual_supabase_usage_dashboard";

export function validateEgressInput(value, now = new Date()) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("讀數格式不正確。");
  const {month} = value;
  const units={B:1,KB:1000,MB:1e6,GB:1e9,KiB:1024,MiB:1048576,GiB:1073741824};
  const modern=Object.hasOwn(value,'total');
  if(modern && (value.samePeriod!==true || !Object.hasOwn(units,value.unit) || typeof value.observedAt!=='string'))
    throw new Error('必須確認同一組織、同一帳期，提供單位及官方讀數觀測時間。');
  const totalGb=modern?value.total*units[value.unit]/EGRESS_GB:value.totalGb;
  const cachedGb=modern?value.cached*units[value.unit]/EGRESS_GB:value.cachedGb;
  if(modern && (typeof value.total!=='number'||typeof value.cached!=='number'))throw new Error('讀數必須是數值。');
  const observedAt=value.observedAt??now.toISOString();
  if(typeof observedAt!=='string'||!/^20\d{2}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(observedAt)||!Number.isFinite(Date.parse(observedAt))||Date.parse(observedAt)>now.getTime()+60000)
    throw new Error('觀測時間無效。');
  if (typeof month !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("請指定有效月份。");
  if (typeof totalGb !== "number" || typeof cachedGb !== "number" ||
      !Number.isFinite(totalGb) || !Number.isFinite(cachedGb) ||
      totalGb < 0 || cachedGb < 0 || totalGb > 100_000 || cachedGb > totalGb)
    throw new Error("總傳出量及快取流量必須是正確的 GB 數值，且快取不得超過總量。");
  const totalBytes = Math.round(totalGb * EGRESS_GB);
  const cachedBytes = Math.round(cachedGb * EGRESS_GB);
  if (!Number.isSafeInteger(totalBytes) || !Number.isSafeInteger(cachedBytes))
    throw new Error("讀數超出允許範圍。");
  return {
    source: EGRESS_SOURCE, verifiedByProvider: false,
    month, observedAt: new Date(observedAt).toISOString(), totalBytes, cachedBytes,
    uncachedBytes: totalBytes - cachedBytes
  };
}

export function parseEgressRows(rows, month) {
  if(!Array.isArray(rows)) throw new Error("歷史資料格式錯誤。");
  const snapshots=[];const seen=new Set();let duplicateRows=0;
  let invalid=0;
  for(const row of rows) {
    try {
      const data=typeof row.done === "string" ? JSON.parse(row.done) : null;
      if (!data || data.source !== EGRESS_SOURCE || data.month !== month ||
          !Number.isFinite(Date.parse(data.observedAt)) ||
          ![data.totalBytes, data.cachedBytes, data.uncachedBytes].every(
            n=>Number.isSafeInteger(n)&&n>=0) ||
          data.totalBytes-data.cachedBytes!==data.uncachedBytes)
        throw new Error("invalid");
      const key=JSON.stringify([data.month,new Date(data.observedAt).toISOString(),data.totalBytes,data.cachedBytes]);
      if(seen.has(key)){duplicateRows++;continue;}seen.add(key);
      snapshots.push({
        id:String(row.id), observedAt:data.observedAt, month:data.month,
        totalBytes:data.totalBytes, cachedBytes:data.cachedBytes,
        uncachedBytes:data.uncachedBytes, source:EGRESS_SOURCE,
        verifiedByProvider:false
      });
    } catch { invalid++; }
  }
  snapshots.sort((a,b)=>b.observedAt.localeCompare(a.observedAt));
  const latest=snapshots[0]||null;
  const ratio=latest ? latest.uncachedBytes/(FREE_UNCACHED_GB*EGRESS_GB) : null;
  const alert=ratio===null?"UNKNOWN":ratio>=1?"LIMIT_REACHED":ratio>=.95?"CRITICAL":ratio>=.85?"WARNING":ratio>=.70?"NOTICE":"WITHIN";
  const oldest=snapshots.at(-1);
  const target=latest?Date.parse(latest.observedAt)-7*86400000:0;
  const baseline=snapshots.find(r=>Date.parse(r.observedAt)<=target);
  const trend=(base)=>!latest||!base?{status:'UNKNOWN'}:{status:latest.uncachedBytes<base.uncachedBytes?'DECREASE_REQUIRES_REVIEW':'AVAILABLE',from:base.observedAt,to:latest.observedAt,deltaGb:(latest.uncachedBytes-base.uncachedBytes)/EGRESS_GB};
  return {month,source:EGRESS_SOURCE,automatic:false,providerVerified:false,
    quotaBasis:'Free 5 GB baseline; actual plan and billing period require owner verification',
    uncachedGb:latest?latest.uncachedBytes/EGRESS_GB:null,freeQuotaGb:FREE_UNCACHED_GB,
    usedRatio:ratio,remainingGb:latest?Math.max(0,FREE_UNCACHED_GB-latest.uncachedBytes/EGRESS_GB):null,
    lastUpdated:latest?.observedAt??null,sevenDayChange:trend(baseline),availableHistoryChange:trend(oldest),duplicateRows,
    limitBytes:FREE_UNCACHED_GB*EGRESS_GB,alert,latest,
    readings:snapshots.slice(0,100),invalidRows:invalid,complete:invalid===0&&rows.length<501};
}
