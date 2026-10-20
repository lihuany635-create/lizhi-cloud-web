import {assetFolders,assetFolderId,folderPath,validateAssetFolders} from './asset-folders.mjs';
import {dataBytes,hash,stable} from './core.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const EXT={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
export function deviceSyncError(code,message){const error=new Error(message);error.code=code;return error}
export function deviceSyncFailureKind(error){
 if(error.code==='permission'||['NotAllowedError','SecurityError'].includes(error.name))return 'permission';
 if(error.code==='conflict'||error.code==='integrity'||error.code==='invalid_data'||error.name==='TypeMismatchError')return 'blocked';
 if(error.name==='NotFoundError')return 'missing';
 return 'retry';
}
function id(value){if(typeof value!=='string'||!UUID.test(value))throw Error('裝置同步的識別碼無效');return value}
export function deviceFolderSupported(scope=globalThis){return !!scope.isSecureContext&&typeof scope.showDirectoryPicker==='function'}
export function safeDeviceName(value){
 let name=String(value??'').normalize('NFC').replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g,'_').replace(/[. ]+$/g,'').trim();
 if(!name||name==='.'||name==='..')name='未命名';
 if(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name))name='_'+name;
 return [...name].slice(0,30).join('');
}
export function deviceProjectDirectory(project){return '映構-'+id(project.id)}
function namedSegment(name,identity){return safeDeviceName(name)+'__'+id(identity)}

// This is an additive, one-way copy. Paths are immutable: a local edit is never
// overwritten, and removing an item from the workbench never deletes a device file.
export function deviceFolderPlan(project){
 id(project.id);validateAssetFolders(project);
 const folders=new Map(assetFolders(project).map(f=>[f.id,namedSegment(f.name,f.id)]));
 const directories=new Set(['素材','候選圖','同步紀錄']),files=[];
 const add=(path,version,extra)=>{
  if(!version||!EXT[version.mime]||!(typeof version.data==='string'&&version.data.startsWith('data:'+version.mime+';base64,')||version.disk_ref||version.fs_ref||version.returned_ref)||!/^([a-f0-9]{64})$/i.test(version.sha256)||!Number.isSafeInteger(version.byte_size)||version.byte_size<1)throw Error('同步圖片版本不完整');
  id(version.id);
  const filename=namedSegment(String(extra.name||version.name).replace(/\.(png|jpe?g|webp)$/i,''),extra.id)+'__'+version.sha256+'.'+EXT[version.mime];
  directories.add(path);files.push({path:path+'/'+filename,version,...extra});
 };
 for(const f of assetFolders(project))directories.add('素材/'+folderPath(project,f.id).map(x=>folders.get(x.id)).join('/'));
 for(const asset of project.assets){
  const path=assetFolderId(asset)?folderPath(project,asset.folder_id).map(x=>folders.get(x.id)).join('/'):'未分類';
  add('素材/'+path,project.versions.find(v=>v.id===asset.currentVersionId),{id:id(asset.id),name:asset.name,type:'asset',asset_id:asset.id,folder_id:assetFolderId(asset)});
 }
 for(const run of project.runs){
  if(run.status==='cancelled')continue;
  const path='候選圖/'+namedSegment(run.spec?.shot_id||run.spec?.shot||'任務',run.id);
  for(const output of run.outputs){
   const decision={accepted:'已核定',rejected:'退回',pending:'待驗收'}[output.decision]||'待驗收';
   add(path+'/'+decision,output.version,{id:id(output.id),name:output.version?.name,type:'candidate',run_id:run.id,output_id:output.id,decision:output.decision||'pending'});
  }
 }
 return {directory:deviceProjectDirectory(project),directories:[...directories],files};
}
export async function deviceFolderContentKey(project,plan=deviceFolderPlan(project)){
 return hash(stable({directory:plan.directory,project_name:project.name,directories:plan.directories,files:plan.files.map(({version,...info})=>({...info,version_id:version.id,sha256:version.sha256,byte_size:version.byte_size,mime:version.mime}))}));
}
async function directoryAt(root,path){
 let current=root;for(const component of path.split('/')){
  if(!component||component==='.'||component==='..'||component.includes('\\'))throw Error('裝置同步路徑不安全');
  current=await current.getDirectoryHandle(component,{create:true});
 }return current;
}
async function writeVerified(parent,name,bytes,sha,checkActive){
 checkActive();
 let handle;
 try{
  handle=await parent.getFileHandle(name);const existing=await handle.getFile();
  // An interrupted first write may leave an empty placeholder. Retry that
  // placeholder, while preserving every nonempty conflicting device file.
  if(existing.size>0){
   if(existing.size!==bytes.length||await hash(await existing.arrayBuffer())!==sha)throw deviceSyncError('conflict','裝置內有同名但內容不同的檔案，已停止且保留原檔：'+name);
   return false;
  }
 }catch(e){if(e.name!=='NotFoundError')throw e}
 checkActive();handle=await parent.getFileHandle(name,{create:true});
 const stream=await handle.createWritable();
 try{checkActive();await stream.write(bytes);checkActive();await stream.close()}catch(e){try{await stream.abort()}catch{}throw e}
 const saved=await handle.getFile();
 if(saved.size!==bytes.length||await hash(await saved.arrayBuffer())!==sha)throw deviceSyncError('integrity','裝置原圖讀回校驗失敗，已停止：'+name);
 return true;
}
export async function syncDeviceFolder(root,project,{checkActive=()=>{},onProgress=()=>{},readOriginal=null}={}){
 if(!root||root.kind!=='directory')throw Error('請先選擇裝置資料夾');
 if(await root.queryPermission({mode:'readwrite'})!=='granted')throw deviceSyncError('permission','資料夾授權已失效，請按「授權並繼續」');
 let plan;try{plan=deviceFolderPlan(project)}catch(error){error.code='invalid_data';throw error}
 checkActive();const target=await root.getDirectoryHandle(plan.directory,{create:true});
 const directories=new Map([['',target]]);
 const getDirectory=async path=>{if(!directories.has(path)){checkActive();directories.set(path,await directoryAt(target,path))}return directories.get(path)};
 for(const path of plan.directories)await getDirectory(path);
 const manifest={schema_version:'device-folder-v1',project_id:project.id,project_name:project.name,project_revision:project.revision,direction:'workbench_to_device',deletion_policy:'keep_existing',folders:assetFolders(project),files:[]};
 let written=0,skipped=0;
 for(const entry of plan.files){
  checkActive();const {version,...info}=entry,bytes=readOriginal?await readOriginal(version):dataBytes(version.data);
  if(bytes.length!==version.byte_size||await hash(bytes)!==version.sha256)throw deviceSyncError('integrity','工作台原圖校驗失敗，已停止同步：'+info.name);
  const split=entry.path.lastIndexOf('/'),parent=await getDirectory(entry.path.slice(0,split));
  if(await writeVerified(parent,entry.path.slice(split+1),bytes,version.sha256,checkActive))written++;else skipped++;
  manifest.files.push({...info,version_id:version.id,mime:version.mime,sha256:version.sha256,byte_size:bytes.length});
  checkActive();onProgress({completed:written+skipped,total:plan.files.length,written,skipped});
 }
 checkActive();const bytes=new TextEncoder().encode(stable(manifest)),sha=await hash(bytes);
 await writeVerified(await getDirectory('同步紀錄'),'索引-'+sha+'.json',bytes,sha,checkActive);
 return {directory:plan.directory,written,skipped,total:plan.files.length,revision:project.revision,content_key:await deviceFolderContentKey(project,plan),completed_at:new Date().toISOString()};
}
