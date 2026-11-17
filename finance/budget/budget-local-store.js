(function(root,factory){
  "use strict";
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("../storage/finance-db.js"):root.FinanceStorage,
    isNode?require("./budget-domain.js"):root.FinanceBudgetDomain);
  if(isNode)module.exports=api;
  root.FinanceBudgetLocalStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Storage,Domain){
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
  const scopeKey=row=>[row.month,row.currency??"TWD",row.categoryId??"__TOTAL__"].join("|");
  async function transact(mode,action){
    const db=await Storage.openFinanceDb();
    try{
      if(!db.objectStoreNames.contains(STORE))throw new Error("BUDGET_SCHEMA_MISSING");
      const tx=db.transaction(STORE,mode);
      const completed=done(tx);
      const result=await action(tx.objectStore(STORE));
      await completed;
      return result;
    }finally{db.close();}
  }
  const create=({id,month,categoryId=null,amount,currency="TWD"})=>{
    const normalized=Domain.validateBudget({month,categoryId,amount,currency});
    const identity=id??uuid();
    if(typeof identity!=="string"||!identity.trim())throw new Error("BUDGET_UUID_UNAVAILABLE");
    const now=stamp();
    return {id:identity,...normalized,scopeKey:scopeKey(normalized),
      version:0,dirty:true,createdAt:now,updatedAt:now,deletedAt:null};
  };
  const list=({includeDeleted=true}={})=>transact("readonly",async store=>{
    const rows=await request(store.getAll());
    return includeDeleted?rows:rows.filter(row=>!row.deletedAt);
  });
  const get=id=>transact("readonly",store=>request(store.get(id)));
  async function save(input){
    const normalized=Domain.validateBudget(input);
    return transact("readwrite",async store=>{
      const key=scopeKey(normalized);
      const existing=await request(store.index("scopeKey").get(key));
      if(existing){
        const next={...existing,amount:normalized.amount,dirty:true,deletedAt:null,updatedAt:stamp()};
        await request(store.put(next));return next;
      }
      const next=create(normalized);
      await request(store.add(next));return next;
    });
  }
  async function remove(id){
    return transact("readwrite",async store=>{
      const row=await request(store.get(id));
      if(!row)throw new Error("BUDGET_NOT_FOUND");
      const next={...row,dirty:true,deletedAt:stamp(),updatedAt:stamp()};
      await request(store.put(next));return next;
    });
  }
  function fromCloud(row){
    const local={id:row.id,month:row.month,currency:row.currency,
      categoryId:row.category_id??null,amount:Number(row.amount),
      version:Number(row.version),dirty:false,
      createdAt:row.created_at,updatedAt:row.updated_at,
      deletedAt:row.deleted_at??null};
    Domain.validateBudget(local);
    if(!Number.isSafeInteger(local.version)||local.version<1)throw new Error("BUDGET_INVALID_REMOTE_VERSION");
    return {...local,scopeKey:scopeKey(local)};
  }
  async function applyRemote(row){
    const remote=fromCloud(row);
    return transact("readwrite",async store=>{
      const current=await request(store.get(remote.id));
      if(current?.dirty)throw new Error("BUDGET_DIRTY_CONFLICT");
      if(current&&current.version>remote.version)return current;
      const another=await request(store.index("scopeKey").get(remote.scopeKey));
      if(another&&another.id!==remote.id)throw new Error("BUDGET_SCOPE_CONFLICT");
      await request(store.put(remote));return remote;
    });
  }
  async function markSynced(id,expectedUpdatedAt,row){
    const remote=fromCloud(row);
    return transact("readwrite",async store=>{
      const current=await request(store.get(id));
      if(!current)throw new Error("BUDGET_NOT_FOUND");
      const stillCurrent=current.updatedAt===expectedUpdatedAt;
      const next=stillCurrent?remote:{...current,version:remote.version,dirty:true};
      await request(store.put(next));
      return next;
    });
  }
  return Object.freeze({STORE,scopeKey,create,list,get,save,remove,fromCloud,applyRemote,markSynced});
});
