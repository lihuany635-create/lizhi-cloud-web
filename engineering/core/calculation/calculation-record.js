(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.EngineeringCalculationRecord=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const FIELDS=Object.freeze(["id","project_id","module_id","formula_id","formula_version","input","result","warnings","created_at"]);
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const randomId=()=>root.crypto?.randomUUID?.()||`calculation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function create(input={}){
    const record={id:String(input.id||randomId()),project_id:String(input.project_id||"").trim(),module_id:String(input.module_id||"").trim(),formula_id:String(input.formula_id||"").trim(),formula_version:String(input.formula_version||"").trim(),input:clone(input.input||{}),result:clone(input.result||{}),warnings:clone(input.warnings||[]),created_at:String(input.created_at||new Date().toISOString())};
    if(!record.project_id||!record.module_id||!record.formula_id||!record.formula_version)throw new TypeError("CalculationRecord identifiers are required");
    if(!Number.isFinite(Date.parse(record.created_at)))throw new TypeError("CalculationRecord created_at is invalid");
    return Object.freeze({...record,input:Object.freeze(record.input),result:Object.freeze(record.result),warnings:Object.freeze(record.warnings)});
  }
  function toRecord(input){const record=create(input);return Object.fromEntries(FIELDS.map(field=>[field,clone(record[field])]));}
  return Object.freeze({FIELDS,create,toRecord});
});
