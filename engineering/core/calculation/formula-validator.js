(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringFormulaValidator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  class FormulaDefinitionError extends Error{
    constructor(code,message,details={}){super(message);this.name="FormulaDefinitionError";this.code=code;this.details=Object.freeze({...details});}
  }
  const object=value=>value&&typeof value==="object"&&!Array.isArray(value);
  function validate(definition){
    if(!object(definition))throw new FormulaDefinitionError("FORMULA_DEFINITION_INVALID","公式定義必須是物件。");
    const normalized={
      id:String(definition.id||"").trim(),module_id:String(definition.module_id||"").trim(),name:String(definition.name||"").trim(),version:String(definition.version||"").trim(),description:String(definition.description||"").trim(),
      input_schema:definition.input_schema,output_schema:definition.output_schema,supported_units:definition.supported_units||{},rounding_policy:definition.rounding_policy||{type:"none"},execute:definition.execute,
      status:String(definition.status||"production").trim(),applicability:String(definition.applicability||"").trim(),assumptions:Object.freeze([...(definition.assumptions||[])]),category:String(definition.category||"").trim()
    };
    if(!/^[a-z][a-z0-9._-]*$/.test(normalized.id))throw new FormulaDefinitionError("FORMULA_ID_INVALID","公式 ID 不正確。");
    if(!/^[a-z][a-z0-9-]*$/.test(normalized.module_id))throw new FormulaDefinitionError("FORMULA_MODULE_INVALID","公式 module_id 不正確。");
    if(!normalized.name)throw new FormulaDefinitionError("FORMULA_NAME_REQUIRED","公式名稱不可空白。");
    if(!normalized.version)throw new FormulaDefinitionError("FORMULA_VERSION_REQUIRED","公式版本不可空白。");
    if(!object(normalized.input_schema)||!object(normalized.input_schema.fields))throw new FormulaDefinitionError("FORMULA_INPUT_SCHEMA_INVALID","公式必須提供 input schema。");
    if(!object(normalized.output_schema))throw new FormulaDefinitionError("FORMULA_OUTPUT_SCHEMA_INVALID","公式必須提供 output schema。");
    if(typeof normalized.execute!=="function")throw new FormulaDefinitionError("FORMULA_EXECUTE_INVALID","公式 execute 必須是函式。");
    if(!["production","draft","needs_confirmation"].includes(normalized.status))throw new FormulaDefinitionError("FORMULA_STATUS_INVALID","公式狀態不正確。");
    return Object.freeze({...normalized,input_schema:Object.freeze({...normalized.input_schema,fields:Object.freeze({...normalized.input_schema.fields})}),output_schema:Object.freeze({...normalized.output_schema}),supported_units:Object.freeze({...normalized.supported_units}),rounding_policy:Object.freeze({...normalized.rounding_policy})});
  }
  return Object.freeze({FormulaDefinitionError,validate});
});
