// Site v31 -> Edge v9 P4 SafeSave candidate. NOT automatically deployed.
// Add to the EXISTING Private Site's tool list and dispatch only after
// verifying the signed-in owner identity. No second Site/MCP/DB.
// The site-side gate and Edge-side p4SaveEnabled gate default to OFF.
const ENDPOINT = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX64 = /^[a-f0-9]{64}$/i;
const DOC = /^[1-9][0-9]{0,19}$/;
const DEVICE = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const NAMES = ["gridcraft_save_prepare","gridcraft_save_commit","gridcraft_save_status"];
export const P4_SAVE_TOOL_NAMES = new Set(NAMES);

export const P4_SAVE_TOOLS = Object.freeze([
  {name:"gridcraft_save_prepare",
   description:"為本人授權的 GridCraft 工作簿預覽安全另存副本，不變更原檔。僅接受單一新 .xlsx 檔名，需 Windows 本機開關與本人核准才能提交。",
   inputSchema:{type:"object",properties:{
     doc:{type:"string",minLength:1,maxLength:20},
     file_name:{type:"string",minLength:6,maxLength:95}
   },required:["doc","file_name"],additionalProperties:false},
   annotations:{readOnlyHint:true,destructiveHint:false}},
  {name:"gridcraft_save_commit",
   description:"將已核對的 XLSX 快照安全另存為新的本機私人副本；須本人明確確認及本機 P4 寫入開關。原檔不覆蓋、不自動存檔；執行前備份、CAS、持久防重播。",
   inputSchema:{type:"object",properties:{
     preview_id:{type:"string",minLength:36,maxLength:36},
     expected_version:{type:"string",minLength:64,maxLength:64},
     request_id:{type:"string",minLength:36,maxLength:36},
     owner_confirmed:{type:"boolean"}
   },required:["preview_id","expected_version","request_id","owner_confirmed"],additionalProperties:false},
   annotations:{readOnlyHint:false,destructiveHint:true}},
  {name:"gridcraft_save_status",
   description:"本人授權下核對安全另存收據及磁碟副本；不自動重試寫入。",
   inputSchema:{type:"object",properties:{
     request_id:{type:"string",minLength:36,maxLength:36},
     verify_disk:{type:"boolean"}
   },required:["request_id","verify_disk"],additionalProperties:false},
   annotations:{readOnlyHint:true,destructiveHint:false}}
]);

const plain = v => v!==null && typeof v==="object" && !Array.isArray(v);
const exact = (v, keys) => Object.keys(v).sort().join("|") === [...keys].sort().join("|");
const safeName = name => {
 if(typeof name!=="string" || name!==name.normalize("NFC") ||
    [...name].length<6 || [...name].length>95 ||
    !name.toLowerCase().endsWith(".xlsx") || name.split(".").length!==2 ||
    name[0]===" " || name[0]==="." || name.at(-1)===" " ||
    /[<>:"\/\\|?*\x00-\x1f\p{Cf}\p{Cs}]/u.test(name) ||
    name.slice(0,-5).trim()!==name.slice(0,-5) ||
    DEVICE.test(name.slice(0,-5))) throw Error("SAVE_NAME_DENIED");
 return name;
};

export function validateP4SaveCall(name,args) {
 if(!P4_SAVE_TOOL_NAMES.has(name))throw Error("P4_SAVE_METHOD_DENIED");
 if(!plain(args))throw Error("P4_INVALID_ARGS");
 if(name==="gridcraft_save_prepare"){
   if(!exact(args,["doc","file_name"]))throw Error("P4_INVALID_ARGS");
   if(typeof args.doc!=="string" || !DOC.test(args.doc) ||
      BigInt(args.doc)>18446744073709551615n)throw Error("P4_INVALID_DOC");
   return {doc:args.doc,file_name:safeName(args.file_name)};
 }
 if(name==="gridcraft_save_commit"){
   if(!exact(args,["preview_id","expected_version","request_id","owner_confirmed"]))
     throw Error("P4_INVALID_ARGS");
   if(typeof args.preview_id!=="string" || !UUID.test(args.preview_id) ||
      typeof args.request_id!=="string" || !UUID.test(args.request_id) ||
      typeof args.expected_version!=="string" || !HEX64.test(args.expected_version) ||
      args.owner_confirmed!==true) throw Error("P4_CONFIRMATION_REQUIRED");
   return {...args};
 }
 if(!exact(args,["request_id","verify_disk"]) ||
    typeof args.request_id!=="string" || !UUID.test(args.request_id) ||
    typeof args.verify_disk!=="boolean") throw Error("P4_INVALID_ARGS");
 return {request_id:args.request_id,verify_disk:args.verify_disk};
}

export async function callP4SaveFromPrivateSite({
  rpcId,name,args,verifiedPrincipal,expectedPrincipal,bridgeSecret,
  p4SaveEnabled=false,fetchImpl=fetch,timeoutMs=16000
}={}) {
 if(p4SaveEnabled!==true)throw Error("P4_SAVE_GATE_OFF");
 if(typeof verifiedPrincipal!=="string" || verifiedPrincipal.length<8 ||
    verifiedPrincipal!==expectedPrincipal)throw Error("UNAUTHORIZED");
 if(typeof bridgeSecret!=="string" || !HEX64.test(bridgeSecret))
   throw Error("BRIDGE_NOT_CONFIGURED");
 if(rpcId!==null && typeof rpcId!=="string" && typeof rpcId!=="number")
   throw Error("INVALID_RPC_ID");
 if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>17000)
   throw Error("INVALID_TIMEOUT");
 const parsed=validateP4SaveCall(name,args);
 const payload=JSON.stringify({jsonrpc:"2.0",id:rpcId??null,method:"tools/call",
   params:{name,arguments:parsed,requestId:crypto.randomUUID()}});
 if(new TextEncoder().encode(payload).length>8192)throw Error("REQUEST_LIMIT");
 let response;
 try{
   response=await fetchImpl(ENDPOINT,{
     method:"POST",redirect:"manual",headers:{
       "Content-Type":"application/json","Accept":"application/json",
       "x-lizhi-gridcraft-actor":verifiedPrincipal,
       "x-lizhi-gridcraft-bridge":bridgeSecret
     },body:payload,signal:AbortSignal.timeout(timeoutMs)
   });
 }catch {throw Error("P4_EDGE_UNAVAILABLE");}
 if(!response?.ok || response.status>=300)throw Error("P4_EDGE_UNAVAILABLE");
 const raw=await response.text();
 if(new TextEncoder().encode(raw).length>32768)throw Error("P4_REPLY_LIMIT");
 let result;
 try{result=JSON.parse(raw);}catch{throw Error("P4_INVALID_REPLY");}
 if(!plain(result)||result.jsonrpc!=="2.0" ||
    result.id!==(rpcId??null) || !Object.hasOwn(result,"result"))
    throw Error("P4_INVALID_REPLY");
 return result;
}
