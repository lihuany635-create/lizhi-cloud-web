"use strict";
// Staging OAuth client grants. Do not infer CAD permission from JWT user_metadata,
// or from "authenticated" alone. Caller must pass a verified userId/client_id.
class CadAclError extends Error {
 constructor(code,message){super(message);this.name="CadAclError";this.code=code;}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE=/^[A-Za-z0-9_-]{1,128}$/;
const CLIENT=/^[A-Za-z0-9_.:-]{1,256}$/;
const SQL="SELECT can_write FROM public.lizhi_cad_oauth_project_grants WHERE owner_id=$1::uuid AND project_id=$2 AND oauth_client_id=$3 AND revoked_at IS NULL";
function createCadOauthAcl({db}={}){
 if(!db||typeof db.query!=="function")throw new CadAclError("CAD_ACL_DB_REQUIRED","Trusted DB connection required");
 async function authorizeDrawing({ownerId,projectId,drawingId,action,mode,clientId}={}){
  if(typeof ownerId!=="string"||!UUID.test(ownerId)||typeof projectId!=="string"||!SAFE.test(projectId)||
     typeof drawingId!=="string"||!SAFE.test(drawingId)||typeof clientId!=="string"||!CLIENT.test(clientId))
   return false; // Fail closed for normal user JWTs lacking OAuth client_id.
  const intent=action??mode;
  if(!["create","modify","read","write"].includes(intent))return false;
  const row=await db.query(SQL,[ownerId,projectId,clientId]);
  if(row.rowCount!==1)return false;
  const canWrite=row.rows[0].can_write===true;
  return intent==="read"||canWrite;
 }
 return Object.freeze({authorizeDrawing});
}
module.exports=Object.freeze({createCadOauthAcl,CadAclError,SQL});
