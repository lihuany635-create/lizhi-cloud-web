import {PROJECT_IMAGE_BYTES,capacityError} from './limits.mjs';
const PNG=[137,80,78,71,13,10,26,10];
export const IMAGE_ACCEPT='.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';
export function rasterMime(bytes){
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 let mime='';
 if(b.length>=24&&PNG.every((value,i)=>b[i]===value))mime='image/png';
 else if(b.length>=4&&b[0]===255&&b[1]===216&&b[2]===255)mime='image/jpeg';
 else if(b.length>=16&&new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP')mime='image/webp';
 if(!mime)throw Error('僅支援內容有效的 PNG、JPG 或 WebP 圖片');
 // Providers can label PNG bytes as JPEG (or vice versa). Use the actual
 // raster signature; the caller still decodes the image before importing it.
 return mime;
}
export async function prepareRasterFile(file){
 if(file.size>10*1024*1024)throw Error('單張圖片上限為 10 MiB');
 const buffer=await file.arrayBuffer(),mime=rasterMime(buffer);
 return {buffer,mime,blob:new Blob([buffer],{type:mime})};
}
export async function readImageBatch(files,readImage,usedBytes,maxBytes=PROJECT_IMAGE_BYTES){
 const versions=[],errors=[];let total=usedBytes;
 for(const file of files){
  try{
   if(Number.isFinite(file.size)&&total+file.size>maxBytes)throw Error(capacityError(total,maxBytes));
   const version=await readImage(file);
   if(total+version.byte_size>maxBytes)throw Error(capacityError(total,maxBytes));
   versions.push(version);total+=version.byte_size;
  }catch(e){errors.push({name:file.name||'未命名圖片',reason:e?.message||'無法讀取圖片'})}
 }
 return {versions,errors,total};
}
