// P3 MCP candidate, protocol 2026-07-28. NOT DEPLOYED.
// IMPORTANT: authenticate() and verifyApproval() are trusted SERVER-SIDE
// integrations. Never populate the actor or approval from request JSON,
// self-declared MCP clientInfo, Origin, or user-controlled headers.
export const MCP_VERSION = '2026-07-28';
export const SERVER_INFO = Object.freeze({name:'lizhi-english-academy',version:'0.3.0-candidate'});
const JSON_HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin'};
const VERSION_META = 'io.modelcontextprotocol/protocolVersion';
const CLIENT_CAPS = 'io.modelcontextprotocol/clientCapabilities';
const SERVER_INFO_META = 'io.modelcontextprotocol/serverInfo';
const ID_RE = /^[A-Za-z0-9_-]{12,100}$/;

const readOnly = ['get_learning_profile','get_review_summary','list_card_candidates','get_sync_status'];
const candidateWrites = ['sync_learning_session','create_card_candidates','record_language_errors'];
const explicitWrites = ['add_vocabulary'];

const obj = o => !!o && typeof o==='object' && !Array.isArray(o);
const str = (s,max=120)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
const requestIdOk = s=>typeof s==='string'&&ID_RE.test(s);

const string = (description,maxLength=120)=>({type:'string',description,maxLength});
const tool = (name,title,description,properties,required=[],kind='read')=>({
 name,title,description,
 inputSchema:{type:'object',properties,required,additionalProperties:false},
 annotations:{readOnlyHint:kind==='read',destructiveHint:false,
    idempotentHint:kind!=='read',openWorldHint:false},
});
export const MCP_TOOLS = Object.freeze([
 tool('get_learning_profile','英文學習能力','只讀取已授權帳號的六項技能證據；未測試的能力顯示未測，不能虛構 CEFR。',{},[]),
 tool('get_review_summary','今日複習摘要','只讀取網站排程資料；不由模型自行編造到期數。',{},[]),
 tool('list_card_candidates','待審核單字','列出候選卡，供使用者在網站審核。',{limit:{type:'integer',minimum:1,maximum:50}},[]),
 tool('get_sync_status','同步狀態','按本人請求編號查詢同步結果、失敗及可重試原因。',{requestId:string('原始同步請求編號',100)},['requestId']),
 tool('sync_learning_session','同步英文練習','僅同步伺服器已授權為英文練習的 session 的有限單字候選與錯誤片段。', {
   requestId:string('唯一同步請求編號',100),
   sourceSessionId:string('已在網站授權為英文學習的 session',100),
   candidates:{type:'array',maxItems:10,items:{type:'object',additionalProperties:false,
     properties:{term:string('英文單字／片語',120),meaningZh:string('中文說明',500),senseKey:string('語意區別，可空',80)},
     required:['term','meaningZh']}},
   errors:{type:'array',maxItems:10,items:{type:'object',additionalProperties:false,
     properties:{original:string('原始短句',500),corrected:string('更正短句',500),explanation:string('簡短解釋',500)},
     required:['original','corrected','explanation']}}
 },['requestId','sourceSessionId'],'candidate'),
 tool('create_card_candidates','提出候選單字','只新增待網站審核的候選，不會直接成為正式卡片。',{
   requestId:string('唯一同步請求編號',100),
   sourceSessionId:string('已核准的英文練習 session',100),
   candidates:{type:'array',minItems:1,maxItems:10,items:{type:'object',additionalProperties:false,
     properties:{term:string('單字',120),meaningZh:string('中文說明',500),senseKey:string('語意區別',80)},
     required:['term','meaningZh']}}
 },['requestId','sourceSessionId','candidates'],'candidate'),
 tool('record_language_errors','紀錄英文錯誤','僅在指定學習對話內新增必要錯誤片段與修正說明。',{
   requestId:string('唯一同步請求編號',100),
   sourceSessionId:string('已核准的英文練習 session',100),
   errors:{type:'array',minItems:1,maxItems:10,items:{type:'object',additionalProperties:false,
    properties:{original:string('原始句',500),corrected:string('修正句',500),explanation:string('說明',500)},
    required:['original','corrected','explanation']}}
 },['requestId','sourceSessionId','errors'],'candidate'),
 tool('add_vocabulary','依本人指示正式入卡','只有受信任後端核對指定請求的本人批准後才允許直接入卡；模型自述批准無效。',{
   requestId:string('已在伺服器確認批准的請求編號',100),
   term:string('單字',120),
   meaningZh:string('中文意思',500),
   senseKey:string('語意區別',80)
 },['requestId','term','meaningZh'],'explicit'),
]);

const byName = new Map(MCP_TOOLS.map(t=>[t.name,t]));
const permitted = action => readOnly.includes(action)?'read':candidateWrites.includes(action)?'candidate':explicitWrites.includes(action)?'explicit':null;
function fail(code,message,status=400){return {ok:false,code,message,status}}
function result(id,result){return {jsonrpc:'2.0',id,result:{...result,_meta:{[SERVER_INFO_META]:SERVER_INFO}}}}
function rpcError(id,code,message,data){return {jsonrpc:'2.0',id,error:{code,message,...(data?{data}:{})}}}
function json(status,body,headers={}){
 return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...headers}});
}
function toolResult(data,isError=false){
 return {resultType:'complete',content:[{type:'text',text:JSON.stringify(data)}],isError};
}
function validateToolInput(toolName,args) {
 if(!obj(args))return fail('INVALID_ARGUMENTS','Tool arguments must be an object');
 const schema=byName.get(toolName)?.inputSchema;
 if(!schema)return fail('UNKNOWN_TOOL','Tool is not exposed');
 for(const k of Object.keys(args))if(!(k in schema.properties))return fail('UNEXPECTED_ARGUMENT','Unknown argument: '+k);
 for(const k of schema.required)if(!(k in args))return fail('MISSING_ARGUMENT','Missing: '+k);
 if('limit' in args && (!Number.isInteger(args.limit)||args.limit<1||args.limit>50))
   return fail('INVALID_LIMIT','Limit must be 1..50');
 if('requestId' in schema.properties&&!requestIdOk(args.requestId))
   return fail('INVALID_REQUEST_ID','Expected 12..100 URL-safe chars');
 if('sourceSessionId' in schema.properties&&!str(args.sourceSessionId,100))
   return fail('INVALID_SESSION','Source session is required');
 if('term' in schema.properties&&!str(args.term,120))
   return fail('INVALID_TERM','Invalid term');
 if('meaningZh' in schema.properties&&!str(args.meaningZh,500))
   return fail('INVALID_MEANING','Invalid meaning');
 if('senseKey' in args&&(!str(args.senseKey,80)))return fail('INVALID_SENSE','Invalid sense');
 const checkArr=(key,max,required)=>{
   if(!(key in schema.properties))return null;
   const items=args[key];
   if(required && (!Array.isArray(items)||!items.length))return fail('INVALID_'+key.toUpperCase(),'Missing items');
   if(items===undefined)return null;
   if(!Array.isArray(items)||items.length>max)return fail('INVALID_'+key.toUpperCase(),'Invalid array length');
   for(const item of items){
     if(!obj(item))return fail('INVALID_ITEM','Invalid item');
     const fields=key==='candidates'?['term','meaningZh','senseKey']:['original','corrected','explanation'];
     if(Object.keys(item).some(k=>!fields.includes(k)))return fail('UNEXPECTED_ITEM_FIELD','Unknown item field');
     if(key==='candidates'){
       if(!str(item.term,120)||!str(item.meaningZh,500)||('senseKey' in item && !str(item.senseKey,80)))
         return fail('INVALID_CANDIDATE','Invalid candidate');
     } else if(!str(item.original,500)||!str(item.corrected,500)||!str(item.explanation,500))
       return fail('INVALID_ERROR','Invalid error');
   }
   return null;
 };
 return checkArr('candidates',10,toolName==='create_card_candidates')||
        checkArr('errors',10,toolName==='record_language_errors');
}
async function execute(name,args,actor,{backend,verifyApproval}){
 const kind=permitted(name);
 if(!kind)return fail('UNKNOWN_TOOL','Unknown learning tool');
 if(kind!=='read'&&!actor.scopes.includes('english:candidate')&&
    !(kind==='explicit'&&actor.scopes.includes('english:formal_write')))
    return fail('SCOPE_DENIED','Insufficient learning scope',403);
 if(kind==='read'&&!actor.scopes.includes('english:read'))
    return fail('SCOPE_DENIED','Read scope missing',403);
 if(kind==='explicit'&&!actor.scopes.includes('english:formal_write'))
    return fail('SCOPE_DENIED','Explicit-write scope missing',403);
 if(name==='get_learning_profile')return {ok:true,data:await backend.getProfile(actor.userId)};
 if(name==='get_review_summary')return {ok:true,data:await backend.getReviewSummary(actor.userId)};
 if(name==='list_card_candidates')return {ok:true,data:await backend.listCandidates(actor.userId,args.limit??20)};
 if(name==='get_sync_status')return {ok:true,data:await backend.getSyncStatus(actor.userId,args.requestId)};
 if(kind==='candidate'){
   const outcome=await backend.syncCandidate({
     ownerId:actor.userId,
     action:name,
     requestId:args.requestId,
     sourceSessionId:args.sourceSessionId,
     candidates:args.candidates??[],
     errors:args.errors??[],
   });
   return outcome;
 }
 if(name==='add_vocabulary'){
   // The approval must be recorded and verified by a trusted server-side authority.
   // No approved:true supplied by an LLM or browser counts.
   if(typeof verifyApproval!=='function')return fail('APPROVAL_NOT_CONFIGURED','No trusted consent verifier',403);
   const approved=await verifyApproval({actor,action:name,requestId:args.requestId,
      term:args.term,meaningZh:args.meaningZh,senseKey:args.senseKey??''});
   if(approved?.verified!==true||approved.ownerId!==actor.userId||
      approved.action!==name||approved.requestId!==args.requestId)
      return fail('EXPLICIT_APPROVAL_REQUIRED','Owner consent required',403);
   return backend.addVocabulary({ownerId:actor.userId,requestId:args.requestId,term:args.term,
     meaningZh:args.meaningZh,senseKey:args.senseKey??''});
 }
 return fail('UNKNOWN_TOOL','Unknown learning tool');
}
export function createMcpHandler({authenticate,backend,verifyApproval=null,allowedOrigins=[]}={}){
 if(typeof authenticate!=='function'||!backend||!Array.isArray(allowedOrigins))
   throw new TypeError('TRUSTED_SERVER_DEPENDENCIES_REQUIRED');
 const originAllowlist = new Set(allowedOrigins);
 return async function handleMcp(request){
   const origin=request.headers.get('origin');
   if(origin&&!originAllowlist.has(origin))
     return json(403,{error:'UNAUTHORIZED_ORIGIN'});
   if(request.method!=='POST')
     return json(405,{error:'POST_ONLY'},{allow:'POST'});
   const contentType=request.headers.get('content-type')??'';
   if(!contentType.toLowerCase().startsWith('application/json'))
     return json(415,{error:'JSON_CONTENT_REQUIRED'});
   const authorization=request.headers.get('authorization')??'';
   if(!/^Bearer [^\s]+$/.test(authorization))
     return json(401,{error:'BEARER_REQUIRED'});
   const len=Number(request.headers.get('content-length')??0);
   if(len>16384)return json(413,{error:'REQUEST_TOO_LARGE'});
   let body,raw;
   try{raw=await request.text();if(raw.length>16384)return json(413,{error:'REQUEST_TOO_LARGE'});body=JSON.parse(raw)}
   catch{return json(400,rpcError(null,-32700,'Parse error'));}
   if(!obj(body)||body.jsonrpc!=='2.0'||!('id' in body)||
     !(typeof body.id==='string'||typeof body.id==='number')||
     !str(body.method,100)||!obj(body.params))
     return json(400,rpcError(body?.id??null,-32600,'Invalid Request'));
   const meta=body.params._meta;
   const version=request.headers.get('mcp-protocol-version');
   if(!version||!obj(meta)||meta[VERSION_META]!==version)
     return json(400,rpcError(body.id,-32600,'HeaderMismatch'));
   if(version!==MCP_VERSION)
     return json(400,rpcError(body.id,-32600,'UnsupportedProtocolVersionError',{supported:[MCP_VERSION]}));
   if(!obj(meta[CLIENT_CAPS]))
     return json(400,rpcError(body.id,-32600,'MissingRequiredClientCapabilityError'));
   // No trust in self-declared _meta/clientInfo, origin or requested ownerId.
   let actor;
   try{actor=await authenticate({bearer:authorization.slice(7),request});}
   catch{return json(401,{error:'INVALID_TOKEN'});}
   if(actor?.serverVerified!==true||!str(actor.userId,100)||
     !str(actor.verifiedClientId,100)||actor.active!==true||
     !Array.isArray(actor.scopes))
     return json(403,{error:'ACCOUNT_OR_CLIENT_NOT_ALLOWED'});
   if(body.method==='server/discover')
     return json(200,result(body.id,{resultType:'complete',
       supportedVersions:[MCP_VERSION],capabilities:{tools:{listChanged:false}},
       ttlMs:60000,cacheScope:'private'}));
   if(body.method==='tools/list'){
     const allowedTools=MCP_TOOLS.filter(t=>actor.scopes.includes('english:read')&&
       (permitted(t.name)==='read'||actor.scopes.includes(
         permitted(t.name)==='explicit'?'english:formal_write':'english:candidate')));
     return json(200,result(body.id,{resultType:'complete',tools:allowedTools,ttlMs:60000,cacheScope:'private'}));
   }
   if(body.method!=='tools/call')
     return json(200,rpcError(body.id,-32601,'Method not found'));
   const p=body.params,toolName=p.name,args=p.arguments??{};
   if(typeof toolName!=='string'||!byName.has(toolName))
     return json(200,rpcError(body.id,-32601,'Unknown tool'));
   const checked=validateToolInput(toolName,args);
   if(checked)return json(200,result(body.id,toolResult({code:checked.code,message:checked.message},true)));
   try{
     const out=await execute(toolName,args,actor,{backend,verifyApproval});
     return json(200,result(body.id,toolResult(out.ok?out.data:{code:out.code,
        message:out.message,retryable:out.retryable??false},!out.ok)));
   }catch{
     // Backend errors are never shown verbatim (may include secrets or raw SQL).
     return json(200,result(body.id,toolResult({
       code:'BACKEND_UNAVAILABLE',message:'Learning service temporarily unavailable',retryable:true},true)));
   }
 };
}
