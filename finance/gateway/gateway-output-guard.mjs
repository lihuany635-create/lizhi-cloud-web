const ALLOWED_FIELDS=new Set(["type","category","account","creditCard","fromAccount","toAccount","merchant","note"]);
function allowed(field,values){if(field==="type")return values.types;if(field==="category")return values.categories;if(field==="creditCard")return values.creditCards;if(["account","fromAccount","toAccount"].includes(field))return values.accounts;return null;}

export function guardGatewayModelOutput(raw,request,promptPackage){
  let value;try{value=typeof raw==="string"?JSON.parse(raw.trim()):raw;}catch{return Object.freeze({valid:false,code:"MODEL_OUTPUT_INVALID",patch:Object.freeze({}),issues:Object.freeze(["invalid_json"])});}
  if(!value||typeof value!=="object"||Array.isArray(value))return Object.freeze({valid:false,code:"MODEL_OUTPUT_INVALID",patch:Object.freeze({}),issues:Object.freeze(["invalid_shape"])});
  const fillable=new Set(promptPackage.fillableFields),locked=new Set(request.lockedFields),patch={},issues=[];
  for(const [field,input] of Object.entries(value)){
    if(locked.has(field)){issues.push(`locked_field_removed:${field}`);continue;}
    if(!ALLOWED_FIELDS.has(field))return Object.freeze({valid:false,code:"MODEL_OUTPUT_INVALID",patch:Object.freeze({}),issues:Object.freeze([`unknown_field:${field}`])});
    if(!fillable.has(field)){if(input!=null&&input!=="")issues.push(`field_not_requested:${field}`);continue;}
    if(input==null||input===""){patch[field]=null;continue;}
    if(typeof input!=="string"){patch[field]=null;issues.push(`value_not_allowed:${field}`);continue;}
    const text=input.normalize("NFKC").trim(),choices=allowed(field,request.allowedValues);
    if(choices&&!choices.includes(text)){patch[field]=null;issues.push(`value_not_allowed:${field}`);continue;}
    if(field==="merchant"&&!request.rawText.normalize("NFKC").includes(text)){patch[field]=null;issues.push("value_not_allowed:merchant");continue;}
    if(field==="note"&&text.length>200){patch[field]=null;issues.push("value_not_allowed:note");continue;}
    patch[field]=text;
  }
  for(const field of promptPackage.fillableFields)if(!Object.hasOwn(patch,field))patch[field]=null;
  return Object.freeze({valid:true,code:null,patch:Object.freeze(patch),issues:Object.freeze(issues)});
}
