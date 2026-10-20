import {ownsHandoff} from './handoff.mjs?v=28';
import {imagePreview} from './original-store.mjs?v=28';
import {deletedTasks,taskStatusLabel} from './task-actions.mjs';

export function taskListHTML(project,esc,outputInLibrary){
 return project.runs.map(run=>{
  const cancelled=run.status==='cancelled',disabled=cancelled?'disabled':'',h=ownsHandoff(project,run)?run.handoff:null,sent=h?.status==='received';
  const handoff=h?`${sent?'已交接':'交接未完成'} · ${h.acknowledged_at?'助手已讀':'尚待助手讀取'}${h.pending_controls?.length?' · 狀態待同步':''}`:'尚未傳送給助手';
  const label=cancelled?'已取消':run.outputs.length?taskStatusLabel(run):sent?'等待助手回傳':'待傳送';
  return `<article class="run-card ${cancelled?'task-cancelled':''}">
   <div class="run-top"><h3>${esc(run.spec.shot_id||run.spec.shot)} <small>${esc(run.spec.output.aspect_ratio)}</small></h3><span class="status-pill">${esc(label)}</span></div>
   <p class="run-meta">${esc(new Date(run.created_at).toLocaleString('zh-TW'))} · ${run.spec.references.length} 張參考</p>
   ${run.output_source?`<p class="run-meta">原設定保存位置：${esc([run.output_source.root_name,...run.output_source.path].join(' / '))}；回傳預覽不需連接此位置。</p>`:''}<p class="run-instruction">${esc(run.spec.instruction)}</p><p class="handoff-state">${esc(handoff)}</p>
   ${h?.error||h?.control_error?`<p class="task-error" role="status">${esc(h.control_error||h.error)}</p>`:''}
   ${cancelled?'<p class="task-cancelled-note">此任務已取消，恢復後可繼續製作與驗收。</p>':''}
   <div class="run-actions">
    ${!sent&&!cancelled?`<button data-send-task="${run.id}" class="primary">${h?'重試傳送':'傳送給助手'}</button>`:''}
    ${cancelled?`<button data-task-resume="${run.id}" class="primary">恢復任務</button>`:`<button data-import="${run.id}">手動匯入候選</button>`}
    <button data-details="${run.id}">查看任務規格</button>${h?.error||h?.control_error?`<button data-connect-source="${run.id}">連接圖片資料夾</button>`:''}
    <details class="action-details"><summary>更多操作</summary><div class="inline-actions">
     ${sent?`<button data-send-task="${run.id}" ${disabled}>重試交接</button>`:''}
     <button data-redownload="${run.id}" ${disabled}>下載 ZIP 備用包</button>
     ${!cancelled?`<button data-task-cancel="${run.id}">取消任務</button>`:''}
     <button data-task-delete="${run.id}" class="danger">刪除任務</button>
    </div></details>
   </div>
   ${run.outputs.length?`<div class="outputs">${run.outputs.map(output=>`<div class="output-card">
    <img src="${esc(imagePreview(output.version))}" alt="${esc(output.version.name)}">
    <p>${esc(output.version.name)}<br>${output.provenance==='assistant_generated'?'助手回傳':'人工匯入'} · ${output.decision==='accepted'?'✓ 已核定':output.decision==='rejected'?'已退回':'待驗收'}</p>
    ${output.version.returned_ref?`<p class="run-meta">${output.version.fs_ref?'原圖已存入裝置：'+esc([output.version.fs_ref.root_name,...output.version.fs_ref.path].join(' / ')):'已收到回傳，可直接查看與驗收；尚未存入裝置資料夾。'}</p><button data-save-returned="${output.id}" ${disabled}>${output.version.fs_ref?'另存到其他資料夾':'存入裝置資料夾'}</button>`:''}
    ${output.generation_note?`<p class="run-meta">製作備註：${esc(output.generation_note)}</p>`:''}
    <textarea aria-label="驗收問題" data-issues="${output.id}" placeholder="需要修改的地方（退回前填寫）" ${disabled}>${esc(output.issues)}</textarea>
    <div class="inline-actions"><button data-compare="${output.id}">比對參考</button><button data-accept="${output.id}" class="${output.decision==='pending'?'primary':''}" ${cancelled||output.decision==='accepted'?'disabled':''}>核定</button><button data-reject="${output.id}" ${cancelled||output.decision==='rejected'?'disabled':''}>退回</button>
    ${output.decision==='accepted'?`<button data-promote="${output.id}" ${cancelled||outputInLibrary(output)?'disabled':''}>${outputInLibrary(output)?'已加入素材庫':'轉為正式參考'}</button>`:''}</div>
    <details class="action-details"><summary>圖片操作</summary><div class="inline-actions"><button data-original-output="${output.id}">查看原圖</button><button data-discard-output="${output.id}" class="danger" ${disabled}>移除候選</button></div></details>
   </div>`).join('')}</div>`:''}
  </article>`;
 }).join('')||'<div class="empty-state">還沒有任務<br><small>先在畫布加入參考、填寫條件，再按「傳送任務」。</small></div>';
}
export function deletedTaskListHTML(project,esc){
 return deletedTasks(project).map(entry=>`<article class="project-card"><div><strong>${esc(entry.run.spec.shot_id||entry.run.spec.shot||'任務')}</strong><p>${esc(entry.run.spec.instruction)}<br>刪除於 ${esc(new Date(entry.deleted_at).toLocaleString('zh-TW'))} · ${entry.run.outputs.length} 張候選圖${ownsHandoff(project,entry.run)&&entry.run.handoff.pending_controls?.length?' · 狀態待同步，請按「接收回傳」':''}</p></div><button data-task-restore="${entry.run.id}">復原任務</button></article>`).join('')||'<p>目前沒有已刪除任務。</p>';
}
