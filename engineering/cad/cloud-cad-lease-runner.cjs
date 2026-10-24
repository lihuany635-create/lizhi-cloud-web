"use strict";
// Host-side lease heartbeat. This coordinator NEVER claims the job: pass a
// claim returned by the durable PostgreSQL lease manager. A failed heartbeat
// aborts CADCraft execution; fenced DB publication is still the final authority.
class CadLeaseRunnerError extends Error{
 constructor(code,message){super(message);this.name="CadLeaseRunnerError";this.code=code;}
}
const KEY=/^[a-f0-9]{64}$/;
const WORKER=/^[a-zA-Z0-9_-]{1,128}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function createLeasedCadRunner({
 leaseManager,worker,workerId,leaseSeconds=60,heartbeatIntervalMs=10000,
 schedule=(fn,ms)=>setInterval(fn,ms),
 unschedule=handle=>clearInterval(handle)
}={}){
 if(!leaseManager||typeof leaseManager.heartbeat!=="function"||!worker||typeof worker.runClaimed!=="function"||
    typeof workerId!=="string"||!WORKER.test(workerId)||!Number.isSafeInteger(leaseSeconds)||
    leaseSeconds<5||leaseSeconds>300||!Number.isSafeInteger(heartbeatIntervalMs)||
    heartbeatIntervalMs<10||heartbeatIntervalMs>leaseSeconds*500||
    typeof schedule!=="function"||typeof unschedule!=="function")
  throw new CadLeaseRunnerError("CAD_HEARTBEAT_CONFIG_INVALID","Invalid lease runner configuration");
 async function runClaim(claim){
  const key=claim?.job?.idempotency_key,token=claim?.lease_token;
  if(typeof key!=="string"||!KEY.test(key)||typeof token!=="string"||!UUID.test(token)||
     claim.job.worker_id!==workerId||claim.job.status!=="claimed"||claim.job.lease_token!==token)
   throw new CadLeaseRunnerError("CAD_HEARTBEAT_CLAIM_INVALID","Not a valid owned CAD claim");
  const controller=new AbortController();
  let stopped=false,lost=null,inFlight=null;
  const heartbeat=()=>{
   if(stopped||inFlight)return inFlight;
   const operation=Promise.resolve().then(()=>leaseManager.heartbeat({
    jobKey:key,workerId,leaseToken:token,leaseSeconds
   })).catch(error=>{
    if(!stopped){
     lost=error;
     controller.abort(error);
    }
   });
   inFlight=operation.finally(()=>{inFlight=null;});
   return inFlight;
  };
  // Validate lease before starting CADCraft; a host restart must not resurrect
  // an expired/stolen claim.
  await heartbeat();
  if(lost)throw lost;
  let handle;
  try{
   handle=schedule(()=>{void heartbeat();},heartbeatIntervalMs);
   // For standard Node interval handles, avoid keeping process alive solely for
   // the heartbeat. The CAD operation itself owns the process lifecycle.
   handle?.unref?.();
   // Worker sees the abort signal and must stop subprocess and refuse publish.
   // If durable DB publication completed just as a later heartbeat rejected,
   // the published success wins (DB is the single source of truth).
   return await worker.runClaimed(key,token,{signal:controller.signal});
  }finally{
   stopped=true;
   if(handle!==undefined)unschedule(handle);
   if(inFlight)await inFlight;
  }
 }
 return Object.freeze({runClaim});
}
module.exports=Object.freeze({CadLeaseRunnerError,createLeasedCadRunner});
