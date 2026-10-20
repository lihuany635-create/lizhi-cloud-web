export const BRIDGE_CHANNEL='yinggou-library-v1';
export const LIBRARY_ORIGIN='https://lihuany635-create.github.io';
const LIBRARY_ORIGINS=new Set([LIBRARY_ORIGIN,'http://127.0.0.1:4180','http://localhost:4180']);
const ID='[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}';
export function bridgeTarget(origin,nonce){
 if(!LIBRARY_ORIGINS.has(origin)||!/^[a-f0-9-]{36}$/.test(nonce||''))throw Error('不支援的雲端庫連線');
 return {origin,nonce};
}
export function validateBridgeRequest(value){
 if(!value||typeof value!=='object'||typeof value.id!=='string'||value.id.length>80)throw Error('交接請求無效');
 if(['list_projects','export_project'].includes(value.action)){
  if(value.action==='export_project'&&!new RegExp('^'+ID+'$','i').test(value.project_id||''))throw Error('專案識別碼無效');
  return value;
 }
 if(value.action!=='api'||typeof value.path!=='string')throw Error('不支援此交接操作');
 const method=value.method||'GET',p=value.path;
 const allowed=method==='GET'&&(p==='/api/session'||p==='/api/handoff/status'||new RegExp('^/api/handoff/tasks/'+ID+'(?:/candidates(?:/'+ID+'/image)?)?$','i').test(p))||method==='POST'&&p==='/api/handoff/tasks'||method==='PUT'&&(new RegExp('^/api/handoff/images/[a-f0-9]{64}$','i').test(p)||new RegExp('^/api/handoff/tasks/'+ID+'/control$','i').test(p));
 if(!allowed)throw Error('此路徑或操作不允許經由交接通道');
 const size=typeof value.body==='string'?new TextEncoder().encode(value.body).length:value.body?.byteLength??0;
 if(size>11*1024*1024||value.body!=null&&typeof value.body!=='string'&&!(value.body instanceof ArrayBuffer)&&!ArrayBuffer.isView(value.body))throw Error('交接內容過大或格式無效');
 const type=value.contentType;if(type!==undefined&&(!['application/json','image/png','image/jpeg','image/webp'].includes(type)))throw Error('交接內容類型無效');
 return {...value,method};
}
