(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(
    root,
    isNode?require("./input-validator.js"):root.EngineeringInputValidator,
    isNode?require("./unit-converter.js"):root.EngineeringUnitConverter,
    isNode?require("./rounding-policy.js"):root.EngineeringRoundingPolicy,
    isNode?require("./calculation-result.js"):root.EngineeringCalculationResult,
    isNode?require("./calculation-record.js"):root.EngineeringCalculationRecord
  );
  if(isNode)module.exports=api;else root.EngineeringCalculationEngine=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,InputValidator,UnitConverter,Rounding,Result,Record){
  "use strict";
  function create({formulaRegistry,calculationRepository=null,now=()=>new Date().toISOString(),idGenerator=()=>root.crypto?.randomUUID?.()||`calculation-${Date.now()}-${Math.random().toString(16).slice(2)}`}={}){
    if(!formulaRegistry)throw new TypeError("Calculation Engine requires a formula registry");
    return Object.freeze({
      async calculate({project_id,formula_id,input={}}={}){
        const formula=formulaRegistry.getFormula(formula_id);
        if(!formula)return Result.failure({formulaId:formula_id,input,errors:[Result.error("FORMULA_NOT_FOUND","找不到指定公式。")]});
        if(!String(project_id||"").trim())return Result.failure({formulaId:formula.id,formulaVersion:formula.version,input,errors:[Result.error("VALIDATION_ERROR","缺少 project_id。",{field:"project_id"})]});
        const validation=InputValidator.validate(formula.input_schema,input);
        if(!validation.ok)return Result.failure({formulaId:formula.id,formulaVersion:formula.version,input,errors:validation.errors});
        const canonical={...validation.value};
        try{
          for(const [field,rules] of Object.entries(formula.input_schema.fields)){
            if(!rules.canonical_unit)continue;
            canonical[field]=UnitConverter.convert(canonical[field],canonical[rules.unit_field],rules.canonical_unit,rules.dimension);
          }
        }catch(error){return Result.failure({formulaId:formula.id,formulaVersion:formula.version,input:validation.value,errors:[Result.error("UNIT_ERROR",error.message,{unitCode:error.code,...error.details})]});}
        let execution;
        try{execution=await formula.execute(Object.freeze({...canonical}));}
        catch(error){return Result.failure({formulaId:formula.id,formulaVersion:formula.version,input:validation.value,errors:[Result.error("FORMULA_EXECUTION_ERROR","公式執行失敗。",{reason:String(error?.message||error).slice(0,160)})]});}
        if(!execution||typeof execution!=="object"||!execution.result||typeof execution.result!=="object")return Result.failure({formulaId:formula.id,formulaVersion:formula.version,input:validation.value,errors:[Result.error("FORMULA_EXECUTION_ERROR","公式沒有回傳標準結果。")]});
        const rawResult=execution.result,warnings=[...(execution.warnings||[])],rounded=Rounding.apply(rawResult,formula.rounding_policy);
        let record=null,saved=false;
        if(calculationRepository){
          try{
            record=await calculationRepository.create(Record.create({id:idGenerator(),project_id,module_id:formula.module_id,formula_id:formula.id,formula_version:formula.version,input:validation.value,result:rounded,warnings,created_at:now()}));saved=true;
          }catch(error){warnings.push(Result.error("HISTORY_NOT_SAVED","計算完成，但紀錄未保存。",{storageCode:error?.code||"CALCULATION_SAVE_FAILED"}));}
        }
        return Result.success({formula,input:validation.value,result:rounded,warnings,meta:{raw_result:rawResult,canonical_input:canonical,saved,record_id:record?.id||null}});
      }
    });
  }
  return Object.freeze({create});
});
