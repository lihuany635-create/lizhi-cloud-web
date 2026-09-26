(function(root,factory){
  const validator=typeof module!=="undefined"&&module.exports?require("./knowledge-weaving-validator.js"):root.KnowledgeWeavingValidator;
  const api=factory(validator);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.KnowledgeWeaving=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Validator){
  "use strict";

  const STORAGE_KEY="lizhi-knowledge-weaving-phase1";
  const AUDIT_KEY="lizhi-knowledge-weaving-audit-v1";
  const DOMAIN_LABELS={ai:"AI／人工智慧",civil:"土木工程",software:"軟體與程式開發",media:"影音與內容製作",learning:"學習與知識方法",humanities:"人文／哲學／探索"};
  const STATUS_LABELS={researching:"待研究",waiting_review:"AI 已整理",reviewing:"待我決定",approved:"已審核",rejected:"已審核",deferred:"暫存"};
  const RELATION_LABELS={extends:"延伸",supports:"支持",contradicts:"矛盾", "example-of":"例子", "same-topic":"同主題",prerequisite:"先備",application:"應用",replace:"取代"};
  const BUCKETS=[
    {key:"researching",label:"待研究",statuses:["researching"]},
    {key:"waiting_review",label:"AI 已整理",statuses:["waiting_review"]},
    {key:"reviewing",label:"待我決定",statuses:["reviewing"]},
    {key:"reviewed",label:"已審核",statuses:["approved","rejected"]},
    {key:"deferred",label:"暫存",statuses:["deferred"]}
  ];
  let proposals=null;
  let selectedId=null;
  let auditEvents=[];
  let inboxSyncStarted=false;
  let inboxSyncStatus="idle";

  const clone=value=>JSON.parse(JSON.stringify(value));
  const h=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const review=()=>({selected_domain:null,domain_resolution:null,reviewed_at:null});
  const mockProposal=proposal=>({schema_version:1,inbox_source:"mock",...proposal});
  const createEvent=(proposalId,eventType,details={})=>({event_id:typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():`event-${Date.now()}-${Math.random()}`,proposal_id:proposalId,event_type:eventType,timestamp:new Date().toISOString(),actor:"user",schema_version:1,details});

  function seedProposals(){return [
    {
      id:"proposal-ai-agent-memory",title:"Agent 記憶應先區分工作狀態與長期知識",summary:"整理 Agent 在任務狀態、短期上下文與長期知識之間的邊界。",sources:["nanobot 研究佇列｜本機 mock"],created_at:"2026-09-20T01:10:00.000Z",
      domain_candidates:[{domain:"ai",confidence:.94,reason:"核心討論 Agent 記憶、模型上下文與知識治理。"}],
      node_candidates:[{id:"node-ai-agent",title:"AI Agent 架構",domain:"ai",reason:"可作為記憶設計的上層節點。"}],
      relation_candidates:[{id:"rel-memory-extends",type:"extends",target_node_id:"node-ai-agent",target_title:"AI Agent 架構",reason:"記憶層是 Agent 架構的延伸設計。",decision:"pending"}],
      suggested_markdown:"# Agent 記憶的三層邊界\n\n- 任務狀態：可丟棄\n- 短期上下文：受上下文視窗限制\n- 長期知識：需經人工治理\n",status:"researching",review:review()
    },
    {
      id:"proposal-validator-boundary",title:"用獨立 Validator 守住資料邊界",summary:"將正式資料規則放在 UI 之外，避免操作介面失效時繞過限制。",sources:["知識編織室 Phase 1 規格"],created_at:"2026-09-20T02:00:00.000Z",
      domain_candidates:[{domain:"software",confidence:.97,reason:"主題是資料驗證、模組邊界與防禦式程式設計。"}],
      node_candidates:[{id:"node-validation",title:"資料驗證策略",domain:"software",reason:"與獨立驗證層直接相關。"},{id:"node-unclassified",title:"待分類的舊筆記",domain:null,reason:"文字相似，但既有節點尚未分類。"}],
      relation_candidates:[{id:"rel-validator-extends",type:"extends",target_node_id:"node-validation",target_title:"資料驗證策略",reason:"補充 UI 之外仍要執行驗證。",decision:"pending"},{id:"rel-validator-unknown",type:"same-topic",target_node_id:"node-unclassified",target_title:"待分類的舊筆記",reason:"關鍵字相似，但尚未建立 Domain。",decision:"pending"}],
      suggested_markdown:"# 獨立 Validator\n\n正式規則必須由獨立驗證器執行，不能只依靠按鈕是否可用。\n",status:"waiting_review",review:review()
    },
    {
      id:"proposal-ai-code-review",title:"AI 輔助 Code Review 的責任邊界",summary:"同時涉及 AI 建議與軟體審查流程，必須選單一 Domain、拆分或暫存。",sources:["內部開發筆記｜mock"],created_at:"2026-09-20T03:00:00.000Z",
      domain_candidates:[{domain:"ai",confidence:.72,reason:"包含模型產生審查建議及幻覺風險。"},{domain:"software",confidence:.81,reason:"落點是 Pull Request 與程式碼審查流程。"}],
      node_candidates:[{id:"node-ai-safety",title:"AI 建議安全邊界",domain:"ai",reason:"可連結模型不得自行批准的原則。"},{id:"node-code-review",title:"Code Review 流程",domain:"software",reason:"可連結人工審查與合併門檻。"}],
      relation_candidates:[{id:"rel-ai-review",type:"application",target_node_id:"node-ai-safety",target_title:"AI 建議安全邊界",reason:"Code Review 是 AI 建議安全的一個應用場景。",decision:"pending"},{id:"rel-code-review",type:"extends",target_node_id:"node-code-review",target_title:"Code Review 流程",reason:"加入 AI 建議後仍由人類作最後決策。",decision:"pending"}],
      suggested_markdown:"# AI 輔助 Code Review\n\nAI 可以指出風險，但不能代替維護者核准。\n",status:"reviewing",review:review()
    },
    {
      id:"proposal-learning-review",title:"間隔複習需要主動回想",summary:"整理間隔複習與主動回想的搭配方式。",sources:["學習方法整理｜mock"],created_at:"2026-09-19T08:00:00.000Z",
      domain_candidates:[{domain:"learning",confidence:.96,reason:"內容聚焦複習策略與學習成效。"}],
      node_candidates:[{id:"node-active-recall",title:"主動回想",domain:"learning",reason:"為本提案的直接先備概念。"}],
      relation_candidates:[{id:"rel-learning-prerequisite",type:"prerequisite",target_node_id:"node-active-recall",target_title:"主動回想",reason:"間隔安排需搭配主動提取，而非只重讀。",decision:"accepted",decided_by:"user"}],
      suggested_markdown:"# 間隔複習與主動回想\n\n每次複習先嘗試回想，再核對答案。\n",status:"approved",review:{selected_domain:"learning",domain_resolution:"selected",domain_selected_by:"user",approved_by:"user",reviewed_at:"2026-09-19T09:00:00.000Z"}
    },
    {
      id:"proposal-documentary-ethics",title:"紀錄片剪輯與敘事倫理",summary:"影音製作與人文倫理交疊，已先暫存等待拆分方向。",sources:["內容製作備忘｜mock"],created_at:"2026-09-18T07:00:00.000Z",
      domain_candidates:[{domain:"media",confidence:.77,reason:"討論剪輯選擇與影音敘事。"},{domain:"humanities",confidence:.74,reason:"同時涉及再現、真實與倫理判斷。"}],
      node_candidates:[{id:"node-editing",title:"影音剪輯",domain:"media",reason:"可承接技術與敘事手段。"}],relation_candidates:[],
      suggested_markdown:"# 紀錄片剪輯與敘事倫理\n\n待決定拆成製作方法與倫理思考，或選擇單一 Domain。\n",status:"deferred",review:{selected_domain:null,domain_resolution:"deferred",reviewed_at:null}
    }
  ].map(mockProposal);}

  function migrateProposal(proposal){return {schema_version:1,inbox_source:"mock",...proposal};}
  function loadAudit(storage){if(auditEvents.length)return auditEvents;try{const parsed=JSON.parse(storage?.getItem(AUDIT_KEY)||"[]");if(Array.isArray(parsed))auditEvents=parsed;}catch{}return auditEvents;}
  function appendUserAudit(storage,proposalId,eventType,details={}){const event=createEvent(proposalId,eventType,details);auditEvents=[...loadAudit(storage),event];try{storage?.setItem(AUDIT_KEY,JSON.stringify(auditEvents));}catch{}return event;}

  function loadProposals(storage){
    if(proposals)return proposals;
    try{const parsed=JSON.parse(storage?.getItem(STORAGE_KEY)||"null");if(Array.isArray(parsed)&&parsed.length)proposals=parsed.map(migrateProposal);}catch{}
    proposals||=seedProposals();
    loadAudit(storage);
    return proposals;
  }
  function saveProposals(storage){try{storage?.setItem(STORAGE_KEY,JSON.stringify(proposals));}catch{}return proposals;}
  function resetForTests(){proposals=null;selectedId=null;auditEvents=[];inboxSyncStarted=false;inboxSyncStatus="idle";}
  function findProposal(id){return proposals?.find(item=>item.id===id)||null;}
  function replaceProposal(next,storage){proposals=proposals.map(item=>item.id===next.id?next:item);saveProposals(storage);return next;}
  async function syncInbox(storage,rerender=()=>{}){
    if(inboxSyncStarted||typeof fetch!=="function")return;inboxSyncStarted=true;inboxSyncStatus="loading";
    try{
      const response=await fetch("./api/weaving/inbox",{cache:"no-store"});
      if(!response.ok||!String(response.headers.get("content-type")||"").includes("application/json"))throw new Error("本機 Inbox API 未啟用");
      const payload=await response.json(),existing=new Set(loadProposals(storage).map(item=>item.id));let added=0;
      for(const external of payload.proposals||[]){if(existing.has(external.id))continue;const result=Validator.validateAiSubmission((({inbox_source,...proposal})=>proposal)(external));if(!result.valid)continue;proposals.push({...external,inbox_source:external.inbox_source||"other",review:review()});existing.add(external.id);added++;}
      if(added)saveProposals(storage);inboxSyncStatus="online";rerender();
    }catch{inboxSyncStatus="unavailable";rerender();}
  }

  function sourceMarkup(source){if(typeof source==="string")return `<li>${h(source)}</li>`;let url="";try{const parsed=new URL(source.url);if(["http:","https:"].includes(parsed.protocol))url=parsed.href;}catch{}return `<li>${url?`<a href="${h(url)}" target="_blank" rel="noreferrer">${h(source.label)}</a>`:h(source.label)}</li>`;}
  function statusBadge(proposal){const suffix=proposal.status==="approved"?" · 僅完成人工審核":proposal.status==="rejected"?" · 已退回":"";return `<span class="weave-status status-${h(proposal.status)}">${h(STATUS_LABELS[proposal.status])}${suffix}</span>`;}
  function sourceLabel(source){return source==="nanobot"?"nanobot":source==="mock"?"Mock":"其他來源";}
  function eventLabel(type){return ({proposal_created:"Proposal 建立",proposal_validation_failed:"驗證失敗",domain_selected:"選擇 Domain",domain_split_requested:"要求拆分",proposal_deferred:"暫存 Proposal",relation_accepted:"接受關係",relation_rejected:"拒絕關係",proposal_approved:"確認審核",proposal_rejected:"退回 Proposal"})[type]||type;}
  function renderAudit(proposal){const rows=loadAudit(typeof localStorage!=="undefined"?localStorage:null).filter(event=>event.proposal_id===proposal.id);return `<details class="weave-audit"><summary>審核紀錄（${rows.length}）</summary>${rows.length?`<ol>${rows.map(event=>`<li><b>${h(eventLabel(event.event_type))}</b><span>${h(event.actor)} · ${h(new Date(event.timestamp).toLocaleString("zh-TW"))}</span></li>`).join("")}</ol>`:'<p class="weave-muted">尚無人工審核紀錄。Inbox 建立與驗證失敗事件保存在本機伺服器 Audit Log。</p>'}</details>`;}

  function renderDetail(proposal){
    if(!proposal)return `<section class="weave-detail weave-empty"><h2>選擇一份 Proposal</h2><p>AI 建議不會自動核准，也不會寫入正式知識庫。</p></section>`;
    const complete=["approved","rejected"].includes(proposal.status);
    const selected=proposal.review?.selected_domain||null;
    const validation=Validator.validateProposal(proposal);
    return `<section class="weave-detail" data-proposal-detail="${h(proposal.id)}">
      <header class="weave-detail-head"><div><div class="eyebrow">PROPOSAL · ${h(proposal.id)}</div><h2>${h(proposal.title)}</h2><span class="weave-source source-${h(proposal.inbox_source||"other")}">${h(sourceLabel(proposal.inbox_source))} · schema v${h(proposal.schema_version)}</span></div>${statusBadge(proposal)}</header>
      <p class="weave-summary">${h(proposal.summary)}</p>
      ${validation.multiDomain?'<div class="weave-warning"><b>多 Domain 內容</b><span>請選擇單一 Domain、要求拆分，或暫存；系統不會替你決定。</span></div>':""}
      ${!validation.valid?`<div class="weave-error"><b>Proposal 格式錯誤</b><ul>${validation.errors.map(error=>`<li>${h(error)}</li>`).join("")}</ul></div>`:""}
      <div class="weave-detail-grid">
        <section><h3>來源</h3><ul class="weave-sources">${proposal.sources.map(sourceMarkup).join("")}</ul><small>建立時間：${h(new Date(proposal.created_at).toLocaleString("zh-TW"))}</small></section>
        <section><h3>Domain 候選</h3><div class="domain-options">${proposal.domain_candidates.map(candidate=>`<div class="domain-option ${selected===candidate.domain?"selected":""}"><button type="button" data-weave-domain="${h(candidate.domain)}" ${complete?"disabled":""} aria-pressed="${selected===candidate.domain}">${selected===candidate.domain?"✓ ":""}${h(DOMAIN_LABELS[candidate.domain])}</button><details><summary>為什麼推薦</summary><p>${h(candidate.reason)}</p>${Number.isFinite(candidate.confidence)?`<small>AI 信心：${Math.round(candidate.confidence*100)}%</small>`:""}</details></div>`).join("")}</div></section>
      </div>
      <section><h3>既有節點候選</h3>${proposal.node_candidates.length?`<div class="weave-node-list">${proposal.node_candidates.map(node=>`<article><b>${h(node.title)}</b><span class="weave-domain-tag ${node.domain?"":"unclassified"}">${node.domain?h(DOMAIN_LABELS[node.domain]):"未分類 · 不可成為正式關係目標"}</span><p>${h(node.reason)}</p></article>`).join("")}</div>`:'<p class="weave-muted">沒有既有節點候選。</p>'}</section>
      <section><h3>關係候選</h3><p class="weave-muted">每一條都必須由你接受或拒絕；AI 建議預設一律不勾選。</p>${proposal.relation_candidates.length?`<div class="relation-list">${proposal.relation_candidates.map(relation=>{const node=proposal.node_candidates.find(item=>item.id===relation.target_node_id);const invalid=!node||node.domain===null||(selected&&node.domain!==selected);return `<article class="relation-card decision-${h(relation.decision)} ${invalid?"relation-risk":""}"><div><span class="weave-relation-type">${h(RELATION_LABELS[relation.type]||relation.type)}</span><b>${h(relation.target_title)}</b>${node?`<small>${node.domain?h(DOMAIN_LABELS[node.domain]):"未分類"}</small>`:""}</div><p><b>關係理由：</b>${h(relation.reason)}</p>${invalid?'<p class="relation-rule">此候選目前不能被接受：未分類或與所選 Domain 不同。</p>':""}<div class="relation-actions"><button type="button" data-weave-relation="${h(relation.id)}" data-decision="accepted" ${complete?"disabled":""} aria-pressed="${relation.decision==="accepted"}">接受</button><button type="button" data-weave-relation="${h(relation.id)}" data-decision="rejected" ${complete?"disabled":""} aria-pressed="${relation.decision==="rejected"}">拒絕</button><span>${relation.decision==="pending"?"尚未決定":relation.decision==="accepted"?"已接受":"已拒絕"}</span></div></article>`;}).join("")}</div>`:'<p class="weave-muted">沒有關係候選，不會建立任何關係。</p>'}</section>
      <section><h3>Markdown 預覽</h3><pre class="markdown-preview">${h(proposal.suggested_markdown)}</pre></section>
      ${renderAudit(proposal)}
      <footer class="weave-review-actions">${complete?'<p>此 Proposal 已完成本階段審核。Phase 1 不會寫入 Obsidian。</p>':`<button type="button" class="button" data-weave-action="split">拆分內容</button><button type="button" class="button" data-weave-action="defer">暫不整理</button><button type="button" class="button danger" data-weave-action="reject">退回 Proposal</button><button type="button" class="button primary" data-weave-action="approve">確認審核</button>`}</footer>
    </section>`;
  }

  function render(){
    const storage=typeof localStorage!=="undefined"?localStorage:null;
    const items=loadProposals(storage);
    if(typeof window!=="undefined"&&location.hostname!=="lihuany635-create.github.io")syncInbox(storage,()=>typeof renderWorkspace==="function"&&renderWorkspace());
    if(!selectedId||!findProposal(selectedId))selectedId=items[0]?.id||null;
    const inboxText=inboxSyncStatus==="online"?"本機 Inbox 已連線":inboxSyncStatus==="loading"?"正在同步本機 Inbox":"本機 Inbox 僅在本機伺服器啟用";
    return `<div class="weave-page">${typeof head==="function"?head("KNOWLEDGE WEAVING · PHASE 2A","知識編織室","nanobot 與 AI 只提出 Proposal；Domain、每一條關係與最終審核都由你決定。",`<span class="chip">${inboxText}</span><span class="chip">不寫入正式 Obsidian Vault</span>`):""}<div class="weave-safety"><b>人工審核防線</b><span>approved 只代表你完成審核，不代表內容已發布或寫入知識庫。</span></div><div class="weave-layout"><aside class="weave-queue" aria-label="Proposal 佇列">${BUCKETS.map(bucket=>{const rows=items.filter(item=>bucket.statuses.includes(item.status));return `<section><header><h2>${h(bucket.label)}</h2><span>${rows.length}</span></header>${rows.length?rows.map(item=>`<button type="button" class="proposal-card ${item.id===selectedId?"active":""}" data-weave-open="${h(item.id)}"><b>${h(item.title)}</b><small>${h(sourceLabel(item.inbox_source))} · ${h(DOMAIN_LABELS[item.review?.selected_domain]||"尚未選擇 Domain")}</small></button>`).join(""):'<p class="weave-empty-bucket">目前沒有項目</p>'}</section>`;}).join("")}</aside>${renderDetail(findProposal(selectedId))}</div></div>`;
  }

  function installEvents(appElement,options={}){
    if(!appElement||appElement.dataset.weavingEventsInstalled)return;
    appElement.dataset.weavingEventsInstalled="true";
    const storage=options.storage||(typeof localStorage!=="undefined"?localStorage:null);
    const notify=options.notify||(message=>typeof toast==="function"&&toast(message));
    const rerender=options.render||(function(){if(typeof window!=="undefined"&&typeof window.render==="function")window.render();else if(typeof renderWorkspace==="function")renderWorkspace();});
    appElement.addEventListener("click",event=>{
      const control=event.target.closest("[data-weave-open],[data-weave-domain],[data-weave-relation],[data-weave-action]");
      if(!control)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(control.dataset.weaveOpen){selectedId=control.dataset.weaveOpen;rerender();return;}
      const proposal=findProposal(selectedId);if(!proposal)return;
      try{
        let next=proposal;
        if(control.dataset.weaveDomain){next=Validator.withSelectedDomain(proposal,control.dataset.weaveDomain);appendUserAudit(storage,proposal.id,"domain_selected",{domain:control.dataset.weaveDomain});}
        else if(control.dataset.weaveRelation){next=Validator.withRelationDecision(proposal,control.dataset.weaveRelation,control.dataset.decision);appendUserAudit(storage,proposal.id,control.dataset.decision==="accepted"?"relation_accepted":"relation_rejected",{relation_id:control.dataset.weaveRelation});}
        else if(control.dataset.weaveAction==="approve"){next=Validator.approveProposal(proposal);appendUserAudit(storage,proposal.id,"proposal_approved");notify("已完成人工審核；尚未寫入 Obsidian");}
        else if(control.dataset.weaveAction==="reject"){next=Validator.rejectProposal(proposal);appendUserAudit(storage,proposal.id,"proposal_rejected");notify("已退回 Proposal");}
        else if(control.dataset.weaveAction==="defer"){next=Validator.deferProposal(proposal,"deferred");appendUserAudit(storage,proposal.id,"proposal_deferred");notify("已暫存，未建立正式節點或關係");}
        else if(control.dataset.weaveAction==="split"){next=Validator.deferProposal(proposal,"split");appendUserAudit(storage,proposal.id,"domain_split_requested");notify("已建立拆分請求；Phase 2A 不會自動產生或批准節點");}
        replaceProposal(next,storage);rerender();
      }catch(error){notify(error.message);}
    },true);
  }

  return {STORAGE_KEY,AUDIT_KEY,DOMAIN_LABELS,STATUS_LABELS,RELATION_LABELS,BUCKETS,seedProposals,loadProposals,saveProposals,loadAudit,appendUserAudit,syncInbox,resetForTests,findProposal,render,renderDetail,installEvents};
});
