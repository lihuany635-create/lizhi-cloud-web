import {FlowError,type Actor} from '../lib/workflow.ts';
import {managedOf} from '../lib/project-management.ts';
import {attachProjectImage,updateProjectImage,findProjectImage,inspectImage,imageObjectPath,MAX_IMAGE_BYTES,type ProjectImage} from '../lib/project-images.ts';
import type {PortfolioState} from '../lib/portfolio.ts';
type Services={read:()=>Promise<{revision:number;data:PortfolioState}>;commit:(revision:number,data:PortfolioState)=>Promise<void>;upload:(path:string,bytes:Uint8Array,mime:string)=>Promise<void>;remove:(path:string)=>Promise<void>;signed:(path:string)=>Promise<string>};
async function boundedBody(req:Request){const max=MAX_IMAGE_BYTES+65536,length=Number(req.headers.get('content-length')||0);if(length>max)throw new FlowError('圖片超過 10 MB 上傳限制',413);const chunks:Uint8Array[]=[];let size=0;const reader=req.body?.getReader();if(!reader)throw new FlowError('沒有收到圖片');try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new FlowError('圖片超過 10 MB 上傳限制',413);}chunks.push(value);}}finally{reader.releaseLock();}const body=new Uint8Array(size);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.length;}return body;}
export async function handleProjectImages(req:Request,actor:Actor,services:Services){
 const url=new URL(req.url),record=await services.read();
 if(req.method==='GET'){const id=url.searchParams.get('projectId')??'',image=findProjectImage(record.data,id,url.searchParams.get('imageId')??'',actor.id);return {url:await services.signed(image.objectPath),expiresIn:300,image};}
 if(req.headers.get('content-type')?.startsWith('application/json')){const bytes=await boundedBody(req);if(bytes.length>20000)throw new FlowError('圖片說明過長',413);const a=JSON.parse(new TextDecoder().decode(bytes));if(a.action!=='update')throw new FlowError('未知圖片操作');const next=updateProjectImage(record.data,String(a.projectId??''),a.revision,a,actor);await services.commit(record.revision,next.state);return next.result;}
 if(!req.headers.get('content-type')?.startsWith('multipart/form-data;'))throw new FlowError('請以圖片表單上傳');
 const bytes=await boundedBody(req),form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('content-type')!},body:bytes}).formData();
 const value=(k:string,max:number,required=false)=>{const v=form.get(k);if(typeof v!=='string'||v.length>max||required&&!v.trim())throw new FlowError('圖片上傳欄位不完整');return v.trim();};
 const projectId=value('projectId',100,true),revision=Number(value('revision',20,true)),key=value('key',100,true),description=value('description',3000),recordId=value('recordId',200),stageId=value('stageId',200),file=form.get('file');
 if(!(file instanceof File))throw new FlowError('請選擇要匯入的圖片');const data=new Uint8Array(await file.arrayBuffer()),mime=inspectImage(data,file.type),sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const p=managedOf(record.data,projectId),id=crypto.randomUUID();const image:ProjectImage={id,key,name:file.name.slice(0,250)||'圖片',mime,size:data.length,sha256,objectPath:imageObjectPath(actor.id,projectId,id,mime),description,recordId,stageId,at:new Date().toISOString(),by:actor.name};
 const next=attachProjectImage(record.data,projectId,revision,image,actor);if(!next.changed)return next.result;
 // Validate links/revision before storing. Unique object, never overwrite an existing image.
 await services.upload(image.objectPath,data,mime);
 try{await services.commit(record.revision,next.state);}catch(e){if(e instanceof FlowError&&e.status===409){try{await services.remove(image.objectPath);}catch{/* Unique unreferenced object stays private. */}}throw e;}
 return next.result;
}
