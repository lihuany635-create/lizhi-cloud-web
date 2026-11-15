import test from 'node:test';
import assert from 'node:assert/strict';
import {mountEnglishOnExistingSite} from '../mount-existing-site.mjs';

const names=['aiwb_overview','side_overview','licut_status','list_projects','get_project',
 'create_project','list_project_images','read_project_image','import_project_image','update_project_image'];
const live={jsonrpc:'2.0',id:1,result:{tools:names.map(name=>({name,description:'preserved'}))}};
const url='https://private-site.example/mcp';
let originalCalls=0;
const postOriginal=async req=>{
 originalCalls++;
 const body=await req.json();
 if(body.method==='tools/list')return Response.json(live);
 if(body.method==='tools/call')return Response.json({
  jsonrpc:'2.0',id:body.id,result:{content:[{type:'text',text:'old-tool-ok'}]}
 });
 return Response.json({jsonrpc:'2.0',id:body.id,result:{status:'old-server'}});
};
const create=(opts={})=>mountEnglishOnExistingSite({
 postOriginal,isReady:async()=>true,
 verifySiteOwner:async()=>({serverVerified:true,
  ownerId:'4efc178f-e255-4e87-9197-d1b286ef892e',
  scopes:['english:read','english:candidate']}),
 invokeEnglish:async()=>({ok:true,data:{preview:true}}),
 baselineNames:names,...opts
});
const req=body=>new Request(url,{method:'POST',
 headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('integrates English discovery into original Site without changing old tool order',async()=>{
 const s=create();
 const r=await s(req({jsonrpc:'2.0',id:1,method:'tools/list'}));
 const j=await r.json();
 assert.deepEqual(j.result.tools.slice(0,names.length),live.result.tools);
 assert.ok(j.result.tools.some(x=>x.name==='english_get_review_summary'));
 assert.equal(j.result.tools.length,names.length+7);
});
test('legacy tools and non-MCP calls go to original handler',async()=>{
 const s=create();originalCalls=0;
 const old=await (await s(req({jsonrpc:'2.0',id:2,method:'tools/call',
  params:{name:'aiwb_overview',arguments:{}}}))).json();
 assert.equal(old.result.content[0].text,'old-tool-ok');
 const unknown=await (await s(req({jsonrpc:'2.0',id:3,method:'ping'}))).json();
 assert.equal(unknown.result.status,'old-server');
 assert.equal(originalCalls,2);
});
test('English unavailable never disables old Site tools',async()=>{
 const s=create({isReady:async()=>false});
 const list=await (await s(req({jsonrpc:'2.0',id:1,method:'tools/list'}))).json();
 assert.deepEqual(list,live);
 const denial=await (await s(req({jsonrpc:'2.0',id:4,method:'tools/call',
  params:{name:'english_get_review_summary',arguments:{}}}))).json();
 assert.equal(denial.result.isError,true);
 const after=await (await s(req({jsonrpc:'2.0',id:5,method:'tools/call',
  params:{name:'side_overview',arguments:{}}}))).json();
 assert.equal(after.result.content[0].text,'old-tool-ok');
});
