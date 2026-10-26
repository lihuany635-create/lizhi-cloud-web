import {ASSET_OPS,operateAssets} from '../lib/project-assets.ts';
import {MANAGED_OPS,operateManaged} from '../lib/project-management.ts';
import {operatePortfolio,PORTFOLIO_OPS,type WorkspaceProject} from '../lib/portfolio.ts';
import {applyAction,makeProject,summary,FlowError,makeWork,workSummary,applyWorkAction,normalizeEpisode,pinSharedAsset,episodeBrief,normalizeEpisodeWorkflow,type Actor,type Project,type Work} from '../lib/workflow.ts';
export type State={portfolio?:WorkspaceProject[];rows:(Project|Work)[];migration?:{sourceOwner:string;digest:string;at:string}};
export function operate(input:State,op:string,args:unknown[],actor:Actor){
 if(ASSET_OPS.includes(op))return operateAssets(input,op,args,actor);
 if(MANAGED_OPS.includes(op))return operateManaged(input,op,args,actor);
 if(PORTFOLIO_OPS.includes(op))return operatePortfolio(input,op,args,actor);
 const state:State=structuredClone(input);let changed=false;
 const project=(id:unknown)=>{const p=state.rows.find(x=>x.id===id);if(!p||p.entityType==='work')throw new FlowError('找不到集數',404);return normalizeEpisodeWorkflow(p);};
 const work=(id:unknown)=>{const w=state.rows.find(x=>x.id===id);if(!w||w.entityType!=='work')throw new FlowError('找不到作品專案',404);return w;};
 const projects=()=>state.rows.filter((x):x is Project=>x.entityType!=='work').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(summary);
 const view=(id:unknown)=>({work:work(id),episodes:projects().filter(x=>x.workId===id).sort((a,b)=>a.episode.localeCompare(b.episode,undefined,{numeric:true}))});
 const save=(row:Project|Work)=>{const index=state.rows.findIndex(x=>x.id===row.id);if(index<0)state.rows.push(row);else state.rows[index]=row;changed=true;};
 const revision=(row:{revision:number},expected:unknown)=>{if(!Number.isInteger(expected)||row.revision!==expected)throw new FlowError('資料已更新，請重新讀取後再儲存',409);};
 const title=(v:unknown)=>{if(typeof v!=='string'||!v.trim()||v.length>200)throw new FlowError('專案名稱格式錯誤');return v.trim();};
 let result:unknown;
 if(op==='listProjects')result=projects();
 else if(op==='getProject')result=project(args[0]);
 else if(op==='getWork')result=work(args[0]);
 else if(op==='listWorks')result=state.rows.filter((x):x is Work=>x.entityType==='work').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(w=>({...workSummary(w),episodeCount:projects().filter(p=>p.workId===w.id).length}));
 else if(op==='workView')result=view(args[0]);
 else if(op==='createProject'){
  const code=String(args[1]??'');if(code.length>60)throw new FlowError('集數格式錯誤');const p=makeProject(title(args[0]),code.trim());p.audit.push({at:p.updatedAt,by:actor.name,actor:actor.kind,action:'create_project',detail:'雲端庫製作工作台建立，全部階段待確認'});if(actor.kind==='ai')p.lastMcpAt=p.updatedAt;save(p);result=p;
 }else if(op==='mutate'){
  const p=project(args[0]);revision(p,args[1]);const action=String(args[2]),a=(args[3]??{}) as Record<string,unknown>;
  if(action==='save_episode_handoff'){const target=project(a.toEpisodeId);if(!p.workId||target.workId!==p.workId||target.id===p.id)throw new FlowError('接續集數必須屬於同作品');}
  const next=action==='pin_shared_reference'?pinSharedAsset(p,work(p.workId),String(a.assetId??''),actor):applyAction(p,action,a,actor);save(next);result=next;
 }else if(op==='createWork'){
  const w=makeWork(title(args[0])),p=makeProject('EP01 製作資料','EP01');p.workId=w.id;p.entityType='episode';w.audit.push({at:w.updatedAt,by:actor.name,action:'create_work',detail:'建立作品與首集'});save(w);save(p);result={...view(w.id),episode:p};
 }else if(op==='convertEpisode'){
  const p=project(args[0]);revision(p,args[1]);if(p.workId)result={...view(p.workId),episode:p};else{
   const w=makeWork(title(args[2])),next=structuredClone(p);next.workId=w.id;next.entityType='episode';next.revision++;next.updatedAt=w.updatedAt;next.audit.push({at:next.updatedAt,by:actor.name,actor:actor.kind,action:'attach_work',detail:w.id});
   for(const r of p.knowledge?.records.filter(x=>x.kind==='character'&&x.key.startsWith('ep01_character_'))??[])w.sharedAssets.push({id:crypto.randomUUID(),key:'character_'+r.key.slice('ep01_character_'.length),version:1,title:r.title+'（EP01來源參考）',kind:r.kind,content:r.content,source:r.source,location:r.location,originEpisodeId:p.id,originRecordId:r.id,by:actor.name,at:w.updatedAt});
   w.audit.push({at:w.updatedAt,by:actor.name,action:'convert_episode',detail:p.id});save(w);save(next);result={...view(w.id),episode:next};
  }
 }else if(op==='createEpisode'){
  const w=work(args[0]);revision(w,args[1]);const code=normalizeEpisode(String(args[2]??''));if(projects().some(p=>p.workId===w.id&&p.episode.toUpperCase()===code))throw new FlowError('這個作品已有 '+code,409);
  const p=makeProject(title(args[3]||code+' 製作資料'),code);p.workId=w.id;p.entityType='episode';w.revision++;w.updatedAt=p.updatedAt;w.audit.push({at:w.updatedAt,by:actor.name,action:'create_episode',detail:code});save(w);save(p);result={...view(w.id),episode:p};
 }else if(op==='mutateWork'){
  const w=work(args[0]);revision(w,args[1]);const action=String(args[2]),a=(args[3]??{}) as Record<string,unknown>;
  if(action==='pin_model_version'&&project(a.episodeId).workId!==w.id)throw new FlowError('模型只能引用至同作品的集數');
  const next=applyWorkAction(w,action,a,actor);save(next);result=view(w.id);
 }else if(op==='readEpisodeBrief'){
  const p=project(args[0]),others=state.rows.filter((x):x is Project=>x.entityType!=='work'&&!!p.workId&&x.workId===p.workId&&x.id!==p.id),mw=p.workId?work(p.workId):null;
  const pins=[...new Map((mw?.modelFlow?.pins??[]).filter(x=>x.episodeId===p.id).map(x=>[[x.modelId,x.sceneIds].join('|'),x])).values()];
  result={...episodeBrief(p),modelReferences:pins.map(pin=>{const m=mw!.modelFlow!.models.find(x=>x.id===pin.modelId)!,v=m.versions.find(x=>x.id===pin.versionId)!;return {...pin,key:m.key,title:m.title,label:v.label,sourceLocation:v.sourceLocation,candidateLocation:v.candidateLocation,reference:v.reference,openIssues:mw!.modelFlow!.issues.filter(x=>x.modelId===m.id&&x.versionId===v.id&&x.status==='open')};}),incoming:others.flatMap(ep=>{const latest=ep.production?.handoffs?.at(-1);return latest?.toEpisodeId===p.id?[{fromEpisodeId:ep.id,fromEpisode:ep.episode,fromRevision:ep.revision,handoff:latest}]:[];})};
 }else throw new FlowError('未知製作工作台操作',400);
 return {state,result,changed};
}
