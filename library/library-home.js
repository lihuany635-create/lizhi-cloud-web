// 立之圖書館：上傳、搜尋與篩選、依書架瀏覽、網站內閱讀。
(function(global){
  "use strict";

  const STAGE={extract:"讀取內容",upload:"上傳中",save:"登記中",done:"已放進待整理",error:"失敗"};
  const TIME_RANGES=[["","全部時間"],["7","最近 7 天"],["30","最近 30 天"],["365","最近一年"]];
  const SORTS=[["new","最新上傳"],["organized","最近整理"],["title","書名"]];
  const TEXT_EXT=/\.(txt|md|markdown|csv|tsv|json|html?|xml|ya?ml|log|js|ts|py|css|sql)$/i;

  let rerender=()=>{},items=[],loaded=false,loading=false,error="",uploads=[],note="",pollTimer=null;
  let shelfFilter="",tagFilter="",timeFilter="",sortBy="new";
  let contentHits=new Map(),searchedFor="",searchTimer=null,searching=false;

  const fileInput=document.createElement("input");
  fileInput.type="file";fileInput.multiple=true;fileInput.hidden=true;
  fileInput.accept=".pdf,.doc,.docx,.xls,.xlsx,.ods,.ppt,.pptx,.txt,.md,.csv,.tsv,.json,.html,.xml,.yaml,.yml,image/*";

  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const bytes=n=>n>=1048576?`${(n/1048576).toFixed(1)} MB`:n>=1024?`${Math.round(n/1024)} KB`:`${n} B`;
  const day=value=>value?new Date(value).toLocaleDateString("zh-TW",{year:"numeric",month:"numeric",day:"numeric"}):"";
  const appState=()=>(typeof state!=="undefined"?state:global.state)||{};
  const rawQuery=()=>String(appState().query??"").trim();
  const query=()=>rawQuery().toLocaleLowerCase();
  const titleOf=item=>item.title||item.file_name;
  const isImage=item=>(item.mime||"").startsWith("image/");
  const isPdf=item=>item.mime==="application/pdf"||/\.pdf$/i.test(item.file_name);
  const isText=item=>(item.mime||"").startsWith("text/")||TEXT_EXT.test(item.file_name);
  const icon=item=>isImage(item)?"▧":isPdf(item)?"▤":/\.(xlsx?|ods|csv|tsv)$/i.test(item.file_name)?"▦":/\.pptx?$/i.test(item.file_name)?"▭":"▤";
  const find=id=>items.find(item=>item.id===id);
  const toast=message=>typeof global.toast==="function"?global.toast(message):typeof window.toast==="function"?window.toast(message):alert(message);

  function highlight(text){
    const value=esc(text),needle=rawQuery();
    if(!needle)return value;
    const pattern=new RegExp(esc(needle).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi");
    return value.replace(pattern,match=>`<mark>${match}</mark>`);
  }

  function configure(options){rerender=options.rerender||rerender;}

  async function load({force=false}={}){
    if(loading||(loaded&&!force)||!global.LibraryStore?.available())return;
    loading=true;
    try{items=await global.LibraryStore.list();error="";}
    catch(err){error=err.message;}
    finally{loading=false;loaded=true;rerender();schedulePoll();Reader.refreshInfo();}
  }

  // 有書還在待整理時，每 30 秒看一次整理好了沒
  function schedulePoll(){
    clearTimeout(pollTimer);
    if(!items.some(item=>item.status==="inbox"))return;
    pollTimer=setTimeout(()=>{if(appState().route==="knowledge"&&!document.hidden)load({force:true});else schedulePoll();},30000);
  }

  // 內文搜尋：停止打字 300ms 後問資料庫
  function scheduleContentSearch(){
    const term=rawQuery();
    if(term===searchedFor)return;
    clearTimeout(searchTimer);
    if(!term){searchedFor="";contentHits=new Map();return;}
    searchTimer=setTimeout(async()=>{
      searching=true;
      try{const rows=await global.LibraryStore.search(term);if(rawQuery()!==term)return;contentHits=new Map(rows.map(row=>[row.id,row.snippet]));}
      catch{contentHits=new Map();}
      finally{searching=false;searchedFor=term;rerender();}
    },300);
  }

  function metaMatch(item,needle){
    return [item.title,item.file_name,item.summary,item.shelf,item.user_note,...(item.tags||[]),...(item.key_points||[])]
      .some(value=>String(value||"").toLocaleLowerCase().includes(needle));
  }

  function filtered(){
    const needle=query(),since=timeFilter?Date.now()-Number(timeFilter)*86400000:0;
    let rows=items.filter(item=>{
      if(shelfFilter&&(item.shelf||"未分類")!==shelfFilter)return false;
      if(tagFilter&&!(item.tags||[]).includes(tagFilter))return false;
      if(since&&Date.parse(item.created_at)<since)return false;
      if(needle&&!metaMatch(item,needle)&&!contentHits.has(item.id))return false;
      return true;
    });
    const by={
      new:(a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at),
      organized:(a,b)=>(Date.parse(b.organized_at||0)||0)-(Date.parse(a.organized_at||0)||0),
      title:(a,b)=>titleOf(a).localeCompare(titleOf(b),"zh-Hant")
    };
    return rows.sort(by[sortBy]||by.new);
  }

  async function uploadFiles(files){
    const batchNote=note;
    const jobs=[...files].map(file=>({name:file.name,stage:"extract",error:"",file}));
    uploads=[...jobs,...uploads].slice(0,30);rerender();
    for(const job of jobs){
      try{
        const row=await global.LibraryStore.upload(job.file,{note:batchNote,onStage:stage=>{job.stage=stage;rerender();}});
        items=[row,...items];job.stage="done";
      }catch(err){job.stage="error";job.error=err.message;}
      delete job.file;rerender();
    }
    note="";schedulePoll();rerender();
    setTimeout(()=>{uploads=uploads.filter(job=>job.stage!=="done");rerender();},8000);
  }

  function card(item){
    const inbox=item.status==="inbox",snippet=contentHits.get(item.id);
    return `<article class="card library-card ${inbox?"is-inbox":""}" data-library-read="${esc(item.id)}" tabindex="0" role="button" aria-label="開啟 ${esc(titleOf(item))}">
      ${item.thumb?`<img class="library-thumb" src="${esc(item.thumb)}" alt="" loading="lazy">`:""}
      <div class="card-top"><span class="library-icon">${icon(item)}</span>${inbox?`<span class="chip library-wait">待整理</span>`:`<span class="chip library-shelf-chip">${esc(item.shelf||"未分類")}</span>`}</div>
      <h3>${highlight(titleOf(item))}</h3>
      ${item.title&&item.title!==item.file_name?`<p class="library-file">${highlight(item.file_name)}</p>`:""}
      ${item.summary?`<p class="library-summary">${highlight(item.summary)}</p>`:inbox?`<p class="library-hint">${esc(item.extract_note||"等整理後會寫上摘要與重點")}</p>`:""}
      ${snippet&&query()?`<p class="library-snippet">…${highlight(snippet)}…</p>`:""}
      ${item.tags?.length?`<div class="meta">${item.tags.map(tag=>`<span class="chip">${highlight(tag)}</span>`).join("")}</div>`:""}
      <p class="library-meta">${bytes(item.size||0)} · ${day(item.created_at)}${item.key_points?.length?` · ${item.key_points.length} 個重點`:""}</p>
    </article>`;
  }

  function uploadList(){
    if(!uploads.length)return "";
    return `<ul class="library-uploads">${uploads.slice(0,6).map(job=>`<li class="${job.stage}"><b>${esc(job.name)}</b><span>${esc(STAGE[job.stage]||job.stage)}${job.error?`：${esc(job.error)}`:""}</span></li>`).join("")}</ul>`;
  }

  function toolbar(allTags){
    const option=(value,label,current)=>`<option value="${esc(value)}" ${value===current?"selected":""}>${esc(label)}</option>`;
    return `<div class="library-toolbar">
      <div class="library-search"><input class="field search" data-search type="search" enterkeyhint="search" placeholder="搜尋書名、摘要、重點、標籤、內文" value="${esc(rawQuery())}">${rawQuery()?`<button class="library-clear" data-action="clear-search" aria-label="清除搜尋">×</button>`:""}</div>
      <div class="library-filters">
        <select data-library-tag aria-label="標籤">${option("","全部標籤",tagFilter)}${allTags.map(tag=>option(tag,"# "+tag,tagFilter)).join("")}</select>
        <select data-library-time aria-label="上傳時間">${TIME_RANGES.map(([value,label])=>option(value,label,timeFilter)).join("")}</select>
        <select data-library-sort aria-label="排序">${SORTS.map(([value,label])=>option(value,label,sortBy)).join("")}</select>
      </div>
    </div>`;
  }

  function page(){
    const upload=`<button class="button primary" data-action="upload-library">↑ 上傳</button>`;
    const header=typeof head==="function"?head("LIZHI LIBRARY","圖書館","把檔案放進來，Claude 每天會讀過、取書名、寫摘要與重點，並排上書架。",upload):`<h1>圖書館</h1>`;
    if(!global.LibraryStore?.available())return `${header}<section class="section library-section"><div class="empty">圖書館的檔案存在雲端，請從雲端版立之雲端庫登入後使用。</div></section>`;
    if(!loaded)load();
    scheduleContentSearch();

    const shelved=items.filter(item=>item.status!=="inbox");
    const allShelves=[...new Set(shelved.map(item=>item.shelf||"未分類"))].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
    const allTags=[...new Set(items.flatMap(item=>item.tags||[]))].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
    if(shelfFilter&&!allShelves.includes(shelfFilter))shelfFilter="";
    if(tagFilter&&!allTags.includes(tagFilter))tagFilter="";
    const rows=filtered(),filtering=!!(query()||tagFilter||timeFilter||shelfFilter);
    const busy=uploads.some(job=>!["done","error"].includes(job.stage));
    const inboxCount=items.filter(item=>item.status==="inbox").length;

    let body="";
    if(filtering){
      body=`<div class="section-head"><h2>${query()?"搜尋結果":"篩選結果"}</h2><span class="count">${rows.length} 本${searching?" · 正在搜尋內文…":""}</span></div>
        ${rows.length?`<div class="grid">${rows.map(card).join("")}</div>`:`<div class="empty">${searching?"正在搜尋內文…":"沒有符合的館藏"}</div>`}`;
    }else{
      const inbox=rows.filter(item=>item.status==="inbox");
      const groups=new Map();
      for(const item of rows.filter(item=>item.status!=="inbox")){const key=item.shelf||"未分類";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
      body=`${inbox.length?`<div class="section-head"><h2>待整理</h2><span class="count">${inbox.length} 本</span></div>
          <p class="library-howto">Claude 每天晚上會自動整理這些書；想馬上整理，回到 Claude 說「<b>幫我整理圖書館</b>」。</p>
          <div class="grid">${inbox.map(card).join("")}</div>`:""}
        ${[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0],"zh-Hant")).map(([name,list])=>`<div class="library-shelf"><div class="section-head"><h2>${esc(name)}</h2><span class="count">${list.length} 本</span></div><div class="grid">${list.map(card).join("")}</div></div>`).join("")}
        ${!items.length&&loaded&&!error?`<div class="empty">圖書館還是空的，先上傳幾份檔案吧。</div>`:""}
        ${loading&&!loaded?`<div class="empty">正在開館…</div>`:""}`;
    }

    return `${header}<section class="section library-section">
      <div class="library-intake">
        <div class="dropzone library-drop" data-library-drop role="button" tabindex="0">
          <strong>${busy?"正在上傳…":"把檔案放進圖書館"}</strong>
          <small>點這裡選檔案或拖曳進來 · PDF、Word、Excel、PowerPoint、文字檔、圖片 · 單檔 50 MB</small>
        </div>
        <label class="library-note-field"><span>給 Claude 的備註（選填，套用到這批檔案）</span><input data-library-batch-note maxlength="500" placeholder="例如：這些是土木施工課的講義" value="${esc(note)}"></label>
        ${uploadList()}
      </div>
      ${error?`<div class="library-error">${esc(error)} <button class="button" data-library-refresh>重試</button></div>`:""}
      <p class="library-count">館藏 ${items.length} 本 · 書架 ${allShelves.length} 個${inboxCount?` · 待整理 ${inboxCount} 本`:""}</p>
      ${toolbar(allTags)}
      ${allShelves.length>1?`<div class="library-shelf-tabs"><button class="chip ${shelfFilter?"":"active"}" data-library-shelf="">全部書架</button>${allShelves.map(name=>`<button class="chip ${shelfFilter===name?"active":""}" data-library-shelf="${esc(name)}">${esc(name)}</button>`).join("")}</div>`:""}
      ${body}
    </section>`;
  }

  // ───────── 閱讀器：獨立掛在 body 上，頁面重繪不會打斷 PDF 繪製 ─────────
  const Reader=(()=>{
    let root=null,currentId="",pdfTask=null,observer=null,tab="content",version=0;

    function close({fromHistory=false}={}){
      if(!root)return;
      version++;observer?.disconnect();observer=null;
      try{pdfTask?.destroy?.();}catch{}pdfTask=null;
      root.remove();root=null;currentId="";document.body.classList.remove("library-reading");
      if(!fromHistory&&history.state?.libraryReader)history.back();
    }

    function infoHtml(item){
      const related=(item.related_ids||[]).map(find).filter(Boolean);
      return `${item.status==="inbox"?`<p class="chip library-wait">待整理</p>`:`<p class="chip library-shelf-chip">${esc(item.shelf||"未分類")}</p>`}
        ${item.summary?`<h3>摘要</h3><p class="lib-info-summary">${esc(item.summary)}</p>`:`<p class="library-hint">${item.status==="inbox"?"整理後會在這裡寫上摘要與重點。":"沒有摘要。"}</p>`}
        ${item.key_points?.length?`<h3>重點</h3><ol class="lib-points">${item.key_points.map(point=>`<li>${esc(point)}</li>`).join("")}</ol>`:""}
        ${item.tags?.length?`<h3>標籤</h3><div class="meta">${item.tags.map(tag=>`<button class="chip" data-library-tag-jump="${esc(tag)}">${esc(tag)}</button>`).join("")}</div>`:""}
        ${related.length?`<h3>相關的書</h3><ul class="lib-related">${related.map(book=>`<li><button data-library-read="${esc(book.id)}"><span>${icon(book)}</span>${esc(titleOf(book))}</button></li>`).join("")}</ul>`:""}
        <h3>檔案</h3>
        <p class="lib-file-meta">${esc(item.file_name)}<br>${bytes(item.size||0)} · ${day(item.created_at)} 上傳${item.organized_at?` · ${day(item.organized_at)} 整理`:""}</p>
        <p class="lib-note">${item.user_note?`備註：${esc(item.user_note)}`:"還沒有備註"}</p>
        <div class="lib-info-actions">
          <button class="button" data-library-note="${esc(item.id)}">${item.user_note?"改備註":"加備註"}</button>
          <button class="button danger" data-library-delete="${esc(item.id)}">刪除</button>
        </div>`;
    }

    function shell(item){
      return `<div class="lib-reader tab-${tab}" role="dialog" aria-modal="true" aria-label="${esc(titleOf(item))}">
        <header class="lib-reader-bar">
          <button class="icon-button" data-reader-close aria-label="返回圖書館">‹</button>
          <h2>${esc(titleOf(item))}</h2>
          <button class="button" data-reader-ask title="複製問句，貼給 Claude">問這本書</button>
          <button class="button" data-reader-download>下載</button>
        </header>
        <nav class="lib-reader-tabs"><button data-reader-tab="content" class="${tab==="content"?"active":""}">內容</button><button data-reader-tab="info" class="${tab==="info"?"active":""}">摘要與重點</button></nav>
        <div class="lib-reader-body">
          <section class="lib-viewer" data-reader-viewer><div class="lib-viewer-status">正在打開…</div></section>
          <aside class="lib-info" data-reader-info>${infoHtml(item)}</aside>
        </div>
      </div>`;
    }

    async function open(id){
      const item=find(id);if(!item)return;
      if(root)close({fromHistory:true});else history.pushState({...(history.state||{}),libraryReader:true},"");
      currentId=id;tab="content";
      const holder=document.createElement("div");holder.innerHTML=shell(item);root=holder.firstElementChild;
      document.body.append(root);document.body.classList.add("library-reading");
      root.querySelector("[data-reader-close]").focus();
      const mine=++version;
      const viewer=root.querySelector("[data-reader-viewer]");
      try{
        if(isImage(item)){
          const url=await global.LibraryStore.openUrl(item);if(mine!==version)return;
          viewer.innerHTML=`<img class="lib-image" src="${esc(url)}" alt="${esc(titleOf(item))}">`;
        }else if(isPdf(item)){
          await renderPdf(item,viewer,mine);
        }else if(isText(item)){
          const url=await global.LibraryStore.openUrl(item);
          const text=await (await fetch(url)).text();if(mine!==version)return;
          viewer.innerHTML=`<pre class="lib-text">${esc(text.slice(0,500000))}</pre>`;
        }else{
          const data=await global.LibraryStore.detail(item.id);if(mine!==version)return;
          viewer.innerHTML=data.text_excerpt
            ?`<p class="lib-viewer-note">這是從檔案抽出的文字，原本的排版請按「下載」查看。</p><pre class="lib-text">${esc(data.text_excerpt)}</pre>`
            :`<div class="lib-viewer-status">這個檔案沒有可顯示的文字${data.extract_note?`（${esc(data.extract_note)}）`:""}，請按「下載」打開。</div>`;
        }
      }catch(err){
        if(mine===version)viewer.innerHTML=`<div class="lib-viewer-status">打不開：${esc(err.message)}<br>可以按「下載」改用其他 App 開啟。</div>`;
      }
    }

    async function renderPdf(item,viewer,mine){
      viewer.innerHTML=`<div class="lib-viewer-status">正在載入 PDF…</div>`;
      const [lib,url]=await Promise.all([global.LibraryExtract.pdfLib(),global.LibraryStore.openUrl(item)]);
      pdfTask=lib.getDocument({url});
      const pdf=await pdfTask.promise;if(mine!==version)return;
      const first=await pdf.getPage(1),base=first.getViewport({scale:1});
      viewer.innerHTML=`<p class="lib-viewer-note">共 ${pdf.numPages} 頁</p><div class="lib-pages">${Array.from({length:pdf.numPages},(_,i)=>`<div class="lib-page" data-page="${i+1}" style="aspect-ratio:${base.width}/${base.height}"><span>${i+1}</span></div>`).join("")}</div>`;
      const rendered=new Set();
      observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          const box=entry.target,number=Number(box.dataset.page);
          if(rendered.has(number))continue;rendered.add(number);
          pdf.getPage(number).then(page=>{
            if(mine!==version)return;
            const width=box.clientWidth||viewer.clientWidth||360,ratio=Math.min(global.devicePixelRatio||1,2);
            const viewport=page.getViewport({scale:width/page.getViewport({scale:1}).width*ratio});
            const canvas=document.createElement("canvas");canvas.width=viewport.width;canvas.height=viewport.height;
            return page.render({canvasContext:canvas.getContext("2d"),viewport}).promise.then(()=>{if(mine===version)box.replaceChildren(canvas);});
          }).catch(()=>{box.querySelector("span").textContent=`第 ${number} 頁無法顯示`;});
        }
      },{root:viewer,rootMargin:"600px 0px"});
      viewer.querySelectorAll(".lib-page").forEach(box=>observer.observe(box));
    }

    function refreshInfo(){
      if(!root)return;
      const item=find(currentId);
      if(!item){close();return;}
      root.querySelector("[data-reader-info]").innerHTML=infoHtml(item);
      root.querySelector(".lib-reader-bar h2").textContent=titleOf(item);
    }

    async function ask(){
      const item=find(currentId);if(!item)return;
      const text=`請根據我圖書館裡的《${titleOf(item)}》（id：${item.id}）回答：`;
      try{await navigator.clipboard.writeText(text);toast("已複製問句，貼給 Claude 後接著打你的問題");}
      catch{prompt("複製這段問句，貼給 Claude：",text);}
    }

    async function download(){
      const item=find(currentId);if(!item)return;
      try{location.href=await global.LibraryStore.openUrl(item,{download:true});}catch(err){alert(err.message);}
    }

    function setTab(next){tab=next;if(!root)return;root.className=`lib-reader tab-${tab}`;root.querySelectorAll("[data-reader-tab]").forEach(el=>el.classList.toggle("active",el.dataset.readerTab===tab));}

    return {open,close,refreshInfo,ask,download,setTab,get id(){return currentId;},get element(){return root;}};
  })();

  async function editNote(id){
    const item=find(id);if(!item)return;
    const value=prompt("給 Claude 的備註（例如：這是哪門課、要放哪個書架）",item.user_note||"");
    if(value===null)return;
    try{const row=await global.LibraryStore.update(item.id,{user_note:value.trim()||null});items=items.map(entry=>entry.id===row.id?row:entry);rerender();Reader.refreshInfo();}
    catch(err){alert(err.message);}
  }

  async function deleteItem(id){
    const item=find(id);if(!item)return;
    if(!confirm(`確定要從圖書館刪除「${titleOf(item)}」？檔案會一起刪除。`))return;
    try{await global.LibraryStore.remove(item);items=items.filter(entry=>entry.id!==item.id);if(Reader.id===item.id)Reader.close();rerender();}
    catch(err){alert(err.message);}
  }

  function onClick(event){
    const el=event.target.closest("[data-library-drop],[data-library-read],button");if(!el)return;
    const stop=()=>{event.preventDefault();event.stopImmediatePropagation();};
    if(el.matches("[data-library-drop]")||el.dataset.action==="upload-library"){stop();fileInput.click();return;}
    if(el.hasAttribute("data-library-refresh")){stop();load({force:true});return;}
    if(el.dataset.libraryRead){stop();Reader.open(el.dataset.libraryRead);return;}
    if(el.dataset.libraryShelf!==undefined){stop();shelfFilter=el.dataset.libraryShelf;rerender();return;}
    if(el.dataset.libraryTagJump){stop();tagFilter=el.dataset.libraryTagJump;shelfFilter="";Reader.close();rerender();return;}
    if(el.dataset.libraryNote){stop();editNote(el.dataset.libraryNote);return;}
    if(el.dataset.libraryDelete){stop();deleteItem(el.dataset.libraryDelete);return;}
    if(el.hasAttribute("data-reader-close")){stop();Reader.close();return;}
    if(el.hasAttribute("data-reader-ask")){stop();Reader.ask();return;}
    if(el.hasAttribute("data-reader-download")){stop();Reader.download();return;}
    if(el.dataset.readerTab){stop();Reader.setTab(el.dataset.readerTab);}
  }

  function installEvents(root){
    document.body.append(fileInput);
    fileInput.addEventListener("change",()=>{if(fileInput.files.length)uploadFiles(fileInput.files);fileInput.value="";});

    root.addEventListener("click",onClick,true);
    document.addEventListener("click",event=>{if(Reader.element?.contains(event.target))onClick(event);},true);
    root.addEventListener("keydown",event=>{
      if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-library-read],[data-library-drop]")){event.preventDefault();event.target.click();}
    });
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&Reader.element)Reader.close();});
    window.addEventListener("popstate",()=>{if(Reader.element)Reader.close({fromHistory:true});});

    root.addEventListener("input",event=>{if(event.target.matches("[data-library-batch-note]"))note=event.target.value;});
    root.addEventListener("change",event=>{
      if(event.target.matches("[data-library-tag]")){tagFilter=event.target.value;rerender();}
      if(event.target.matches("[data-library-time]")){timeFilter=event.target.value;rerender();}
      if(event.target.matches("[data-library-sort]")){sortBy=event.target.value;rerender();}
    });

    root.addEventListener("dragover",event=>{const zone=event.target.closest("[data-library-drop]");if(zone){event.preventDefault();zone.classList.add("dragging");}});
    root.addEventListener("dragleave",event=>{event.target.closest("[data-library-drop]")?.classList.remove("dragging");});
    root.addEventListener("drop",event=>{const zone=event.target.closest("[data-library-drop]");if(!zone)return;event.preventDefault();zone.classList.remove("dragging");if(event.dataTransfer?.files?.length)uploadFiles(event.dataTransfer.files);});

    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&loaded&&appState().route==="knowledge")load({force:true});});
  }

  global.LibraryHome=Object.freeze({configure,installEvents,render:page,refresh:()=>load({force:true}),open:id=>Reader.open(id)});
})(window);
