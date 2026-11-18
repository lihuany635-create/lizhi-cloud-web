// Library-owned MCP capabilities. All database and storage actions use the user-scoped
// OAuth Supabase client supplied by withSupabase({auth:"user"}): no admin client.
import { z } from "npm:zod@4.6.7";

const BUCKET="lizhi-library";
const MAX_SIZE=50*1024*1024;
const MIME={
  pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",
  webp:"image/webp",mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime",
  mp3:"audio/mpeg",wav:"audio/wav",txt:"text/plain",md:"text/markdown",
  docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;
const TYPES=Object.values(MIME);
const readAnn={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const writeAnn={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
const archiveAnn={readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:false};
const oauth=[{type:"oauth2" as const,scopes:["email"]}];

function output(data:Record<string,unknown>){
  return {content:[{type:"text" as const,text:JSON.stringify(data)}],structuredContent:data};
}
function fail(message:string){return {isError:true,content:[{type:"text" as const,text:message}]};}
function fields(args:Record<string,unknown>,names:readonly string[]){
  const patch:Record<string,unknown>={};
  for(const name of names)if(Object.prototype.hasOwnProperty.call(args,name))patch[name]=args[name];
  return patch;
}
function readableError(error:unknown,fallback:string){
  // Never leak credentials or SQL statements in user-visible error messages.
  return fail(fallback+(error?"（請在正式服務日誌查詢詳細原因）":""));
}
async function currentUser(supabase:any){
  const {data,error}=await supabase.auth.getUser();
  if(error||!data?.user?.id||String(data.user.email||"").toLowerCase()!=="lihuany635@gmail.com")
    throw Error("使用者驗證失敗");
  return data.user.id as string;
}
async function writable(supabase:any){
  const {data,error}=await supabase.rpc("lizhi_library_mcp_client_allowed",{p_write:true});
  return !error&&data===true;
}
function validateUploadMeta(meta:{file_name:string,mime:string,size:number}){
  const name=meta.file_name.trim();
  const extension=/\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() as keyof typeof MIME|undefined;
  if(!extension||!MIME[extension]||MIME[extension]!==meta.mime||
     /[/\\\u0000-\u001f]/.test(name)||name.startsWith(".")||name.includes(".."))
    throw Error("檔名與 MIME 類型不符或檔名不安全");
  if(meta.size<1||meta.size>MAX_SIZE||!Number.isSafeInteger(meta.size))
    throw Error("檔案必須在 1B 至 50MiB 之間");
  return extension;
}
const docFields=["direction","subject","doc_no","issuer","recipient","doc_date",
  "received_date","due_date","speed","secrecy","summary","tags","user_note",
  "status","drive_file_id","drive_folder_id","file_name","mime"] as const;
const docPatchSchema=z.object({
  direction:z.enum(["incoming","outgoing"]).optional(),
  subject:z.string().trim().max(1000).nullable().optional(),
  doc_no:z.string().trim().max(120).nullable().optional(),
  issuer:z.string().trim().max(120).nullable().optional(),
  recipient:z.string().trim().max(200).nullable().optional(),
  doc_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  received_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  speed:z.enum(["最速件","速件","普通件"]).nullable().optional(),
  secrecy:z.string().trim().max(20).nullable().optional(),
  summary:z.string().trim().max(4000).nullable().optional(),
  tags:z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  user_note:z.string().trim().max(2000).nullable().optional(),
  status:z.enum(["todo","doing","closed"]).optional(),
  drive_file_id:z.string().regex(/^[A-Za-z0-9_-]{8,200}$/).nullable().optional(),
  drive_folder_id:z.string().regex(/^[A-Za-z0-9_-]{8,200}$/).nullable().optional(),
  file_name:z.string().trim().max(300).nullable().optional(),
  mime:z.string().max(120).optional(),
});

export function registerLibraryOwnerTools(server:any,supabase:any,withRateLimit:any){
  const ro=(fn:(args:any)=>Promise<any>)=>withRateLimit(fn);
  const rw=(fn:(args:any)=>Promise<any>)=>withRateLimit(async(args:any)=>{
    if(!await writable(supabase))return fail("這個 MCP 用戶端沒有圖書館寫入授權；請先由本人核准。");
    return fn(args);
  });
  const register=(name:string,title:string,description:string,schema:any,fn:any,mode:"read"|"write"|"archive"="read")=>
    server.registerTool(name,{
      title,description,inputSchema:schema,
      _meta:{securitySchemes:oauth},
      annotations:mode==="read"?readAnn:mode==="archive"?archiveAnn:writeAnn,
    },mode==="read"?ro(fn):rw(fn));

  register("list_official_docs","查詢公文工作專區",
    "僅列出本人公文登記。Google Drive 原檔不會被下載。",
    z.object({
      direction:z.enum(["incoming","outgoing"]).optional(),
      status:z.enum(["todo","doing","closed"]).optional(),
      limit:z.number().int().min(1).max(50).default(20),
      offset:z.number().int().min(0).max(1000).default(0),
    }),async({direction,status,limit,offset}:any)=>{
      let query=supabase.from("lizhi_library_official_docs")
        .select("id,direction,subject,doc_no,issuer,recipient,doc_date,due_date,status,speed,secrecy,summary,tags,file_name,drive_file_id,updated_at,created_at")
        .is("deleted_at",null).order("created_at",{ascending:false})
        .range(offset,offset+limit-1);
      if(direction)query=query.eq("direction",direction);
      if(status)query=query.eq("status",status);
      const {data,error}=await query;
      return error?readableError(error,"無法查詢公文"):output({documents:data||[],next_offset:(data||[]).length===limit?offset+limit:null});
    });

  register("get_official_doc","讀取公文登記資料",
    "讀取本人公文欄位與最多 8000 字已抽取文字；不存取 Google Drive 原檔。",
    z.object({doc_id:z.string().uuid(),offset:z.number().int().min(0).max(250000).default(0)}),
    async({doc_id,offset}:any)=>{
      const {data,error}=await supabase.from("lizhi_library_official_docs")
        .select("id,direction,subject,doc_no,issuer,recipient,doc_date,received_date,due_date,status,closed_at,speed,secrecy,summary,tags,user_note,file_name,mime,drive_file_id,ai_status,ai_note,text_excerpt,updated_at")
        .eq("id",doc_id).is("deleted_at",null).maybeSingle();
      if(error)return readableError(error,"讀取公文失敗");
      if(!data)return fail("找不到公文或無權讀取");
      const {text_excerpt,...visible}=data;
      const text=String(text_excerpt||"");
      return output({...visible,text:text.slice(offset,offset+8000),
        next_offset:offset+8000<text.length?offset+8000:null});
    });

  register("update_library_item","修改館藏整理欄位",
    "依本人指示修改館藏書名、書架、摘要、標籤、重點、備註與整理狀態；不更動原檔。",
    z.object({
      item_id:z.string().uuid(),expected_updated_at:z.string().min(16).max(64),
      title:z.string().trim().max(200).nullable().optional(),
      shelf:z.string().trim().max(80).nullable().optional(),
      summary:z.string().trim().max(4000).nullable().optional(),
      tags:z.array(z.string().trim().min(1).max(60)).max(12).optional(),
      key_points:z.array(z.string().trim().min(1).max(1000)).max(12).optional(),
      user_note:z.string().trim().max(2000).nullable().optional(),
      status:z.enum(["inbox","organized","skipped"]).optional(),
    }),async(args:any)=>{
      const patch=fields(args,["title","shelf","summary","tags","key_points","user_note","status"]);
      if(!Object.keys(patch).length)return fail("至少提供一項要修改的欄位");
      const owner=await currentUser(supabase);
      const {data,error}=await supabase.from("lizhi_library_items").update(patch)
        .eq("id",args.item_id).eq("user_id",owner)
        .eq("updated_at",args.expected_updated_at).is("deleted_at",null)
        .select("id,title,shelf,summary,tags,key_points,user_note,status,updated_at").maybeSingle();
      if(error)return readableError(error,"修改館藏失敗");
      return data?output({updated:true,item:data}):fail("資料已更新或沒有權限；請重讀目前 updated_at 再修改");
    },"write");

  register("archive_library_item","將館藏移入回收狀態",
    "只有本人明確要求且 confirm=true 時執行軟刪。原始 Storage、手機與電腦檔案不刪除。",
    z.object({item_id:z.string().uuid(),expected_updated_at:z.string().min(16).max(64),confirm:z.literal(true)}),
    async({item_id,expected_updated_at}:any)=>{
      const owner=await currentUser(supabase);
      const {data,error}=await supabase.from("lizhi_library_items")
        .update({deleted_at:new Date().toISOString()})
        .eq("id",item_id).eq("user_id",owner)
        .eq("updated_at",expected_updated_at).is("deleted_at",null)
        .select("id,deleted_at").maybeSingle();
      if(error)return readableError(error,"封存館藏失敗");
      return data?output({archived:true,item_id:data.id,original_file_preserved:true}):fail("館藏不存在、已變更或無權限");
    },"archive");

  register("restore_library_item","恢復軟刪館藏",
    "根據本人明確指示恢復館藏索引；不覆寫原始檔。",
    z.object({item_id:z.string().uuid(),confirm:z.literal(true)}),
    async({item_id}:any)=>{
      const owner=await currentUser(supabase);
      const {data,error}=await supabase.from("lizhi_library_items")
        .update({deleted_at:null}).eq("id",item_id).eq("user_id",owner)
        .not("deleted_at","is",null).select("id,updated_at").maybeSingle();
      if(error)return readableError(error,"恢復館藏失敗");
      return data?output({restored:true,item_id:data.id}):fail("找不到可還原的館藏索引");
    },"write");

  register("create_official_doc","新增工作專區公文登記",
    "建立本人公文索引與欄位，不讀取、分享、刪除或搬動 Google Drive 原檔。",
    z.object({direction:z.enum(["incoming","outgoing"]),subject:z.string().trim().max(1000).optional(),
      drive_file_id:z.string().regex(/^[A-Za-z0-9_-]{8,200}$/).optional(),
      file_name:z.string().trim().max(300).optional(),
      issuer:z.string().trim().max(120).optional(),
      doc_no:z.string().trim().max(120).optional(),
      doc_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      summary:z.string().trim().max(4000).optional(),
    }),async(args:any)=>{
      const owner=await currentUser(supabase);
      const payload=fields(args,["direction","subject","drive_file_id","file_name","issuer","doc_no","doc_date","due_date","summary"]);
      const {data,error}=await supabase.from("lizhi_library_official_docs")
        .insert({user_id:owner,...payload,ai_status:"manual"})
        .select("id,direction,subject,drive_file_id,status,updated_at").single();
      if(error)return readableError(error,"新增公文失敗（可能已登記同一 Drive 檔案）");
      return output({created:true,document:data});
    },"write");

  register("update_official_doc","更新工作專區公文",
    "修改本人公文欄位或處理狀態；不會修改、分享或刪除 Google Drive 原檔。需先取得目前 updated_at。",
    z.object({doc_id:z.string().uuid(),expected_updated_at:z.string().min(16).max(64)})
      .merge(docPatchSchema),async(args:any)=>{
      const owner=await currentUser(supabase);
      const patch=fields(args,docFields);
      if(!Object.keys(patch).length)return fail("至少指定一項公文欄位");
      const {data,error}=await supabase.from("lizhi_library_official_docs")
        .update(patch).eq("id",args.doc_id).eq("user_id",owner)
        .eq("updated_at",args.expected_updated_at).is("deleted_at",null)
        .select("id,subject,status,updated_at,drive_file_id").maybeSingle();
      if(error)return readableError(error,"修改公文失敗");
      return data?output({updated:true,document:data}):fail("公文已變動或沒有權限，請重讀目前版本");
    },"write");

  register("archive_official_doc","移除工作專區公文登記",
    "軟刪網站登記；絕不刪除 Google Drive 公文原檔。需要 confirm=true。",
    z.object({doc_id:z.string().uuid(),expected_updated_at:z.string().min(16).max(64),confirm:z.literal(true)}),
    async({doc_id,expected_updated_at}:any)=>{
      const owner=await currentUser(supabase);
      const {data,error}=await supabase.from("lizhi_library_official_docs")
        .update({deleted_at:new Date().toISOString()})
        .eq("id",doc_id).eq("user_id",owner)
        .eq("updated_at",expected_updated_at).is("deleted_at",null)
        .select("id,drive_file_id,deleted_at").maybeSingle();
      if(error)return readableError(error,"移除公文登記失敗");
      return data?output({archived:true,document_id:data.id,drive_original_preserved:true}):fail("公文登記不存在或已變更");
    },"archive");

  register("cloud_file_download","取得館藏私有原檔短效下載網址",
    "僅限登入者雲端存檔（非本機／電腦），建立60秒短效簽章，不公開、不修改檔案。網址屬於敏感授權，勿公開分享。",
    z.object({item_id:z.string().uuid()}),async({item_id}:any)=>{
      const owner=await currentUser(supabase);
      const {data,error}=await supabase.from("lizhi_library_items")
        .select("id,file_name,mime,size,location,storage_path")
        .eq("id",item_id).eq("user_id",owner).is("deleted_at",null).maybeSingle();
      if(error)return readableError(error,"查詢原檔失敗");
      if(!data||data.location!=="cloud"||!data.storage_path)return fail("沒有可遠端下載的雲端原檔；本機與電腦原檔不能透過此工具取得");
      if(!String(data.storage_path).startsWith(owner+"/"))return fail("原檔路徑與登入者不符");
      const {data:signed,error:signError}=await supabase.storage.from(BUCKET)
        .createSignedUrl(data.storage_path,60);
      if(signError||!signed?.signedUrl)return readableError(signError,"私人原檔簽章失敗");
      return output({item_id:data.id,file_name:data.file_name,mime:data.mime,size:data.size,
        signed_url:signed.signedUrl,expires_in_seconds:60,
        warning:"這是可在60秒內存取的私人下載授權連結；不得公開或長期保存。"});
    });

  register("cloud_upload_ticket","建立圖書館私人上傳授權",
    "建立唯一 Storage 上傳路徑的2小時簽章；不代表完成上傳，不會接收 ChatGPT 附件位元組，不能覆寫既有檔案。",
    z.object({file_name:z.string().trim().min(3).max(220),
      mime:z.enum(TYPES as [string,...string[]]),size:z.number().int().min(1).max(MAX_SIZE)}),
    async({file_name,mime,size}:any)=>{
      const ext=validateUploadMeta({file_name,mime,size});
      const owner=await currentUser(supabase);
      const id=crypto.randomUUID();
      const path=owner+"/"+id+"."+ext;
      const {data,error}=await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
      if(error||!data?.signedUrl)return readableError(error,"建立上傳簽章失敗");
      return output({item_id:id,path,file_name,mime,size,signed_url:data.signedUrl,
        expires_in_seconds:7200,uploaded:false,
        next_step:"用支援原始位元組的用戶端傳到 signed_url，之後用 cloud_upload_finalize 登記；取得簽章不代表檔案已存在。"});
    },"write");

  register("cloud_upload_finalize","核對雲端原檔並登記館藏",
    "驗證本人的 Storage 路徑、實際檔案大小、MIME 後才建立館藏卡。僅登記已確實上傳的原檔，不能假裝已抽取文字。",
    z.object({item_id:z.string().uuid(),file_name:z.string().trim().min(3).max(220),
      mime:z.enum(TYPES as [string,...string[]]),size:z.number().int().min(1).max(MAX_SIZE)}),
    async({item_id,file_name,mime,size}:any)=>{
      const ext=validateUploadMeta({file_name,mime,size});
      const owner=await currentUser(supabase);
      const path=owner+"/"+item_id+"."+ext;
      const {data:info,error:infoError}=await supabase.storage.from(BUCKET).info(path);
      if(infoError||!info)return fail("雲端原檔尚未完成上傳，不能登記館藏");
      if(Number(info.size)!==size)return fail("雲端原檔大小與申報不一致");
      const actual=String(info.contentType||info.content_type||"").toLowerCase();
      if(actual&&actual!==mime.toLowerCase())return fail("雲端原檔 MIME 不符合");
      const {data:existing}=await supabase.from("lizhi_library_items")
        .select("id,storage_path").eq("id",item_id).eq("user_id",owner).maybeSingle();
      if(existing)return existing.storage_path===path
        ? output({registered:true,already_exists:true,item_id,original_file_present:true})
        : fail("館藏 ID 已存在，檔案路徑不相符");
      const {data,error}=await supabase.from("lizhi_library_items")
        .insert({id:item_id,user_id:owner,file_name,mime,size,storage_path:path,location:"cloud",
          extract_status:"none",extract_note:"經 MCP 授權上傳，尚未由瀏覽器抽取文字或縮圖",status:"inbox"})
        .select("id,file_name,mime,size,location,status,created_at").single();
      if(error)return readableError(error,"登記雲端館藏失敗");
      return output({registered:true,item:data,original_file_present:true,content_extracted:false});
    },"write");
}
