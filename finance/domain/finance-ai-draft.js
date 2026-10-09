(function(root,factory){
  const isNode=typeof module!=="undefined"&&module.exports;
  const api=factory(isNode?require("./finance-domain.js"):root.FinanceDomain,isNode?require("../ui-model.js"):root.FinanceUiModel,isNode?require("./finance-transaction-template.js"):root.FinanceTransactionTemplate,isNode?require("./finance-rule-engine.js"):root.FinanceRuleEngine,isNode?require("../ai/finance-small-model-parser.js"):root.FinanceSmallModelParser,isNode?require("../rule-memory/finance-rule-memory.js"):root.FinanceRuleMemory);
  if(isNode)module.exports=api;
  root.FinanceDraft=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain,UiModel,Template,RuleEngine,SmallModelParser,RuleMemory){
  "use strict";

  const VERSION=Template.TEMPLATE_VERSION;
  const DRAFT_FIELDS=Template.FIELDS;
  const REFERENCE_CONFIG=Object.freeze({
    category:{rows:"categories",resolved:"categoryId",label:"分類"},
    account:{rows:"accounts",resolved:"accountId",label:"帳戶"},
    creditCard:{rows:"creditCards",resolved:"creditCardId",label:"信用卡"},
    fromAccount:{rows:"accounts",resolved:"fromAccountId",label:"轉出帳戶"},
    toAccount:{rows:"accounts",resolved:"toAccountId",label:"轉入帳戶"}
  });
  const REQUIRED_REFERENCES=Object.freeze({
    income:["category","account"],expense:["category","account"],transfer:["fromAccount","toAccount"],
    credit_card_purchase:["category","creditCard"],credit_card_payment:["account","creditCard"]
  });
  const TYPE_ALIASES=new Map([
    ["income","income"],["收入","income"],
    ["expense","expense"],["支出","expense"],
    ["transfer","transfer"],["轉帳","transfer"],["转账","transfer"],
    ["credit_card_purchase","credit_card_purchase"],["credit-card-purchase","credit_card_purchase"],["credit-card purchase","credit_card_purchase"],["credit card purchase","credit_card_purchase"],["信用卡消費","credit_card_purchase"],["信用卡消费","credit_card_purchase"],["刷卡","credit_card_purchase"],
    ["credit_card_payment","credit_card_payment"],["credit-card-payment","credit_card_payment"],["credit-card payment","credit_card_payment"],["credit card payment","credit_card_payment"],["信用卡繳款","credit_card_payment"],["信用卡缴款","credit_card_payment"],["繳卡費","credit_card_payment"],["缴卡费","credit_card_payment"]
  ]);
  const error=(code,field,message)=>({code,field,message});
  const text=value=>typeof value==="string"?value.normalize("NFKC").trim():value==null?null:String(value).normalize("NFKC").trim();
  const matchKey=value=>(text(value)||"").toLocaleLowerCase("zh-TW");
  const normalizedType=value=>TYPE_ALIASES.get(matchKey(value))||matchKey(value)||null;
  function normalizedAmount(value){
    if(typeof value==="number")return Number.isFinite(value)?value:null;
    const valueText=text(value);if(!valueText||!/^\d+(?:\.0+)?$/.test(valueText))return null;
    const number=Number(valueText);return Number.isFinite(number)?number:null;
  }
  function normalizedConfidence(value){if(value==null||value==="")return null;const number=Number(value);return Number.isFinite(number)?number:null;}

  function normalizeFinanceDraft(input={}){
    const source=input&&typeof input==="object"&&!Array.isArray(input)?input:{};
    return Template.sanitizeFinanceTransactionTemplate({
      ...source,
      version:VERSION,
      type:normalizedType(source.type),
      amount:normalizedAmount(source.amount),
      date:text(source.date),
      category:text(source.category),
      account:text(source.account),
      creditCard:text(source.creditCard),
      fromAccount:text(source.fromAccount),
      toAccount:text(source.toAccount),
      note:text(source.note),
      source:text(source.source),
      confidence:normalizedConfidence(source.confidence)
    });
  }

  function transactionCandidate(draft,resolved={}){
    const base={type:draft.type,amount:draft.amount,date:draft.date,note:draft.note||""};
    if(draft.type==="income"||draft.type==="expense")return {...base,accountId:resolved.accountId||draft.account,categoryId:resolved.categoryId||draft.category};
    if(draft.type==="transfer")return {...base,fromAccountId:resolved.fromAccountId||draft.fromAccount,toAccountId:resolved.toAccountId||draft.toAccount};
    if(draft.type==="credit_card_purchase")return {...base,creditCardId:resolved.creditCardId||draft.creditCard,categoryId:resolved.categoryId||draft.category};
    if(draft.type==="credit_card_payment")return {...base,accountId:resolved.accountId||draft.account,creditCardId:resolved.creditCardId||draft.creditCard};
    return base;
  }

  function validateFinanceDraft(input){
    const draft=normalizeFinanceDraft(input),errors=[];
    if(input?.version!==undefined&&!([1,"1","1.0"].includes(input.version)))errors.push(error("UNSUPPORTED_DRAFT_VERSION","version",`Draft version 必須是 ${VERSION}`));
    if(!Template.isFinanceTransactionTemplateShape(draft))errors.push(error("INVALID_DRAFT_SHAPE",null,"Draft 不符合 Canonical Finance Draft 結構"));
    if(!Domain.TRANSACTION_TYPES.includes(draft.type))errors.push(error("UNKNOWN_TRANSACTION_TYPE","type","請指定支援的交易類型"));
    if(draft.confidence!==null&&(draft.confidence<0||draft.confidence>1))errors.push(error("INVALID_CONFIDENCE","confidence","confidence 必須是 0 到 1 或 null"));
    if((draft.note||"").length>200)errors.push(error("INVALID_NOTE","note","備註不可超過 200 字"));
    const domainResult=Domain.validateTransaction(transactionCandidate(draft));
    for(const item of domainResult.errors){
      if(item.code==="UNKNOWN_TRANSACTION_TYPE"&&errors.some(row=>row.code===item.code))continue;
      const field={accountId:"account",categoryId:"category",creditCardId:"creditCard",fromAccountId:"fromAccount",toAccountId:"toAccount"}[item.field]||item.field;
      errors.push({...item,field});
    }
    return {valid:errors.length===0,draft,errors};
  }

  function resolveOne(field,value,references,preferredId=null){
    const config=REFERENCE_CONFIG[field],rows=Array.isArray(references?.[config.rows])?references[config.rows]:[],key=matchKey(value);
    if(preferredId!=null){const preferred=rows.find(row=>String(row?.id||"")===String(preferredId));if(preferred&&preferred.archived!==true&&preferred.active!==false)return {status:"resolved",id:preferred.id};if(preferred)return {status:"unresolved",item:{field,value,reason:"archived",message:`${config.label}已封存，請手動選擇可用項目`}};return {status:"unresolved",item:{field,value,reason:"not_found",message:`找不到對應${config.label}，請手動選擇`}};}
    if(!key)return {status:"unresolved",item:{field,value:value??null,reason:"missing",message:`${config.label}不可為空`}};
    const exact=rows.filter(row=>matchKey(row?.name)===key),active=exact.filter(row=>row.archived!==true);
    if(active.length===1)return {status:"resolved",id:active[0].id};
    if(active.length>1)return {status:"ambiguous",item:{field,value,candidateIds:active.map(row=>row.id),candidates:active.map(row=>row.name),message:`找到多筆同名${config.label}，請手動選擇`}};
    if(exact.length)return {status:"unresolved",item:{field,value,reason:"archived",message:`${config.label}已封存，請手動選擇可用項目`}};
    return {status:"unresolved",item:{field,value,reason:"not_found",message:`找不到對應${config.label}，請手動選擇`}};
  }

  function resolveFinanceDraftReferences(input,references={},options={}){
    const validation=validateFinanceDraft(input),draft=validation.draft,resolved={},unresolved=[],ambiguous=[],warnings=[],errors=[...validation.errors];
    const fields=REQUIRED_REFERENCES[draft.type]||[];
    for(const field of fields){
      const outcome=resolveOne(field,draft[field],references,options.preferredEntityIds?.[field]);
      if(outcome.status==="resolved")resolved[REFERENCE_CONFIG[field].resolved]=outcome.id;
      else if(outcome.status==="ambiguous")ambiguous.push(outcome.item);
      else unresolved.push(outcome.item);
    }
    for(const field of Object.keys(REFERENCE_CONFIG))if(!fields.includes(field)&&draft[field])warnings.push({code:"IGNORED_REFERENCE",field,value:draft[field],message:`${field} 不適用於 ${draft.type}，不會填入表單`});
    if(!validation.errors.length&&!unresolved.length&&!ambiguous.length){
      const formValue=transactionCandidate(draft,resolved),domainResult=UiModel.validateTransactionDraft(formValue,references);
      if(!domainResult.valid)for(const [field,message] of Object.entries(domainResult.errors))errors.push(error("INVALID_TRANSACTION",field,message));
    }
    return Object.freeze({valid:errors.length===0&&unresolved.length===0&&ambiguous.length===0,draft,resolved:Object.freeze(resolved),unresolved:Object.freeze(unresolved),ambiguous:Object.freeze(ambiguous),warnings:Object.freeze(warnings),errors:Object.freeze(errors)});
  }

  function applyFinanceDraftToForm(result){
    if(!result||result.valid!==true)throw new TypeError("只有完整解析且有效的 Draft 才能套用到表單");
    const formValue=transactionCandidate(result.draft,result.resolved),parsed=UiModel.validateTransactionDraft(formValue,{accounts:null,categories:null,creditCards:null});
    if(!parsed.value||!Domain.TRANSACTION_TYPES.includes(parsed.value.type))throw new TypeError("Draft 無法轉成交易表單資料");
    return Object.freeze({...parsed.value,amount:String(parsed.value.amount)});
  }

  async function generateConstrainedFinanceDraft(input,references={},settings={},options={}){
    if(!RuleEngine||!SmallModelParser)throw new Error("Finance Phase 2/3 modules are unavailable.");
    const deterministic=RuleEngine.parseFinanceRulesToDraft(input,{...references,currentDate:options.currentDate});
    const ruleResult=RuleMemory&&Array.isArray(options.memoryRules)?RuleMemory.applyRuleMemory({draft:deterministic.draft,ruleResult:deterministic,rules:options.memoryRules,references,rawText:input}):deterministic;
    return SmallModelParser.parseFinanceWithSmallModel({rawText:input,draft:ruleResult.draft,ruleResult,references,settings,signal:options.signal,connector:options.connector,onStatus:options.onStatus});
  }

  return Object.freeze({VERSION,DRAFT_FIELDS,TRANSACTION_TYPES:Domain.TRANSACTION_TYPES,normalizeFinanceDraft,validateFinanceDraft,resolveFinanceDraftReferences,applyFinanceDraftToForm,generateConstrainedFinanceDraft});
});
