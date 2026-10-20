import {deviceFolderSupported,deviceProjectDirectory,deviceFolderContentKey,deviceSyncError,deviceSyncFailureKind,syncDeviceFolder} from './device-folder.mjs?v=25';

const RETRY_DELAYS=[2000,5000,10000,30000];
export function createDeviceFolderUI({getProject,getStore,isBusy,toast,modal,esc,scope=window,readOriginal=null}){
 const $=selector=>document.querySelector(selector);
 let state=null,generation=0,timer,running=false,loading=false,pending=false,message='尚未選擇資料夾';
 const direct=()=>getProject()?.versions?.some(v=>v.fs_ref||v.returned_ref)||getProject()?.runs?.some(r=>r.outputs?.some(o=>o.version?.returned_ref));
 const supported=()=>deviceFolderSupported(scope),key=id=>'deviceFolder:'+id;
 const retryDelay=()=>RETRY_DELAYS[Math.min(Math.max(0,(state?.retryCount||1)-1),RETRY_DELAYS.length-1)];
 function update(text=message){
  message=text;$('#deviceFolderStatus').textContent=text;
  const panel=$('#deviceSyncProgress');if(panel)panel.textContent=text;
  for(const name of ['deviceChooseFolder','deviceSyncNow','deviceDisconnect']){
   const button=$('#'+name);if(button)button.disabled=loading||(name!=='deviceDisconnect'&&running)||(name==='deviceChooseFolder'&&!supported())||(name!=='deviceChooseFolder'&&!state?.handle);
  }
  const resume=$('#deviceSyncNow');if(resume)resume.textContent=state?.phase==='permission'?'授權並繼續':state?.phase==='retry'?'立即重試':'立即同步';
  const auto=$('#deviceAutoSync');if(auto)auto.disabled=loading||!state?.handle||direct();
 }
 async function save(current=state){
  if(!current)return;
  try{await getStore().setSetting(key(current.projectId),{handle:current.handle,auto:current.auto,receipt:current.receipt});current.remembered=true}
  catch{if(current.remembered!==false)toast('此瀏覽器無法記住資料夾；本頁仍可同步，下次開啟請重新選擇',true);current.remembered=false}
 }
 function show(){
  if(!getProject()||!getStore()){toast('專案正在開啟，請稍後');return}
  modal('另存分類副本',`${!supported()?'<div class="check-row warning">此瀏覽器無法授權資料夾，請用新版 Chrome 開啟映構。也可使用「備份專案」下載 ZIP。</div>':''}<p>將目前專案的素材、子資料夾及候選原圖，另存為依分類排列的副本。直接引用的裝置圖片與舊資料夾原圖不自動重複同步，可手動保存分類副本。</p><p>位置：<strong>${esc(state?.handle?.name||'尚未選擇')}</strong><br><span class="device-folder-path">專案子資料夾：${esc(deviceProjectDirectory(getProject()))}</span></p><div class="device-sync-actions"><button id="deviceChooseFolder" class="primary">${state?.handle?'更換資料夾':'選擇內部儲存資料夾'}</button><button id="deviceSyncNow">立即同步</button><button id="deviceDisconnect">停止同步</button></div><label class="toggle-label"><input id="deviceAutoSync" type="checkbox" ${state?.auto?'checked':''}>${direct()?'直接引用模式使用手動匯出副本':'頁面開啟時自動同步，短暫中斷後自動重試'}</label><div id="deviceSyncProgress" class="check-row" role="status"></div><details class="form-details"><summary>FolderSync 與同步方式</summary><p class="device-sync-note">第一次在「內部儲存空間」建立或選擇「映構」資料夾並授權，FolderSync 可使用同一個位置。重試會沿用已完成的原圖，不需重新選擇資料夾。</p><p class="device-sync-note">切回頁面時會自動檢查並接續。瀏覽器真正收回權限時，才需要按「授權並繼續」；網頁關閉或手機休眠期間無法保證持續執行。</p><p class="device-sync-note">單向保存，不匯入手機修改；改名、移動或刪除後，裝置舊副本仍保留。候選圖的保存不代表已核定。</p></details>`);
  $('#deviceChooseFolder').onclick=choose;$('#deviceSyncNow').onclick=()=>run(true);$('#deviceDisconnect').onclick=disconnect;
  $('#deviceAutoSync').onchange=async event=>{
   if(!state)return;const current=state;current.auto=event.target.checked;clearTimeout(timer);await save(current);
   if(state!==current)return;
   if(current.auto){if(current.phase==='retry')current.retryCount=0;schedule({recheck:true,delay:0})}
   else update('自動同步已關閉，可按「立即同步」保存');
  };
  update();
 }
 async function choose(){
  if(running||loading||isBusy()){toast('請等待目前操作完成');return}
  if(!supported()){show();return}
  const projectId=getProject().id,token=++generation;clearTimeout(timer);
  try{
   const handle=await scope.showDirectoryPicker({id:'yinggou-device-folder',mode:'readwrite'});
   if(token!==generation||projectId!==getProject().id)return;
   state={projectId,handle,auto:true,receipt:null,phase:'ready',retryCount:0};await save();
   if(token!==generation||projectId!==getProject().id)return;
   show();await run(false);
  }catch(error){if(error.name!=='AbortError')toast('無法選擇資料夾：'+error.message,true);schedule()}
 }
 async function run(manual=false){
  if(running){pending=true;return}
  if(!manual&&direct())return;
  if(!state?.handle||state.projectId!==getProject()?.id)return;
  if(!manual&&(!state.auto||document.hidden))return;
  if(isBusy()){if(manual)toast('請等待目前操作完成');schedule({recheck:true,delay:1000});return}
  const current=state,token=generation,fullCheck=manual||state.phase==='retry';let snapshotRevision=null;
  running=true;pending=false;clearTimeout(timer);update('正在確認資料夾連線…');
  const active=()=>{if(token!==generation||state!==current||getProject()?.id!==current.projectId||(snapshotRevision!==null&&snapshotRevision!==getProject()?.revision)){const error=new DOMException('內容或資料夾已變更，將接續最新版本','AbortError');error.syncSuperseded=true;throw error}};
  try{
   let permission;
   if(manual){
    // Start any needed permission request directly in the click handler. Cached
    // permission state distinguishes this from an ordinary manual disk check.
    permission=current.phase==='permission'?await current.handle.requestPermission({mode:'readwrite'}):await current.handle.queryPermission({mode:'readwrite'});
   }else permission=await current.handle.queryPermission({mode:'readwrite'});
   if(manual&&permission!=='granted'&&current.phase!=='permission')permission=await current.handle.requestPermission({mode:'readwrite'});
   active();if(permission!=='granted')throw deviceSyncError('permission','資料夾需要重新授權，請按「授權並繼續」');
   current.phase='ready';
   const snapshot=structuredClone(getProject());snapshotRevision=snapshot.revision;
   let contentKey;try{contentKey=await deviceFolderContentKey(snapshot)}catch(error){error.code='invalid_data';throw error}
   active();
   if(!fullCheck&&current.receipt?.content_key===contentKey){
    current.receipt={...current.receipt,revision:snapshot.revision};current.retryCount=0;await save(current);active();
    update('已同步 '+current.receipt.total+' 張 · 上次 '+new Date(current.receipt.completed_at).toLocaleTimeString('zh-TW'));return;
   }
   current.phase='syncing';
   const receipt=await syncDeviceFolder(current.handle,snapshot,{checkActive:active,readOriginal:readOriginal?version=>readOriginal(snapshot,version):null,onProgress:progress=>update(`正在同步 ${progress.completed} / ${progress.total} 張 · 新增 ${progress.written}、已存在 ${progress.skipped}`)});
   active();current.receipt=receipt;current.retryCount=0;current.phase='ready';await save(current);active();
   update(`已同步 ${receipt.total} 張 · ${new Date(receipt.completed_at).toLocaleTimeString('zh-TW')}`);
   if(manual)toast(`同步完成：新增 ${receipt.written} 張、已存在 ${receipt.skipped} 張`);
  }catch(error){
   if(token===generation&&state===current){
    if(error.syncSuperseded){current.phase='ready';pending=true;update('正在接續最新內容…')}
    else{
     current.phase=deviceSyncFailureKind(error);
     if(current.phase==='permission')update('需要重新授權資料夾 · 按「授權並繼續」');
     else if(current.phase==='missing')update('找不到原資料夾，請確認位置或重新選擇');
     else if(current.phase==='blocked')update('同步暫停：'+error.message);
     else{current.retryCount=(current.retryCount||0)+1;update(`同步暫時中斷，${retryDelay()/1000} 秒後自動重試 · ${String(error.message||error).slice(0,160)}`)}
     if(manual)toast(error.message,true);
    }
   }
  }finally{running=false;update();schedule({delay:state?.phase==='retry'?retryDelay():pending?0:3000})}
 }
 function schedule({recheck=false,delay=3000}={}){
  clearTimeout(timer);
  if(direct()||getProject()?.image_storage?.mode==='directory'||loading||!state?.handle||!state.auto||state.projectId!==getProject()?.id||document.hidden)return;
  if(running){pending=true;return}
  if(['blocked','missing'].includes(state.phase))return;
  if(state.phase==='permission'&&!recheck)return;
  if(!recheck&&state.phase!=='retry'&&!pending&&state.receipt?.revision===getProject()?.revision)return;
  timer=setTimeout(()=>run(false),delay);
 }
 async function restore(){
  const token=++generation,projectId=getProject()?.id;clearTimeout(timer);state=null;pending=false;loading=true;
  update('正在讀取同步設定…');
  try{
   if(!projectId||!supported())return;
   const saved=await getStore().getSetting(key(projectId));
   if(token!==generation||getProject()?.id!==projectId||!saved?.handle)return;
   const current={...saved,projectId,remembered:true,phase:'ready',retryCount:0};state=current;
   const permission=await current.handle.queryPermission({mode:'readwrite'});if(token!==generation)return;
   current.phase=permission==='granted'?'ready':'permission';
   update(permission==='granted'?(current.receipt?'已連接 · 上次 '+new Date(current.receipt.completed_at).toLocaleString('zh-TW'):'已連接，等待同步'):'需要重新授權資料夾 · 按「授權並繼續」');
  }catch(error){if(token===generation&&state){state.phase=deviceSyncFailureKind(error);update(state.phase==='permission'?'需要重新授權資料夾 · 按「授權並繼續」':state.phase==='retry'?'正在重新連接原資料夾…':'同步暫停：'+error.message)}}
  finally{if(token===generation){loading=false;if(!state)update('尚未選擇資料夾');else update();schedule({delay:0})}}
 }
 async function disconnect(){
  const projectId=state?.projectId;if(!projectId)return;
  generation++;clearTimeout(timer);state=null;pending=false;
  try{await getStore().setSetting(key(projectId),null);update('已停止同步，裝置檔案保留')}
  catch{toast('停止同步的設定尚未保存，重新開啟後請確認',true);update('此頁已停止同步，裝置檔案保留')}
  show();
 }
 const reconnect=()=>{if(!document.hidden)schedule({recheck:true,delay:0})};
 $('#deviceFolderBtn').onclick=show;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else reconnect()});
 scope.addEventListener?.('focus',reconnect);scope.addEventListener?.('pageshow',reconnect);
 return {schedule,restore};
}
