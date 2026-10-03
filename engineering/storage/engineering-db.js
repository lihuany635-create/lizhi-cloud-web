(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringDatabase=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const DB_NAME="lizhi-engineering",DB_VERSION=3;
  const STORES=Object.freeze({projects:"projects",settings:"settings",calculations:"calculations",measurements:"measurements",notes:"notes",attachments:"attachments",project_records:"project_records"});

  class EngineeringStorageError extends Error{
    constructor(code,message,cause){super(message,{cause});this.name="EngineeringStorageError";this.code=code;}
  }
  const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const transactionDone=transaction=>new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error||new Error("Transaction aborted"));});
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const randomId=()=>root.crypto?.randomUUID?.()||`workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function openDatabase(indexedDBImpl=root.indexedDB){
    if(!indexedDBImpl)return Promise.reject(new EngineeringStorageError("DATABASE_UNAVAILABLE","此瀏覽器不支援工程專案本機資料庫。"));
    return new Promise((resolve,reject)=>{
      let request;
      try{request=indexedDBImpl.open(DB_NAME,DB_VERSION);}catch(cause){reject(new EngineeringStorageError("DATABASE_OPEN_FAILED","無法開啟工程專案資料庫。",cause));return;}
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORES.projects)){
          const projects=db.createObjectStore(STORES.projects,{keyPath:"id"});
          projects.createIndex("status","status");
          projects.createIndex("workspace_id","workspace_id");
          projects.createIndex("updated_at","updated_at");
        }
        if(!db.objectStoreNames.contains(STORES.settings))db.createObjectStore(STORES.settings,{keyPath:"key"});
        if(!db.objectStoreNames.contains(STORES.calculations)){
          const calculations=db.createObjectStore(STORES.calculations,{keyPath:"id"});
          calculations.createIndex("project_id","project_id");
          calculations.createIndex("formula_id","formula_id");
          calculations.createIndex("created_at","created_at");
        }
        const createProjectDataStore=(name,indexes=[])=>{
          if(db.objectStoreNames.contains(name))return;
          const store=db.createObjectStore(name,{keyPath:"id"});
          store.createIndex("project_id","project_id");
          for(const index of indexes)store.createIndex(index,index);
        };
        createProjectDataStore(STORES.measurements,["type","updated_at"]);
        createProjectDataStore(STORES.notes,["updated_at"]);
        createProjectDataStore(STORES.attachments,["kind","created_at"]);
        createProjectDataStore(STORES.project_records,["record_type","created_at"]);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new EngineeringStorageError("DATABASE_OPEN_FAILED","無法開啟工程專案資料庫。",request.error));
      request.onblocked=()=>reject(new EngineeringStorageError("DATABASE_BLOCKED","工程專案資料庫正在被其他頁面使用，請關閉其他分頁後重試。"));
    });
  }

  function createPersistence({indexedDBImpl=root.indexedDB}={}){
    async function withStore(storeName,mode,operation){
      const db=await openDatabase(indexedDBImpl);
      try{
        const transaction=db.transaction(storeName,mode),store=transaction.objectStore(storeName);
        const result=await operation(store,transaction);
        await transactionDone(transaction);
        return clone(result);
      }catch(error){
        if(error instanceof EngineeringStorageError)throw error;
        throw new EngineeringStorageError("DATABASE_OPERATION_FAILED","工程專案資料操作失敗。",error);
      }finally{db.close();}
    }
    return Object.freeze({
      addProject(project){return withStore(STORES.projects,"readwrite",store=>requestResult(store.add(clone(project))));},
      putProject(project){return withStore(STORES.projects,"readwrite",store=>requestResult(store.put(clone(project))));},
      getProject(id){return withStore(STORES.projects,"readonly",store=>requestResult(store.get(String(id))));},
      listProjects(){return withStore(STORES.projects,"readonly",store=>requestResult(store.getAll()));},
      addCalculation(record){return withStore(STORES.calculations,"readwrite",store=>requestResult(store.add(clone(record))));},
      getCalculation(id){return withStore(STORES.calculations,"readonly",store=>requestResult(store.get(String(id))));},
      listCalculations(projectId){return withStore(STORES.calculations,"readonly",store=>requestResult(store.index("project_id").getAll(String(projectId))));},
      addData(storeName,record){return withStore(storeName,"readwrite",store=>requestResult(store.add(clone(record))));},
      putData(storeName,record){return withStore(storeName,"readwrite",store=>requestResult(store.put(clone(record))));},
      getData(storeName,id){return withStore(storeName,"readonly",store=>requestResult(store.get(String(id))));},
      deleteData(storeName,id){return withStore(storeName,"readwrite",store=>requestResult(store.delete(String(id))));},
      listDataByProject(storeName,projectId){return withStore(storeName,"readonly",store=>requestResult(store.index("project_id").getAll(String(projectId))));},
      listData(storeName){return withStore(storeName,"readonly",store=>requestResult(store.getAll()));},
      getWorkspaceId(){
        return withStore(STORES.settings,"readwrite",async store=>{
          const existing=await requestResult(store.get("workspace_id"));
          if(existing?.value)return existing.value;
          const value=randomId();
          await requestResult(store.put({key:"workspace_id",value}));
          return value;
        });
      }
    });
  }

  return Object.freeze({DB_NAME,DB_VERSION,STORES,EngineeringStorageError,openDatabase,createPersistence});
});
