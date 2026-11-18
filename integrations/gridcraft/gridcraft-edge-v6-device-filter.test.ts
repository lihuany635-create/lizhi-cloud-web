// GridCraft Edge v6 selection regression tests; mock DB only, no real credentials or writes.
Deno.env.set("SUPABASE_URL", "https://synthetic.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "synthetic-only");
const {createHandler} = await import("./gridcraft-edge-v6-device-filter.ts");
const owner="synthetic-owner-2026", secret="a".repeat(64);
async function sha(s:string) {
 const bits=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
const config={siteSecretSha256:await sha(secret),owner,enabled:true,pairingEnabled:true,p4Enabled:true};
const headers={"Content-Type":"application/json","x-lizhi-gridcraft-actor":owner,"x-lizhi-gridcraft-bridge":secret};
function req(h=headers){
 return new Request("https://synthetic.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch",{
  method:"POST",headers:h,body:JSON.stringify({jsonrpc:"2.0",id:37,method:"tools/call",params:{name:"gridcraft_status",arguments:{}}})
 });
}
const check=(v:boolean,msg:string)=>{if(!v)throw Error(msg);};
type Dev={device_id:string;last_status:string;last_seen:string|null;revoked_at:string|null;owner_id:string};
const dev=(id:string,ageSeconds:number|null,status="READY",revoked=false):Dev=>({
 device_id:id,last_status:status,last_seen:ageSeconds===null?null:new Date(Date.now()-ageSeconds*1000).toISOString(),
 revoked_at:revoked?new Date().toISOString():null,owner_id:owner
});
let fixture:Dev[]=[];
let queries:string[]=[];
globalThis.fetch=(async (url:string|URL|Request,_init?:RequestInit)=>{
 const full=String(url);queries.push(full);
 if(!full.includes("/rest/v1/lz_gridcraft_devices?")) throw Error("UNEXPECTED_DB_ACCESS");
 const u=new URL(full), since=u.searchParams.get("last_seen");
 check(since!==null && since.startsWith("gte."),"MUST_FILTER_ONLINE");
 check(u.searchParams.get("revoked_at")==="is.null","MUST_FILTER_REVOCATION");
 check(u.searchParams.get("owner_id")==="eq."+owner,"MUST_FILTER_OWNER");
 check(u.searchParams.get("limit")==="2","MUST_DETECT_MULTIPLE");
 const cutoff=Date.parse(since.slice(4));
 check(Number.isFinite(cutoff),"BAD_HEARTBEAT_BOUNDARY");
 const found=fixture.filter(d=>d.owner_id===owner&&!d.revoked_at&&d.last_seen!==null&&Date.parse(d.last_seen)>=cutoff)
  .sort((a,b)=>Date.parse(b.last_seen!)-Date.parse(a.last_seen!))
  .slice(0,2).map(({device_id,last_status,last_seen})=>({device_id,last_status,last_seen}));
 return Response.json(found);
}) as typeof fetch;
async function status() {
 const response=await createHandler(config)(req());
 const data=await response.json();
 if(response.status!==200)return {http:response.status,error:data.error,status:undefined};
 const inner=JSON.parse(data.result.content[0].text);
 return {http:response.status,status:inner.status,write:inner.write_enabled};
}
Deno.test("one READY live + one never-seen unrevoked pairing: READY not MULTIPLE_DEVICES",async()=>{
 fixture=[dev("old-never-seen",null),dev("current-v03",3)];queries=[];
 const r=await status();
 check(r.http===200 && r.status==="READY","SINGLE_LIVE_MUST_CONNECT");
 check(queries.length===1,"STATUS_SHOULD_ONE_DB_READ");
});
Deno.test("stale previously active pairing must not block live device",async()=>{
 fixture=[dev("stale-v02",600),dev("current-v03",2)];queries=[];
 const r=await status();
 check(r.http===200 && r.status==="READY","STALE_PAIRING_REJECTED_LIVE");
});
Deno.test("two simultaneously active devices remain fail-closed",async()=>{
 fixture=[dev("live-v02",2),dev("live-v03",4)];queries=[];
 const r=await status();
 check(r.http===400 && r.error==="MULTIPLE_DEVICES_UNSUPPORTED","MUST_NOT_CHOOSE_AMONG_TWO_LIVE");
});
Deno.test("two stale devices return DEVICE_OFFLINE instead of guessing",async()=>{
 fixture=[dev("stale-v02",700),dev("stale-v03",60)];queries=[];
 const r=await status();
 check(r.http===200 && r.status==="DEVICE_OFFLINE","NO_LIVE_SHOULD_REPORT_OFFLINE");
});
Deno.test("only actively heartbeating but GridCraft-offline agent reports GRIDCRAFT_OFFLINE",async()=>{
 fixture=[dev("old-stale",120),dev("current-agent",3,"GRIDCRAFT_OFFLINE")];queries=[];
 const r=await status();
 check(r.http===200 && r.status==="GRIDCRAFT_OFFLINE","PRESERVE_LIVE_CONTROL_STATUS");
});
Deno.test("revoked recent heartbeat does not block unrevoked live one",async()=>{
 fixture=[dev("revoked-v02",1,"READY",true),dev("current-v03",2)];queries=[];
 const r=await status();
 check(r.http===200 && r.status==="READY","REVOKED_DEVICE_SHOULD_BE_IGNORED");
});
Deno.test("owner and bridge secret checks still reject forged requests before DB",async()=>{
 fixture=[dev("current-v03",2)];queries=[];
 const res=await createHandler(config)(req({...headers,"x-lizhi-gridcraft-actor":"other-owner"}));
 check(res.status===401,"FORGED_OWNER_MUST_DENY");
 check(queries.length===0,"FORGED_OWNER_MUST_NOT_READ_DB");
});
