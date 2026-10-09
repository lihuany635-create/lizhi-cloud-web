(function(root,factory){
  "use strict";
  const api=factory(typeof module==="object"&&module.exports?require("../domain/finance-transaction-template.js"):root.FinanceTransactionTemplate);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceRuleMemory=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Template){
  "use strict";
  const VERSION=1,MATCH_KINDS=Object.freeze(["merchant","keyword","phrase"]),TARGET_FIELDS=Object.freeze(["category","account","creditCard","merchant"]),ENTITY_FIELDS=Object.freeze(["category","account","creditCard"]),SAFE_KEYS=Object.freeze(["id","version","matchKind","matchValue","normalizedMatch","scopeType","targetField","targetEntityId","targetLabelSnapshot","enabled","source","createdAt","updatedAt","deletedAt","lastUsedAt"]),FORBIDDEN_KEYS=new Set(["token","accesstoken","refreshtoken","password","secret","servicerole","authorization","jwt","audio","audioblob","base64","prompt","transactions","history"]);
  class RuleMemoryError extends Error{constructor(code,message,details={}){super(message);this.name="RuleMemoryError";this.code=code;this.details=Object.freeze(details);}}
  const clone=value=>JSON.parse(JSON.stringify(value)),text=value=>String(value??"").normalize("NFKC").trim(),normalizeMatch=value=>text(value).toLocaleLowerCase("zh-TW"),iso=value=>typeof value==="string"&&!Number.isNaN(Date.parse(value))?value:null;
  function assertSafe(value,path="rule"){if(!value||typeof value!=="object")return;for(const[key,item]of Object.entries(value)){const normalized=key.replace(/[^a-z0-9]/gi,"").toLowerCase();if(FORBIDDEN_KEYS.has(normalized))throw new RuleMemoryError("UNSAFE_RULE_PAYLOAD",`Rule Memory 不可包含 ${path}.${key}。`,{path:`${path}.${key}`});assertSafe(item,`${path}.${key}`);}}
  function normalizeRule(input={},options={}){
    if(!input||typeof input!=="object"||Array.isArray(input))throw new RuleMemoryError("INVALID_RULE","Rule 必須是單一物件。");assertSafe(input);
    const extra=Object.keys(input).filter(key=>!SAFE_KEYS.includes(key));if(extra.length)throw new RuleMemoryError("INVALID_RULE","Rule 包含未允許欄位。",{extra});
    const now=options.now||(()=>new Date().toISOString()),idGenerator=options.idGenerator||(()=>globalThis.crypto?.randomUUID?.()||`rule-${Date.now()}-${Math.random().toString(16).slice(2)}`),stamp=now(),matchKind=text(input.matchKind),matchValue=text(input.matchValue),targetField=text(input.targetField),targetEntityId=input.targetEntityId==null?null:text(input.targetEntityId),targetLabelSnapshot=text(input.targetLabelSnapshot),source=text(input.source),createdAt=iso(input.createdAt)||stamp,updatedAt=iso(input.updatedAt)||stamp,deletedAt=input.deletedAt==null?null:iso(input.deletedAt),lastUsedAt=input.lastUsedAt==null?null:iso(input.lastUsedAt);
    if(!MATCH_KINDS.includes(matchKind))throw new RuleMemoryError("INVALID_MATCH_KIND","Rule matchKind 不合法。",{matchKind});
    if(!matchValue||matchValue.length>120)throw new RuleMemoryError("INVALID_MATCH_VALUE","Rule trigger 必須是 1 到 120 字。",{matchValue});
    if(!TARGET_FIELDS.includes(targetField))throw new RuleMemoryError("INVALID_TARGET_FIELD","Rule targetField 不合法。",{targetField});
    if(ENTITY_FIELDS.includes(targetField)&&!targetEntityId)throw new RuleMemoryError("TARGET_ID_REQUIRED","實體規則必須使用 Stable ID。",{targetField});
    if(!targetLabelSnapshot||targetLabelSnapshot.length>120)throw new RuleMemoryError("TARGET_LABEL_REQUIRED","Rule target label 不可為空。",{targetField});
    if(source!=="user_confirmed")throw new RuleMemoryError("RULE_CONFIRMATION_REQUIRED","Rule 只能由使用者明確確認建立。",{source});
    if(input.version!=null&&Number(input.version)!==VERSION)throw new RuleMemoryError("UNSUPPORTED_RULE_VERSION","Rule Memory 版本不支援。",{version:input.version});
    if(input.scopeType!=null&&!['expense','income','transfer','credit_card_purchase','credit_card_payment'].includes(String(input.scopeType)))throw new RuleMemoryError("INVALID_SCOPE","Rule scopeType 不合法。",{scopeType:input.scopeType});
    if((input.deletedAt!=null&&!deletedAt)||(input.lastUsedAt!=null&&!lastUsedAt))throw new RuleMemoryError("INVALID_TIMESTAMP","Rule timestamp 不合法。");
    return Object.freeze({id:text(input.id)||idGenerator(),version:VERSION,matchKind,matchValue,normalizedMatch:normalizeMatch(matchValue),scopeType:input.scopeType==null?null:String(input.scopeType),targetField,targetEntityId:ENTITY_FIELDS.includes(targetField)?targetEntityId:null,targetLabelSnapshot,enabled:deletedAt?false:input.enabled!==false,source:"user_confirmed",createdAt,updatedAt,deletedAt,lastUsedAt});
  }
  const activeRules=rules=>(Array.isArray(rules)?rules:[]).map(rule=>MemorySafe(rule)).filter(rule=>rule&&rule.enabled!==false&&!rule.deletedAt&&rule.source==="user_confirmed");
  function MemorySafe(rule){try{return normalizeRule(rule);}catch{return null;}}
  function matches(rule,{draft={},rawText="",typeHints=[]}={}){const hints=[...new Set((Array.isArray(typeHints)?typeHints:[]).filter(Boolean))],scope=draft.type||(hints.length===1?hints[0]:null);if(rule.scopeType&&rule.scopeType!==scope)return false;if(rule.matchKind==="merchant")return normalizeMatch(draft.merchant)===rule.normalizedMatch;return normalizeMatch(rawText).includes(rule.normalizedMatch);}
  function targetRows(field,references){return field==="category"?references.categories:field==="account"?references.accounts:field==="creditCard"?references.creditCards:[];}
  function resolveTarget(rule,references={},draft={}){
    if(rule.targetField==="merchant")return{available:true,value:rule.targetLabelSnapshot,key:normalizeMatch(rule.targetLabelSnapshot)};
    const row=(Array.isArray(targetRows(rule.targetField,references))?targetRows(rule.targetField,references):[]).find(item=>String(item?.id||"")===rule.targetEntityId);
    if(!row||row.archived===true||row.active===false)return{available:false};
    if(rule.targetField==="category"){const expected=draft.type==="income"?"income":(["expense","credit_card_purchase"].includes(draft.type)?"expense":null);if(expected&&row.type!==expected)return{available:false};}
    return{available:true,value:row.name,key:String(row.id)};
  }
  function applyRuleMemory({draft,ruleResult={},rules=[],references={},rawText}={}){
    const base=Template.sanitizeFinanceTransactionTemplate(draft||ruleResult.draft||{}),locked=new Set(ruleResult.lockedFields||[]),sourceTrace={...(ruleResult.sourceTrace||{})},issues=[...(ruleResult.issues||[])],applied=[],skipped=[],patch={},targetEntityIds={};
    const candidates=activeRules(rules).filter(rule=>matches(rule,{draft:base,rawText:(rawText??base.rawText)||"",typeHints:ruleResult.typeHints||[]})),groups=new Map();for(const rule of candidates){if(!groups.has(rule.targetField))groups.set(rule.targetField,[]);groups.get(rule.targetField).push(rule);}
    for(const[field,matched]of groups){if(locked.has(field)||base[field]!=null&&base[field]!==""){skipped.push(...matched.map(rule=>({ruleId:rule.id,field,reason:"skipped_explicit_input"})));continue;}const resolved=matched.map(rule=>({rule,target:resolveTarget(rule,references,base)})),available=resolved.filter(item=>item.target.available);if(available.length!==resolved.length){issues.push(`memory_target_unavailable:${field}`);skipped.push(...resolved.filter(item=>!item.target.available).map(item=>({ruleId:item.rule.id,field,reason:"memory_target_unavailable"})));continue;}const keys=[...new Set(available.map(item=>item.target.key))];if(keys.length!==1){issues.push(`memory_conflict:${field}`);skipped.push(...available.map(item=>({ruleId:item.rule.id,field,reason:"memory_conflict"})));continue;}const winner=available[0];patch[field]=winner.target.value;if(winner.rule.targetEntityId)targetEntityIds[field]=winner.rule.targetEntityId;locked.add(field);sourceTrace[field]=`memory:${winner.rule.id}`;applied.push(...available.map(item=>({ruleId:item.rule.id,field,value:item.target.value,targetEntityId:item.rule.targetEntityId})));
    }
    const merged=Template.mergeFinanceTransactionTemplate(base,patch);
    return Object.freeze({...ruleResult,draft:merged,lockedFields:Object.freeze([...locked]),sourceTrace:Object.freeze(sourceTrace),issues:Object.freeze([...new Set(issues)]),memory:Object.freeze({applied:Object.freeze(applied),skipped:Object.freeze(skipped),matchedRuleIds:Object.freeze(candidates.map(rule=>rule.id)),targetEntityIds:Object.freeze(targetEntityIds)})});
  }
  return Object.freeze({VERSION,MATCH_KINDS,TARGET_FIELDS,ENTITY_FIELDS,SAFE_KEYS,FORBIDDEN_KEYS,RuleMemoryError,normalizeMatch,normalizeRule,activeRules,matches,resolveTarget,applyRuleMemory,clone});
});
