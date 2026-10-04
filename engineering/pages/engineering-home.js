(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringHome=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const time=value=>value?new Intl.DateTimeFormat("zh-TW",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—";

  function moduleOptions(modules){
    return modules.length?modules.map(module=>`<label class="engineering-module-option"><input type="checkbox" name="module_ids" value="${esc(module.id)}"><span><b>${esc(module.name)}</b><small>${module.capabilities.length?`${module.capabilities.length} 項能力`:`已註冊 · 功能尚未建立`}</small></span></label>`).join(""):`<p class="engineering-muted">尚無可用專業模組。</p>`;
  }
  function projectCard(project,modules){
    const names=project.module_ids.map(id=>modules.find(module=>module.id===id)?.name||id);
    return `<article class="engineering-project-card" data-engineering-project="${esc(project.id)}"><div><span class="engineering-status ${esc(project.status)}">${project.status==="active"?"進行中":"已封存"}</span><h3>${esc(project.name)}</h3><p>${names.length?esc(names.join("、")):"尚未關聯專業模組"}</p><small>更新：${esc(time(project.updated_at))}</small></div><div class="engineering-card-actions">${project.status==="active"?`<button class="button primary" data-engineering-open="${esc(project.id)}">開啟</button>`:`<button class="button" data-engineering-reopen="${esc(project.id)}">重新開啟</button>`}</div></article>`;
  }
  function section(title,projects,modules,empty){
    return `<section class="engineering-section"><div class="engineering-section-head"><h2>${title}</h2><span>${projects.length} 個</span></div>${projects.length?`<div class="engineering-project-grid">${projects.map(project=>projectCard(project,modules)).join("")}</div>`:`<div class="engineering-empty"><p>${empty}</p></div>`}</section>`;
  }
  function render({modules=[],projects=[],failures=[],loading=false,error="",formError=""}={}){
    const active=projects.filter(project=>project.status==="active"),archived=projects.filter(project=>project.status==="archived");
    const warning=failures.length?`<p class="engineering-warning" role="status">部分專業模組載入失敗，其他功能仍可使用。</p>`:"";
    const body=loading?`<div class="engineering-empty"><p>正在讀取工程專案……</p></div>`:error?`<div class="engineering-error" role="alert"><h2>工程專案暫時無法讀取</h2><p>${esc(error)}</p><button class="button" data-engineering-action="retry">重試</button></div>`:`${section("進行中",active,modules,"尚未建立工程專案。")}${section("已封存",archived,modules,"目前沒有封存專案。")}`;
    return `<section class="engineering-hub" aria-labelledby="engineering-title"><header class="engineering-header"><div><div class="eyebrow">ENGINEERING CENTER · PHASE 10</div><h1 id="engineering-title">工程中心</h1><p>支援離線本機工作、可恢復 Outbox、衝突偵測與安全套用；Engineering AI 草稿仍需人工確認。</p></div><button class="button" data-route="home">返回立之雲端庫</button></header>${warning}<section class="engineering-create"><div><small>NEW PROJECT</small><h2>建立工程專案</h2></div><form data-engineering-form="create"><label>專案名稱<input name="name" maxlength="100" required placeholder="例如：客廳收納工程"></label><fieldset><legend>專業模組（可選）</legend>${moduleOptions(modules)}</fieldset>${formError?`<p class="engineering-form-error" role="alert">${esc(formError)}</p>`:""}<button class="button primary">建立並開啟</button></form></section>${body}</section>`;
  }
  return Object.freeze({render});
});
