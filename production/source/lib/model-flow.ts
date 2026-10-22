/** Work-level 3D model records. Registration and review never modify GLB bytes. */
export type ModelActor={name:string;kind:'author'|'ai'};
export const MODEL_STAGES=[
 {id:'M01',title:'原檔盤點與備份',output:'正式模型位置、原始版本、備份、檔案雜湊與盤點紀錄',checks:['已實際讀取指定模型，核對節點、尺寸、座標軸與單位','正式來源、備份及版本可追查，原檔保留','舊模型名稱與現行清單已分清，未混用場景']},
 {id:'M02',title:'設定與空間依據',output:'平面、尺度、物件 ID、不可改動項目及來源版本',checks:['建築外殼、劇情內部、生活層與鏡位需求已分列','米制尺寸、家具編號、門窗樓梯與通道有依據','現實／遊戲場景分清，未定設定明確保留']},
 {id:'M03',title:'補件與差異規劃',output:'保留、改善、新增、未定的逐物件清單',checks:['逐項比對既有模型，規格不等於全部新增','每項補件有節點或區域、來源與差異說明','重大建築變更與世界觀衝突已另列待裁定']},
 {id:'M04',title:'建模與候選輸出',output:'獨立候選 GLB、加工紀錄與使用工具版本',checks:['候選另存新檔，未覆寫正式來源及備份','新增或修改物件保留穩定 ID 與差異紀錄','未完成項目、加工工具及可接續位置已記錄']},
 {id:'M05',title:'技術檢查',output:'載入、幾何、動線、材質與效能檢查報告',checks:['候選 GLB 已實際載入，材質與外部資源可用','節點、尺寸、門窗樓梯、通行路徑與明顯穿模已檢查','面數、材質數、檔案大小及目標裝置效能已記錄']},
 {id:'M06',title:'鏡位與視覺檢查',output:'指定鏡位截圖、位置、lookAt、FOV 與視覺問題',checks:['已實際檢視指定鏡位，保存畫面與版本','攝影機位置、lookAt、FOV、遮擋與時段可重現','未以剪接或鏡位掩蓋幾何衝突，場景一致性已核對']},
 {id:'M07',title:'修正與複核',output:'問題修正對照、複核結果及剩餘限制',checks:['技術問題與 AI 視覺問題分開記錄並複核','修正後重新載入並檢查受影響的前後鏡位','剩餘限制、未定項與採用範圍清楚']},
 {id:'M08',title:'交接與採用紀錄',output:'候選版本、差異、檢查報告、下一步及作者採用紀錄',checks:['原檔、備份、候選與報告位置均可追查','下一位 AI 能知道已做內容、待做內容與接手位置','作者已確認採用的候選版本及適用範圍']},
] as const;
export type ModelStageId=typeof MODEL_STAGES[number]['id'];
export type ModelReview={by:string;at:string;note:string};
export type ModelStage={checks:boolean[];evidence:string;summary:string;nextStep:string;status:'todo'|'candidate'|'needs_revision'|'passed';author:ModelReview|null};
export type ModelVersion={id:string;number:number;label:string;sourceLocation:string;sourceVersion:string;backupLocation:string;sha256:string;reference:string;candidateLocation:string;stages:Record<ModelStageId,ModelStage>;at:string;by:string};
export type ModelRecord={id:string;key:string;title:string;world:'real'|'game'|'other';versions:ModelVersion[];adoptedVersionId:string|null};
export type ModelIssue={id:string;modelId:string;versionId:string;stageId:ModelStageId;kind:'technical'|'visual'|'major';reason:string;status:'open'|'resolved';resolution:string;by:string;at:string};
export type ModelPack={id:string;revision:number;modelId:string;versionId:string;stageId:ModelStageId;task:string;model:{id:string;key:string;title:string;world:string};definition:{id:string;title:string;output:string;checks:readonly string[]};issues:ModelIssue[];snapshot:ModelVersion;at:string};
export type ModelPin={episodeId:string;modelId:string;versionId:string;sceneIds:string;purpose:string;by:string;at:string};
export type ModelFlow={models:ModelRecord[];issues:ModelIssue[];packs:ModelPack[];pins:ModelPin[];history:{at:string;by:string;actor:'author'|'ai';action:string;modelId:string;versionId:string;stageId:string;detail:string}[]};
export type ModelWork={id:string;revision:number;modelFlow?:ModelFlow};
export class ModelFlowError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
const fail=(s:string,status=400):never=>{throw new ModelFlowError(s,status);};
function txt(v:unknown,max=6000){if(typeof v!=='string'||v.length>max)fail('模型文字格式錯誤或過長');return (v as string).trim();}
function author(a:ModelActor){if(a.kind!=='author')fail('模型正式核定、採用與問題裁定須由作者操作',403);}
export function modelFlowOf(w:ModelWork):ModelFlow{return w.modelFlow??{models:[],issues:[],packs:[],pins:[],history:[]};}
function version(w:ModelWork,modelId:unknown,versionId:unknown){const m=modelFlowOf(w).models.find(x=>x.id===modelId||x.key===modelId);if(!m)fail('找不到模型');const v=m!.versions.find(x=>x.id===versionId);if(!v)fail('找不到指定模型版本');return {m:m!,v:v!};}
function stageId(v:unknown):ModelStageId{if(!MODEL_STAGES.some(x=>x.id===v))fail('模型流程階段不存在');return v as ModelStageId;}
function locationKey(s:string){if(/^https?:\/\//i.test(s)){const u=new URL(s);u.hash='';u.search='';return decodeURIComponent(u.href).toLowerCase();}const clean=s.replace(/\\/g,'/').replace(/\/+/g,'/').toLowerCase(),parts:string[]=[];for(const segment of clean.split('/')){if(segment==='.'||!segment)continue;if(segment==='..'&&parts.length)parts.pop();else parts.push(segment);}return parts.join('/');}
function candidateSafe(flow:ModelFlow,v:ModelVersion,candidate:string){if(!/_candidate\.glb$/i.test(candidate.split(/[?#]/)[0]))fail('候選請另存為 *_candidate.glb');const key=locationKey(candidate);if(flow.models.some(m=>m.versions.some(x=>[x.sourceLocation,x.backupLocation].some(loc=>loc&&locationKey(loc)===key))))fail('候選不可覆寫任何模型原檔或備份');if(v.candidateLocation&&key!==locationKey(v.candidateLocation))fail('候選位置已鎖定；改檔請建立新候選版本');if(flow.models.some(m=>m.versions.some(x=>x.id!==v.id&&x.candidateLocation&&locationKey(x.candidateLocation)===key)))fail('候選位置已被另一版本使用，請另存新檔');}
function editable(m:ModelRecord,v:ModelVersion){if(v.stages.M08.author)fail('已採用版本保持不變，修改請建立新候選版本');}
function invalidate(v:ModelVersion,id:ModelStageId){let from=MODEL_STAGES.findIndex(x=>x.id===id);for(;from<MODEL_STAGES.length;from++){const s=v.stages[MODEL_STAGES[from].id];if(s.author){s.author=null;s.status='needs_revision';}}}
export function modelGateReasons(w:ModelWork,modelId:string,versionId:string,id:ModelStageId){const {v}=version(w,modelId,versionId),s=v.stages[id],index=MODEL_STAGES.findIndex(x=>x.id===id),reasons:string[]=[];
 if(index>0&&!v.stages[MODEL_STAGES[index-1].id].author)reasons.push('先核定 '+MODEL_STAGES[index-1].title);
 if(!s.checks.every(Boolean))reasons.push('完成本階段全部檢查');if(!s.evidence)reasons.push('填入實際產出或檢查報告位置');if(!s.summary||!s.nextStep)reasons.push('填寫已做內容與接手下一步');
 if(id==='M01'&&(!v.sourceLocation||!v.sourceVersion||!v.backupLocation||!v.sha256))reasons.push('補齊原檔版本、獨立備份與 SHA-256');
 if(id==='M02'&&!v.reference)reasons.push('補入設定及尺度來源');if(index>=3&&!v.candidateLocation)reasons.push('登記獨立候選 GLB');
 if(modelFlowOf(w).issues.some(x=>x.modelId===modelId&&x.versionId===versionId&&x.status==='open'&&(x.stageId===id||index>=6||x.kind==='major'&&index>=3)))reasons.push('處理適用的待修或待裁定問題');return reasons;
}
export const MODEL_ACTIONS=['register_model','create_model_version','acquire_model_context','save_model_stage','approve_model_stage','report_model_issue','resolve_model_issue','adopt_model_version','pin_model_version'];
export function applyModelFlowAction(work:ModelWork,action:string,a:Record<string,unknown>,actor:ModelActor,at:string){
 const f=work.modelFlow??={models:[],issues:[],packs:[],pins:[],history:[]};let m:ModelRecord|undefined,v:ModelVersion|undefined,id:ModelStageId|undefined;
 if(!MODEL_ACTIONS.includes(action))fail('未知模型流程操作');
 if(['register_model','create_model_version'].includes(action)){
  if(action==='register_model'){const key=txt(a.key,100),title=txt(a.title,200),world=txt(a.world,20);if(!key||!title||!['real','game','other'].includes(world))fail('模型識別鍵、名稱與世界分類必填');if(f.models.some(x=>x.key===key))fail('模型識別鍵已存在',409);if(f.models.length>=100)fail('模型數量已達上限');m={id:crypto.randomUUID(),key,title,world:world as ModelRecord['world'],versions:[],adoptedVersionId:null};f.models.push(m);}
  else{m=f.models.find(x=>x.id===a.modelId);if(!m)fail('找不到模型');}
  const prior=m!.versions.at(-1),label=txt(a.label,100);if(!label||m!.versions.some(x=>x.label===label))fail('請填寫不重複的候選版本標籤');
  const field=(k:keyof ModelVersion)=>txt(a[k]??prior?.[k]??'',k==='reference'?12000:2000);
  const sourceLocation=field('sourceLocation'),backupLocation=field('backupLocation'),sha256=field('sha256');if(!sourceLocation||!field('sourceVersion'))fail('原檔位置與來源版本必填');if(backupLocation&&locationKey(backupLocation)===locationKey(sourceLocation))fail('備份須使用獨立位置');if(sha256&&!/^[a-fA-F0-9]{64}$/.test(sha256))fail('SHA-256 須為64位十六進位值');
  v={id:crypto.randomUUID(),number:m!.versions.length+1,label,sourceLocation,sourceVersion:field('sourceVersion'),backupLocation,sha256,reference:field('reference'),candidateLocation:'',stages:Object.fromEntries(MODEL_STAGES.map(d=>[d.id,{checks:d.checks.map(()=>false),evidence:'',summary:'',nextStep:'',status:'todo',author:null}])) as ModelVersion['stages'],at,by:actor.name};m!.versions.push(v);
 }else{
  ({m,v}=version(work,a.modelId,a.versionId));
  if(action==='acquire_model_context'){
   id=stageId(a.stageId);const task=txt(a.task,2000);if(!task)fail('本次模型任務必填');f.packs.push({id:crypto.randomUUID(),revision:work.revision+1,modelId:m.id,versionId:v.id,stageId:id,task,model:{id:m.id,key:m.key,title:m.title,world:m.world},definition:structuredClone(MODEL_STAGES.find(x=>x.id===id)!),issues:structuredClone(f.issues.filter(x=>x.modelId===m!.id&&x.versionId===v!.id&&x.status==='open')),snapshot:structuredClone(v),at});
  }else if(action==='save_model_stage'){
   editable(m,v);id=stageId(a.stageId);
   if(actor.kind==='ai'){const p=f.packs.find(x=>x.id===a.contextPackId);if(!p||p.revision!==work.revision||p.modelId!==m.id||p.versionId!==v.id||p.stageId!==id)fail('模型工作資料包已過期或範圍不同，請重新取得',409);}
   const checks=a.checks;if(!Array.isArray(checks)||checks.length!==MODEL_STAGES.find(x=>x.id===id)!.checks.length||checks.some(x=>typeof x!=='boolean'))fail('模型檢查格式錯誤');const evidence=txt(a.evidence),summary=txt(a.summary),nextStep=txt(a.nextStep);if(!summary||!nextStep)fail('模型已做內容與下一步必填');
   const candidate=txt(a.candidateLocation??v.candidateLocation,2000);if(candidate){if(id!=='M04'&&candidate!==v.candidateLocation)fail('請在候選輸出階段登記候選位置');candidateSafe(f,v,candidate);v.candidateLocation=candidate;}
   invalidate(v,id);Object.assign(v.stages[id],{checks,evidence,summary,nextStep,status:'candidate',author:null});
  }else if(action==='approve_model_stage'){
   author(actor);editable(m,v);id=stageId(a.stageId);const reasons=modelGateReasons(work,m.id,v.id,id);if(reasons.length)fail(reasons.join('；'));if(id==='M08')fail('最後階段請使用作者採用操作');v.stages[id].author={by:actor.name,at,note:'作者確認此版本與檢查依據'};v.stages[id].status='passed';
  }else if(action==='report_model_issue'){
   id=stageId(a.stageId);const kind=txt(a.kind,30),reason=txt(a.reason);if(!['technical','visual','major'].includes(kind)||!reason)fail('問題種類與具體原因必填');f.issues.push({id:crypto.randomUUID(),modelId:m.id,versionId:v.id,stageId:id,kind:kind as ModelIssue['kind'],reason,status:'open',resolution:'',by:actor.name,at});
   if(!v.stages.M08.author)invalidate(v,id);
  }else if(action==='resolve_model_issue'){
   author(actor);const issue=f.issues.find(x=>x.id===a.issueId&&x.modelId===m!.id&&x.versionId===v!.id),resolution=txt(a.resolution);if(!issue||issue.status!=='open'||!resolution)fail('問題或修正／裁定結果不完整');issue!.status='resolved';issue!.resolution=resolution;
  }else if(action==='adopt_model_version'){
   author(actor);editable(m,v);id='M08';const reasons=modelGateReasons(work,m.id,v.id,id);if(reasons.length)fail(reasons.join('；'));v.stages.M08.author={by:actor.name,at,note:txt(a.note??'作者確認採用此候選版本')};v.stages.M08.status='passed';m.adoptedVersionId=v.id;
  }else if(action==='pin_model_version'){
   author(actor);if(!v.stages.M08.author)fail('請先確認採用模型版本');if(f.issues.some(x=>x.modelId===m!.id&&x.versionId===v!.id&&x.status==='open'))fail('此版本有未結模型問題，須先處理');const episodeId=txt(a.episodeId,100),purpose=txt(a.purpose,2000),sceneIds=txt(a.sceneIds??'',1000);if(!episodeId||!purpose)fail('引用集數與用途必填');f.pins.push({episodeId,modelId:m.id,versionId:v.id,sceneIds,purpose,by:actor.name,at});
  }
 }
 f.history.push({at,by:actor.name,actor:actor.kind,action,modelId:m!.id,versionId:v!.id,stageId:id??'',detail:action==='save_model_stage'?v!.stages[id!].summary:txt(a.reason??a.resolution??a.task??a.purpose??a.label??a.note??'',6000)});
 if(f.history.length>3000||f.packs.length>500)fail('模型紀錄已達容量，請按專案分段整理');
}
export function modelFlowView(w:ModelWork,query:Record<string,unknown>={}){
 const f=modelFlowOf(w),selected=query.modelId?f.models.filter(x=>x.id===query.modelId||x.key===query.modelId):f.models;
 return {workId:w.id,revision:w.revision,definitions:MODEL_STAGES,index:f.models.map(m=>({id:m.id,key:m.key,title:m.title,world:m.world,versions:m.versions.map(v=>({id:v.id,number:v.number,label:v.label,approved:MODEL_STAGES.filter(d=>v.stages[d.id].author).length,candidateLocation:v.candidateLocation})),adoptedVersionId:m.adoptedVersionId})),models:query.modelId?selected:[],issues:f.issues.filter(x=>(!query.modelId||selected.some(m=>m.id===x.modelId))&&(!query.versionId||x.versionId===query.versionId)),effectivePins:[...new Map(f.pins.map(x=>[[x.episodeId,x.modelId,x.sceneIds].join('|'),x])).values()].filter(x=>(!query.episodeId||x.episodeId===query.episodeId)&&(!query.modelId||selected.some(m=>m.id===x.modelId))),pins:f.pins.filter(x=>(!query.episodeId||x.episodeId===query.episodeId)&&(!query.modelId||selected.some(m=>m.id===x.modelId))),history:query.modelId?f.history.filter(x=>selected.some(m=>m.id===x.modelId)).slice(-50):[],policy:'先讀取來源與精確模型版本，再取得指定階段資料包。階段勾選與AI回報是自述，不等於實際執行模型加工、技術測試或正式採用。候選不可覆寫原檔與備份；採用只記錄選擇，不部署或替換正式GLB。各集引用固定版本，新候選不自動更新舊集。'};
}
