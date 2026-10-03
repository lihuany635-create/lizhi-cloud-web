(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("./formula-validator.js"):root.EngineeringFormulaValidator,isNode?require("./formula-pack.js"):root.EngineeringFormulaPack);
  if(isNode)module.exports=api;else root.EngineeringFormulaRegistryApi=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Validator,FormulaPack){
  "use strict";
  class FormulaRegistryError extends Error{constructor(code,message,details={}){super(message);this.name="FormulaRegistryError";this.code=code;this.details=Object.freeze({...details});}}
  function createRegistry({moduleRegistry,neutralNamespaces=["demo"]}={}){
    const formulas=new Map(),allowed=new Set(neutralNamespaces);
    const moduleAllowed=id=>allowed.has(id)||Boolean(moduleRegistry?.get?.(id));
    const api={
      registerFormula(candidate){
        const definition=Validator.validate(candidate);
        if(!moduleAllowed(definition.module_id))throw new FormulaRegistryError("FORMULA_MODULE_UNKNOWN","公式所屬模組尚未註冊。",{moduleId:definition.module_id});
        if(formulas.has(definition.id))throw new FormulaRegistryError("FORMULA_DUPLICATE","公式 ID 已存在。",{formulaId:definition.id});
        formulas.set(definition.id,definition);return definition;
      },
      registerPack(candidate){
        const pack=FormulaPack.validate(candidate),definitions=pack.formulas.map(Validator.validate),seen=new Set();
        for(const definition of definitions){
          if(!moduleAllowed(definition.module_id))throw new FormulaRegistryError("FORMULA_MODULE_UNKNOWN","公式所屬模組尚未註冊。",{moduleId:definition.module_id});
          if(formulas.has(definition.id)||seen.has(definition.id))throw new FormulaRegistryError("FORMULA_DUPLICATE","公式 ID 已存在。",{formulaId:definition.id});
          seen.add(definition.id);
        }
        for(const definition of definitions)formulas.set(definition.id,definition);
        return pack;
      },
      getFormula(id){return formulas.get(String(id))||null;},
      listFormulas(){return [...formulas.values()];},
      listByModule(moduleId){return [...formulas.values()].filter(formula=>formula.module_id===String(moduleId));},
      hasFormula(id){return formulas.has(String(id));}
    };
    return Object.freeze(api);
  }
  return Object.freeze({FormulaRegistryError,createRegistry});
});
