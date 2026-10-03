(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringFormulaPack=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  class FormulaPackError extends Error{constructor(code,message){super(message);this.name="FormulaPackError";this.code=code;}}
  function validate(pack){
    if(!pack||typeof pack!=="object")throw new FormulaPackError("FORMULA_PACK_INVALID","公式包必須是物件。");
    const module_id=String(pack.module_id||"").trim(),version=String(pack.version||"").trim();
    if(!/^[a-z][a-z0-9-]*$/.test(module_id))throw new FormulaPackError("FORMULA_PACK_MODULE_INVALID","公式包 module_id 不正確。");
    if(!version)throw new FormulaPackError("FORMULA_PACK_VERSION_REQUIRED","公式包版本不可空白。");
    if(!Array.isArray(pack.formulas)||!pack.formulas.length)throw new FormulaPackError("FORMULA_PACK_FORMULAS_REQUIRED","公式包至少需要一個公式。");
    if(pack.formulas.some(formula=>formula.module_id!==module_id))throw new FormulaPackError("FORMULA_PACK_MODULE_MISMATCH","公式與公式包的 module_id 不一致。");
    return Object.freeze({module_id,version,formulas:Object.freeze([...pack.formulas])});
  }
  return Object.freeze({FormulaPackError,validate});
});
