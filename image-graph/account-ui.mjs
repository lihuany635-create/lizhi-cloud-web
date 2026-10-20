// Reserved Sites endpoints. Authentication uses normal top-level links only;
// no AuthAPI calls, tokens, iframe sign-in, or simulated browser login flags.
export const ACCOUNT_LINKS=Object.freeze({signIn:'/signin-with-chatgpt?return_to=%2Fworkbench%2Findex.html',signOut:'/signout-with-chatgpt?return_to=%2Faccount'});
export function createAccountUI({prepare,modal,toast,esc,fetcher=(...args)=>fetch(...args),timeoutMs=8000}){
 const $=selector=>document.querySelector(selector),button=$('#accountBtn');let opening=false,generation=0,activeRequest=null;
 $('#modal')?.addEventListener('close',()=>{generation++;activeRequest?.abort();activeRequest=null;opening=false;button.disabled=false});
 async function show(){
  if(opening)return;opening=true;button.disabled=true;const token=++generation;let timer,controller,panel;
  try{
   // The native links are only exposed after the current project is saved.
   const prepared=await prepare();if(token!==generation)return;
   modal('帳號與登入',`<div id="accountIdentity" class="account-identity" role="status">正在確認登入帳號…</div><div class="account-modal-actions"><a id="accountSignIn" class="account-modal-primary" href="${ACCOUNT_LINKS.signIn}" target="_top" referrerpolicy="no-referrer">使用 ChatGPT 登入／重新登入</a><a id="accountSignOut" href="${ACCOUNT_LINKS.signOut}" target="_top" referrerpolicy="no-referrer">登出映構</a></div><p>${prepared?.saved===false?'目前未開啟可編輯的專案。':'目前專案已保存。'}此入口不會清除瀏覽器專案或刪除原圖；登入不會自動同步其他裝置的資料。請繼續使用原本的瀏覽器。</p><p>映構是私人網站，登出後再次開啟可能要求登入。登入授權仍由平台處理。</p><a href="/account" target="_top">開啟完整帳號頁 ↗</a>`);
   panel=$('#accountIdentity');controller=new AbortController();activeRequest=controller;
   timer=setTimeout(()=>controller.abort(),timeoutMs);
   const response=await fetcher('/api/session',{credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal});
   if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('session unavailable');
   const data=await response.json();
   if(typeof data.authenticated!=='boolean'||data.authenticated&&(typeof data.user?.displayName!=='string'||typeof data.user?.email!=='string'))throw Error('invalid session');
   if(token!==generation||panel!==$('#accountIdentity'))return;
   panel.innerHTML=data.authenticated?`<strong>已登入映構</strong><div>${esc(data.user.displayName)}</div><div>${esc(data.user.email)}</div>`:'尚未取得登入身分，請使用下方登入入口。';
  }catch(e){
   if(token!==generation)return;
   if(panel&&panel===$('#accountIdentity'))panel.textContent='目前無法確認登入狀態。你仍可使用下方入口重新登入或登出。';
   else toast(e?.message||'目前專案尚未保存，請稍後再開啟帳號',true);
  }finally{
   clearTimeout(timer);if(activeRequest===controller)activeRequest=null;
   if(token===generation){opening=false;button.disabled=false}
  }
 }
 button.onclick=show;return {show};
}
