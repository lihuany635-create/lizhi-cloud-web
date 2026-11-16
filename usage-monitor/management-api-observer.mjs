// Server-only optional Supabase Management API observation.
// Official project API request analytics are NOT organization billing, Edge
// invocations, or egress. Never use this to authorize a spend-limit gateway.
const PROJECT_REF="hrdzywkihfqggiwjgavi";
export const API_COUNT_METRICS=Object.freeze([
  "total_auth_requests","total_realtime_requests","total_rest_requests","total_storage_requests"
]);
const validCount=x=>Number.isSafeInteger(x)&&x>=0;
export async function readProjectApiCountObservations({
  token,projectRef=PROJECT_REF,fetchImpl=fetch,timeoutMs=7000
}={}){
  if(typeof token!=="string"||token.length<20)
    return {state:"unavailable",reason:"management_read_credential_missing",billable:false,rows:[]};
  if(projectRef!==PROJECT_REF)throw new Error("Unexpected project ref");
  if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>15000)
    throw new Error("Invalid timeout");
  const endpoint="https://api.supabase.com/v1/projects/"+projectRef+
    "/analytics/endpoints/usage.api-counts";
  let response;
  try{
    response=await fetchImpl(endpoint,{
      method:"GET",redirect:"manual",headers:{Authorization:"Bearer "+token,
        Accept:"application/json"},signal:AbortSignal.timeout(timeoutMs)
    });
  }catch{return {state:"unavailable",reason:"management_network_unavailable",billable:false,rows:[]};}
  if(!response?.ok){
    const reason=response?.status===429?"management_rate_limited":
      response?.status===401||response?.status===403?"management_permission_denied":"management_error";
    return {state:"unavailable",reason,billable:false,rows:[]};
  }
  let body;
  try{body=await response.json();}catch{return {state:"unavailable",reason:"management_invalid_response",billable:false,rows:[]};}
  if(!body||!Array.isArray(body.result)||body.result.length>400)
    return {state:"unavailable",reason:"management_invalid_response",billable:false,rows:[]};
  const rows=[];
  for(const row of body.result){
    if(typeof row?.timestamp!=="string"||!Number.isFinite(Date.parse(row.timestamp))||
        !API_COUNT_METRICS.every(k=>validCount(row[k])))
      return {state:"unavailable",reason:"management_invalid_response",billable:false,rows:[]};
    rows.push({timestamp:row.timestamp,...Object.fromEntries(API_COUNT_METRICS.map(k=>[k,row[k]]))});
  }
  return {
    state:"available",source:"supabase_management_project_usage_api_counts",
    billingCoverage:"none",billable:false,officialBillingConnected:false,
    note:"Management API project request analytics; excludes billable organization-wide Edge Invocations/Egress.",
    rows
  };
}
