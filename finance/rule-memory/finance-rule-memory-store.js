(function(root,factory){
  "use strict";
  const api=factory(typeof module==="object"&&module.exports?require("./finance-rule-memory.js"):root.FinanceRuleMemory);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceRuleMemoryStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Memory){
  "use strict";
  const SETTINGS_KEY="financeRuleMemoryV1",REGISTRY_VERSION=1,clone=value=>JSON.parse(JSON.stringify(value));
  class RuleMemoryStoreError extends Error{constructor(code,message,details={}){super(message);this.name="RuleMemoryStoreError";this.code=code;this.details=Object.freeze(details);}}
  function create({settings,now=()=>new Date().toISOString(),idGenerator=()=>globalThis.crypto?.randomUUID?.()||`rule-${Date.now()}-${Math.random().toString(16).slice(2)}`}={}){
    if(!settings?.get||!settings?.set)throw new TypeError("Finance Rule Memory store requires settings get/set.");let queue=Promise.resolve();
    async function registry(){const row=await settings.get(SETTINGS_KEY),value=row?.value;if(!value)return{version:REGISTRY_VERSION,rules:[]};if(value.version!==REGISTRY_VERSION||!Array.isArray(value.rules))throw new RuleMemoryStoreError("RULE_REGISTRY_INVALID","Rule Memory 本機資料格式無效。");return{version:REGISTRY_VERSION,rules:value.rules.map(rule=>Memory.normalizeRule(rule,{now,idGenerator}))};}
    async function write(rules){const value={version:REGISTRY_VERSION,rules:rules.map(clone)};await settings.set(SETTINGS_KEY,value);return value;}
    function mutate(operation){const run=queue.then(async()=>{const current=await registry();return operation(current);});queue=run.catch(()=>{});return run;}
    async function list({includeDeleted=false}={}){const rules=(await registry()).rules;return rules.filter(rule=>includeDeleted||!rule.deletedAt).map(clone);}
    function createRule(input){return mutate(async current=>{const rule=Memory.normalizeRule({...input,id:input.id||idGenerator(),source:input.source},{now,idGenerator});if(current.rules.some(item=>item.id===rule.id))throw new RuleMemoryStoreError("RULE_ID_EXISTS","Rule ID 已存在。",{id:rule.id});await write([...current.rules,rule]);return clone(rule);});}
    function update(id,changes={}){return mutate(async current=>{const index=current.rules.findIndex(rule=>rule.id===String(id));if(index<0)throw new RuleMemoryStoreError("RULE_NOT_FOUND","找不到 Rule Memory。",{id});const old=current.rules[index];if(old.deletedAt)throw new RuleMemoryStoreError("RULE_DELETED","已刪除 Rule 不可更新。",{id});const next=Memory.normalizeRule({...old,...changes,id:old.id,source:"user_confirmed",createdAt:old.createdAt,updatedAt:now()},{now,idGenerator});current.rules[index]=next;await write(current.rules);return clone(next);});}
    const setEnabled=(id,enabled)=>update(id,{enabled:Boolean(enabled)});
    function remove(id){return mutate(async current=>{const index=current.rules.findIndex(rule=>rule.id===String(id));if(index<0)throw new RuleMemoryStoreError("RULE_NOT_FOUND","找不到 Rule Memory。",{id});if(current.rules[index].deletedAt)return clone(current.rules[index]);const stamp=now(),next=Memory.normalizeRule({...current.rules[index],enabled:false,deletedAt:stamp,updatedAt:stamp},{now,idGenerator});current.rules[index]=next;await write(current.rules);return clone(next);});}
    function mergeRemote(remoteRules=[]){return mutate(async current=>{const merged=new Map(current.rules.map(rule=>[rule.id,rule]));for(const input of remoteRules){const remote=Memory.normalizeRule(input,{now,idGenerator}),local=merged.get(remote.id);if(!local){merged.set(remote.id,remote);continue;}const lt=Date.parse(local.updatedAt)||0,rt=Date.parse(remote.updatedAt)||0;if(rt>lt||(rt===lt&&Boolean(remote.deletedAt)>Boolean(local.deletedAt))||(rt===lt&&Boolean(remote.deletedAt)===Boolean(local.deletedAt)&&JSON.stringify(remote)>JSON.stringify(local)))merged.set(remote.id,remote);}const rules=[...merged.values()];await write(rules);return rules.map(clone);});}
    return Object.freeze({list,create:createRule,update,setEnabled,remove,mergeRemote});
  }
  return Object.freeze({SETTINGS_KEY,REGISTRY_VERSION,RuleMemoryStoreError,create});
});
