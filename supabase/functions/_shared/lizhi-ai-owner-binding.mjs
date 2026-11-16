// Owner identity derives from the ORIGINAL private AI Workbench project.
// No separate Site, client role flag, user_metadata or new owner secret.
import {UsageAccessError} from "./lizhi-usage-access.mjs";
export const WORKBENCH_USAGE_PROJECT_ID="879209cd-8c8a-46ba-903e-74ccaa93710f";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * @param {{queryProject:()=>Promise<unknown>,ownerUid?:string}} options
 */
export async function resolveUsageOwner({queryProject,ownerUid=""}){
  if(typeof queryProject!=="function")
    throw new UsageAccessError(503,"工作台本人綁定查詢未設定。");
  let rows;
  try{rows=await queryProject();}
  catch{throw new UsageAccessError(503,"無法核對工作台擁有者。");}
  if(!Array.isArray(rows)||rows.length!==1||typeof rows[0]?.owner_id!=="string"||
     !UUID.test(rows[0].owner_id))
    throw new UsageAccessError(503,"工作台本人綁定資料不完整。");
  const linked=rows[0].owner_id;
  if(ownerUid&&(!UUID.test(ownerUid)||ownerUid!==linked))
    throw new UsageAccessError(503,"工作台與設定的本人綁定不一致。");
  return linked;
}
