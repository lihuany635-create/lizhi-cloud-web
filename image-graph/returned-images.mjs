import {hash} from './core.mjs';
import {handoffRequest} from './handoff.mjs?v=28';

const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
export function returnedReference(ref){
 if(!ref||!UUID.test(ref.task_id||'')||!UUID.test(ref.candidate_id||'')||!/^[a-f0-9]{64}$/.test(ref.spec_hash||''))throw Error('回傳原圖索引無效');
 return {task_id:ref.task_id,candidate_id:ref.candidate_id,spec_hash:ref.spec_hash};
}
async function verify(bytes,version){
 if(!Number.isSafeInteger(version.byte_size)||version.byte_size<1||version.byte_size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(version.mime)||bytes.length!==version.byte_size||await hash(bytes)!==version.sha256)throw Error('回傳原圖校驗失敗');
 return bytes;
}
// Receive and review never depend on a native folder handle. Only the thumbnail
// and an authenticated, task-bound reference are persisted in the browser.
export async function prepareReturnedImage(candidate,bytes,{readImage,makeThumbnail}){
 await verify(bytes,candidate);
 const ref=returnedReference({task_id:candidate.task_id,candidate_id:candidate.id,spec_hash:candidate.spec_hash});
 const file=new File([bytes],candidate.name,{type:candidate.mime}),version=await readImage(file,'assistant_generated',false);
 if(version.sha256!==candidate.sha256||version.mime!==candidate.mime||version.byte_size!==candidate.byte_size)throw Error('回傳原圖校驗失敗');
 version.thumbnail=await makeThumbnail(file);version.returned_ref=ref;delete version.data;return version;
}
export async function readReturnedImage(version,{request=handoffRequest}={}){
 if(version.retained_ref){const ref=returnedReference(version.retained_ref),response=await request('retained/'+ref.task_id+'/'+ref.candidate_id,{binary:true});if(response.headers.get('Content-Type')!==version.mime||response.headers.get('X-Image-SHA256')!==version.sha256)throw Error('正式素材校驗標頭不符');return verify(new Uint8Array(await response.arrayBuffer()),version)}
 const ref=returnedReference(version.returned_ref),base='tasks/'+ref.task_id+'/candidates';
 const {candidates}=await request(base),candidate=candidates.find(c=>c.id===ref.candidate_id);
 if(!candidate||candidate.task_id!==ref.task_id||candidate.spec_hash!==ref.spec_hash||candidate.sha256!==version.sha256||candidate.byte_size!==version.byte_size||candidate.mime!==version.mime)throw Error('找不到符合此任務的回傳原圖，請更新回傳狀態');
 const response=await request(base+'/'+ref.candidate_id+'/image',{binary:true});
 if(response.headers.get('Content-Type')!==version.mime||response.headers.get('X-Image-SHA256')!==version.sha256)throw Error('回傳原圖校驗標頭不符');
 return verify(new Uint8Array(await response.arrayBuffer()),version);
}
export async function saveReturnedImage(version,location,{sourceFolders,read=readReturnedImage}){
 const ref=returnedReference(version.returned_ref),bytes=await verify(await read(version),version);
 const candidate={...version,id:ref.candidate_id};
 const fs_ref=await sourceFolders.saveCandidate(location,candidate,bytes);
 return {...version,fs_ref};
}

export async function retainReturnedImage(version,{request=handoffRequest}={}){
 if(version.retained_ref)return version;const ref=returnedReference(version.returned_ref);
 const result=await request('tasks/'+ref.task_id+'/candidates/'+ref.candidate_id+'/retain',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({spec_hash:ref.spec_hash,sha256:version.sha256,mime:version.mime,byte_size:version.byte_size})});
 if(result.spec_hash!==ref.spec_hash||result.sha256!==version.sha256||result.mime!==version.mime||result.byte_size!==version.byte_size)throw Error('正式素材保存回應不符');
 return {...version,retained_ref:ref};
}
