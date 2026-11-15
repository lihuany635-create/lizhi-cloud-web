// P3 OAuth trust-boundary candidate (not a deployed authorization server).
// introspectToken and resolveOwnerLink MUST be trusted server-side services.
// No fallback to user-submitted ownerId, MCP clientInfo, or HTTP Origin.
const str=x=>typeof x==='string'&&x.trim().length>0;
export function createTrustedMcpAuthenticator({
 introspectToken,resolveOwnerLink,allowedClientIds,resourceAudience,issuer
}={}){
 if(typeof introspectToken!=='function'||typeof resolveOwnerLink!=='function'||
    !Array.isArray(allowedClientIds)||!allowedClientIds.length||
    !str(resourceAudience)||!str(issuer))throw new TypeError('OAUTH_TRUST_BOUNDARY_UNCONFIGURED');
 const allowed=new Set(allowedClientIds);
 return async function authenticate({bearer}) {
   if(!str(bearer))throw Error('MISSING_TOKEN');
   const claims=await introspectToken(bearer);
   if(claims?.active!==true||claims.issuer!==issuer ||
      claims.audience!==resourceAudience ||
      !str(claims.subject)||!str(claims.verifiedClientId)||
      !allowed.has(claims.verifiedClientId))
     throw Error('TOKEN_OR_CLIENT_UNAUTHORIZED');
   // OAuth subject/client binding is stored server-side, not accepted from
   // a model-generated owner claim or from the introspection user's email.
   const link=await resolveOwnerLink({issuer:claims.issuer,
     subject:claims.subject,clientId:claims.verifiedClientId});
   if(link?.enabled!==true || link.oauthVerified!==true ||
      !str(link.ownerId)||link.verifiedClientId!==claims.verifiedClientId)
     throw Error('OWNER_LINK_UNAUTHORIZED');
   const tokenScopes=new Set(Array.isArray(claims.scopes)?claims.scopes:[]);
   const linkScopes=new Set(Array.isArray(link.allowedScopes)?link.allowedScopes:[]);
   const scopes=[...tokenScopes].filter(scope=>linkScopes.has(scope));
   return {
     serverVerified:true,
     active:true,
     userId:link.ownerId,
     verifiedClientId:claims.verifiedClientId,
     scopes,
   };
 };
}
