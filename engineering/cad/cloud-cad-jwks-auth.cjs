"use strict";
const crypto=require("node:crypto");
class CadAuthError extends Error{constructor(code,message){super(message);this.name="CadAuthError";this.code=code;}}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function decode(value){
 if(typeof value!=="string"||!value||!/^[A-Za-z0-9_-]+$/.test(value))throw new CadAuthError("CAD_TOKEN_INVALID","Invalid token encoding");
 return Buffer.from(value,"base64url");
}
function createJwksVerifier({jwksUrl,issuer,audience="authenticated",fetchImpl=fetch,now=()=>Math.floor(Date.now()/1000),maxClockSkewSeconds=30,requireOAuthClient=false}={}){
 if(typeof jwksUrl!=="string"||!jwksUrl.startsWith("https://")||typeof issuer!=="string"||!issuer.startsWith("https://")||typeof audience!=="string"||typeof fetchImpl!=="function"||typeof now!=="function")
  throw new CadAuthError("CAD_AUTH_CONFIG_INVALID","JWKS, issuer and audience must be configured");
 let cached={until:0,keys:[]};
 async function load(force=false){
  const stamp=now();
  if(!force&&cached.until>stamp)return cached.keys;
  const response=await fetchImpl(jwksUrl,{headers:{accept:"application/json"},redirect:"error"});
  if(!response?.ok)throw new CadAuthError("CAD_JWKS_UNAVAILABLE","Unable to obtain trusted key set");
  const body=await response.json();
  if(!body||!Array.isArray(body.keys)||body.keys.length===0||body.keys.length>32)throw new CadAuthError("CAD_JWKS_INVALID","Invalid trusted key set");
  cached={until:stamp+300,keys:body.keys};return cached.keys;
 }
 return async function verifyBearer(token){
  if(typeof token!=="string"||token.length>16384)throw new CadAuthError("CAD_TOKEN_INVALID","Invalid token length");
  const parts=token.split(".");
  if(parts.length!==3)throw new CadAuthError("CAD_TOKEN_INVALID","Malformed JWT");
  let header,payload;
  try{
   header=JSON.parse(decode(parts[0]).toString("utf8"));
   payload=JSON.parse(decode(parts[1]).toString("utf8"));
  }catch{throw new CadAuthError("CAD_TOKEN_INVALID","Malformed JWT header or payload");}
  if(!header||!payload||!["RS256","ES256"].includes(header.alg)||typeof header.kid!=="string"||!header.kid||header.crit!==undefined)
   throw new CadAuthError("CAD_TOKEN_DENIED","Token signing algorithm denied");
  const find=keys=>keys.find(k=>k.kid===header.kid&&(!k.use||k.use==="sig")&&(!k.alg||k.alg===header.alg)&&((header.alg==="RS256"&&k.kty==="RSA")||(header.alg==="ES256"&&k.kty==="EC")));
  let key=find(await load());
  if(!key)key=find(await load(true)); // key rotation
  if(!key)throw new CadAuthError("CAD_TOKEN_DENIED","Signing key not found");
  let good=false;
  try{
   const publicKey=crypto.createPublicKey({key,format:"jwk"});
   const options=header.alg==="ES256"?{key:publicKey,dsaEncoding:"ieee-p1363"}:publicKey;
   good=crypto.verify("sha256",Buffer.from(parts[0]+"."+parts[1]),options,decode(parts[2]));
  }catch{good=false;}
  if(!good)throw new CadAuthError("CAD_TOKEN_DENIED","Invalid JWT signature");
  const stamp=now();
  if(payload.iss!==issuer||!(typeof payload.aud==="string"?payload.aud===audience:Array.isArray(payload.aud)&&payload.aud.includes(audience))||payload.role!=="authenticated"||
     !UUID.test(payload.sub||"")||!Number.isSafeInteger(payload.exp)||payload.exp<=stamp-maxClockSkewSeconds||
     (payload.nbf!==undefined&&(!Number.isSafeInteger(payload.nbf)||payload.nbf>stamp+maxClockSkewSeconds))||
     (payload.iat!==undefined&&(!Number.isSafeInteger(payload.iat)||payload.iat>stamp+maxClockSkewSeconds)))
   throw new CadAuthError("CAD_TOKEN_DENIED","JWT claims invalid");
  // Supabase OAuth tokens include client_id. A strict MCP deployment must
  // refuse ordinary user session JWTs that were not issued to an approved
  // OAuth client. The actual project/client grant is checked in PostgreSQL.
  const clientId=payload.client_id;
  if(requireOAuthClient&&(typeof clientId!=="string"||clientId.length<1||clientId.length>256||!/^[A-Za-z0-9_.:-]+$/.test(clientId)))
   throw new CadAuthError("CAD_OAUTH_CLIENT_REQUIRED","MCP requires OAuth-client-bound user tokens");
  return Object.freeze({userId:payload.sub,clientId:typeof clientId==="string"?clientId:null});
 };
}
module.exports=Object.freeze({CadAuthError,createJwksVerifier});
