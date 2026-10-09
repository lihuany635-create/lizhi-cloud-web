(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringDatabase=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const DB_NAME="lizhi-engineering",DB_VERSION=14;
  const STORES=Object.freeze({projects:"projects",settings:"settings",calculations:"calculations",measurements:"measurements",notes:"notes",attachments:"attachments",project_records:"project_records",designs:"designs",boms:"boms",price_entries:"price_entries",quotes:"quotes",project_members:"project_members",tasks:"tasks",task_reviews:"task_reviews",workflow_events:"workflow_events",ai_drafts:"ai_drafts",ai_actions:"ai_actions",ai_events:"ai_events",sync_outbox:"sync_outbox",sync_state:"sync_state",sync_conflicts:"sync_conflicts",sync_receipts:"sync_receipts",sync_audit:"sync_audit",supervision_inspections:"supervision_inspections",supervision_defects:"supervision_defects",supervision_profiles:"supervision_profiles",supervision_parties:"supervision_parties",supervision_work_items:"supervision_work_items",supervision_locations:"supervision_locations",supervision_relations:"supervision_relations",supervision_inspection_revisions:"supervision_inspection_revisions",supervision_inspection_reviews:"supervision_inspection_reviews",supervision_inspection_events:"supervision_inspection_events",supervision_corrective_rounds:"supervision_corrective_rounds",supervision_defect_reviews:"supervision_defect_reviews",supervision_defect_events:"supervision_defect_events",supervision_daily_records:"supervision_daily_records",supervision_daily_record_revisions:"supervision_daily_record_revisions",supervision_daily_record_reviews:"supervision_daily_record_reviews",supervision_daily_record_events:"supervision_daily_record_events",engineering_documents:"engineering_documents",engineering_document_revisions:"engineering_document_revisions",engineering_document_submissions:"engineering_document_submissions",engineering_document_reviews:"engineering_document_reviews",engineering_document_events:"engineering_document_events"});

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
        createProjectDataStore(STORES.designs,["template_id","status","updated_at"]);
        createProjectDataStore(STORES.boms,["design_id","created_at"]);
        createProjectDataStore(STORES.price_entries,["bom_item_id","effective_at"]);
        createProjectDataStore(STORES.quotes,["bom_id","status","updated_at"]);
        createProjectDataStore(STORES.project_members,["role","status","updated_at"]);
        if(!db.objectStoreNames.contains(STORES.tasks)){
          const tasks=db.createObjectStore(STORES.tasks,{keyPath:"id"});
          tasks.createIndex("project_id","project_id");
          tasks.createIndex("status","status");
          tasks.createIndex("assignee_ids","assignee_ids",{multiEntry:true});
          tasks.createIndex("updated_at","updated_at");
        }
        createProjectDataStore(STORES.task_reviews,["task_id","reviewer_id","created_at"]);
        createProjectDataStore(STORES.workflow_events,["entity_id","event_type","created_at"]);
        createProjectDataStore(STORES.ai_drafts,["capability_id","status","created_at","updated_at"]);
        createProjectDataStore(STORES.ai_actions,["draft_id","action_type","status","updated_at"]);
        createProjectDataStore(STORES.ai_events,["draft_id","action_id","event_type","created_at"]);
        createProjectDataStore(STORES.supervision_inspections,["module_id","status","updated_at"]);
        createProjectDataStore(STORES.supervision_defects,["module_id","inspection_id","status","updated_at"]);
        const createIndexedStore=(name,indexes=[])=>{
          if(db.objectStoreNames.contains(name))return;
          const store=db.createObjectStore(name,{keyPath:"id"});
          for(const index of indexes){const descriptor=typeof index==="string"?{name:index,keyPath:index}:index;store.createIndex(descriptor.name,descriptor.keyPath,descriptor.options||{});}
        };
        createIndexedStore(STORES.supervision_profiles,[{name:"project_id",keyPath:"project_id",options:{unique:true}},"status","updated_at"]);
        createIndexedStore(STORES.supervision_parties,["project_id","party_type","status","updated_at"]);
        createIndexedStore(STORES.supervision_work_items,["project_id","parent_id","status","updated_at",{name:"project_code",keyPath:["project_id","code"],options:{unique:true}}]);
        createIndexedStore(STORES.supervision_locations,["project_id","parent_id","status","updated_at",{name:"project_code",keyPath:["project_id","code"],options:{unique:true}}]);
        createIndexedStore(STORES.supervision_relations,["project_id","source_id","target_id","relation_type","status","updated_at",{name:"relation_identity",keyPath:["project_id","source_type","source_id","target_type","target_id","relation_type"],options:{unique:true}}]);
        createIndexedStore(STORES.supervision_inspection_revisions,["project_id","inspection_id","created_at",{name:"inspection_revision",keyPath:["inspection_id","revision"],options:{unique:true}}]);
        createIndexedStore(STORES.supervision_inspection_reviews,["project_id","inspection_id","inspection_revision_id","reviewer_ref","reviewed_at",{name:"action_id",keyPath:"action_id",options:{unique:true}}]);
        createIndexedStore(STORES.supervision_inspection_events,["project_id","inspection_id","event_type","created_at",{name:"action_id",keyPath:"action_id",options:{unique:true}}]);
        createIndexedStore(STORES.supervision_corrective_rounds,["workspace_id","project_id","defect_id","submitted_by","submitted_at",{name:"defect_round",keyPath:["defect_id","round_number"],options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"evidence_attachment_ids",keyPath:"evidence_attachment_ids",options:{multiEntry:true}}]);
        createIndexedStore(STORES.supervision_defect_reviews,["workspace_id","project_id","defect_id","round_id","reviewer_member_id","reviewed_at",{name:"round_unique",keyPath:"round_id",options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"evidence_attachment_ids",keyPath:"evidence_attachment_ids",options:{multiEntry:true}}]);
        createIndexedStore(STORES.supervision_defect_events,["workspace_id","project_id","defect_id","round_id","review_id","event_type","created_at",{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"defect_revision",keyPath:["defect_id","defect_revision"],options:{unique:true}}]);
        createIndexedStore(STORES.supervision_daily_records,["workspace_id","project_id","record_type","record_date","reporting_party_id","site_location_id","status","updated_at",{name:"identity_key",keyPath:"identity_key",options:{unique:true}}]);
        createIndexedStore(STORES.supervision_daily_record_revisions,["workspace_id","project_id","record_id","record_type","record_date","created_at",{name:"record_revision",keyPath:["record_id","revision"],options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"attachment_ids",keyPath:"attachment_ids",options:{multiEntry:true}}]);
        createIndexedStore(STORES.supervision_daily_record_reviews,["workspace_id","project_id","record_id","revision_id","reviewer_member_id","decision","reviewed_at",{name:"revision_unique",keyPath:"revision_id",options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}}]);
        createIndexedStore(STORES.supervision_daily_record_events,["workspace_id","project_id","record_id","revision_id","review_id","event_type","occurred_at",{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"record_version",keyPath:["record_id","record_version"],options:{unique:true}}]);
        createIndexedStore(STORES.engineering_documents,["workspace_id","project_id","document_type","issuer_party_id","status","updated_at",{name:"identity_key",keyPath:"identity_key",options:{unique:true}}]);
        createIndexedStore(STORES.engineering_document_revisions,["workspace_id","project_id","document_id","created_at",{name:"document_revision",keyPath:["document_id","revision"],options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"attachment_ids",keyPath:"attachment_ids",options:{multiEntry:true}}]);
        createIndexedStore(STORES.engineering_document_submissions,["workspace_id","project_id","document_id","revision_id","status","submitted_at",{name:"document_submission",keyPath:["document_id","submission_number"],options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}}]);
        createIndexedStore(STORES.engineering_document_reviews,["workspace_id","project_id","document_id","revision_id","submission_id","reviewer_member_id","decision","reviewed_at",{name:"submission_review",keyPath:"submission_id",options:{unique:true}},{name:"action_id",keyPath:"action_id",options:{unique:true}}]);
        createIndexedStore(STORES.engineering_document_events,["workspace_id","project_id","document_id","revision_id","submission_id","review_id","event_type","occurred_at",{name:"action_id",keyPath:"action_id",options:{unique:true}},{name:"document_version",keyPath:["document_id","document_version"],options:{unique:true}}]);
        const upgradeTransaction=request.transaction;
        const ensureIndex=(storeName,name,keyPath=name,options={})=>{if(!upgradeTransaction||!db.objectStoreNames.contains(storeName))return;const store=upgradeTransaction.objectStore(storeName);if(!store.indexNames.contains(name))store.createIndex(name,keyPath,options);};
        ensureIndex(STORES.supervision_defects,"attachment_ids","attachment_ids",{multiEntry:true});
        ensureIndex(STORES.supervision_defects,"due_at");
        ensureIndex(STORES.supervision_defects,"revision");
        ensureIndex(STORES.tasks,"idempotency_key","idempotency_key",{unique:true});
        if(!db.objectStoreNames.contains(STORES.sync_outbox)){
          const outbox=db.createObjectStore(STORES.sync_outbox,{keyPath:"id"});
          for(const index of["entity_type","entity_id","project_id","status","next_attempt_at","created_at"])outbox.createIndex(index,index);
          outbox.createIndex("idempotency_key","idempotency_key",{unique:true});
        }
        if(!db.objectStoreNames.contains(STORES.sync_state)){
          const state=db.createObjectStore(STORES.sync_state,{keyPath:"scope_id"});
          state.createIndex("workspace_id","workspace_id");state.createIndex("status","status");
        }
        if(!db.objectStoreNames.contains(STORES.sync_conflicts)){
          const conflicts=db.createObjectStore(STORES.sync_conflicts,{keyPath:"id"});
          for(const index of["entity_type","entity_id","project_id","status","detected_at"])conflicts.createIndex(index,index);
        }
        if(!db.objectStoreNames.contains(STORES.sync_receipts)){
          const receipts=db.createObjectStore(STORES.sync_receipts,{keyPath:"id"});
          for(const index of["entity_type","entity_id","project_id","last_change_id"])receipts.createIndex(index,index);
        }
        if(!db.objectStoreNames.contains(STORES.sync_audit)){
          const audit=db.createObjectStore(STORES.sync_audit,{keyPath:"id"});
          for(const index of["project_id","event_type","created_at"])audit.createIndex(index,index);
        }
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
      async commitDefectWorkflow({operation,defect,expectedRevision=0,round=null,review=null,event,attachmentIds=[]}){
        if(!["create","update"].includes(operation))throw new EngineeringStorageError("SUPERVISION_WORKFLOW_OPERATION_INVALID","不支援的 Defect 原子操作。");
        const db=await openDatabase(indexedDBImpl);
        let tx;
        try{
          const storeNames=[STORES.supervision_defects,STORES.supervision_defect_events,STORES.attachments];
          if(round)storeNames.push(STORES.supervision_corrective_rounds);
          if(review)storeNames.push(STORES.supervision_defect_reviews);
          tx=db.transaction(storeNames,"readwrite");
          const defects=tx.objectStore(STORES.supervision_defects),events=tx.objectStore(STORES.supervision_defect_events),existingEvent=await requestResult(events.index("action_id").get(String(event.action_id)));
          if(existingEvent){
            if(existingEvent.defect_id!==event.defect_id||existingEvent.event_type!==event.event_type||existingEvent.request_fingerprint!==event.request_fingerprint)throw new EngineeringStorageError("SUPERVISION_ACTION_ID_REUSED","相同 Action ID 的原始請求內容不一致。");
            await transactionDone(tx);return clone({duplicate:true,defect:await this.getData(STORES.supervision_defects,event.defect_id),event:existingEvent});
          }
          const current=await requestResult(defects.get(String(defect.id))),actualRevision=Number(current?.revision||0);
          if(operation==="create"&&current)throw new EngineeringStorageError("SUPERVISION_DEFECT_ALREADY_EXISTS","Defect 已存在。");
          if(operation==="update"&&!current)throw new EngineeringStorageError("SUPERVISION_DEFECT_NOT_FOUND","找不到 Defect。");
          if(actualRevision!==Number(expectedRevision))throw new EngineeringStorageError("SUPERVISION_DEFECT_VERSION_CONFLICT","Defect 已被其他操作更新，請重新載入。");
          const projectId=String(defect.project_id),workspaceId=String(defect.workspace_id||"");
          for(const record of [current,round,review,event].filter(Boolean)){if(String(record.project_id)!==projectId||String(record.workspace_id||"")!==workspaceId)throw new EngineeringStorageError("SUPERVISION_PROJECT_BOUNDARY_VIOLATION","Defect 工作流資料不屬於同一專案或 Workspace。");}
          const attachmentStore=tx.objectStore(STORES.attachments);
          for(const id of [...new Set((attachmentIds||[]).map(String).filter(Boolean))]){const item=await requestResult(attachmentStore.get(id));if(!item||String(item.project_id)!==projectId)throw new EngineeringStorageError("SUPERVISION_ATTACHMENT_NOT_FOUND","改善證據附件不存在或不屬於此專案。");}
          if(round)await requestResult(tx.objectStore(STORES.supervision_corrective_rounds).add(clone(round)));
          if(review)await requestResult(tx.objectStore(STORES.supervision_defect_reviews).add(clone(review)));
          await requestResult(events.add(clone(event)));
          await requestResult(operation==="create"?defects.add(clone(defect)):defects.put(clone(defect)));
          await transactionDone(tx);return clone({duplicate:false,defect,round,review,event});
        }catch(error){try{if(tx&&tx.readyState!=="done")tx.abort();}catch{}if(error instanceof EngineeringStorageError)throw error;throw new EngineeringStorageError("SUPERVISION_ATOMIC_COMMIT_FAILED","Defect、改善輪次、複查與稽核事件無法原子寫入。",error);}finally{db.close();}
      },
      async commitDailyRecordWorkflow({operation,record,expectedVersion=0,revision=null,review=null,event,attachmentIds=[]}){
        if(!["create","update"].includes(operation))throw new EngineeringStorageError("DAILY_RECORD_OPERATION_INVALID","不支援的 DailyRecord 原子操作。");
        const db=await openDatabase(indexedDBImpl);
        let tx;
        try{
          const storeNames=[STORES.supervision_daily_records,STORES.supervision_daily_record_events,STORES.attachments];
          if(revision)storeNames.push(STORES.supervision_daily_record_revisions);
          if(review)storeNames.push(STORES.supervision_daily_record_reviews);
          tx=db.transaction(storeNames,"readwrite");
          const records=tx.objectStore(STORES.supervision_daily_records),events=tx.objectStore(STORES.supervision_daily_record_events),existingEvent=await requestResult(events.index("action_id").get(String(event.action_id)));
          if(existingEvent){
            if(existingEvent.record_id!==event.record_id||existingEvent.event_type!==event.event_type||existingEvent.request_fingerprint!==event.request_fingerprint)throw new EngineeringStorageError("DAILY_RECORD_ACTION_ID_REUSED","相同 Action ID 的原始請求內容不一致。");
            await transactionDone(tx);return clone({duplicate:true,record:await this.getData(STORES.supervision_daily_records,event.record_id),event:existingEvent});
          }
          const current=await requestResult(records.get(String(record.id))),actualVersion=Number(current?.version||0);
          if(operation==="create"&&current)throw new EngineeringStorageError("DAILY_RECORD_ALREADY_EXISTS","DailyRecord 已存在。");
          if(operation==="update"&&!current)throw new EngineeringStorageError("DAILY_RECORD_NOT_FOUND","找不到 DailyRecord。");
          if(actualVersion!==Number(expectedVersion))throw new EngineeringStorageError("DAILY_RECORD_VERSION_CONFLICT","DailyRecord 已被其他操作更新，請重新載入。");
          const projectId=String(record.project_id),workspaceId=String(record.workspace_id);
          for(const value of[current,revision,review,event].filter(Boolean)){if(String(value.project_id)!==projectId||String(value.workspace_id)!==workspaceId)throw new EngineeringStorageError("DAILY_RECORD_PROJECT_BOUNDARY_VIOLATION","DailyRecord 工作流資料不屬於同一專案或 Workspace。");}
          const attachments=tx.objectStore(STORES.attachments);
          for(const id of [...new Set((attachmentIds||[]).map(String).filter(Boolean))]){const item=await requestResult(attachments.get(id));if(!item||String(item.project_id)!==projectId)throw new EngineeringStorageError("DAILY_RECORD_ATTACHMENT_INVALID","DailyRecord 附件不存在或不屬於此專案。");}
          if(revision)await requestResult(tx.objectStore(STORES.supervision_daily_record_revisions).add(clone(revision)));
          if(review)await requestResult(tx.objectStore(STORES.supervision_daily_record_reviews).add(clone(review)));
          await requestResult(events.add(clone(event)));
          await requestResult(operation==="create"?records.add(clone(record)):records.put(clone(record)));
          await transactionDone(tx);return clone({duplicate:false,record,revision,review,event});
        }catch(error){try{if(tx&&tx.readyState!=="done")tx.abort();}catch{}if(error instanceof EngineeringStorageError)throw error;throw new EngineeringStorageError("DAILY_RECORD_ATOMIC_COMMIT_FAILED","DailyRecord、Revision、Review 與 Event 無法原子寫入。",error);}finally{db.close();}
      },
      async commitDocumentWorkflow({operation,document,expectedVersion=0,revision=null,submission=null,review=null,event,attachmentIds=[]}){
        if(!["create","update"].includes(operation))throw new EngineeringStorageError("DOCUMENT_OPERATION_INVALID","不支援的文件管制原子操作。");
        const db=await openDatabase(indexedDBImpl);let tx;
        try{
          const storeNames=[STORES.engineering_documents,STORES.engineering_document_events,STORES.attachments];
          if(revision)storeNames.push(STORES.engineering_document_revisions);
          if(submission)storeNames.push(STORES.engineering_document_submissions);
          if(review)storeNames.push(STORES.engineering_document_reviews);
          tx=db.transaction([...new Set(storeNames)],"readwrite");
          const documents=tx.objectStore(STORES.engineering_documents),events=tx.objectStore(STORES.engineering_document_events),existingEvent=await requestResult(events.index("action_id").get(String(event.action_id)));
          if(existingEvent){
            if(existingEvent.document_id!==event.document_id||existingEvent.event_type!==event.event_type||existingEvent.request_fingerprint!==event.request_fingerprint)throw new EngineeringStorageError("DOCUMENT_ACTION_ID_REUSED","相同 Action ID 的原始請求內容不一致。");
            await transactionDone(tx);return clone({duplicate:true,document:await this.getData(STORES.engineering_documents,event.document_id),event:existingEvent});
          }
          const current=await requestResult(documents.get(String(document.id))),actualVersion=Number(current?.version||0);
          if(operation==="create"&&current)throw new EngineeringStorageError("DOCUMENT_ALREADY_EXISTS","工程文件已存在。");
          if(operation==="update"&&!current)throw new EngineeringStorageError("DOCUMENT_NOT_FOUND","找不到工程文件。");
          if(actualVersion!==Number(expectedVersion))throw new EngineeringStorageError("DOCUMENT_VERSION_CONFLICT","工程文件已被其他操作更新，請重新載入。");
          const projectId=String(document.project_id),workspaceId=String(document.workspace_id);
          for(const value of[current,revision,submission,review,event].filter(Boolean))if(String(value.project_id)!==projectId||String(value.workspace_id)!==workspaceId)throw new EngineeringStorageError("DOCUMENT_PROJECT_BOUNDARY_VIOLATION","文件管制資料不屬於同一專案或 Workspace。");
          const attachments=tx.objectStore(STORES.attachments);
          for(const id of [...new Set((attachmentIds||[]).map(String).filter(Boolean))]){const item=await requestResult(attachments.get(id));if(!item||String(item.project_id)!==projectId)throw new EngineeringStorageError("DOCUMENT_ATTACHMENT_INVALID","文件附件不存在或不屬於此專案。");}
          if(revision)await requestResult(tx.objectStore(STORES.engineering_document_revisions).add(clone(revision)));
          if(submission)await requestResult(tx.objectStore(STORES.engineering_document_submissions).add(clone(submission)));
          if(review)await requestResult(tx.objectStore(STORES.engineering_document_reviews).add(clone(review)));
          await requestResult(events.add(clone(event)));
          await requestResult(operation==="create"?documents.add(clone(document)):documents.put(clone(document)));
          await transactionDone(tx);return clone({duplicate:false,document,revision,submission,review,event});
        }catch(error){try{if(tx&&tx.readyState!=="done")tx.abort();}catch{}if(error instanceof EngineeringStorageError)throw error;throw new EngineeringStorageError("DOCUMENT_ATOMIC_COMMIT_FAILED","文件主檔、Revision、Submission、Review 與 Event 無法原子寫入。",error);}finally{db.close();}
      },
      async commitEntityChange({storeName,operation,record=null,entityId,projectId=null,workspaceId=null,now=()=>new Date().toISOString(),idGenerator=randomId}){
        if(!["create","update","delete","archive","reopen"].includes(operation))throw new EngineeringStorageError("SYNC_OPERATION_INVALID","不支援的本機同步操作。");
        const id=String(entityId||record?.id||"").trim();if(!id)throw new EngineeringStorageError("SYNC_ENTITY_ID_REQUIRED","同步資料必須有 stable id。");
        const db=await openDatabase(indexedDBImpl);
        try{
          const tx=db.transaction([storeName,STORES.settings,STORES.sync_outbox,STORES.sync_receipts],"readwrite"),entityStore=tx.objectStore(storeName),settings=tx.objectStore(STORES.settings),outbox=tx.objectStore(STORES.sync_outbox),receipts=tx.objectStore(STORES.sync_receipts),receiptId=`${storeName}:${id}`;
          const previous=await requestResult(receipts.get(receiptId)),workspaceSetting=await requestResult(settings.get("workspace_id")),localVersion=Number(previous?.local_version||0)+1,timestamp=now(),changeId=idGenerator(),project_id=String(projectId||record?.project_id||record?.id||"").trim()||null,workspace_id=String(workspaceId||record?.workspace_id||workspaceSetting?.value||"").trim()||null;
          if(operation==="delete")await requestResult(entityStore.delete(id));else await requestResult(operation==="create"?entityStore.add(clone(record)):entityStore.put(clone(record)));
          const item={id:changeId,entity_type:storeName,entity_id:id,project_id,workspace_id,operation,local_version:localVersion,payload:operation==="delete"?null:clone(record),created_at:timestamp,attempt_count:0,next_attempt_at:timestamp,status:"pending",last_error:null,idempotency_key:`${workspace_id||"local"}:${storeName}:${id}:${localVersion}:${operation}`};
          await requestResult(outbox.add(item));
          await requestResult(receipts.put({id:receiptId,entity_type:storeName,entity_id:id,project_id,workspace_id,local_version:localVersion,remote_version:Number(previous?.remote_version||0),deleted:operation==="delete",last_change_id:changeId,last_idempotency_key:item.idempotency_key,updated_at:timestamp}));
          await transactionDone(tx);return clone({record,change:item});
        }catch(error){if(error instanceof EngineeringStorageError)throw error;throw new EngineeringStorageError("SYNC_ATOMIC_COMMIT_FAILED","本機資料與同步佇列無法原子寫入。",error);}finally{db.close();}
      },
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
