import {FlowError,type Actor} from './workflow.ts';
import {managedOf,type ManagedProject} from './project-management.ts';
import {imageObjectPath,type ProjectImage} from './project-images.ts';
import type {PortfolioState} from './portfolio.ts';
export type TrashEntry={id:string;kind:'project'|'record'|'image'|'folder';projectId:string;projectName:string;targetId:string;title:string;at:string;by:string;data:any;purging?:boolean;retainUntil?:string};
type RecycleState=PortfolioState&{trash?:TrashEntry[];trashAudit?:{id:string;kind:string;targetId:string;projectId:string;action:string;at:string;by:string;key:string}[]};
type Services={read:()=>Promise<{revision:number;data:RecycleState}>;commit:(revision:number,data:RecycleState)=>Promise<void>;remove:(path:string)=>Promise<void>};
const save=(s:RecycleState,p:ManagedProject)=>{s.portfolio??=[];const i=s.portfolio.findIndex(x=>x.id===p.id);if(i<0)s.portfolio.push(p);else s.portfolio[i]=p;};
const text=(v:unknown)=>{if(typeof v!=='string'||!v.trim()||v.length>200)throw new FlowError('垃圾桶欄位格式錯誤');return v;};
function author(actor:Actor){if(actor.kind!=='author')throw new FlowError('刪除與還原僅限本人從工作台操作',403);}
function change(p:ManagedProject,actor:Actor,action:string,targetId:string){p.revision++;p.updatedAt=new Date().toISOString();p.history.push({action,at:p.updatedAt,by:actor.name,actor:actor.kind,detail:targetId});}
function project(s:RecycleState,id:string,revision:unknown){const p=managedOf(s,id);if(!Number.isInteger(revision)||p.revision!==revision)throw new FlowError('專案已更新，請重新整理後再操作',409);return p;}
export function trashView(record:{revision:number;data:RecycleState},actor:Actor){author(actor);return {revision:record.revision,items:(record.data.trash??[]).map(({data,...e})=>{let projectRevision:number|undefined;try{projectRevision=managedOf(record.data,e.projectId).revision;}catch{}return {...e,projectRevision,parentDeleted:e.kind!=='project'&&projectRevision===undefined,canPurge:e.kind==='project'?!data.workId&&!data.images?.length&&!(record.data.trash??[]).some(x=>x.projectId===e.projectId&&x.id!==e.id):true};})};}
export function recycle(input:RecycleState,a:Record<string,unknown>,actor:Actor,assetTool=false){
 if(!assetTool)author(actor);const state=structuredClone(input);state.trash??=[];state.trashAudit??=[];
 const action=text(a.action),key=text(a.key),projectId=text(a.projectId),at=new Date().toISOString();
 if(assetTool&&(!['trash','restore'].includes(action)||a.kind!=='image'&&a.kind!=='folder'))throw new FlowError('AI僅能回收及還原素材',403);
 if(!['trash','restore','purge'].includes(action))throw new FlowError('未知垃圾桶操作');
 if(state.trashAudit.some(x=>x.key===key))throw new FlowError('此操作已送出，請重新整理查看結果',409);
 let entry:TrashEntry;
 if(action==='trash'){
  if(state.trash.length>=2000)throw new FlowError('垃圾桶已達上限，請先清理');
  const p=project(state,projectId,a.projectRevision),kind=text(a.kind),targetId=kind==='project'?p.id:text(a.targetId);
  if(!['project','record','image','folder'].includes(kind))throw new FlowError('不支援刪除此類資料');
  let data:any,title:string;
  if(kind==='project'){data=p;title=p.title;state.portfolio=state.portfolio?.filter(x=>x.id!==p.id);}
  else if(kind==='folder'){const space=(p as any).assets;const f=space?.folders.find((x:any)=>x.id===targetId);if(!f)throw new FlowError('找不到資料夾',404);data=f;title=f.name;space.folders=space.folders.filter((x:any)=>x.id!==targetId);change(p,actor,'trash_folder',targetId);save(state,p);}
  else if(kind==='image'){const image=p.images.find(x=>x.id===targetId);if(!image)throw new FlowError('找不到本專案圖片',404);if(image.objectPath!==imageObjectPath(actor.id,p.id,image.blobId??image.id,image.mime))throw new FlowError('圖片位置不屬於本人專案',403);data=image;title=image.name;p.images=p.images.filter(x=>x.id!==targetId);change(p,actor,'trash_image',targetId);save(state,p);}
  else {const record=p.records.find(x=>x.id===targetId);if(!record)throw new FlowError('找不到本專案紀錄',404);data={record,journal:p.journal.find(x=>x.id===targetId)};title=record.summary;p.records=p.records.filter(x=>x.id!==targetId);p.journal=p.journal.filter(x=>x.id!==targetId);
   // Removing a supporting report must never leave an unsupported PASS on a task.
   if(record.taskId){const t=p.managedTasks.find(t=>t.id===record.taskId),latest=p.records.filter(r=>r.taskId===record.taskId).at(-1);if(t){t.status=latest?.status??'NOT_TESTED';t.evidenceIds=latest?.evidenceIds??[];t.nextAction=latest?.nextStep??'支持紀錄已移入垃圾桶，請重新驗證';t.updatedAt=at;if(p.status==='completed'&&t.status!=='PASS')p.status='in_progress';}}
   change(p,actor,'trash_record',targetId);save(state,p);
  }
  entry={id:crypto.randomUUID(),kind:kind as TrashEntry['kind'],projectId,projectName:p.title,targetId,title:title.slice(0,300),at,by:actor.name,data,...['image','folder'].includes(kind)?{retainUntil:new Date(Date.now()+30*86400000).toISOString()}:{} };state.trash.push(entry);
 }else{
  entry=state.trash.find(x=>x.id===a.trashId&&x.projectId===projectId)!;if(!entry)throw new FlowError('垃圾桶內找不到此項目',404);
  if(entry.kind!=='project'&&state.trash.some(x=>x.kind==='project'&&x.projectId===projectId))throw new FlowError('請先還原所屬專案',409);
  if(action==='restore'){
   if(entry.purging)throw new FlowError('此圖片正在永久刪除，請重試刪除完成清理',409);
   if(entry.kind==='project'){
    if(state.portfolio?.some(x=>x.id===projectId))throw new FlowError('專案已存在，禁止覆蓋',409);
    const p=entry.data as ManagedProject;change(p,actor,'restore_project',p.id);save(state,p);
   }else{
    const p=project(state,projectId,a.projectRevision);
    if(entry.kind==='folder'){const space=(p as any).assets;if(!space||space.folders.some((x:any)=>x.id===entry.targetId))throw new FlowError('資料夾狀態已改變',409);if(space.folders.some((f:any)=>f.name===entry.data.name&&f.parentId===entry.data.parentId))throw new FlowError('已有同名資料夾，請先重新命名或整理',409);space.folders.push(entry.data);}
    else if(entry.kind==='image'){if(p.images.some(x=>x.id===entry.targetId||x.key===entry.data.key))throw new FlowError('圖片已存在，禁止覆蓋',409);p.images.push(entry.data as ProjectImage);p.images.sort((x,y)=>x.at.localeCompare(y.at));}
    else {if(p.records.some(x=>x.id===entry.targetId||x.key===entry.data.record.key))throw new FlowError('紀錄已存在，禁止覆蓋',409);p.records.push(entry.data.record);p.records.sort((x,y)=>x.at.localeCompare(y.at));if(entry.data.journal){p.journal.push(entry.data.journal);p.journal.sort((x,y)=>x.at.localeCompare(y.at));}}
    change(p,actor,'restore_'+entry.kind,entry.targetId);save(state,p);
   }
   state.trash=state.trash.filter(x=>x.id!==entry.id);
  }else{
   const retainUntil=entry.retainUntil??(['image','folder'].includes(entry.kind)?new Date(Date.parse(entry.at)+30*86400000).toISOString():'');
   if(retainUntil&&Date.now()<Date.parse(retainUntil))throw new FlowError('素材回收區至少保留30天，尚不可永久刪除',409);
   if(a.confirm!=='永久刪除')throw new FlowError('請輸入「永久刪除」以確認');
   if(entry.kind==='project'){
    if(entry.data.workId)throw new FlowError('動畫專業資料受到保護，此專案只能移入垃圾桶或還原',403);
    if(entry.data.images?.length||state.trash.some(x=>x.projectId===projectId&&x.id!==entry.id))throw new FlowError('專案仍有圖片或垃圾桶項目，請先還原專案並清理',409);
   }else{
    const p=project(state,projectId,a.projectRevision);
    if(entry.kind==='folder'&&(p.images.some(i=>i.folderId===entry.targetId)||(p as any).assets?.folders.some((f:any)=>f.parentId===entry.targetId)))throw new FlowError('資料夾仍有子項，不可永久刪除',409);
    if(entry.kind==='image'&&((p as any).assets?.drawings.some((d:any)=>d.assetId===entry.targetId)||(p as any).assets?.relations.some((r:any)=>r.from==='asset:'+entry.targetId||r.to==='asset:'+entry.targetId)))throw new FlowError('圖說版本仍引用此素材，請先處理引用',409);
    if(entry.kind==='record'&&((p as any).assets?.drawings.some((d:any)=>d.recordId===entry.targetId)||p.images.some(x=>x.recordId===entry.targetId)||state.trash.some(x=>x.kind==='image'&&x.data.recordId===entry.targetId)))throw new FlowError('仍有圖片連結這筆紀錄，請先解除連結或刪除圖片',409);
    if(entry.kind==='image'&&entry.data.objectPath!==imageObjectPath(actor.id,projectId,entry.data.blobId??entry.data.id,entry.data.mime))throw new FlowError('圖片位置不屬於本人專案',403);
    change(p,actor,'purge_'+entry.kind,entry.targetId);save(state,p);
   }
   if(entry.kind==='image')entry.purging=true;else state.trash=state.trash.filter(x=>x.id!==entry.id);
  }
 }
 state.trashAudit.push({id:entry.id,kind:entry.kind,targetId:entry.targetId,projectId,action,at,by:actor.name,key});
 return {state,entry};
}
export async function handleRecycle(req:Request,actor:Actor,s:Services){
 author(actor);const before=await s.read();if(req.method==='GET')return trashView(before,actor);
 const raw=await req.text();if(raw.length>10000)throw new FlowError('垃圾桶請求過大',413);const a=JSON.parse(raw);
 if(!Number.isInteger(a.revision)||before.revision!==a.revision)throw new FlowError('工作台已更新，請重新整理垃圾桶後再操作',409);
 const next=recycle(before.data,a,actor);await s.commit(before.revision,next.state);
 if(a.action==='purge'&&next.entry.kind==='image'){
  // Persist an irreversible pending state first. Restore is blocked until cleanup finishes.
  // If Storage or final CAS fails, a fresh explicit purge can resume safely.
  const path=next.entry.data.objectPath,shared=next.state.portfolio?.some((p:any)=>p.images?.some((i:any)=>i.objectPath===path))||next.state.trash?.some(t=>t.id!==next.entry.id&&t.kind==='image'&&t.data.objectPath===path);
  if(!shared)await s.remove(path);
  const current=await s.read(),entry=current.data.trash?.find(x=>x.id===next.entry.id);
  if(entry){if(!entry.purging)throw new FlowError('圖片狀態已改變，請重新整理',409);current.data.trash=current.data.trash?.filter(x=>x.id!==entry.id);await s.commit(current.revision,current.data);}
 }
 const saved=await s.read();return {...trashView(saved,actor),saved:true};
}
