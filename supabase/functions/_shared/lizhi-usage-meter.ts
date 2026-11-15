// Reusable, opt-in event metering for EXISTING Supabase Edge Functions.
// Instrument a function IN THE SAME INVOCATION. No second Edge Function invocation.
// This adds one PostgREST INSERT and a daily-rollup database update per request;
// do not deploy across all functions without a staged load/capacity test.
export type MeterDecision = "allow" | "throttle" | "block";
export type MeterHandler = (req: Request) => Promise<Response>;
export type MeterOptions = {
  // Supply only static, non-PII route names; never use raw URLs or query strings.
  route: string;
  // Optional budget decision made by the caller.
  decide?: (response: Response) => MeterDecision;
};
const length = (headers: Headers): number | null => {
  const raw = headers.get("Content-Length");
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const n=Number(raw);
  return Number.isSafeInteger(n) && n>=0 ? n : null;
};
async function record(data: Record<string, unknown>): Promise<boolean> {
  const base=Deno.env.get("SUPABASE_URL")?.replace(/\/$/,"");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) return false;
  try {
    const response=await fetch(base+"/rest/v1/lz_usage_events", {
      method:"POST", headers:{
        apikey:key,Authorization:"Bearer "+key,
        "Content-Type":"application/json","Prefer":"return=minimal"
      },
      body:JSON.stringify(data),
      signal:AbortSignal.timeout(3500)
    });
    return response.ok;
  } catch { return false; }
}
export async function withUsageMeter(
  request: Request, source: string, options: MeterOptions, handler: MeterHandler
): Promise<Response> {
  const route=options.route;
  if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(source) ||
      !/^[a-zA-Z0-9_./:-]{1,120}$/.test(route)) {
    throw new Error("Telemetry source/route must be static, bounded and non-sensitive.");
  }
  const started=performance.now();
  let result: Response | undefined;
  let status=500;
  let decision: MeterDecision="allow";
  try {
    result=await handler(request);
    status=result.status;
    decision=options.decide?.(result)??"allow";
    if(!["allow","throttle","block"].includes(decision))decision="allow";
    return result;
  } finally {
    // A metering failure must NOT change a successful business response.
    const event={
      source, route, status_code:status, decision,
      request_bytes:length(request.headers),
      response_bytes:result?length(result.headers):null,
      duration_ms:Math.min(3600000,Math.max(0,Math.round(performance.now()-started)))
    };
    // We await to maximize observability. This increases DB load/latency and
    // still cannot provide 100% coverage if the function terminates early.
    await record(event);
  }
}
