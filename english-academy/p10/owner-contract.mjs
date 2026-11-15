// P10: explicit P3 MCP actor <-> P7 Site actor contract.
// Candidate for an existing, owner-authenticated Site /mcp adapter only.
// This is not wired to a production route and must never read identity from
// clientInfo, request body, Origin, query strings, or client-supplied ownerId.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9_.:-]{3,180}$/;
const SCOPES=new Set(['english:read','english:candidate']);
const deny=code=>Object.assign(new Error(code),{code});
const distinct=a=>new Set(a).size===a.length;

export const P10_IDENTITY_CONTRACT=Object.freeze({
  siteActorField:'ownerId',
  p3ActorField:'userId',
  p6BackendField:'ownerId',
  scopeModel:'intersection-of-two-independently-verified-server-claims',
  formalWrite:'disabled-until-independent-one-time-consent-transaction',
  productionConnected:false
});

export function createP10TrustedMcpAuthenticator({
  verifySiteOwner,verifyBoundAccessToken,allowedClientIds,
  expectedIssuer,expectedAudience
}={}){
 if(typeof verifySiteOwner!=='function'||typeof verifyBoundAccessToken!=='function'||
   !Array.isArray(allowedClientIds)||allowedClientIds.length===0||
   !allowedClientIds.every(x=>ID.test(x))||!distinct(allowedClientIds)||
   typeof expectedIssuer!=='string'||!expectedIssuer.startsWith('https://')||
   typeof expectedAudience!=='string'||!expectedAudience.trim())
   throw deny('VERIFIED_MCP_DEPENDENCIES_REQUIRED');
 const clients=new Set(allowedClientIds);
 return async function authenticate({bearer,request}={}){
   if(!(request instanceof Request)||typeof bearer!=='string'||
     bearer.length<20||bearer.length>16384)
     throw deny('MCP_AUTHENTICATION_DENIED');
   // The independent trusted verifier must validate signature, issuer,
   // audience, expiration/revocation, client, and linked owner server-side.
   const [site,token]=await Promise.all([
     verifySiteOwner({request}),
     verifyBoundAccessToken({bearer,request})
   ]);
   if(site?.serverVerified!==true||!UUID.test(site.ownerId||'')||
     typeof site.verifiedChatgptAccountId!=='string'||
     !ID.test(site.verifiedChatgptAccountId)||
     token?.serverVerified!==true||token.active!==true||
     !UUID.test(token.ownerId||'')||token.ownerId!==site.ownerId||
     token.verifiedChatgptAccountId!==site.verifiedChatgptAccountId||
     token.issuer!==expectedIssuer||token.audience!==expectedAudience||
     !clients.has(token.verifiedClientId))
      throw deny('MCP_OWNER_OR_TOKEN_MISMATCH');
   if(!Array.isArray(site.scopes)||!Array.isArray(token.scopes)||
     !site.scopes.every(s=>typeof s==='string')||
     !token.scopes.every(s=>typeof s==='string'))
      throw deny('MCP_SCOPES_NOT_VERIFIED');
   const siteScopes=new Set(site.scopes),tokenScopes=new Set(token.scopes);
   const scopes=[...SCOPES].filter(s=>siteScopes.has(s)&&tokenScopes.has(s));
   if(!scopes.includes('english:read'))throw deny('MCP_READ_SCOPE_REQUIRED');
   // userId is P3's expected owner field; never use Site accountId as a
   // Supabase owner UUID or trust the model's ownerId.
   return Object.freeze({
     serverVerified:true,active:true,userId:site.ownerId,
     verifiedClientId:token.verifiedClientId,
     scopes:Object.freeze(scopes),
     identityContract:'p10-server-bound-owner-v1'
   });
 };
}
