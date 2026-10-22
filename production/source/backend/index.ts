declare const Deno:{env:{get(name:string):string|undefined};serve(handler:(req:Request)=>Promise<Response>):void};
import {operate,type State} from './state.ts';
import {FlowError,episodeSettings} from '../lib/workflow.ts';
const URL_BASE=Deno.env.get('SUPABASE_URL')!,SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ORIGIN='https://lihuany635-create.github.io';
const adminHeaders={'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json'};
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
async function db(path:string,options:RequestInit={}):Promise<any>{const r=await fetch(URL_BASE+'/rest/v1/'+path,{...options,headers:{...adminHeaders,...options.headers}});if(!r.ok)throw new FlowError('工作台儲存服務暫時無法使用',503);const text=await r.text();return text?JSON.parse(text):null;}
export async function handler(req:Request){
 const origin=req.headers.get('origin'),cors:Record<string,string>={'Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
 if(origin===ORIGIN){cors['Access-Control-Allow-Origin']=ORIGIN;cors['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';cors['Access-Control-Allow-Methods']='GET,POST,OPTIONS';}
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
 try{
  if(origin&&origin!==ORIGIN)throw new FlowError('來源驗證失敗',403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(!['GET','POST'].includes(req.method))throw new FlowError('不支援的方法',405);
  const token=req.headers.get('authorization')?.replace(/^Bearer /i,'')??'';if(!token||token.length>5000)throw new FlowError('請先登入立之雲端庫',401);
  const isBridge=token.startsWith('lzp_');let owner:string,sourceOwner='',kind:'author'|'ai',name:string;
  if(isBridge){
   if(origin)throw new FlowError('工具憑證不可在瀏覽器使用',403);
   const keys=await db('lizhi_production_ai_keys?key_hash=eq.'+await digest(token)+'&select=owner_id,chatgpt_owner');if(keys.length!==1)throw new FlowError('工具憑證無效',401);
   owner=keys[0].owner_id;sourceOwner=keys[0].chatgpt_owner;kind='ai';name='ChatGPT（雲端庫製作工作台）';
  }else{
   const r=await fetch(URL_BASE+'/auth/v1/user',{headers:{apikey:SERVICE,Authorization:'Bearer '+token}});if(!r.ok)throw new FlowError('登入已失效，請重新登入雲端庫',401);
   const user=await r.json() as {id?:string;email?:string;is_anonymous?:boolean};if(!user.id||!user.email||user.is_anonymous)throw new FlowError('需要已核准的雲端庫帳號',403);owner=user.id;kind='author';name=user.email;
  }
  const actor={id:owner,name,kind},url=new URL(req.url),part=url.pathname.split('/').filter(Boolean).at(-1);let op:string,args:unknown[];
  const text=req.method==='POST'?await req.text():'';if(text.length>(isBridge?24000000:1800000))throw new FlowError('資料超過大小限制',413);const b=text?JSON.parse(text):{};
  if(part==='bridge'){
   if(!isBridge)throw new FlowError('此介面僅供已授權的 AI 工具使用',403);op=String(b.op);args=Array.isArray(b.args)?b.args:[];
  }else if(part==='projects'){
   if(req.method==='GET'){op=url.searchParams.get('id')?(url.searchParams.get('view')==='brief'?'readEpisodeBrief':'getProject'):'listProjects';args=url.searchParams.get('id')?[url.searchParams.get('id')]:[];}
   else {op=b.action==='create_project'?'createProject':'mutate';args=op==='createProject'?[b.title,b.episode]:[b.projectId,b.revision,b.action,b.args??{}];}
  }else if(part==='works'){
   if(req.method==='GET'){op=url.searchParams.get('id')?'workView':'listWorks';args=url.searchParams.get('id')?[url.searchParams.get('id')]:[];}
   else if(b.action==='create_work'){op='createWork';args=[b.title];}
   else if(b.action==='convert_episode'){op='convertEpisode';args=[b.episodeId,b.episodeRevision,b.title];}
   else if(b.action==='create_episode'){op='createEpisode';args=[b.workId,b.revision,b.episode,b.title];}
   else {op='mutateWork';args=[b.workId,b.revision,b.action,b.args??{}];}
  }else throw new FlowError('找不到製作工作台介面',404);
  const existing=await db('lizhi_production_state?owner_id=eq.'+encodeURIComponent(owner)+'&select=revision,data');
  if(op==='migrate'){
   if(!isBridge)throw new FlowError('不允許資料搬移',403);const rows=b.rows;
   if(b.sourceOwner!==sourceOwner||!Array.isArray(rows)||rows.length>1000||rows.some((x:any)=>!x||typeof x.id!=='string'||typeof x.revision!=='number'||!x.title)||new Set(rows.map((x:any)=>x.id)).size!==rows.length)throw new FlowError('來源資料驗證失敗');
   const hash=await digest(JSON.stringify(rows));if(existing.length){if(existing[0].data.migration?.sourceOwner!==sourceOwner||existing[0].data.migration?.digest!==hash)throw new FlowError('目的資料已存在，禁止覆寫',409);return json({migrated:true,alreadyImported:true,count:rows.length,digest:hash});}
   const data={rows,migration:{sourceOwner,digest:hash,at:new Date().toISOString()}};await db('lizhi_production_state',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({owner_id:owner,revision:1,data})});return json({migrated:true,count:rows.length,digest:hash});
  }
  if(existing.length!==1)throw new FlowError('製作資料尚未搬移完成，請稍後重新整理',503);
  const record=existing[0],next=operate(record.data as State,op,args,actor);
  if(next.changed){const updated=await db('lizhi_production_state?owner_id=eq.'+encodeURIComponent(owner)+'&revision=eq.'+record.revision+'&select=revision',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({revision:record.revision+1,data:next.state,updated_at:new Date().toISOString()})});if(updated.length!==1)throw new FlowError('其他裝置或 AI 已更新，請重新讀取後再儲存',409);}
  return json(part==='projects'&&req.method==='GET'&&url.searchParams.get('view')==='settings'?episodeSettings(next.result as any):next.result);
 }catch(e){return json({error:e instanceof FlowError?e.message:e instanceof SyntaxError?'請求格式錯誤':'製作工作台服務暫時無法使用'},e instanceof FlowError?e.status:e instanceof SyntaxError?400:500);}
}
Deno.serve(handler);
