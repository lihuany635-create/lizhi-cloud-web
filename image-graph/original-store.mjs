import {dataBytes,hash,stable,uid} from './core.mjs';
import {projectVersions,importedProject} from './project-store.mjs?v=26';
import {validateAssetFolders} from './asset-folders.mjs';
import {allProjectRuns,validateTaskCollections} from './task-actions.mjs';
import {readReturnedImage} from './returned-images.mjs?v=25';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const EXT={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
export const directoryProject=p=>p?.image_storage?.mode==='directory';
export const imagePreview=v=>v?.thumbnail||v?.data||'';
export const projectImageLimit=(p,fallback)=>directoryProject(p)||p?.versions?.some(v=>v.fs_ref)||(p?.runs||[]).some(r=>(r.outputs||[]).some(o=>o.version?.fs_ref))?Infinity:fallback;
const fail=(message,code='original_storage')=>Object.assign(new Error(message),{code});
export function originalPath(v){
 if(!v||!EXT[v.mime]||!/^[a-f0-9]{64}$/.test(v.sha256)||!Number.isSafeInteger(v.byte_size)||v.byte_size<1||v.byte_size>10*1024*1024)throw fail('原圖索引無效');
 return '映構原圖/'+v.sha256.slice(0,2)+'/'+v.sha256+'.'+EXT[v.mime];
}
// Recovery copies use a new immutable location. The old file is never replaced.
function recoveryPath(v,recoveryId){
 if(!UUID.test(recoveryId||''))throw fail('復原識別碼無效');
 return originalPath(v).replace(/\.(png|jpg|webp)$/,'.復原-'+recoveryId+'.$1');
}
export function originalLocation(v){
 const expected=v.disk_ref?.recovery_id!==undefined?recoveryPath(v,v.disk_ref.recovery_id):originalPath(v);
 if(v.disk_ref?.path!==expected)throw fail('找不到有效原圖索引：'+v.name);
 return expected;
}
function integrityFailure(v,actualBytes,actualHash=null){
 const kind=actualBytes!==v.byte_size?'檔案大小不符':'檔案內容雜湊不符';
 return Object.assign(fail('原圖核對不符（'+kind+'）：'+v.name,'original_integrity'),{version_id:v.id,file_name:v.name,expected_bytes:v.byte_size,actual_bytes:actualBytes,expected_sha256:v.sha256,actual_sha256:actualHash,path:v.disk_ref?.path||originalPath(v)});
}
async function parentAt(root,path,create=false){
 const parts=path.split('/');let current=root;
 for(const part of parts.slice(0,-1)){if(!part||part==='.'||part==='..'||part.includes('\\'))throw fail('原圖路徑無效');current=await current.getDirectoryHandle(part,{create})}
 return {parent:current,name:parts.at(-1)};
}
async function permission(root,mode='readwrite'){
 if(!root||root.kind!=='directory')throw fail('請在「原圖儲存位置」重新連接原資料夾','original_permission');
 if(await root.queryPermission({mode})!=='granted')throw fail('原圖資料夾需要授權，請按「原圖儲存位置」重新連接','original_permission');
}
async function verified(bytes,v){if(bytes.byteLength!==v.byte_size)throw integrityFailure(v,bytes.byteLength);const sha=await hash(bytes);if(sha!==v.sha256)throw integrityFailure(v,bytes.byteLength,sha);return new Uint8Array(bytes)}
// Re-resolve descendants from the selected root on a transient missing handle.
// Never retry integrity/permission errors or replace a nonempty conflicting file.
async function retryMissing(operation){
 for(let attempt=0;;attempt++){
  try{return await operation()}
  catch(e){if(e.name!=='NotFoundError'||attempt===2)throw e;await new Promise(resolve=>setTimeout(resolve,80*(attempt+1)))}
 }
}
export async function writeOriginalFile(root,path,bytes,sha){
 let phase='建立子資料夾';
 try{await retryMissing(async()=>{
  phase='建立子資料夾';const {parent,name}=await parentAt(root,path,true);let handle;
  phase='建立或開啟檔案';handle=await parent.getFileHandle(name,{create:true});
  phase='讀取既有檔案';const old=await handle.getFile();
  if(old.size){if(old.size!==bytes.length||await hash(await old.arrayBuffer())!==sha)throw fail('資料夾已有同名但內容不同的檔案，已保留原檔：'+name,'original_integrity');return}
  phase='開啟寫入';const stream=await handle.createWritable();
  try{phase='寫入檔案';await stream.write(bytes);phase='完成寫入';await stream.close()}
  catch(e){try{await stream.abort()}catch{}throw e}
  // Some providers invalidate a handle after close. Reopen by path and verify
  // the committed bytes, never just the old handle or a thumbnail.
  phase='讀回核對';const savedParent=await parentAt(root,path);
  const saved=await (await savedParent.parent.getFileHandle(savedParent.name)).getFile();
  if(saved.size!==bytes.length||await hash(await saved.arrayBuffer())!==sha)throw fail('寫入後讀回驗證失敗：'+name,'original_integrity');
 })}catch(e){
  if(e.code==='original_integrity')throw e;
  const reasons={NotFoundError:'系統找不到資料夾或檔案。請重新選擇裝置內部儲存空間中實際存在的資料夾；若仍失敗，請換一個資料夾。',NotAllowedError:'資料夾授權已失效，請重新授權。',SecurityError:'瀏覽器未允許存取這個資料夾，請重新選擇並授權。',QuotaExceededError:'裝置可用儲存空間不足。',NoModificationAllowedError:'資料夾無法寫入，請確認沒有被其他程式占用。'};
  throw Object.assign(fail(phase+'失敗（'+path+'）：'+(reasons[e.name]||e.message),'original_io'),{cause:e,operation:phase,path});
 }
}
export function createOriginalStore({getStore,makeThumbnail,sourceFolders=null,readReturned=readReturnedImage}){
 const roots=new Map();
 const settingKey=key=>'originalFolder:'+key;
 async function rootFor(project,mode='readwrite'){
  const key=project.image_storage?.key;if(!UUID.test(key||''))throw fail('原圖資料夾設定遺失，請重新連接','original_permission');
  let root=roots.get(key);if(!root){root=await getStore().getSetting(settingKey(key));if(root)roots.set(key,root)}await permission(root,mode);return root;
 }
 async function read(project,v,root=null){
  originalPath(v);
  if(v.fs_ref){try{if(!sourceFolders)throw fail('請連接來源圖片所在的資料夾','source_permission');const file=await sourceFolders.file(v.fs_ref);return await verified(await file.arrayBuffer(),v)}catch(e){if(!v.returned_ref||!['source_permission','source_missing','source_timeout'].includes(e.code)&&!['NotAllowedError','NotFoundError','SecurityError'].includes(e.name))throw e;return verified(await readReturned(v),v)}}
  if(v.data)return verified(dataBytes(v.data),v);
  if(v.returned_ref&&!v.disk_ref)return verified(await readReturned(v),v);
  originalLocation(v);
  const explicitRoot=root;
  try{
   root??=await rootFor(project,'read');await permission(root,'read');
   return await retryMissing(async()=>{const {parent,name}=await parentAt(root,v.disk_ref.path);const file=await (await parent.getFileHandle(name)).getFile();if(file.size!==v.byte_size)throw integrityFailure(v,file.size);return await verified(await file.arrayBuffer(),v)});
  }catch(e){
   if(!explicitRoot&&v.returned_ref&&(e.code==='original_permission'||['NotFoundError','NotAllowedError','SecurityError'].includes(e.name)))return verified(await readReturned(v),v);
   if(!explicitRoot&&sourceFolders?.current())try{const file=await sourceFolders.legacyFile(v);return await verified(await file.arrayBuffer(),v)}catch(sourceError){if(e.code==='original_permission'||e.name==='NotFoundError')throw sourceError}
   if(e.name==='NotFoundError')throw Object.assign(fail('原圖不存在，請連接原本的資料夾：'+v.name,'original_missing'),{version_id:v.id,file_name:v.name,path:v.disk_ref.path,expected_bytes:v.byte_size,actual_bytes:null,expected_sha256:v.sha256,actual_sha256:null});throw e;
  }
 }
 async function stage(project,v,targetRoot=null){
  const root=targetRoot||await rootFor(project),bytes=await read(project,v);await permission(root);
  const thumbnail=v.thumbnail||await makeThumbnail(new Blob([bytes],{type:v.mime}));
  if(typeof thumbnail!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(thumbnail)||thumbnail.length>180000)throw fail('無法建立縮圖，原圖尚未搬移：'+v.name);
  const path=originalPath(v);await writeOriginalFile(root,path,bytes,v.sha256);
  const copy={...v,thumbnail,disk_ref:{path}};delete copy.data;return copy;
 }
 async function saveIndex(project,root=null){
  if(!directoryProject(project)||projectVersions(project).some(v=>v.fs_ref||v.returned_ref))return null;root??=await rootFor(project);await permission(root);
  const copy=structuredClone(project);
  for(const v of projectVersions(copy)){if(v.data)throw fail('專案仍有未保存的原圖，已停止索引保存');originalLocation(v);delete v.thumbnail}
  const bytes=new TextEncoder().encode(stable({format:'yinggou-directory-project-v1',project:copy})),sha=await hash(bytes);
  const path='映構索引/'+project.id+'/專案-'+String(project.revision).padStart(8,'0')+'-'+sha+'.json';
  if(!UUID.test(project.id))throw fail('專案識別碼無效');
  await writeOriginalFile(root,path,bytes,sha);return {path,bytes};
 }
 async function migrate(project,root,{onProgress=()=>{}}={}){
  if(projectVersions(project).some(v=>v.fs_ref||v.returned_ref))throw fail('此專案已直接引用裝置檔案，請在圖片來源中切換資料夾');
  await permission(root);const sourceVersions=new Map(projectVersions(project).map(v=>[v.id,v]));
  const omit=v=>{const copy={...v};delete copy.data;return copy},runCopy=r=>({...r,outputs:r.outputs.map(o=>({...o,version:omit(o.version)}))});
  const copy=structuredClone({...project,versions:project.versions.map(omit),runs:project.runs.map(runCopy),task_trash:(project.task_trash||[]).map(e=>({...e,run:runCopy(e.run)}))}),versions=projectVersions(copy);let count=0;
  onProgress(0,versions.length);
  for(const v of versions){const saved=await stage(project,sourceVersions.get(v.id),root);Object.assign(v,saved);delete v.data;onProgress(++count,versions.length)}
  const key=uid();copy.image_storage={mode:'directory',key,folder_name:root.name};copy.revision++;copy.updated_at=new Date().toISOString();
  onProgress(count,versions.length,'正在保存並核對專案索引…');
  await saveIndex(copy,root);
  // Files and a recoverable index exist before the only commit that removes inline data.
  await getStore().setSetting(settingKey(key),root);await getStore().save(copy,true,{expectedStorageKey:project.image_storage?.key||null,expectedRevision:project.revision});
  roots.set(key,root);return copy;
 }
 function uniqueVersions(project){return [...new Map(projectVersions(project).filter(v=>!v.fs_ref&&!v.returned_ref).map(v=>[originalLocation(v)+'|'+v.byte_size,v])).values()]}
 async function inspect(project,root,{onProgress=()=>{}}={}){
  await permission(root,'read');const versions=uniqueVersions(project),issues=[];let valid=0,done=0;
  onProgress(0,versions.length,'正在檢查原圖 0 / '+versions.length+' 份…');
  for(const v of versions){
   try{await read(project,v,root);valid++}
   catch(e){if(!['original_integrity','original_missing'].includes(e.code))throw e;issues.push({code:e.code,message:e.message,version_id:v.id,name:v.name,path:e.path,expected_bytes:e.expected_bytes,actual_bytes:e.actual_bytes,expected_sha256:e.expected_sha256,actual_sha256:e.actual_sha256})}
   onProgress(++done,versions.length,'正在檢查原圖 '+done+' / '+versions.length+' 份…');
  }
  return {total:versions.length,valid,issues};
 }
 function checkFailure(report,prefix='原圖連接未完成'){
  return Object.assign(fail(prefix+'：'+report.issues.length+' 份未通過核對。'+report.issues.slice(0,3).map(x=>x.message).join('；')+(report.issues.length>3?'；其餘請查看下方清單':''),'original_check'),{report});
 }
 async function reconnect(project,root,{onProgress=()=>{}}={}){
  const report=await inspect(project,root,{onProgress});if(report.issues.length)throw checkFailure(report);
  await saveIndex(project,root);await getStore().setSetting(settingKey(project.image_storage.key),root);roots.set(project.image_storage.key,root);return report;
 }
 async function repair(project,root,files,{onProgress=()=>{}}={}){
  if(!directoryProject(project))throw fail('請先使用資料夾模式');
  await permission(root);const report=await inspect(project,root,{onProgress});
  if(!report.issues.length)throw fail('原圖已全部通過核對，無需復原');
  files=Array.from(files);if(!files.length||files.length>500)throw fail('請一次選擇 1～500 張原始圖片');
  const sizes=new Set(report.issues.map(x=>x.expected_bytes)),matches=new Map(),needed=new Set(report.issues.map(x=>x.expected_sha256+'|'+x.expected_bytes));
  // Match by the exact original hash, never by filename or visual similarity.
  // Keep File references rather than all original byte buffers in memory.
  for(let i=0;i<files.length;i++){
   const file=files[i];onProgress(i,files.length,'正在比對選入的原始圖片 '+(i+1)+' / '+files.length+'…');
   if(!sizes.has(file.size)||file.size>10*1024*1024)continue;
   const bytes=await file.arrayBuffer(),key=await hash(bytes)+'|'+bytes.byteLength;
   if(needed.has(key)&&bytes.byteLength===file.size)matches.set(key,file);
  }
  const remaining=report.issues.filter(x=>!matches.has(x.expected_sha256+'|'+x.expected_bytes));
  if(remaining.length)throw checkFailure(report,'所選圖片未完全符合原始紀錄，尚缺 '+remaining.length+' 份（'+remaining.slice(0,3).map(x=>x.name).join('、')+'）；未變更專案');
  const copy=structuredClone(project),versions=projectVersions(copy),restored=new Map();let done=0;
  for(const issue of report.issues){
   const v=versions.find(v=>v.id===issue.version_id),key=v.sha256+'|'+v.byte_size+'|'+v.mime;
   if(!restored.has(key)){
    const bytes=await verified(await matches.get(v.sha256+'|'+v.byte_size).arrayBuffer(),v),recovery_id=uid(),path=recoveryPath(v,recovery_id);
    await writeOriginalFile(root,path,bytes,v.sha256);restored.set(key,{path,recovery_id});
   }
   onProgress(++done,report.issues.length,'正在另存並核對復原原圖 '+done+' / '+report.issues.length+' 份…');
  }
  for(const v of versions){if(v.fs_ref)continue;const ref=restored.get(v.sha256+'|'+v.byte_size+'|'+v.mime);if(ref)v.disk_ref={...ref}}
  // Every original, including candidates and trash, must validate in this folder
  // before committing a new binding. Wrong/partial folders never replace it.
  const checked=await inspect(copy,root,{onProgress});if(checked.issues.length)throw checkFailure(checked,'復原後仍有原圖未通過核對，未變更專案');
  const key=uid();copy.image_storage={mode:'directory',key,folder_name:root.name};copy.revision++;copy.updated_at=new Date().toISOString();
  await saveIndex(copy,root);await getStore().setSetting(settingKey(key),root);await getStore().save(copy,true,{expectedStorageKey:project.image_storage.key,expectedRevision:project.revision});roots.set(key,root);
  return {project:copy,repaired:restored.size};
 }
 async function relocate(project,target,{sourceRoot=null,onProgress=()=>{}}={}){
  if(!directoryProject(project))throw fail('請先使用資料夾模式');
  if(projectVersions(project).some(v=>v.fs_ref||v.returned_ref))throw fail('直接引用的檔案保持原位置，請在圖片來源中切換資料夾');
  let phase='source';
  try{
   const source=sourceRoot||await rootFor(project,'read');await permission(source,'read');phase='target';await permission(target);
   if(source===target||typeof source.isSameEntry==='function'&&await source.isSameEntry(target))throw fail('新位置與目前位置相同，請選擇另一個資料夾','original_same_folder');
   if(typeof source.resolve==='function'&&await source.resolve(target)!==null)throw fail('新位置位於原資料夾裡，請選擇原資料夾外的位置，避免日後刪除舊資料夾時連同新位置一起刪除','original_nested_folder');
   phase='source';const preflight=await inspect(project,source,{onProgress:(done,total)=>onProgress(done,total,'搬移前檢查原圖 '+done+' / '+total+' 份…')});
   if(preflight.issues.length)throw checkFailure(preflight,'搬移前檢查未通過，請先復原原圖');
   const versions=uniqueVersions(project);let done=0;phase='target';
   for(const v of versions){
    // Read one verified original at a time. Source and destination paths stay
    // unchanged, including recovery copies and references in historical tasks.
    phase='source';const bytes=await read(project,v,source);phase='target';
    await writeOriginalFile(target,originalLocation(v),bytes,v.sha256);
    onProgress(++done,versions.length,'正在複製並核對新位置 '+done+' / '+versions.length+' 份…');
   }
   const copy=structuredClone(project),key=uid();
   copy.image_storage={mode:'directory',key,folder_name:target.name};copy.revision++;copy.updated_at=new Date().toISOString();
   const checked=await inspect(copy,target,{onProgress:(done,total)=>onProgress(done,total,'正在確認新位置全部原圖 '+done+' / '+total+' 份…')});
   if(checked.issues.length)throw checkFailure(checked,'新位置原圖核對未通過');
   onProgress(versions.length,versions.length,'正在保存並核對新位置的專案索引…');await saveIndex(copy,target);
   // New binding keeps other projects/copies on their existing folder. CAS in
   // save prevents a stale tab or concurrent edit from losing the new location.
   phase='commit';await getStore().setSetting(settingKey(key),target);
   await getStore().save(copy,true,{expectedStorageKey:project.image_storage.key,expectedRevision:project.revision});roots.set(key,target);
   return {project:copy,copied:versions.length};
  }catch(e){e.move_phase=phase;throw e}
 }
 async function importIndex(input,root){
  const source=await validateDirectoryIndex(input);await permission(root);const copy=importedProject(source,uid());copy.name=source.name+'（資料夾匯入）';
  // Verify all originals and rebuild only small previews before storing anything.
  for(const v of projectVersions(copy)){const bytes=await read(source,v,root);v.thumbnail=await makeThumbnail(new Blob([bytes],{type:v.mime}))}
  const key=uid();copy.image_storage={mode:'directory',key,folder_name:root.name};
  await saveIndex(copy,root);await getStore().setSetting(settingKey(key),root);await getStore().save(copy);roots.set(key,root);return copy;
 }
 return {read,stage,migrate,reconnect,inspect,repair,relocate,saveIndex,importIndex,rootFor};
}
export async function validateDirectoryIndex(input){
 const p=input?.project;
 if(input?.format!=='yinggou-directory-project-v1'||!p||!UUID.test(p.id)||!directoryProject(p))throw fail('不是映構的資料夾專案索引');
 for(const k of ['name','shot','instruction','preserve','changes','ratio'])if(typeof p[k]!=='string')throw fail('專案欄位損壞');
 for(const k of ['assets','versions','nodes','edges','runs'])if(!Array.isArray(p[k]))throw fail('專案清單損壞');
 if(!Number.isInteger(p.revision)||p.revision<0||!p.name.trim()||p.name.length>200)throw fail('專案修訂或名稱無效');
 validateAssetFolders(p);validateTaskCollections(p);
 for(const list of [p.assets,p.versions,p.edges])if(new Set(list.map(x=>x.id)).size!==list.length||list.some(x=>!UUID.test(x.id)))throw fail('專案識別碼無效或重複');
 for(const v of projectVersions(p)){if(!UUID.test(v.id)||v.data||typeof v.name!=='string')throw fail('原圖索引損壞');originalLocation(v);delete v.thumbnail}
 const ids=new Set(p.versions.map(v=>v.id)),nodes=new Set(p.nodes.map(n=>n.id));
 if(nodes.size!==p.nodes.length||p.nodes.filter(n=>n.id==='generation').length!==1)throw fail('畫布節點無效');
 for(const n of p.nodes)if(!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.x>1400||n.y<0||n.y>1300||(n.id!=='generation'&&(!UUID.test(n.id)||!ids.has(n.versionId))))throw fail('畫布節點損壞');
 for(const a of p.assets)if(!ids.has(a.currentVersionId)||typeof a.name!=='string')throw fail('素材資料損壞');
 for(const e of p.edges)if(!nodes.has(e.from)||e.from==='generation'||e.to!=='generation'||!['identity','scene','pose','composition','style','continuity'].includes(e.role)||!['subject','include','exclude','priority'].every(k=>typeof e[k]==='string'))throw fail('連線資料損壞');
 for(const run of allProjectRuns(p)){if(await hash(stable(run.spec))!==run.spec_hash||!Array.isArray(run.spec.references))throw fail('歷史快照損壞');for(const ref of run.spec.references){const v=p.versions.find(x=>x.id===ref.asset_version_id);if(!v||v.sha256!==ref.sha256)throw fail('歷史原圖遺失')}}
 return p;
}
