import {sourceRead} from './source-read.mjs?v=28';
import {sourceThumbnail,peekThumbnail,cachedListing,saveListing} from './source-thumbs.mjs?v=32';
const PAGE_SIZE=40;
const errorMessage=error=>({NotFoundError:'目前位置已移動或刪除，請重新連接資料夾',NotAllowedError:'資料夾需要重新授權，請按「重新連接」',SecurityError:'瀏覽器未允許存取，請直接開啟網站後重新連接',TypeMismatchError:'同名檔案或資料夾已存在，請使用另一個名稱',QuotaExceededError:'裝置空間不足，請釋放空間後重試'}[error.name]||error.message);
export function createSourceFolderUI({repository,getStore,isBusy,onAdd,toast,modal,esc,scope=window,doc=document}){
 const $=selector=>doc.querySelector(selector);let generation=0,working=false,page=0,items={folders:[],images:[]},urls=[],error='',mode='source',readController=null,previewsRemaining=0,previewFailures=0,selecting=false,notice='',permissionLost=false,lastRefresh=0,workStarted=0,waitTimer=null,showingCache=false;
 const pathLabel=value=>value?[value.root_name,...value.path].join(' / '):'尚未連接資料夾';
 function clearURLs(){for(const url of urls)URL.revokeObjectURL(url);urls=[]}
 function controls(){
  const location=repository.current(),ready=!!getStore()&&!isBusy();
  $('#sourceConnectBtn').textContent=permissionLost&&location?'恢復存取':error?'重新連接':location?'更換位置':'連接資料夾';$('#sourceConnectBtn').disabled=working||!ready;
  $('#sourceRefreshBtn').disabled=working||!ready||!location;$('#sourceNewFolderBtn').disabled=working||!ready||!location||!!error;$('#sourceIncludeChildren').disabled=working||!ready||!location;
  $('#sourceStopBtn').hidden=selecting||!(working||previewsRemaining);$('#sourceLocation').textContent=pathLabel(location);
  $('#sourceStatus').textContent=(permissionLost&&location?'要繼續使用「'+location.root_name+'」，點「恢復存取」允許就好，不用重新選資料夾':'')||error||(!ready?'專案仍在載入，請稍候…':selecting?'正在確認所選位置…'+waited():working?(showingCache?'先顯示上次的清單，正在核對最新內容…':'正在列出實際檔案，已找到 '+items.images.length+' 張圖片…')+waited():previewsRemaining?'檔名已列出，正在載入 '+previewsRemaining+' 張預覽…':notice||!repository.supported()&&'此瀏覽器無法連接裝置資料夾，請使用支援此功能的瀏覽器'||!location&&'請連接圖片所在的資料夾'||previewFailures&&('已列出圖片；'+previewFailures+' 張預覽未能讀取，可重試或重新連接')||items.unreadable?.length&&(/逾時/.test(items.unreadable[0].message)?'手機回應太慢，沒有全部讀完；先顯示已找到的 '+items.images.length+' 張，可按「重新整理」再讀一次':'部分位置未讀取成功：'+items.unreadable[0].message)||'已完成讀取；圖片保持在裝置原位置');
  $('#sourceStatus').classList.toggle('source-error',!!error||!!items.unreadable?.length||!!previewFailures);
 }
 // 手機第一次列出大資料夾可能要幾十秒：顯示已等多久，讓人知道還在進行
 function waited(){const seconds=workStarted?Math.floor((Date.now()-workStarted)/1000):0;return seconds>=5?'（已等 '+seconds+' 秒，資料夾大時第一次會比較久，可按「停止讀取」）':''}
 function startWaiting(){workStarted=Date.now();clearInterval(waitTimer);waitTimer=setInterval(()=>{if(working)controls();else stopWaiting()},1000)}
 function stopWaiting(){clearInterval(waitTimer);waitTimer=null;workStarted=0}
 function pathAndFolders(location=repository.current()){
  $('#sourceBreadcrumbs').innerHTML=location?[{name:location.root_name,path:[]},...location.path.map((name,index)=>({name,path:location.path.slice(0,index+1)}))].map((entry,index)=>`<button data-source-up="${index}" title="${esc(pathLabel({...location,path:entry.path}))}">${esc(entry.name)}</button>`).join('<span aria-hidden="true"> / </span>'):'';
  $('#sourceFolderList').innerHTML=items.folders.map((folder,index)=>`<button data-source-folder="${index}" class="folder-row"><span class="folder-row-name">▱ ${esc(folder.name)}</span><span aria-hidden="true">›</span></button>`).join('');
  const browse=path=>{if(working&&!selecting)stopRead();return navigate(path)};
  doc.querySelectorAll('[data-source-folder]').forEach(button=>button.onclick=()=>browse(items.folders[Number(button.dataset.sourceFolder)]?.path));
  doc.querySelectorAll('[data-source-up]').forEach(button=>button.onclick=()=>browse(location.path.slice(0,Number(button.dataset.sourceUp))));
 }
 function stopRead(){
  ++generation;readController?.abort();readController=null;working=false;showingCache=false;stopWaiting();previewsRemaining=0;error='';notice='已停止讀取；目前清單可能尚未完整，可重新整理或更換位置';
  doc.querySelectorAll('[data-source-loading]').forEach(el=>el.textContent='預覽已停止，可按加入畫布重新讀取');
  if(!items.images.length)$('#sourceImages').innerHTML='<div class="empty">已停止讀取，尚不能判定這個資料夾沒有圖片。</div>';
  $('#sourceCounts').textContent='目前已找到 '+items.images.length+' 張圖片、'+items.folders.length+' 個子資料夾（讀取未完成）';controls();
 }
 function beginRead(){++generation;readController?.abort();readController=new AbortController();previewsRemaining=0;previewFailures=0;notice='';error='';return generation}

 function showMode(next){mode=next;$('#sourceLibraryContent').hidden=next!=='source';$('#legacyLibraryContent').hidden=next!=='project';$('#showSourceBtn').setAttribute('aria-pressed',String(next==='source'));$('#showProjectRefsBtn').setAttribute('aria-pressed',String(next==='project'));if(next==='source')controls()}
 function showImages(token,{previews=true,partial=false}={}){
  clearURLs();const start=page*PAGE_SIZE,visible=items.images.slice(start,start+PAGE_SIZE);
  $('#sourceImages').innerHTML=visible.map((item,offset)=>{const index=start+offset;return `<article id="sourceCard_${token}_${index}" class="source-image" draggable="true" data-source-drag="${index}"><img id="sourcePreview_${token}_${index}" loading="lazy" alt="${esc(item.name)}" hidden><div id="sourcePreviewMessage_${token}_${index}" class="source-image-missing" data-source-loading="true">${partial?'已找到圖片；正在讀取清單…':'正在讀取預覽…'}</div><strong title="${esc(item.name)}">${esc(item.name)}</strong>${items.recursive?`<button class="source-image-path" data-source-image-path="${index}" title="開啟實際所在資料夾">${esc([item.ref.root_name,...item.ref.path.slice(0,-1)].join(' / '))}</button>`:''}<button id="sourceAdd_${token}_${index}" data-source-add="${index}">加入畫布</button></article>`}).join('')||`<div class="empty">${partial?'正在讀取，尚不能判定這個資料夾沒有圖片。':items.unreadable?.length?'部分內容無法讀取，目前尚未找到可用圖片。':items.filesScanned===0&&!items.folders.length?'已完成讀取：這個實際位置沒有檔案或子資料夾。':items.folders.length&&!items.recursive?'當層沒有圖片，可開啟上方子資料夾，或查看所有子資料夾圖片。':'已讀取的檔案中沒有可顯示的 PNG、JPG 或 WebP 圖片。'}${!partial&&items.folders.length&&!items.recursive?'<button id="sourceShowChildren">查看子資料夾內圖片</button>':''}${items.unsupportedImages?`<p>有 ${items.unsupportedImages} 個其他圖片格式，目前支援 PNG、JPG、WebP。</p>`:''}${items.truncated?'<p>已達本次讀取範圍，請進入較小的子資料夾再查看。</p>':''}</div>`;
  const showChildren=$('#sourceShowChildren');if(showChildren)showChildren.onclick=()=>{$('#sourceIncludeChildren').checked=true;return refresh()};
  $('#sourceCounts').textContent=(partial?'讀取中，已找到：':items.recursive?'含子資料夾：':'當層：')+items.images.length+' 張圖片 · '+items.folders.length+' 個直接子資料夾'+(items.otherFiles?' · '+items.otherFiles+' 個其他檔案':'')+(items.unreadable?.length?' · '+items.unreadable.length+' 處無法讀取':'')+(items.truncated?' · 尚未讀完，請縮小範圍':'');
  $('#sourcePage').textContent=items.images.length?'第 '+(page+1)+' / '+Math.ceil(items.images.length/PAGE_SIZE)+' 頁':'';$('#sourcePrevBtn').disabled=!page;$('#sourceNextBtn').disabled=start+PAGE_SIZE>=items.images.length;$('#sourcePagination').hidden=items.images.length<=PAGE_SIZE||partial;
  doc.querySelectorAll('[data-source-image-path]').forEach(button=>button.onclick=()=>navigate(items.images[Number(button.dataset.sourceImagePath)]?.ref.path.slice(0,-1)));
  doc.querySelectorAll('[data-source-add]').forEach(button=>button.onclick=()=>add(items.images[Number(button.dataset.sourceAdd)]?.ref));
  doc.querySelectorAll('[data-source-drag]').forEach(card=>card.ondragstart=event=>{const ref=items.images[Number(card.dataset.sourceDrag)]?.ref;if(!ref)return;event.dataTransfer.setData('application/x-yinggou-source',JSON.stringify(ref));event.dataTransfer.effectAllowed='copy'});
  if(previews==='cache'){for(const [offset,item] of visible.entries()){const index=start+offset;peekThumbnail(item.ref).then(url=>{const img=$('#sourcePreview_'+token+'_'+index),message=$('#sourcePreviewMessage_'+token+'_'+index);if(!url||!img||token!==generation){if(url)URL.revokeObjectURL(url);if(message)message.textContent='核對中…';return}urls.push(url);img.src=url;img.hidden=false;message.hidden=true})}return}
  if(!previews||!visible.length)return;
  const signal=readController.signal;let cursor=0;previewsRemaining=visible.length;
  async function worker(){while(cursor<visible.length&&!signal.aborted&&token===generation){const offset=cursor++;await loadPreview(token,start+offset,visible[offset],signal);if(token===generation&&!signal.aborted){previewsRemaining--;controls()}}}
  void Promise.all(Array.from({length:Math.min(3,visible.length)},worker)).catch(e=>{if(token===generation){previewsRemaining=0;error=errorMessage(e);controls()}});
 }
 // 單張預覽：大照片在手機上讀取較慢，給 30 秒；失敗只影響這一張，可單獨重試
 async function loadPreview(token,index,item,signal){
  const message=$('#sourcePreviewMessage_'+token+'_'+index),previewController=new AbortController(),abort=()=>previewController.abort();signal.addEventListener('abort',abort,{once:true});
  try{
   const file=await sourceRead(()=>repository.file(item.ref,{signal:previewController.signal}),'預覽 '+item.name,{signal:previewController.signal,timeoutMs:30000});if(token!==generation||signal.aborted)return;
   if(!file.size||file.size>10*1024*1024){$('#sourceAdd_'+token+'_'+index).disabled=true;$('#sourceCard_'+token+'_'+index).draggable=false;throw Object.assign(Error(!file.size?'檔案為空':'超過單張 10 MiB'),{final:true})}
   const {url}=await sourceThumbnail(item.ref,file);if(token!==generation||signal.aborted){URL.revokeObjectURL(url);return}urls.push(url);const img=$('#sourcePreview_'+token+'_'+index);
   img.onerror=()=>{if(token!==generation||signal.aborted)return;img.hidden=true;message.hidden=false;message.textContent='圖片預覽無法開啟，請確認原檔能在手機上開啟後重試';message.classList.add('source-error');previewFailures++;controls()};
   img.src=url;img.hidden=false;message.hidden=true;message.classList.remove('source-error');
  }catch(e){previewController.abort();if(token!==generation||signal.aborted)return;previewFailures++;message.hidden=false;message.classList.add('source-error');
   message.textContent=e.code==='source_timeout'?'這張讀取較久，尚未顯示預覽':errorMessage(e);
   if(!e.final){const retry=doc.createElement('button');retry.className='source-preview-retry';retry.textContent='重試這張';retry.onclick=async()=>{retry.disabled=true;message.textContent='重新讀取中…';previewFailures=Math.max(0,previewFailures-1);await loadPreview(token,index,item,readController?.signal||new AbortController().signal);controls()};message.append(' ',retry)}}
  finally{signal.removeEventListener('abort',abort)}
 }
 async function refresh(){
  if(working||!getStore()||isBusy())return;const token=beginRead(),signal=readController.signal;working=true;showingCache=false;startWaiting();items={folders:[],images:[]};clearURLs();pathAndFolders();$('#sourceCounts').textContent='正在讀取，尚未完成';$('#sourceImages').innerHTML='<div class="empty">正在讀取此位置的檔案…</div>';$('#sourcePagination').hidden=true;controls();
  const recursive=!!$('#sourceIncludeChildren').checked,location=repository.current();
  try{
   if(!location){$('#sourceImages').innerHTML='<div class="empty">先按「連接資料夾」，選擇你今天想使用的圖片位置。</div>';$('#sourceCounts').textContent='';return}
   // 先顯示上次在這個位置列出的清單，背景再核對；手機慢的時候也能馬上選圖
   const cached=await cachedListing(location,recursive);
   if(cached&&token===generation&&!signal.aborted){items=cached;showingCache=true;page=0;pathAndFolders(cached.location);showImages(token,{previews:'cache'});controls()}
   const next=await sourceRead(()=>repository.listing({recursive,signal,onProgress:partial=>{if(token!==generation||signal.aborted)return;if(showingCache){if(partial.images.length<items.images.length){controls();return}showingCache=false}items=partial;page=0;pathAndFolders(partial.location);showImages(token,{previews:false,partial:true});controls()}}),'讀取資料夾清單',{signal,timeoutMs:15*60*1000});
   if(token!==generation||signal.aborted)return;items=next;showingCache=false;permissionLost=false;lastRefresh=Date.now();page=Math.min(page,Math.max(0,Math.ceil(items.images.length/PAGE_SIZE)-1));pathAndFolders(next.location);working=false;stopWaiting();showImages(token);
   void saveListing(location,recursive,next);
  }catch(e){if(token===generation&&!signal.aborted){readController.abort();permissionLost=e.code==='source_permission'||e.name==='NotAllowedError';
   if(!permissionLost&&items.images.length){
    // 沒讀完也不丟掉：先用已找到的圖片，提示可以再讀一次
    const wasCache=showingCache;working=false;stopWaiting();showingCache=false;readController=new AbortController();error='';
    notice=(wasCache?'無法核對最新內容，先顯示上次的清單':'沒有全部讀完，先顯示已找到的 '+items.images.length+' 張')+'（'+errorMessage(e).replace(/。.*$/,'')+'）；可按「重新整理」再讀一次';
    pathAndFolders(items.location);showImages(token);
   }else{error=permissionLost?'':errorMessage(e);if(!items.images.length)$('#sourceImages').innerHTML='<div class="empty">讀取未完成，尚不能判定這個資料夾沒有圖片。請重新整理或更換位置。</div>';$('#sourceCounts').textContent='讀取未完成 · 目前找到 '+items.images.length+' 張圖片';$('#sourcePagination').hidden=true}}}
  finally{if(token===generation){working=false;stopWaiting();controls()}}
 }
 async function regrant(){
  // 授權過期時先直接要求授權；使用者拒絕或資料夾已不存在，才改走系統選擇器
  try{if(await repository.regrant()){permissionLost=false;error='';notice='已恢復存取';await refresh();return true}}catch{}
  return false;
 }
 async function choose(){if(working||!getStore()||isBusy())return false;if(!permissionLost)startWaiting();if(permissionLost&&repository.current()){if(await regrant())return true;permissionLost=false;error='沒有恢復存取；可以按「重新連接」改選資料夾';controls();return false}beginRead();working=true;selecting=true;controls();let failed=false;try{await repository.choose();page=0;showMode('source');return true}catch(e){if(e.name!=='AbortError'){failed=true;error=errorMessage(e);toast(errorMessage(e),true)}return false}finally{working=false;selecting=false;controls();if(!failed)await refresh()}}
 async function navigate(path){if(working||isBusy()||!path)return;beginRead();working=true;selecting=true;controls();let failed=false;try{await repository.navigate(path);page=0}catch(e){failed=true;error=errorMessage(e);toast(errorMessage(e),true)}finally{working=false;selecting=false;controls();if(!failed)await refresh()}}

 async function add(ref){if(selecting||isBusy()||!ref)return;if(working)stopRead();try{if(ref.root_id!==repository.current()?.root_id)throw Error('來源已切換，請重新選取圖片');await onAdd(ref)}catch(e){toast(errorMessage(e),true)}}
 function newFolder(){
  if(working||isBusy())return;const location=repository.current();if(!location){toast('請先連接資料夾');return}
  modal('新增資料夾',`<p>建立位置：<strong>${esc(pathLabel(location))}</strong></p><label>資料夾名稱<input id="sourceFolderName" maxlength="80" placeholder="例如：EP02、角色設定、場景"></label><p>會實際建立在所選位置；進入新資料夾後可繼續建立子資料夾。</p><button id="sourceCreateConfirm" class="primary">建立資料夾</button><div id="sourceCreateStatus" role="status"></div>`);$('#sourceFolderName').focus();
  $('#sourceCreateConfirm').onclick=async()=>{
   if(working||isBusy())return;const active=repository.current();if(active?.root_id!==location.root_id||JSON.stringify(active.path)!==JSON.stringify(location.path)){toast('目前位置已變更，請重新開啟新增資料夾',true);return}
   working=true;selecting=true;$('#sourceCreateConfirm').disabled=true;
   try{await repository.createFolder($('#sourceFolderName').value);$('#modal').close();toast('已在裝置建立資料夾');working=false;selecting=false;await refresh()}
   catch(e){$('#sourceCreateStatus').textContent=errorMessage(e);$('#sourceCreateConfirm').disabled=false}
   finally{working=false;selecting=false;controls()}
  };
 }
 async function restore(){if(!getStore())return;try{await sourceRead(()=>repository.restore(),'恢復圖片來源');if(repository.current()&&await repository.permissionState()==='prompt'){permissionLost=true;$('#sourceImages').innerHTML='<div class="empty">點上方「恢復存取」，允許後就會列出圖片。</div>';controls();return}await refresh()}catch(e){permissionLost=e.code==='source_permission';error=permissionLost?'':errorMessage(e);controls()}}
 controls();
 $('#sourceConnectBtn').onclick=choose;$('#sourceRefreshBtn').onclick=refresh;$('#sourceStopBtn').onclick=stopRead;$('#sourceIncludeChildren').onchange=()=>{page=0;return refresh()};$('#sourceNewFolderBtn').onclick=newFolder;$('#showSourceBtn').onclick=()=>showMode('source');$('#showProjectRefsBtn').onclick=()=>showMode('project');
 function pageImages(delta){if(working||isBusy())return;page=Math.max(0,page+delta);const token=beginRead();showImages(token);controls()}
 $('#sourcePrevBtn').onclick=()=>pageImages(-1);$('#sourceNextBtn').onclick=()=>pageImages(1);
 // 切回映構時不必每次重掃：超過 2 分鐘才自動重新整理，要立刻更新可按「重新整理」
 const stale=()=>mode==='source'&&!permissionLost&&Date.now()-lastRefresh>120000;
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden&&stale())refresh()});scope.addEventListener?.('focus',()=>{if(stale())refresh()});
 return {choose,refresh,restore,addDragged:ref=>add(ref),showProject:()=>showMode('project'),showSource:()=>showMode('source'),update:controls};
}
