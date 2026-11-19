// P6 browser client candidate. Uses the owner's Supabase access token,
// never the server-to-server Site bearer or service-role key.
// Remote Finance goals stay server-authoritative; no local finance mutation.
(function(root,factory){
  "use strict";
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceGoalsBrowserClient=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
 "use strict";
 const PROJECT="hrdzywkihfqggiwjgavi";
 const URL="https://"+PROJECT+".supabase.co/functions/v1/lizhi-finance-site-mcp/ui/goals";
 const MONTH=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
 const fail=code=>{const e=new Error(code);e.code=code;throw e;};
 const currency=x=>Number.isSafeInteger(Number(x))&&Number(x)>=0?Number(x):0;
 const rowAmount=(lines,key)=>currency(lines.find(x=>x.category===key)?.amount);
 function reportFromPayload(month,payload){
   if(!payload||payload.month!==month||!Array.isArray(payload.goals)||
      !Array.isArray(payload.funds))fail("GOALS_REMOTE_INVALID");
   const plan=payload.plan||null,lines=plan?.lines||[];
   if(!Array.isArray(lines))fail("GOALS_REMOTE_INVALID");
   const spending=currency(rowAmount(lines,"food")+rowAmount(lines,"daily")+
      rowAmount(lines,"transport"));
   const savings=rowAmount(lines,"savings"),invest=rowAmount(lines,"investible_cash");
   const rent=rowAmount(lines,"rent_reserve"),insurance=rowAmount(lines,"insurance_reserve");
   const protectedTotal=rent+insurance;
   const allocation=plan?{
     spendingPlan:spending,fixedSavings:savings,flexibleInvestible:invest,
     protectedReserve:protectedTotal,investmentCashPool:invest+protectedTotal,
     creditCardReserve:rowAmount(lines,"credit_card_reserve")
   }:null;
   const goalProgress=payload.goals.map(g=>{
     if(!Number.isSafeInteger(g.version)||g.version<1||!Number.isSafeInteger(g.target_amount)||
       !Number.isSafeInteger(g.user_confirmed_reserved)||g.user_confirmed_reserved<0)
       fail("GOALS_REMOTE_INVALID");
     return {id:g.id,kind:g.kind,version:g.version,targetAmount:g.target_amount,
       userConfirmedReserved:g.user_confirmed_reserved};
   });
   return Object.freeze({
     month,source:"finance_goals_cloud_snapshot",syncStatus:"synced",
     estimatedSalary:plan?.estimated_income??null,allocation,goalProgress,
     sinkingFunds:payload.funds.map(f=>({
       purpose:f.purpose,monthlyTarget:f.monthly_contribution,
       cycleProjection:f.monthly_contribution*f.cadence_months,
       confirmedDueAmount:f.due_amount
     })),separatelyConfiguredExpenseBudget:null,
     bankVerified:false,actualTrades:0,actualSalaryReceived:null,
     goals:goalProgress,plan
   });
 }
 function create({getAuth=()=>root.LizhiAuth,
    owner=()=>root.FinanceBudgetOwner?.requireOwner(),
    doFetch=(...args)=>root.fetch(...args)}={}){
   async function verified(){
     const auth=getAuth(),client=auth?.client;
     if(!client?.auth?.getSession||!client?.auth?.getUser||typeof owner!=="function")
       fail("GOALS_AUTH_REQUIRED");
     const id=await owner();
     if(!id)fail("GOALS_AUTH_REQUIRED");
     const {data,error}=await client.auth.getSession();
     const token=data?.session?.access_token;
     if(error||!token||data.session.user?.id!==id||!auth.user||
       auth.user.id!==id||client.supabaseUrl!=="https://"+PROJECT+".supabase.co")
       fail("GOALS_IDENTITY_MISMATCH");
     return {client,id,token};
   }
   async function request(action,tool,args,extra={}){
     const {client,id,token}=await verified();
     const result=await doFetch(URL,{
       method:"POST",mode:"cors",cache:"no-store",
       headers:{"content-type":"application/json",authorization:"Bearer "+token},
       body:JSON.stringify({action,tool,args,...extra})
     });
     let payload;try{payload=await result.json();}
     catch{fail("GOALS_REMOTE_UNAVAILABLE")}
     if(!result.ok||payload?.ok!==true)fail(payload?.code||"GOALS_REMOTE_UNAVAILABLE");
     const after=await owner();
     const current=await client.auth.getUser();
     if(after!==id||current.error||current.data?.user?.id!==id)
       fail("GOALS_IDENTITY_CHANGED");
     return payload;
   }
   async function readMonth(month){
     if(!MONTH.test(month||""))fail("GOALS_INVALID_MONTH");
     const result=await request("read","finance_goals_month_report",{month});
     return reportFromPayload(month,result.result);
   }
   async function invoke(_tool,_args){
     // A browser confirm() and JWT possession are not human presence.
     fail("GOALS_HUMAN_APPROVAL_NOT_CONFIGURED");
   }
   return Object.freeze({readMonth,invoke,verified});
 }
 return Object.freeze({PROJECT,URL,create,reportFromPayload});
});
