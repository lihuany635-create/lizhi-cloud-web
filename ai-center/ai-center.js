// AI 處理中心：全站狀態紀錄。取代原本的「知識編織室」。
// 雲端資料由 lizhi_status_summary() 一次取回；工程中心、本機收藏等本機資料直接在瀏覽器讀。
(function(global){
  "use strict";

  const SOURCES={library:["圖書館","書"],finance:["理財管家","財"],licut:["立剪","剪"],engineering:["工程中心","工"],media:["影音庫","影"],chat:["即時對話","↔"],site:["網站","立"]};
  let rerender=()=>{},summary=null,local=null,loading=false,loadedAt=0,error="",filter="all",timer=null;

  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const n=value=>Number(value||0);
  const appState=()=>(typeof state!=="undefined"?state:global.state)||{};
  const bytes=v=>v>=1073741824?`${(v/1073741824).toFixed(2)} GB`:v>=1048576?`${(v/1048576).toFixed(1)} MB`:v>=1024?`${Math.round(v/1024)} KB`:`${v} B`;
  function ago(value){
    const t=Date.parse(value);if(!t)return "從未";
    const s=Math.round((Date.now()-t)/1000);
    if(s<60)return "剛剛";if(s<3600)return `${Math.floor(s/60)} 分鐘前`;if(s<86400)return `${Math.floor(s/3600)} 小時前`;
    if(s<86400*7)return `${Math.floor(s/86400)} 天前`;
    return new Date(t).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"});
  }
  const stamp=value=>{const t=Date.parse(value);return t?new Date(t).toLocaleString("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}):"";};

  function configure(options){rerender=options.rerender||rerender;}

  // ── 本機資料：工程中心（IndexedDB）、本機收藏、影音、上傳回報、網站版本 ──
  function countStore(dbName,storeName){
    return new Promise(resolve=>{
      let request;
      try{request=indexedDB.open(dbName);}catch{resolve(null);return;}
      request.onupgradeneeded=()=>{request.transaction.abort();resolve(null);};
      request.onerror=()=>resolve(null);
      request.onsuccess=()=>{
        const db=request.result;
        try{
          if(!db.objectStoreNames.contains(storeName)){db.close();resolve(null);return;}
          const req=db.transaction(storeName,"readonly").objectStore(storeName).getAll();
          req.onsuccess=()=>{db.close();resolve(req.result||[]);};
          req.onerror=()=>{db.close();resolve(null);};
        }catch{db.close();resolve(null);}
      };
    });
  }

  async function loadLocal(){
    const st=appState(),records=(st.records||[]).filter(row=>!row.deletedAt);
    const [projects,upload,caches]=await Promise.all([
      countStore("lizhi-engineering","projects"),
      fetch("./upload-status.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null),
      global.caches?.keys().catch(()=>[])||[]
    ]);
    return {
      engineering:projects?{total:projects.length,active:projects.filter(p=>p.status==="active").length,updated:projects.map(p=>p.updated_at).sort().pop()||null}:null,
      records:{folders:records.filter(r=>r.kind==="folder").length,notes:records.filter(r=>r.kind==="note").length,documents:records.filter(r=>r.kind==="document").length,media:records.filter(r=>r.kind==="media").length},
      cloudMedia:(st.cloudMedia||[]).length,
      upload,
      cache:(caches||[]).find(key=>key.startsWith("lizhi-cloud-"))||""
    };
  }

  async function load({force=false}={}){
    if(loading||(!force&&loadedAt&&Date.now()-loadedAt<30000))return;
    loading=true;rerender();
    const client=global.LizhiAuth?.user?global.LizhiAuth.client:null;
    const [remote,localData]=await Promise.all([
      client?client.rpc("lizhi_status_summary").then(({data,error:err})=>{if(err)throw err;return data;}).catch(err=>{error=/lizhi_status_summary|schema cache|does not exist/i.test(err?.message||"")?"雲端狀態彙整還沒建立（需要套用 011_lizhi_ai_center.sql）":`雲端狀態讀不到：${err?.message||err}`;return null;}):Promise.resolve(null),
      loadLocal().catch(()=>null)
    ]);
    if(remote){summary=remote;error="";}else if(!client)error="登入雲端版後才看得到雲端資料";
    local=localData;loading=false;loadedAt=Date.now();rerender();
    clearTimeout(timer);timer=setTimeout(()=>{if(appState().route==="weave"&&!document.hidden)load({force:true});},60000);
  }

  // ── 需要處理的事 ──
  function attention(){
    const items=[],s=summary||{},lib=s.library||{},fin=s.finance||{},cut=s.licut||{};
    const host=(fin.hosts||[])[0],hostOnline=host&&Date.now()-Date.parse(host.last_seen_at)<180000;
    if(n(lib.inbox))items.push({tone:"amber",title:`圖書館有 ${n(lib.inbox)} 本待整理`,text:"今晚 21:52 會自動整理；想馬上整理，回到 Claude 說「幫我整理圖書館」。",route:"knowledge",cta:"去圖書館"});
    if(n(lib.skipped))items.push({tone:"amber",title:`${n(lib.skipped)} 本書需要補備註`,text:"Claude 讀不出這些檔案的內容，加一句備註說明是什麼，下次就能整理。",route:"knowledge",cta:"去補備註"});
    if(n(fin.jobs?.pending)&&!hostOnline)items.push({tone:"red",title:`${n(fin.jobs.pending)} 筆記帳等家中電腦處理`,text:"家中電腦的理財 AI 目前離線，打開電腦上的「啟動理財AI」就會接著處理。",route:"finance",cta:"去理財管家"});
    if(n(fin.jobs?.failed))items.push({tone:"muted",title:`記帳 AI 累計 ${n(fin.jobs.failed)} 次解析失敗`,text:"失敗的那幾筆需要在理財管家手動確認或重新輸入。",route:"finance",cta:"去理財管家"});
    if(n(cut.commands?.pending))items.push({tone:"amber",title:`${n(cut.commands.pending)} 個剪輯指令等手機執行`,text:"在手機上打開立剪，指令就會依序套用。",route:"licut",cta:"打開立剪"});
    if(n(cut.commands?.error))items.push({tone:"muted",title:`${n(cut.commands.error)} 個剪輯指令失敗`,text:"可以請 Claude 看一下失敗原因再重送。",route:"licut",cta:"打開立剪"});
    return items;
  }

  function automations(){
    const s=summary||{},lib=s.library||{},fin=s.finance||{},cut=s.licut||{},runs=s.runs||[],up=local?.upload;
    const libRun=runs.find(run=>run.source==="library");
    const host=(fin.hosts||[])[0],hostOnline=host&&Date.now()-Date.parse(host.last_seen_at)<180000;
    return [
      {name:"圖書館每日整理",when:"每天 21:52",ok:libRun?libRun.status!=="error":true,detail:libRun?`上次：${ago(libRun.created_at)} · ${libRun.title}`:lib.last_organized?`上次整理：${ago(lib.last_organized)}`:"還沒跑過"},
      {name:"理財 AI（家中電腦）",when:"有記帳時",ok:!!hostOnline,detail:host?`${hostOnline?"在線":"離線"} · 上次連線 ${ago(host.last_seen_at)}`:"還沒有電腦連過"},
      {name:"立剪遠端剪輯",when:"手機開著立剪時",ok:!n(cut.commands?.error),detail:cut.project?`手機上次同步 ${ago(cut.project.updated_at)}${cut.project.device?` · ${cut.project.device}`:""}`:"手機還沒同步過"},
      {name:"影音上傳",when:"每天 21:20",ok:up?!up.error&&Date.now()-Date.parse(up.lastSuccessAt||0)<172800000:true,detail:up?`上次成功 ${ago(up.lastSuccessAt)}${up.error?` · ${up.error}`:Date.now()-Date.parse(up.lastSuccessAt||0)>=172800000?" · 超過兩天沒有成功上傳，請檢查家中電腦的排程":""}`:"讀不到上傳回報"}
    ];
  }

  function areas(){
    const s=summary||{},lib=s.library,fin=s.finance,cut=s.licut,chat=s.chat,web=s.web||{},L=local||{};
    const rows=[];
    rows.push({route:"knowledge",key:"library",lines:lib?[[n(lib.total),"館藏"],[n(lib.shelves),"書架"],[n(lib.inbox),"待整理"]]:null,foot:lib?`手機 ${n(lib.device)} 本 · 雲端 ${n(lib.cloud)} 本（${bytes(n(lib.cloud_bytes))}）`:"",updated:lib?.last_upload});
    const fr=fin?.records||{};
    rows.push({route:"finance",key:"finance",lines:fin?[[n(fr.transactions),"交易"],[n(fr.accounts),"帳戶"],[n(fr.creditCards),"信用卡"]]:null,foot:fin?`分類 ${n(fr.categories)} · 記憶規則 ${n(fin.rules)} · AI 解析成功 ${n(fin.jobs?.completed)} 次`:"",updated:fin?.last_job});
    rows.push({route:"engineering",key:"engineering",lines:L.engineering?[[L.engineering.active,"進行中專案"],[L.engineering.total-L.engineering.active,"已封存"]]:null,foot:L.engineering?"存在這台裝置":"這台裝置還沒有工程資料",updated:L.engineering?.updated});
    rows.push({route:"licut",key:"licut",lines:cut?[[n(cut.media),"素材"],[n(cut.commands?.done),"完成指令"]]:null,foot:cut?.project?`時間軸版本 ${String(cut.project.rev).slice(-6)}`:"",updated:cut?.project?.updated_at});
    rows.push({route:"media",key:"media",lines:[[L.cloudMedia||0,"集雲端影音"]],foot:"由家中電腦每天上傳",updated:null});
    rows.push({route:"chat",key:"chat",lines:chat?[[n(chat.messages),"則訊息"]]:null,foot:"",updated:chat?.last_at});
    rows.push({route:"settings",key:"site",label:"本機收藏",lines:[[n(web.folder)||L.records?.folders||0,"資料夾"],[n(web.note)||L.records?.notes||0,"筆記"],[L.records?.documents||0,"舊版文件"]],foot:"資料夾與筆記會同步雲端",updated:null});
    return rows;
  }

  function timeline(){
    const s=summary||{};
    const runs=(s.runs||[]).map(run=>({source:run.source,at:run.created_at,title:run.title,detail:run.detail,status:run.status,isRun:true}));
    const events=(s.events||[]).map(event=>({source:event.source,at:event.at,title:event.title,status:/失敗/.test(event.title)?"error":"ok"}));
    let rows=[...runs,...events].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
    if(filter==="runs")rows=rows.filter(row=>row.isRun);else if(filter!=="all")rows=rows.filter(row=>row.source===filter);
    return rows.slice(0,40);
  }

  function render(){
    if(!loadedAt&&!loading)load();
    const header=typeof head==="function"?head("AI CENTER","AI 處理中心","全站狀態紀錄：AI 在做什麼、資料放在哪、哪裡需要你處理。",`<button class="button" data-ai-refresh>${loading?"更新中…":"重新整理"}</button>`):"<h1>AI 處理中心</h1>";
    if(!loadedAt)return `${header}<div class="empty">正在彙整全站狀態…</div>`;
    const todo=attention(),autos=automations(),cards=areas(),rows=timeline();
    const filters=[["all","全部"],["runs","AI 紀錄"],["library","圖書館"],["finance","理財"],["licut","立剪"]];
    return `${header}<div class="aic">
      <p class="aic-updated">更新於 ${esc(stamp(summary?.generated_at||new Date(loadedAt).toISOString()))}${local?.cache?` · 網站版本 ${esc(local.cache.replace("lizhi-cloud-",""))}`:""}</p>
      ${error?`<div class="aic-error">${esc(error)}</div>`:""}

      <section class="aic-section"><h2>需要你處理</h2>
        ${todo.length?`<div class="aic-todo">${todo.map(item=>`<article class="aic-todo-item ${item.tone}"><div><b>${esc(item.title)}</b><p>${esc(item.text)}</p></div><button class="button" data-route="${item.route}">${esc(item.cta)}</button></article>`).join("")}</div>`
          :summary?`<div class="aic-allgood"><span>✓</span>目前沒有需要你處理的事。</div>`:`<div class="aic-allgood muted">讀到雲端狀態後才知道。</div>`}
      </section>

      <section class="aic-section"><h2>自動化</h2>
        <div class="aic-autos">${autos.map(a=>`<div class="aic-auto"><i class="${summary||a.name==="影音上傳"?(a.ok?"ok":"bad"):"idle"}"></i><div><b>${esc(a.name)}</b><small>${esc(a.when)}</small><p>${esc(a.detail)}</p></div></div>`).join("")}</div>
      </section>

      <section class="aic-section"><h2>各區資料</h2>
        <div class="aic-areas">${cards.map(card=>{const [label,mark]=SOURCES[card.key]||[card.label,"·"];return `<button class="aic-area" data-route="${card.route}"><header><span class="aic-mark">${esc(mark)}</span><b>${esc(card.label||label)}</b>${card.updated?`<small>${esc(ago(card.updated))}</small>`:""}</header>${card.lines?`<div class="aic-nums">${card.lines.map(([value,name])=>`<span><b>${esc(value)}</b><small>${esc(name)}</small></span>`).join("")}</div>`:`<p class="aic-na">${summary||card.key==="engineering"?"沒有資料":"登入後顯示"}</p>`}${card.foot?`<footer>${esc(card.foot)}</footer>`:""}</button>`;}).join("")}</div>
      </section>

      <section class="aic-section"><h2>處理紀錄</h2>
        <div class="aic-filters">${filters.map(([key,label])=>`<button class="chip ${filter===key?"active":""}" data-ai-filter="${key}">${label}</button>`).join("")}</div>
        ${rows.length?`<ol class="aic-log">${rows.map(row=>{const [label,mark]=SOURCES[row.source]||[row.source,"·"];return `<li class="${row.status==="error"?"error":row.status==="warning"?"warn":""}"><span class="aic-mark small">${esc(mark)}</span><div><b>${esc(row.title)}</b>${row.detail?`<p>${esc(row.detail)}</p>`:""}<small>${esc(label)}${row.isRun?" · AI":""} · ${esc(stamp(row.at))}</small></div></li>`;}).join("")}</ol>`:`<div class="empty">${summary?"還沒有紀錄":"登入後顯示"}</div>`}
      </section>
    </div>`;
  }

  function installEvents(root){
    root.addEventListener("click",event=>{
      const el=event.target.closest("[data-ai-refresh],[data-ai-filter]");if(!el)return;
      event.stopImmediatePropagation();
      if(el.hasAttribute("data-ai-refresh"))load({force:true});
      else{filter=el.dataset.aiFilter;rerender();}
    },true);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&appState().route==="weave")load();});
  }

  global.AiCenter=Object.freeze({configure,installEvents,render,refresh:()=>load({force:true})});
})(window);
