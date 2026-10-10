(function(root,factory){
  const isNode=typeof module!=="undefined"&&module.exports;
  const api=factory(isNode?require("../domain/finance-domain.js"):root.FinanceDomain,isNode?require("../domain/backup.js"):root.FinanceBackup);
  if(isNode)module.exports=api;
  root.FinanceStorage=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain,Backup){
  "use strict";

  const DB_NAME="lizhi-finance",DB_VERSION=1;
  const STORE_NAMES=Object.freeze(["accounts","creditCards","categories","transactions","settings","backgrounds"]);
  const SYNC_STORE_NAMES=Object.freeze(["accounts","creditCards","categories","transactions"]);
  const DEFAULT_CATEGORIES=Object.freeze([
    {id:"system-salary",name:"薪資",type:"income",icon:"薪",system:true},
    {id:"system-other-income",name:"其他收入",type:"income",icon:"收",system:true},
    {id:"system-food",name:"餐飲",type:"expense",icon:"食",system:true},
    {id:"system-transport",name:"交通",type:"expense",icon:"行",system:true},
    {id:"system-daily",name:"日常",type:"expense",icon:"日",system:true}
  ]);

  class FinanceStorageError extends Error{
    constructor(code,message,details={},cause){super(message,{cause});this.name="FinanceStorageError";this.code=code;this.details=details;}
  }
  const now=()=>new Date().toISOString();
  const id=()=>globalThis.crypto?.randomUUID?.()||`finance-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const transactionDone=transaction=>new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error||new Error("IndexedDB transaction aborted"));transaction.onerror=()=>{};});

  function createIndex(store,name,keyPath,options={}){if(!store.indexNames.contains(name))store.createIndex(name,keyPath,options);}
  function migrateFinanceDb(event){
    const db=event.target.result,transaction=event.target.transaction;
    if(event.oldVersion<1){
      const accounts=db.createObjectStore("accounts",{keyPath:"id"});createIndex(accounts,"type","type");createIndex(accounts,"archived","archived");
      const cards=db.createObjectStore("creditCards",{keyPath:"id"});createIndex(cards,"archived","archived");
      const categories=db.createObjectStore("categories",{keyPath:"id"});createIndex(categories,"type","type");createIndex(categories,"archived","archived");
      const transactions=db.createObjectStore("transactions",{keyPath:"id"});
      for(const field of ["date","type","accountId","creditCardId","categoryId","createdAt","fromAccountId","toAccountId"])createIndex(transactions,field,field);
      db.createObjectStore("settings",{keyPath:"key"});
      const backgrounds=db.createObjectStore("backgrounds",{keyPath:"id"});createIndex(backgrounds,"active","active");
      const stamp=now();
      for(const category of DEFAULT_CATEGORIES)transaction.objectStore("categories").add({...category,archived:false,createdAt:stamp,updatedAt:stamp});
      for(const setting of [{key:"baseCurrency",value:"TWD"},{key:"firstDayOfWeek",value:1},{key:"locale",value:"zh-TW"}])transaction.objectStore("settings").add({...setting,updatedAt:stamp});
    }
  }

  function openFinanceDb(){
    if(typeof indexedDB==="undefined")return Promise.reject(new FinanceStorageError("DATABASE_UNAVAILABLE","此環境不支援 IndexedDB"));
    return new Promise((resolve,reject)=>{
      let request;
      try{request=indexedDB.open(DB_NAME,DB_VERSION);}catch(cause){reject(new FinanceStorageError("DATABASE_OPEN_FAILED","無法開啟理財資料庫",{},cause));return;}
      request.onupgradeneeded=migrateFinanceDb;
      request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
      request.onerror=()=>reject(new FinanceStorageError("DATABASE_OPEN_FAILED","無法開啟理財資料庫",{},request.error));
      request.onblocked=()=>reject(new FinanceStorageError("DATABASE_BLOCKED","理財資料庫升級被其他分頁阻擋"));
    });
  }

  function translateError(error,context={}){
    if(error instanceof FinanceStorageError)return error;
    if(error?.name==="ConstraintError")return new FinanceStorageError("DUPLICATE_ID",`識別值已存在：${context.id||""}`,context,error);
    return new FinanceStorageError("DATABASE_OPERATION_FAILED",error?.message||"資料庫操作失敗",context,error);
  }
  async function withStore(storeName,mode,operation){
    const db=await openFinanceDb();
    try{const tx=db.transaction(storeName,mode),result=await operation(tx.objectStore(storeName),tx);await transactionDone(tx);return result;}
    catch(error){throw translateError(error,{store:storeName});}finally{db.close();}
  }
  const getRecord=(store,key)=>requestResult(store.get(key));
  async function listStore(storeName,options={}){
    return withStore(storeName,"readonly",async store=>{
      const rows=options.index&&options.value!==undefined?await requestResult(store.index(options.index).getAll(options.value)):await requestResult(store.getAll());
      return options.includeDeleted?rows:rows.filter(row=>!row.deletedAt);
    });
  }
  async function getFrom(storeName,key){return withStore(storeName,"readonly",store=>getRecord(store,key));}
  async function addTo(storeName,record){return withStore(storeName,"readwrite",async store=>{await requestResult(store.add(record));return record;}).catch(error=>{throw translateError(error,{store:storeName,id:record.id||record.key});});}
  async function putTo(storeName,record){return withStore(storeName,"readwrite",async store=>{await requestResult(store.put(record));return record;});}
  async function removeFrom(storeName,key){return withStore(storeName,"readwrite",store=>requestResult(store.delete(key)));}

  function requireText(value,field){if(typeof value!=="string"||!value.trim())throw new FinanceStorageError("VALIDATION_FAILED",`${field} 不可為空`,{field});}
  function requireInteger(value,field,{min=Number.MIN_SAFE_INTEGER,max=Number.MAX_SAFE_INTEGER}={}){if(!Number.isSafeInteger(value)||value<min||value>max)throw new FinanceStorageError("VALIDATION_FAILED",`${field} 必須是 ${min} 到 ${max} 的整數`,{field});}
  function entityRepository(storeName,normalize){
    return Object.freeze({
      create:input=>{const stamp=now(),record=normalize({...input,id:input.id||id(),createdAt:input.createdAt||stamp,updatedAt:stamp},false);return addTo(storeName,record);},
      get:key=>getFrom(storeName,key),
      list:options=>listStore(storeName,options),
      update:async(key,changes)=>{const current=await getFrom(storeName,key);if(!current)throw new FinanceStorageError("NOT_FOUND",`找不到 ${storeName}：${key}`,{store:storeName,id:key});const record=normalize({...current,...changes,id:key,createdAt:current.createdAt,updatedAt:now()},true);return putTo(storeName,record);},
      archive:async key=>{const current=await getFrom(storeName,key);if(!current)throw new FinanceStorageError("NOT_FOUND",`找不到 ${storeName}：${key}`,{store:storeName,id:key});return putTo(storeName,{...current,archived:true,updatedAt:now()});}
    });
  }
  function normalizeAccount(row){requireText(row.name,"name");if(!Domain.ACCOUNT_TYPES.includes(row.type))throw new FinanceStorageError("VALIDATION_FAILED","未知帳戶類型",{field:"type"});requireInteger(row.initialBalance,"initialBalance",{min:0});if(row.last4&&!/^\d{4}$/.test(row.last4))throw new FinanceStorageError("VALIDATION_FAILED","last4 必須是四位數字",{field:"last4"});return {...row,currency:row.currency||"TWD",includeInAssets:row.includeInAssets!==false,archived:row.archived===true};}
  function normalizeCard(row){requireText(row.name,"name");requireInteger(row.creditLimit??0,"creditLimit",{min:0});requireInteger(row.closingDay,"closingDay",{min:1,max:31});requireInteger(row.dueDay,"dueDay",{min:1,max:31});if(row.last4&&!/^\d{4}$/.test(row.last4))throw new FinanceStorageError("VALIDATION_FAILED","last4 必須是四位數字",{field:"last4"});return {...row,bankName:String(row.bankName||"").trim(),last4:String(row.last4||"").trim(),creditLimit:row.creditLimit??0,linkedPaymentAccountId:row.linkedPaymentAccountId||"",archived:row.archived===true};}
  function normalizeCategory(row){requireText(row.name,"name");if(!Domain.CATEGORY_TYPES.includes(row.type))throw new FinanceStorageError("VALIDATION_FAILED","未知分類類型",{field:"type"});return {...row,name:row.name.trim(),system:row.system===true,archived:row.archived===true};}
  function normalizeBackground(row){requireText(row.name,"name");if(row.imageBlob!==undefined&&typeof Blob!=="undefined"&&!(row.imageBlob instanceof Blob))throw new FinanceStorageError("VALIDATION_FAILED","imageBlob 必須是 Blob",{field:"imageBlob"});if(row.imageBlob&&row.imageBlob.size>10*1024*1024)throw new FinanceStorageError("VALIDATION_FAILED","背景圖片不可超過 10 MB",{field:"imageBlob"});if(row.imageBlob&&!['image/png','image/jpeg','image/webp'].includes(row.imageBlob.type))throw new FinanceStorageError("VALIDATION_FAILED","背景只支援 PNG、JPG、JPEG 或 WEBP",{field:"imageBlob"});return {...row,source:"user",active:row.active===true};}

  const accounts=entityRepository("accounts",normalizeAccount);
  const baseCreditCards=entityRepository("creditCards",normalizeCard);
  const creditCards=Object.freeze({...baseCreditCards,create:async input=>{if(input.linkedPaymentAccountId&&!await getFrom("accounts",input.linkedPaymentAccountId))throw new FinanceStorageError("INVALID_ACCOUNT_REFERENCE","找不到信用卡付款帳戶",{field:"linkedPaymentAccountId"});return baseCreditCards.create(input);},update:async(key,changes)=>{if(changes.linkedPaymentAccountId&&!await getFrom("accounts",changes.linkedPaymentAccountId))throw new FinanceStorageError("INVALID_ACCOUNT_REFERENCE","找不到信用卡付款帳戶",{field:"linkedPaymentAccountId"});return baseCreditCards.update(key,changes);}});
  const categories=entityRepository("categories",normalizeCategory);
  const baseBackgrounds=entityRepository("backgrounds",normalizeBackground);
  async function setActiveBackground(key=null){
    const db=await openFinanceDb();
    try{const tx=db.transaction("backgrounds","readwrite"),store=tx.objectStore("backgrounds"),rows=await requestResult(store.getAll());if(key&&!rows.some(row=>row.id===key))throw new FinanceStorageError("NOT_FOUND",`找不到 backgrounds：${key}`,{id:key});for(const row of rows)await requestResult(store.put({...row,active:key===row.id,updatedAt:now()}));await transactionDone(tx);return key?rows.find(row=>row.id===key):null;}catch(error){throw translateError(error,{store:"backgrounds",id:key});}finally{db.close();}
  }
  async function deleteBackground(key){
    const db=await openFinanceDb();
    try{const tx=db.transaction("backgrounds","readwrite"),store=tx.objectStore("backgrounds"),row=await getRecord(store,key);if(!row)throw new FinanceStorageError("NOT_FOUND",`找不到 backgrounds：${key}`,{id:key});await requestResult(store.delete(key));await transactionDone(tx);return {id:key,wasActive:row.active===true};}catch(error){throw translateError(error,{store:"backgrounds",id:key});}finally{db.close();}
  }
  const backgrounds=Object.freeze({...baseBackgrounds,setActive:setActiveBackground,clearActive:()=>setActiveBackground(null),delete:deleteBackground});

  async function saveTransaction(input,existingId=null,{upsert=false,preserveTimestamps=false}={}){
    const db=await openFinanceDb();
    try{
      const tx=db.transaction(["transactions","accounts","creditCards","categories"],"readwrite"),store=tx.objectStore("transactions");
      const current=existingId?await getRecord(store,existingId):null;
      if(existingId&&!current&&!upsert)throw new FinanceStorageError("NOT_FOUND",`找不到 transactions：${existingId}`,{id:existingId});
      const stamp=now(),record={...(current||{}),...input,id:existingId||input.id||id(),createdAt:current?.createdAt||input.createdAt||stamp,updatedAt:preserveTimestamps?(input.updatedAt||current?.updatedAt||stamp):stamp};
      if(record.deletedAt){await requestResult(store.put(record));await transactionDone(tx);return record;}
      const allowed={income:["accountId","categoryId"],expense:["accountId","categoryId"],transfer:["fromAccountId","toAccountId"],credit_card_purchase:["creditCardId","categoryId"],credit_card_payment:["fromAccountId","accountId","creditCardId"]}[record.type]||[];
      for(const field of ["accountId","categoryId","fromAccountId","toAccountId","creditCardId"])if(!allowed.includes(field))delete record[field];
      const accountIds=[record.accountId,record.fromAccountId,record.toAccountId].filter(Boolean);
      const accountRows=await Promise.all(accountIds.map(key=>getRecord(tx.objectStore("accounts"),key)));
      const cardRow=record.creditCardId?await getRecord(tx.objectStore("creditCards"),record.creditCardId):null;
      const categoryRow=record.categoryId?await getRecord(tx.objectStore("categories"),record.categoryId):null;
      const result=Domain.validateTransaction(record,{accounts:accountRows.filter(Boolean),creditCards:cardRow?[cardRow]:[],categories:categoryRow?[categoryRow]:[]});
      if(!result.valid)throw new FinanceStorageError(result.errors[0].code,result.errors[0].message,{errors:result.errors});
      for(const field of ["accountId","fromAccountId","toAccountId"]){const row=record[field]?accountRows[accountIds.indexOf(record[field])]:null;if(row?.archived&&(!current||current[field]!==record[field]))throw new FinanceStorageError("ARCHIVED_REFERENCE","已封存帳戶不可用於新交易",{field});}
      if(cardRow?.archived&&(!current||current.creditCardId!==record.creditCardId))throw new FinanceStorageError("ARCHIVED_REFERENCE","已封存信用卡不可用於新交易",{field:"creditCardId"});
      if(categoryRow?.archived&&(!current||current.categoryId!==record.categoryId))throw new FinanceStorageError("ARCHIVED_REFERENCE","已封存分類不可用於新交易",{field:"categoryId"});
      if(record.type==="income"&&categoryRow?.type!=="income")throw new FinanceStorageError("INVALID_CATEGORY_REFERENCE","收入必須使用收入分類",{categoryId:record.categoryId});
      if(["expense","credit_card_purchase"].includes(record.type)&&categoryRow?.type!=="expense")throw new FinanceStorageError("INVALID_CATEGORY_REFERENCE","支出必須使用支出分類",{categoryId:record.categoryId});
      await requestResult(existingId||upsert?store.put(record):store.add(record));await transactionDone(tx);return record;
    }catch(error){throw translateError(error,{store:"transactions",id:existingId||input.id});}finally{db.close();}
  }
  async function tombstoneTransaction(key){const current=await getFrom("transactions",key);if(!current)throw new FinanceStorageError("NOT_FOUND",`找不到 transactions：${key}`,{id:key});const stamp=now();return putTo("transactions",{...current,deletedAt:stamp,updatedAt:stamp});}
  const transactions=Object.freeze({create:input=>saveTransaction(input),get:key=>getFrom("transactions",key),list:options=>listStore("transactions",options),update:(key,changes)=>saveTransaction(changes,key),delete:tombstoneTransaction});
  const settings=Object.freeze({get:key=>getFrom("settings",key),list:()=>listStore("settings"),set:(key,value)=>{requireText(key,"key");return putTo("settings",{key,value,updatedAt:now()});}});

  function syncStoreName(kind){if(!SYNC_STORE_NAMES.includes(kind))throw new FinanceStorageError("INVALID_SYNC_KIND","不支援的 Finance sync 類型",{kind});return kind;}
  async function putSynced(kind,input){
    const storeName=syncStoreName(kind),record={...input};requireText(record.id,"id");
    if(storeName==="transactions")return saveTransaction(record,record.id,{upsert:true,preserveTimestamps:true});
    const normalized=storeName==="accounts"?normalizeAccount(record):storeName==="creditCards"?normalizeCard(record):normalizeCategory(record);
    return putTo(storeName,normalized);
  }
  async function transactionReferencesPresent(record){
    if(record.deletedAt)return true;
    const required={income:[["accounts",record.accountId],["categories",record.categoryId]],expense:[["accounts",record.accountId],["categories",record.categoryId]],transfer:[["accounts",record.fromAccountId],["accounts",record.toAccountId]],credit_card_purchase:[["creditCards",record.creditCardId],["categories",record.categoryId]],credit_card_payment:[["accounts",record.fromAccountId||record.accountId],["creditCards",record.creditCardId]]}[record.type]||[];
    const rows=await Promise.all(required.map(([store,key])=>key?getFrom(store,key):null));return rows.length===required.length&&rows.every(row=>row&&!row.deletedAt);
  }
  const sync=Object.freeze({kinds:SYNC_STORE_NAMES,list:kind=>listStore(syncStoreName(kind),{includeDeleted:true}),get:(kind,key)=>getFrom(syncStoreName(kind),key),put:putSynced,referencesPresent:transactionReferencesPresent});

  async function exportBackup(exportedAt){
    if(!Backup)throw new FinanceStorageError("BACKUP_UNAVAILABLE","FinanceBackup 尚未載入");
    const db=await openFinanceDb();
    try{const tx=db.transaction(STORE_NAMES,"readonly"),rows={};await Promise.all(STORE_NAMES.map(async name=>{rows[name]=await requestResult(tx.objectStore(name).getAll());}));await transactionDone(tx);return Backup.createBackupEnvelope(rows,exportedAt);}catch(error){throw translateError(error,{operation:"exportBackup"});}finally{db.close();}
  }
  return Object.freeze({DB_NAME,DB_VERSION,STORE_NAMES,SYNC_STORE_NAMES,DEFAULT_CATEGORIES,FinanceStorageError,migrateFinanceDb,openFinanceDb,accounts,creditCards,categories,transactions,settings,backgrounds,sync,exportBackup});
});
