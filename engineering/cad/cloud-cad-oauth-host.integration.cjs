"use strict";
// Real HTTP + signed RS256 OAuth client JWT + disposable Postgres 16.
// NEVER points to real Supabase or a public host.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {Pool}=require("pg");
const {startCadMcpHost}=require("./cloud-cad-mcp-host.cjs");
const USER="aabbccdd-1234-4abc-8abc-abc123456789",OTHER="bbccddee-1234-4abc-8abc-abc123456789";
const ISSUER="https://identity.example.test/auth/v1",RESOURCE="https://cad.example.test/mcp";
const CLIENT_READ="chatgpt-reader",CLIENT_WRITE="chatgpt-authorized";
const PROJECT="cabinetP",DRAWING="cabinetD";
const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",
 source_identity:{design_id:"cab1",revision:1},
 entities:[{type:"polyline",closed:true,layer:"FURNITURE",points:[[0,0],[10,0],[10,10],[0,10]]}]};
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("@127.0.0.1:5432/"),"Refusing external DB");
 const db=new Pool({connectionString:process.env.DATABASE_URL});
 let host;
 try{
  for(const role of ["anon","authenticated"])
   await db.query("DO $$ BEGIN CREATE ROLE "+role+" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
  await db.query(fs.readFileSync(path.join(__dirname,"sql/000_staging_cloud_cad_jobs.sql"),"utf8"));
  await db.query(fs.readFileSync(path.join(__dirname,"sql/001_staging_cad_oauth_grants.sql"),"utf8"));
  await db.query(
   "INSERT INTO public.lizhi_cad_oauth_project_grants(owner_id,project_id,oauth_client_id,can_write) VALUES ($1::uuid,$2,$3,false),($1::uuid,$2,$4,true)",
   [USER,PROJECT,CLIENT_READ,CLIENT_WRITE]
  );
  const keys=crypto.generateKeyPairSync("rsa",{modulusLength:2048});
  const publicKey={...keys.publicKey.export({format:"jwk"}),alg:"RS256",use:"sig",kid:"test-key"};
  const now=Math.floor(Date.now()/1000);
  const encode=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
  const token=(claims={})=>{
   const header=encode({alg:"RS256",kid:"test-key"});
   const payload=encode({iss:ISSUER,aud:"authenticated",role:"authenticated",sub:USER,iat:now,exp:now+900,...claims});
   const input=header+"."+payload;
   return input+"."+crypto.sign("RSA-SHA256",Buffer.from(input),keys.privateKey).toString("base64url");
  };
  host=await startCadMcpHost({db,resourceUrl:RESOURCE,authorizationServer:ISSUER,port:0,
   jwksFetchImpl:async url=>{
    assert.equal(url,ISSUER+"/.well-known/jwks.json");
    return {ok:true,json:async()=>({keys:[publicKey]})};
   }
  });
  const base="http://127.0.0.1:"+host.address.port;
  async function rpc(method,params,accessToken){
   const res=await fetch(base+"/mcp",{method:"POST",headers:{
    "content-type":"application/json",...(accessToken?{authorization:"Bearer "+accessToken}:{})
   },body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
   return {res,body:await res.json()};
  }
  const get=await fetch(base+"/.well-known/oauth-protected-resource");
  assert.equal(get.status,200);
  assert.equal((await get.json()).resource,RESOURCE);
  const noToken=await rpc("tools/list",{},null);
  assert.equal(noToken.res.status,401);
  assert.match(noToken.res.headers.get("www-authenticate"),/resource_metadata=/);
  const sessionOnly=await rpc("tools/list",{},token());
  assert.equal(sessionOnly.res.status,401);
  const invalid=await rpc("tools/list",{},token({client_id:CLIENT_WRITE}).slice(0,-2)+"xx");
  assert.equal(invalid.res.status,401);
  const writeArgs={projectId:PROJECT,drawingId:DRAWING,baseRevision:0,requestId:"cad-oauth-1",operation:"create",spec};
  const readToken=token({client_id:CLIENT_READ});
  const cannotWrite=await rpc("tools/call",{name:"cad_submit_drawing",arguments:writeArgs},readToken);
  assert.equal(cannotWrite.body.result.isError,true);
  assert.equal(JSON.parse(cannotWrite.body.result.content[0].text).code,"CAD_ACCESS_DENIED");
  const writeToken=token({client_id:CLIENT_WRITE});
  const allowed=await rpc("tools/call",{name:"cad_submit_drawing",arguments:writeArgs},writeToken);
  assert.equal(allowed.body.result.isError,false,JSON.stringify(allowed.body));
  const job=JSON.parse(allowed.body.result.content[0].text);
  assert.equal(job.status,"queued");
  assert.equal(job.project_id,PROJECT);
  const status=await rpc("tools/call",{name:"cad_job_status",arguments:{
   projectId:PROJECT,drawingId:DRAWING,jobKey:job.job_key
  }},readToken);
  assert.equal(status.body.result.isError,false);
  const outsider=await rpc("tools/call",{name:"cad_submit_drawing",arguments:{...writeArgs,requestId:"foreign"}},token({client_id:CLIENT_WRITE,sub:OTHER}));
  assert.equal(outsider.body.result.isError,true);
  const wrongProject=await rpc("tools/call",{name:"cad_submit_drawing",arguments:{...writeArgs,projectId:"notAuthorized",requestId:"foreign2"}},writeToken);
  assert.equal(wrongProject.body.result.isError,true);
  await db.query("UPDATE public.lizhi_cad_oauth_project_grants SET revoked_at=now() WHERE owner_id=$1::uuid AND project_id=$2 AND oauth_client_id=$3",[USER,PROJECT,CLIENT_WRITE]);
  const afterRevoke=await rpc("tools/call",{name:"cad_submit_drawing",arguments:{...writeArgs,requestId:"r2"}},writeToken);
  assert.equal(afterRevoke.body.result.isError,true);
  assert.equal(JSON.parse(afterRevoke.body.result.content[0].text).code,"CAD_ACCESS_DENIED");
  console.log("CAD_REAL_SIGNED_OAUTH_MCP_POSTGRES_PASS",JSON.stringify({
   metadata:true,invalidSignature:"401",normalSupabaseSessionWithoutOauthClient:"401",
   signedOAuthJwt:true,viewerWrite:"DENIED",authorizedQueue:"PASS",
   crossUser:"DENIED",crossProject:"DENIED",revoke:"DENIED",postgres:"REAL_LOCAL_16"
  }));
 }finally{if(host)await host.close();await db.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
