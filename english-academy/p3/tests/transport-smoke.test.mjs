// Loopback-only actual HTTP transport smoke test; no cloud service or credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createMcpHandler,MCP_VERSION} from '../mcp-server.mjs';
import {createCandidateBackend} from '../memory-backend.mjs';

test('real loopback HTTP POST returns JSON-RPC result, owner-verified candidate sync and readback',async()=>{
  const backend=createCandidateBackend();
  backend.registerLearningSession({
    ownerId:'demo-owner',sessionId:'session-00001',confirmedByWebsite:true,
  });
  const handler=createMcpHandler({
    allowedOrigins:['https://chatgpt.com'],
    backend,
    authenticate:async({bearer})=>bearer==='mock-mcp-token'?{
      serverVerified:true,active:true,userId:'demo-owner',verifiedClientId:'test-private-app',
      scopes:['english:read','english:candidate']
    }:null
  });
  const server=createServer(async(req,res)=>{
    const body=await new Promise(resolve=>{
      const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>resolve(Buffer.concat(chunks)));
    });
    const headers=new Headers();
    for(const [key,value] of Object.entries(req.headers)){
      if(typeof value==='string')headers.set(key,value);
    }
    const incoming=new Request('http://127.0.0.1'+req.url,{
      method:req.method,headers,body:body.length?body:undefined,
    });
    const response=await handler(incoming);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(await response.text());
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const endpoint='http://127.0.0.1:'+server.address().port+'/mcp';
  const reqMeta={
    'io.modelcontextprotocol/protocolVersion':MCP_VERSION,
    'io.modelcontextprotocol/clientCapabilities':{},
    'io.modelcontextprotocol/clientInfo':{name:'local-test-client',version:'1'},
  };
  let sequence=0;
  const post=async(method,params={})=>{
    const response=await fetch(endpoint,{
      method:'POST',headers:{
        'content-type':'application/json',
        'mcp-protocol-version':MCP_VERSION,
        authorization:'Bearer mock-mcp-token',
        origin:'https://chatgpt.com',
      },
      body:JSON.stringify({jsonrpc:'2.0',id:++sequence,method,
        params:{...params,_meta:reqMeta}}),
    });
    assert.equal(response.status,200);
    return await response.json();
  };
  try{
    const discover=await post('server/discover');
    assert.equal(discover.result.supportedVersions[0],MCP_VERSION);
    const list=await post('tools/list');
    assert.ok(list.result.tools.some(t=>t.name==='sync_learning_session'));
    const write=await post('tools/call',{name:'sync_learning_session',arguments:{
      requestId:'loopback-sync-000001',
      sourceSessionId:'session-00001',
      candidates:[{term:'hungry',meaningZh:'飢餓的'}],
    }});
    const payload=JSON.parse(write.result.content[0].text);
    assert.equal(payload.pendingAdded,1);
    const read=await post('tools/call',{name:'list_card_candidates',arguments:{}});
    const candidatePayload=JSON.parse(read.result.content[0].text);
    assert.equal(candidatePayload.items[0].term,'hungry');
    assert.equal(candidatePayload.items[0].ownerId,'demo-owner');
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
});
