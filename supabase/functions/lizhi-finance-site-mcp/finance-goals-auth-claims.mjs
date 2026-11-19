// Pure structural policy check ONLY. Never authorise on decoded claims alone.
// Caller MUST authenticate this exact JWT with Supabase Auth getUser(jwt) first.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function verifiedFirstPartyClaims(jwt,verifiedUserId,now=Date.now()){
 if(!UUID.test(verifiedUserId||"")||typeof jwt!=="string")return null;
 try{
  const parts=jwt.split(".");
  if(parts.length!==3||parts[1].length>8192)return null;
  const b64=parts[1].replace(/-/g,"+").replace(/_/g,"/");
  const claims=JSON.parse(atob(b64.padEnd(Math.ceil(b64.length/4)*4,"=")));
  if(!claims||typeof claims!=="object"||Array.isArray(claims)||
    Object.prototype.hasOwnProperty.call(claims,"client_id")||
    claims.sub!==verifiedUserId||claims.aud!=="authenticated"||
    !UUID.test(claims.session_id||"")||
    !["aal1","aal2"].includes(claims.aal)||
    !Number.isFinite(claims.exp)||claims.exp*1000<=now)
   return null;
  return Object.freeze({sessionId:claims.session_id,aal:claims.aal});
 }catch{return null}
}
