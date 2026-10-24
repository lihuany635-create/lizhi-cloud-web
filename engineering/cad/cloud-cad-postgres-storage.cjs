"use strict";
// Staging PostgreSQL adapter; ownerId must come from verified server authentication.
// A query-capable pool/client is injected: database credentials never appear here.
class CadPostgresStorageError extends Error {
 constructor(code,message){super(message);this.name="CadPostgresStorageError";this.code=code;}
}
const SQL=Object.freeze({
 insert:"INSERT INTO lizhi_cad_cloud_jobs (owner_id, idempotency_key, job_data) VALUES ($1::uuid, $2, $3::jsonb) ON CONFLICT (owner_id, idempotency_key) DO NOTHING RETURNING idempotency_key",
 get:"SELECT job_data FROM lizhi_cad_cloud_jobs WHERE owner_id = $1::uuid AND idempotency_key = $2",
 cas:"UPDATE lizhi_cad_cloud_jobs SET job_data = $4::jsonb, updated_at = now() WHERE owner_id = $1::uuid AND idempotency_key = $2 AND job_data = $3::jsonb RETURNING idempotency_key"
});
function createPostgresStorage({db,ownerId}={}){
 if(!db||typeof db.query!=="function")throw new CadPostgresStorageError("CAD_DB_REQUIRED","A database query port is required");
 if(typeof ownerId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId))throw new CadPostgresStorageError("CAD_OWNER_INVALID","A verified owner UUID is required");
 function validKey(key){if(typeof key!=="string"||!/^[0-9a-f]{64}$/.test(key))throw new CadPostgresStorageError("CAD_KEY_INVALID","Invalid CAD job key");}
 async function insertIfAbsent(key,job){
  validKey(key);
  if(!job||job.idempotency_key!==key||job.status!=="queued")throw new CadPostgresStorageError("CAD_JOB_INVALID","Invalid initial job");
  const result=await db.query(SQL.insert,[ownerId,key,JSON.stringify(job)]);
  return result.rowCount===1;
 }
 async function get(key){
  validKey(key);
  const result=await db.query(SQL.get,[ownerId,key]);
  return result.rows?.[0]?.job_data??null;
 }
 async function compareAndSwap(key,expected,next){
  validKey(key);
  if(!expected||!next||expected.idempotency_key!==key||next.idempotency_key!==key)throw new CadPostgresStorageError("CAD_JOB_INVALID","Cannot swap another job");
  const result=await db.query(SQL.cas,[ownerId,key,JSON.stringify(expected),JSON.stringify(next)]);
  return result.rowCount===1;
 }
 return Object.freeze({insertIfAbsent,get,compareAndSwap});
}
module.exports=Object.freeze({createPostgresStorage,CadPostgresStorageError,SQL});
