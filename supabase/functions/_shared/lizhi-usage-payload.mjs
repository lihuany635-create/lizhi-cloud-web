// Pure telemetry payload builder. No secrets, bodies, URLs or account identifiers.
export function meterPayload({source,route,statusCode=500,decision="allow",requestHeaders,responseHeaders=null,durationMs=0,requestId}={}) {
  if(typeof source!=="string"||!/^[a-zA-Z0-9_.-]{1,80}$/.test(source)||
     typeof route!=="string"||!/^[a-zA-Z0-9_./:-]{1,120}$/.test(route)) {
    throw new Error("Use static source and route identifiers, never raw URLs or PII.");
  }
  if(!Number.isInteger(statusCode)||statusCode<100||statusCode>599)throw new Error("Invalid HTTP status.");
  if(!["allow","block","throttle"].includes(decision))throw new Error("Invalid metering decision.");
  if(!Number.isFinite(durationMs)||durationMs<0)throw new Error("Invalid duration.");
  if(typeof requestId!=="string"||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).test(requestId))
    throw new Error("Invalid request ID.");
  const size = headers => {
    const raw = headers?.get?.("content-length");
    if(raw===null||raw===undefined||!/^\d+$/.test(raw))return null;
    const n=Number(raw);
    return Number.isSafeInteger(n)&&n>=0&&n<=1099511627776?n:null;
  };
  return {
    source,route,request_id:requestId,status_code:statusCode,decision,
    request_bytes:size(requestHeaders),
    response_bytes:responseHeaders?size(responseHeaders):null,
    duration_ms:Math.min(3600000,Math.round(durationMs))
  };
}
