// P3 protected resource discovery candidate (RFC 9728).
// Metadata must be served at an approved /.well-known/oauth-protected-resource
// route by an actual OAuth-enabled deployment. No auth server is deployed here.
const validHttps = value=>{
  if(typeof value!=='string')return false;
  try{
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.search&&
      u.hostname.length>0;
  }catch{return false;}
};
export const LEARNING_SCOPES=Object.freeze(['english:read','english:candidate']);
export function makeProtectedResourceMetadata({resource,authorizationServer}={}){
 if(!validHttps(resource)||!validHttps(authorizationServer))
   throw new TypeError('INVALID_OAUTH_RESOURCE_METADATA');
 return {
   resource,
   authorization_servers:[authorizationServer],
   scopes_supported:[...LEARNING_SCOPES],
   bearer_methods_supported:['header'],
   resource_name:'立之英文學習教室',
 };
}
export function makeUnauthorizedResponse({resourceMetadataUrl,scope='english:read'}={}){
 if(!validHttps(resourceMetadataUrl)||
     !LEARNING_SCOPES.includes(scope))throw new TypeError('INVALID_OAUTH_CHALLENGE');
 return new Response(JSON.stringify({error:'unauthorized'}),{status:401,headers:{
   'content-type':'application/json',
   'cache-control':'no-store',
   'www-authenticate':`Bearer resource_metadata="${resourceMetadataUrl}", scope="${scope}"`,
 }});
}
