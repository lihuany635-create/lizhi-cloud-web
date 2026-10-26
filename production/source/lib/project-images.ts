import {FlowError,type Actor} from './workflow.ts';
import {managedOf,managedView,type ManagedProject} from './project-management.ts';
import type {PortfolioState} from './portfolio.ts';
export const IMAGE_BUCKET='lizhi-production-images';
export const MAX_IMAGE_BYTES=10*1024*1024;
export const IMAGE_TYPES=['image/jpeg','image/png','image/webp'] as const;
export type ProjectImage={id:string;key:string;name:string;mime:typeof IMAGE_TYPES[number];size:number;sha256:string;objectPath:string;description:string;recordId:string;stageId:string;at:string;by:string};
const txt=(v:unknown,max:number,required=false)=>{if(typeof v!=='string'||v.length>max||required&&!v.trim())throw new FlowError('圖片欄位不完整或過長');return v.trim();};
export function inspectImage(bytes:Uint8Array,mime:string){
 if(!bytes.length||bytes.length>MAX_IMAGE_BYTES)throw new FlowError('每張圖片須小於或等於 10 MB',413);
 const u=bytes;let detected='';if(u.length>=24&&u.slice(0,8).every((b,i)=>b===[137,80,78,71,13,10,26,10][i])&&String.fromCharCode(...u.slice(12,16))==='IHDR')detected='image/png';
 else if(u.length>=4&&u[0]===255&&u[1]===216&&u[2]===255&&u[u.length-2]===255&&u[u.length-1]===217)detected='image/jpeg';
 else if(u.length>=20&&String.fromCharCode(...u.slice(0,4))==='RIFF'&&String.fromCharCode(...u.slice(8,12))==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(String.fromCharCode(...u.slice(12,16))))detected='image/webp';
 if(!detected||detected!==mime)throw new FlowError('圖片內容與格式不符，請選擇 JPG、PNG 或 WebP');return detected as ProjectImage['mime'];
}
export function imageObjectPath(owner:string,projectId:string,id:string,mime:string){
 if(![owner,projectId,id].every(s=>/^[0-9a-f-]{36}$/i.test(s)))throw new FlowError('圖片識別碼格式錯誤');const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as Record<string,string>)[mime];if(!ext)throw new FlowError('不支援的圖片格式');return `${owner}/${projectId}/${id}.${ext}`;
}
export function findProjectImage(state:PortfolioState,projectId:string,id:string,owner:string){const p=managedOf(state,projectId),image=p.images.find(x=>x.id===id);if(!image)throw new FlowError('找不到本專案的圖片',404);if(image.objectPath!==imageObjectPath(owner,p.id,image.id,image.mime))throw new FlowError('圖片位置不屬於此專案',403);return image;}
function editable(p:ManagedProject,revision:unknown){if(p.archived)throw new FlowError('請先還原專案再匯入或修改圖片',409);if(!Number.isInteger(revision)||p.revision!==revision)throw new FlowError('專案已更新，請重新整理後再上傳；已選的圖片會保留',409);}
function links(p:ManagedProject,recordId:string,stageId:string){if(recordId&&!p.records.some(r=>r.id===recordId))throw new FlowError('工作紀錄不屬於本專案',404);if(stageId&&!p.stages.some(s=>s.id===stageId))throw new FlowError('階段不屬於本專案',404);}
export function attachProjectImage(input:PortfolioState,projectId:string,revision:unknown,image:ProjectImage,actor:Actor){
 const state=structuredClone(input),p=managedOf(state,projectId),prior=p.images.find(x=>x.key===image.key);
 if(prior){if(prior.sha256!==image.sha256||prior.mime!==image.mime||prior.size!==image.size)throw new FlowError('重複上傳識別鍵的內容不同',409);return {state,changed:false,result:managedView(state,p.id),image:prior};}
 editable(p,revision);links(p,image.recordId,image.stageId);if(p.images.length>=1000)throw new FlowError('本專案已達 1000 張圖片上限');if(!image.name||image.name.length>250||!image.key||image.key.length>100||image.description.length>3000||!Number.isInteger(image.size)||image.size<1||image.size>MAX_IMAGE_BYTES||!/^[a-f0-9]{64}$/i.test(image.sha256))throw new FlowError('圖片資料格式錯誤');
 if(image.objectPath!==imageObjectPath(actor.id,p.id,image.id,image.mime))throw new FlowError('圖片位置不屬於此專案',403);
 p.images.push(image);p.revision++;p.updatedAt=image.at;p.history.push({action:'upload_project_image',at:image.at,by:actor.name,actor:actor.kind,detail:JSON.stringify({imageId:image.id,name:image.name,sha256:image.sha256,recordId:image.recordId,stageId:image.stageId})});save(state,p);return {state,changed:true,result:managedView(state,p.id),image};
}
export function updateProjectImage(input:PortfolioState,projectId:string,revision:unknown,a:Record<string,unknown>,actor:Actor){
 const state=structuredClone(input),p=managedOf(state,projectId);editable(p,revision);const image=p.images.find(x=>x.id===a.imageId);if(!image)throw new FlowError('找不到本專案圖片',404);findProjectImage(state,p.id,image.id,actor.id);const key=txt(a.key,100,true);if(p.requests.some(r=>r.key===key))throw new FlowError('重複提交，請重新讀取',409);
 const description=txt(a.description??'',3000),recordId=txt(a.recordId??'',200),stageId=txt(a.stageId??'',200);links(p,recordId,stageId);const previous={description:image.description,recordId:image.recordId,stageId:image.stageId};Object.assign(image,{description,recordId,stageId});p.revision++;p.updatedAt=new Date().toISOString();p.requests.push({key,op:'updateProjectImage',payload:''});p.history.push({action:'update_project_image',at:p.updatedAt,by:actor.name,actor:actor.kind,detail:JSON.stringify({imageId:image.id,previous,next:{description,recordId,stageId}})});save(state,p);return {state,changed:true,result:managedView(state,p.id)};
}
function save(s:PortfolioState,p:ManagedProject){s.portfolio??=[];const i=s.portfolio.findIndex(x=>x.id===p.id);if(i<0)s.portfolio.push(p);else s.portfolio[i]=p;}
