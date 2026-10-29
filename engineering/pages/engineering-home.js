(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringHome=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const time=value=>value?new Intl.DateTimeFormat("zh-TW",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—";

  function moduleOptions(modules){
    return modules.length?modules.map(module=>`<label class="engineering-module-option"><input type="checkbox" name="module_ids" value="${esc(module.id)}"><span><b>${esc(module.name)}</b><small>${esc([module.id==="woodworking"?"櫃子設計、材料表、報價":module.id==="supervision"?"施工日誌、查驗、缺失、工程文件":"",module.capabilities.length?`${module.capabilities.length} 項功能`:"功能準備中"].filter(Boolean).join(" · "))}</small></span></label>`).join(""):`<p class="engineering-muted">目前沒有可用的專業模組。</p>`;
  }
  const chevron=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
  function projectCard(project,modules){
    const names=project.module_ids.map(id=>modules.find(module=>module.id===id)?.name||id);
    const action=project.status==="active"?`data-engineering-open="${esc(project.id)}"`:`data-engineering-reopen="${esc(project.id)}"`;
    return `<button type="button" class="eng2-project" data-engineering-project="${esc(project.id)}" ${action}><span class="eng2-project-main"><b>${esc(project.name)}</b><span class="eng2-chips light">${names.length?names.map(name=>`<span>${esc(name)}</span>`).join(""):`<span>一般專案</span>`}</span><small>${project.status==="active"?`更新於 ${esc(time(project.updated_at))}`:"已封存 · 點一下重新開啟"}</small></span><span class="eng2-project-chev">${chevron}</span></button>`;
  }
  function render({modules=[],projects=[],failures=[],loading=false,error="",formError=""}={}){
    const active=projects.filter(project=>project.status==="active"),archived=projects.filter(project=>project.status==="archived");
    const warning=failures.length?`<p class="engineering-warning" role="status">部分專業模組載入失敗，其他功能仍可使用。</p>`:"";
    const openForm=!!formError||(!loading&&!error&&!projects.length);
    const body=loading?`<div class="engineering-empty"><p>正在讀取工程專案…</p></div>`
      :error?`<div class="engineering-error" role="alert"><h2>工程專案暫時讀不到</h2><p>${esc(error)}</p><button class="button" data-engineering-action="retry">重試</button></div>`
      :`<section class="eng2-list"><div class="eng2-card-head"><h2>進行中</h2><span>${active.length} 個專案</span></div>${active.length?active.map(project=>projectCard(project,modules)).join(""):`<div class="eng2-empty">還沒有工程專案，按上面的「新增工程專案」開始。</div>`}</section>${archived.length?`<details class="eng2-archived"><summary>已封存（${archived.length}）</summary>${archived.map(project=>projectCard(project,modules)).join("")}</details>`:""}`;
    return `<section class="eng2 eng2-home" aria-labelledby="engineering-title">
      <header class="eng2-top">
        <div class="eng2-top-row"><span class="eng2-kicker">立之雲端庫</span><button type="button" class="eng2-back light" data-route="home">回封面</button></div>
        <h1 id="engineering-title">工程中心</h1>
        <p>每個工程一個專案：現場紀錄、設計報價、文件都在裡面。</p>
        <details class="eng2-create" ${openForm?"open":""}><summary class="eng2-create-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>新增工程專案</summary>
          <form data-engineering-form="create"><label>專案名稱<input name="name" maxlength="100" required placeholder="例如：客廳收納工程"></label><fieldset><legend>需要哪些功能？（可複選，之後也能改）</legend>${moduleOptions(modules)}</fieldset>${formError?`<p class="engineering-form-error" role="alert">${esc(formError)}</p>`:""}<button class="button primary">建立並開啟</button></form>
        </details>
      </header>
      ${warning}
      <div class="eng2-body"><section class="eng2-list eng2-tools" style="margin-bottom:20px"><div class="eng2-card-head"><h2>現場工具</h2><span>不需選專案</span></div><a class="eng2-project" href="./engineering/photo-sheet/" style="text-decoration:none"><span class="eng2-project-main"><b>施工照片填表</b><small>連結資料夾匯入照片、統一尺寸、編號拼圖給 ChatGPT 回填說明、匯出 Excel</small></span><span class="eng2-project-chev">${chevron}</span></a></section>${body}</div>
    </section>`;
  }
  return Object.freeze({render});
});
