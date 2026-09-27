const CANONICAL_FIELDS=Object.freeze(["version","action","type","amount","category","account","creditCard","fromAccount","toAccount","merchant","dateToken","date","note","rawText","source","confidence"]);
const TOP_LEVEL=Object.freeze(["task","requestId","rawText","draft","lockedFields","typeHints","allowedValues"]);
const FORBIDDEN=new Set(["prompt","messages","model","ollamaUrl","url","endpoint","systemPrompt","tools"]);
const ALLOWED_VALUE_KEYS=Object.freeze(["types","accounts","creditCards","categories"]);
const TYPES=Object.freeze(["income","expense","transfer","credit_card_purchase","credit_card_payment"]);

export class GatewayRequestError extends Error{
  constructor(status,code,message,details){super(message);this.name="GatewayRequestError";this.status=status;this.code=code;this.details=details;}
}
function fail(message,details){throw new GatewayRequestError(400,"INVALID_REQUEST",message,details);}
function stringList(value,name,{allowed,max=100}={}){
  if(!Array.isArray(value))fail(`${name} must be an array`);
  if(value.length>max)fail(`${name} has too many values`);
  const result=[];
  for(const item of value){if(typeof item!=="string"||!item.trim()||item.length>80)fail(`${name} contains an invalid value`);const text=item.normalize("NFKC").trim();if(allowed&&!allowed.includes(text))fail(`${name} contains a disallowed value`);if(!result.includes(text))result.push(text);}
  return Object.freeze(result);
}
function validateDraft(draft){
  if(!draft||typeof draft!=="object"||Array.isArray(draft))fail("draft must be a Canonical Finance Draft object");
  const keys=Object.keys(draft),missing=CANONICAL_FIELDS.filter(key=>!Object.hasOwn(draft,key)),extra=keys.filter(key=>!CANONICAL_FIELDS.includes(key));
  if(missing.length||extra.length||draft.version!=="1.0")fail("draft does not match the Canonical Finance Draft shape",{missing,extra});
  return Object.freeze({...draft});
}

export function validateFinanceParseRequest(value){
  if(!value||typeof value!=="object"||Array.isArray(value))fail("request body must be an object");
  const keys=Object.keys(value),forbidden=keys.filter(key=>FORBIDDEN.has(key)),extra=keys.filter(key=>!TOP_LEVEL.includes(key));
  if(forbidden.length)fail("general AI proxy fields are forbidden",{fields:forbidden});
  if(extra.length)fail("unknown top-level fields are forbidden",{fields:extra});
  if(value.task!=="finance_parse")fail("task must be finance_parse");
  if(typeof value.requestId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/.test(value.requestId))fail("requestId is invalid");
  if(typeof value.rawText!=="string"||!value.rawText.trim()||value.rawText.length>500)fail("rawText must be a non-empty string up to 500 characters");
  const draft=validateDraft(value.draft),lockedFields=stringList(value.lockedFields,"lockedFields",{allowed:CANONICAL_FIELDS,max:CANONICAL_FIELDS.length}),typeHints=stringList(value.typeHints,"typeHints",{allowed:TYPES,max:TYPES.length});
  const allowed=value.allowedValues;
  if(!allowed||typeof allowed!=="object"||Array.isArray(allowed))fail("allowedValues must be an object");
  const allowedKeys=Object.keys(allowed),badAllowed=allowedKeys.filter(key=>!ALLOWED_VALUE_KEYS.includes(key));
  if(badAllowed.length)fail("allowedValues contains unknown keys",{fields:badAllowed});
  const allowedValues=Object.freeze({
    types:stringList(allowed.types||[],"allowedValues.types",{allowed:TYPES,max:TYPES.length}),
    accounts:stringList(allowed.accounts||[],"allowedValues.accounts"),
    creditCards:stringList(allowed.creditCards||[],"allowedValues.creditCards"),
    categories:stringList(allowed.categories||[],"allowedValues.categories")
  });
  return Object.freeze({task:"finance_parse",requestId:value.requestId,rawText:value.rawText.trim(),draft,lockedFields,typeHints,allowedValues});
}

export const FINANCE_GATEWAY_FIELDS=Object.freeze({CANONICAL_FIELDS,TOP_LEVEL,TYPES});
