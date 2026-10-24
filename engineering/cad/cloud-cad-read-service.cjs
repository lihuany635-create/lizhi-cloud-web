"use strict";
// Private CAD reading for authenticated MCP users. Returned lists omit object
// storage keys; preview is verified PNG bytes only, bounded to 1 MiB.
const crypto=require("node:crypto");
class CadReadError extends Error { constructor(code,message){super(message);this.name="CadReadError";this.code=code;} }
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const HASH=/^[0-9a-f]{64}$/;
const PNG_MAGIC=Buffer.from([137,80,78,71,13,10,26,10]);
function createCadReadService({db,authorizeDrawing,objects,maxPreviewBytes=1024*1024}={}){
 if(!db||typeof db.query!=="function"||typeof authorizeDrawing!=="function"||
    !objects||typeof objects.get!=="function"||!Number.isSafeInteger(maxPreviewBytes)||maxPreviewBytes<24||maxPreviewBytes>4*1024*1024)
  throw new CadReadError("CAD_READ_CONFIG_INVALID","Verified store and authorization required");
 async function permitted(userId,projectId,drawingId,clientId){
  if(!UUID.test(userId||"")||!ID.test(projectId||"")||!ID.test(drawingId||"")||
     typeof clientId!=="string"||clientId.length<1||clientId.length>256)
   throw new CadReadError("CAD_READ_INVALID","Invalid CAD project identity");
  const allowed=await authorizeDrawing({ownerId:userId,projectId,drawingId,action:"read",clientId});
  if(allowed!==true)throw new CadReadError("CAD_ACCESS_DENIED","CAD project read denied");
 }
 async function list(userId,{projectId,drawingId,limit=25}={},context={}){
  await permitted(userId,projectId,drawingId,context.clientId);
  if(!Number.isSafeInteger(limit)||limit<1||limit>50)
   throw new CadReadError("CAD_READ_LIMIT_INVALID","Limit must be 1-50");
  const rows=await db.query(
   "SELECT r.revision,r.artifacts,r.inspection,r.created_at FROM public.lizhi_cad_cloud_object_revisions r JOIN public.lizhi_cad_cloud_drawings d ON d.owner_id=r.owner_id AND d.drawing_id=r.drawing_id WHERE r.owner_id=$1::uuid AND d.project_id=$2 AND r.drawing_id=$3 ORDER BY r.revision DESC LIMIT $4",
   [userId,projectId,drawingId,limit]
  );
  return Object.freeze({project_id:projectId,drawing_id:drawingId,revisions:rows.rows.map(row=>Object.freeze({
   revision:Number(row.revision),
   formats:["dxf","svg","png"].filter(f=>row.artifacts?.[f]&&HASH.test(row.artifacts[f].sha256||"")),
   entity_count:Number.isSafeInteger(row.inspection?.entityCount)?row.inspection.entityCount:null,
   extents:Array.isArray(row.inspection?.extents)?row.inspection.extents:null,
   created_at:row.created_at
  }))});
 }
 async function preview(userId,{projectId,drawingId,revision}={},context={}){
  await permitted(userId,projectId,drawingId,context.clientId);
  if(!Number.isSafeInteger(revision)||revision<1||revision>2147483647)
   throw new CadReadError("CAD_REVISION_INVALID","Valid published revision is required");
  const r=await db.query(
   "SELECT r.job_key,r.artifacts,d.project_id FROM public.lizhi_cad_cloud_object_revisions r JOIN public.lizhi_cad_cloud_drawings d ON d.owner_id=r.owner_id AND d.drawing_id=r.drawing_id WHERE r.owner_id=$1::uuid AND r.drawing_id=$2 AND r.revision=$3",
   [userId,drawingId,revision]
  );
  if(r.rowCount!==1||r.rows[0].project_id!==projectId)
   throw new CadReadError("CAD_REVISION_NOT_FOUND","Revision unavailable");
  const entry=r.rows[0].artifacts?.png;
  if(!entry||!HASH.test(entry.sha256||"")||!Number.isSafeInteger(entry.byte_size)||entry.byte_size>maxPreviewBytes)
   throw new CadReadError("CAD_PREVIEW_NOT_AVAILABLE","PNG preview missing or too large");
  const file=await objects.get({
   ownerId:userId,projectId,drawingId,revision,format:"png",
   jobKey:r.rows[0].job_key,expectedSha256:entry.sha256
  });
  const bytes=file?.bytes;
  if(!Buffer.isBuffer(bytes)||bytes.length!==entry.byte_size||
     bytes.length<24||!bytes.subarray(0,8).equals(PNG_MAGIC)||
     bytes.toString("ascii",12,16)!=="IHDR"||
     crypto.createHash("sha256").update(bytes).digest("hex")!==entry.sha256)
   throw new CadReadError("CAD_PREVIEW_INTEGRITY_FAILED","Preview digest invalid");
  return Object.freeze({revision,drawing_id:drawingId,mime_type:"image/png",
   sha256:entry.sha256,bytes});
 }
 return Object.freeze({list,preview});
}
module.exports=Object.freeze({createCadReadService,CadReadError});
