"use strict";
// Runs against local ephemeral PostgreSQL 16; never connects to Supabase prod.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {Pool}=require("pg");
const {createCadOauthAcl}=require("./cloud-cad-oauth-acl.cjs");
const {createCadMcpService}=require("./cloud-cad-mcp-service.cjs");
const {createQueue,createMemoryStorage}=require("./cloud-cad-queue.cjs");
const owner="aabbccdd-1234-4abc-8abc-abc123456789";
const foreign="bbccddee-1234-4abc-8abc-abc123456789";
const project="projectCad",otherProject="projectOther",drawing="cabinet1";
const viewer="oauth-viewer",editor="oauth-editor";
const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",
 source_identity:{design_id:"cabinet-demo",revision:1},
 entities:[{type:"polyline",closed:true,layer:"FURNITURE",points:[[0,0],[10,0],[10,10],[0,10]]}]};
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Only isolated localhost database allowed");
 const db=new Pool({connectionString:process.env.DATABASE_URL});
 try{
  for(const role of ["anon","authenticated"])
   await db.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await db.query(fs.readFileSync(path.join(__dirname,"sql/001_staging_cad_oauth_grants.sql"),"utf8"));
  await db.query(
   "INSERT INTO public.lizhi_cad_oauth_project_grants(owner_id,project_id,oauth_client_id,can_write) VALUES ($1::uuid,$2,$3,false),($1::uuid,$2,$4,true)",
   [owner,project,viewer,editor]
  );
  const acl=createCadOauthAcl({db});
  const check=(clientId,action,ownerId=owner,projectId=project)=>acl.authorizeDrawing({
   ownerId,projectId,drawingId:drawing,clientId,action
  });
  assert.equal(await check(viewer,"read"),true);
  assert.equal(await check(viewer,"create"),false);
  assert.equal(await check(viewer,"modify"),false);
  assert.equal(await check(editor,"modify"),true);
  assert.equal(await check(editor,"write"),true);
  assert.equal(await check("unknown-client","read"),false);
  assert.equal(await check(null,"read"),false);
  assert.equal(await check(editor,"modify",foreign),false);
  assert.equal(await check(editor,"modify",owner,otherProject),false);
  const queue=createQueue(createMemoryStorage());
  const service=createCadMcpService({authorizeDrawing:acl.authorizeDrawing,
   queueForOwner:()=>queue,
   intents:(()=>{
    const rows=new Map();
    return {async putIfAbsent({ownerId,key,value}){
     const k=ownerId+":"+key;if(rows.has(k))return rows.get(k);
     rows.set(k,value);return value;
    },async get({ownerId,key}){return rows.get(ownerId+":"+key)||null;}};
   })()
  });
  const request={projectId:project,drawingId:drawing,baseRevision:0,requestId:"r1",operation:"create",spec};
  await assert.rejects(service.submit(owner,request,{clientId:viewer}),{code:"CAD_ACCESS_DENIED"});
  await assert.rejects(service.submit(owner,request,{clientId:null}),{code:"CAD_ACCESS_DENIED"});
  const submitted=await service.submit(owner,request,{clientId:editor});
  assert.equal(submitted.status,"queued");
  assert.equal((await service.status(owner,{projectId:project,drawingId:drawing,jobKey:submitted.job_key},{clientId:viewer})).status,"queued");
  // Revocation is server-side: existing user JWT should no longer be enough.
  await db.query("UPDATE public.lizhi_cad_oauth_project_grants SET revoked_at=now() WHERE owner_id=$1::uuid AND project_id=$2 AND oauth_client_id=$3",[owner,project,editor]);
  assert.equal(await check(editor,"read"),false);
  await assert.rejects(service.submit(owner,{...request,requestId:"r2"},{clientId:editor}),{code:"CAD_ACCESS_DENIED"});
  const client=await db.connect();
  try{
   await client.query("SET ROLE authenticated");
   await assert.rejects(client.query("SELECT * FROM public.lizhi_cad_oauth_project_grants"),e=>e.code==="42501");
  }finally{await client.query("RESET ROLE");client.release();}
  console.log("CAD_OAUTH_CLIENT_PROJECT_ACL_POSTGRES_PASS",JSON.stringify({
   unauthenticated:"DENIED",unregistered:"DENIED",read_only_write:"DENIED",
   authorized_edit:"ALLOWED",cross_owner:"DENIED",cross_project:"DENIED",
   revocation:"IMMEDIATE_SERVER_SIDE",browser_table_access:"DENIED"
  }));
 }finally{await db.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
