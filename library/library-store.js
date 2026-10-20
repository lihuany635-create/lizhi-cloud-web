// 立之圖書館：Supabase 資料表與私有檔案空間的讀寫。
(function(global){
  "use strict";

  const TABLE="lizhi_library_items";
  const BUCKET="lizhi-library";
  const MAX_BYTES=50*1024*1024;
  const COLUMNS="id,file_name,mime,size,storage_path,thumb,extract_status,extract_note,user_note,status,shelf,title,summary,tags,organized_at,created_at,updated_at";

  const auth=()=>global.LizhiAuth;
  const client=()=>auth()?.client;
  const user=()=>auth()?.user||null;
  const available=()=>!!(client()&&user());

  function requireReady(){if(!available())throw new Error("請先登入雲端版立之雲端庫");}

  async function list(){
    requireReady();
    const {data,error}=await client().from(TABLE).select(COLUMNS).is("deleted_at",null).order("created_at",{ascending:false}).limit(1000);
    if(error)throw friendly(error);
    return data||[];
  }

  // onStage(stage) 回報進度：extract / upload / save
  async function upload(file,{note="",onStage=()=>{}}={}){
    requireReady();
    if(file.size>MAX_BYTES)throw new Error("單一檔案上限 50 MB");
    const id=crypto.randomUUID();
    const kind=global.LibraryExtract.ext(file.name);
    const path=`${user().id}/${id}${kind?"."+kind:""}`;

    onStage("extract");
    const extracted=await global.LibraryExtract.extract(file);

    onStage("upload");
    const {error:uploadError}=await client().storage.from(BUCKET).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
    if(uploadError)throw friendly(uploadError);

    onStage("save");
    const row={
      id,user_id:user().id,file_name:file.name.slice(0,300),mime:file.type||"",size:file.size,storage_path:path,
      text_excerpt:extracted.text,thumb:extracted.thumb,extract_status:extracted.status,extract_note:extracted.note||null,
      user_note:note.trim()||null
    };
    const {data,error}=await client().from(TABLE).insert(row).select(COLUMNS).single();
    if(error){await client().storage.from(BUCKET).remove([path]).catch(()=>{});throw friendly(error);}
    return data;
  }

  async function openUrl(item,{download=false}={}){
    requireReady();
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

  // 刪除：檔案本體直接移除，資料列留下刪除時間（避免 Claude 正在整理時出錯）
  async function remove(item){
    requireReady();
    await client().storage.from(BUCKET).remove([item.storage_path]);
    const {error}=await client().from(TABLE).update({deleted_at:new Date().toISOString()}).eq("id",item.id);
    if(error)throw friendly(error);
  }

  function friendly(error){
    const message=String(error?.message||error||"");
    if(/relation .*lizhi_library_items.* does not exist|Bucket not found|schema cache/i.test(message))
      return new Error("圖書館的雲端空間還沒建立（需要套用 008_lizhi_library.sql）");
    if(/row-level security|not authorized|permission/i.test(message))return new Error("這個帳號沒有圖書館的存取權限");
    if(/exceeded the maximum allowed size|Payload too large/i.test(message))return new Error("檔案超過雲端空間的大小上限");
    return new Error(message||"雲端操作失敗");
  }

  global.LibraryStore=Object.freeze({available,list,upload,openUrl,update,remove,MAX_BYTES});
})(window);
