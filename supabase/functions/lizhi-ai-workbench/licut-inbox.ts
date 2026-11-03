// Owner-scoped LiCut video inbox over the EXISTING Supabase Storage service.
// Signed upload URLs: 2 hours, single unique path, no upsert. Download URLs: 10 minutes.
// Never store signed URLs in a public table/log; object access runs only via this Edge's service-role key.
export const LICUT_BUCKET = "lizhi-licut-inbox";
export const LICUT_MAX_FILE_BYTES = 52_428_800;
const OWNER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/i;
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,94}\.(mp4|webm|mov)$/i;
const ENTRY = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{64})-([A-Za-z0-9][A-Za-z0-9._-]{0,94}\.(?:mp4|webm|mov))$/i;
const TYPE_BY_EXT: Record<string,string> = {mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime"};

export class LiCutInboxError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function validateVideoInput(data: Record<string,unknown>) {
  const name = String(data.name ?? "");
  const size = Number(data.size);
  const sha256 = String(data.sha256 ?? "").toLowerCase();
  if (!NAME.test(name) || name.includes("..")) throw new LiCutInboxError("檔名必須是安全的 mp4、webm 或 mov 名稱");
  if (!Number.isSafeInteger(size) || size < 1 || size > LICUT_MAX_FILE_BYTES) throw new LiCutInboxError("單檔只能是 1B 至 50MiB",413);
  if (!HASH.test(sha256)) throw new LiCutInboxError("需要有效的 SHA-256 值");
  const ext = name.split(".").pop()!.toLowerCase();
  if (data.mime !== TYPE_BY_EXT[ext]) throw new LiCutInboxError("影片類型與副檔名不相符");
  return {name,size,sha256,mime:TYPE_BY_EXT[ext]};
}
export function parseLicutKey(owner: string, key: string) {
  if (!OWNER.test(owner) || !key.startsWith(owner+"/")) throw new LiCutInboxError("素材擁有者不符",403);
  const filename = key.slice(owner.length+1);
  const match = ENTRY.exec(filename);
  if (!match || filename.includes("..")) throw new LiCutInboxError("雲端素材路徑不正確",403);
  return {key, id:match[1], sha256:match[2].toLowerCase(), name:match[3]};
}
type StorageEntry = {name:string; id?:string|null;created_at?:string;metadata?:{size?:number;mimetype?:string}};
export class LiCutPrivateInbox {
  constructor(private urlBase:string, private service:string, private fetcher: typeof fetch=fetch) {}
  private async call(method:string, path:string, body?:unknown):Promise<any>{
    const r=await this.fetcher(this.urlBase+"/storage/v1/"+path,{
      method,
      headers:{apikey:this.service,Authorization:"Bearer "+this.service,"Content-Type":"application/json"},
      ...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    if (!r.ok) throw new LiCutInboxError("私人素材儲存服務未完成或暫時不可用",503);
    return await r.json();
  }
  private validSignedUrl(raw:string):string {
    const candidate = raw.startsWith("http") ? raw : this.urlBase+"/storage/v1"+raw;
    const actual = new URL(candidate);
    if (actual.origin!==new URL(this.urlBase).origin ||
        !actual.pathname.startsWith("/storage/v1/object/"))
      throw new LiCutInboxError("儲存服務回傳不安全的連結",502);
    return actual.toString();
  }
  async ticket(owner:string, raw:Record<string,unknown>) {
    if (!OWNER.test(owner)) throw new LiCutInboxError("登入身分不正確",403);
    const video=validateVideoInput(raw);
    const key=owner+"/"+crypto.randomUUID()+"-"+video.sha256+"-"+video.name;
    const r=await this.call("POST","object/upload/sign/"+LICUT_BUCKET+"/"+key,{});
    const signed_url=this.validSignedUrl(String(r.url||""));
    if (!new URL(signed_url).searchParams.has("token")) throw new LiCutInboxError("沒有收到簽章授權",502);
    return {key, name:video.name,size:video.size,sha256:video.sha256,mime:video.mime,
      signed_url,expires_in_seconds:7200,
      note:"這是上傳授權，不表示影片已上傳。請對 signed_url 直接 PUT 檔案，之後用 licut_cloud_inbox 確認。"};
  }
  async list(owner:string) {
    if (!OWNER.test(owner)) throw new LiCutInboxError("登入身分不正確",403);
    const entries:StorageEntry[]=await this.call("POST","object/list/"+LICUT_BUCKET,{
      prefix:owner+"/",limit:100,offset:0,sortBy:{column:"created_at",order:"desc"}});
    return {bucket_private:true,more_possible:entries.length===100,
      media:entries.filter((e)=>typeof e?.name==="string"&&Boolean(ENTRY.exec(e.name))&&e.id)
        .map((e)=>{
          const parsed=parseLicutKey(owner,owner+"/"+e.name);
          return {...parsed,size:e.metadata?.size??null,mime:e.metadata?.mimetype??null,
            created_at:e.created_at??null};
        }),
      note:"只列出本人的雲端影片，並非已匯入手機立剪。最多顯示 100 項。"};
  }
  async ensureExists(owner:string,key:string) {
    parseLicutKey(owner,key);
    const list=await this.list(owner);
    const item=list.media.find((m)=>m.key===key);
    if (!item) throw new LiCutInboxError("找不到已完成上傳的影片，或超出最近 100 筆清單",404);
    return item;
  }
  async download(owner:string,key:string){
    const item=await this.ensureExists(owner,key);
    const r=await this.call("POST","object/sign/"+LICUT_BUCKET+"/"+key,{expiresIn:600});
    const signed_url=this.validSignedUrl(String(r.signedURL||""));
    return {...item,signed_url,expires_in_seconds:600};
  }
}
