// 裝置資料夾的預覽縮圖：只在第一次看到某張圖時解碼一次，縮成小圖存在這個瀏覽器，之後直接取用。
// 只影響「圖片來源」清單的預覽；加入畫布、交接、校驗仍讀原圖，不受影響。
const DB='yinggou-source-thumbs',STORE='thumbs',EDGE=360,QUALITY=.74,LIMIT=3000;
let opened=null;

function db(){
 opened??=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{const store=request.result.createObjectStore(STORE);store.createIndex('at','at')};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 }).catch(()=>null);
 return opened;
}

async function tx(mode,run){
 const database=await db();if(!database)return null;
 return new Promise(resolve=>{try{const t=database.transaction(STORE,mode),req=run(t.objectStore(STORE));t.oncomplete=()=>resolve(req?.result??null);t.onerror=t.onabort=()=>resolve(null)}catch{resolve(null)}});
}

const keyOf=(ref,file)=>[ref.root_id,...ref.path].join('/')+'|'+file.size+'|'+file.lastModified;

async function shrink(file){
 // 依長邊縮放並保留 EXIF 方向；不支援時回傳 null，由呼叫端改用原檔
 if(typeof createImageBitmap!=='function')return null;
 const probe=await createImageBitmap(file,{imageOrientation:'from-image',resizeWidth:EDGE,resizeQuality:'medium'});
 let bitmap=probe;
 if(probe.height>probe.width*1.05){probe.close();bitmap=await createImageBitmap(file,{imageOrientation:'from-image',resizeHeight:EDGE,resizeQuality:'medium'})}
 try{
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(bitmap.width,bitmap.height):Object.assign(document.createElement('canvas'),{width:bitmap.width,height:bitmap.height});
  canvas.getContext('2d').drawImage(bitmap,0,0);
  return canvas.convertToBlob?await canvas.convertToBlob({type:'image/jpeg',quality:QUALITY}):await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',QUALITY));
 }finally{bitmap.close()}
}

let writes=0;
async function prune(){
 const total=await tx('readonly',store=>store.count());if(!total||total<=LIMIT)return;
 const database=await db();if(!database)return;
 await new Promise(resolve=>{const t=database.transaction(STORE,'readwrite');let remove=total-Math.floor(LIMIT*.8);
  t.objectStore(STORE).index('at').openCursor().onsuccess=event=>{const cursor=event.target.result;if(cursor&&remove-->0){cursor.delete();cursor.continue()}};
  t.oncomplete=t.onerror=t.onabort=()=>resolve()});
}

// 回傳 {url, cached}；url 用完請 URL.revokeObjectURL
export async function sourceThumbnail(ref,file){
 const key=keyOf(ref,file),hit=await tx('readonly',store=>store.get(key));
 if(hit?.blob)return {url:URL.createObjectURL(hit.blob),cached:true};
 let blob=null;try{blob=await shrink(file)}catch{blob=null}
 if(!blob)return {url:URL.createObjectURL(file),cached:false};
 void tx('readwrite',store=>store.put({blob,at:Date.now()},key)).then(()=>{if(++writes%50===0)prune()});
 return {url:URL.createObjectURL(blob),cached:false};
}
