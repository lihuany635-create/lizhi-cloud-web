import test from 'node:test';
import assert from 'node:assert/strict';
import {createExistingSiteEnglishExtension} from '../site-mcp-extension.mjs';

const owner='4efc178f-e255-4e87-9197-d1b286ef892e';
const baseNames=[
 ...['overview','save_project','list_tasks','get_task','create_task',
   'update_task','tick_check','attach_report','notify','inbox'].map(x=>'aiwb_'+x),
 ...['list_projects','get_project','create_project','list_project_images',
   'read_project_image','import_project_image','update_project_image'],
 ...['overview','log_save','log_list','todo_save','todo_tick','todo_list','delete'].map(x=>'side_'+x),
 ...['status','project','media','edit','transport','align_voice',
   'command_status','recent_commands','capabilities','preview_media'].map(x=>'licut_'+x)
];
const existing=baseNames.map(name=>({name,inputSchema:{type:'object'},description:'Existing, must remain'}));
const original={jsonrpc:'2.0',id:11,result:{tools:existing,cursor:'preserve-me'}};
const request=new Request('https://site.example/mcp',{method:'POST'});
const call=(name,args={})=>({jsonrpc:'2.0',method:'tools/call',id:22,
 params:{name,arguments:args}});
const actor={serverVerified:true,ownerId:owner,scopes:['english:read','english:candidate']};
const make=({ready=true,verifySiteOwner=async()=>actor,invokeEnglish=async p=>({
 ok:true,action:p.toolName,owner:p.actor.ownerId
}),names=baseNames}={})=>
 createExistingSiteEnglishExtension({
  isReady:async()=>ready,
  verifySiteOwner,invokeEnglish,baselineNames:names
 });
const result=r=>JSON.parse(r.result.content[0].text);

test('adds seven namespaced English tools without deleting/reordering 34 existing tools',async()=>{
 const ext=make();
 const extended=await ext.toolsList({request,existingReply:original});
 assert.equal(extended.result.tools.length,existing.length+7);
 assert.deepEqual(extended.result.tools.slice(0,existing.length),existing);
 assert.equal(extended.result.cursor,'preserve-me');
 assert.ok(extended.result.tools.some(t=>t.name==='english_record_language_errors'));
 assert.ok(extended.result.tools.some(t=>t.name==='english_create_card_candidates'));
 assert.ok(!extended.result.tools.some(t=>t.name==='english_add_vocabulary'));
 assert.equal(original.result.tools.length,34);
});
test('not ready returns original MCP tools unchanged, no misleading English discovery',async()=>{
 const ext=make({ready:false});
 assert.deepEqual(await ext.toolsList({request,existingReply:original}),original);
 const denied=await ext.toolCall({request,body:call('english_get_review_summary')});
 assert.equal(result(denied).code,'ENGLISH_NOT_CONFIGURED');
});
test('namespaced calls use verified site owner; no model-supplied owner',async()=>{
 let called;
 const ext=make({invokeEnglish:async p=>{called=p;return {ok:true,value:'stored-candidate-test-only'};}});
 const out=await ext.toolCall({request,body:call('english_record_language_errors',{
   requestId:'request-1234567890',sourceSessionId:'approved-test-session',
   errors:[{original:'They goes yesterday.',corrected:'They went yesterday.',explanation:'Past tense'}]
 })});
 assert.equal(called.actor.ownerId,owner);
 assert.equal(called.toolName,'record_language_errors');
 assert.equal(result(out).value,'stored-candidate-test-only');
 assert.equal(out.result.isError,false);
});
test('legacy photo/side/aiwb/licut calls bypass English extension entirely',async()=>{
 const ext=make();
 for(const name of baseNames){
  assert.equal(await ext.toolCall({request,body:call(name)}),null,name);
 }
});
test('forged owner and userConfirmed fields are rejected before invocation',async()=>{
 let invoked=false;
 const ext=make({invokeEnglish:async()=>{invoked=true;return {ok:true};}});
 for(const param of [{ownerId:owner},{userConfirmed:true},{googleEmail:'test@example.invalid'}]){
  const out=await ext.toolCall({request,body:call('english_get_learning_profile',param)});
  assert.equal(result(out).code,'FORGED_OWNER_OR_APPROVAL');
  assert.equal(out.result.isError,true);
 }
 assert.equal(invoked,false);
});
test('missing trusted actor identity blocks all English tools',async()=>{
 const ext=make({verifySiteOwner:async()=>({serverVerified:false,ownerId:owner,scopes:[]})});
 const out=await ext.toolCall({request,body:call('english_list_card_candidates')});
 assert.equal(result(out).code,'SITE_IDENTITY_DENIED');
});
test('read-only owner can see read tools but not create card candidates',async()=>{
 const ext=make({verifySiteOwner:async()=>({...actor,scopes:['english:read']})});
 const out=await ext.toolCall({request,body:call('english_create_card_candidates',{
  requestId:'request-1234567890',sourceSessionId:'approved-test-session',
  candidates:[{term:'library',meaningZh:'圖書館'}]
 })});
 assert.equal(result(out).code,'SCOPE_DENIED');
});
test('formal card bypass cannot be exposed even when requested by model',async()=>{
 const ext=make();
 const out=await ext.toolCall({request,body:call('english_add_vocabulary',{term:'book',meaningZh:'書'})});
 assert.equal(result(out).code,'ENGLISH_TOOL_NOT_EXPOSED');
});
test('broken legacy catalogs stop extension rather than silently dropping tools',async()=>{
 const ext=make();
 const broken={...original,result:{tools:existing.filter(x=>x.name!=='side_overview')}};
 await assert.rejects(()=>ext.toolsList({request,existingReply:broken}),/LEGACY_TOOL_MISSING/);
});
test('duplicate existing tool names are refused and image content stays intact',async()=>{
 const ext=make({invokeEnglish:async()=>({content:[
  {type:'image',data:'synthetic-image-base64',mimeType:'image/png'}],isError:false})});
 await assert.rejects(()=>ext.toolsList({request,existingReply:{
  ...original,result:{tools:[...existing,existing[0]]}}}),/DUPLICATE_TOOL_NAME/);
 const out=await ext.toolCall({request,body:call('english_get_review_summary')});
 assert.deepEqual(out.result.content,[{type:'image',data:'synthetic-image-base64',mimeType:'image/png'}]);
});
