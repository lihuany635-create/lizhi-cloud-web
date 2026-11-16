// Candidate *external* gateway core, deliberately NOT deployed to Supabase.
// A deployed gateway must supply: trusted identity, a fresh VERIFIED official
// billing snapshot, and a distributed atomic reserveIfWithin implementation.
// This module cannot prevent bypass of old direct Supabase URLs on its own.
import {budgetDecision} from "./budget-policy.mjs";
export class GatewayDenied extends Error {
  constructor(reason,status=429){super(reason);this.reason=reason;this.status=status;}
}
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const routeName=x=>typeof x==="string"&&/^[a-zA-Z0-9_.:/-]{1,120}$/.test(x);
/**
 * @param {object} options
 * @param {string} options.verifiedPrincipal Owner principal verified by trusted middleware, not client input
 * @param {string} options.expectedPrincipal Server-only principal allowlist
 * @param {string} options.route Fixed route from a server-side table, never URL query
 * @param {Record<string, {category:string,cost:number}>} options.routePolicy Immutable server route map
 * @param {{source:string,scope:string,asOf:string,cycleStart:string,cycleEnd:string,metric:string,used:number,limit:number}|null} options.official
 * @param {{reserveIfWithin:(options:{key:string,amount:number,maxTotal:number,expireAt:string})=>Promise<boolean>}} options.atomicStore
 * @param {Date} [options.now]
 */
export async function authorizeBeforeSupabase({
  verifiedPrincipal,expectedPrincipal,route,routePolicy,
  official=null,atomicStore,now=new Date()
}){
  if(typeof expectedPrincipal!=="string"||expectedPrincipal.length<8||
    verifiedPrincipal!==expectedPrincipal)throw new GatewayDenied("principal_not_verified",403);
  if(!routeName(route)||!routePolicy||!Object.hasOwn(routePolicy,route))
    throw new GatewayDenied("route_not_allowlisted",403);
  const policy=routePolicy[route];
  if(!["optional","background","critical"].includes(policy?.category)||!integer(policy?.cost)||policy.cost===0)
    throw new GatewayDenied("invalid_route_policy");
  if(policy.category==="critical"){
    // Critical recovery exceptions must be explicitly *server-configured* and
    // never derived from user headers. They remain nonzero-cost.
    return {action:"critical_recovery",protected:false,reason:"trusted_recovery_route_only"};
  }
  if(official?.source!=="supabase_dashboard_manual"&&official?.source!=="management_api_verified")
    throw new GatewayDenied("official_usage_unavailable");
  if(official.scope!=="organization"||
    !["edge_invocations","egress_uncached","egress_cached","realtime_messages"].includes(official.metric)||
    !integer(official.used)||!integer(official.limit)||official.limit===0||
    !Number.isFinite(Date.parse(official.asOf))||
    !Number.isFinite(Date.parse(official.cycleStart))||
    !Number.isFinite(Date.parse(official.cycleEnd))||
    !(new Date(official.cycleStart)<=new Date(official.asOf))||
    !(new Date(official.asOf)<new Date(official.cycleEnd))||
    !(new Date(official.cycleStart)<=now&&now<new Date(official.cycleEnd)))
      throw new GatewayDenied("official_usage_invalid");
  if(Date.parse(official.asOf)>now.getTime())throw new GatewayDenied("official_usage_invalid");
  const ageMinutes=(now.getTime()-Date.parse(official.asOf))/60000;
  const proposed=budgetDecision({
    limit:official.limit,officialUsed:official.used,officialAgeMinutes:ageMinutes,
    observedUsed:null,projectedAdditional:policy.cost,category:policy.category
  });
  if(proposed.action==="block")throw new GatewayDenied(proposed.reason);
  if(proposed.action!=="allow"&&proposed.action!=="warn")throw new GatewayDenied("invalid_budget_decision");
  if(!atomicStore||typeof atomicStore.reserveIfWithin!=="function")
    throw new GatewayDenied("atomic_store_unavailable");
  const stop=0.95;
  const capacity=Math.max(0,Math.floor(official.limit*stop)-official.used);
  const key="lz-gate:"+official.metric+":"+official.cycleStart+":"+official.cycleEnd;
  let reserved=false;
  try{
    reserved=await atomicStore.reserveIfWithin({
      key,amount:policy.cost,maxTotal:capacity,expireAt:official.cycleEnd
    });
  }catch{throw new GatewayDenied("atomic_store_unavailable");}
  if(!reserved)throw new GatewayDenied("atomic_reservation_exhausted");
  return {action:proposed.action,protected:true,reason:proposed.reason,
    estimatedCost:policy.cost,quotaMetric:official.metric};
}
