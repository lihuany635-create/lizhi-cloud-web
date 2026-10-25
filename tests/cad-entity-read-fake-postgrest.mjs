import http from "node:http";
const owner="11111111-1111-4111-8111-111111111111";
const session="22222222-2222-4222-8222-222222222222";
const job="33333333-3333-4333-8333-333333333333";
const store={enqueued:[],polls:0,credentials:[]};
function reply(res,data,status=200){res.writeHead(status,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify(data))}
http.createServer(async(req,res)=>{
 if(req.method==="GET"&&req.url==="/probe")
  return reply(res,{enqueued:store.enqueued,polls:store.polls,credentialChecks:store.credentials});
 if(req.method!=="POST"||!req.url.startsWith("/rest/v1/rpc/"))return reply(res,{message:"not found"},404);
 // This is a disposable fake PostgREST process, never a production Supabase URL.
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 let body;try{body=JSON.parse(Buffer.concat(chunks).toString("utf8"))}catch{return reply(res,{message:"invalid json"},400)}
 const authenticated=req.headers.apikey==="ci-fake-service-role"&&req.headers.authorization==="Bearer ci-fake-service-role";
 store.credentials.push(authenticated);
 if(!authenticated)return reply(res,{message:"mock required service role"},401);
 if(body.p_owner!==owner)return reply(res,{message:"mock owner mismatch"},403);
 if(req.url.endsWith("/lizhi_cad_site_read_enqueue")){
  if(body.p_session!==session||!["lizhi.inspect","lizhi.entities"].includes(body.p_command)||
      body.p_request_id!=="44444444-4444-4444-8444-444444444444")
    return reply(res,{message:"mock bounded read mismatch"},422);
  store.enqueued.push({command:body.p_command,params:body.p_params});
  return reply(res,job);
 }
 if(req.url.endsWith("/lizhi_cad_site_read_job")){
  if(body.p_job!==job)return reply(res,null);
  store.polls++;
  const kind=store.enqueued.at(-1)?.command;
  if(kind==="lizhi.entities")return reply(res,{
   job_id:job,kind,state:"succeeded",data:{revision:7,count:1,offset:0,hasMore:false,
    entities:[{handle:"1A",type:"Line",layer:"0",path:"PRIVATE.dxf",text:"MUST_NOT_LEAK",
      geometry:{type:"line",a:{x:0,y:0,z:0},b:{x:800,y:900,z:0}}}]}
  });
  if(kind==="lizhi.inspect")return reply(res,{
   job_id:job,kind,state:"succeeded",data:{revision:7,entityCount:1,selectionCount:0,
    dirty:true,title:"PRIVATE.dxf",path:"C:/PRIVATE.dxf",counts:{Line:1},extents:[[0,0],[800,900]]}
  });
 }
 return reply(res,{message:"unsupported mock RPC"},404);
}).listen(54321,"127.0.0.1",()=>console.log("FAKE_SUPABASE_RPC_READY"));
