import assert from "node:assert/strict";
const assertEquals=(actual:unknown,expected:unknown)=>assert.deepEqual(actual,expected);
const assertMatch=(actual:string,pattern:RegExp)=>assert.match(actual,pattern);
import { registerLibraryOwnerTools } from "../supabase/functions/library-mcp/owner-tools.ts";

function makeServer(options:{write?:boolean;row?:Record<string,unknown>}={}) {
  const handlers=new Map<string,(args:any)=>Promise<any>>();
  const definitions=new Map<string,any>();
  let queries=0;
  const query:any={
    select(){return this;},eq(){return this;},is(){return this;},not(){return this;},
    order(){return this;},range(){return this;},update(){queries++;return this;},
    insert(){queries++;return this;},single(){return Promise.resolve({data:options.row??null,error:null})},
    maybeSingle(){return Promise.resolve({data:options.row??null,error:null})},
  };
  const supabase:any={
    rpc:async(name:string)=>({data:name==="lizhi_library_mcp_client_allowed"?!!options.write:true,error:null}),
    auth:{getUser:async()=>({data:{user:{id:"7fdc5c04-380e-4c71-90d3-96fc02b211a8",email:"lihuany635@gmail.com"}},error:null})},
    from:()=>query,
    storage:{from:()=>({createSignedUrl:()=>{throw Error("unexpected private storage access");}})}
  };
  const server:any={
    registerTool:(name:string,config:any,handler:any)=>{handlers.set(name,handler);definitions.set(name,config)}
  };
  registerLibraryOwnerTools(server,supabase,(handler:any)=>handler);
  return {handlers,definitions,getQueries:()=>queries};
}

Deno.test("all eleven new tool definitions are present and preserve read/write annotations",()=>{
  const {handlers,definitions}=makeServer();
  assertEquals(handlers.size,11);
  assertEquals(definitions.get("get_official_doc").annotations.readOnlyHint,true);
  assertEquals(definitions.get("update_official_doc").annotations.readOnlyHint,false);
  assertEquals(definitions.get("archive_library_item").annotations.destructiveHint,true);
  for(const name of handlers.keys())
    assertEquals(definitions.get(name)._meta.securitySchemes[0].type,"oauth2");
});
Deno.test("unapproved or read-only OAuth client cannot mutate any table",async()=>{
  const {handlers,getQueries}=makeServer({write:false});
  const args={item_id:"11111111-1111-4111-8111-111111111111",expected_updated_at:"2026-11-03T00:00:00Z",title:"test"};
  const out=await handlers.get("update_library_item")!(args);
  assertEquals(out.isError,true);
  assertMatch(out.content[0].text,/沒有圖書館寫入授權/);
  const result=await handlers.get("create_official_doc")!({direction:"incoming"});
  assertEquals(result.isError,true);
  assertEquals(getQueries(),0);
});
Deno.test("destructive tool requires confirmed input at schema boundary",()=>{
  const {definitions}=makeServer({write:true});
  const schema=definitions.get("archive_library_item").inputSchema;
  assertEquals(schema.safeParse({
    item_id:"11111111-1111-4111-8111-111111111111",
    expected_updated_at:"2026-11-03T00:00:00Z",
    confirm:false
  }).success,false);
  assertEquals(schema.safeParse({
    item_id:"11111111-1111-4111-8111-111111111111",
    expected_updated_at:"2026-11-03T00:00:00Z",
    confirm:true
  }).success,true);
});
Deno.test("work-zone document read returns metadata and a bounded excerpt",async()=>{
  const {handlers}=makeServer({row:{
    id:"11111111-1111-4111-8111-111111111111",
    subject:"工作通知",text_excerpt:"文".repeat(9000),status:"todo",
  }});
  const value=await handlers.get("get_official_doc")!({
    doc_id:"11111111-1111-4111-8111-111111111111",offset:0
  });
  assert(!value.isError);
  assertEquals(value.structuredContent.text.length,8000);
  assertEquals(value.structuredContent.next_offset,8000);
});
Deno.test("cloud original is never offered for a local-only file",async()=>{
  const {handlers}=makeServer({row:{
    id:"11111111-1111-4111-8111-111111111111",location:"device",storage_path:null
  }});
  const out=await handlers.get("cloud_file_download")!({item_id:"11111111-1111-4111-8111-111111111111"});
  assertEquals(out.isError,true);
  assertMatch(out.content[0].text,/沒有可遠端下載的雲端原檔/);
});


Deno.test("approved OAuth writer can update only the requested library fields",async()=>{
  const sample={id:"11111111-1111-4111-8111-111111111111",title:"更新分類",shelf:"建築設計",updated_at:"2026-11-03T00:00:00Z"};
  const {handlers,getQueries}=makeServer({write:true,row:sample});
  const value=await handlers.get("update_library_item")!({
    item_id:sample.id,expected_updated_at:sample.updated_at,title:"更新分類",shelf:"建築設計"
  });
  assertEquals(value.structuredContent?.updated,true);
  assertEquals(value.structuredContent?.item?.title,"更新分類");
  assertEquals(getQueries(),1);
});
Deno.test("Cloud upload ticket disallows invalid MIME and oversized files before service access",()=>{
  const {definitions}=makeServer({write:true});
  const schema=definitions.get("cloud_upload_ticket").inputSchema;
  assertEquals(schema.safeParse({file_name:"x.exe",mime:"application/x-msdownload",size:400}).success,false);
  assertEquals(schema.safeParse({file_name:"x.pdf",mime:"application/pdf",size:52428801}).success,false);
  assertEquals(schema.safeParse({file_name:"x.pdf",mime:"application/pdf",size:1024}).success,true);
});
