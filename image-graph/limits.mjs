export const MIB=1024*1024;
export const PROJECT_IMAGE_BYTES=256*MIB;
export const BACKUP_BYTES=320*MIB;
export const formatMiB=bytes=>(bytes/MIB).toFixed(1)+' MiB';
export function capacityError(used,max=PROJECT_IMAGE_BYTES){
 return `專案圖片總量上限 ${formatMiB(max)}，目前已用 ${formatMiB(used)}、剩餘 ${formatMiB(Math.max(0,max-used))}；請移除不需要的圖片或另建專案`;
}
