// 立之圖書館：把檔案存在手機（或電腦）上自己選的資料夾。
// Android 版 Chrome 132 起與桌面版 Chrome／Edge 支援；資料夾授權保存在這台裝置的瀏覽器裡。
(function(global){
  "use strict";

  const DB="lizhi-library-device",STORE="handles",KEY="root";
  const supported=typeof global.showDirectoryPicker==="function";
  let root=null,status=supported?"loading":"unsupported",ready=null;

  function idb(mode,fn){
    return new Promise((resolve,reject)=>{
      const open=indexedDB.open(DB,1);
      open.onupgradeneeded=()=>open.result.createObjectStore(STORE);
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{
        const tx=open.result.transaction(STORE,mode),request=fn(tx.objectStore(STORE));
        tx.oncomplete=()=>{resolve(request?.result);open.result.close();};
        tx.onerror=()=>{reject(tx.error);open.result.close();};
      };
    });
  }

  // 開頁時讀回上次選的資料夾；權限通常要使用者點一下才會恢復
  function init(){
    if(!supported)return Promise.resolve(status);
    ready??=(async()=>{
      try{
        root=await idb("readonly",store=>store.get(KEY))||null;
        if(!root)status="none";
        else status=(await root.queryPermission({mode:"readwrite"}))==="granted"?"ready":"needs-permission";
      }catch{root=null;status="none";}
      return status;
    })();
    return ready;
  }

  async function link(){
    if(!supported)throw new Error("這個瀏覽器不能選資料夾，請用 Chrome（Android 版 132 以上）");
    const handle=await global.showDirectoryPicker({id:"lizhi-library",mode:"readwrite",startIn:"documents"});
    await idb("readwrite",store=>store.put(handle,KEY));
    root=handle;status="ready";
    return handle.name;
  }

  async function unlink(){
    await idb("readwrite",store=>store.delete(KEY)).catch(()=>{});
    root=null;status=supported?"none":"unsupported";
  }

  // 必須在點擊事件裡呼叫
  async function grant(){
    if(!root)return false;
    const result=await root.requestPermission({mode:"readwrite"});
    status=result==="granted"?"ready":"needs-permission";
    return status==="ready";
  }

  async function requireRoot(){
    await init();
    if(!root)throw new Error("還沒有連結手機資料夾");
    if(status!=="ready"&&!(await grant()))throw new Error("需要允許存取手機資料夾");
    return root;
  }

  const safeName=name=>String(name||"未命名").replace(/[\\/:*?"<>|\u0000-\u001f]+/g,"-").replace(/^\.+/,"").slice(0,180)||"未命名";

  async function exists(dir,name){try{await dir.getFileHandle(name);return true;}catch{return false;}}

  // 寫入檔案，同名時自動加上 (2)、(3)…；回傳實際檔名
  async function write(file,preferred){
    const dir=await requireRoot();
    const clean=safeName(preferred||file.name),dot=clean.lastIndexOf(".");
    const stem=dot>0?clean.slice(0,dot):clean,ext=dot>0?clean.slice(dot):"";
    let name=clean,n=2;
    while(await exists(dir,name))name=`${stem} (${n++})${ext}`;
    const handle=await dir.getFileHandle(name,{create:true});
    const writer=await handle.createWritable();
    try{await writer.write(file);await writer.close();}
    catch(error){try{await writer.abort();}catch{}try{await dir.removeEntry(name);}catch{}throw error;}
    return name;
  }

  async function read(name){
    const dir=await requireRoot();
    try{return await (await dir.getFileHandle(name)).getFile();}
    catch{throw new Error(`手機資料夾裡找不到「${name}」，可能被移動或刪除了`);}
  }

  async function remove(name){
    const dir=await requireRoot();
    try{await dir.removeEntry(name);}catch{}
  }

  // 資料夾第一層的檔案（不含子資料夾與隱藏檔）
  async function list(){
    const dir=await requireRoot(),files=[];
    for await (const [name,handle] of dir.entries()){
      if(handle.kind!=="file"||name.startsWith("."))continue;
      files.push(name);
    }
    return files;
  }

  global.LibraryDevice=Object.freeze({
    supported,init,link,unlink,grant,write,read,remove,list,
    get status(){return status;},get name(){return root?.name||"";}
  });
})(window);
