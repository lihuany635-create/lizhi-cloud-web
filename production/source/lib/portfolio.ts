import {FlowError,makeWork,makeProject,type Actor,type Work,type Project} from './workflow.ts';
export const PROJECT_TYPES={animation:'動畫製作',model:'3D 模型',software:'軟體開發',general:'一般專案'} as const;
export const PHASES={animation:['企劃與設定','動畫製作','模型製作','檢查與交付'],model:['原檔盤點與備份','設定與空間依據','補件與差異規劃','建模與候選輸出','技術檢查','鏡位與視覺檢查','修正與複核','交接與採用紀錄'],software:['需求整理','設計','實作','測試','發布','維護'],general:['規劃','執行','檢查','交付']} as const;
export type ProjectKind=keyof typeof PROJECT_TYPES;
export type Journal={id:string;key:string;phase:string;status:'partial'|'completed'|'blocked';summary:string;evidence:string;verification:string;blockers:string;nextStep:string;at:string;by:string;actor:'author'|'ai'};
export type Task={id:string;title:string;phase:string;status:'todo'|'doing'|'done'|'blocked';evidence:string;updatedAt:string};
export type WorkspaceProject={id:string;kind:ProjectKind;title:string;objective:string;revision:number;archived:boolean;createdAt:string;updatedAt:string;workId?:string;journal:Journal[];tasks:Task[];history:{action:string;at:string;by:string;actor:string;detail:string}[]};
export type PortfolioState={trashAudit?:{id:string;kind:string;targetId:string;projectId:string;action:string;at:string;by:string;key:string}[];trash?:import('./recycle-bin.ts').TrashEntry[];rows:(Work|Project)[];portfolio?:WorkspaceProject[]};
const text=(v:unknown,max=12000,required=false)=>{if(typeof v!=='string'||v.length>max||required&&!v.trim())throw new FlowError('請填寫有效內容（長度上限 '+max+' 字）');return v.trim();};
export function workspaceProjects(s:PortfolioState):WorkspaceProject[]{
 const saved=s.portfolio??[],linked=s.rows.filter((x):x is Work=>x.entityType==='work').map(w=>{const old=saved.find(x=>x.id===w.id);return {...old,id:w.id,kind:'animation' as const,title:w.title,objective:old?.objective??'動畫集數與共用模型的製作、檢查及交接',revision:old?.revision??1,archived:old?.archived??false,createdAt:old?.createdAt??w.audit[0]?.at??w.updatedAt,updatedAt:[old?.updatedAt??'',w.updatedAt].sort().at(-1)!,workId:w.id,journal:old?.journal??[],tasks:old?.tasks??[],history:old?.history??[]};});
 return [...linked,...saved.filter(x=>x.kind!=='animation')].filter(p=>!s.trash?.some(t=>t.kind==='project'&&t.projectId===p.id)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export function workspaceView(s:PortfolioState,id:unknown){const p=workspaceProjects(s).find(x=>x.id===id);if(!p)throw new FlowError('找不到專案',404);const w=p.workId?s.rows.find((x):x is Work=>x.id===p.workId&&x.entityType==='work'):null;return {...p,phases:PHASES[p.kind],animation:w?{workId:w.id,episodes:s.rows.filter((x):x is Project=>x.entityType!=='work'&&x.workId===w.id).map(x=>({id:x.id,episode:x.episode,title:x.title,archived:x.archived})),modelCount:w.modelFlow?.models.length??0}:null,handoff:p.journal.at(-1)??null,policy:'工作紀錄為執行者回報；完成回報不等於作者驗收。動畫與模型仍使用各自的精確版本與工作資料包。'};}
export const PORTFOLIO_OPS=['listWorkspaceProjects','getWorkspaceProject','createWorkspaceProject','updateWorkspaceProject','appendWorkspaceRecord','saveWorkspaceTask'];
export function operatePortfolio(input:PortfolioState,op:string,args:unknown[],actor:Actor){
 const state=structuredClone(input);let changed=false;let result:unknown;
 if(op==='listWorkspaceProjects')result=workspaceProjects(state).map(({journal,tasks,history,...p})=>({...p,lastRecord:journal.at(-1)??null,openTasks:tasks.filter(t=>t.status!=='done').length,recordCount:journal.length,episodeCount:state.rows.filter(x=>x.entityType!=='work'&&x.workId===p.workId&&!!p.workId).length,modelCount:p.workId?(state.rows.find(x=>x.id===p.workId) as Work)?.modelFlow?.models.length??0:0}));
 else if(op==='getWorkspaceProject')result=workspaceView(state,args[0]);
 else {
  const at=new Date().toISOString();let p:WorkspaceProject;
  if(op==='createWorkspaceProject'){
   const a=args[0] as Record<string,unknown>,kind=text(a.kind,30) as ProjectKind;if(!Object.hasOwn(PROJECT_TYPES,kind))throw new FlowError('不支援的專案類型');
   const title=text(a.title,200,true),objective=text(a.objective??'',6000);let id=crypto.randomUUID(),workId:string|undefined;
   if(kind==='animation'){const w=makeWork(title),ep=makeProject('EP01 製作資料','EP01');ep.workId=w.id;ep.entityType='episode';id=w.id;workId=id;w.audit.push({at,by:actor.name,action:'create_work',detail:'從專案工作台建立'});state.rows.push(w,ep);}
   p={id,kind,title,objective,revision:1,archived:false,createdAt:at,updatedAt:at,workId,journal:[],tasks:[],history:[]};
  }else{
   const existing=workspaceProjects(state).find(x=>x.id===args[0]);if(!existing)throw new FlowError('找不到專案',404);p=structuredClone(existing);
   if(!Number.isInteger(args[1])||args[1]!==p.revision)throw new FlowError('專案已更新，請重新讀取後再儲存',409);
   const a=(args[2]??{}) as Record<string,unknown>;
   if(p.archived&&op!=='updateWorkspaceProject')throw new FlowError('請先還原專案再新增紀錄',409);
   if(op==='updateWorkspaceProject'){
    if(a.title!==undefined&&p.kind!=='animation')p.title=text(a.title,200,true);
    if(a.objective!==undefined)p.objective=text(a.objective,6000);
    if(a.archived!==undefined){if(typeof a.archived!=='boolean')throw new FlowError('封存格式錯誤');p.archived=a.archived;}
   }else if(op==='appendWorkspaceRecord'){
    const phase=text(a.phase,60,true);if(!(PHASES[p.kind] as readonly string[]).includes(phase))throw new FlowError('請選擇本專案的階段');
    const status=text(a.status,30) as Journal['status'];if(!['partial','completed','blocked'].includes(status))throw new FlowError('工作狀態錯誤');
    const record:Journal={id:crypto.randomUUID(),key:text(a.key,100,true),phase,status,summary:text(a.summary,12000,true),evidence:text(a.evidence??'',12000,status==='completed'),verification:text(a.verification,12000,true),blockers:text(a.blockers??'',6000,status==='blocked'),nextStep:text(a.nextStep,6000,true),at,by:actor.name,actor:actor.kind};
    if(p.journal.some(x=>x.key===record.key))throw new FlowError('此工作紀錄識別鍵已存在，請重新讀取',409);if(p.journal.length>=2000)throw new FlowError('工作紀錄已達上限，請分成新專案');p.journal.push(record);
   }else if(op==='saveWorkspaceTask'){
    const id=a.id?text(a.id,100,true):crypto.randomUUID(),old=p.tasks.find(x=>x.id===id);if(a.id&&!old)throw new FlowError('找不到此專案的待辦',404);
    const phase=text(a.phase,60,true),status=text(a.status,30) as Task['status'];if(!(PHASES[p.kind] as readonly string[]).includes(phase)||!['todo','doing','done','blocked'].includes(status))throw new FlowError('待辦階段或狀態錯誤');
    const task:Task={id,title:text(a.title,300,true),phase,status,evidence:text(a.evidence??'',6000,status==='done'),updatedAt:at};if(old)Object.assign(old,task);else {if(p.tasks.length>=1000)throw new FlowError('待辦已達上限');p.tasks.push(task);}
   }else throw new FlowError('未知專案操作');
   p.revision++;p.updatedAt=at;
  }
  p.history.push({action:op,at,by:actor.name,actor:actor.kind,detail:op==='appendWorkspaceRecord'?p.journal.at(-1)!.summary:op==='saveWorkspaceTask'?'更新待辦':p.title});
  state.portfolio??=[];const index=state.portfolio.findIndex(x=>x.id===p.id);if(index<0)state.portfolio.push(p);else state.portfolio[index]=p;changed=true;result=workspaceView(state,p.id);
 }
 return {state,result,changed};
}
