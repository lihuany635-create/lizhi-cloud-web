// 裝置資料夾的預覽縮圖：只在第一次看到某張圖時解碼一次，縮成小圖存在這個瀏覽器，之後直接取用。
// 只影響「圖片來源」清單的預覽；加入畫布、交接、校驗仍讀原圖，不受影響。
const DB='yinggou-source-thumbs',STORE='thumbs',LISTS='listings',EDGE=360,QUALITY=.74,LIMIT=3000,LIST_LIMIT=60;
let opened=null;

function db(){
 opened??=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,2);
  request.onupgradeneeded=()=>{const database=request.result;
   if(!database.objectStoreNames.contains(STORE))database.createObjectStore(STORE).createIndex('at','at');
   if(!database.objectStoreNames.contains(LISTS))database.createObjectStore(LISTS).createIndex('at','at');};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>resolve(null);
 }).catch(()=>null);
 return opened;
}

async function tx(mode,run,name=STORE){
 const database=await db();if(!database)return null;
 return new Promise(resolve=>{try{const t=database.transaction(name,mode),req=run(t.objectStore(name));t.oncomplete=()=>resolve(req?.result??null);t.onerror=t.onabort=()=>resolve(null)}catch{resolve(null)}});
}

// 以圖片位置為鍵，另存大小與修改時間：重開時可先用位置取出縮圖，再用檔案資訊核對是否過期
const keyOf=ref=>[ref.root_id,...ref.path].join('/');

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
 const key=keyOf(ref),hit=await tx('readonly',store=>store.get(key));
 if(hit?.blob&&hit.size===file.size&&hit.lastModified===file.lastModified)return {url:URL.createObjectURL(hit.blob),cached:true};
 let blob=null;try{blob=await shrink(file)}catch{blob=null}
 if(!blob)return {url:URL.createObjectURL(file),cached:false};
 void tx('readwrite',store=>store.put({blob,size:file.size,lastModified:file.lastModified,at:Date.now()},key)).then(()=>{if(++writes%50===0)prune()});
 return {url:URL.createObjectURL(blob),cached:false};
}

// 不碰手機檔案系統，只用位置取出上次的縮圖（可能已過期，之後會再核對）
export async function peekThumbnail(ref){
 const hit=await tx('readonly',store=>store.get(keyOf(ref)));
 return hit?.blob?URL.createObjectURL(hit.blob):null;
}

// 記住每個位置上次列出的清單，下次先顯示，背景再核對最新內容
const listKey=(location,recursive)=>[location.root_id,...location.path].join('/')+(recursive?'|r':'');
export async function cachedListing(location,recursive){
 const hit=await tx('readonly',store=>store.get(listKey(location,recursive)),LISTS);
 return hit?.result||null;
}
export async function saveListing(location,recursive,result){
 if(!result||result.truncated&&!result.images.length)return;
 const slim={...result,images:result.images.slice(0,5000),unreadable:(result.unreadable||[]).slice(0,20)};
 await tx('readwrite',store=>store.put({result:slim,at:Date.now()},listKey(location,recursive)),LISTS);
 const total=await tx('readonly',store=>store.count(),LISTS);
 if(total>LIST_LIMIT){const database=await db();if(!database)return;await new Promise(resolve=>{const t=database.transaction(LISTS,'readwrite');let remove=total-LIST_LIMIT;t.objectStore(LISTS).index('at').openCursor().onsuccess=e=>{const c=e.target.result;if(c&&remove-->0){c.delete();c.continue()}};t.oncomplete=t.onerror=t.onabort=()=>resolve()})}
}
