// Owner authorization MUST run before this dispatcher. Writes append to existing Side only.
import {createAiActionEntry} from './lizhi-ai-operation-ledger.mjs';
import {createBudgetRow,SIDE_PROJECT,SIDE_AGENT,aiPreflight} from './lizhi-ai-side-ledger.mjs';
import {usageMonth} from './lizhi-usage-mcp-core.mjs';
const month={type:'string',pattern:'^20[0-9]{2}-(0[1-9]|1[0-2])$'};
const str={type:'string',minLength:2,maxLength:140};
const uuid={type:'string',pattern:'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'};
const count={type:'integer',minimum:0,maximum:1000};
const base={eventId:uuid,service:str,feature:str,taskLabel:str,actionDetail:str,
 operation:{type:'string',enum:['sql_read','sql_write','edge_read','edge_deploy','logs_read','auth_read','management_read','other']}};
const object=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const tool=(name,description,inputSchema,write=false)=>({name,description,inputSchema,
 annotations:{readOnlyHint:!write,destructiveHint:false,openWorldHint:false}});
const queries=object({month});
export const AI_USAGE_TOOLS=Object.freeze([
 tool('usage_status','查詢 AI 自行記帳及連線狀態；不代表官方計費量。',queries),
 tool('usage_summary','查詢每日、每月 AI 自登記操作統計，官方計費未知。',queries),
 tool('usage_services','依功能、服務、任務彙總 AI 自登記操作。',queries),
 tool('usage_events','查詢持久保存的 before/after、任務與操作原因。',object({month,eventId:uuid,limit:{type:'integer',minimum:1,maximum:100}})),
 tool('usage_alerts','查詢本人設定的 AI 操作上限及預警，未設定時明示。',queries),
 tool('usage_policy','查詢 AI 操作流程規則及跨對話、全域攔截限制。',object()),
 tool('usage_log_before','Supabase 操作前登記；只有 saved、verified 且 decision=allow 才能執行非必要操作；hold 不可執行。',object({...base,at:{type:'string',maxLength:40},plannedCalls:{...count,minimum:1}},[...Object.keys(base),'at','plannedCalls']),true),
 tool('usage_log_after','用同一 eventId 登記實際成功、失敗或未知結果；補登不能重跑操作。',object({...base,completedAt:{type:'string',maxLength:40},toolCalls:count,outcome:{type:'string',enum:['success','failure','unknown']},evidenceUrl:{type:['string','null'],maxLength:300}},[...Object.keys(base),'completedAt','toolCalls','outcome']),true),
 tool('usage_budget_set','僅已驗證本人可設定每月 AI 工具操作上限，寫入既有 Side 並讀回；不阻擋其他來源的計費流量。',object({month,cap:{type:'integer',minimum:1,maximum:1000000}},['month','cap']),true),
 tool('usage_egress_history','查詢組織 Usage 人工讀數歷史、非快取 GB、5 GB 基準及趨勢；不是即時官方同步，需確認實際方案與帳期。',object({month},['month'])),
 tool('usage_egress_record','僅保存本人提供或授權取得的官方 Usage Total Egress（包含 Cached）及 Cached；同組織同月份期間相減。不可使用已扣除 Cached 的帳單 Egress。必須先核對來源、期間和觀測時間；保存後讀回，重送不重複。',object({month,total:{type:'number',minimum:0,maximum:1e14},cached:{type:'number',minimum:0,maximum:1e14},unit:{type:'string',enum:['B','KB','MB','GB','KiB','MiB','GiB']},observedAt:{type:'string',maxLength:40},samePeriod:{type:'boolean',enum:[true]}},['month','total','cached','unit','observedAt','samePeriod']),true)
]);
const specs=new Map(AI_USAGE_TOOLS.map(x=>[x.name,x]));
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validArgs(args,schema){
 if(!isObj(args))return false;
 if(schema.required.some(k=>!Object.hasOwn(args,k)))return false;
 return Object.entries(args).every(([k,v])=>{
  const p=schema.properties[k];if(!p)return false;
  if(v===null)return Array.isArray(p.type)&&p.type.includes('null');
  if(p.type==='boolean')return typeof v==='boolean'&&(!p.enum||p.enum.includes(v));
  if(p.type==='number')return typeof v==='number'&&Number.isFinite(v)&&v>=p.minimum&&v<=p.maximum;
  if(p.type==='integer')return Number.isSafeInteger(v)&&v>=p.minimum&&v<=p.maximum;
  return typeof v==='string'&&(!p.minLength||v.length>=p.minLength)&&(!p.maxLength||v.length<=p.maxLength)&&(!p.pattern||new RegExp(p.pattern).test(v))&&(!p.enum||p.enum.includes(v));
 });
}
function timestamp(x,now){
 if(typeof x!=='string'||!/^20\d{2}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(x)||!Number.isFinite(Date.parse(x))||Date.parse(x)>now.getTime()+60000)
  throw new Error('登記時間無效或在未來。');
}
const meta=['service','feature','taskLabel','actionDetail','operation'];
function parseRow(row){try{return JSON.parse(row.done);}catch{throw new Error('既有事件格式錯誤，禁止覆寫。');}}
function entryArgs(args,phase,at){return createAiActionEntry({...args,eventId:args.eventId.toLowerCase(),phase,at,
 outcome:phase==='before'?'planned':args.outcome,toolCalls:phase==='before'?0:args.toolCalls});}
function evidence(v){
 if(v==null)return;
 const u=new URL(v);
 if(u.username||u.password||u.search||u.hash)throw new Error('驗證連結不可包含登入或查詢資訊。');
}
export async function stableUsageId(key){
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('lizhi-usage-v3:'+key)));
 hash[6]=(hash[6]&15)|128;hash[8]=(hash[8]&63)|128;
 const h=[...hash.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join('');
 return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
async function appendVerified(store,payload,title,key){
 const record={id:await stableUsageId(key),agent:SIDE_AGENT,project:SIDE_PROJECT,title,done:JSON.stringify(payload)};
 await store.append(record); // INSERT only; primary key rejects replay races. Never UPDATE/DELETE.
 const rows=await store.event(payload.eventId);
 const got=rows.find(r=>r.id===record.id);
 if(!got||got.done!==record.done)throw new Error('寫入尚未讀回確認，請勿重新執行原操作。');
 return record.id;
}
async function before(args,store,now){
 timestamp(args.at,now);
 const value={...entryArgs(args,'before',args.at),plannedCalls:args.plannedCalls};
 const rows=await store.event(value.eventId);
 const old=rows.filter(r=>r.title===`AI_USAGE before ${value.eventId}`);
 if(old.some(r=>r.done!==JSON.stringify(value)))throw new Error('相同事件已有不同登記，禁止改列或覆寫。');
 if(old.length>1)throw new Error('歷史事件重複，需核對。');
 const id=old[0]?.id||await appendVerified(store,value,`AI_USAGE before ${value.eventId}`,value.eventId+':before');
 const finished=rows.some(r=>r.title===`AI_USAGE after ${value.eventId}`);
 // Read AFTER saving. A second pending event makes the ledger incomplete and
 // holds optional work, including concurrent plans. No in-memory quota cache.
 const snap=await store.snapshot(usageMonth(new Date(value.at)),value.eventId);
 const preflight=finished?{decision:'hold',reason:'event_already_completed'}:aiPreflight(snap,args.plannedCalls);
 // Past-month backfill is persisted, but must never authorize a new operation.
 const decision=usageMonth(new Date(value.at))===usageMonth(now)?preflight:{decision:'hold',reason:'historical_backfill_only'};
 return {saved:true,verified:true,id,eventId:value.eventId,phase:'before',plannedCalls:args.plannedCalls,...decision,budget:snap.budget,
   note:'僅 AI 自身操作流程；before/after 記帳呼叫不遞迴記帳。'};
}
async function after(args,store,now){
 timestamp(args.completedAt,now);evidence(args.evidenceUrl);
 const eventId=args.eventId.toLowerCase();
 const rows=await store.event(eventId);
 const pres=rows.filter(r=>r.title===`AI_USAGE before ${eventId}`);
 if(pres.length!==1)throw new Error('缺少唯一 before，禁止補跑原操作；請先核對事件。');
 const pre=parseRow(pres[0]);
 if(meta.some(k=>pre[k]!==args[k]))throw new Error('before/after 任務、功能或操作目的不一致。');
 if(Date.parse(args.completedAt)<Date.parse(pre.at))throw new Error('完成時間早於登記時間。');
 const value={...entryArgs(args,'after',pre.at),completedAt:args.completedAt};
 const old=rows.filter(r=>r.title===`AI_USAGE after ${eventId}`);
 if(old.some(r=>r.done!==JSON.stringify(value)))throw new Error('已完成事件內容衝突，禁止覆寫歷史。');
 const id=old[0]?.id||await appendVerified(store,value,`AI_USAGE after ${eventId}`,eventId+':after');
 return {saved:true,verified:true,id,eventId,phase:'after',outcome:value.outcome,toolCalls:value.toolCalls,
 completedAt:args.completedAt,overEstimate:value.toolCalls>pre.plannedCalls,snapshot:await store.snapshot(usageMonth(new Date(pre.at)))};
}
/** Authorization is performed by Edge, not by tool arguments.
 * @param {any} message
 * @param {{store?:any,now?:Date,siteConnected?:boolean,egress?:any}} options
 */
export async function dispatchAiUsageMcp(message,{store,now=new Date(),siteConnected=false,egress}={}){
 const err=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}});
 if(!isObj(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string'||(message.id!==undefined&&!['string','number'].includes(typeof message.id)))return err(null,-32600,'Invalid JSON-RPC request.');
 if(message.method==='notifications/initialized'&&message.id===undefined)return null;
 if(message.id===undefined)return err(null,-32600,'Request ID is required.');
 const ok=result=>({jsonrpc:'2.0',id:message.id,result});
 const out=v=>ok({content:[{type:'text',text:JSON.stringify(v)}],isError:false});
 if(message.method==='server/discover')return ok({supportedVersions:['2026-07-28','2025-06-18'],capabilities:{tools:{}}});
 if(message.method==='initialize')return ok({protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'lizhi-supabase-usage-monitor',version:'0.4.0'}});
 if(message.method==='ping')return ok({});
 if(message.method==='tools/list')return ok({tools:AI_USAGE_TOOLS});
 if(message.method!=='tools/call')return err(message.id,-32601,'Method not found.');
 const name=message.params?.name,spec=specs.get(name),args=message.params?.arguments??{};
 if(!spec||!validArgs(args,spec.inputSchema))return err(message.id,-32602,'工具或參數無效。');
 try{
  if(name==='usage_policy')return out({source:'ai_self_registered_operations',globalInterception:false,automaticAcrossChats:false,
   rules:['先查用量與上限，再預估本次呼叫數','before 必須 saved=true、verified=true、decision=allow 才執行非必要操作','成功失敗皆以同一 eventId 登記 after，再讀回','補登不可重跑原操作','記帳工具本身不遞迴登記'],
   unconfiguredBudget:'hold_optional',pendingOrIncompleteLedger:'hold_optional',capScope:'assistant_workflow_only',officialBillingConnected:false,hasExternalGateway:false});
  if(name==='usage_egress_history')return out(await egress.history(args.month));
  if(name==='usage_egress_record')return out(await egress.record(args));
  if(!store)throw new Error('backend unavailable');
  if(name==='usage_log_before')return out(await before(args,store,now));
  if(name==='usage_log_after')return out(await after(args,store,now));
  if(name==='usage_budget_set'){
   const row=createBudgetRow(args.month,args.cap,now.toISOString());
   const snap=await store.snapshot(args.month);
   if(snap.budget.monthlyToolCap!==args.cap){
    const id=await stableUsageId('budget:'+args.month+':'+now.toISOString()+':'+args.cap);
    await store.append({id,...row});
   }
   const readback=await store.snapshot(args.month);
   if(readback.budget.monthlyToolCap!==args.cap)throw new Error('上限寫入未讀回，可能有並行設定，請重新查詢。');
   return out({saved:true,verified:true,month:args.month,...readback.budget,assistantObservedToolCalls:readback.summary.assistantObservedToolCalls,scope:'assistant_workflow_only'});
  }
  const m=args.month??usageMonth(now),snap=await store.snapshot(m);
  if(snap.source!=='ai_self_registered_operations')throw new Error('wrong source');
  if(name==='usage_events'){
   if(args.eventId)return out({month:m,source:snap.source,records:(await store.event(args.eventId.toLowerCase())).map(r=>{const v=parseRow(r);return {id:r.id,...createAiActionEntry(v),plannedCalls:v.plannedCalls??null,completedAt:v.completedAt??null};})});
   return out({month:m,source:snap.source,events:snap.events.slice(0,args.limit??100),summary:snap.summary});
  }
  if(name==='usage_status')return out({service:'lizhi-supabase-usage-monitor',mode:'ai_self_registration',siteConnected,month:m,
   source:snap.source,complete:snap.complete,budget:snap.budget,summary:snap.summary,globalInterception:false,automaticAcrossChats:false,officialBillingConnected:false});
  if(name==='usage_summary')return out(snap);
  if(name==='usage_services')return out({month:m,source:snap.source,features:snap.features,tasks:snap.tasks,
   services:snap.services,complete:snap.complete});
  return out({month:m,source:snap.source,...snap.budget,assistantObservedToolCalls:snap.summary.assistantObservedToolCalls,complete:snap.complete,officialCost:null});
 }catch{
  return ok({isError:true,content:[{type:'text',text:'監控讀寫未完成或驗證失敗；不可假定已保存。請用相同事件查詢核對，補登不可重新執行原操作。'}]});
 }
}
