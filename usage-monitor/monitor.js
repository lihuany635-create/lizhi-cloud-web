import {isValidMonth,taiwanMonth,formatCount,formatBytes,quotaLabel,validateSnapshot,errorForHttp}
  from "./monitor-core.mjs";
const byId = id => document.getElementById(id);
const status = byId("status");
let readSequence=0;
const setStatus = (message, error=false) => {
  status.textContent=message; status.classList.toggle("bad",error);
};
function clearSnapshot(){
  byId("invocations").textContent="—";
  byId("egress").textContent="—";
  byId("blocked").textContent="—";
  byId("coverage").textContent="未確認";
  byId("resources").replaceChildren();
  showRows("services",[],5,"尚未載入有效的監測資料。");
  showRows("events",[],6,"尚未載入有效的監測資料。");
}
function stamp(v){
  try{
    if(!v||Number.isNaN(Date.parse(v)))return "未知";
    return new Intl.DateTimeFormat("zh-TW",{
      timeZone:"Asia/Taipei",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"
    }).format(new Date(v));
  }catch{return "未知";}
}
function addCell(tr, value){
  const td=document.createElement("td");
  td.textContent=String(value??"—");
  tr.append(td);
}
function showRows(id, entries, count, emptyText, columns=[]){
  const body=byId(id);body.replaceChildren();
  if(!entries.length){
    const row=document.createElement("tr"),cell=document.createElement("td");
    cell.colSpan=count;cell.textContent=emptyText;row.append(cell);body.append(row);return;
  }
  for(const entry of entries){
    const row=document.createElement("tr");
    for(const cell of columns)addCell(row,cell(entry));
    body.append(row);
  }
}
function resourceCard(item){
  const root=document.createElement("article");root.className="resource";
  const head=document.createElement("div");head.className="resource-head";
  const label=document.createElement("span");label.textContent=item.label;
  const tag=document.createElement("span");tag.className="pill";
  tag.textContent=item.official_used==null?"未取得官方用量":"官方已對帳";
  head.append(label,tag);root.append(head);
  const info=document.createElement("p");
  const observed=item.observed==null?"未提供":quotaLabel(item.observed,item.unit);
  const official=item.official_used==null?null:quotaLabel(item.official_used,item.unit);
  const limit=quotaLabel(item.limit,item.unit);
  info.textContent=official===null
    ? `已觀測下限：${observed} ／ 參考額度：${limit}`
    : `官方已用：${official} ／ 額度：${limit}`;
  root.append(info);
  const track=document.createElement("div");track.className="track";
  const line=document.createElement("div");
  const percent=item.official_used===null||item.official_used===undefined ? 0
    :Math.max(0,Math.min(100,Math.round(100*item.official_used/item.limit)));
  line.style.width=percent+"%";
  if(percent>=95)line.className="danger";else if(percent>=80)line.className="warn";
  track.append(line);root.append(track);
  return root;
}
function renderSnapshot(snap){
  const s=snap.summary;
  byId("invocations").textContent=formatCount(s.request_count);
  byId("egress").textContent=formatBytes(s.response_bytes_known);
  byId("blocked").textContent=formatCount(s.blocked_count);
  byId("coverage").textContent=formatCount(snap.sources.length)+" 項服務";
  byId("resources").replaceChildren(...snap.quotas.map(resourceCard));
  showRows("services",snap.sources,5,"本月尚未收到已接入服務的紀錄。",[
    x=>x.source,x=>formatCount(x.request_count),x=>formatBytes(x.response_bytes_known),
    x=>formatCount(x.blocked_count),x=>formatCount(x.error_count)
  ]);
  showRows("events",snap.events,6,"尚無逐筆流量事件。",[
    x=>stamp(x.occurred_at),x=>x.source,x=>x.route,x=>x.status_code,
    x=>formatBytes(x.response_bytes),x=>x.decision
  ]);
}
async function load(){
  const seq=++readSequence; const refresh=byId("refresh");
  clearSnapshot();
  refresh.disabled=true;
  setStatus("正在驗證本人身分…");
  try{
    const auth=window.LizhiAuth;
    if(!auth||!window.LIZHI_SUPABASE_URL||!window.LIZHI_SUPABASE_PUBLISHABLE_KEY)
      throw new Error("既有雲端庫登入設定尚未就緒。");
    const user=await auth.requireUser();
    if(!user)return; // Existing auth.js renders the login gate itself.
    const month=byId("month").value;
    if(!isValidMonth(month))throw new Error("月份格式錯誤。");
    setStatus("讀取受保護的監測資料…");
    const {data,error}=await auth.client.auth.getSession();
    if(error||!data?.session?.access_token)throw new Error("登入已失效，請重新登入。");
    const url=window.LIZHI_SUPABASE_URL.replace(/\/$/,"")
      +"/functions/v1/lizhi-usage-monitor/snapshot?month="+encodeURIComponent(month);
    const response=await fetch(url,{
      cache:"no-store",
      headers:{Authorization:"Bearer "+data.session.access_token,
        apikey:window.LIZHI_SUPABASE_PUBLISHABLE_KEY}
    });
    if(!response.ok)throw new Error(errorForHttp(response.status));
    const snap=validateSnapshot(await response.json(),month);
    if(seq!==readSequence)return;
    renderSnapshot(snap);
    setStatus("已載入已接入服務的觀測資料；官方用量與完整涵蓋率尚未驗證，不可據此推算精確剩餘額度。");
  }catch(e){
    if(seq===readSequence){
      clearSnapshot();
      setStatus(e?.message||"監控資料讀取失敗。",true);
    }
  }finally{if(seq===readSequence)refresh.disabled=false;}
}
byId("month").value=taiwanMonth();
byId("month").addEventListener("change",load);
byId("refresh").addEventListener("click",load);
load();

// The main cloud-library logout broadcasts to embedded workspaces.
window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin||event.data?.type!=="lizhi-account-logout")return;
  readSequence++;
  clearSnapshot();
  byId("refresh").disabled=true;
  setStatus("已登出立之雲端庫，請重新登入後查看監控資料。",true);
});
