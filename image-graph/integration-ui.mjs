import {integrationConfig} from './runtime-config.mjs?v=26';
import {integrated,privateBridge} from './api-transport.mjs?v=26';
import {importExistingProject} from './integration-projects.mjs?v=26';
import {projectVersions} from './project-store.mjs?v=26';
export function createIntegrationUI({getStore,getProject,isBusy,openProject,bindRoot,oldOriginals,modal,toast,esc,doc=document}){
 if(!integrated())return;
 const $=s=>doc.querySelector(s),bridge=privateBridge();
 const bar=doc.createElement('section');bar.className='integration-bar';bar.setAttribute('aria-label','立之雲端庫整合');
 bar.innerHTML=`<span>立之雲端庫 · 映構</span><span id="integrationStatus" role="status">本機工作台可用；私人交接尚未連接</span><button id="integrationConnect">連接私人交接</button><button id="integrationImport">接續原入口專案</button><button id="integrationRoots">連回原圖資料夾</button><a href="${esc(integrationConfig.libraryURL)}" target="_top">返回雲端庫</a>`;
 doc.querySelector('header').after(bar);
 const connect=()=>{if(isBusy()){toast('請等待目前操作完成');return}try{bridge.connect();toast('請在映構視窗按「允許連接」，再回這裡操作')}catch(e){toast(e.message,true)}};
 $('#integrationConnect').onclick=connect;
 bridge.subscribe(ready=>{$('#integrationStatus').textContent=ready?'私人交接已連接；請保留連接視窗':'本機工作台可用；私人交接尚未連接';$('#integrationConnect').textContent=ready?'重新連接私人交接':'連接私人交接'});
 $('#integrationImport').onclick=async()=>{
  if(isBusy()||!getStore()){toast('請等待專案開啟完成');return}
  try{
   const {projects}=await bridge.request('list_projects');
   modal('接續原入口專案',`<p>保留原專案、任務與驗收紀錄，不刪除原入口資料。同一個專案只接續一次，不覆蓋雲端庫既有版本。</p><p>資料夾授權無法跨網址移轉；接續後可按「連回原圖資料夾」。</p>${projects.map(p=>`<article class="project-card"><div><strong>${esc(p.name)}</strong><p>${p.assets} 張素材 · ${p.runs} 個任務</p></div><button data-import-existing="${esc(p.id)}">接續此專案</button></article>`).join('')||'<p>此瀏覽器的映構原入口沒有專案。</p>'}`);
   doc.querySelectorAll('[data-import-existing]').forEach(button=>button.onclick=async()=>{
    if(isBusy())return;button.disabled=true;
    try{const {project}=await bridge.request('export_project',{project_id:button.dataset.importExisting});await importExistingProject(getStore(),project);await openProject(project.id);toast('已接續原專案；裝置圖片請重新連回原圖資料夾')}
    catch(e){toast(e.message,true);button.disabled=false}
   });
  }catch(e){toast(e.message,true)}
 };
 $('#integrationRoots').onclick=()=>{
  if(isBusy()||!getProject())return;const p=getProject(),roots=new Map();
  for(const v of projectVersions(p))if(v.fs_ref)roots.set(v.fs_ref.root_id,v.fs_ref.root_name);
  modal('連回原圖資料夾',`<p>選回原本包含圖片的根資料夾。會以檔案大小與 SHA-256 核對後才重新連接；不搬移、不改寫原圖。</p>${[...roots].map(([id,name])=>`<article class="project-card"><strong>${esc(name)}</strong><button data-bind-root="${esc(id)}">選回此位置</button></article>`).join('')}${projectVersions(p).some(v=>v.disk_ref)?'<button id="bindOldOriginals">連回舊版「映構原圖」資料夾</button>':''}${!roots.size&&!projectVersions(p).some(v=>v.disk_ref)?'<p>此專案沒有待連接的裝置原圖；可直接到圖片來源選擇位置。</p>':''}`);
  doc.querySelectorAll('[data-bind-root]').forEach(button=>button.onclick=()=>bindRoot(button.dataset.bindRoot));
  const old=$('#bindOldOriginals');if(old&&projectVersions(p).some(v=>v.disk_ref))old.onclick=oldOriginals;
 };
 $('#accountBtn').onclick=()=>{
  modal('私人交接帳號',`<p>本機專案保存在立之雲端庫的這個瀏覽器。任務交接繼續使用映構的私人 ChatGPT 登入；不會改動雲端庫既有 Supabase 帳號。</p><button id="integrationAccountConnect" class="primary">連接私人交接</button><p><a href="${esc(integrationConfig.backendOrigin+'/account')}" target="_blank" rel="noopener">映構登入／登出與帳號 ↗</a></p><button id="integrationDisconnect">中斷此工作台連線</button>`);
  $('#integrationAccountConnect').onclick=connect;$('#integrationDisconnect').onclick=()=>{bridge.disconnect();toast('已中斷私人交接連線；本機專案保留')};
 };
}
