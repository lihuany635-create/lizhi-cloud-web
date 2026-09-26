(function(root,factory){
  const api=factory(typeof module!=="undefined"&&module.exports?require("./finance-domain.js"):root.FinanceDomain);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceBackup=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain){
  "use strict";

  const FORMAT="lizhi-finance-backup",SCHEMA_VERSION=1;
  const COLLECTIONS=Object.freeze(["accounts","creditCards","categories","transactions","settings","backgrounds"]);
  const isObject=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
  const isText=value=>typeof value==="string"&&value.trim().length>0;
  const isTimestamp=value=>typeof value==="string"&&!Number.isNaN(Date.parse(value));
  const isBoolean=value=>typeof value==="boolean";
  const clone=value=>typeof structuredClone==="function"?structuredClone(value):JSON.parse(JSON.stringify(value));
  const entityError=(collection,index,field,message)=>({code:"INVALID_ENTITY",collection,index,field,message});

  function validateEntity(name,row,index,errors){
    if(!isObject(row)){errors.push(entityError(name,index,null,`${name}[${index}] 必須是物件`));return;}
    const requiredTimestamp=field=>{if(!isTimestamp(row[field]))errors.push(entityError(name,index,field,`${field} 必須是有效 timestamp`));};
    if(name==="accounts"){
      if(!isText(row.name))errors.push(entityError(name,index,"name","帳戶名稱不可為空"));
      if(!Domain.ACCOUNT_TYPES.includes(row.type))errors.push(entityError(name,index,"type","帳戶類型無效"));
      if(!Number.isSafeInteger(row.initialBalance)||row.initialBalance<0)errors.push(entityError(name,index,"initialBalance","初始餘額必須是 0 或正整數"));
      if(!isText(row.currency))errors.push(entityError(name,index,"currency","幣別不可為空"));
      if(!isBoolean(row.includeInAssets)||!isBoolean(row.archived))errors.push(entityError(name,index,"flags","帳戶旗標必須是 boolean"));
      if(row.last4!==undefined&&row.last4!==""&&!/^\d{4}$/.test(row.last4))errors.push(entityError(name,index,"last4","帳號末四碼格式錯誤"));
      requiredTimestamp("createdAt");requiredTimestamp("updatedAt");
    }else if(name==="creditCards"){
      if(!isText(row.name))errors.push(entityError(name,index,"name","信用卡名稱不可為空"));
      if(!Number.isSafeInteger(row.creditLimit)||row.creditLimit<0)errors.push(entityError(name,index,"creditLimit","信用額度必須是 0 或正整數"));
      for(const field of ["closingDay","dueDay"])if(!Number.isSafeInteger(row[field])||row[field]<1||row[field]>31)errors.push(entityError(name,index,field,`${field} 必須是 1 到 31`));
      if(!isBoolean(row.archived))errors.push(entityError(name,index,"archived","archived 必須是 boolean"));
      if(row.last4!==undefined&&row.last4!==""&&!/^\d{4}$/.test(row.last4))errors.push(entityError(name,index,"last4","卡號末四碼格式錯誤"));
      requiredTimestamp("createdAt");requiredTimestamp("updatedAt");
    }else if(name==="categories"){
      if(!isText(row.name))errors.push(entityError(name,index,"name","分類名稱不可為空"));
      if(!Domain.CATEGORY_TYPES.includes(row.type))errors.push(entityError(name,index,"type","分類類型無效"));
      if(!isBoolean(row.system)||!isBoolean(row.archived))errors.push(entityError(name,index,"flags","分類旗標必須是 boolean"));
      requiredTimestamp("createdAt");requiredTimestamp("updatedAt");
    }else if(name==="settings"){
      if(!isText(row.key)||!("value" in row))errors.push(entityError(name,index,"key","設定必須包含 key 與 value"));
      if(row.key==="baseCurrency"&&!isText(row.value))errors.push(entityError(name,index,"value","baseCurrency 必須是字串"));
      if(row.key==="firstDayOfWeek"&&(!Number.isInteger(row.value)||row.value<0||row.value>6))errors.push(entityError(name,index,"value","firstDayOfWeek 必須是 0 到 6"));
      if(row.key==="locale"&&!isText(row.value))errors.push(entityError(name,index,"value","locale 必須是字串"));
      requiredTimestamp("updatedAt");
    }else if(name==="backgrounds"){
      if(!isText(row.name))errors.push(entityError(name,index,"name","背景名稱不可為空"));
      if(row.mimeType!==undefined&&!isText(row.mimeType))errors.push(entityError(name,index,"mimeType","mimeType 必須是字串"));
      for(const field of ["brightness","blur","overlay"])if(row[field]!==undefined&&(typeof row[field]!=="number"||!Number.isFinite(row[field])))errors.push(entityError(name,index,field,`${field} 必須是有限數字`));
      if(row.active!==undefined&&!isBoolean(row.active))errors.push(entityError(name,index,"active","active 必須是 boolean"));
      requiredTimestamp("createdAt");
    }
  }

  function backgroundMetadata(row){
    const copy={...row};
    if("imageBlob" in copy){delete copy.imageBlob;copy.blobExcluded=true;}
    return copy;
  }

  function createBackupEnvelope(data,exportedAt=new Date().toISOString()){
    if(Number.isNaN(Date.parse(exportedAt)))throw new TypeError("exportedAt 必須是有效 timestamp");
    const normalized={};
    for(const name of COLLECTIONS){
      if(!Array.isArray(data?.[name]))throw new TypeError(`${name} 必須是陣列`);
      normalized[name]=name==="backgrounds"?data[name].map(backgroundMetadata):clone(data[name]);
    }
    return {format:FORMAT,schemaVersion:SCHEMA_VERSION,exportedAt,data:normalized};
  }

  function validateBackupEnvelope(envelope){
    const errors=[],warnings=[];
    if(!isObject(envelope))return {valid:false,errors:[{code:"INVALID_BACKUP",message:"備份必須是物件"}],warnings};
    if(envelope.format!==FORMAT)errors.push({code:"INVALID_BACKUP_FORMAT",message:`format 必須是 ${FORMAT}`});
    if(envelope.schemaVersion!==SCHEMA_VERSION)errors.push({code:"UNSUPPORTED_BACKUP_VERSION",message:`不支援 schemaVersion：${envelope.schemaVersion}`});
    if(typeof envelope.exportedAt!=="string"||Number.isNaN(Date.parse(envelope.exportedAt)))errors.push({code:"INVALID_EXPORTED_AT",message:"exportedAt 必須是有效 timestamp"});
    if(!isObject(envelope.data))errors.push({code:"INVALID_BACKUP_DATA",message:"data 必須是物件"});
    const ids={};
    for(const name of COLLECTIONS){
      const rows=envelope.data?.[name];
      if(!Array.isArray(rows)){errors.push({code:"INVALID_COLLECTION",collection:name,message:`${name} 必須是陣列`});continue;}
      ids[name]=new Set();
      rows.forEach((row,index)=>{
        validateEntity(name,row,index,errors);
        const key=name==="settings"?row?.key:row?.id;
        if(typeof key!=="string"||!key.trim())errors.push({code:"INVALID_RECORD_ID",collection:name,index,message:`${name}[${index}] 缺少有效識別值`});
        else if(ids[name].has(key))errors.push({code:"DUPLICATE_ID",collection:name,index,message:`${name} 含重複識別值：${key}`});
        else ids[name].add(key);
        if(name==="backgrounds"&&row?.imageBlob)warnings.push({code:"BACKGROUND_BLOB_PRESENT",collection:name,index,message:"背景 Blob 不建議放入 JSON 備份"});
      });
    }
    if(ids.creditCards&&ids.accounts){
      for(const [index,card] of (envelope.data.creditCards||[]).entries())if(card.linkedPaymentAccountId&&!ids.accounts.has(card.linkedPaymentAccountId))errors.push({code:"INVALID_ACCOUNT_REFERENCE",collection:"creditCards",index,field:"linkedPaymentAccountId",message:"找不到信用卡付款帳戶"});
    }
    if(ids.transactions){
      for(const [index,tx] of (envelope.data.transactions||[]).entries()){
        const result=Domain.validateTransaction(tx,{accounts:ids.accounts,creditCards:ids.creditCards,categories:ids.categories});
        result.errors.forEach(item=>errors.push({...item,collection:"transactions",index}));
        const category=(envelope.data.categories||[]).find(row=>row.id===tx.categoryId);
        if(tx.type==="income"&&category&&category.type!=="income")errors.push({code:"INVALID_CATEGORY_REFERENCE",collection:"transactions",index,field:"categoryId",message:"收入必須使用收入分類"});
        if(["expense","credit_card_purchase"].includes(tx.type)&&category&&category.type!=="expense")errors.push({code:"INVALID_CATEGORY_REFERENCE",collection:"transactions",index,field:"categoryId",message:"支出必須使用支出分類"});
      }
    }
    return {valid:errors.length===0,errors,warnings};
  }

  function createImportPreview(input){
    let envelope=input;
    if(typeof input==="string"){
      try{envelope=JSON.parse(input);}catch(error){return {valid:false,errors:[{code:"INVALID_JSON",message:"備份不是有效 JSON"}],warnings:[],counts:{},envelope:null};}
    }
    const validation=validateBackupEnvelope(envelope),counts={};
    for(const name of COLLECTIONS)counts[name]=Array.isArray(envelope?.data?.[name])?envelope.data[name].length:0;
    return {...validation,counts,envelope:validation.valid?clone(envelope):null,requiresConfirmation:true,willWrite:false};
  }

  return Object.freeze({FORMAT,SCHEMA_VERSION,COLLECTIONS,createBackupEnvelope,validateBackupEnvelope,createImportPreview});
});
