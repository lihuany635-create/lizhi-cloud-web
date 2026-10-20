export async function cloudRequest(path,options={}){const response=await fetch('/api/cloud/'+path,{credentials:'same-origin',...options});let body;try{body=await response.json()}catch{throw Error('雲端回應無法讀取，請確認已登入工作台')}if(!response.ok){const error=Error(body.error||'雲端交接失敗');error.status=response.status;throw error}return body}
export const cloudStatus=()=>cloudRequest('status');
export const listCloudTasks=(cursor,projectId)=>cloudRequest('tasks?'+new URLSearchParams({...cursor?{cursor}:{},...projectId?{project_id:projectId}:{}}));
export const getCloudTask=id=>cloudRequest('tasks/'+encodeURIComponent(id));
export async function uploadCloudImage(version,bytes){return cloudRequest('images/'+version.sha256,{method:'PUT',headers:{'Content-Type':version.mime},body:bytes})}
export const submitCloudTask=run=>cloudRequest('tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({run_id:run.id,spec_hash:run.spec_hash,spec:run.spec})});
export async function getCloudImage(id,index){const response=await fetch('/api/cloud/tasks/'+encodeURIComponent(id)+'/images/'+index,{credentials:'same-origin'});if(!response.ok){let data;try{data=await response.json()}catch{}throw Error(data?.error||'參考圖讀取失敗')}return response.blob()}

export const listCloudProjects=cursor=>cloudRequest('projects'+(cursor?'?cursor='+encodeURIComponent(cursor):''));
export const getCloudProject=id=>cloudRequest('projects/'+encodeURIComponent(id));
export const putCloudProject=(project,etag)=>cloudRequest('projects/'+encodeURIComponent(project.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,base_etag:etag||null})});
export async function getCloudProjectImage(id,sha){const response=await fetch('/api/cloud/projects/'+encodeURIComponent(id)+'/images/'+sha,{credentials:'same-origin'});if(!response.ok)throw Error('專案原圖讀取失敗');return response.blob()}

export const listCloudCandidates=id=>cloudRequest('tasks/'+encodeURIComponent(id)+'/candidates');
export async function getCloudCandidateImage(taskId,candidateId){const response=await fetch('/api/cloud/tasks/'+encodeURIComponent(taskId)+'/candidates/'+encodeURIComponent(candidateId)+'/image',{credentials:'same-origin'});if(!response.ok)throw Error('候選原圖讀取失敗');return response.blob()}
