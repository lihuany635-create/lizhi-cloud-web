"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const crypto=require("node:crypto");
const {createJwksVerifier}=require("./cloud-cad-jwks-auth.cjs");
const {privateKey,publicKey}=crypto.generateKeyPairSync("rsa",{modulusLength:2048});
const jwk={...publicKey.export({format:"jwk"}),alg:"RS256",use:"sig",kid:"test-key-1"};
const issuer="https://example.test/auth/v1";
const id="aabbccdd-1234-4abc-8abc-abc123456789";
const current=2000000000;
const baseClaims={iss:issuer,aud:"authenticated",role:"authenticated",sub:id,iat:current-100,exp:current+3600};
let reads=0;
const fetchImpl=async()=>{reads++;return {ok:true,json:async()=>({keys:[jwk]})};};
const validator=()=>createJwksVerifier({jwksUrl:issuer+"/.well-known/jwks.json",issuer,fetchImpl,now:()=>current});
const enc=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
function sign(claims=baseClaims,header={alg:"RS256",kid:jwk.kid,typ:"JWT"}){
 const data=enc(header)+"."+enc(claims);
 return data+"."+crypto.sign("RSA-SHA256",Buffer.from(data),privateKey).toString("base64url");
}
test("valid signed token returns authenticated subject from claims",async()=>{
 const verify=validator();const a=await verify(sign()),b=await verify(sign());
 assert.equal(a.userId,id);assert.equal(b.userId,id);
});
test("refuses expired JWT, wrong audience and issuer",async()=>{
 const verify=validator();
 for(const change of [{exp:current-100},{aud:"public"},{iss:"https://attacker.example"},{role:"service_role"},{sub:"../evil"}]){
  await assert.rejects(verify(sign({...baseClaims,...change})),{code:"CAD_TOKEN_DENIED"});
 }
});
test("rejects algorithm none and tampered signatures",async()=>{
 const verify=validator();
 await assert.rejects(verify(sign(baseClaims,{alg:"none",kid:jwk.kid})),{code:"CAD_TOKEN_DENIED"});
 const valid=sign(),parts=valid.split(".");
 const changed=parts[0]+"."+enc({...baseClaims,role:"service_role"})+"."+parts[2];
 await assert.rejects(verify(changed),{code:"CAD_TOKEN_DENIED"});
});
test("requires a trusted signing key and valid token format",async()=>{
 const verify=validator();
 await assert.rejects(verify(sign(baseClaims,{alg:"RS256",kid:"unknown"})),{code:"CAD_TOKEN_DENIED"});
 await assert.rejects(verify("not.a.jwt.extra"),{code:"CAD_TOKEN_INVALID"});
 await assert.rejects(verify("x".repeat(20000)),{code:"CAD_TOKEN_INVALID"});
});
