(function(root,factory){
  const isNode=typeof module!=="undefined"&&module.exports;
  const api=factory(
    isNode?require("./finance-domain.js"):root.FinanceDomain,
    isNode?require("./finance-transaction-template.js"):root.FinanceTransactionTemplate,
    isNode?require("./finance-entity-resolver.js"):root.FinanceEntityResolver
  );
  if(isNode)module.exports=api;
  root.FinanceDraftValidator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain,Template,EntityResolver){
  "use strict";

  const STATUS=Object.freeze({READY:"ready",NEEDS_INPUT:"needs_input",BLOCKED:"blocked"});
  const REQUIRED_REFERENCES=Object.freeze({
    income:Object.freeze(["account","category"]),
    expense:Object.freeze(["account","category"]),
    transfer:Object.freeze(["fromAccount","toAccount"]),
    credit_card_purchase:Object.freeze(["creditCard","category"]),
    credit_card_payment:Object.freeze(["account","creditCard"])
  });
  const BLOCKING_ISSUES=Object.freeze(["multiple_transactions_not_supported","amount_conflict","date_conflict","preprocessing_failed","invalid_input"]);
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
  const same=(left,right)=>Object.is(left,right);
  const issue=(code,field,message,value)=>Object.freeze({code,field:field||null,message,value:value??null});
  function pushUnique(list,item){if(!list.some(row=>row.code===item.code&&row.field===item.field))list.push(item);}
  function issueCode(value){return typeof value==="string"?value.split(":")[0]:String(value?.code||"");}

  function validateShape(input,invalidFields){
    if(!input||typeof input!=="object"||Array.isArray(input)){
      invalidFields.push(issue("invalid_draft_shape",null,"Draft 必須是單一物件"));return false;
    }
    const keys=Object.keys(input),missing=Template.FIELDS.filter(field=>!own(input,field)),extra=keys.filter(field=>!Template.FIELDS.includes(field));
    if(missing.length||extra.length||input.version!==Template.TEMPLATE_VERSION){
      invalidFields.push(issue("invalid_draft_shape",null,"Draft 不符合 Canonical Finance Draft 結構",{missing,extra,version:input.version}));return false;
    }
    return true;
  }

  function validateLockedFields(input,options,invalidFields){
    const fields=Array.isArray(options.lockedFields)?options.lockedFields:[];
    if(!fields.length)return;
    const baseline=options.lockedDraft;
    if(!baseline||typeof baseline!=="object"){
      invalidFields.push(issue("locked_baseline_missing",null,"缺少 lockedFields 比對基準"));return;
    }
    for(const field of fields){
      if(!Template.FIELDS.includes(field))continue;
      if(!same(input[field],baseline[field]))pushUnique(invalidFields,issue("locked_field_changed",field,`已鎖定欄位 ${field} 遭到改寫`,{expected:baseline[field],actual:input[field]}));
    }
  }

  function validateFinanceDraftForCommit(input,options={}){
    const references=options.references||{},missingFields=[],invalidFields=[],issues=[],warnings=[];
    const shapeValid=validateShape(input,invalidFields);
    const draft=Template.sanitizeFinanceTransactionTemplate(shapeValid?input:{});
    validateLockedFields(input,options,invalidFields);

    for(const upstream of Array.isArray(options.issues)?options.issues:[]){
      const code=issueCode(upstream),entry=typeof upstream==="object"?issue(code,upstream.field,upstream.message||code,upstream.value):issue(code,null,String(upstream));
      if(BLOCKING_ISSUES.includes(code))pushUnique(invalidFields,entry);else pushUnique(warnings,entry);
    }
    for(const warning of Array.isArray(options.warnings)?options.warnings:[]){
      const code=issueCode(warning)||"warning";
      pushUnique(warnings,typeof warning==="object"?issue(code,warning.field,warning.message||code,warning.value):issue(code,null,String(warning)));
    }

    const rawType=input?.type;
    if(rawType==null||rawType==="")missingFields.push("type");
    else if(!Domain.TRANSACTION_TYPES.includes(rawType))pushUnique(invalidFields,issue("invalid_type","type","交易類型不在允許清單",rawType));

    const rawAmount=input?.amount;
    if(rawAmount==null||rawAmount==="")missingFields.push("amount");
    else if(!Number.isSafeInteger(rawAmount)||rawAmount<=0)pushUnique(invalidFields,issue("invalid_amount","amount","金額必須是大於 0 的安全整數",rawAmount));

    const rawDate=input?.date;
    if(rawDate==null||rawDate==="")missingFields.push("date");
    else if(!Domain.isValidDate(rawDate))pushUnique(invalidFields,issue("invalid_date","date","日期必須是有效的 YYYY-MM-DD",rawDate));

    const required=REQUIRED_REFERENCES[rawType]||[],entityResult=EntityResolver.resolveFinanceEntities(input,required,references);
    for(const field of required){
      const outcome=entityResult.outcomes[field];
      if(outcome.status==="resolved")continue;
      if(outcome.status==="archived")pushUnique(invalidFields,issue("archived_reference",field,outcome.message,outcome.value));
      else{
        if(!missingFields.includes(field))missingFields.push(field);
        pushUnique(issues,issue(outcome.status==="ambiguous"?"ambiguous_reference":"missing_reference",field,outcome.message,outcome.value));
      }
    }

    const category=entityResult.resolved.category;
    if(category&&rawType==="income"&&category.type!=="income")pushUnique(invalidFields,issue("category_type_mismatch","category","收入必須使用收入分類",category.name));
    if(category&&["expense","credit_card_purchase"].includes(rawType)&&category.type!=="expense")pushUnique(invalidFields,issue("category_type_mismatch","category","支出必須使用支出分類",category.name));
    if(rawType==="transfer"&&input?.fromAccount&&input.fromAccount===input.toAccount)pushUnique(invalidFields,issue("same_transfer_account","toAccount","轉出與轉入帳戶不可相同",input.toAccount));
    if(rawType==="transfer"&&entityResult.resolved.fromAccount&&entityResult.resolved.toAccount&&entityResult.resolved.fromAccount.id===entityResult.resolved.toAccount.id)pushUnique(invalidFields,issue("same_transfer_account","toAccount","轉出與轉入帳戶不可相同",entityResult.resolved.toAccount.name));

    const used=new Set(required);
    for(const field of Object.keys(EntityResolver.FIELD_CONFIG))if(!used.has(field)&&input?.[field])pushUnique(warnings,issue("ignored_reference",field,`${field} 不適用於 ${rawType}，不會寫入`,input[field]));

    const status=invalidFields.length?STATUS.BLOCKED:missingFields.length?STATUS.NEEDS_INPUT:STATUS.READY;
    const commitEligible=status===STATUS.READY&&warnings.length===0;
    return Object.freeze({
      status,draft,resolved:entityResult.resolved,
      missingFields:Object.freeze([...new Set(missingFields)]),
      invalidFields:Object.freeze(invalidFields),issues:Object.freeze(issues),warnings:Object.freeze(warnings),commitEligible
    });
  }

  return Object.freeze({STATUS,REQUIRED_REFERENCES,BLOCKING_ISSUES,validateFinanceDraftForCommit});
});
