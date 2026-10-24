"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),http=require("node:http");
const crypto=require("node:crypto");
const {createCadMcpHttpHandler}=require("./cloud-cad-mcp-http.cjs");
const {createJwksVerifier}=require("./cloud-cad-jwks-auth.cjs");
const resource="https://cad.example.test/mcp";
const issuer="https://identity.example.test/auth/v1";
const owner="aabbccdd-1234-4abc-8abc-abc123456789";
async function serverTest(options,fn){
 const server=http.createServer(createCadMcpHttpHandler(options));
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port;
 try{await fn(base);}finally{await new Promise(resolve=>server.close(resolve));}
}
const service={submit:async()=>({status:"queued"}),status:async()=>({status:"completed"})};
test("MCP publishes OAuth protected-resource metadata and challenge",async()=>serverTest({
 resourceUrl:resource,authorizationServer:issuer,verifyBearer:async()=>null,service
},async base=>{
 const res=await fetch(base+"/.well-known/oauth-protected-resource");
 assert.equal(res.status,200);
 const metadata=await res.json();
 assert.equal(metadata.resource,resource);
 assert.deepEqual(metadata.authorization_servers,[issuer]);
 assert.deepEqual(metadata.scopes_supported,["openid","email"]);
 const denied=await fetch(base+"/mcp",{method:"POST",headers:{"content-type":"application/json"},body:'{"jsonrpc":"2.0","id":1,"method":"tools/list"}'});
 assert.equal(denied.status,401);
 assert.match(denied.headers.get("www-authenticate"),/oauth-protected-resource/);
}));
test("a failing JWT verifier returns 401, not a server error",async()=>serverTest({
 resourceUrl:resource,authorizationServer:issuer,
 verifyBearer:async()=>{throw Error("invalid signature");},service
},async base=>{
 const denied=await fetch(base+"/mcp",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer bad.jwt.token"},body:'{"jsonrpc":"2.0","id":1,"method":"tools/list"}'});
 assert.equal(denied.status,401);
 assert.equal((await denied.json()).error,"UNAUTHORIZED");
}));
test("only trusted verifier supplied OAuth client ID reaches service",async()=>{
 let observed;
 await serverTest({
  resourceUrl:resource,authorizationServer:issuer,
  verifyBearer:async()=>({userId:owner,clientId:"registered-chatgpt-client"}),
  service:{...service,submit:async(o,args,context)=>{
    observed={o,args,context};return {status:"queued"};
  }}
 },async base=>{
  const request={jsonrpc:"2.0",id:2,method:"tools/call",params:{name:"cad_submit_drawing",arguments:{ownerId:"attacker",clientId:"forged",projectId:"p",drawingId:"d"}}};
  const res=await fetch(base+"/mcp",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer trusted.jwt.token"},body:JSON.stringify(request)});
  const answer=await res.json();
  assert.equal(answer.result.isError,false);
  assert.equal(observed.o,owner);
  assert.equal(observed.context.clientId,"registered-chatgpt-client");
  assert.equal(observed.args.clientId,"forged");
 });
});
test("strict verifier accepts verified OAuth client tokens and denies user-only sessions",async()=>{
 const keys=crypto.generateKeyPairSync("rsa",{modulusLength:2048});
 const publicKey={...keys.publicKey.export({format:"jwk"}),alg:"RS256",use:"sig",kid:"k1"};
 const verify=createJwksVerifier({issuer,jwksUrl:issuer+"/.well-known/jwks.json",requireOAuthClient:true,
  now:()=>2000000000,fetchImpl:async()=>({ok:true,json:async()=>({keys:[publicKey]})})});
 const sign=claims=>{
  const encode=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
  const start=encode({alg:"RS256",kid:"k1"})+"."+encode({iss:issuer,aud:"authenticated",role:"authenticated",sub:owner,exp:2000001000,...claims});
  return start+"."+crypto.sign("RSA-SHA256",Buffer.from(start),keys.privateKey).toString("base64url");
 };
 assert.equal((await verify(sign({client_id:"registered-client"}))).clientId,"registered-client");
 await assert.rejects(verify(sign({})),{code:"CAD_OAUTH_CLIENT_REQUIRED"});
 await assert.rejects(verify(sign({client_id:"../unsafe path"})),{code:"CAD_OAUTH_CLIENT_REQUIRED"});
});
