// 立之圖書館：上傳檔案、等待 Claude 整理、依書架瀏覽。
(function(global){
  "use strict";

  const STAGE={extract:"讀取內容",upload:"上傳中",save:"登記中",done:"已放進待整理",error:"失敗"};
  let rerender=()=>{},items=[],loaded=false,loading=false,error="",uploads=[],note="",shelfFilter="",expanded="",pollTimer=null;
  const input=document.createElement("input");
  input.type="file";input.multiple=true;input.hidden=true;
  input.accept=".pdf,.doc,.docx,.xls,.xlsx,.ods,.ppt,.pptx,.txt,.md,.csv,.tsv,.json,.html,.xml,.yaml,.yml,image/*";

  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const bytes=n=>n>=1048576?`${(n/1048576).toFixed(1)} MB`:n>=1024?`${Math.round(n/1024)} KB`:`${n} B`;
  const day=value=>value?new Date(value).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"}):"";
  const appState=()=>(typeof state!=="undefined"?state:global.state)||{};
  const query=()=>String(appState().query??"").trim().toLocaleLowerCase();
  const icon=item=>item.mime?.startsWith("image/")?"▧":/pdf$/i.test(item.file_name)?"▤":/\.(xlsx?|ods|csv|tsv)$/i.test(item.file_name)?"▦":/\.pptx?$/i.test(item.file_name)?"▭":"▤";

  function configure(options){rerender=options.rerender||rerender;}

  async function load({force=false}={}){
    if(loading||(loaded&&!force)||!global.LibraryStore?.available())return;
    loading=true;
    try{items=await global.LibraryStore.list();error="";}
    catch(err){error=err.message;}
    finally{loading=false;loaded=true;rerender();schedulePoll();}
  }

  // 有書還在待整理時，每 30 秒看一次 Claude 整理好了沒
  function schedulePoll(){
    clearTimeout(pollTimer);
    if(!items.some(item=>item.status==="inbox"))return;
    pollTimer=setTimeout(()=>{if(appState().route==="knowledge"&&!document.hidden)load({force:true});else schedulePoll();},30000);
  }

  function matches(item){
    const needle=query();
    if(shelfFilter&&(item.shelf||"")!==shelfFilter)return false;
    if(!needle)return true;
    return [item.title,item.file_name,item.summary,item.shelf,item.user_note,...(item.tags||[])].some(value=>String(value||"").toLocaleLowerCase().includes(needle));
  }

  async function uploadFiles(files){
    const batchNote=note;
    const jobs=[...files].map(file=>({id:crypto.randomUUID(),name:file.name,stage:"extract",error:"",file}));
    uploads=[...jobs,...uploads].slice(0,30);rerender();
    for(const job of jobs){
      try{
        const row=await global.LibraryStore.upload(job.file,{note:batchNote,onStage:stage=>{job.stage=stage;rerender();}});
        items=[row,...items];job.stage="done";
      }catch(err){job.stage="error";job.error=err.message;}
      delete job.file;rerender();
    }
    note="";schedulePoll();rerender();
  }

  function card(item){
    const open=expanded===item.id;
    const title=item.title||item.file_name;
    const thumb=item.thumb?`<img class="library-thumb" src="${esc(item.thumb)}" alt="">`:"";
    const inbox=item.status==="inbox";
    return `<article class="card library-card ${inbox?"is-inbox":""}">
      ${thumb}
      <div class="card-top"><span class="library-icon">${icon(item)}</span>${inbox?`<span class="chip library-wait">待整理</span>`:item.shelf?`<span class="chip library-shelf-chip">${esc(item.shelf)}</span>`:""}</div>
      <h3>${esc(title)}</h3>
      ${item.title&&item.title!==item.file_name?`<p class="library-file">${esc(item.file_name)}</p>`:""}
      ${item.summary?`<p class="library-summary ${open?"open":""}">${esc(item.summary)}</p>`:inbox?`<p class="library-hint">${esc(item.extract_note||"等 Claude 讀完後會寫上摘要")}</p>`:""}
      ${item.tags?.length?`<div class="meta">${item.tags.map(tag=>`<span class="chip"># ${esc(tag)}</span>`).join("")}</div>`:""}
      ${item.user_note?`<p class="library-note">備註：${esc(item.user_note)}</p>`:""}
      <p class="library-meta">${bytes(item.size||0)} · ${day(item.created_at)}${item.organized_at?` · ${day(item.organized_at)} 整理`:""}</p>
      <div class="card-actions">
        <button class="button" data-library-open="${esc(item.id)}">開啟</button>
        ${item.summary&&item.summary.length>90?`<button class="button" data-library-expand="${esc(item.id)}">${open?"收合":"展開摘要"}</button>`:""}
        <button class="button" data-library-note="${esc(item.id)}">${item.user_note?"改備註":"加備註"}</button>
        <button class="icon-button" title="刪除" data-library-delete="${esc(item.id)}">×</button>
      </div>
    </article>`;
  }

  function uploadList(){
    const active=uploads;
    if(!active.length)return "";
    return `<ul class="library-uploads">${active.slice(0,8).map(job=>`<li class="${job.stage}"><b>${esc(job.name)}</b><span>${esc(STAGE[job.stage]||job.stage)}${job.error?`：${esc(job.error)}`:""}</span></li>`).join("")}</ul>`;
  }

  function render(){
    if(!global.LibraryStore?.available()){
      return `<section class="section library-section"><div class="section-head"><h2>書架</h2></div><div class="empty">圖書館的檔案存在雲端，請從雲端版立之雲端庫登入後使用。</div></section>`;
    }
    if(!loaded)load();
    const visible=items.filter(matches);
    const inbox=visible.filter(item=>item.status==="inbox");
    const shelved=visible.filter(item=>item.status!=="inbox");
    const allShelves=[...new Set(items.filter(item=>item.status!=="inbox").map(item=>item.shelf||"未分類"))].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
    const groups=new Map();
    for(const item of shelved){const key=item.shelf||"未分類";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
    const busy=uploads.some(job=>!["done","error"].includes(job.stage));

    return `<section class="section library-section">
      <div class="library-intake">
        <div class="dropzone library-drop" data-library-drop>
          <strong>${busy?"正在上傳…":"把檔案放進圖書館"}</strong>
          <small>點這裡選檔案，或直接拖曳進來 · PDF、Word、Excel、PowerPoint、文字檔、圖片 · 單檔 50 MB</small>
        </div>
        <label class="library-note-field"><span>給 Claude 的備註（選填，套用到這批檔案）</span><input data-library-batch-note maxlength="500" placeholder="例如：這些是土木施工課的講義" value="${esc(note)}"></label>
        ${uploadList()}
      </div>
      ${error?`<div class="library-error">${esc(error)} <button class="button" data-library-refresh>重試</button></div>`:""}
      <div class="library-stats">
        <div class="stat"><b>${items.length}</b><small>館藏</small></div>
        <div class="stat"><b>${items.filter(item=>item.status==="inbox").length}</b><small>待整理</small></div>
        <div class="stat"><b>${allShelves.length}</b><small>書架</small></div>
      </div>
      ${inbox.length?`<div class="section-head"><h2>待整理</h2><span class="count">${inbox.length} 份</span></div>
        <p class="library-howto">回到 Claude 說「<b>幫我整理圖書館</b>」，Claude 會讀這些檔案，替每份取書名、寫摘要、貼標籤並放上書架。這頁每 30 秒會自動更新。</p>
        <div class="grid">${inbox.map(card).join("")}</div>`:""}
      ${allShelves.length>1?`<div class="library-shelf-tabs"><button class="chip ${shelfFilter?"":"active"}" data-library-shelf="">全部書架</button>${allShelves.map(name=>`<button class="chip ${shelfFilter===name?"active":""}" data-library-shelf="${esc(name)}">${esc(name)}</button>`).join("")}</div>`:""}
      ${[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0],"zh-Hant")).map(([name,rows])=>`<div class="library-shelf"><div class="section-head"><h2>${esc(name)}</h2><span class="count">${rows.length} 份</span></div><div class="grid">${rows.map(card).join("")}</div></div>`).join("")}
      ${!items.length&&loaded&&!error?`<div class="empty">圖書館還是空的，先上傳幾份檔案吧。</div>`:""}
      ${items.length&&!visible.length?`<div class="empty">沒有符合搜尋的館藏</div>`:""}
      ${loading&&!loaded?`<div class="empty">正在開館…</div>`:""}
    </section>`;
  }

  const find=id=>items.find(item=>item.id===id);

  function installEvents(root){
    document.body.append(input);
    input.addEventListener("change",()=>{if(input.files.length)uploadFiles(input.files);input.value="";});

    root.addEventListener("click",async event=>{
      const el=event.target.closest("[data-library-drop],button");if(!el)return;
      if(el.matches("[data-library-drop]")||el.dataset.action==="upload-library"){event.preventDefault();event.stopImmediatePropagation();input.click();return;}
      if(el.hasAttribute("data-library-refresh")){event.stopImmediatePropagation();load({force:true});return;}
      if(el.dataset.libraryShelf!==undefined){event.stopImmediatePropagation();shelfFilter=el.dataset.libraryShelf;rerender();return;}
      if(el.dataset.libraryExpand){event.stopImmediatePropagation();expanded=expanded===el.dataset.libraryExpand?"":el.dataset.libraryExpand;rerender();return;}
      if(el.dataset.libraryOpen){
        event.stopImmediatePropagation();
        const item=find(el.dataset.libraryOpen);if(!item)return;
        const win=window.open("about:blank","_blank");
        try{const url=await global.LibraryStore.openUrl(item,{download:!/^(image\/|application\/pdf|text\/)/.test(item.mime||"")});if(win)win.location=url;else location.href=url;}
        catch(err){win?.close();alert(err.message);}
        return;
      }
      if(el.dataset.libraryNote){
        event.stopImmediatePropagation();
        const item=find(el.dataset.libraryNote);if(!item)return;
        const value=prompt("給 Claude 的備註（例如：這是哪門課、要放哪個書架）",item.user_note||"");
        if(value===null)return;
        try{const row=await global.LibraryStore.update(item.id,{user_note:value.trim()||null});items=items.map(entry=>entry.id===row.id?row:entry);rerender();}
        catch(err){alert(err.message);}
        return;
      }
      if(el.dataset.libraryDelete){
        event.stopImmediatePropagation();
        const item=find(el.dataset.libraryDelete);if(!item)return;
        if(!confirm(`確定要從圖書館刪除「${item.title||item.file_name}」？檔案會一起刪除。`))return;
        try{await global.LibraryStore.remove(item);items=items.filter(entry=>entry.id!==item.id);rerender();}
        catch(err){alert(err.message);}
      }
    },true);

    root.addEventListener("input",event=>{if(event.target.matches("[data-library-batch-note]"))note=event.target.value;});

    root.addEventListener("dragover",event=>{const zone=event.target.closest("[data-library-drop]");if(zone){event.preventDefault();zone.classList.add("dragging");}});
    root.addEventListener("dragleave",event=>{event.target.closest("[data-library-drop]")?.classList.remove("dragging");});
    root.addEventListener("drop",event=>{const zone=event.target.closest("[data-library-drop]");if(!zone)return;event.preventDefault();zone.classList.remove("dragging");if(event.dataTransfer?.files?.length)uploadFiles(event.dataTransfer.files);});

    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&loaded&&appState().route==="knowledge")load({force:true});});
  }

  global.LibraryHome=Object.freeze({configure,installEvents,render,refresh:()=>load({force:true})});
})(window);
