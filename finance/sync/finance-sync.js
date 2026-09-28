(function(root,factory){
  "use strict";
  const api=factory(root,typeof module==="object"&&module.exports?require("./finance-sync-store.js"):root.FinanceSyncStore);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceSync=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,CloudStore){
  "use strict";
  const REFERENCE_KINDS=Object.freeze(["accounts","categories","creditCards"]),ORDER=Object.freeze([...REFERENCE_KINDS,"transactions"]);
  const keyOf=(kind,id)=>`${kind}:${id}`;
  const timeOf=value=>Date.parse(value||0)||0;
  const canonical=value=>JSON.stringify(value,Object.keys(value||{}).sort());
  function compare(local,remote){const localTime=timeOf(local?.updatedAt||local?.createdAt),remoteTime=timeOf(remote?.updated_at||remote?.created_at);if(localTime!==remoteTime)return localTime>remoteTime?1:-1;return canonical(local)>=canonical(remote?.payload)?1:-1;}
  const isPristineSystemCategory=(kind,record)=>kind==="categories"&&record?.system===true&&String(record.id||"").startsWith("system-")&&record.createdAt===record.updatedAt;
  function isCloud(scope=root){return Boolean(scope?.LizhiAuth?.user&&scope.location?.hostname?.endsWith("github.io"));}
  function create({storage=root.FinanceStorage,store=CloudStore,scope=root,delayMs=500}={}){
    if(!storage?.sync||!store?.list||!store?.upsert)throw new TypeError("FinanceSync 需要 FinanceStorage.sync 與 FinanceSyncStore。");
    let busy=false,timer=null,status=Object.freeze({state:"idle",lastSyncedAt:null,error:null,pending:0,deferred:0}),listeners=new Set();
    const emit=next=>{status=Object.freeze({...status,...next});for(const listener of listeners)listener(status);return status;};
    async function sync({force=false}={}){
      if(busy)return status;if(!force&&!isCloud(scope))return status;
      busy=true;emit({state:"syncing",error:null});
      try{
        const remoteRows=await store.list(),remote=new Map(remoteRows.map(row=>[keyOf(row.kind,row.id),row])),localRows=new Map(),uploads=[];let applied=0,deferred=0;
        for(const kind of ORDER)for(const row of await storage.sync.list(kind))localRows.set(keyOf(kind,row.id),{kind,record:row});
        for(const kind of ORDER){
          const ids=new Set();for(const item of localRows.values())if(item.kind===kind)ids.add(item.record.id);for(const row of remoteRows)if(row.kind===kind)ids.add(row.id);
          for(const id of ids){
            const key=keyOf(kind,id),local=localRows.get(key)?.record,cloud=remote.get(key);
            if(local&&!cloud){uploads.push({kind,record:local});continue;}
            if(!local&&cloud){if(kind==="transactions"&&!await storage.sync.referencesPresent(cloud.payload)){deferred+=1;continue;}await storage.sync.put(kind,cloud.payload);applied+=1;continue;}
            if(!local||!cloud)continue;
            if(!isPristineSystemCategory(kind,local)&&compare(local,cloud)>=0)uploads.push({kind,record:local});
            else{if(kind==="transactions"&&!await storage.sync.referencesPresent(cloud.payload)){deferred+=1;continue;}await storage.sync.put(kind,cloud.payload);applied+=1;}
          }
        }
        if(uploads.length)await store.upsert(uploads);
        emit({state:deferred?"pending":"synced",lastSyncedAt:Date.now(),error:null,pending:0,deferred});return Object.freeze({ok:true,uploaded:uploads.length,applied,deferred,status});
      }catch(error){emit({state:"error",error:{code:String(error?.code||"SYNC_FAILED"),message:"本機帳本已保留，雲端同步暫時失敗。"}});return Object.freeze({ok:false,error:status.error,status});}
      finally{busy=false;}
    }
    function schedule(){if(!isCloud(scope))return status;emit({state:"pending",pending:status.pending+1});clearTimeout(timer);timer=setTimeout(()=>void sync(),delayMs);return status;}
    function cancel(){if(timer)clearTimeout(timer);timer=null;}
    function subscribe(listener){if(typeof listener!=="function")throw new TypeError("listener 必須是函式");listeners.add(listener);listener(status);return()=>listeners.delete(listener);}
    return Object.freeze({sync,schedule,cancel,subscribe,getStatus:()=>status});
  }
  return Object.freeze({REFERENCE_KINDS,ORDER,keyOf,compare,isPristineSystemCategory,isCloud,create});
});
