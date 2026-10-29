/* Private model assets (立之雲端庫).
 * Models, previews, manifests and review pages live in the private Supabase bucket
 * "lizhi-models"; only the owner's signed-in session can read them (RLS).
 * Downloads are cached in IndexedDB so the same version is never fetched twice:
 *   - GLBs are keyed by their SHA-256 (the viewer re-verifies the hash after loading);
 *   - other files are keyed by path + the manifest version that lists them.
 * Every storage access is wrapped so a blocked IndexedDB only costs a re-download.
 */
(function(){
  'use strict';
  const BUCKET='lizhi-models',DB_NAME='lizhi-model-cache',STORE='files';
  let client=null,dbPromise=null;

  function sb(){
    if(client)return client;
    if(!window.supabase||!window.LIZHI_SUPABASE_URL)throw loginError('雲端設定未載入，請重新整理。');
    client=window.supabase.createClient(window.LIZHI_SUPABASE_URL,window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      {auth:{persistSession:true,autoRefreshToken:true}});
    return client;
  }
  function loginError(message){const e=new Error(message);e.code='LOGIN_REQUIRED';return e;}
  const clean=path=>String(path).split('?')[0].split('#')[0].replace(/^\.?\//,'');

  function db(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{
      try{
        const req=indexedDB.open(DB_NAME,1);
        req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>resolve(null);
      }catch(_e){resolve(null);}
    });
    return dbPromise;
  }
  async function cacheGet(key){
    if(!key)return null;
    try{const d=await db();if(!d)return null;
      return await new Promise(r=>{const q=d.transaction(STORE).objectStore(STORE).get(key);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null);});
    }catch(_e){return null;}
  }
  async function cachePut(key,blob){
    if(!key)return;
    try{const d=await db();if(!d)return;
      await new Promise(r=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(blob,key);t.oncomplete=r;t.onerror=r;t.onabort=r;});
    }catch(_e){}
  }
  async function forget(key){
    try{const d=await db();if(!d||!key)return;
      await new Promise(r=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(key);t.oncomplete=r;t.onerror=r;});
    }catch(_e){}
  }

  async function session(){
    const {data,error}=await sb().auth.getSession();
    if(error||!data?.session)throw loginError('請先在立之雲端庫登入你的帳號，才能載入模型與預覽圖。');
    return data.session;
  }

  /** Download one private file as a Blob. onProgress(0..1) is reported when the size is known. */
  async function blob(path,{cacheKey=null,onProgress=null}={}){
    const hit=await cacheGet(cacheKey);
    if(hit){if(onProgress)onProgress(1);return hit;}
    await session();
    const {data,error}=await sb().storage.from(BUCKET).createSignedUrl(clean(path),120);
    if(error||!data?.signedUrl){
      const e=new Error('找不到或無權讀取：'+clean(path));e.code='NOT_AVAILABLE';throw e;
    }
    const res=await fetch(data.signedUrl,{cache:'no-store'});
    if(!res.ok){const e=new Error('讀取失敗（'+res.status+'）：'+clean(path));e.code='DOWNLOAD_FAILED';throw e;}
    const total=+res.headers.get('content-length')||0,type=res.headers.get('content-type')||'';
    let out;
    if(onProgress&&total&&res.body){
      const reader=res.body.getReader(),chunks=[];let got=0;
      for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);got+=value.length;onProgress(got/total);}
      out=new Blob(chunks,{type});
    }else out=await res.blob();
    await cachePut(cacheKey,out);
    return out;
  }
  async function bytes(path,opts){return new Uint8Array(await (await blob(path,opts)).arrayBuffer());}
  /** Manifests and reports: always fresh (they are small). */
  async function json(path){return JSON.parse(await (await blob(path)).text());}
  const urls=new Map();
  async function objectURL(path,opts){
    const k=(opts&&opts.cacheKey)||clean(path);
    if(urls.has(k))return urls.get(k);
    const u=URL.createObjectURL(await blob(path,opts));urls.set(k,u);return u;
  }
  async function signedIn(){try{await session();return true;}catch(_e){return false;}}

  window.LizhiModels={BUCKET,client:sb,session,signedIn,blob,bytes,json,objectURL,forget,clean,
    loginURL:()=>new URL('../index.html',location.href).href};
})();
