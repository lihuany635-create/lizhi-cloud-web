import {isValidMonth,taiwanMonth,formatCount,formatBytes,validateAiSideSnapshot,errorForHttp}
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
  clearEgress();
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
function clearEgress() {
  byId("egressStatus").textContent="尚無用量讀數";
  byId("egressRemaining").textContent="官方流量未知";
  byId("egressUpdated").textContent="尚未記錄，不能判定目前是否接近上限。";
  byId("egressNotice").textContent="需以相同期間的官方 Total 與 Cached Egress 抄錄";
  byId("saveEgress").disabled=true;
  showRows("egressHistory",[],4,"尚無歷史讀數");
}
async function loadEgress(token,month,seq) {
  const response=await fetch(endpoint("egress-history",month),{
    cache:"no-store",headers:{Authorization:"Bearer "+token,
      apikey:window.LIZHI_SUPABASE_PUBLISHABLE_KEY}
  });
  if(!response.ok)throw new Error(errorForHttp(response.status));
  const data=await response.json();
  if(data?.month!==month||data?.source!=="manual_supabase_usage_dashboard"||
    data?.automatic!==false||!Array.isArray(data.readings)||
    data.readings.length>100||data.limitBytes!==5000000000)
    throw new Error("非快取流量歷史資料不符合格式。");
  if(seq!==readSequence)return;
  byId("saveEgress").disabled=false;
  const last=data.latest;
  if(!last)return;
  if(!Number.isSafeInteger(last.uncachedBytes)||last.uncachedBytes<0)
    throw new Error("非快取流量數值不正確。");
  const gb=last.uncachedBytes/1e9;
  const remain=Math.max(0,5-gb);
  const ratio=gb/5;
  const label=ratio>=1?"已超過 Free 額度":
    ratio>=.95?"緊急：已達 95%":
    ratio>=.85?"警告：已達 85%":
    ratio>=.70?"提醒：已達 70%":"目前低於 70% 警戒值";
  byId("egress").textContent=formatBytes(last.uncachedBytes);
  byId("egressStatus").textContent=label;
  byId("egressRemaining").textContent="依最後讀數剩餘 "+remain.toFixed(3)+" GB";
  byId("egressUpdated").textContent="最後抄錄："+stamp(last.observedAt)+
    (last.periodStart?"｜帳期 "+last.periodStart+" 至 "+last.periodEnd:"｜舊讀數帳期待核對")+
    "｜已用 "+(ratio*100).toFixed(1)+"%；非即時官方 API 讀數";
  const stale=Date.now()-Date.parse(last.observedAt)>24*3600*1000;
  byId("egressNotice").textContent=stale?
    "距離最後一次讀數已超過 24 小時，不能據此判斷目前仍安全。":
    "這是使用者抄錄自官方 Usage 的數值，系統未直接驗證；警戒值 70／85／95／100%。";
  showRows("egressHistory",data.readings,4,"尚無歷史讀數",[
    x=>stamp(x.observedAt),
    x=>formatBytes(x.totalBytes),
    x=>formatBytes(x.cachedBytes),
    x=>formatBytes(x.uncachedBytes)
  ]);
}
async function saveEgressReading() {
  const month=byId("month").value;
  const totalValue=byId("egressTotalGb").value.trim();
  const cachedValue=byId("egressCachedGb").value.trim();
  if(!isValidMonth(month)||totalValue===""||cachedValue===""||
    !Number.isFinite(Number(totalValue))||!Number.isFinite(Number(cachedValue))||
    Number(totalValue)<0||Number(cachedValue)<0||
    Number(cachedValue)>Number(totalValue)) {
    byId("egressNotice").textContent="請填寫相同期間的 Total 與 Cached GB，且快取不可大於總量。";
    return;
  }
  const periodStart=byId("egressPeriodStart").value,periodEnd=byId("egressPeriodEnd").value;
  const observedAt=byId("egressObservedAt").value.trim();
  const original=byId("egressOfficialUncached").value.trim();
  if(!periodStart||!periodEnd||periodStart>=periodEnd||!Number.isFinite(Date.parse(observedAt))||!byId("egressSamePeriod").checked){
    byId("egressNotice").textContent="請核對並填寫官方帳期、觀測時間及同期間確認。";return;
  }
  const payload={month,total:Number(totalValue),cached:Number(cachedValue),unit:'GB',periodStart,periodEnd,observedAt:new Date(observedAt).toISOString(),samePeriod:true,
    ...(original===''?{}:{officialUncached:Number(original)})};
  const seq=++readSequence;
  byId("saveEgress").disabled=true;
  try {
    const token=await authToken();if(!token)return;
    const response=await fetch(endpoint("egress-record"),{
      method:"POST",cache:"no-store",
      headers:{Authorization:"Bearer "+token,
        apikey:window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    if(!response.ok)throw new Error(errorForHttp(response.status));
    const result=await response.json();
    if(!result?.saved||!result?.verified||result?.reading?.month!==month)
      throw new Error("伺服器沒有確認保存成功。");
    await loadEgress(token,month,seq);
    if(seq===readSequence)byId("egressNotice").textContent=
      "歷史讀數已保存並重新讀取；來源為人工抄錄官方 Usage，非自動同步。";
  }catch(e){
    if(seq===readSequence)byId("egressNotice").textContent=e?.message||"用量保存失敗";
  }finally{if(seq===readSequence)byId("saveEgress").disabled=false;}
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
    try { await loadEgress(token,month,seq); }
    catch(e) { if(seq===readSequence)byId("egressNotice").textContent="非快取流量讀取失敗："+String(e?.message||e); }
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
byId("egressObservedAt").value=new Date().toISOString();
byId("month").addEventListener("change",load);
byId("refresh").addEventListener("click",load);
byId("savebudget").addEventListener("click",saveBudget);
byId("saveEgress").addEventListener("click",saveEgressReading);
load();
window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin||event.data?.type!=="lizhi-account-logout")return;
  readSequence++;
  clearSnapshot();
  byId("refresh").disabled=true;
  byId("savebudget").disabled=true;
  setStatus("已登出立之雲端庫，請重新登入後查看 AI 紀錄。",true);
});
