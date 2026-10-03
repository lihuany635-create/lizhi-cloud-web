(function(root,factory){
  const isNode=typeof module==="object"&&module.exports;
  const api=factory(isNode?require("../core/calculation/calculation-record.js"):root.EngineeringCalculationRecord);
  if(isNode)module.exports=api;else root.EngineeringCalculationRepository=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Record){
  "use strict";
  class CalculationRepositoryError extends Error{
    constructor(code,message,cause){super(message,{cause});this.name="CalculationRepositoryError";this.code=code;}
  }
  function create({persistence}){
    if(!persistence)throw new TypeError("Calculation repository persistence is required");
    return Object.freeze({
      async create(record){
        const normalized=Record.create(record);
        try{await persistence.addCalculation(Record.toRecord(normalized));return normalized;}
        catch(error){throw new CalculationRepositoryError("CALCULATION_SAVE_FAILED","計算完成，但紀錄未能保存。",error);}
      },
      async getById(id){
        try{const row=await persistence.getCalculation(String(id));return row?Record.create(row):null;}
        catch(error){throw new CalculationRepositoryError("CALCULATION_READ_FAILED","無法讀取計算紀錄。",error);}
      },
      async listByProject(projectId){
        try{return (await persistence.listCalculations(String(projectId))).map(Record.create).sort((a,b)=>b.created_at.localeCompare(a.created_at));}
        catch(error){throw new CalculationRepositoryError("CALCULATION_LIST_FAILED","無法讀取計算歷史。",error);}
      }
    });
  }
  return Object.freeze({CalculationRepositoryError,create});
});
