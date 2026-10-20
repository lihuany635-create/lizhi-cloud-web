const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const deletedTasks=project=>project.task_trash??[];
export const allProjectRuns=project=>[...project.runs,...deletedTasks(project).map(entry=>entry.run)];
export function validateTaskCollections(project){
 if(!Array.isArray(project.runs)||!Array.isArray(deletedTasks(project))||project.runs.length+deletedTasks(project).length>500)throw Error('任務與已刪除任務合計最多 500 筆');
 for(const entry of deletedTasks(project))if(!entry?.run||!Number.isFinite(Date.parse(entry.deleted_at))||!Number.isInteger(entry.index)||entry.index<0)throw Error('已刪除任務紀錄無效');
 const runs=allProjectRuns(project),ids=new Set(),outputs=new Set();
 for(const run of runs){
  if(!run||!UUID.test(run.id)||ids.has(run.id)||!run.spec||!Array.isArray(run.outputs))throw Error('任務識別碼或資料無效');
  ids.add(run.id);
  for(const output of run.outputs){if(!output||!UUID.test(output.id)||outputs.has(output.id)||!output.version)throw Error('候選圖識別碼或資料無效');outputs.add(output.id)}
 }
 return runs;
}
export function assertTaskActive(project,runId){
 const run=project.runs.find(run=>run.id===runId);
 if(!run)throw Error('找不到任務，可能已移到「已刪除任務」');
 if(run.status==='cancelled')throw Error('任務已取消，請先恢復任務');
 return run;
}
export function assertTaskExportable(project,run,newTask=false){
 if(!newTask)return assertTaskActive(project,run?.id);
 if(!run||run.status==='cancelled'||run.spec?.project_id!==project.id||allProjectRuns(project).some(item=>item.id===run.id))throw Error('新任務無法匯出，請重新建立');
 return run;
}
function audit(run,action,at){if(!Array.isArray(run.lifecycle_events))run.lifecycle_events=[];run.lifecycle_events.push({action,created_at:at})}
export function cancelTask(project,runId,at=new Date().toISOString()){
 const run=project.runs.find(run=>run.id===runId);if(!run)throw Error('找不到任務');
 if(run.status==='cancelled')return false;
 run.status_before_cancel=run.status;run.status='cancelled';run.cancelled_at=at;audit(run,'cancelled',at);return true;
}
export function resumeTask(project,runId,at=new Date().toISOString()){
 const run=project.runs.find(run=>run.id===runId);if(!run)throw Error('找不到任務');
 if(run.status!=='cancelled')return false;
 run.status=run.status_before_cancel||(!run.outputs.length?'awaiting_import':run.outputs.every(o=>o.decision!=='pending')?'reviewed':'needs_review');
 delete run.status_before_cancel;delete run.cancelled_at;audit(run,'resumed',at);return true;
}
export function deleteTask(project,runId,at=new Date().toISOString()){
 const index=project.runs.findIndex(run=>run.id===runId);if(index<0)throw Error('找不到任務');
 if(deletedTasks(project).some(entry=>entry.run.id===runId))throw Error('已刪除任務中有相同識別碼');
 const run=project.runs[index];
 project.task_trash=[{run,deleted_at:at,index},...deletedTasks(project)];
 project.runs=project.runs.filter(item=>item.id!==runId);
 return run;
}
export function restoreTask(project,runId){
 const entry=deletedTasks(project).find(entry=>entry.run.id===runId);if(!entry)throw Error('找不到已刪除任務');
 if(project.runs.some(run=>run.id===runId))throw Error('目前清單中已有相同任務，已停止復原');
 project.runs.splice(Math.min(entry.index,project.runs.length),0,entry.run);
 project.task_trash=deletedTasks(project).filter(item=>item.run.id!==runId);
 return entry.run;
}
export function taskStatusLabel(run){
 if(run.status==='cancelled')return '已取消';
 const accepted=run.outputs.filter(output=>output.decision==='accepted').length;
 return run.outputs.length?'已核定 '+accepted+' / '+run.outputs.length:'等待匯入成果';
}
