import {directoryProject} from './original-store.mjs?v=17';

// Do not reuse the old remembered picker ID: its previous directory may no
// longer exist. A user can explicitly start again from the documents location.
export const pickOriginalRoot=(scope,fresh=false)=>scope.showDirectoryPicker({mode:'readwrite',...(fresh?{startIn:'documents'}:{})});
export function originalStorageError(error,phase,inline=false){
 const reasons={
  NotFoundError:phase==='picker'?'系統無法開啟資料夾選擇器或原先記住的位置。請按「重新開啟資料夾選擇器」，選擇裝置內部儲存空間中實際存在的資料夾。':'系統找不到選取的資料夾，請重新選擇裝置內部儲存空間中的資料夾。',
  NotAllowedError:'未取得資料夾存取權限，請重新選擇並授權。',
  SecurityError:'瀏覽器未允許開啟資料夾，請在瀏覽器中直接開啟網站後再按一次。',
  NotSupportedError:'這個瀏覽器無法提供資料夾讀寫，請改用支援此功能的瀏覽器。',
  QuotaExceededError:'可用儲存空間不足，請釋放空間後再試。',
  AbortError:'操作已中止，可重新選擇資料夾再試。'
 };
 const message=error.code==='original_io'?error.message:reasons[error.name]||error.message||'資料夾操作未完成，請重新選擇後再試。';
 return (phase==='picker'?'選取資料夾失敗：':phase==='move'?'更換儲存位置未完成：':'資料夾搬移／連接未完成：')+message+(phase==='move'?' 本次未切換儲存位置，原資料夾檔案仍保留；可重試搬移或另選新位置。':inline?' 尚未切換儲存位置，瀏覽器中的原圖仍保留；請勿清除網站資料。':'');
}
export function createOriginalStorageUI({getProject,getStore,repository,applyProject,runExclusive,toast,modal,esc,scope=window}){
 const $=s=>document.querySelector(s);let generation=0,root=null,status='瀏覽器保存';
 const supported=()=>scope.isSecureContext&&typeof scope.showDirectoryPicker==='function';
 function update(){const p=getProject();$('#originalStorageStatus').textContent=directoryProject(p)?status:'瀏覽器保存 · 可改用資料夾';}
 async function restore(){
  const token=++generation,p=getProject();root=null;status='正在讀取原圖位置…';update();
  if(!directoryProject(p))return;
  try{const saved=await getStore().getSetting('originalFolder:'+p.image_storage.key);if(p!==getProject()||token!==generation)return;const granted=saved&&await saved.queryPermission({mode:'readwrite'})==='granted';if(p!==getProject()||token!==generation)return;root=saved;status=granted?'資料夾已授權 · 可檢查原圖':'需要重新連接原圖資料夾'}catch{if(token!==generation)return;status='需要重新連接原圖資料夾'}update();
 }
 function show(){
  const p=getProject();if(!p)return;let selectedRoot=null,moveTarget=null,working=false;
  modal('原圖儲存位置',`<p>${directoryProject(p)?'原圖保存在你授權的資料夾；瀏覽器只留分類、索引與縮圖。':'目前原圖存在瀏覽器。改用資料夾後，先逐張寫入並讀回核對，全部成功後才移除瀏覽器內的完整原圖。'}</p><p>原圖資料夾：<strong>${esc(p.image_storage?.folder_name||'尚未設定')}</strong></p><p>資料夾模式不設專案原圖總量上限；單張仍最多 10 MiB，並受裝置剩餘空間影響。請保留所選資料夾中的「映構原圖」與「映構索引」。</p>${!supported()?'<div class="check-row warning">此瀏覽器不支援資料夾授權；目前資料維持原有保存方式。請改用支援此功能的瀏覽器。</div>':''}<p>${directoryProject(p)?'請選回原本存有「映構原圖」與「映構索引」的資料夾；重新連接時，請勿改選新建的空資料夾。':'建議選擇「內部儲存空間 → Documents」內自行建立的資料夾。'}若系統找不到位置，可按下方按鈕重新開啟選擇器。</p><div class="device-sync-actions"><button id="chooseOriginalRoot" class="${root?'':'primary'}" ${supported()?'':'disabled'}>${directoryProject(p)?'選擇原資料夾並重新連接':'選擇原圖資料夾並安全搬移'}</button><button id="freshOriginalRoot" hidden ${supported()?'':'disabled'}>重新開啟資料夾選擇器</button><button id="retryOriginalRoot" hidden>重試剛選取的資料夾</button>${root?`<button id="authorizeOriginalRoot" ${status.startsWith('需要')?'class="primary"':'hidden'}>授權原資料夾並繼續</button>`:''}${directoryProject(p)?`<button id="checkOriginals" class="${root&&!status.startsWith('需要')?'primary':''}">檢查目前原圖</button>`:''}</div>${directoryProject(p)?'<details class="original-move-section form-details"><summary>更換儲存位置</summary><p>將目前專案的素材、候選圖與歷史原圖複製到新資料夾，全部核對並保存索引後才切換。舊資料夾會保留，其他專案仍使用各自的位置。搬移期間請保持頁面開啟；中斷後可再選相同的新資料夾重試。</p><button id="moveOriginalRoot" class="primary">選擇新位置並安全搬移</button> <button id="retryMoveOriginalRoot" hidden>重試搬移到剛選的新位置</button></details>':''}<div id="originalStorageProgress" role="status" class="check-row">${esc(status)}</div><div id="originalStorageDetails"></div><div id="originalRepairPanel" hidden><p>若資料夾選錯，請先選回原本的位置。若仍未通過核對，可選入原始圖片復原；可一次多選，名稱可以不同，但內容必須與原始紀錄完全一致。截圖、縮圖或重新壓縮的圖片無法代替原圖。復原會另存新檔，保留現有檔案。</p><button id="repairOriginals" class="primary">選擇原始圖片並安全復原</button><input id="repairOriginalFiles" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" multiple hidden></div><details class="form-details"><summary>儲存與備份說明</summary><p>未連接時仍可瀏覽縮圖；傳送任務、查看原圖及新增圖片需要原資料夾。「備份專案」保存資料夾索引；換裝置需連同原圖資料夾一起保留。</p></details>`);
  const progress=(done,total,message)=>{const el=$('#originalStorageProgress');if(el)el.textContent=message||'正在寫入並核對 '+done+' / '+total+' 張，請保持頁面開啟…'};
  const buttons=['chooseOriginalRoot','freshOriginalRoot','retryOriginalRoot',...(root?['authorizeOriginalRoot']:[]),...(directoryProject(p)?['checkOriginals','repairOriginals','moveOriginalRoot','retryMoveOriginalRoot']:[])];
  function busy(value){working=value;for(const id of buttons){const el=$('#'+id);if(el)el.disabled=value||!supported()}}
  function report(e,phase){
   if(phase==='picker')$('#freshOriginalRoot').hidden=false;
   if(root&&['NotAllowedError','SecurityError'].includes(e.name))$('#authorizeOriginalRoot').hidden=false;
   const message=originalStorageError(e,phase,!directoryProject(p)),el=$('#originalStorageProgress');if(el)el.textContent=message;
   const details=$('#originalStorageDetails'),panel=$('#originalRepairPanel');
   if(e.report&&details&&panel){
    const result=e.report;details.innerHTML=`<p>已檢查 ${result.total} 份原圖；通過 ${result.valid} 份，未通過 ${result.issues.length} 份。</p><ul class="original-check-list">${result.issues.map(x=>`<li><strong>${esc(x.name)}</strong><br>${x.code==='original_missing'?'找不到原圖檔案':x.actual_bytes===0?'檔案為空（0 bytes）':x.actual_bytes!==x.expected_bytes?'檔案大小不符':'檔案大小相同，內容雜湊不符'}<br>原始紀錄 ${esc(x.expected_bytes)} bytes；目前 ${x.actual_bytes===null?'找不到檔案':esc(x.actual_bytes)+' bytes'}<details><summary>查看檔案位置與核對值</summary><div>${esc(x.path)}</div><div>原始 SHA-256：${esc(x.expected_sha256)}</div><div>目前 SHA-256：${esc(x.actual_sha256||'未取得')}</div></details></li>`).join('')}</ul>`;
    panel.hidden=!result.issues.length||phase==='move'&&e.move_phase!=='source';
   }
   toast(message,true);
  }
  async function use(selected){
   await runExclusive(async()=>{
    if(p!==getProject())throw Error('專案已切換，請重新操作');
    if(directoryProject(p)){await repository.reconnect(p,selected,{onProgress:progress});root=selected;status='原圖在資料夾';update();$('#modal').close();toast('原圖資料夾已重新連接，內容驗證完成')}
    else{const next=await repository.migrate(p,selected,{onProgress:progress});root=selected;status='原圖在資料夾';applyProject(next);update();$('#modal').close();toast('已改用資料夾儲存原圖，專案總量上限已解除')}
   });
  }
  async function choose(fresh=false){
   if(working)return;busy(true);let phase='picker';
   try{const selected=await pickOriginalRoot(scope,fresh);selectedRoot=selected;$('#retryOriginalRoot').hidden=false;phase='migration';await use(selected)}
   catch(e){if(e.name!=='AbortError'||phase!=='picker')report(e,phase)}finally{busy(false)}
  }
  if(directoryProject(p)){
   function clearMoveDetails(){const details=$('#originalStorageDetails'),panel=$('#originalRepairPanel');if(details)details.innerHTML='';if(panel)panel.hidden=true}
   async function moveTo(target){
    clearMoveDetails();
    await runExclusive(async()=>{
     if(p!==getProject())throw Error('專案已切換，請重新操作');
     const source=await repository.rootFor(p,'read');selectedRoot=source;
     const result=await repository.relocate(p,target,{sourceRoot:source,onProgress:progress});
     applyProject(result.project);root=target;status='原圖在資料夾';update();$('#modal').close();toast('已安全更換儲存位置，'+result.copied+' 份原圖全部核對通過；舊資料夾保留');
    });
   }
   $('#moveOriginalRoot').onclick=async()=>{
    if(working)return;busy(true);let phase='picker';
    try{const target=await pickOriginalRoot(scope,true);moveTarget=target;const retry=$('#retryMoveOriginalRoot');retry.hidden=false;retry.textContent='重試搬移至「'+target.name+'」';phase='move';await moveTo(target)}
    catch(e){if(e.name!=='AbortError'||phase!=='picker')report(e,phase)}finally{busy(false)}
   };
   $('#retryMoveOriginalRoot').onclick=async()=>{
    if(working||!moveTarget)return;busy(true);
    try{
     if(root&&await root.requestPermission({mode:'readwrite'})!=='granted')throw new DOMException('denied','NotAllowedError');
     if(await moveTarget.requestPermission({mode:'readwrite'})!=='granted')throw new DOMException('denied','NotAllowedError');
     await moveTo(moveTarget);
    }catch(e){report(e,'move')}finally{busy(false)}
   };
   async function authorizedTarget(){
    const target=selectedRoot||root;if(!target)throw Error('請先選擇存有原圖的原資料夾');
    if(await target.requestPermission({mode:'readwrite'})!=='granted')throw new DOMException('denied','NotAllowedError');
    selectedRoot=target;return target;
   }
   $('#checkOriginals').onclick=async()=>{if(working)return;busy(true);try{await use(await authorizedTarget())}catch(e){report(e,'migration')}finally{busy(false)}};
   $('#repairOriginals').onclick=()=>{if(!working)$('#repairOriginalFiles').click()};
   $('#repairOriginalFiles').onchange=async event=>{
    const files=Array.from(event.target.files||[]);event.target.value='';if(working||!files.length)return;busy(true);
    try{const target=await authorizedTarget();await runExclusive(async()=>{
     if(p!==getProject())throw Error('專案已切換，請重新操作');
     const result=await repository.repair(p,target,files,{onProgress:progress});applyProject(result.project);root=target;status='原圖在資料夾';update();$('#modal').close();toast('已復原 '+result.repaired+' 份原圖，全部原圖核對通過；原有檔案保留');
    })}catch(e){report(e,'migration')}finally{busy(false)}
   };
  }
  $('#chooseOriginalRoot').onclick=()=>choose();
  $('#freshOriginalRoot').onclick=()=>choose(true);
  $('#retryOriginalRoot').onclick=async()=>{if(working||!selectedRoot)return;busy(true);try{if(await selectedRoot.requestPermission({mode:'readwrite'})!=='granted')throw new DOMException('denied','NotAllowedError');await use(selectedRoot)}catch(e){report(e,'migration')}finally{busy(false)}};
  if(root)$('#authorizeOriginalRoot').onclick=async()=>{if(working)return;busy(true);try{if(await root.requestPermission({mode:'readwrite'})!=='granted')throw new DOMException('denied','NotAllowedError');await use(root)}catch(e){report(e,'migration')}finally{busy(false)}};
 }
 async function importManifest(input){
  modal('匯入資料夾專案',`<p>這是資料夾專案索引，必須搭配原本的「映構原圖」資料夾。將逐張核對後新增為另一個專案。</p><button id="importOriginalIndex" class="primary" ${supported()?'':'disabled'}>選擇存有「映構原圖」的資料夾並匯入</button><div id="originalStorageProgress" role="status"></div>`);
  $('#importOriginalIndex').onclick=async()=>{const button=$('#importOriginalIndex');if(button.disabled)return;button.disabled=true;let phase='picker';try{const selected=await pickOriginalRoot(scope);phase='migration';await runExclusive(async()=>{const next=await repository.importIndex(input,selected);applyProject(next);await restore();$('#modal').close();toast('資料夾專案已驗證並新增')})}catch(e){if(e.name!=='AbortError'||phase!=='picker'){const message=originalStorageError(e,phase),el=$('#originalStorageProgress');if(el)el.textContent=message;toast(message,true)}}finally{button.disabled=false}};
 }
 $('#originalStorageBtn').onclick=show;return {restore,show,importManifest};
}
