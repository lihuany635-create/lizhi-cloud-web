// P1 authenticated UI candidate. This route does NOT auto-fall back to mock data.
// It remains inaccessible until the owner separately approves Supabase migration and Edge deployment.
const app=document.getElementById('app');
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabs={home:'首頁',cards:'單字中心',errors:'錯句紀錄',courses:'課程地圖',analytics:'學習分析',settings:'設定'};
const ui={
 phase:'checking',error:null,section:'home',theme:'light',busy:false,
 cards:[],candidates:[],errors:[],notice:'',identity:null
};
const errorMessages={
 AUTH_REQUIRED:'登入逾期，請從立之雲端庫重新登入。',
 AUTH_INVALID:'登入憑證失效，請重新登入。',
 GOOGLE_LOGIN_REQUIRED:'僅支援指定 Google 帳號登入。',
 ACCOUNT_NOT_ALLOWED:'你的帳號尚未取得英文學習教室的授權。',
 SERVER_NOT_CONFIGURED:'英文學習後端尚未完成部署。',
 DB_OPERATION_FAILED:'資料庫操作未完成，請檢查後再試。',
 INVALID_CARD:'請填入有效的英文單字和中文意思。',
 INVALID_REQUEST_ID:'同步編號錯誤。',
 EXPLICIT_CONFIRMATION_REQUIRED:'需由本人確認審核操作。',
 CANDIDATE_NOT_PENDING:'此候選單字已處理。',
 ORIGIN_NOT_ALLOWED:'網站來源未授權。',
 SERVER_UNAVAILABLE:'目前無法連接學習服務。',
 ENGLISH_BACKEND_UNAVAILABLE:'正式單字後端尚未啟用或暫時無法使用。',
 CANDIDATE_NOT_PENDING:'這張候選卡已處理，請重新整理。',
 SCOPE_DENIED:'帳號沒有此功能的權限。'
};
const randomId=()=>crypto.randomUUID();
let api=null;
function message(err){return errorMessages[err?.code]||err?.message||'暫時無法完成操作。'}
function hostContext(){
  let host;
  try{host=window.parent||window;}catch{throw new Error('必須從立之雲端庫登入')}
  const auth=host.LizhiAuth?.client;
  const supabaseUrl=host.LIZHI_SUPABASE_URL;
  const trustedUrl=typeof supabaseUrl==='string' && (/^https:\/\/[^/]+$/.test(supabaseUrl) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(supabaseUrl));
  if(!auth?.auth?.getSession||!trustedUrl)
    throw new Error('請從已登入的立之雲端庫開啟此頁');
  return {auth,endpoint:supabaseUrl.replace(/\/$/,'')+'/functions/v1/lizhi-english-academy',publicKey:host.LIZHI_SUPABASE_PUBLISHABLE_KEY||''};
}
async function buildClient(){
 const {auth,endpoint,publicKey}=hostContext();
 async function call(path,method='GET',payload=null){
   const {data,error}=await auth.auth.getSession();
   if(error||!data?.session?.access_token)throw {code:'AUTH_REQUIRED'};
   const request=new Request(endpoint+'/'+path,{
      method,
      headers:{
        authorization:'Bearer '+data.session.access_token,
        ...(publicKey?{apikey:publicKey}:{}),
        'content-type':'application/json',
      },
      body:payload?JSON.stringify(payload):undefined,
      cache:'no-store'
   });
   const res=await fetch(request);
   const body=await res.json().catch(()=>({code:'SERVER_UNAVAILABLE'}));
   if(!res.ok)throw body;
   return body;
 }
 return {call};
}
async function refresh(){
 const [cards,candidates,errors]=await Promise.all([api.call('cards'),api.call('candidates'),api.call('errors')]);
 if(!Array.isArray(cards.items)||!Array.isArray(candidates.items)||!Array.isArray(errors.items))throw {code:'DB_OPERATION_FAILED'};
 ui.cards=cards.items;
 ui.candidates=candidates.items;
 ui.errors=errors.items;
}
async function initialize(){
 ui.phase='checking';render();
 try{
   api=await buildClient();
   const status=await api.call('status');
   if(status.ownerVerified!==true)throw {code:'ACCOUNT_NOT_ALLOWED'};
   await refresh();
   ui.phase='ready';ui.error=null;
 }catch(err){
   ui.phase='error';ui.error=message(err);
 }
 render();
}
function nav(){
 return '<nav class="nav" aria-label="英文學習導覽">'+Object.entries(tabs).map(([key,value])=>
  '<button type="button" data-tab="'+key+'" class="'+(ui.section===key?'active':'')+'">'+value+'</button>').join('')+'</nav>';
}
function bottomNav(){
 const icons={home:'⌂',cards:'▣',errors:'✎',courses:'◇',analytics:'▥',settings:'⚙'};
 return '<nav class="bottom-nav" aria-label="手機英文學習導覽">'+Object.entries(tabs).map(([key,value])=>
  '<button type="button" data-tab="'+key+'" class="'+(ui.section===key?'active':'')+'" aria-current="'+(ui.section===key?'page':'false')+'">'+
  '<span class="emoji" aria-hidden="true">'+icons[key]+'</span>'+value+'</button>').join('')+'</nav>';
}
function statusBox(){
 if(ui.phase==='checking')return '<section class="card" role="status"><h2>正在確認登入與學習資料…</h2></section>';
 if(ui.phase==='error')return '<section class="card"><h2>無法開啟學習資料</h2><p class="notice warn" role="alert">'+h(ui.error)+'</p><p class="muted">本頁不會以展示資料偽裝成你的正式單字庫。</p><button class="button" data-retry="1">重新檢查</button></section>';
 return '';
}
function viewHome(){
 const pending=ui.candidates.filter(x=>x.status==='pending').length;
 return '<h1 class="view-title">今日英文學習</h1><p class="view-subtitle">你的正式單字資料由授權後端保存，尚未評估的能力不會自行產生等級。</p>'+
 '<div class="content-grid"><section class="card hero"><div class="eyebrow">AI ENGLISH ACADEMY</div>'+
 '<div class="hero-title">Welcome back!</div><p class="hero-copy">先審核候選單字，再逐步建立你的每日複習計畫。</p>'+
 '<button class="button primary" data-tab="cards">查看單字中心</button></section>'+
 '<section class="card"><h2>學習概況</h2><div class="stats">'+
 '<div><div class="value">'+ui.cards.length+'</div><div class="label">正式單字</div></div>'+
 '<div><div class="value">'+pending+'</div><div class="label">待審核</div></div>'+
 '<div><div class="value">—</div><div class="label">尚未啟用 FSRS</div></div></div>'+
 '<div class="gap"></div><div class="notice">僅顯示經正式後端讀回的資料；錯句與單字卡不會在離線或未授權時假裝保存。</div></section></div>';
}
function viewCards(){
 const pending=ui.candidates.filter(x=>x.status==='pending');
 return '<h1 class="view-title">單字中心</h1><p class="view-subtitle">所有操作都經本人登入與後端權限驗證。</p>'+
 '<div class="content-grid"><div class="list"><section class="card"><h2>待審核候選 ('+pending.length+')</h2>'+
 '<div class="list">'+(pending.length?pending.map(c=>
  '<article class="list-row"><div><strong>'+h(c.term)+'</strong> · '+h(c.meaning_zh)+'<p>'+h(c.example_en)+'</p></div>'+
  '<div class="actions"><button class="button primary small-button" data-accept="'+h(c.id)+'">加入</button>'+
  '<button class="button small-button" data-ignore="'+h(c.id)+'">略過</button></div></article>').join(''):
 '<div class="notice">目前沒有待審核候選。</div>')+'</div></section>'+
 '<section class="card"><h2>正式單字庫 ('+ui.cards.length+')</h2><div class="list">'+
 (ui.cards.length?ui.cards.map(c=>'<article class="list-row"><div><strong>'+h(c.term)+
 '</strong> · '+h(c.meaning_zh)+'<p>'+h(c.example_en)+'</p></div><button class="button small-button" data-speak="'+h(c.term)+'">發音</button></article>').join(''):
 '<div class="notice">目前尚未建立正式單字。</div>')+'</div></section></div>'+
 '<section class="card"><h2>直接新增單字</h2><form id="live-add-card">'+
 '<label for="live-term">英文</label><input id="live-term" name="term" class="input" required maxlength="120" placeholder="hungry">'+
 '<div class="gap"></div><label for="live-meaning">中文意思</label>'+
 '<input id="live-meaning" name="meaningZh" class="input" required maxlength="500" placeholder="飢餓的">'+
 '<div class="gap"></div><button class="button primary" type="submit">加入待審核單字</button></form>'+
 '<div class="gap"></div><p class="muted small">手動輸入先進入候選庫；只有按「加入」並由正式後端確認，才會建立正式單字卡。</p></section></div>';
}
function viewErrors(){
 return '<h1 class="view-title">聊天錯句紀錄</h1>'+
  '<p class="view-subtitle">保留你原本的英文、修正句及說明；只顯示正式後端已保存的紀錄。</p>'+
  '<section class="card"><h2>已記錄 ('+ui.errors.length+')</h2><div class="list">'+
   (ui.errors.length?ui.errors.map(e=>'<article class="list-row">'+
    '<div><p class="muted">原句</p><strong>'+h(e.original_sentence)+'</strong>'+
    '<p class="muted">建議修正</p><strong>'+h(e.corrected_sentence)+'</strong>'+
    '<p>'+h(e.explanation)+'</p></div></article>').join(''):
    '<div class="notice">尚無從已授權英文聊天同步的錯句。</div>')+
   '</div></section>';
}
function viewCourse(){
 return '<h1 class="view-title">課程地圖</h1><p class="view-subtitle">階段與 AI 課程將在 P4 啟用，現在不產生未經測試的程度判定。</p>'+
 '<section class="card"><div class="stage-grid">'+['A0','A1','A2','B1','B2','C1','C2'].map(t=>
 '<div class="stage"><strong>'+t+'</strong><span>尚未評估</span></div>').join('')+'</div></section>';
}
function viewAnalytics(){
 return '<h1 class="view-title">學習分析</h1><p class="view-subtitle">目前只呈現已保存的正式單字數據。</p>'+
 '<section class="card"><div class="stats"><div><div class="value">'+ui.cards.length+'</div><div class="label">已建立單字</div></div>'+
 '<div><div class="value">'+ui.candidates.filter(x=>x.status==='pending').length+'</div><div class="label">待審核</div></div>'+
 '<div><div class="value">'+ui.errors.length+'</div><div class="label">已保存錯句</div></div></div></section>';
}
function viewSettings(){
 return '<h1 class="view-title">設定</h1><p class="view-subtitle">私人學習資料只讀取已授權帳號的內容。</p>'+
 '<section class="card"><h2>顯示模式</h2><button class="button" data-theme="1">'+(ui.theme==='light'?'切換深色模式':'切換淺色模式')+'</button>'+
 '<div class="gap"></div><div class="notice">登入由立之雲端庫 Google OAuth 處理，英文學習教室不儲存密碼。</div></section>';
}
function render(){
 document.documentElement.dataset.theme=ui.theme;
 const content=ui.phase!=='ready'?statusBox():({home:viewHome,cards:viewCards,errors:viewErrors,courses:viewCourse,analytics:viewAnalytics,settings:viewSettings})[ui.section]();
 app.innerHTML='<div class="app-shell"><header class="header"><div class="brand"><div class="brand-mark">E</div>'+
 '<div><strong>立之英文學習教室</strong><span class="small">PRIVATE ENGLISH LEARNING</span></div></div>'+
 '<span class="pill">P1 · 授權連線候選版</span></header>'+
 '<div class="demo-banner"><strong>正式後端候選頁</strong><span>後端尚未核准部署時拒絕寫入；不會改用示範資料</span></div>'+
 (ui.phase==='ready'?nav():'')+
 (ui.notice?'<div class="notice" role="status">'+h(ui.notice)+'</div><div class="gap"></div>':'')+
 '<main>'+content+'</main><footer class="footer">單字卡只有讀回後才算保存；ChatGPT MCP 與 FSRS 須正式驗收後啟用</footer></div>'+(ui.phase==='ready'?bottomNav():'');
}
async function act(fn){
 if(ui.busy)return; ui.busy=true;
 try{await fn();await refresh();ui.notice='已完成操作並重新讀取資料';}
 catch(err){ui.notice=message(err);}
 finally{ui.busy=false;render();}
}
app.addEventListener('click',async event=>{
 const btn=event.target.closest('button');if(!btn)return;
 if(btn.dataset.retry){await initialize();return;}
 if(btn.dataset.tab){ui.section=btn.dataset.tab;ui.notice='';render();return;}
 if(btn.dataset.theme){ui.theme=ui.theme==='light'?'dark':'light';render();return;}
 if(btn.dataset.speak){
   if('speechSynthesis' in window){const s=new SpeechSynthesisUtterance(btn.dataset.speak);s.lang='en-US';speechSynthesis.speak(s);}
   else{ui.notice='此瀏覽器沒有語音播放功能';render();}
   return;
 }
 if(!api||ui.phase!=='ready')return;
 if(btn.dataset.accept){
   const c=ui.candidates.find(x=>x.id===btn.dataset.accept);
   if(!c||!window.confirm('確認把「'+c.term+'」加入正式單字卡嗎？'))return;
   await act(()=>api.call('accept','POST',{
     requestId:randomId(),candidateId:btn.dataset.accept}));
 }
 if(btn.dataset.ignore){
   const c=ui.candidates.find(x=>x.id===btn.dataset.ignore);
   if(!c||!window.confirm('確定略過「'+c.term+'」？原始紀錄會保留。'))return;
   await act(()=>api.call('ignore','POST',{
     requestId:randomId(),candidateId:btn.dataset.ignore}));
 }
});
app.addEventListener('submit',async event=>{
 if(event.target.id!=='live-add-card')return;
 event.preventDefault();
 if(!api||ui.phase!=='ready')return;
 const values=new FormData(event.target);
 const payload={requestId:randomId(),term:String(values.get('term')||''),
   meaningZh:String(values.get('meaningZh')||'')};
 await act(()=>api.call('candidate','POST',payload));
});
initialize();
