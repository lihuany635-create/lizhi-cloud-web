// Server-only live owner status check for private Finance Goals MCP.
// Supabase service-role may bypass RLS, so never trust the MCP bearer alone.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mail=x=>typeof x==="string"?x.trim().toLowerCase():"";
export async function verifyGoalsOwnerAccount(db,uid,configuredEmail,now=Date.now()){
 const wanted=mail(configuredEmail);
 if(!UUID.test(uid||"")||!wanted||!db?.auth?.admin?.getUserById)
  return false;
 try{
   const {data,error}=await db.auth.admin.getUserById(uid);
   const u=data?.user;
   if(error||!u||u.id!==uid||mail(u.email)!==wanted)return false;
   if(u.banned_until){
     const until=Date.parse(u.banned_until);
     if(!Number.isFinite(until)||until>now)return false;
   }
   return true;
 }catch{return false}
}
