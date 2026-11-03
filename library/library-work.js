// 立之圖書館｜工作專區：公文放置。
// 公文原檔放使用者的 Google Drive（收文／發文資料夾），每晚圖書館整理時由 Claude 登記並填欄位；
// 網頁負責列表、搜尋篩選、修改欄位、處理狀態與手動登記。資料表：lizhi_library_official_docs。
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.LibraryWork=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(global){
  "use strict";

  const TABLE="lizhi_library_official_docs";
  const COLUMNS="id,direction,doc_no,issuer,recipient,subject,doc_date,received_date,due_date,speed,secrecy,summary,tags,user_note,status,closed_at,drive_file_id,drive_folder_id,file_name,mime,ai_status,ai_note,ai_filled_at,created_at,updated_at";
  const FOLDERS=Object.freeze({
    root:"1XTIZa7LRAAsd1aKSqYGS_BOjQxZ9esns",
    incoming:"1n5pHpLhanjc6b8UnQwz4lzKRtqFkI4DY",
    outgoing:"1Bt9RdL5EgE0mZGwcuw-tj3mm7qGYAYXa"
  });
  const DIRECTIONS=Object.freeze({incoming:"收文",outgoing:"發文"});
  const STATUSES=Object.freeze({todo:"待辦",doing:"辦理中",closed:"已結案"});
  const SPEEDS=Object.freeze(["最速件","速件","普通件"]);
  const PERIODS=[["","全部期間"],["7","最近 7 天"],["30","最近 30 天"],["90","最近 3 個月"],["365","最近一年"]];
  const SORTS=[["date","公文日期（新→舊）"],["due","辦理期限（近→遠）"],["created","最新登記"]];
  const EDIT_FIELDS=["direction","doc_no","issuer","recipient","subject","doc_date","received_date","due_date","speed","secrecy","summary","user_note","status"];
  const LIMITS={doc_no:120,issuer:120,recipient:200,subject:1000,secrecy:20,summary:4000,user_note:2000};
  const DAY=86400000;

  // ───────── 純函式（node 測試可直接載入） ─────────
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const ymd=date=>{const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const docDate=doc=>doc.doc_date||doc.received_date||String(doc.created_at||"").slice(0,10);
  const titleOf=doc=>doc.subject||doc.file_name||"（未填主旨）";

  // 期限狀態：overdue 逾期、soon 三天內、later、none；已結案不算
  function dueState(doc,today=new Date()){
    if(!doc.due_date||doc.status==="closed")return "none";
    const diff=Math.round((Date.parse(doc.due_date+"T00:00:00")-Date.parse(ymd(today)+"T00:00:00"))/DAY);
    return diff<0?"overdue":diff<=3?"soon":"later";
  }

  function driveFileId(value){
    const text=String(value||"").trim();
    if(!text)return null;
    if(/^[A-Za-z0-9_-]{8,200}$/.test(text))return text;
    let url;try{url=new URL(text);}catch{return undefined;}
    if(!/(^|\.)google\.com$/.test(url.hostname))return undefined;
    const match=url.pathname.match(/\/d\/([A-Za-z0-9_-]{8,200})/)||[null,url.searchParams.get("id")];
    return match[1]&&/^[A-Za-z0-9_-]{8,200}$/.test(match[1])?match[1]:undefined;
  }
  const driveUrl=id=>id?`https://drive.google.com/file/d/${encodeURIComponent(id)}/view`:"";
  const folderUrl=id=>`https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;

  // 表單資料 → 可寫入的欄位（空字串轉 null、超長拒絕、日期與選項檢查）
  function sanitize(input){
    const out={};
    for(const key of EDIT_FIELDS){
      if(!(key in input))continue;
      let value=String(input[key]??"").trim();
      if(key==="direction"){if(!DIRECTIONS[value])throw new Error("收發文類別無效");out[key]=value;continue;}
      if(key==="status"){if(!STATUSES[value])throw new Error("處理狀態無效");out[key]=value;continue;}
      if(key==="speed"){if(value&&!SPEEDS.includes(value))throw new Error("速別無效");out[key]=value||null;continue;}
      if(/_date$/.test(key)){if(value&&!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("日期格式需為 YYYY-MM-DD");out[key]=value||null;continue;}
      if(LIMITS[key]&&value.length>LIMITS[key])throw new Error(`欄位太長（上限 ${LIMITS[key]} 字）`);
      out[key]=value||null;
    }
    return out;
  }

  function metaMatch(doc,needle){
    return [doc.subject,doc.doc_no,doc.issuer,doc.recipient,doc.summary,doc.user_note,doc.file_name,...(doc.tags||[])]
      .some(value=>String(value||"").toLocaleLowerCase().includes(needle));
  }

  function filterDocs(docs,{direction="",status="",issuer="",period="",query="",hits=new Map(),sort="date",today=new Date()}={}){
    const needle=String(query).trim().toLocaleLowerCase();
    const since=period?ymd(new Date(today.getTime()-Number(period)*DAY)):"";
    const rows=docs.filter(doc=>{
      if(direction&&doc.direction!==direction)return false;
      if(status==="overdue"){if(dueState(doc,today)!=="overdue")return false;}
      else if(status&&doc.status!==status)return false;
      if(issuer&&(doc.issuer||"")!==issuer)return false;
      if(since&&docDate(doc)<since)return false;
      if(needle&&!metaMatch(doc,needle)&&!hits.has(doc.id))return false;
      return true;
    });
    const by={
      date:(a,b)=>docDate(b).localeCompare(docDate(a))||String(b.created_at).localeCompare(String(a.created_at)),
      due:(a,b)=>(a.due_date||"9999").localeCompare(b.due_date||"9999")||docDate(b).localeCompare(docDate(a)),
      created:(a,b)=>String(b.created_at).localeCompare(String(a.created_at))
    };
    return rows.sort(by[sort]||by.date);
  }

  function counts(docs,today=new Date()){
    return {
      todo:docs.filter(d=>d.status==="todo").length,
      doing:docs.filter(d=>d.status==="doing").length,
      closed:docs.filter(d=>d.status==="closed").length,
      overdue:docs.filter(d=>dueState(d,today)==="overdue").length,
      inbox:docs.filter(d=>d.ai_status==="inbox").length
    };
  }

  const pure={TABLE,FOLDERS,DIRECTIONS,STATUSES,SPEEDS,dueState,driveFileId,driveUrl,sanitize,filterDocs,counts,esc};
  if(typeof document==="undefined")return Object.freeze(pure);

  // ───────── 瀏覽器：資料讀寫 ─────────
  const auth=()=>global.LizhiAuth;
  const client=()=>auth()?.client;
  const user=()=>auth()?.user||null;
  const available=()=>!!(client()&&user());
  const friendly=error=>{
    const msg=String(error?.message||error||"");
    if(/lizhi_library_official_docs|relation .* does not exist|schema cache/i.test(msg))return new Error("公文資料表還沒建立（需要套用 migration 20261103030000）");
    if(/row-level security|permission denied/i.test(msg))return new Error("沒有權限：請用核准的帳號登入");
    if(/duplicate key|unique/i.test(msg))return new Error("這個 Drive 檔案已經登記過了");
    return new Error(msg||"公文讀寫失敗");
  };
  const Store={
    async list(){const {data,error}=await client().from(TABLE).select(COLUMNS).is("deleted_at",null).order("created_at",{ascending:false}).limit(1000);if(error)throw friendly(error);return data||[];},
    async search(q){const {data,error}=await client().rpc("lizhi_library_official_docs_search",{q});if(error)throw friendly(error);return data||[];},
    async create(fields){const {data,error}=await client().from(TABLE).insert({...fields,user_id:user().id}).select(COLUMNS).single();if(error)throw friendly(error);return data;},
    async update(id,fields){const {data,error}=await client().from(TABLE).update(fields).eq("id",id).select(COLUMNS).single();if(error)throw friendly(error);return data;},
    async remove(id){const {error}=await client().from(TABLE).update({deleted_at:new Date().toISOString()}).eq("id",id);if(error)throw friendly(error);}
  };

  // ───────── 狀態 ─────────
  let rerenderApp=()=>{},docs=[],loaded=false,loading=false,error="";
  let direction="",status="",issuer="",period="",sort="date",query="";
  let hits=new Map(),searchedFor="",searchTimer=null,searching=false,typingTimer=null;
  const toast=message=>typeof global.toast==="function"?global.toast(message):alert(message);
  const day=value=>value?new Date(value+(String(value).length===10?"T00:00:00":"")).toLocaleDateString("zh-TW",{year:"numeric",month:"numeric",day:"numeric"}):"";

  function configure(options){rerenderApp=options.rerender||rerenderApp;}
  // 重繪後若原本在打字，把焦點與游標放回搜尋框
  function rerender(){
    const typing=typeof document!=="undefined"&&document.activeElement?.matches?.("[data-work-search]");
    rerenderApp();
    if(typing)refocusSearch();
  }

  async function load({force=false}={}){
    if(loading||(loaded&&!force)||!available())return;
    loading=true;
    try{docs=await Store.list();error="";}
    catch(err){error=err.message;}
    finally{loading=false;loaded=true;rerender();}
  }

  function scheduleContentSearch(){
    const term=query.trim();
    if(term===searchedFor)return;
    clearTimeout(searchTimer);
    if(!term){searchedFor="";hits=new Map();return;}
    searchTimer=setTimeout(async()=>{
      searching=true;
      try{const rows=await Store.search(term);if(query.trim()!==term)return;hits=new Map(rows.map(row=>[row.id,row.snippet]));}
      catch{hits=new Map();}
      finally{searching=false;searchedFor=term;rerender();}
    },300);
  }

  // ───────── 畫面 ─────────
  function highlight(text){
    const value=esc(text),needle=query.trim();
    if(!needle)return value;
    return value.replace(new RegExp(esc(needle).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"),m=>`<mark>${m}</mark>`);
  }

  function card(doc){
    const due=dueState(doc),snippet=hits.get(doc.id);
    const dueLabel=doc.due_date?`<span class="work-due ${due}">${due==="overdue"?"已逾期":due==="soon"?"即將到期":"期限"} ${esc(day(doc.due_date))}</span>`:"";
    return `<article class="card work-doc ${doc.status==="closed"?"is-closed":""} ${doc.ai_status==="inbox"?"is-inbox":""}" data-work-open="${esc(doc.id)}" tabindex="0" role="button" aria-label="開啟公文 ${esc(titleOf(doc))}">
      <div class="work-badges">
        <span class="chip work-dir ${doc.direction}">${DIRECTIONS[doc.direction]||""}</span>
        <span class="chip work-status ${doc.status}">${STATUSES[doc.status]||""}</span>
        ${doc.speed&&doc.speed!=="普通件"?`<span class="chip work-speed">${esc(doc.speed)}</span>`:""}
        ${doc.ai_status==="inbox"?`<span class="chip work-wait">等 AI 填欄位</span>`:""}
        ${dueLabel}
      </div>
      <h3>${highlight(titleOf(doc))}</h3>
      <p class="work-line">${[doc.doc_no,doc.issuer,day(docDate(doc))].filter(Boolean).map(highlight).join(" · ")||esc(doc.file_name||"")}</p>
      ${doc.summary?`<p class="library-summary">${highlight(doc.summary)}</p>`:doc.ai_note?`<p class="library-hint">${esc(doc.ai_note)}</p>`:""}
      ${snippet&&query.trim()?`<p class="library-snippet">…${highlight(snippet)}…</p>`:""}
      ${doc.user_note?`<p class="library-note">📝 ${highlight(doc.user_note)}</p>`:""}
    </article>`;
  }

  function chips(name,options,current){
    return options.map(([value,label,count])=>`<button class="chip ${current===value?"active":""}" data-work-${name}="${esc(value)}" aria-pressed="${current===value}">${esc(label)}${count!=null?` <span class="library-source-count">${count}</span>`:""}</button>`).join("");
  }

  function render(){
    if(!available())return `<div class="empty">工作專區的資料存在雲端，請從雲端版立之雲端庫登入後使用。</div>`;
    if(!loaded)load();
    scheduleContentSearch();
    const c=counts(docs),issuers=[...new Set(docs.map(d=>d.issuer).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
    if(issuer&&!issuers.includes(issuer))issuer="";
    const rows=filterDocs(docs,{direction,status,issuer,period,query,hits,sort});
    const option=(value,label,current)=>`<option value="${esc(value)}" ${value===current?"selected":""}>${esc(label)}</option>`;
    return `<div class="work-zone">
      <div class="work-feature-head"><h2>公文</h2><div class="work-actions"><button class="button primary" data-work-new>＋ 手動登記</button><button class="button" data-work-refresh>重新整理</button></div></div>
      <div class="library-storage work-howto">
        <span>📂 把公文丟進 Google Drive</span>
        <div class="library-storage-actions">
          <a class="button" href="${folderUrl(FOLDERS.incoming)}" target="_blank" rel="noopener">收文資料夾</a>
          <a class="button" href="${folderUrl(FOLDERS.outgoing)}" target="_blank" rel="noopener">發文資料夾</a>
        </div>
        <small>Claude 每晚整理圖書館時會一起登記新公文並填好文號、機關、日期、主旨與期限；想馬上處理，回到 Claude 說「<b>幫我整理公文</b>」。原檔只放 Drive，這裡刪除不會刪原檔。</small>
      </div>
      ${error?`<div class="library-error">${esc(error)} <button class="button" data-work-refresh>重試</button></div>`:""}
      <div class="work-stats">
        <button class="stat" data-work-status="todo"><b>${c.todo}</b><small>待辦</small></button>
        <button class="stat" data-work-status="doing"><b>${c.doing}</b><small>辦理中</small></button>
        <button class="stat ${c.overdue?"warn":""}" data-work-status="overdue"><b>${c.overdue}</b><small>逾期</small></button>
        <button class="stat" data-work-status="closed"><b>${c.closed}</b><small>已結案</small></button>
      </div>
      <div class="library-source-tabs" role="group" aria-label="收發文">${chips("direction",[["","全部",docs.length],["incoming","收文",docs.filter(d=>d.direction==="incoming").length],["outgoing","發文",docs.filter(d=>d.direction==="outgoing").length]],direction)}</div>
      <div class="library-source-tabs" role="group" aria-label="處理狀態">${chips("status",[["","全部狀態"],["todo","待辦"],["doing","辦理中"],["overdue","逾期"],["closed","已結案"]],status)}</div>
      <div class="library-toolbar">
        <div class="library-search"><input class="field search" data-work-search type="search" enterkeyhint="search" placeholder="搜尋主旨、文號、機關、備註、公文內文" value="${esc(query)}">${query?`<button class="library-clear" data-work-clear aria-label="清除搜尋">×</button>`:""}</div>
        <div class="library-filters">
          <select data-work-issuer aria-label="機關">${option("","全部機關",issuer)}${issuers.map(name=>option(name,name,issuer)).join("")}</select>
          <select data-work-period aria-label="期間">${PERIODS.map(([v,l])=>option(v,l,period)).join("")}</select>
          <select data-work-sort aria-label="排序">${SORTS.map(([v,l])=>option(v,l,sort)).join("")}</select>
        </div>
      </div>
      <div class="section-head"><h2>${query||direction||status||issuer||period?"篩選結果":"全部公文"}</h2><span class="count">${rows.length} 件${searching?" · 正在搜尋內文…":""}${c.inbox?` · ${c.inbox} 件等 AI 填欄位`:""}</span></div>
      ${loading&&!loaded?`<div class="empty">正在讀取公文…</div>`:rows.length?`<div class="grid">${rows.map(card).join("")}</div>`:`<div class="empty">${docs.length?"沒有符合的公文":"還沒有公文。把 PDF 或照片丟進上面的 Drive 資料夾，或按「手動登記」。"}</div>`}
    </div>`;
  }

  // ───────── 編輯視窗（掛在 body 上，頁面重繪不影響） ─────────
  const Editor=(()=>{
    let node=null;
    function close(){node?.remove();node=null;document.body.classList.remove("library-reading");}
    function field(label,name,value,{type="text",max,wide=false,placeholder=""}={}){
      return `<label class="work-field ${wide?"wide":""}"><span>${label}</span>${type==="textarea"?`<textarea name="${name}" rows="3" ${max?`maxlength="${max}"`:""} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input name="${name}" type="${type}" value="${esc(value)}" ${max?`maxlength="${max}"`:""} placeholder="${esc(placeholder)}">`}</label>`;
    }
    function select(label,name,options,value){
      return `<label class="work-field"><span>${label}</span><select name="${name}">${options.map(([v,l])=>`<option value="${esc(v)}" ${v===(value||"")?"selected":""}>${esc(l)}</option>`).join("")}</select></label>`;
    }
    function open(id){
      const doc=id?docs.find(d=>d.id===id):{direction:direction||"incoming",status:"todo"};
      if(!doc)return;
      close();
      node=document.createElement("div");
      node.className="work-editor";
      node.innerHTML=`<form class="work-editor-panel" novalidate>
        <div class="work-editor-bar"><h2>${id?"公文內容":"手動登記公文"}</h2><button type="button" class="icon-button" data-close aria-label="關閉">×</button></div>
        <div class="work-editor-body">
          ${doc.ai_status==="inbox"?`<p class="library-howto">這份公文還在等 Claude 讀檔填欄位；你也可以先自己填。</p>`:""}
          ${doc.ai_note?`<p class="lib-note">AI 備註：${esc(doc.ai_note)}</p>`:""}
          <div class="work-grid">
            ${select("收發文","direction",Object.entries(DIRECTIONS),doc.direction)}
            ${select("處理狀態","status",Object.entries(STATUSES),doc.status)}
            ${field("主旨","subject",doc.subject,{type:"textarea",max:1000,wide:true})}
            ${field("發文字號","doc_no",doc.doc_no,{max:120,placeholder:"例：府工字第1150001234號"})}
            ${field("發文機關","issuer",doc.issuer,{max:120})}
            ${field("受文者","recipient",doc.recipient,{max:200})}
            ${select("速別","speed",[["","—"],...SPEEDS.map(s=>[s,s])],doc.speed)}
            ${field("發文日期","doc_date",doc.doc_date,{type:"date"})}
            ${field("收文日期","received_date",doc.received_date,{type:"date"})}
            ${field("辦理期限","due_date",doc.due_date,{type:"date"})}
            ${field("密等","secrecy",doc.secrecy,{max:20,placeholder:"普通"})}
            ${field("摘要","summary",doc.summary,{type:"textarea",max:4000,wide:true})}
            ${field("承辦備註","user_note",doc.user_note,{type:"textarea",max:2000,wide:true,placeholder:"例：已電話聯絡、待主任核章"})}
            ${id?"":field("Drive 檔案連結（選填）","drive_link","",{wide:true,placeholder:"貼上 drive.google.com 的檔案連結"})}
          </div>
          ${id&&doc.file_name?`<p class="lib-file-meta">原檔：${esc(doc.file_name)}</p>`:""}
          <p class="work-error" role="alert" hidden></p>
        </div>
        <div class="work-editor-actions">
          ${doc.drive_file_id?`<a class="button" href="${driveUrl(doc.drive_file_id)}" target="_blank" rel="noopener">開啟 Drive 原檔</a>`:""}
          ${id?`<button type="button" class="button danger" data-delete>移除登記</button>`:""}
          <span class="work-spacer"></span>
          <button type="button" class="button" data-close>取消</button>
          <button type="submit" class="button primary">儲存</button>
        </div>
      </form>`;
      document.body.append(node);document.body.classList.add("library-reading");
      const form=node.querySelector("form"),errorBox=node.querySelector(".work-error");
      const fail=message=>{errorBox.textContent=message;errorBox.hidden=false;};
      node.addEventListener("click",event=>{
        if(event.target===node||event.target.closest("[data-close]")){close();return;}
        if(event.target.closest("[data-delete]")){
          if(!confirm("只移除網站上的登記，Drive 原檔不會刪除。確定？"))return;
          Store.remove(id).then(()=>{docs=docs.filter(d=>d.id!==id);close();rerender();toast("已移除登記");}).catch(err=>fail(err.message));
        }
      });
      node.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
      form.addEventListener("submit",async event=>{
        event.preventDefault();
        const data=Object.fromEntries(new FormData(form).entries());
        let fields;
        try{fields=sanitize(data);}catch(err){fail(err.message);return;}
        const button=form.querySelector("[type=submit]");button.disabled=true;
        try{
          if(id){
            const row=await Store.update(id,fields);
            docs=docs.map(d=>d.id===id?row:d);
          }else{
            const fileId=driveFileId(data.drive_link);
            if(fileId===undefined)throw new Error("Drive 連結看不懂，請貼檔案的分享連結或留空");
            if(!fields.subject&&!fileId)throw new Error("至少填主旨或 Drive 連結");
            const row=await Store.create({...fields,drive_file_id:fileId,ai_status:fileId?"inbox":"manual"});
            docs=[row,...docs];
          }
          close();rerender();toast("已儲存");
        }catch(err){fail(err.message);button.disabled=false;}
      });
      node.querySelector("input,textarea,select")?.focus();
    }
    return {open,close};
  })();

  // 輸入時延遲重繪，並把焦點與游標放回搜尋框
  function refocusSearch(){
    const input=document.querySelector("[data-work-search]");
    if(!input)return;
    input.focus();const end=input.value.length;try{input.setSelectionRange(end,end);}catch{}
  }

  function installEvents(rootEl){
    rootEl.addEventListener("click",event=>{
      const el=event.target.closest("[data-work-open],button");
      if(!el||!el.closest(".work-zone"))return;
      const ds=el.dataset;
      if("workOpen" in ds){Editor.open(ds.workOpen);return;}
      if("workNew" in ds){Editor.open(null);return;}
      if("workRefresh" in ds){load({force:true});return;}
      if("workClear" in ds){query="";rerenderApp();refocusSearch();return;}
      if("workDirection" in ds){direction=ds.workDirection;rerender();return;}
      if("workStatus" in ds){status=status===ds.workStatus&&el.classList.contains("stat")?"":ds.workStatus;rerender();return;}
    });
    rootEl.addEventListener("keydown",event=>{
      if((event.key==="Enter"||event.key===" ")&&event.target.matches?.("[data-work-open]")){event.preventDefault();event.target.click();}
    });
    rootEl.addEventListener("input",event=>{
      if(!event.target.matches("[data-work-search]"))return;
      query=event.target.value;
      clearTimeout(typingTimer);
      typingTimer=setTimeout(rerender,250);
    });
    rootEl.addEventListener("change",event=>{
      const t=event.target;
      if(t.matches("[data-work-issuer]")){issuer=t.value;rerender();}
      if(t.matches("[data-work-period]")){period=t.value;rerender();}
      if(t.matches("[data-work-sort]")){sort=t.value;rerender();}
    });
  }

  return Object.freeze({...pure,configure,installEvents,render,refresh:()=>load({force:true}),open:id=>Editor.open(id)});
});
