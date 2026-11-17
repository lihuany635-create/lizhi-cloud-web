(function(root,factory){
 "use strict";
 const api=factory(typeof module==="object"&&module.exports?require("./budget-domain.js"):root.FinanceBudgetDomain,
  typeof module==="object"&&module.exports?require("./budget-owner.js"):root.FinanceBudgetOwner);
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.FinanceBudgetDefaults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain,Owner){
 "use strict";
 const TABLE="lizhi_finance_budget_defaults";
 const FIELDS="id,user_id,category_id,currency,amount,start_month,version,created_at,updated_at,disabled_at";
 const err=(code,cause)=>Object.assign(new Error(code),{code,cause});
 const verified=async client=>{
  const db=client||(typeof globalThis!=="undefined"?globalThis.LizhiAuth?.client:null);
  if(!db?.from||!db?.auth?.getUser)throw err("BUDGET_AUTH_REQUIRED");
  const owner=await Owner.requireOwner(),u=await db.auth.getUser();
  if(u.error||u.data?.user?.id!==owner)throw err("BUDGET_DEFAULT_OWNER_MISMATCH");
  return {db,owner};
 };
 async function sameOwner(db,owner){
  if(await Owner.requireOwner()!==owner)throw err("BUDGET_IDENTITY_CHANGED");
  const u=await db.auth.getUser();
  if(u.error||u.data?.user?.id!==owner)throw err("BUDGET_IDENTITY_CHANGED");
 }
 function shape(row,owner){
  if(!row||row.user_id!==owner||row.currency!=="TWD"||
     !Number.isSafeInteger(Number(row.amount))||Number(row.amount)<0||
     !Number.isSafeInteger(Number(row.version))||Number(row.version)<1)
    throw err("BUDGET_DEFAULT_INVALID_REMOTE");
  Domain.validateBudget({month:row.start_month,amount:Number(row.amount),
    categoryId:row.category_id??null,currency:row.currency});
  return {...row,amount:Number(row.amount),version:Number(row.version)};
 }
 async function list({client}={}){
  const {db,owner}=await verified(client);
  const {data,error}=await db.from(TABLE).select(FIELDS).eq("user_id",owner)
    .order("id",{ascending:true}).range(0,249);
  if(error||!Array.isArray(data))throw err("BUDGET_DEFAULT_READ_FAILED",error);
  if(data.length===250)throw err("BUDGET_DEFAULT_LIMIT");
  const rows=data.map(x=>shape(x,owner));
  await sameOwner(db,owner);
  return rows;
 }
 async function save({client,categoryId=null,amount,startMonth,expectedVersion}={}){
  Domain.validateBudget({month:startMonth,amount,categoryId,currency:"TWD"});
  const {db,owner}=await verified(client);
  if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0)
    throw err("BUDGET_DEFAULT_VERSION_REQUIRED");
  let query;
  if(expectedVersion===0){
    query=db.from(TABLE).insert({user_id:owner,category_id:categoryId,
      amount,currency:"TWD",start_month:startMonth}).select(FIELDS).maybeSingle();
  }else{
    const prior=await list({client:db});
    const row=prior.find(x=>x.category_id===categoryId);
    if(!row||row.version!==expectedVersion)throw err("BUDGET_DEFAULT_VERSION_CONFLICT");
    query=db.from(TABLE).update({amount,start_month:startMonth,
      disabled_at:null,version:expectedVersion+1})
      .eq("id",row.id).eq("user_id",owner).eq("version",expectedVersion)
      .select(FIELDS).maybeSingle();
  }
  const {data,error}=await query;
  if(error?.code==="23505"||error?.code==="23514")
    throw err("BUDGET_DEFAULT_VERSION_CONFLICT",error);
  if(error)throw err("BUDGET_DEFAULT_WRITE_FAILED",error);
  if(!data)throw err("BUDGET_DEFAULT_VERSION_CONFLICT");
  const saved=shape(data,owner);
  await sameOwner(db,owner);
  return saved;
 }
 async function disable({client,categoryId=null,expectedVersion}={}){
  if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1)
    throw err("BUDGET_DEFAULT_VERSION_REQUIRED");
  const {db,owner}=await verified(client),prior=await list({client:db});
  const row=prior.find(x=>x.category_id===categoryId);
  if(!row||row.version!==expectedVersion)throw err("BUDGET_DEFAULT_VERSION_CONFLICT");
  const {data,error}=await db.from(TABLE).update({disabled_at:new Date().toISOString(),
    version:expectedVersion+1}).eq("id",row.id).eq("user_id",owner)
    .eq("version",expectedVersion).select(FIELDS).maybeSingle();
  if(error||!data)throw err("BUDGET_DEFAULT_VERSION_CONFLICT",error);
  const saved=shape(data,owner);
  await sameOwner(db,owner);
  return saved;
 }
 return Object.freeze({TABLE,FIELDS,list,save,disable});
});
