// Cloud-direct GLB viewer state. Same data flow as Production Workbench:
// ChatGPT -> private Site MCP -> this Edge -> owner-isolated Postgres RPC.
// NO iframe, browser session, WebGL claim, or mutation to canonical GLB.
const SITE_ID='appgprj_6ae0c336243881919e9ba2bbf450f1fb';
const MANIFEST='https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/current-models.json';
const ASSET_ROOT='https://lihuany635-create.github.io/lizhi-cloud-web/model-viewer/';
const HEX96=/^[a-f0-9]{96}$/,SHA=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
function failure(code){throw Error(code);}
function vec(v){if(!Array.isArray(v)||v.length!==3||v.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>10000))failure('INVALID_VECTOR');return v;}
function str(v,max=80){if(typeof v!=='string'||!v.trim()||v.length>max)failure('INVALID_STRING');return v.trim();}
function fields(o,allowed){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!allowed.includes(k)))failure('INVALID_ARGUMENTS');}
async function digest(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function rest(path,body){
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),base=Deno.env.get('SUPABASE_URL');
 if(!key||!base)failure('NOT_CONFIGURED');
 const res=await fetch(base+'/rest/v1/'+path,{method:body===undefined?'GET':'POST',redirect:'manual',
   headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json',accept:'application/json'},
   body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!res.ok)failure('DATABASE_OPERATION_FAILED');
 return await res.json();
}
const rpc=(name,body)=>rest('rpc/'+name,body);
async function listManifest(){
 const r=await fetch(MANIFEST,{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000)});
 if(!r.ok)failure('MODEL_MANIFEST_UNAVAILABLE');
 const j=await r.json();if(!Array.isArray(j.models))failure('MODEL_MANIFEST_INVALID');
 return j.models.filter(m=>typeof m.model==='string'&&SHA.test(m.current_sha256||''));
}
function nameKey(key){const v=key??'lahudi-academy';if(typeof v!=='string'||!/^[a-z0-9_-]{2,80}$/.test(v))failure('INVALID_MODEL_KEY');return v;}
async function modelOf(key,expected){
 const models=await listManifest(),m=models.find(x=>x.model===key+'.glb');
 if(!m)failure('MODEL_NOT_REGISTERED');
 if(expected!==undefined&&expected!==m.current_sha256)failure('MODEL_VERSION_CONFLICT');
 return m;
}
const empty=()=>({avatars:[],selected_id:null,camera:{mode:'free'},checkpoints:[]});
async function scene(owner,key,sha){
 const r=await rpc('lizhi_viewer_cloud_read',{p_owner:owner,p_model_key:key,p_model_sha:sha});
 if(!r?.ok||!Array.isArray(r.state?.avatars))failure('INVALID_CLOUD_SCENE');
 return r;
}
function validateCommon(a,write=false){
 fields(a,['model_key','model_sha','request_id','expected_revision','name','position','yaw','avatar_id','delta','mode','pitch','note','include_model_index','offset','limit','findings']);
 if(write){
  if(!UUID.test(a.request_id||''))failure('INVALID_REQUEST_ID');
  if(!Number.isSafeInteger(a.expected_revision)||a.expected_revision<0)failure('INVALID_REVISION');
  if(!SHA.test(a.model_sha||''))failure('MODEL_SHA_REQUIRED');
 }
}
function takeAvatar(state,id){const a=state.avatars.find(x=>x.id===id);if(!a)failure('AVATAR_NOT_FOUND');return a;}
function angle(n,min,max){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)failure('INVALID_ANGLE');return n;}
function put(state,name,a){
 if(name==='viewer_create_avatar'){
  const pos=vec(a.position),label=str(a.name,40);
  if(state.avatars.length>=100)failure('AVATAR_LIMIT_100');
  const item={id:crypto.randomUUID(),name:label,position:pos,yaw:a.yaw===undefined?0:angle(a.yaw,-7,7),pitch:0,mode:'first',surface_verified:false,collision_verified:false};
  state.avatars.push(item);state.selected_id=item.id;state.camera={mode:'first',avatar_id:item.id};return;
 }
 if(name==='viewer_select_avatar'){
  str(a.avatar_id,200);takeAvatar(state,a.avatar_id);state.selected_id=a.avatar_id;return;
 }
 if(name==='viewer_delete_avatar'){
  const old=takeAvatar(state,str(a.avatar_id,200));
  state.avatars=state.avatars.filter(x=>x.id!==old.id);
  if(state.selected_id===old.id){state.selected_id=state.avatars[0]?.id||null;state.camera={mode:'free'};}return;
 }
 if(name==='viewer_move_avatar'||name==='viewer_teleport_avatar'){
  const target=takeAvatar(state,str(a.avatar_id,200));
  const p=name==='viewer_move_avatar'?vec(a.delta):vec(a.position);
  if(name==='viewer_move_avatar'&&(Math.hypot(...p)>3||Math.hypot(...p)<.001||Math.abs(p[1])>.001))failure('MOVE_LIMIT_3M_HORIZONTAL');
  target.position=name==='viewer_move_avatar'?target.position.map((n,i)=>n+p[i]):p;
  vec(target.position);
  target.surface_verified=false;target.collision_verified=false;state.selected_id=target.id;return;
 }
 if(name==='viewer_set_camera'){
  const target=takeAvatar(state,str(a.avatar_id,200)),mode=a.mode;
  if(!['first','third','free','top'].includes(mode))failure('INVALID_CAMERA_MODE');
  target.mode=mode;if(a.yaw!==undefined)target.yaw=angle(a.yaw,-7,7);
  if(a.pitch!==undefined)target.pitch=angle(a.pitch,-1.35,1.35);
  state.selected_id=target.id;state.camera={mode,avatar_id:target.id};return;
 }
 if(name==='viewer_save_checkpoint'){
  const note=str(a.note??'巡查進度（尚無雲端實際畫面驗證）',2000);
  if(a.findings?.length)failure('REAL_SCREENSHOT_EVIDENCE_REQUIRED');
  if(state.checkpoints.length>=100)failure('CHECKPOINT_LIMIT_100');
  state.checkpoints.push({id:crypto.randomUUID(),at:new Date().toISOString(),note,avatars:structuredClone(state.avatars),visually_verified:false,unobserved_areas:'NOT_INSPECTED'});return;
 }
 failure('UNKNOWN_CLOUD_TOOL');
}
async function inspectGLB(key,sha,offset=0,limit=50){
 // Explicit real GLB binary load; geometry index is NOT raster rendering or collision test.
 const r=await fetch(ASSET_ROOT+key+'.glb',{redirect:'manual',signal:AbortSignal.timeout(20000)});
 if(!r.ok)failure('GLB_DOWNLOAD_FAILED');
 if(+(r.headers.get('content-length')||0)>35000000)failure('GLB_TOO_LARGE_FOR_EDGE');
 const bytes=await r.arrayBuffer();
 if(bytes.byteLength>35000000)failure('GLB_TOO_LARGE_FOR_EDGE');
 const actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==sha)failure('GLB_SHA_MISMATCH');
 const dv=new DataView(bytes);if(bytes.byteLength<20||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==bytes.byteLength||dv.getUint32(16,true)!==0x4e4f534a)failure('INVALID_GLB');
 const count=dv.getUint32(12,true);if(count+20>bytes.byteLength)failure('INVALID_GLB');
 const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,count)));
 const nodes=gltf.nodes||[];return {verified_glb_sha:actual,mesh_count:(gltf.meshes||[]).length,
   node_count:nodes.length,offset,has_more:offset+limit<nodes.length,
   nodes:nodes.slice(offset,offset+limit).map((n,i)=>({index:offset+i,name:n.name||'',mesh:n.mesh??null,translation:n.translation??null,scale:n.scale??null})),
   limitations:'GLB JSON node inventory only; no raycast, collision, visibility or rendered image validation'};
}
async function run(owner,name,a){
 if(name==='viewer_status'){
  const list=await rest('lizhi_viewer_cloud_scenes?owner_id=eq.'+encodeURIComponent(owner)+'&select=model_key,model_sha,revision,updated_at');
  return {ok:true,mode:'cloud_direct',requires_browser:false,requires_connection_button:false,cloud_rendering:false,geometry_collision:false,
   scenes:list,model_documents:'Existing canonical GitHub Pages GLBs; no parallel GLB store'};
 }
 if(name==='viewer_list_models'){
  const models=await listManifest();
  return {ok:true,models:models.map(m=>({key:m.model.slice(0,-4),model:m.model,version:m.version,current_sha256:m.current_sha256,author_full_item_approval:m.author_full_item_approval}))};
 }
 if(name==='viewer_get_screenshot')return {ok:false,code:'CLOUD_3D_RENDERER_NOT_IMPLEMENTED',real_screenshot:false,requires_browser:false};
 if(name==='viewer_stop')return {ok:true,mode:'cloud_direct',pending_operations:0,details:'No persistent browser session. Each cloud write is synchronous and atomic.'};
 const key=nameKey(a.model_key);const m=await modelOf(key,a.model_sha);
 if(name==='viewer_get_scene'||name==='viewer_list_avatars'){
  fields(a,['model_key','model_sha','include_model_index','offset','limit']);
  const row=await scene(owner,key,m.current_sha256);
  const answer={...row,mode:'cloud_direct',model_name:m.model,model_version:m.version,
   visually_inspected:false,collision_verified:false,unobserved_areas:'NOT_INSPECTED'};
  if(name==='viewer_list_avatars')return {ok:true,model_key:key,model_sha:m.current_sha256,revision:row.revision,avatars:row.state.avatars};
  if(a.include_model_index){
   const off=a.offset??0,limit=a.limit??50;
   if(!Number.isSafeInteger(off)||off<0||!Number.isSafeInteger(limit)||limit<1||limit>100)failure('INVALID_PAGINATION');
   answer.index=await inspectGLB(key,m.current_sha256,off,limit);
  }
  return answer;
 }
 const writeOps=['viewer_create_avatar','viewer_select_avatar','viewer_move_avatar','viewer_teleport_avatar','viewer_set_camera','viewer_save_checkpoint','viewer_delete_avatar'];
 if(!writeOps.includes(name))failure('UNKNOWN_CLOUD_TOOL');
 validateCommon(a,true);
 // A matching request returns the original result before checking revision.
 const fp=await digest(name+'|'+JSON.stringify(a));
 const existing=await rest('lizhi_viewer_cloud_requests?owner_id=eq.'+encodeURIComponent(owner)+'&request_id=eq.'+a.request_id+'&select=fingerprint,response');
 if(existing.length){
  if(existing[0].fingerprint!==fp)failure('REQUEST_ID_REUSED');
  return existing[0].response;
 }
 const current=await scene(owner,key,m.current_sha256);
 if(current.revision!==a.expected_revision)return {ok:false,code:'REVISION_CONFLICT',actual_revision:current.revision};
 const state=structuredClone(current.state);put(state,name,a);
 const result=await rpc('lizhi_viewer_cloud_write',{p_owner:owner,p_request:a.request_id,p_model_key:key,
  p_model_sha:m.current_sha256,p_expected_revision:a.expected_revision,p_fingerprint:fp,p_state:state});
 return {...result,mode:'cloud_direct',browser_required:false,visually_inspected:false,collision_verified:false,unobserved_areas:'NOT_INSPECTED'};
}
export async function handler(req){
 try{
  if(req.method!=='POST')return json({ok:false,code:'METHOD_NOT_ALLOWED'},405);
  if(req.headers.has('origin'))return json({ok:false,code:'SERVER_TO_SERVER_ONLY'},403);
  const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
  if(!HEX96.test(token))return json({ok:false,code:'UNAUTHORIZED'},401);
  const config=await rest('lizhi_viewer_config?site_id=eq.'+SITE_ID+'&select=token_hash');
  if(config.length!==1||config[0].token_hash!==await digest(token))return json({ok:false,code:'UNAUTHORIZED'},401);
  if(Number(req.headers.get('content-length')||0)>25000)return json({ok:false,code:'BODY_TOO_LARGE'},413);
  const raw=await req.text();if(raw.length>25000)return json({ok:false,code:'BODY_TOO_LARGE'},413);
  const b=JSON.parse(raw);
  if(b.kind!=='tool'||typeof b.name!=='string'||!b.name.startsWith('viewer_')||!b.args||typeof b.args!=='object')failure('INVALID_TOOL_CALL');
  const owner=b.owner;if(typeof owner!=='string'||!owner.startsWith(SITE_ID+':')||owner.length>200||owner.length<=SITE_ID.length+1)failure('OWNER_REQUIRED');
  return json(await run(owner,b.name,b.args));
 }catch(e){const code=/^[A-Z0-9_]{3,100}$/.test(e.message||'')?e.message:'VIEWER_CLOUD_ERROR';return json({ok:false,code},code==='UNAUTHORIZED'?401:400);}
}
Deno.serve(handler);
