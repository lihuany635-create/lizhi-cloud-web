import test from "node:test";
import assert from "node:assert/strict";
import {getCadSiteV4Tools,invokeCadSiteV4Tool} from "../sites-migration/cad/site-native-v4.mjs";
const owner={signedIn:true,verifiedUserEmail:"Owner@EXAMPLE.test"};
const other={signedIn:true,verifiedUserEmail:"other@example.test"};
const settings={ownerEmail:"owner@example.test",siteMcpToken:"a".repeat(64)};
const six=["cad_status","cad_draw_rectangle","cad_draw_line","cad_draw_circle","cad_new_drawing","cad_job_status"];
const three=["cad_inspect_drawing","cad_list_entities","cad_read_job"];
const session_id="11111111-1111-4111-8111-111111111111";
const request_id="22222222-2222-4222-8222-222222222222";
test("native dispatcher preserves six tools when disabled, adds only three when enabled",()=>{
  assert.deepEqual(getCadSiteV4Tools(owner,settings).map(x=>x.name),six);
  assert.deepEqual(getCadSiteV4Tools(owner,{...settings,entityReadEnabled:true}).map(x=>x.name),[...six,...three]);
  assert.deepEqual(getCadSiteV4Tools(other,{...settings,entityReadEnabled:true}),[]);
  assert.deepEqual(getCadSiteV4Tools(null,{...settings,entityReadEnabled:true}),[]);
  assert.deepEqual(getCadSiteV4Tools(owner,{...settings,ownerEmail:""}),[]);
});
test("site-native tools never trust caller-supplied owner and do not forward disabled read",async()=>{
  let hits=0;const fetcher=async()=>{hits++;throw Error("unexpected upstream")};
  const args={session_id,request_id};
  for(const auth of [other,null]){
    const got=await invokeCadSiteV4Tool("cad_status",{},auth,settings,fetcher);
    assert.equal(got.isError,true);
    assert.equal(got.content[0].text,"OWNER_AUTH_REQUIRED");
  }
  const disabled=await invokeCadSiteV4Tool("cad_inspect_drawing",args,owner,settings,fetcher);
  assert.equal(disabled.isError,true);
  assert.equal(disabled.content[0].text,"CAD_READ_NOT_ENABLED");
  const unknown=await invokeCadSiteV4Tool("cad_move_entity",args,owner,{...settings,entityReadEnabled:true},fetcher);
  assert.equal(unknown.isError,true);
  assert.equal(hits,0);
});
test("native dispatcher forwards one allowed read, zero mutation retries",async()=>{
  let count=0;
  const settingsOn={...settings,entityReadEnabled:true};
  const result=await invokeCadSiteV4Tool("cad_inspect_drawing",{session_id,request_id},owner,settingsOn,async(_,options)=>{
    count++;
    assert.equal(options.redirect,"manual");
    assert.equal(options.headers.Authorization,"Bearer "+settings.siteMcpToken);
    const sent=JSON.parse(options.body);
    assert.equal(sent.params.name,"cad_inspect_drawing");
    return Response.json({jsonrpc:"2.0",id:sent.id,result:{isError:false,content:[{type:"text",text:JSON.stringify({ok:true,job_id:"33333333-3333-4333-8333-333333333333",queued:true,completed:false})}]}});
  });
  assert.equal(result.isError,false);
  assert.equal(JSON.parse(result.content[0].text).queued,true);
  assert.equal(count,1);
});
test("native dispatcher original status remains a valid one-call upstream operation",async()=>{
  let calls=0;
  const response=await invokeCadSiteV4Tool("cad_status",{},owner,settings,async(_url,options)=>{
    calls++;
    assert.equal(options.redirect,"manual");
    const request=JSON.parse(options.body);
    assert.equal(request.params.name,"cad_status");
    return Response.json({jsonrpc:"2.0",id:request.id,result:{isError:false,content:[{type:"text",text:JSON.stringify({ok:true,online:false,sessions:[]})}]}});
  });
  assert.equal(response.isError,false);
  assert.equal(calls,1);
  assert.equal(JSON.parse(response.content[0].text).online,false);
});
