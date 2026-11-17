(function(root,factory){
  "use strict";
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("./budget-domain.js"):root.FinanceBudgetDomain,
    isNode?require("./budget-owner.js"):root.FinanceBudgetOwner);
  if(isNode)module.exports=api;
  root.FinanceBudgetCloudStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain,Owner){
  "use strict";
  const TABLE="lizhi_finance_budgets";
  const FIELDS="id,user_id,month,category_id,currency,amount,version,created_at,updated_at,deleted_at";
  const error=(code,cause)=>Object.assign(new Error(code),{code,cause});
  function clientOf(client){
    const db=client||(typeof globalThis!=="undefined"?globalThis.LizhiAuth?.client:null);
    if(!db?.from||!db?.auth?.getSession)throw error("BUDGET_AUTH_REQUIRED");
    return db;
  }
  async function userOf(db){
    const verifiedId=await Owner.requireOwner();
    const {data,error:err}=await db.auth.getUser();
    if(err||!data?.user?.id||data.user.id!==verifiedId)
      throw error("BUDGET_IDENTITY_MISMATCH");
    return data.user;
  }
  async function list({client,month}={}){
    if(month!==undefined)Domain.validateBudget({month,amount:0});
    const db=clientOf(client),user=await userOf(db),rows=[];
    // Bound page size; settings are usually small, but do not silently truncate.
    for(let offset=0;offset<10000;offset+=250){
      let query=db.from(TABLE).select(FIELDS)
        .eq("user_id",user.id).order("month",{ascending:true})
        .order("id",{ascending:true}).range(offset,offset+249);
      if(month!==undefined)query=query.eq("month",month);
      const {data,error:err}=await query;
      if(err||!Array.isArray(data))throw error("BUDGET_CLOUD_READ_FAILED",err);
      rows.push(...data);
      if(data.length<250)return rows;
    }
    throw error("BUDGET_CLOUD_ROW_LIMIT");
  }
  function payload(record,userId){
    const b=Domain.validateBudget(record);
    if(typeof record.id!=="string"||!record.id.trim())throw error("BUDGET_ID_REQUIRED");
    return {id:record.id,user_id:userId,month:b.month,category_id:b.categoryId,
      currency:b.currency,amount:b.amount};
  }
  const one=async request=>{
    const {data,error:err}=await request;
    if(err?.code==="23505")throw error("BUDGET_SCOPE_CONFLICT",err);
    if(err)throw error("BUDGET_CLOUD_WRITE_FAILED",err);
    return data??null;
  };
  async function create({client,record}={}){
    const db=clientOf(client),user=await userOf(db);
    if(Number(record?.version)!==0)throw error("BUDGET_INSERT_VERSION_CONFLICT");
    const data=await one(db.from(TABLE).insert(payload(record,user.id)).select(FIELDS).maybeSingle());
    if(!data)throw error("BUDGET_WRITE_NOT_CONFIRMED");
    return data;
  }
  async function update({client,record}={}){
    const db=clientOf(client),user=await userOf(db);
    const base=Number(record?.version);
    if(!Number.isSafeInteger(base)||base<1)throw error("BUDGET_VERSION_REQUIRED");
    const b=Domain.validateBudget(record);
    const data=await one(db.from(TABLE)
      .update({amount:b.amount,version:base+1,deleted_at:record.deletedAt??null})
      .eq("id",record.id).eq("user_id",user.id).eq("version",base)
      .select(FIELDS).maybeSingle());
    if(!data)throw error("BUDGET_VERSION_CONFLICT");
    return data;
  }
  return Object.freeze({TABLE,FIELDS,list,create,update});
});
