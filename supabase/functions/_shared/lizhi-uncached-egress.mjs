// User-transcribed readings from the Supabase Organization Usage dashboard.
// This never claims that numeric values came from an authenticated official API.
export const EGRESS_GB = 1_000_000_000;
export const FREE_UNCACHED_GB = 5;
export const EGRESS_SOURCE = "manual_supabase_usage_dashboard";

export function validateEgressInput(value, now = new Date()) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("讀數格式不正確。");
  const {month, totalGb, cachedGb} = value;
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
    month, observedAt: now.toISOString(), totalBytes, cachedBytes,
    uncachedBytes: totalBytes - cachedBytes
  };
}

export function parseEgressRows(rows, month) {
  if(!Array.isArray(rows)) throw new Error("歷史資料格式錯誤。");
  const snapshots=[];
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
  const alert=ratio===null?"UNKNOWN":ratio>=.95?"CRITICAL":ratio>=.85?"WARNING":ratio>=.70?"NOTICE":"WITHIN";
  return {month,source:EGRESS_SOURCE,automatic:false,providerVerified:false,
    limitBytes:FREE_UNCACHED_GB*EGRESS_GB,alert,latest,
    readings:snapshots.slice(0,100),invalidRows:invalid,complete:invalid===0&&rows.length<501};
}
