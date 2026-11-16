import {isValidMonth,taiwanMonth,formatCount,validateAiSideSnapshot,errorForHttp}
  from "./monitor-core.mjs";
const byId=id=>document.getElementById(id);
const status=byId("status");
let readSequence=0;
const setStatus=(message,error=false)=>{
  status.textContent=message;
  status.classList.toggle("bad",error);
};
function clearSnapshot(){
  byId("invocations").textContent="—";
  byId("egress").textContent="未知";
  byId("blocked").textContent="—";
  byId("coverage").textContent="未確認";
  byId("capStatus").textContent="尚未載入";
  byId("capRemaining").textContent="官方流量未知";
  byId("capExplanation").textContent="尚無已核對的 AI 自登記資料。";
  byId("resources").replaceChildren();
  showRows("services",[],5,"目前沒有已核對的 AI 功能使用紀錄。");
  showRows("events",[],6,"目前沒有已核對的 AI 操作紀錄。");
}
function stamp(v){
  try{
    if(!v||Number.isNaN(Date.parse(v)))return "未知";
    return new Intl.DateTimeFormat("zh-TW",{
      timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit",
      hour:"2-digit",minute:"2-digit"
    }).format(new Date(v));
  }catch{return "未知";}
}
function addCell(tr,value){
  const td=document.createElement("td");
  // Untrusted Side descriptions must never become HTML.
  td.textContent=String(value??"—");
  tr.append(td);
}
function showRows(id,entries,count,emptyText,columns=[]){
  const body=byId(id);body.replaceChildren();
  if(!entries.length){
    const tr=document.createElement("tr"),td=document.createElement("td");
    td.colSpan=count;td.textContent=emptyText;tr.append(td);body.append(tr);return;
  }
  for(const entry of entries){
    const tr=document.createElement("tr");
    for(const cell of columns)addCell(tr,cell(entry));
    body.append(tr);
  }
}
function renderAiLedger(snap){
  byId("invocations").textContent=formatCount(snap.summary.assistantObservedToolCalls);
  byId("egress").textContent="未知";
  byId("blocked").textContent=formatCount(snap.summary.unfinishedActions);
  byId("coverage").textContent=formatCount(snap.features.length)+" 項";
  showRows("services",snap.features,5,"目前尚無 AI 已完成的操作記錄。",[
    x=>x.feature,x=>formatCount(x.finishedActions),
    x=>formatCount(x.assistantObservedToolCalls),
    x=>formatCount(x.failures),x=>formatCount(x.unknownResults)
  ]);
  showRows("events",snap.events,6,"目前尚無 AI 操作記錄。",[
    x=>stamp(x.at),x=>x.feature,x=>x.taskLabel,
    x=>x.actionDetail,x=>formatCount(x.toolCalls),x=>x.outcome
  ]);
  const cap=snap.budget.monthlyToolCap;
  const used=snap.summary.assistantObservedToolCalls;
  byId("budget").value=cap===null?"":String(cap);
  byId("capRemaining").textContent=cap===null?"未設定操作上限":
    "尚可自行操作 "+formatCount(Math.max(0,cap-used))+" 次";
  const labels={UNCONFIGURED:"尚未設定 AI 自訂操作上限",
    INCOMPLETE:"AI 紀錄不完整，無法可靠預警",
    LIMIT_REACHED:"已達到 AI 自訂操作上限",
    NEAR_LIMIT:"已接近 AI 自訂操作上限",
    WITHIN_CAP:"AI 已登記次數在自訂上限內"};
  byId("capStatus").textContent=labels[snap.budget.alert]||"不明狀態";
  byId("capExplanation").textContent=snap.complete
    ? "這是已核對的 AI 自行登記操作。其他直接使用 Supabase 的流量未納入，官方計費量未知。"
    : "有漏記、衝突、重複資料異常或超出查詢筆數限制；必須補齊紀錄，不得視為安全剩餘額度。";
}
async function authToken(){
  const auth=window.LizhiAuth;
  if(!auth||!window.LIZHI_SUPABASE_URL||!window.LIZHI_SUPABASE_PUBLISHABLE_KEY)
    throw new Error("既有雲端庫登入設定尚未就緒。");
  const user=await auth.requireUser();
  if(!user)return null;
  const {data,error}=await auth.client.auth.getSession();
  if(error||!data?.session?.access_token)throw new Error("登入已失效，請重新登入。");
  return data.session.access_token;
}
function endpoint(path,month){
  return window.LIZHI_SUPABASE_URL.replace(/\/$/,"")
    +"/functions/v1/lizhi-usage-monitor/"+path+
    (month?"?month="+encodeURIComponent(month):"");
}
async function load(){
  const seq=++readSequence,refresh=byId("refresh");
  clearSnapshot();
  refresh.disabled=true;
  byId("savebudget").disabled=true;
  setStatus("正在驗證本人身分…");
  try{
    const token=await authToken();
    if(!token)return;
    const month=byId("month").value;
    if(!isValidMonth(month))throw new Error("月份格式錯誤。");
    setStatus("正在讀取原 AI 工作台 Side 自行登記的操作紀錄…");
    const response=await fetch(endpoint("ai-ledger",month),{
      cache:"no-store",headers:{Authorization:"Bearer "+token,
        apikey:window.LIZHI_SUPABASE_PUBLISHABLE_KEY}
    });
    if(!response.ok)throw new Error(errorForHttp(response.status));
    const snap=validateAiSideSnapshot(await response.json(),month);
    if(seq!==readSequence)return;
    renderAiLedger(snap);
    byId("savebudget").disabled=false;
    setStatus(snap.complete
      ?"已核對 AI 自行登記的 "+formatCount(snap.summary.assistantObservedToolCalls)+
        " 次工具呼叫；不等於 Supabase 官方流量或費用。"
      :"AI 操作紀錄部分不完整，數字可能低估；已顯示可驗證的部分，請檢查漏記與重複。",!snap.complete);
  }catch(e){
    if(seq===readSequence){
      clearSnapshot();
      setStatus(e?.message||"監控資料讀取失敗。",true);
    }
  }finally{if(seq===readSequence)refresh.disabled=false;}
}
async function saveBudget(){
  const value=byId("budget").value.trim(),month=byId("month").value;
  if(!/^\d+$/.test(value)||!isValidMonth(month)||
     Number(value)<1||Number(value)>1000000||!Number.isSafeInteger(Number(value))){
    setStatus("請輸入 1～1,000,000 次的整數 AI 自訂操作上限。",true);return;
  }
  const seq=++readSequence;
  byId("savebudget").disabled=true;
  setStatus("正在保存 AI 自訂操作上限…");
  try{
    const token=await authToken();
    if(!token)return;
    const response=await fetch(endpoint("ai-budget"),{
      method:"POST",cache:"no-store",headers:{
        Authorization:"Bearer "+token,apikey:window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type":"application/json"
      },body:JSON.stringify({month,cap:Number(value)})
    });
    if(!response.ok)throw new Error(errorForHttp(response.status));
    const data=await response.json();
    if(!data?.saved||data.month!==month||data.monthlyToolCap!==Number(value))
      throw new Error("沒有取得預算儲存確認。");
    if(seq!==readSequence)return;
    await load(); // Round-trip readback from existing Side table, not optimistic UI.
  }catch(e){if(seq===readSequence)setStatus(e?.message||"自訂上限保存失敗。",true);}
  finally{if(seq===readSequence)byId("savebudget").disabled=false;}
}
byId("month").value=taiwanMonth();
byId("month").addEventListener("change",load);
byId("refresh").addEventListener("click",load);
byId("savebudget").addEventListener("click",saveBudget);
load();
window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin||event.data?.type!=="lizhi-account-logout")return;
  readSequence++;
  clearSnapshot();
  byId("refresh").disabled=true;
  byId("savebudget").disabled=true;
  setStatus("已登出立之雲端庫，請重新登入後查看 AI 紀錄。",true);
});
