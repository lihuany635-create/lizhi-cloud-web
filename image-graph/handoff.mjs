import {uid,hash,stable} from './core.mjs';
import {allProjectRuns,assertTaskActive} from './task-actions.mjs';
import {appendCloudCandidate,candidateReceived} from './cloud-candidates.mjs';
import {apiFetch} from './api-transport.mjs?v=26';

export const HANDOFF_LIMITS={imageBytes:10*1024*1024,totalBytes:24*1024*1024,references:8};
export async function handoffRequest(path,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const response=await apiFetch('/api/handoff/'+path,{...options,credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal});
  if(!response.ok){let message='任務交接失敗（'+response.status+'）';try{message=(await response.json()).error||message}catch{}throw Object.assign(Error(message),{status:response.status})}
  if(options.binary)return response;
  if(!response.headers.get('Content-Type')?.includes('application/json'))throw Error('登入狀態需要更新，請從「帳號」重新登入後重試');
  return await response.json();
 }catch(e){if(e.name==='AbortError')throw Error('交接逾時，任務已保留，請按重試傳送');throw e}
 finally{clearTimeout(timer)}
}
const jsonOptions=(method,value)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
async function saved(save){if(!await save())throw Error('任務尚未保存，請先處理本機保存問題再重試')}
export function ownsHandoff(project,run){return !!run.handoff&&run.handoff.project_id===project.id&&run.handoff.spec_hash===run.spec_hash}
export async function reconcileHandoff({project,run,save,request=handoffRequest}){
 if(!ownsHandoff(project,run))return null;
 const h=run.handoff;let task;
 try{task=await request('tasks/'+h.task_id)}catch(e){if(e.status===404)return null;throw e}
 if(task.id!==h.task_id||task.spec_hash!==run.spec_hash||await hash(stable(task.spec))!==run.spec_hash||task.status!=='received')throw Error('交接任務與本機規格不符');
 h.status='received';h.sent_at??=task.created_at;h.acknowledged_at=task.acknowledgement?.created_at??null;h.checked_at=new Date().toISOString();delete h.error;
 await saved(save);return task;
}
export function queueHandoffControl(project,run,state){
 if(!ownsHandoff(project,run))return false;
 const h=run.handoff,queue=h.pending_controls??=[];
 if((queue.at(-1)?.state??h.control_state??'active')===state)return false;
 queue.push({revision:(queue.at(-1)?.revision??h.control_revision??0)+1,state});return true;
}
export async function syncHandoffControl({project,run,save,request=handoffRequest}){
 if(!ownsHandoff(project,run))return;
 const h=run.handoff;
 for(const next of [...h.pending_controls??[]]){
  try{
   const result=await request('tasks/'+h.task_id+'/control',jsonOptions('PUT',next));
   if(result.revision!==next.revision||result.state!==next.state)throw Error('任務狀態回應不符');
   h.control_revision=next.revision;h.control_state=next.state;h.pending_controls.shift();delete h.control_error;await saved(save);
  }catch(e){h.control_error=e.message;await save();throw e}
 }
}
export async function sendHandoffTask({project,run,readOriginal,save,request=handoffRequest}){
 assertTaskActive(project,run.id);
 if(await hash(stable(run.spec))!==run.spec_hash)throw Error('固定規格校驗失敗');
 const refs=run.spec.references;
 if(!refs.length||refs.length>HANDOFF_LIMITS.references)throw Error('每個交接任務需包含 1～8 張參考圖');
 const existing=ownsHandoff(project,run);
 if(!existing)run.handoff={task_id:uid(),project_id:project.id,spec_hash:run.spec_hash,status:'pending',control_revision:0,control_state:'active',pending_controls:[]};
 const h=run.handoff;
 // Save the delivery ID before network I/O: retries after a lost response reuse it.
 await saved(save);
 try{
  await syncHandoffControl({project,run,save,request});
  // A previous POST may have succeeded even when its response was lost. Check
  // the immutable delivery before requiring originals or uploading again.
  if(existing){const remote=await reconcileHandoff({project,run,save,request});if(remote)return remote}
  const images=new Map();let total=0;
  // Verify every required original before uploading any. Thumbnails never substitute.
  for(const ref of refs){
   const version=project.versions.find(v=>v.id===ref.asset_version_id);
   if(!version||version.sha256!==ref.sha256||version.mime!==ref.mime)throw Error('固定參考版本遺失或不符');
   if(images.has(ref.sha256))continue;
   const data=await readOriginal(project,version);
   if(!data.length||data.length>HANDOFF_LIMITS.imageBytes)throw Error('交接參考圖每張最多 10 MiB');
   if(await hash(data)!==ref.sha256)throw Error('參考原圖校驗失敗，已停止傳送');
   total+=data.length;if(total>HANDOFF_LIMITS.totalBytes)throw Error('每個交接任務的參考圖合計最多 24 MiB，請減少參考圖');
   images.set(ref.sha256,{data,mime:ref.mime});
  }
  for(const [sha,image] of images)await request('images/'+sha,{method:'PUT',headers:{'Content-Type':image.mime},body:image.data});
  const result=await request('tasks',jsonOptions('POST',{run_id:h.task_id,spec_hash:run.spec_hash,spec:run.spec}));
  if(result.id!==h.task_id||result.spec_hash!==run.spec_hash||result.status!=='received')throw Error('任務交接回應與固定規格不符');
  h.status='received';h.sent_at??=new Date().toISOString();delete h.error;await saved(save);
  return result;
 }catch(e){h.error=e.message;await save();throw e}
}

export async function receiveHandoffTasks({project,readCandidate,save,totalBytes,maxBytes,request=handoffRequest}){
 let added=0;
 for(const run of allProjectRuns(project))if(ownsHandoff(project,run))await syncHandoffControl({project,run,save,request});
 for(const run of project.runs){
  if(run.status==='cancelled'||!ownsHandoff(project,run))continue;
  const h=run.handoff,task=await reconcileHandoff({project,run,save,request});
  if(!task){if(h.status==='received')throw Error('先前交接的任務目前找不到，請重試交接');continue}
  const {candidates}=await request('tasks/'+h.task_id+'/candidates');
  for(const candidate of candidates){
   if(candidate.task_id!==h.task_id||candidate.spec_hash!==run.spec_hash)throw Error('候選圖任務識別碼或規格不符');
   if(candidateReceived(run,candidate.id)){
    const existing=run.outputs.find(o=>o.cloud_candidate_id===candidate.id);
    if(existing&&!existing.version.returned_ref){
     const version=existing.version;
     if(version.sha256!==candidate.sha256||version.mime!==candidate.mime||version.byte_size!==candidate.byte_size)throw Error('既有候選與回傳原圖校驗不符');
     version.returned_ref={task_id:h.task_id,candidate_id:candidate.id,spec_hash:run.spec_hash};
     if(!await save()){delete version.returned_ref;throw Error('候選圖位置索引尚未保存，請重試接收')}
    }
    continue;
   }
   if(!Number.isInteger(candidate.byte_size)||candidate.byte_size<=0||candidate.byte_size>HANDOFF_LIMITS.imageBytes||!['image/png','image/jpeg','image/webp'].includes(candidate.mime))throw Error('候選圖格式或大小不符');
   if(totalBytes()+candidate.byte_size>maxBytes())throw Error('候選已回傳，但專案空間不足；圖片仍保留於交接區');
   const response=await request('tasks/'+h.task_id+'/candidates/'+candidate.id+'/image',{binary:true});
   if(response.headers.get('Content-Type')!==candidate.mime||response.headers.get('X-Image-SHA256')!==candidate.sha256)throw Error('候選圖校驗標頭不符');
   const data=new Uint8Array(await response.arrayBuffer());
   if(data.length!==candidate.byte_size||await hash(data)!==candidate.sha256)throw Error('候選原圖校驗失敗');
   const version=await readCandidate(candidate,data);
   assertTaskActive(project,run.id);
   if(totalBytes()+version.byte_size>maxBytes())throw Error('專案空間不足；候選圖仍保留於交接區');
   const before={outputs:[...run.outputs],receipts:[...run.cloud_candidate_receipts??[]],status:run.status};
   if(appendCloudCandidate(run,{...candidate,task_id:run.id},version)){
    if(!await save()){run.outputs=before.outputs;run.cloud_candidate_receipts=before.receipts;run.status=before.status;throw Error('候選圖尚未保存，請處理本機儲存問題後再接收')}
    added++;
   }
  }
 }
 return added;
}
