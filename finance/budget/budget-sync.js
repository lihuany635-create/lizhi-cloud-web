(function(root,factory){
  "use strict";
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(
    isNode?require("./budget-local-store.js"):root.FinanceBudgetLocalStore,
    isNode?require("./budget-cloud-store.js"):root.FinanceBudgetCloudStore,
    isNode?require("./budget-owner.js"):root.FinanceBudgetOwner);
  if(isNode)module.exports=api;
  root.FinanceBudgetSync=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Local,Cloud,Owner){
  "use strict";
  const error=code=>Object.assign(new Error(code),{code});
  const key=row=>JSON.stringify([row.month,row.currency,row.categoryId??row.category_id??null]);
  const reason=e=>String(e?.code||e?.message||"BUDGET_SYNC_FAILED");
  function create({local=Local,cloud=Cloud,owner=Owner}={}){
    if(!local?.list||!local?.applyRemote||!local?.markSynced||
       !cloud?.list||!cloud?.create||!cloud?.update||!owner?.requireOwner)
      throw new TypeError("BUDGET_SYNC_DEPENDENCY_MISSING");
    let busy=false;
    async function sync({client,month}={}){
      if(busy)return Object.freeze({ok:false,state:"busy"});
      busy=true;
      const result={ok:false,state:"syncing",uploaded:0,applied:0,
        skipped:0,conflicts:[],errors:[],ownerId:null};
      let signedInOwner=null;
      const assertOwner=async()=>{
        const current=await owner.requireOwner();
        if(signedInOwner!==current)throw error("BUDGET_IDENTITY_CHANGED");
      };
      try{
        signedInOwner=await owner.requireOwner();
        result.ownerId=signedInOwner;
        const remote=await cloud.list({client,month});
        await assertOwner();
        if(!Array.isArray(remote))throw error("BUDGET_REMOTE_MALFORMED");
        // Fail closed *before* mutating local data if any response leaks another owner.
        for(const row of remote){
          if(row?.user_id!==signedInOwner||!row.id||!Number.isSafeInteger(Number(row.version)))
            throw error("BUDGET_REMOTE_OWNER_MISMATCH");
        }
        const localRows=(await local.list({includeDeleted:true}))
          .filter(row=>!month||row.month===month);
        await assertOwner();
        if(!Array.isArray(localRows)||localRows.some(row=>row?.ownerId!==signedInOwner))
          throw error("BUDGET_LOCAL_OWNER_MISMATCH");
        const remoteById=new Map(remote.map(row=>[row.id,row]));
        const localById=new Map(localRows.map(row=>[row.id,row]));
        const localByScope=new Map(localRows.filter(row=>!row.deletedAt)
          .map(row=>[key(row),row]));
        // Pull newer remote versions only into clean local state. Never discard dirty edits.
        for(const row of remote){
          await assertOwner();
          const mine=localById.get(row.id);
          if(mine?.dirty)continue;
          if(!mine||Number(row.version)>Number(mine.version)){
            const sameScope=localByScope.get(key(row));
            if(sameScope&&sameScope.id!==row.id){
              result.conflicts.push({id:row.id,reason:"BUDGET_SCOPE_CONFLICT"});
              continue;
            }
            try{
              await local.applyRemote(row);
              result.applied++;
            }catch(e){
              result.conflicts.push({id:row.id,reason:reason(e)});
            }
          }
        }
        for(const row of localRows){
          await assertOwner();
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
            // An uncommitted tombstone is kept offline; do not create a cloud row.
            result.skipped++;
            continue;
          }
          if(!onCloud){
            const sameScope=remote.find(r=>!r.deleted_at&&key(r)===key(row));
            if(sameScope){
              result.conflicts.push({id:row.id,reason:"BUDGET_SCOPE_CONFLICT"});
              continue;
            }
          }
          try{
            const saved=onCloud
              ?await cloud.update({client,record:row})
              :await cloud.create({client,record:row});
            await assertOwner();
            if(saved?.user_id!==signedInOwner||saved?.id!==row.id)
              throw error("BUDGET_REMOTE_OWNER_MISMATCH");
            await local.markSynced(row.id,row.updatedAt,saved);
            result.uploaded++;
          }catch(e){
            const why=reason(e);
            if(why.includes("IDENTITY")||why.includes("AUTH")||why.includes("OWNER_MISMATCH"))
              throw e;
            if(why.includes("CONFLICT"))result.conflicts.push({id:row.id,reason:why});
            else result.errors.push({id:row.id,reason:why});
          }
        }
        await assertOwner();
        result.ok=result.conflicts.length===0&&result.errors.length===0&&result.skipped===0;
        result.state=result.ok?"synced":"pending";
        return Object.freeze(result);
      }catch(e){
        const why=reason(e);
        result.state=why.includes("AUTH")||why.includes("IDENTITY")||why.includes("OWNER")
          ?"auth_required":"error";
        result.errors.push({reason:why});
        return Object.freeze(result);
      }finally{busy=false;}
    }
    return Object.freeze({sync});
  }
  return Object.freeze({create});
});
