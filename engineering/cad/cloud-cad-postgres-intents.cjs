"use strict";
// Durable, owner-scoped prepared export contract. Requires separately trusted
// PostgreSQL credentials and verified owner UUID; never callable directly by browser.
class CadIntentStorageError extends Error{constructor(code,message){super(message);this.name="CadIntentStorageError";this.code=code;}}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH=/^[0-9a-f]{64}$/;
const SQL=Object.freeze({
 insert:"INSERT INTO public.lizhi_cad_cloud_intents (owner_id, cloud_job_key, prepared_job) VALUES ($1::uuid,$2,$3::jsonb) ON CONFLICT (owner_id, cloud_job_key) DO NOTHING RETURNING cloud_job_key",
 get:"SELECT prepared_job FROM public.lizhi_cad_cloud_intents WHERE owner_id=$1::uuid AND cloud_job_key=$2"
});
function createCadPostgresIntents({db}={}){
 if(!db||typeof db.query!=="function")throw new CadIntentStorageError("CAD_DB_REQUIRED","Postgres query port required");
 const checked=(ownerId,key)=>{
  if(typeof ownerId!=="string"||!UUID.test(ownerId))throw new CadIntentStorageError("CAD_OWNER_INVALID","Verified user UUID required");
  if(typeof key!=="string"||!HASH.test(key))throw new CadIntentStorageError("CAD_KEY_INVALID","Invalid cloud job key");
 };
 async function get({ownerId,key}={}){
  checked(ownerId,key);
  const rows=await db.query(SQL.get,[ownerId,key]);
  return rows.rows?.[0]?.prepared_job??null;
 }
 async function putIfAbsent({ownerId,key,value}={}){
  checked(ownerId,key);
  if(!value||value.cloud_job_key!==key||value.status!=="prepared_not_executed"||typeof value.job_key!=="string"||!HASH.test(value.job_key)||typeof value.script!=="string"||value.script.length>300000)
   throw new CadIntentStorageError("CAD_INTENT_INVALID","Invalid compiled CAD intent");
  const saved=await db.query(SQL.insert,[ownerId,key,JSON.stringify(value)]);
  if(saved.rowCount===1)return value;
  const previous=await get({ownerId,key});
  if(!previous)throw new CadIntentStorageError("CAD_INTENT_RACE","Intents changed concurrently");
  if(previous.job_key!==value.job_key)throw new CadIntentStorageError("CAD_INTENT_CONFLICT","Duplicate request with changed CAD geometry");
  return previous;
 }
 return Object.freeze({putIfAbsent,get});
}
module.exports=Object.freeze({CadIntentStorageError,createCadPostgresIntents,SQL});
