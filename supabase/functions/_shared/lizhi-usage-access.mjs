// Testable, fail-closed owner authorization for the usage monitor Edge Function.
// All credentials remain in Edge server env; never trust user_metadata or client claims.
import {verifySiteBridge} from "./lizhi-usage-mcp-bridge-auth.mjs";
export class UsageAccessError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
const httpError=(status,message)=>new UsageAccessError(status,message);
export const TRUSTED_ORIGIN="https://lihuany635-create.github.io";
export function originAllowed(headers,origin=TRUSTED_ORIGIN){
  const supplied=headers?.get?.("Origin");
  return supplied===null||supplied===undefined||supplied===origin;
}
export async function authorizeUsage(req,{
  forMcp=false,base,anon,service,ownerUid,
  bridgeSecret,bridgeActor,fetchImpl=fetch
}={}){
  if(!base||!anon||!service||!ownerUid||!/^[0-9a-f-]{36}$/i.test(ownerUid))
    throw httpError(503,"監控權限尚未設定。");
  if(forMcp&&req.headers.has("x-lizhi-usage-bridge")){
    if(!await verifySiteBridge(req.headers,{secret:bridgeSecret,actor:bridgeActor}))
      throw httpError(403,"私人 Site 轉接驗證失敗。");
    return;
  }
  const token=req.headers.get("Authorization")?.match(/^Bearer\\s+(\\S+)$/i)?.[1];
  if(!token)throw httpError(401,"缺少登入憑證。");
  let response;
  try{
    response=await fetchImpl(String(base).replace(/\\/$/,"")+"/auth/v1/user",{
      headers:{apikey:anon,Authorization:"Bearer "+token},
      signal:AbortSignal.timeout(8000),redirect:"manual"
    });
  }catch{
    // Network outages must not be represented as invalid passwords.
    throw httpError(503,"登入驗證服務暫時無法使用。");
  }
  if(!response?.ok)throw httpError(response?.status>=500?503:401,"登入已失效或驗證服務不可用。");
  let user;
  try{user=await response.json();}catch{throw httpError(503,"驗證服務回應異常。");}
  if(!user?.id||user.id!==ownerUid)throw httpError(403,"只有本人可以查看監控紀錄。");
}
