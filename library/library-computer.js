// 立之圖書館｜電腦來源：僅為使用者選取的資料夾建立索引，不上傳原檔。
// Chrome／Edge 桌面版 File System Access API；手機只讀取已同步的館藏索引。
(function(global){
  "use strict";
  const DB="lizhi-library-computer",STORE="folders",KEY="active";
  const DESKTOP=!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const supported=DESKTOP&&typeof global.showDirectoryPicker==="function";
  const EXT=/\.(pdf|docx|xlsx?|ods|pptx|txt|md|markdown|csv|tsv|json|html?|xml|ya?ml|jpg|jpeg|png|gif|webp|bmp|avif|mp3|wav|m4a|flac|ogg|mp4|mov|webm|mkv|glb|gltf)$/i;
  const IGNORED=new Set([".git",".svn",".hg","node_modules",".venv","venv","__pycache__","$RECYCLE.BIN","System Volume Information"]);
  let linked=null,status=supported?"loading":"unsupported",initPromise=null;

  function db(mode,callback){
    return new Promise((resolve,reject)=>{
      const open=indexedDB.open(DB,1);
      open.onupgradeneeded=()=>open.result.createObjectStore(STORE);
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{
        const conn=open.result,tx=conn.transaction(STORE,mode);
        let result;
        try{result=callback(tx.objectStore(STORE));}
        catch(error){conn.close();reject(error);return;}
        tx.oncomplete=()=>{conn.close();resolve(result?.result);};
        tx.onerror=()=>{conn.close();reject(tx.error);};
      };
    });
  }

  async function permission(handle,request=false){
    const options={mode:"read"};
    try{
      return (request?await handle.requestPermission(options):await handle.queryPermission(options))==="granted";
    }catch{return false;}
  }
  async function init(){
    if(!supported)return status;
    if(initPromise)return initPromise;
    initPromise=(async()=>{
      try{
        linked=await db("readonly",store=>store.get(KEY))||null;
        status=!linked?"none":await permission(linked.handle)?"ready":"needs-permission";
      }catch{linked=null;status="none";}
      return status;
    })();
    return initPromise;
  }
  async function link(){
    if(!supported)throw new Error("請在 Windows 電腦使用 Chrome 或 Edge 連結資料夾。");
    // 必須在使用者直接按下按鈕後立即叫出選取器。
    const handle=await global.showDirectoryPicker({id:"lizhi-library-computer",mode:"read",startIn:"documents"});
    const same=linked?.handle?.isSameEntry?await linked.handle.isSameEntry(handle).catch(()=>false):false;
    const record={id:same?linked.id:crypto.randomUUID(),name:handle.name,handle};
    await db("readwrite",store=>store.put(record,KEY));
    linked=record;status="ready";initPromise=Promise.resolve(status);
    return handle.name;
  }
  async function grant(){
    await init();
    if(!linked)return false;
    status=await permission(linked.handle,true)?"ready":"needs-permission";
    return status==="ready";
  }
  async function unlink(){
    await db("readwrite",store=>store.delete(KEY));
    linked=null;status=supported?"none":"unsupported";initPromise=Promise.resolve(status);
  }
  async function root(){
    await init();
    if(!linked)throw new Error("尚未連結電腦資料夾");
    if(status!=="ready"&&!await grant())throw new Error("尚未允許讀取電腦資料夾");
    return linked.handle;
  }
  function validPath(path){
    const parts=String(path||"").split("/");
    if(!parts.length||parts.some(part=>!part||part==="."||part===".."||part.startsWith(".")))throw new Error("不合法的電腦館藏路徑");
    return parts;
  }
  async function read(path){
    const parts=validPath(path);let dir=await root();
    for(const part of parts.slice(0,-1))dir=await dir.getDirectoryHandle(part);
    return (await dir.getFileHandle(parts[parts.length-1])).getFile();
  }
  function canRead(item){return status==="ready"&&!!linked&&item?.location==="computer"&&item.computer_id===linked.id;}
  async function scan({limit=750}={}){
    const base=await root(),entries=[];let truncated=false;
    async function walk(dir,prefix,depth){
      if(depth>12){truncated=true;return;}
      for await(const [name,handle] of dir.entries()){
        if(name.startsWith(".")||IGNORED.has(name))continue;
        if(handle.kind==="directory"){await walk(handle,prefix+name+"/",depth+1);if(truncated)return;continue;}
        if(handle.kind!=="file"||!EXT.test(name))continue;
        const path=prefix+name;if(path.length>1000)continue;
        if(entries.length>=limit){truncated=true;return;}
        try{const file=await handle.getFile();entries.push({path,file});}
        catch{/* 已移走或無權讀取的檔案，略過 */}
      }
    }
    await walk(base,"",0);
    return {entries,truncated,computerId:linked.id,computerName:linked.name};
  }
  global.LibraryComputer=Object.freeze({
    supported,init,link,grant,unlink,scan,read,canRead,
    get status(){return status;},get name(){return linked?.name||"";},
    get id(){return linked?.id||null;}
  });
})(window);
