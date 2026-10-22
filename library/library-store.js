// 立之圖書館：Supabase 資料表、雲端檔案空間與手機資料夾的讀寫。
// 檔案本體可以在雲端（location=cloud）或手機資料夾（location=device）；
// 不論存哪裡，抽出的文字與縮圖都放雲端，讓 Claude 能整理。
(function(global){
  "use strict";

  const TABLE="lizhi_library_items";
  const BUCKET="lizhi-library";
  const MAX_CLOUD_BYTES=50*1024*1024;
  const COLUMNS="id,file_name,mime,size,storage_path,location,device_path,computer_id,computer_name,computer_path,computer_modified_at,thumb,extract_status,extract_note,user_note,status,shelf,title,summary,tags,key_points,related_ids,organized_at,created_at,updated_at";

  const auth=()=>global.LizhiAuth;
  const client=()=>auth()?.client;
  const user=()=>auth()?.user||null;
  const available=()=>!!(client()&&user());
  const device=()=>global.LibraryDevice;

  function requireReady(){if(!available())throw new Error("請先登入雲端版立之雲端庫");}

  async function list(){
    requireReady();
    const {data,error}=await client().from(TABLE).select(COLUMNS).is("deleted_at",null).order("created_at",{ascending:false}).limit(1000);
    if(error)throw friendly(error);
    return data||[];
  }

  async function insertRow(file,extracted,{id,note,location,storagePath=null,devicePath=null}){
    const row={
      id,user_id:user().id,file_name:file.name.slice(0,300),mime:file.type||"",size:file.size,
      location,storage_path:storagePath,device_path:devicePath,
      text_excerpt:extracted.text,thumb:extracted.thumb,extract_status:extracted.status,extract_note:extracted.note||null,
      user_note:String(note||"").trim()||null
    };
    const {data,error}=await client().from(TABLE).insert(row).select(COLUMNS).single();
    if(error)throw friendly(error);
    return data;
  }

  // target: "cloud" 或 "device"；onStage(stage) 回報 extract / upload / save
  async function upload(file,{note="",target="cloud",onStage=()=>{}}={}){
    requireReady();
    if(target==="cloud"&&file.size>MAX_CLOUD_BYTES)throw new Error("雲端單檔上限 50 MB，請改存手機資料夾");
    const id=crypto.randomUUID();

    onStage("extract");
    const extracted=await global.LibraryExtract.extract(file);

    onStage("upload");
    if(target==="device"){
      const name=await device().write(file);
      onStage("save");
      try{return await insertRow(file,extracted,{id,note,location:"device",devicePath:name});}
      catch(error){await device().remove(name).catch(()=>{});throw error;}
    }

    const kind=global.LibraryExtract.ext(file.name);
    const path=`${user().id}/${id}${kind?"."+kind:""}`;
    const {error:uploadError}=await client().storage.from(BUCKET).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
    if(uploadError)throw friendly(uploadError);
    onStage("save");
    try{return await insertRow(file,extracted,{id,note,location:"cloud",storagePath:path});}
    catch(error){await client().storage.from(BUCKET).remove([path]).catch(()=>{});throw error;}
  }

  // 手機資料夾裡已經有、但還沒登記的檔案：只抽文字並登記，不再寫一次
  async function register(name,{onStage=()=>{}}={}){
    requireReady();
    const file=await device().read(name);
    onStage("extract");
    const extracted=await global.LibraryExtract.extract(file);
    onStage("save");
    return insertRow(file,extracted,{id:crypto.randomUUID(),note:"",location:"device",devicePath:name});
  }

  // 電腦原檔不進入 Storage；索引同步到 Supabase，手機也能搜尋。
  async function registerComputer(entry,source){
    requireReady();
    const {file,path}=entry;
    const extracted=await global.LibraryExtract.extract(file);
    const payload={user_id:user().id,location:"computer",computer_id:source.computerId,
      computer_name:source.computerName,computer_path:path,
      computer_modified_at:new Date(file.lastModified||Date.now()).toISOString(),
      file_name:file.name.slice(0,300),mime:file.type||"",size:file.size,
      storage_path:null,device_path:null,text_excerpt:extracted.text,thumb:extracted.thumb,
      extract_status:extracted.status,extract_note:extracted.note||null};
    const {data:existing,error:findError}=await client().from(TABLE).select("id,size,computer_modified_at").eq("computer_id",source.computerId).eq("computer_path",path).is("deleted_at",null).limit(1);
    if(findError)throw friendly(findError);
    if(existing?.length){
      const prev=existing[0];
      if(Number(prev.size)===file.size&&new Date(prev.computer_modified_at).getTime()===(file.lastModified||0))return {skipped:true};
      const {data,error}=await client().from(TABLE).update({...payload,status:"inbox",title:null,summary:null,tags:[],key_points:[],related_ids:[],shelf:null,organized_at:null,organized_by:null}).eq("id",prev.id).select(COLUMNS).single();
      if(error)throw friendly(error);return {row:data};
    }
    const {data,error}=await client().from(TABLE).insert({...payload,id:crypto.randomUUID()}).select(COLUMNS).single();
    if(error)throw friendly(error);return {row:data};
  }

  // 雲端的檔案搬到手機資料夾，搬完刪掉雲端那份
  async function moveToDevice(item){
    requireReady();
    if(item.location!=="cloud")return item;
    const cloudPath=item.storage_path;
    const {data:blob,error}=await client().storage.from(BUCKET).download(cloudPath);
    if(error)throw friendly(error);
    const file=new File([blob],item.file_name,{type:item.mime||blob.type});
    const name=await device().write(file);
    let row;
    try{row=await update(item.id,{location:"device",device_path:name,storage_path:null});}
    catch(err){await device().remove(name).catch(()=>{});throw err;}
    await client().storage.from(BUCKET).remove([cloudPath]).catch(()=>{});
    return row;
  }

  // 開啟閱讀器時才抓大欄位（抽出的全文）
  async function detail(id){
    requireReady();
    const {data,error}=await client().from(TABLE).select("id,text_excerpt,extract_note").eq("id",id).single();
    if(error)throw friendly(error);
    return data;
  }

  // 內文搜尋：回傳 [{id, snippet}]
  async function search(q){
    requireReady();
    const term=String(q||"").trim();
    if(!term)return [];
    const {data,error}=await client().rpc("lizhi_library_search",{q:term.slice(0,100)});
    if(error)throw friendly(error);
    return data||[];
  }

  // 取得檔案網址：雲端用暫時簽名網址，手機資料夾用本機 blob 網址
  async function openUrl(item,{download=false}={}){
    requireReady();
    if(item.location==="device")return URL.createObjectURL(await device().read(item.device_path));
    if(item.location==="computer"){
      if(!global.LibraryComputer?.canRead(item))throw new Error("原檔在電腦上；請回到已連結的電腦開啟，手機可閱讀文字摘錄。");
      return URL.createObjectURL(await global.LibraryComputer.read(item.computer_path));
    }
    const {data,error}=await client().storage.from(BUCKET).createSignedUrl(item.storage_path,300,download?{download:item.file_name}:undefined);
    if(error)throw friendly(error);
    return data.signedUrl;
  }

  async function update(id,patch){
    requireReady();
    const {data,error}=await client().from(TABLE).update(patch).eq("id",id).select(COLUMNS).single();
    if(error)throw friendly(error);
    return data;
  }

  // 刪除：檔案本體移除，資料列留下刪除時間
  async function remove(item,{deleteDeviceFile=true}={}){
    requireReady();
    if(item.location==="device"){if(deleteDeviceFile)await device().remove(item.device_path);}
    else if(item.location==="computer"){ /* 僅移除館藏索引，不刪除電腦原檔 */ }
    else await client().storage.from(BUCKET).remove([item.storage_path]);
    const {error}=await client().from(TABLE).update({deleted_at:new Date().toISOString()}).eq("id",item.id);
    if(error)throw friendly(error);
  }

  function friendly(error){
    const message=String(error?.message||error||"");
    if(/relation .*lizhi_library_items.* does not exist|Bucket not found|lizhi_library_search|schema cache/i.test(message))
      return new Error("圖書館的雲端空間還沒建立好");
    if(/row-level security|not authorized|permission/i.test(message))return new Error("這個帳號沒有圖書館的存取權限");
    if(/exceeded the maximum allowed size|Payload too large/i.test(message))return new Error("檔案超過雲端空間的大小上限");
    if(/location_check/i.test(message))return new Error("檔案位置資料不完整");
    return new Error(message||"雲端操作失敗");
  }

  global.LibraryStore=Object.freeze({available,list,detail,search,upload,register,registerComputer,moveToDevice,openUrl,update,remove,MAX_CLOUD_BYTES});
})(window);
