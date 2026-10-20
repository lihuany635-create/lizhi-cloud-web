import {bridgeTarget,LIBRARY_ORIGIN} from './bridge-protocol.mjs?v=28';
export const LIBRARY_WORKBENCH=LIBRARY_ORIGIN+'/lizhi-cloud-web/?open=imagegraph';
export const BRIDGE_CONSENT_KEY='yinggou.bridge-consent.v1';
export function bridgeAccountURL(value){
 const u=new URL(value);bridgeTarget(u.searchParams.get('client_origin'),u.searchParams.get('nonce'));
 const path='/workbench/bridge.html?'+new URLSearchParams({client_origin:u.searchParams.get('client_origin'),nonce:u.searchParams.get('nonce')});
 return '/account?return_to='+encodeURIComponent(path);
}
export function accountNavigation(params={}){
 const basic={backHref:'/workbench/index.html',backLabel:'返回工作台',signInReturn:'/workbench/index.html',signOutReturn:'/account'};
 if(params.from==='library')return {backHref:LIBRARY_WORKBENCH,backLabel:'返回立之雲端庫',signInReturn:'/account?from=library',signOutReturn:'/account?from=library'};
 const value=params.return_to;
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return basic;
 try{
  const u=new URL(value,'https://return.invalid');
  if(u.origin!=='https://return.invalid'||u.pathname!=='/workbench/bridge.html'||u.hash||[...u.searchParams.keys()].some(k=>!['client_origin','nonce'].includes(k)))return basic;
  bridgeTarget(u.searchParams.get('client_origin'),u.searchParams.get('nonce'));
  if(u.searchParams.getAll('client_origin').length!==1||u.searchParams.getAll('nonce').length!==1)return basic;
  const account=bridgeAccountURL(u.href),backHref=decodeURIComponent(account.slice('/account?return_to='.length));
  return {backHref,backLabel:'返回雲端庫連接',signInReturn:backHref,signOutReturn:account};
 }catch{return basic}
}
export function rememberedBridgeConsent(storage,href,now=Date.now()){
 try{
  const u=new URL(href),target=bridgeTarget(u.searchParams.get('client_origin'),u.searchParams.get('nonce'));
  const saved=JSON.parse(storage?.getItem(BRIDGE_CONSENT_KEY)||'null');
  return !!saved&&saved.origin===target.origin&&saved.nonce===target.nonce&&Number.isFinite(saved.time)&&now>=saved.time&&now-saved.time<15*60*1000;
 }catch{return false}
}
