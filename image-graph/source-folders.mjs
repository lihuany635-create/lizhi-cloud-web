import {uid,hash} from './core.mjs';
import {rasterMime} from './image-input.mjs';
import {sourceRead} from './source-read.mjs?v=28';

const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const validPart=name=>typeof name==='string'&&name.length>0&&name.length<=255&&!['.','..'].includes(name)&&!/[\/\\\u0000]/.test(name);
export function sourcePath(path){if(!Array.isArray(path)||path.length>250||path.some(name=>!validPart(name)))throw Error('來源路徑無效');return [...path]}
export function sourceReference(ref){if(!ref||!UUID.test(ref.root_id||'')||typeof ref.root_name!=='string')throw Error('圖片來源無效');const path=sourcePath(ref.path);if(!path.length)throw Error('來源圖片路徑遺失');return {root_id:ref.root_id,root_name:ref.root_name,path}}
const problem=(message,code)=>Object.assign(Error(message),{code});
export function createSourceFolders({getStore,scope=window,readTimeoutMs=8000,scanTimeoutMs=30000}){
 let current=null;const roots=new Map();
 function store(){const value=getStore();if(!value)throw problem('專案仍在載入，請稍候再連接資料夾','storage_loading');return value}
 const supported=()=>scope.isSecureContext&&typeof scope.showDirectoryPicker==='function';
 async function root(id){if(!UUID.test(id||''))throw Error('資料夾來源無效');if(!roots.has(id)){const value=await store().getSetting('sourceRoot:'+id);if(value?.kind==='directory')roots.set(id,value)}const value=roots.get(id);if(!value)throw problem('請連接原圖所在的資料夾','source_permission');return value}
 const read=(run,label,signal)=>sourceRead(run,label,{signal,timeoutMs:readTimeoutMs});
 async function permission(handle,mode='read',signal){if(await read(()=>handle.queryPermission({mode}),'確認資料夾授權',signal)!=='granted')throw problem('圖片來源需要授權，請按「連接資料夾」選回原圖所在位置','source_permission')}
 async function at(handle,path,signal){let directory=handle;for(const name of sourcePath(path))directory=await read(()=>directory.getDirectoryHandle(name),'開啟資料夾 '+name,signal);return directory}
 async function restore(){const saved=await store().getSetting('sourceBrowserCurrent');if(saved&&UUID.test(saved.root_id||'')){const handle=await root(saved.root_id);current={root_id:saved.root_id,root_name:handle.name,path:sourcePath(saved.path||[])};return current}return null}
 async function choose(){
  store();
  if(!supported())throw Error('此瀏覽器無法連接裝置資料夾，請使用支援資料夾選擇的瀏覽器');
  // Open the system picker directly from the click, before asynchronous storage.
  const handle=await scope.showDirectoryPicker({mode:'readwrite'});await permission(handle);
  // Confirm the selected directory can really be enumerated before changing source.
  if(typeof handle.entries!=='function')throw Error('這個資料夾無法列出內容，請選擇裝置內實際存在的位置');
  const probe=handle.entries();try{await read(()=>probe.next(),'確認所選資料夾內容')}finally{probe.return?.().catch?.(()=>{})}
  const ids=await store().getSetting('sourceRootIds')||[];let id;
  for(const previous of ids){try{const old=await root(previous);if(old===handle||await old.isSameEntry?.(handle)){id=previous;break}}catch{}}
  id??=uid();await store().setSetting('sourceRoot:'+id,handle);roots.set(id,handle);
  if(!ids.includes(id))await store().setSetting('sourceRootIds',[...ids,id]);
  const next={root_id:id,root_name:handle.name,path:[]};await store().setSetting('sourceBrowserCurrent',next);current=next;return {...next};
 }
 async function navigate(path){if(!current)throw Error('請先連接資料夾');const next={...current,path:sourcePath(path)},handle=await root(next.root_id);await permission(handle);await at(handle,next.path);await store().setSetting('sourceBrowserCurrent',next);current=next;return {...next}}
 async function bindRoot(id,versions,{onProgress=()=>{}}={}){
  if(!UUID.test(id||'')||!versions.length||versions.some(v=>v.fs_ref?.root_id!==id))throw Error('待連接的原圖來源無效');
  const handle=await scope.showDirectoryPicker({mode:'readwrite'});await permission(handle);
  const unique=[...new Map(versions.map(v=>[JSON.stringify(sourceReference(v.fs_ref).path),v])).values()];let count=0;
  for(const v of unique){const path=v.fs_ref.path,directory=await at(handle,path.slice(0,-1)),entry=await read(()=>directory.getFileHandle(path.at(-1)),'尋找 '+v.name),file=await read(()=>entry.getFile(),'讀取 '+v.name);
   if(file.size!==v.byte_size||await hash(await read(()=>file.arrayBuffer(),'核對 '+v.name))!==v.sha256)throw Error('所選位置的原圖內容不符：'+v.name+'；尚未變更來源');onProgress(++count,unique.length);
  }
  await store().setSetting('sourceRoot:'+id,handle);roots.set(id,handle);const ids=await store().getSetting('sourceRootIds')||[];if(!ids.includes(id))await store().setSetting('sourceRootIds',[...ids,id]);
  current={root_id:id,root_name:handle.name,path:[]};await store().setSetting('sourceBrowserCurrent',current);return {...current};
 }
 async function listing({recursive=false,signal,onProgress=()=>{}}={}){
  if(!current)return {folders:[],images:[]};const snapshot={...current,path:[...current.path]},handle=await read(()=>root(snapshot.root_id),'讀取來源設定',signal);await permission(handle,'read',signal);const directory=await at(handle,snapshot.path,signal),folders=[],images=[],unreadable=[],queue=[{directory,path:snapshot.path}],started=Date.now();
  let foldersScanned=0,filesScanned=0,otherFiles=0,unsupportedImages=0,truncated=false,entries=0;
  const snapshotResult=()=>({folders:[...folders],images:[...images],location:snapshot,recursive,foldersScanned,filesScanned,otherFiles,unsupportedImages,unreadable:[...unreadable],truncated});
  let lastProgress=0;
  function progress(force=false){if(force||Date.now()-lastProgress>40){lastProgress=Date.now();onProgress(snapshotResult())}}
  for(let index=0;index<queue.length;index++){
   if(signal?.aborted)throw new DOMException('已停止讀取','AbortError');
   if(foldersScanned>=500||Date.now()-started>scanTimeoutMs){truncated=true;break}
   const item=queue[index];foldersScanned++;
   const iterator=item.directory.entries();
   try{while(true){
    const next=await read(()=>iterator.next(),'列出 '+[snapshot.root_name,...item.path].join(' / '),signal);if(next.done)break;const [name,entry]=next.value;
    if(++entries>20000){truncated=true;break}if(!validPart(name))continue;
    const path=[...item.path,name];
    if(entry.kind==='directory'){
     if(index===0)folders.push({name,path});
     if(recursive){if(path.length<250&&queue.length<500)queue.push({directory:entry,path});else truncated=true}
    }else if(entry.kind==='file'){
     filesScanned++;let isImage=/\.(png|jpe?g|webp)$/i.test(name.trim());
     if(!isImage&&/\.(json|txt|md|pdf|zip|csv|xml|db|sqlite|mp4|m4a|mp3|wav)$/i.test(name.trim()))otherFiles++;
     else if(!isImage)try{
      const file=await read(()=>entry.getFile(),'辨識 '+name,signal);isImage=['image/png','image/jpeg','image/webp'].includes(file.type);
      if(!isImage&&!file.type)try{isImage=!!rasterMime(await read(()=>file.slice(0,32).arrayBuffer(),'辨識圖片內容 '+name,signal))}catch(e){if(e.name==='AbortError'||e.code==='source_timeout')throw e}
      if(!isImage){otherFiles++;if(file.type.startsWith('image/')||/\.(heic|heif|avif|gif|bmp|tiff?|svg)$/i.test(name.trim()))unsupportedImages++}
     }catch(e){if(e.name==='AbortError')throw e;unreadable.push({path,message:e.message})}
     if(isImage)images.push({name,ref:{root_id:snapshot.root_id,root_name:snapshot.root_name,path}});
    }
    progress(entries===1);if(Date.now()-started>scanTimeoutMs){truncated=true;break}
   }}catch(e){if(e.name==='AbortError'||index===0&&!entries)throw e;unreadable.push({path:item.path,message:e.message})}
   finally{iterator.return?.().catch?.(()=>{})}
   progress(true);if(entries>20000||Date.now()-started>scanTimeoutMs)break;
  }
  folders.sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant',{numeric:true}));images.sort((a,b)=>a.ref.path.join('/').localeCompare(b.ref.path.join('/'),'zh-Hant',{numeric:true}));
  return snapshotResult();
 }
 async function file(ref,{signal}={}){
  ref=sourceReference(ref);let handle=await read(()=>root(ref.root_id),'讀取圖片來源設定',signal),path=ref.path;
  // A freshly selected ancestor/child may cover a previously remembered root.
  if(await read(()=>handle.queryPermission({mode:'read'}),'確認原圖授權',signal)!=='granted'&&current){const active=await read(()=>root(current.root_id),'讀取目前來源設定',signal);await permission(active,'read',signal);const prefix=await read(()=>active.resolve?.(handle),'核對圖片位置',signal);if(prefix!==null&&prefix!==undefined){handle=active;path=[...prefix,...path]}else {const child=await read(()=>handle.resolve?.(active),'核對子資料夾位置',signal);if(Array.isArray(child)&&child.length<path.length&&child.every((part,i)=>part===path[i])){handle=active;path=path.slice(child.length)}}}
  await permission(handle,'read',signal);
  try{const directory=await at(handle,path.slice(0,-1),signal),file=await read(()=>directory.getFileHandle(path.at(-1)),'開啟圖片 '+path.at(-1),signal);return await read(()=>file.getFile(),'讀取圖片 '+path.at(-1),signal)}catch(e){if(e.name==='NotFoundError')throw problem('來源圖片已移動或刪除：'+path.at(-1)+'；請重新選圖，歷史任務不會自動換成其他圖片','source_missing');throw e}
 }
 // 重新打開網站後授權常會回到「需要詢問」：直接對記住的資料夾要求授權，不必再走系統選擇器。必須在點擊事件中呼叫。
 async function permissionState(){if(!current)return 'none';try{const handle=await root(current.root_id);return await handle.queryPermission({mode:'read'})}catch{return 'none'}}
 async function regrant(){if(!current)return false;const handle=await root(current.root_id);return await handle.requestPermission({mode:'read'})==='granted'}
 async function currentFile(path){if(!current)throw Error('請先連接資料夾');return file({...current,path:sourcePath(path)})}
 async function createFolder(name){
  if(!current)throw Error('請先連接資料夾');name=String(name||'').trim();if(!validPart(name)||name.length>80)throw Error('資料夾名稱不可空白、包含斜線，或超過 80 字');
  const snapshot={...current,path:[...current.path]},handle=await root(snapshot.root_id);
  // Permission request is initiated from the explicit Create click.
  if(await handle.requestPermission({mode:'readwrite'})!=='granted')throw problem('建立資料夾需要寫入授權，請重新連接此位置','source_permission');
  const directory=await at(handle,snapshot.path);
  try{await directory.getDirectoryHandle(name);throw problem('同名資料夾已存在，請使用另一個名稱','source_exists')}catch(e){if(e.name!=='NotFoundError')throw e}
  await directory.getDirectoryHandle(name,{create:true});return {name,path:[...snapshot.path,name],root_id:snapshot.root_id};
 }
 async function legacyFile(version){
  if(!current||!version.disk_ref?.path)throw Error('請先連接原圖所在資料夾');
  const stored=sourcePath(version.disk_ref.path.split('/')),paths=[stored,[...current.path,...stored]];
  // The user may select the old root, 映構原圖, its hash subfolder, or the
  // folder containing the original human-named file. Accept only exact bytes.
  for(let i=0;i<stored.length-1;i++)if(stored[i]===current.root_name)paths.push(stored.slice(i+1));
  paths.push([...current.path,stored.at(-1)]);if(validPart(version.name))paths.push([...current.path,version.name]);
  const seen=new Set();
  for(const path of paths){const key=JSON.stringify(path);if(seen.has(key))continue;seen.add(key);
   try{const candidate=await currentFile(path);if(candidate.size===version.byte_size&&await hash(await candidate.arrayBuffer())===version.sha256)return candidate}
   catch(e){if(e.code!=='source_missing'&&e.name!=='NotFoundError')throw e}
  }
  throw problem('所選位置沒有符合原圖校驗的檔案：'+version.name+'；請連接圖片實際所在的資料夾','source_missing');
 }
 async function saveCandidate(location,candidate,bytes){
  const ref=sourceReference({...location,path:[...sourcePath(location.path), 'placeholder.png']}),handle=await root(ref.root_id);await permission(handle,'readwrite');
  if(bytes.length!==candidate.byte_size||await hash(bytes)!==candidate.sha256)throw Error('回傳原圖校驗失敗，尚未保存');
  const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[candidate.mime];if(!ext||!UUID.test(candidate.id||''))throw Error('候選圖片格式無效');
  const stem=String(candidate.name||'候選圖').replace(/\.(png|jpe?g|webp)$/i,'').replace(/[\/\\\u0000<>:"|?*]/g,'_').slice(0,80)||'候選圖',name=stem+'_'+candidate.id+'.'+ext,directory=await at(handle,location.path);
  let target;
  try{target=await directory.getFileHandle(name);const existing=await target.getFile();if(existing.size){if(existing.size!==bytes.length||await hash(await existing.arrayBuffer())!==candidate.sha256)throw Error('同名檔案已有不同內容，已保留原檔');return {root_id:location.root_id,root_name:location.root_name,path:[...location.path,name]}}}
  catch(e){if(e.name!=='NotFoundError')throw e}
  target??=await directory.getFileHandle(name,{create:true});const writable=await target.createWritable();try{await writable.write(bytes);await writable.close()}catch(e){try{await writable.abort()}catch{}throw e}
  const saved=await (await directory.getFileHandle(name)).getFile();if(saved.size!==bytes.length||await hash(await saved.arrayBuffer())!==candidate.sha256)throw Error('回傳原圖寫入後校驗失敗');
  return {root_id:location.root_id,root_name:location.root_name,path:[...location.path,name]};
 }
 return {supported,restore,choose,bindRoot,navigate,listing,file,currentFile,createFolder,legacyFile,saveCandidate,permissionState,regrant,current:()=>current?{...current,path:[...current.path]}:null};
}
