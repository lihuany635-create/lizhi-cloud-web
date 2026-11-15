(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const status = byId("status");
  const fmt = (n) => Number(n || 0).toLocaleString("zh-TW");
  const bytes = (n) => n == null ? "未知" : n >= 1024 ** 3 ? (n / 1024 ** 3).toFixed(3) + " GB" : n >= 1024 ** 2 ? (n / 1024 ** 2).toFixed(2) + " MB" : n >= 1024 ? (n / 1024).toFixed(1) + " KB" : fmt(n) + " B";
  const taiwanMonth = () => new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Taipei", year:"numeric", month:"2-digit" }).format(new Date()).slice(0,7);
  const stamp = (v) => {
    try { return new Intl.DateTimeFormat("zh-TW", { timeZone:"Asia/Taipei", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }).format(new Date(v)); }
    catch { return "—"; }
  };
  const addCell = (tr, value) => { const td = document.createElement("td"); td.textContent = String(value ?? "—"); tr.append(td); };
  const setStatus = (message, error=false) => { status.textContent=message; status.classList.toggle("bad",error); };
  function showRows(id, entries, columns, emptyText) {
    const body = byId(id);
    body.replaceChildren();
    if (!entries.length) { const row=document.createElement("tr"),cell=document.createElement("td"); cell.colSpan=columns.length; cell.textContent=emptyText; row.append(cell); body.append(row); return; }
    for (const e of entries) { const row=document.createElement("tr"); for(const key of columns) addCell(row, key(e)); body.append(row); }
  }
  function resourceCard(item) {
    const root = document.createElement("article"); root.className="resource";
    const head=document.createElement("div"); head.className="resource-head";
    const label=document.createElement("span"); label.textContent=item.label;
    const tag=document.createElement("span"); tag.className="pill"; tag.textContent=item.official_used == null ? "未取得官方用量" : "官方已對帳";
    head.append(label,tag); root.append(head);
    const p=document.createElement("p");
    const suffix = item.unit || "";
    p.textContent = item.official_used == null
      ? `已觀測：${item.observed == null ? "未提供" : fmt(item.observed) + suffix} ／ 參考額度 ${fmt(item.limit)}${suffix}`
      : `官方：${fmt(item.official_used)}${suffix} ／ 上限 ${fmt(item.limit)}${suffix}`;
    root.append(p);
    const track=document.createElement("div");track.className="track";
    const line=document.createElement("div"); const percent=item.official_used == null ? 0 : Math.min(100,Math.round(item.official_used/item.limit*100));
    line.style.width=percent+"%";if(percent>=95)line.className="danger";else if(percent>=80)line.className="warn";
    track.append(line);root.append(track);
    return root;
  }
  async function render() {
    if (!window.LizhiAuth || !window.LIZHI_SUPABASE_URL || !window.LIZHI_SUPABASE_PUBLISHABLE_KEY) { setStatus("缺少現有雲端庫登入設定，監控資料無法讀取。",true);return; }
    const user=await window.LizhiAuth.requireUser();
    if(!user)return;
    byId("refresh").disabled=false;
    const month=byId("month").value;
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) {setStatus("月份格式錯誤。",true);return;}
    setStatus("讀取已授權的監控資料…");
    byId("refresh").disabled=true;
    try {
      const {data:{session},error}=await window.LizhiAuth.client.auth.getSession();
      if(error || !session?.access_token) throw new Error("登入已失效，請重新登入。");
      const url=window.LIZHI_SUPABASE_URL.replace(/\/$/,"")+"/functions/v1/lizhi-usage-monitor/snapshot?month="+encodeURIComponent(month);
      const response=await fetch(url,{cache:"no-store",headers:{
        Authorization:"Bearer "+session.access_token,
        apikey:window.LIZHI_SUPABASE_PUBLISHABLE_KEY
      }});
      if (!response.ok) {
        if(response.status===404)throw new Error("監控後端尚未發布（HTTP 404），目前僅為候選網站。");
        if(response.status===401||response.status===403)throw new Error("本人驗證或後端權限未通過（HTTP "+response.status+"）。");
        throw new Error("監控後端讀取失敗（HTTP "+response.status+"）。");
      }
      const snap=await response.json();
      if(snap?.coverage !== "instrumented_only" || !Array.isArray(snap?.sources) || !Array.isArray(snap?.events) || !Array.isArray(snap?.quotas))throw new Error("監控後端資料格式不符。");
      const s=snap.summary||{};
      byId("invocations").textContent=fmt(s.request_count);
      byId("egress").textContent=bytes(s.response_bytes_known);
      byId("blocked").textContent=fmt(s.blocked_count);
      byId("coverage").textContent=fmt(snap.sources.length)+" 項服務";
      const panel=byId("resources");panel.replaceChildren(...snap.quotas.map(resourceCard));
      showRows("services",snap.sources,[
        x=>x.source,x=>fmt(x.request_count),x=>bytes(x.response_bytes_known),
        x=>fmt(x.blocked_count),x=>fmt(x.error_count)
      ],"本月尚未收到已接入服務的紀錄。");
      showRows("events",snap.events,[
        x=>stamp(x.occurred_at),x=>x.source,x=>x.route,x=>x.status_code,
        x=>bytes(x.response_bytes),x=>x.decision
      ],"尚無逐筆流量事件，需先在個別服務接入共用記錄器。");
      setStatus("已載入「已接入服務」的觀測資料。官方計費量尚未同步；請勿將此數字視為 Supabase 實際剩餘額度。");
    } catch(err) {setStatus(err?.message||"資料讀取失敗。",true);}
    finally {byId("refresh").disabled=false;}
  }
  byId("month").value=taiwanMonth();
  byId("month").addEventListener("change",render);
  byId("refresh").addEventListener("click",render);
  render();
})();
