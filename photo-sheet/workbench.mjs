export const DRIVE_ROOT='1QFbXSaI5IRaA39jWlEnPCoIcM0qRy3Hy';
export const WORKSPACE_TITLE='施工照片工作區';
export const MARKER='LIZHI-PHOTO-SHEET/1';
export function encodeRow(row,order,batch){
 const value={schema:MARKER,batch,rowKey:row.rowKey,order,name:row.name,time:row.time,driveFileId:row.driveFileId||null,driveFolderId:row.driveFolderId||null,w:row.w,h:row.h,text:row.text};
 const text=JSON.stringify(value);if(text.length>3000)throw new Error('說明與檔名合計過長，請縮短');return text;
}
export function decodeRow(image){
 try{const r=JSON.parse(image.description);if(r.schema!==MARKER||typeof r.batch!=='string'||!r.batch.trim()||r.batch.length>100||typeof r.rowKey!=='string'||!Number.isInteger(r.order)||r.order<0||typeof r.text!=='string'||!Number.isFinite(r.w)||!Number.isFinite(r.h)||r.w<1||r.h<1)return null;return {...r,imageId:image.id};}catch{return null;}
}
export class Workbench {
 constructor(request){this.request=request;this.project=null;}
 async list(){return (await this.request('workspace?view=managed')).filter(p=>p.kind==='general'&&p.title===WORKSPACE_TITLE&&!p.archived);}
 async open(id){const p=await this.request('workspace?view=managed&id='+encodeURIComponent(id));if(!p.objective?.startsWith(MARKER))throw new Error('這不是施工照片批次');this.project=p;return p;}
 async batches(){return [...new Set(this.project.images.map(decodeRow).filter(Boolean).map(r=>r.batch))];}
 async create(batch,key){const found=await this.list();if(found.length===1)return this.open(found[0].id);if(found.length>1)throw new Error('工作區不唯一，請選取既有工作區');this.project=await this.request('workspace',{action:'createManagedProject',args:{key,type:'general',name:WORKSPACE_TITLE,description:MARKER+'\nDrive根目錄：'+DRIVE_ROOT,initialStages:[{key:'PHOTOS',title:'施工照片整理'}]}});return this.project;}
 async save(rows,batch){
  if(typeof batch!=='string'||!batch.trim()||batch.length>100)throw new Error('批次碼格式錯誤');
  if(rows.some(r=>typeof r.rowKey==='string'&&this.project?.images.some(im=>{const old=decodeRow(im);return old?.rowKey===r.rowKey&&old.batch!==batch;})))throw new Error('照片識別碼屬於其他批次，禁止移用');
  if(new Set(rows.filter(r=>r.rowKey).map(r=>r.rowKey)).size!==rows.filter(r=>r.rowKey).length)throw new Error('照片識別碼重複');
  if(!this.project)throw new Error('請先建立或開啟雲端批次');
  // Refresh must match the loaded revision. Never silently replace concurrent AI edits.
  const loaded=this.project;await this.open(loaded.id);
  if(this.project.revision!==loaded.revision){this.project=loaded;throw new Error('雲端已由其他裝置或 AI 更新，請先讀取雲端版本');}
  const prior=this.project.images.map(decodeRow).filter(r=>r&&r.batch===batch);
  if(prior.some(p=>!rows.some(r=>r.rowKey===p.rowKey)))throw new Error('本機少了雲端照片；請重新開啟批次。刪除請在工作台回收區操作');
  for(let i=0;i<rows.length;i++){
   const row=rows[i];row.rowKey??=crypto.randomUUID();const description=encodeRow(row,i,batch);
   const old=this.project.images.find(x=>decodeRow(x)?.rowKey===row.rowKey);
   if(old?.description===description)continue;
   if(old)this.project=await this.request('images',{action:'update',projectId:this.project.id,revision:this.project.revision,key:crypto.randomUUID(),imageId:old.id,description,recordId:old.recordId,stageId:old.stageId});
   else {const f=new FormData();Object.entries({projectId:this.project.id,revision:String(this.project.revision),key:'ps-'+row.rowKey,description,recordId:'',stageId:''}).forEach(([k,v])=>f.set(k,v));f.set('file',row.blob,'photo-'+row.rowKey+'.jpg');this.project=await this.request('images',f);}
  }
  const p=await this.open(this.project.id);
  for(let i=0;i<rows.length;i++)if(!p.images.some(im=>im.description===encodeRow(rows[i],i,batch)))throw new Error('雲端讀回不符，請保留本機資料並重新讀取');
  return p;
 }
 async loadRows(batch){
  const result=[];
  try{for(const r of this.project.images.map(decodeRow).filter(r=>r&&r.batch===batch).sort((a,b)=>a.order-b.order)){
   const access=await this.request('images?projectId='+this.project.id+'&imageId='+r.imageId);
   const response=await fetch(access.url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('照片下載失敗');const blob=await response.blob();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!==access.image.sha256)throw new Error('照片雜湊不符');result.push({...r,blob,url:URL.createObjectURL(blob)});
  }return result;}catch(e){result.forEach(r=>URL.revokeObjectURL(r.url));throw e;}
 }
}
