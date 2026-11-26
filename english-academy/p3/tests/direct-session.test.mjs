import test from 'node:test';
import assert from 'node:assert/strict';
import {MCP_TOOLS,MCP_VERSION,createMcpHandler} from '../mcp-server.mjs';

const changes=['sync_learning_session','create_card_candidates','record_language_errors'];
const content={
 candidates:[{term:'hungry',meaningZh:'餓的'}],
 errors:[{original:'I am prefer salty.',corrected:'I prefer salty food.',explanation:'Prefer does not take am.'}],
};
let seq=0;
function req(tool,args,token='owner'){
 return new Request('https://example.invalid/mcp',{
  method:'POST',
  headers:{
   'content-type':'application/json',
   'mcp-protocol-version':MCP_VERSION,
   authorization:'Bearer '+token,
  },
  body:JSON.stringify({
   jsonrpc:'2.0',id:++seq,method:'tools/call',
   params:{name:tool,arguments:args,_meta:{
    'io.modelcontextprotocol/protocolVersion':MCP_VERSION,
    'io.modelcontextprotocol/clientCapabilities':{}
   }}
  })
 });
}
function fixture(scopes=['english:read','english:candidate']){
 const writes=[];
 const handle=createMcpHandler({
  authenticate:async()=>({
   active:true,serverVerified:true,userId:'server-resolved-owner',
   verifiedClientId:'existing-private-site',scopes,
  }),
  backend:{syncCandidate:async item=>{
    writes.push(item);return {ok:true,data:{status:'success'}};
  }},
 });
 return {handle,writes};
}

test('owner-verified MCP tools require no second website-consent ID',async()=>{
 for(const name of changes){
  const tool=MCP_TOOLS.find(t=>t.name===name);
  assert.ok(tool);
  assert.equal(tool.inputSchema.required.includes('sourceSessionId'),false,name);
  const f=fixture();
  const data=await (await f.handle(req(name,{
   requestId:'english-direct-test-'+name,
   ...(name==='record_language_errors'?{errors:content.errors}:{candidates:content.candidates}),
  }))).json();
  assert.equal(data.result.isError,false,name);
  assert.equal(f.writes.length,1,name);
  assert.equal(f.writes[0].sourceSessionId,'mcp-direct-session',name);
 }
});
test('same convenience does not bypass verified owner write scope',async()=>{
 const f=fixture(['english:read']);
 const data=await (await f.handle(req('create_card_candidates',{
  requestId:'english-direct-readonly-rejected',
  candidates:content.candidates,
 }))).json();
 assert.equal(data.result.isError,true);
 assert.equal(JSON.parse(data.result.content[0].text).code,'SCOPE_DENIED');
 assert.equal(f.writes.length,0);
});
