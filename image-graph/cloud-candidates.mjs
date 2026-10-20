export function candidateReceived(run,candidateId){return run.outputs.some(o=>o.id===candidateId)||(run.cloud_candidate_receipts??[]).includes(candidateId)}
export function appendCloudCandidate(run,candidate,version){
 if(candidate.task_id!==run.id||candidate.spec_hash!==run.spec_hash)throw Error('回傳候選與此任務規格不符');
 if(candidateReceived(run,candidate.id))return false;
 if(version.sha256!==candidate.sha256||version.mime!==candidate.mime||version.byte_size!==candidate.byte_size)throw Error('候選原圖校驗失敗');
 run.outputs.push({id:candidate.id,version:{...version,id:candidate.id,source:'assistant_generated'},provenance:'assistant_generated',cloud_candidate_id:candidate.id,generation_note:candidate.note||'',decision:'pending',issues:'',reviews:[]});
 (run.cloud_candidate_receipts??=[]).push(candidate.id);run.status='needs_review';return true;
}

export async function receiveCloudCandidates({getProject,isBusy,listCandidates,readCandidate,maxBytes,totalBytes,save,onAdded=()=>{},taskId=null}){
 const initial=getProject();if(!initial||isBusy())return 0;
 const projectId=initial.id,targets=initial.runs.filter(r=>r.cloud?.status==='received'&&(!taskId||r.id===taskId)).slice(0,20).map(r=>({id:r.id,spec_hash:r.spec_hash}));let added=0;
 const currentRun=target=>{const p=getProject();return !isBusy()&&p?.id===projectId?p.runs.find(r=>r.id===target.id&&r.spec_hash===target.spec_hash):null};
 for(const target of targets){
  const {candidates}=await listCandidates(target.id);
  for(const candidate of candidates){
   let run=currentRun(target);if(!run)return added;
   if(candidateReceived(run,candidate.id))continue;
   if(totalBytes()+candidate.byte_size>maxBytes)throw Error('收到新候選，但專案容量不足；圖片仍保留在雲端');
   const version=await readCandidate(target.id,candidate);
   run=currentRun(target);if(!run)return added;
   if(candidateReceived(run,candidate.id))continue;
   if(totalBytes()+version.byte_size>maxBytes)throw Error('專案容量不足，候選原圖仍保留在雲端');
   if(appendCloudCandidate(run,candidate,version)){if(!await save())throw Error('候選已讀取，但本機保存失敗，請下載備份');added++;onAdded()}
  }
 }
 return added;
}
