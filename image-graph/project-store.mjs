import {allProjectRuns} from './task-actions.mjs';
import {returnedReference} from './returned-images.mjs?v=25';
export function projectSummary(p){return {id:p.id,name:p.name,revision:p.revision,created_at:p.created_at,updated_at:p.updated_at||p.created_at,assets:p.assets.length,runs:p.runs.length,cloud_project:p.cloud_project||null}}
export function portableProject(p){const snapshot=structuredClone(p);delete snapshot.cloud_project;for(const v of projectVersions(snapshot))delete v.data;return snapshot}
export function projectVersions(p){return [...p.versions,...allProjectRuns(p).flatMap(r=>r.outputs.map(o=>o.version))]}
export function importedProject(p,newId){const copy=structuredClone(p);copy.id=newId;copy.name=(copy.name||'未命名專案')+'（匯入）';delete copy.cloud_project;copy.revision=0;copy.created_at=new Date().toISOString();copy.updated_at=copy.created_at;return copy}
const result=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
const complete=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('專案儲存中止'))});
export async function openProjectStore(api=indexedDB){
 // v5 already contains every store needed by filesystem references. Open its
 // current version first: an unnecessary v6 upgrade waits forever on old tabs
 // whose connections predate the onversionchange handler.
 let db=await result(api.open('image-graph-workbench'));
 if(db.version<5||['project','projects','projectIndex','settings'].some(name=>!db.objectStoreNames.contains(name))){
  const version=Math.max(6,db.version+1);db.close();
  const request=api.open('image-graph-workbench',version);
  request.onupgradeneeded=()=>{
   const db=request.result,tx=request.transaction;
   if(!db.objectStoreNames.contains('project'))db.createObjectStore('project');
   if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});
   if(!db.objectStoreNames.contains('projectIndex'))db.createObjectStore('projectIndex',{keyPath:'id'});
   if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings');
   const legacy=tx.objectStore('project').get('current');legacy.onsuccess=()=>{const p=legacy.result;if(!p)return;const existing=tx.objectStore('projects').get(p.id);existing.onsuccess=()=>{if(existing.result)return;tx.objectStore('projects').put(p);tx.objectStore('projectIndex').put(projectSummary(p));tx.objectStore('settings').put(p.id,'activeProjectId')}};
  };
  request.onblocked=()=>{globalThis.document?.dispatchEvent(new Event('project-storage-blocked'))};
  db=await result(request);
 }
 db.onversionchange=()=>db.close();
 return {
  db,
  async list(){return (await result(db.transaction('projectIndex').objectStore('projectIndex').getAll())).sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||''))},
  async get(id){return result(db.transaction('projects').objectStore('projects').get(id))},
  async active(){const id=await result(db.transaction('settings').objectStore('settings').get('activeProjectId'));return id?this.get(id):null},
  async save(p,active=true,{expectedStorageKey,expectedRevision,expectedAbsent=false}={}){
   for(const v of projectVersions(p))if(v.returned_ref)returnedReference(v.returned_ref);
   if(p.image_storage?.mode==='directory'&&projectVersions(p).some(v=>v.data||(!v.disk_ref&&!v.fs_ref&&!v.returned_ref)))throw Error('資料夾模式不能把完整原圖存回瀏覽器');
   const tx=db.transaction(['project','projects','projectIndex','settings'],'readwrite'),done=complete(tx);let conflict;
   const request=tx.objectStore('projects').get(p.id);
   request.onsuccess=()=>{
    const previous=request.result,oldKey=previous?.image_storage?.mode==='directory'?previous.image_storage.key:null,newKey=p.image_storage?.mode==='directory'?p.image_storage.key:null;
    if(previous&&(expectedAbsent||(oldKey!==newKey&&expectedStorageKey!==oldKey)||(expectedStorageKey!==undefined&&(expectedStorageKey!==oldKey||expectedRevision!==previous.revision)))){
     conflict=Error('此專案的儲存位置或內容已由其他分頁更新，已保留最新資料；請重新整理後再操作');tx.abort();return;
    }
    if(p.image_storage?.mode==='directory'){const legacy=tx.objectStore('project').get('current');legacy.onsuccess=()=>{if(legacy.result?.id===p.id)tx.objectStore('project').delete('current')}}
    tx.objectStore('projects').put(p);tx.objectStore('projectIndex').put(projectSummary(p));if(active)tx.objectStore('settings').put(p.id,'activeProjectId');
   };
   try{await done}catch(e){throw conflict||e}
  },
  async getSetting(key){return result(db.transaction('settings').objectStore('settings').get(key))},
  async setSetting(key,value){const tx=db.transaction('settings','readwrite'),done=complete(tx);tx.objectStore('settings').put(value,key);await done},
  async activate(id){const tx=db.transaction('settings','readwrite'),done=complete(tx);tx.objectStore('settings').put(id,'activeProjectId');await done}
 };
}
