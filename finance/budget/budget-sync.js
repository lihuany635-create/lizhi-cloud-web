(function(root,factory){
  "use strict";
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(
    isNode?require("./budget-local-store.js"):root.FinanceBudgetLocalStore,
    isNode?require("./budget-cloud-store.js"):root.FinanceBudgetCloudStore);
  if(isNode)module.exports=api;
  root.FinanceBudgetSync=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Local,Cloud){
  "use strict";
  function create({local=Local,cloud=Cloud}={}){
    let busy=false;
    async function sync({client,month}={}){
      if(busy)return {ok:false,state:"busy"};
      busy=true;
      const result={ok:false,state:"syncing",uploaded:0,applied:0,conflicts:[],errors:[]};
      try{
        const remote=await cloud.list({client,month});
        const localRows=(await local.list({includeDeleted:true})).filter(row=>!month||row.month===month);
        const remoteById=new Map(remote.map(row=>[row.id,row]));
        const localById=new Map(localRows.map(row=>[row.id,row]));
        // Pull only clean records. Never overwrite locally edited, unsynchronized work.
        for(const row of remote){
          const mine=localById.get(row.id);
          if(mine?.dirty)continue;
          if(!mine||Number(row.version)>Number(mine.version)){
            try{await local.applyRemote(row);result.applied++;}
            catch(e){result.conflicts.push({id:row.id,reason:e.message||"BUDGET_PULL_CONFLICT"});}
          }
        }
        for(const row of localRows){
          if(!row.dirty)continue;
          const onCloud=remoteById.get(row.id);
          if(onCloud&&Number(onCloud.version)!==Number(row.version)){
            result.conflicts.push({id:row.id,reason:"BUDGET_VERSION_CONFLICT"});
            continue;
          }
          if(!onCloud&&Number(row.version)!==0){
            result.conflicts.push({id:row.id,reason:"BUDGET_REMOTE_MISSING"});
            continue;
          }
          if(!onCloud&&row.deletedAt){
            // An uncommitted new budget deleted locally needs no cloud tombstone.
            continue;
          }
          try{
            const saved=onCloud?await cloud.update({client,record:row}):await cloud.create({client,record:row});
            await local.markSynced(row.id,row.updatedAt,saved);
            result.uploaded++;
          }catch(e){
            const reason=e.code||e.message||"BUDGET_SYNC_FAILED";
            if(reason.includes("CONFLICT"))result.conflicts.push({id:row.id,reason});
            else result.errors.push({id:row.id,reason});
          }
        }
        result.ok=result.conflicts.length===0&&result.errors.length===0;
        result.state=result.ok?"synced":"pending";
        return result;
      }catch(e){
        result.state="error";
        result.errors.push({reason:e.code||e.message||"BUDGET_SYNC_FAILED"});
        return result;
      }finally{busy=false;}
    }
    return Object.freeze({sync});
  }
  return Object.freeze({create});
});
