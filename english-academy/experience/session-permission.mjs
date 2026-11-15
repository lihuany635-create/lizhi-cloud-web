// Existing portal auth -> verified Google website -> short-lived ChatGPT sync consent.
// The module never stores auth tokens or private learning data in static files.
const root=document.getElementById('app');
const panel=document.createElement('div');
panel.className='p6-shell';
panel.setAttribute('aria-label','ChatGPT 英文學習同步授權');
panel.innerHTML=
 '<section class="card" aria-labelledby="english-sync-title">'+
 '<h2 id="english-sync-title">ChatGPT 學習紀錄同步</h2>'+
 '<p class="p6-note">在這裡明確授權後，ChatGPT 才能把你要求整理的英文單字及錯句寫入「待審核區」。授權有效 24 小時，可隨時撤銷；不會自動匯入其他聊天，也不會直接變成正式單字卡。</p>'+
 '<div class="actions" style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">'+
 '<button class="button primary" type="button" data-english-consent="grant">授權 ChatGPT 同步（24 小時）</button>'+
 '<button class="button" type="button" data-english-consent="check">查詢授權狀態</button>'+
 '<button class="button" type="button" data-english-consent="copy" hidden>複製給 ChatGPT 的訊息</button>'+
 '<button class="button" type="button" data-english-consent="revoke" hidden>撤銷授權</button>'+
 '</div>'+
 '<p id="english-sync-feedback" class="p6-note" role="status" aria-live="polite">尚未檢查授權狀態。只有你按下授權後才會新增紀錄。</p>'+
 '<div id="english-sync-current" hidden><p class="p6-note">已授權的對話編號（請勿公開分享）：</p>'+
 '<code id="english-sync-id" style="display:block;user-select:all;overflow-wrap:anywhere;margin-bottom:8px"></code>'+
 '<small id="english-sync-expiry" class="p6-note"></small></div>'+
 '</section>';
root.before(panel);

const feedback=panel.querySelector('#english-sync-feedback');
const current=panel.querySelector('#english-sync-current');
const code=panel.querySelector('#english-sync-id');
const expiry=panel.querySelector('#english-sync-expiry');
const buttons=Object.fromEntries(['grant','check','copy','revoke'].map(action=>
 [action,panel.querySelector('[data-english-consent="'+action+'"]')]));
const idRule=/^chat-[0-9a-f-]{36}$/i;
let active=null,busy=false;
function paint(){
 const valid=active&&idRule.test(active.sourceSessionId)&&
  Number.isFinite(Date.parse(active.expiresAt))&&Date.parse(active.expiresAt)>Date.now();
 if(!valid)active=null;
 current.hidden=!active;
 code.textContent=active?active.sourceSessionId:'';
 expiry.textContent=active?'到期時間：'+new Date(active.expiresAt).toLocaleString('zh-TW'):'';
 buttons.copy.hidden=!active;buttons.revoke.hidden=!active;
 for(const button of Object.values(buttons))button.disabled=busy;
}
function message(value,isError=false){
 feedback.textContent=value;
 feedback.style.color=isError?'#a52d26':'';
}
const requestId=prefix=>prefix+crypto.randomUUID().replace(/-/g,'');
async function request(action,body=null){
 const portal=window.parent!==window&&window.parent.LizhiAuth;
 if(!portal?.user?.id||!portal.client?.auth?.getSession)
  throw Error('GOOGLE_LOGIN_REQUIRED');
 const {data,error}=await portal.client.auth.getSession();
 const session=data?.session;
 if(error||!session?.access_token||session.user?.id!==portal.user.id)
  throw Error('GOOGLE_LOGIN_REQUIRED');
 const base=String(window.parent.LIZHI_SUPABASE_URL||'').replace(/\/$/,'');
 const apikey=window.parent.LIZHI_SUPABASE_PUBLISHABLE_KEY;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base)||
    typeof apikey!=='string'||!apikey)
  throw Error('CLOUD_CONFIG_MISSING');
 let response;
 try{
  response=await fetch(base+'/functions/v1/lizhi-english-academy/'+action,{
   method:body?'POST':'GET',
   headers:{authorization:'Bearer '+session.access_token,apikey,
    ...(body?{'content-type':'application/json'}:{})},
   body:body?JSON.stringify(body):undefined,
   credentials:'omit',cache:'no-store'
  });
 }catch{throw Error('NETWORK_ERROR');}
 const payload=await response.json().catch(()=>({code:'INVALID_SERVER_REPLY'}));
 if(!response.ok)throw Error(payload.code||'BACKEND_UNAVAILABLE');
 return payload;
}
const safeError=(e)=>{
 const known={
  GOOGLE_LOGIN_REQUIRED:'Google 登入已過期。請重新登入雲端庫後再操作。',
  CLOUD_CONFIG_MISSING:'主站雲端連線設定不完整，無法建立授權。',
  ORIGIN_NOT_ALLOWED:'網站來源未獲後端允許，請使用正式立之雲端庫入口。',
  AUTH_REQUIRED:'請先使用核准的 Google 帳號登入。',
  AUTH_INVALID:'登入驗證失敗，請重新登入。',
  ACCOUNT_NOT_ALLOWED:'此 Google 帳號未被授權使用英文同步。',
  ENGLISH_BACKEND_UNAVAILABLE:'英文同步後端暫時無法使用。',
  WEB_SESSION_INACTIVE:'Google 登入工作階段已失效，請重新登入。',
  NETWORK_ERROR:'無法連線英文同步後端，請檢查網路後重試。'
 };
 return known[e?.message]||'授權操作未成功：'+
  (/^[A-Z0-9_]{3,55}$/.test(e?.message||'')?e.message:'請稍後重試。');
};
async function execute(operation){
 if(busy)return;
 busy=true;paint();message('正在與英文同步後端確認…');
 try{
  if(operation==='grant'){
   const result=await request('authorize-session',{requestId:requestId('grant_web_')});
   if(result.status!=='authorized'||!idRule.test(result.sourceSessionId)||
      !(Date.parse(result.expiresAt)>Date.now()))
    throw Error('INVALID_SERVER_REPLY');
   active={sourceSessionId:result.sourceSessionId,expiresAt:result.expiresAt};
   message('授權成功！按「複製給 ChatGPT 的訊息」，貼回對話即可開始整理舊單字與錯句。');
  }else if(operation==='check'){
   const result=await request('sessions');
   if(!Array.isArray(result.items))throw Error('INVALID_SERVER_REPLY');
   const now=Date.now();
   const record=result.items.find(row=>row.enabled===true&&
    idRule.test(row.source_session_id)&&Date.parse(row.expires_at)>now);
   active=record?{sourceSessionId:record.source_session_id,expiresAt:record.expires_at}:null;
   message(active?'找到了有效的英文同步授權。':'目前沒有有效授權。你可以按「授權 ChatGPT 同步」。');
  }else if(operation==='revoke'){
   if(!active)return;
   const result=await request('revoke-session',{
    requestId:requestId('revoke_web_'),sourceSessionId:active.sourceSessionId
   });
   if(result.status!=='revoked')throw Error('INVALID_SERVER_REPLY');
   active=null;message('授權已撤銷，ChatGPT 無法再用此對話編號寫入新資料。');
  }
 }catch(e){message(safeError(e),true);}
 finally{busy=false;paint();}
}
buttons.grant.addEventListener('click',()=>execute('grant'));
buttons.check.addEventListener('click',()=>execute('check'));
buttons.revoke.addEventListener('click',()=>execute('revoke'));
buttons.copy.addEventListener('click',async()=>{
 if(!active)return;
 const prompt='我已在英文學習教室核准同步。請使用英文 MCP，依我要求將之前的英文學習錯句及單字寫入「待審核區」，不要直接入正式卡。sourceSessionId: '+active.sourceSessionId;
 try{
  await navigator.clipboard.writeText(prompt);
  message('已複製授權訊息，請貼到 ChatGPT 對話。');
 }catch{
  message('瀏覽器禁止自動複製，請長按上方的對話編號複製，再貼給 ChatGPT。',true);
 }
});
paint();
