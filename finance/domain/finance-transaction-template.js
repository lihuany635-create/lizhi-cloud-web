(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceTransactionTemplate=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const TEMPLATE_VERSION="1.0";
  const ACTIONS=Object.freeze(["create_transaction","need_more_information"]);
  const TYPES=Object.freeze(["income","expense","transfer","credit_card_purchase","credit_card_payment"]);
  const DATE_TOKENS=Object.freeze(["today","yesterday","specific","unknown"]);
  const FIELDS=Object.freeze([
    "version","action","type","amount","category","account","creditCard","fromAccount","toAccount",
    "merchant","dateToken","date","note","rawText","source","confidence"
  ]);
  const MUTABLE_FIELDS=Object.freeze(FIELDS.filter(field=>field!=="version"));
  const TEXT_FIELDS=Object.freeze(["category","account","creditCard","fromAccount","toAccount","merchant","note","rawText","source"]);
  const NORMALIZED_TEXT_FIELDS=Object.freeze(TEXT_FIELDS.filter(field=>field!=="rawText"));
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
  const text=value=>typeof value==="string"?(value.normalize("NFKC").trim()||null):null;
  const rawText=value=>typeof value==="string"?(value.trim()||null):null;

  function isCalendarDate(value){
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||"");
    if(!match)return false;
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    if(month<1||month>12||day<1)return false;
    const days=[31,(year%4===0&&year%100!==0)||year%400===0?29:28,31,30,31,30,31,31,30,31,30,31];
    return day<=days[month-1];
  }
  function enumValue(value,allowed){const normalized=text(value);return normalized&&allowed.includes(normalized)?normalized:null;}
  function amountValue(value){return typeof value==="number"&&Number.isSafeInteger(value)&&value>0?value:null;}
  function confidenceValue(value){return typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=1?value:null;}

  function createFinanceTransactionTemplate(){
    return Object.freeze({
      version:TEMPLATE_VERSION,action:null,type:null,amount:null,category:null,account:null,creditCard:null,
      fromAccount:null,toAccount:null,merchant:null,dateToken:null,date:null,note:null,rawText:null,source:null,confidence:null
    });
  }

  function sanitizeFinanceTransactionTemplate(input={}){
    const source=input&&typeof input==="object"&&!Array.isArray(input)?input:{};
    const result={...createFinanceTransactionTemplate()};
    result.action=enumValue(source.action,ACTIONS);
    result.type=enumValue(source.type,TYPES);
    result.amount=amountValue(source.amount);
    for(const field of NORMALIZED_TEXT_FIELDS)result[field]=text(source[field]);
    result.rawText=rawText(source.rawText);
    result.dateToken=enumValue(source.dateToken,DATE_TOKENS);
    const date=text(source.date);result.date=date&&isCalendarDate(date)?date:null;
    result.confidence=confidenceValue(source.confidence);
    return Object.freeze(result);
  }

  function normalizeLockedFields(lockedFields=[]){
    const values=lockedFields instanceof Set?[...lockedFields]:Array.isArray(lockedFields)?lockedFields:[];
    return Object.freeze([...new Set(values.filter(field=>MUTABLE_FIELDS.includes(field)))]);
  }

  function mergeFinanceTransactionTemplate(base={},patch={},lockedFields=[]){
    const current=sanitizeFinanceTransactionTemplate(base),incoming=sanitizeFinanceTransactionTemplate(patch);
    const locked=new Set(normalizeLockedFields(lockedFields)),result={...current};
    const source=patch&&typeof patch==="object"&&!Array.isArray(patch)?patch:{};
    for(const field of MUTABLE_FIELDS)if(own(source,field)&&!locked.has(field))result[field]=incoming[field];
    return Object.freeze(result);
  }

  function isFinanceTransactionTemplateShape(value){
    if(!value||typeof value!=="object"||Array.isArray(value))return false;
    const keys=Object.keys(value);
    if(keys.length!==FIELDS.length||FIELDS.some(field=>!own(value,field))||keys.some(field=>!FIELDS.includes(field)))return false;
    if(value.version!==TEMPLATE_VERSION)return false;
    if(value.action!==null&&!ACTIONS.includes(value.action))return false;
    if(value.type!==null&&!TYPES.includes(value.type))return false;
    if(value.amount!==null&&amountValue(value.amount)===null)return false;
    if(value.dateToken!==null&&!DATE_TOKENS.includes(value.dateToken))return false;
    if(value.date!==null&&(typeof value.date!=="string"||!isCalendarDate(value.date)))return false;
    if(TEXT_FIELDS.some(field=>value[field]!==null&&(typeof value[field]!=="string"||!value[field].trim())))return false;
    if(value.confidence!==null&&confidenceValue(value.confidence)===null)return false;
    return true;
  }

  return Object.freeze({
    TEMPLATE_VERSION,FIELDS,ACTIONS,TYPES,DATE_TOKENS,createFinanceTransactionTemplate,sanitizeFinanceTransactionTemplate,
    mergeFinanceTransactionTemplate,isFinanceTransactionTemplateShape,normalizeLockedFields
  });
});
