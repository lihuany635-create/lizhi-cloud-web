"use strict";
// Durable staging PostgreSQL leases. Requires server-verified owner identity.
// Claim uses row locks + SKIP LOCKED; heartbeat and publish are fenced by a
// random lease token so a crashed/expired worker cannot complete stale work.
const crypto=require("node:crypto");
class CadLeaseError extends Error{constructor(code,message){super(message);this.name="CadLeaseError";this.code=code;}}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY=/^[0-9a-f]{64}$/;
const WORKER=/^[a-zA-Z0-9_-]{1,128}$/;
function createPostgresLeaseManager({db,ownerId}={}){
 if(!db||typeof db.connect!=="function"||typeof db.query!=="function"||!UUID.test(ownerId||""))
  throw new CadLeaseError("CAD_LEASE_CONFIG_INVALID","DB pool and authenticated owner required");
 const validate=(workerId,leaseSeconds)=>{
  if(typeof workerId!=="string"||!WORKER.test(workerId))throw new CadLeaseError("CAD_WORKER_INVALID","Invalid worker ID");
  if(!Number.isSafeInteger(leaseSeconds)||leaseSeconds<5||leaseSeconds>300)throw new CadLeaseError("CAD_LEASE_DURATION_INVALID","Lease must be 5 to 300 seconds");
 };
 async function claimNext({workerId,leaseSeconds=60}={}){
  validate(workerId,leaseSeconds);
  const client=await db.connect();let active=false;
  try{
   await client.query("BEGIN");active=true;
   const rows=await client.query(
    "SELECT idempotency_key,job_data FROM public.lizhi_cad_cloud_jobs WHERE owner_id=$1::uuid AND (job_data->>'status'='queued' OR (job_data->>'status' IN ('claimed','running') AND (lease_until IS NULL OR lease_until<=now()))) ORDER BY created_at,idempotency_key LIMIT 1 FOR UPDATE SKIP LOCKED",
    [ownerId]
   );
   if(rows.rowCount===0){await client.query("COMMIT");active=false;return null;}
   const prior=rows.rows[0].job_data,key=rows.rows[0].idempotency_key,token=crypto.randomUUID();
   const next={...prior,status:"claimed",worker_id:workerId,attempt:(prior.attempt||0)+1,lease_token:token,output_revision:null};
   const changed=await client.query(
    "UPDATE public.lizhi_cad_cloud_jobs SET job_data=$3::jsonb, lease_until=now()+($4::int*interval '1 second'), updated_at=now() WHERE owner_id=$1::uuid AND idempotency_key=$2 RETURNING lease_until",
    [ownerId,key,JSON.stringify(next),leaseSeconds]
   );
   if(changed.rowCount!==1)throw new CadLeaseError("CAD_CLAIM_CONFLICT","Claim disappeared");
   await client.query("COMMIT");active=false;
   return Object.freeze({job:next,lease_token:token,lease_until:changed.rows[0].lease_until});
  }catch(e){if(active)await client.query("ROLLBACK");throw e;}finally{client.release();}
 }
 async function heartbeat({jobKey,workerId,leaseToken,leaseSeconds=60}={}){
  validate(workerId,leaseSeconds);
  if(typeof jobKey!=="string"||!KEY.test(jobKey)||typeof leaseToken!=="string"||!UUID.test(leaseToken))
   throw new CadLeaseError("CAD_LEASE_INVALID","Invalid lease identity");
  const row=await db.query(
   "UPDATE public.lizhi_cad_cloud_jobs SET lease_until=now()+($5::int*interval '1 second'),updated_at=now() WHERE owner_id=$1::uuid AND idempotency_key=$2 AND job_data->>'worker_id'=$3 AND job_data->>'lease_token'=$4 AND job_data->>'status' IN ('claimed','running') AND lease_until>now() RETURNING lease_until",
   [ownerId,jobKey,workerId,leaseToken,leaseSeconds]
  );
  if(row.rowCount!==1)throw new CadLeaseError("CAD_LEASE_LOST","Lease expired or belongs to another worker");
  return row.rows[0].lease_until;
 }
 return Object.freeze({claimNext,heartbeat});
}
module.exports=Object.freeze({createPostgresLeaseManager,CadLeaseError});
