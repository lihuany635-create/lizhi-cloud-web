type Batch={expiresIn:number;urls:{imageId:string;url:string}[]};
export function imageTimeout<T>(task:()=>Promise<T>,ms=15000):Promise<T>{
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('圖片讀取逾時，請按重試')),ms);Promise.resolve().then(task).then(resolve,reject).finally(()=>clearTimeout(timer));});
}
// One queue per mounted project: coalesce cards, deduplicate reads, never retry writes.
export function createImageAccess(read:(ids:string[])=>Promise<Batch>,now=Date.now,timeoutMs=15000){
 const cache=new Map<string,{url:string;until:number}>(),pending=new Map<string,{resolve:(url:string)=>void;reject:(error:unknown)=>void}[]>();
 const inflight=new Map<string,Promise<string>>();let running=false;
 async function flush(){
  if(running)return;running=true;
  try{while(pending.size){
   const entries=[...pending.entries()].slice(0,50);for(const [id]of entries)pending.delete(id);
   try{const batch=await imageTimeout(()=>read(entries.map(([id])=>id)),timeoutMs),urls=new Map(batch.urls.map(x=>[x.imageId,x.url]));
    for(const [id,waiters]of entries){const url=urls.get(id);if(!url){for(const w of waiters)w.reject(Error('圖片連結未取得，請重試'));continue;}cache.set(id,{url,until:now()+Math.max(0,batch.expiresIn-30)*1000});for(const w of waiters)w.resolve(url);}
   }catch(error){for(const [,waiters]of entries)for(const w of waiters)w.reject(error);}
  }}finally{running=false;}
 }
 return {get(id:string,refresh=false){
  if(refresh)cache.delete(id);const saved=cache.get(id);if(saved&&saved.until>now())return Promise.resolve(saved.url);
  const current=inflight.get(id);if(current)return current;
  const request=new Promise<string>((resolve,reject)=>{pending.set(id,[{resolve,reject}]);queueMicrotask(()=>void flush());});
  inflight.set(id,request);const clear=()=>inflight.delete(id);void request.then(clear,clear);return request;
 }};
}
