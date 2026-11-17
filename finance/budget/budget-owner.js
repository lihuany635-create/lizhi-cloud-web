(function(root,factory){
  "use strict";
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceBudgetOwner=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const USER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function fail(code){
    const error=new Error(code);
    error.code=code;
    throw error;
  }
  function create({getAuth=()=>root.LizhiAuth}={}){
    let verified=null,activeClient=null,subscription=null;
    function invalidate(){verified=null;}
    function listen(client){
      if(activeClient===client)return;
      subscription?.unsubscribe?.();
      invalidate();
      activeClient=client;
      const subscriptionResult=client.onAuthStateChange?.((event,session)=>{
        if(event==="SIGNED_OUT"||!session?.user?.id||
           verified&&verified.id!==session.user.id)invalidate();
      });
      subscription=subscriptionResult?.data?.subscription||null;
    }
    async function requireOwner(){
      const auth=getAuth(),client=auth?.client?.auth;
      if(!client?.getSession||!client?.getUser)fail("BUDGET_AUTH_REQUIRED");
      listen(client);
      const {data:sessionData,error:sessionError}=await client.getSession();
      const sessionUser=sessionData?.session?.user;
      const appUser=auth.user,allowed=String(auth.allowedEmail||"").trim().toLowerCase();
      if(sessionError||!sessionUser?.id||!USER_ID.test(sessionUser.id)||
         !appUser?.id||appUser.id!==sessionUser.id||!allowed||
         String(sessionUser.email||"").toLowerCase()!==allowed||
         String(appUser.email||"").toLowerCase()!==allowed){
        invalidate();
        fail("BUDGET_AUTH_REQUIRED");
      }
      if(verified?.client===client&&verified.id===sessionUser.id)
        return verified.id;
      const {data:userData,error:userError}=await client.getUser();
      const owner=userData?.user;
      if(userError||!owner?.id||owner.id!==sessionUser.id||
         String(owner.email||"").toLowerCase()!==allowed){
        invalidate();
        fail("BUDGET_IDENTITY_MISMATCH");
      }
      // The initial owner is verified against Auth rather than trusting a mutable
      // session object. Subsequent local operations re-check the live session ID.
      verified={client,id:owner.id};
      return owner.id;
    }
    return Object.freeze({requireOwner,invalidate});
  }
  const instance=create();
  return Object.freeze({...instance,create,USER_ID});
});
