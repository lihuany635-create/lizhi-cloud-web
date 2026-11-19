import test from "node:test";
import assert from "node:assert/strict";
import {verifiedFirstPartyClaims} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-auth-claims.mjs";
// Synthetic token payloads ONLY for the parser. The Edge must FIRST call
// Supabase Auth getUser(jwt) to authenticate the real signed JWT.
const owner="11111111-1111-4111-8111-111111111111";
const session="99999999-9999-4999-8999-999999999999";
const now=1_800_000_000_000;
const firstParty=()=>({sub:owner,aud:"authenticated",session_id:session,aal:"aal1",exp:1_800_000_060});
const jwt=payload=>"e30."+Buffer.from(JSON.stringify(payload)).toString("base64url")+".not-a-real-signature";
test("F02 first-party JWT policy requires matching verified owner and session",()=>{
 const ok=verifiedFirstPartyClaims(jwt(firstParty()),owner,now);
 assert.equal(ok?.sessionId,session);
 assert.equal(ok?.aal,"aal1");
 assert.equal(verifiedFirstPartyClaims(jwt(firstParty()),"22222222-2222-4222-8222-222222222222",now),null);
 assert.equal(verifiedFirstPartyClaims(jwt({...firstParty(),session_id:null}),owner,now),null);
});
test("F02 any OAuth client_id is denied even when owner subject matches",()=>{
 for(const client_id of ["third-party-oauth-client","",null])
   assert.equal(verifiedFirstPartyClaims(jwt({...firstParty(),client_id}),owner,now),null);
});
test("F02 wrong aud, expired or missing AAL cannot become browser session",()=>{
 assert.equal(verifiedFirstPartyClaims(jwt({...firstParty(),aud:"service_role"}),owner,now),null);
 assert.equal(verifiedFirstPartyClaims(jwt({...firstParty(),exp:1_799_999_999}),owner,now),null);
 assert.equal(verifiedFirstPartyClaims(jwt({...firstParty(),aal:null}),owner,now),null);
 assert.equal(verifiedFirstPartyClaims("invalid-token",owner,now),null);
});
