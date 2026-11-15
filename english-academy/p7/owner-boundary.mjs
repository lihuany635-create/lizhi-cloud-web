// P7 trusted owner boundary. Candidate only, not configured with production secrets.
// Browser email/user_metadata/clientInfo/HTTP Origin never authorize an account.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const txt=(x,max=120)=>typeof x==='string'&&x.length>0&&x.length<=max;
const deny=code=>Object.assign(new Error(code),{code});
const normScopes=xs=>Array.isArray(xs)?xs.filter(x=>typeof x==='string'):[];
const SERVICE_SCOPES=Object.freeze(['english:read','english:candidate','english:formal_write']);
export const OWNER_BINDING_VERSION='p7-owner-boundary-v1';

export function createWebOwnerVerifier({verifySupabaseAccessToken,ownerRegistry,activeSessionRegistry}={}) {
 if(typeof verifySupabaseAccessToken!=='function'||typeof ownerRegistry!=='function'||
    typeof activeSessionRegistry!=='function')throw deny('TRUSTED_WEB_VERIFICATION_REQUIRED');
 return async function verifyWebOwner({bearer}={}){
   if(!txt(bearer,16384))throw deny('BEARER_REQUIRED');
   const result=await verifySupabaseAccessToken(bearer);
   // Token must already have been verified using the connected Supabase Auth service
   // or equivalent server-side signature + issuer + audience verification.
   if(result?.serverVerified!==true||!UUID.test(result?.user?.id||''))
     throw deny('WEB_IDENTITY_NOT_VERIFIED');
   const user=result.user;
   const providers=user.app_metadata?.providers;
   if(user.app_metadata?.provider!=='google'&&
     !(Array.isArray(providers)&&providers.includes('google')))
       throw deny('GOOGLE_PROVIDER_REQUIRED');
   if(!txt(result.sessionId)||!await activeSessionRegistry({
     ownerId:user.id,sessionId:result.sessionId
   }))throw deny('SESSION_INACTIVE');
   const link=await ownerRegistry({ownerId:user.id});
   if(link?.enabled!==true||link.ownerId!==user.id||link.ownerSource!=='supabase-google')
      throw deny('OWNER_NOT_ALLOWED');
   return Object.freeze({serverVerified:true,ownerId:user.id,identityType:'google-user',
      sessionId:result.sessionId,scopes:['english:read','english:candidate']});
 };
}

export function createSiteOwnerVerifier({
  verifySiteIdentity,siteOwnerRegistry,expectedChatgptAccount
}={}) {
 if(typeof verifySiteIdentity!=='function'||typeof siteOwnerRegistry!=='function'||
    !txt(expectedChatgptAccount))throw deny('TRUSTED_SITE_VERIFICATION_REQUIRED');
 return async function verifySiteOwner({request}={}){
   if(!(request instanceof Request))throw deny('INVALID_REQUEST');
   // verifySiteIdentity must read verified Site runtime identity, not request headers.
   const who=await verifySiteIdentity(request);
   if(who?.serverVerified!==true||who.accountId!==expectedChatgptAccount)
     throw deny('CHATGPT_ACCOUNT_NOT_ALLOWED');
   const link=await siteOwnerRegistry({chatgptAccountId:who.accountId});
   if(link?.enabled!==true||link.oauthLinkVerified!==true||
      !UUID.test(link.ownerId||'')||link.chatgptAccountId!==who.accountId)
       throw deny('SITE_OWNER_LINK_MISSING');
   const authorized=new Set(normScopes(link.allowedScopes));
   const scopes=SERVICE_SCOPES.filter(x=>authorized.has(x));
   if(!scopes.includes('english:read'))throw deny('SITE_READ_SCOPE_NOT_GRANTED');
   return Object.freeze({serverVerified:true,ownerId:link.ownerId,
      identityType:'chatgpt-site',verifiedChatgptAccountId:who.accountId,scopes});
 };
}

export async function consumeVerifiedApproval({actor,action,requestId,approvalId,payload,
  consumeActionApproval}={}){
 if(actor?.serverVerified!==true||!UUID.test(actor.ownerId||'')||
    !['create_formal_card','promote_candidate','ignore_candidate'].includes(action)||
    !txt(requestId,100)||requestId.length<12||!txt(approvalId,100)||
    typeof consumeActionApproval!=='function'||!payload||typeof payload!=='object')
      throw deny('TRUSTED_OWNER_APPROVAL_REQUIRED');
 const data=JSON.stringify({action,ownerId:actor.ownerId,requestId,payload});
 const bytes=new TextEncoder().encode(data);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
   byte=>byte.toString(16).padStart(2,'0')).join('');
 // Trusted callback must atomically consume a server-held consent record
 // matching owner, action, requestId, digest, expiry and verified actor.
 const record=await consumeActionApproval({actor,approvalId,action,requestId,payloadDigest:digest});
 if(record?.verified!==true||record?.consumedAtomically!==true||
    record.ownerId!==actor.ownerId||record.action!==action||
    record.requestId!==requestId||record.payloadDigest!==digest)
      throw deny('TRUSTED_OWNER_APPROVAL_REQUIRED');
 return {verified:true,ownerId:actor.ownerId,action,requestId,approvalId,
   payloadDigest:digest,oneTime:true};
}
