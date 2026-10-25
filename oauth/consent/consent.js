/* Isolated OAuth 2.1 consent UI; never autoforwards approval.
 * Browser client uses public Supabase publishable key and existing website auth session.
 * Supabase OAuth Server must be enabled separately in the Dashboard.
 */
(function(){
'use strict';
const OWNER_EMAIL='lihuany635@gmail.com';
// Retain the existing key so mobile OAuth flows in progress remain compatible.
const PENDING_KEY='lizhi_mobile_pending_oauth_authorization_v1';
const id=new URL(location.href).searchParams.get('authorization_id');
const notice=document.querySelector('#notice');
const details=document.querySelector('#details');
const login=document.querySelector('#login');
const approve=document.querySelector('#approve');
const deny=document.querySelector('#deny');
let currentRequest=null;
let consentClientId=null;
const cadConsent=document.querySelector('#cad-write-consent');
let busy=false;
function msg(s){notice.textContent=s;}
function toggle(open) {approve.disabled=!open;deny.disabled=!open;}
function text(selector,value){document.querySelector(selector).textContent=String(value??'');}
function validId(x){return typeof x==='string'&&x.length>=12&&x.length<=256&&/^[a-zA-Z0-9_-]+$/.test(x);}
function client(){
 return window.supabase.createClient(window.LIZHI_SUPABASE_URL,window.LIZHI_SUPABASE_PUBLISHABLE_KEY,{
   auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
}
const db=client();
function trustedRedirect(url){
 try{
  const dest=new URL(url);
  return dest.protocol==='https:' && !!dest.hostname && !dest.username && !dest.password;
 }catch{return false;}
}
async function load(){
 if(!validId(id)){msg('授權請求缺少有效的 authorization_id。請從 AI 用戶端重新啟動授權。');return;}
 try{
  const {data:{user},error:userError}=await db.auth.getUser();
  if(userError||!user){
   login.hidden=false;
   details.hidden=true;
   msg('尚未登入立之雲端庫。');
   return;
  }
  if(String(user.email||'').toLowerCase()!==OWNER_EMAIL || !user.email_confirmed_at) {
   msg('這個帳號沒有私人服務授權資格。請切換為已核准的 Google 帳號。');
   return;
  }
  const {data,error}=await db.auth.oauth.getAuthorizationDetails(id);
  if(error||!data)throw new Error(error?.message||'無法取得授權資料');
  // Already-approved requests may redirect automatically according to Supabase protocol.
  // Fail closed instead: require explicit reauthorization from client if details are absent.
  if(!('authorization_id' in data)) {
   msg('這個用戶端可能已取得授權。如需確認授權，請到 Supabase 後台檢視已連線的應用程式；本頁不會自動重新核發。');
   return;
  }
  const dest=String(data.redirect_uri||'');
  if(!trustedRedirect(dest)) throw new Error('不安全或無法辨認的回呼網址，拒絕繼續');
  currentRequest=id;
  consentClientId=typeof data.client?.id==='string'?data.client.id:null;
  if(cadConsent)cadConsent.checked=false;
  text('#client-name',data.client?.name||'未提供名稱的應用程式（請謹慎）');
  text('#redirect-uri',dest);
  text('#requested-scopes',String(data.scope||'(未提出身分範圍)'));
  text('#signed-in-user',String(user.email||''));
  login.hidden=true;
  details.hidden=false;
  msg('此授權可能允許 AI 使用有修改能力的工具。請核對應用程式名稱、回呼網址與授權範圍，再決定是否允許。');
  toggle(true);
 }catch(e){msg('無法驗證授權要求：'+String(e?.message||'未知錯誤'));}
}
async function decide(allow){
 if(busy||!currentRequest)return;
 busy=true;toggle(false);msg('正在向 Supabase 提交你的決定…');
 try{
  const grantCad=allow && cadConsent?.checked===true;
  if(grantCad && (!consentClientId || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(consentClientId)))
    throw new Error('無法驗證這個 OAuth 應用程式的用戶端 ID，拒絕授予 CAD 寫入權限');
  const result=allow?await db.auth.oauth.approveAuthorization(currentRequest):await db.auth.oauth.denyAuthorization(currentRequest);
  if(result.error)throw result.error;
  if(grantCad){
    const {data:granted,error:grantError}=await db.rpc('lizhi_cad_grant_oauth_client',{p_client:consentClientId});
    if(grantError || granted!==true)
      throw new Error('OAuth 已授權，但 CAD 專用寫入許可無法登記。為安全起見，請勿嘗試繪圖並聯繫管理者。');
  }
  if(!trustedRedirect(result.data?.redirect_url))throw new Error('Supabase 未提供有效的安全重新導向網址');
  sessionStorage.removeItem(PENDING_KEY);
  location.assign(result.data.redirect_url);
 }catch(e){msg('授權操作失敗：'+String(e?.message||'未知錯誤'));toggle(true);}
 finally{busy=false;}
}
document.querySelector('#google-login').addEventListener('click',async()=>{
 if(!validId(id))return;
 sessionStorage.setItem(PENDING_KEY,id);
 msg('即將轉往 Google 登入；登入後返回授權確認畫面。');
 try{
  const target=new URL('../../',location.href);
  const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:target.href}});
  if(error)throw error;
 }catch(e){msg('Google 登入未開始：'+String(e?.message||'未知錯誤'));}
});
approve.addEventListener('click',()=>decide(true));
deny.addEventListener('click',()=>decide(false));
load();
})();
