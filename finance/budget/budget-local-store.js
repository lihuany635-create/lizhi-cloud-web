(function(root,factory){
  "use strict";
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("../storage/finance-db.js"):root.FinanceStorage,
    isNode?require("./budget-domain.js"):root.FinanceBudgetDomain,
    isNode?require("./budget-owner.js"):root.FinanceBudgetOwner);
  if(isNode)module.exports=api;
  root.FinanceBudgetLocalStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Storage,Domain,Owner){
  "use strict";
  const STORE="budgets";
  const stamp=()=>new Date().toISOString();
  const uuid=()=>globalThis.crypto?.randomUUID?.();
  const request=req=>new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  const done=tx=>new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error("BUDGET_TX_ABORT"));
    tx.onerror=()=>{};
  });
  function validOwner(ownerId){
    if(typeof ownerId!=="string"||!Owner.USER_ID.test(ownerId))
      throw new Error("BUDGET_OWNER_REQUIRED");
    return ownerId;
  }
  function scopeKey(row){
    // Prefix prevents collision with the old v2 three-element scope key.
    return JSON.stringify(["owner",validOwner(row.ownerId),row.month,
      row.currency??"TWD",row.categoryId??null]);
  }
  async function transact(mode,action){
    const db=await Storage.openFinanceDb();
    try{
      if(!db.objectStoreNames.contains(STORE))
        throw new Error("BUDGET_OWNER_SCHEMA_MISSING");
      const tx=db.transaction(STORE,mode);
      const store=tx.objectStore(STORE);
      if(!store.indexNames.contains("ownerId")){
        tx.abort();
        throw new Error("BUDGET_OWNER_SCHEMA_MISSING");
      }
      const completed=done(tx);
      const result=await action(store);
      await completed;
      return result;
    }finally{db.close();}
  }
  const create=({id,month,categoryId=null,amount,currency="TWD",ownerId})=>{
    const normalized=Domain.validateBudget({month,categoryId,amount,currency});
    const identity=id??uuid();
    if(typeof identity!=="string"||!identity.trim())throw new Error("BUDGET_UUID_UNAVAILABLE");
    const now=stamp();
    const owner=validOwner(ownerId);
    return {id:identity,...normalized,ownerId:owner,
      scopeKey:scopeKey({...normalized,ownerId:owner}),
      version:0,dirty:true,createdAt:now,updatedAt:now,deletedAt:null};
  };
  async function list({includeDeleted=true}={}){
    const ownerId=await Owner.requireOwner();
    return transact("readonly",async store=>{
      const rows=await request(store.index("ownerId").getAll(ownerId));
      return includeDeleted?rows:rows.filter(row=>!row.deletedAt);
    });
  }
  async function get(id){
    const ownerId=await Owner.requireOwner();
    return transact("readonly",async store=>{
      const row=await request(store.get(id));
      return row?.ownerId===ownerId?row:null;
    });
  }
  async function save(input){
    const ownerId=await Owner.requireOwner();
    if(input?.ownerId!=null&&input.ownerId!==ownerId)
      throw new Error("BUDGET_OWNER_CONFLICT");
    const normalized=Domain.validateBudget(input);
    return transact("readwrite",async store=>{
      const key=scopeKey({...normalized,ownerId});
      const existing=await request(store.index("scopeKey").get(key));
      if(existing&&existing.ownerId!==ownerId)
        throw new Error("BUDGET_OWNER_CONFLICT");
      if(existing){
        const next={...existing,amount:normalized.amount,dirty:true,
          deletedAt:null,updatedAt:stamp()};
        await request(store.put(next));return next;
      }
      const next=create({...normalized,ownerId});
      await request(store.add(next));return next;
    });
  }
  async function remove(id){
    const ownerId=await Owner.requireOwner();
    return transact("readwrite",async store=>{
      const row=await request(store.get(id));
      if(!row||row.ownerId!==ownerId)throw new Error("BUDGET_NOT_FOUND");
      const next={...row,dirty:true,deletedAt:stamp(),updatedAt:stamp()};
      await request(store.put(next));return next;
    });
  }
  function fromCloud(row,ownerId){
    validOwner(ownerId);
    if(row.user_id!==ownerId)throw new Error("BUDGET_OWNER_CONFLICT");
    const local={id:row.id,ownerId,month:row.month,currency:row.currency,
      categoryId:row.category_id??null,amount:Number(row.amount),
      version:Number(row.version),dirty:false,
      createdAt:row.created_at,updatedAt:row.updated_at,
      deletedAt:row.deleted_at??null};
    Domain.validateBudget(local);
    if(!Number.isSafeInteger(local.version)||local.version<1)
      throw new Error("BUDGET_INVALID_REMOTE_VERSION");
    return {...local,scopeKey:scopeKey(local)};
  }
  async function applyRemote(row){
    const ownerId=await Owner.requireOwner();
    const remote=fromCloud(row,ownerId);
    return transact("readwrite",async store=>{
      const current=await request(store.get(remote.id));
      if(current&&current.ownerId!==ownerId)
        throw new Error("BUDGET_OWNER_CONFLICT");
      if(current?.dirty)throw new Error("BUDGET_DIRTY_CONFLICT");
      if(current&&current.version>remote.version)return current;
      const another=await request(store.index("scopeKey").get(remote.scopeKey));
      if(another&&another.id!==remote.id)throw new Error("BUDGET_SCOPE_CONFLICT");
      await request(store.put(remote));return remote;
    });
  }
  async function markSynced(id,expectedUpdatedAt,row){
    const ownerId=await Owner.requireOwner();
    const remote=fromCloud(row,ownerId);
    if(remote.id!==id)throw new Error("BUDGET_REMOTE_ID_MISMATCH");
    return transact("readwrite",async store=>{
      const current=await request(store.get(id));
      if(!current||current.ownerId!==ownerId)throw new Error("BUDGET_NOT_FOUND");
      const stillCurrent=current.updatedAt===expectedUpdatedAt;
      const next=stillCurrent?remote:{...current,version:remote.version,dirty:true};
      await request(store.put(next));
      return next;
    });
  }
  return Object.freeze({STORE,scopeKey,create,list,get,save,remove,fromCloud,applyRemote,markSynced});
});
