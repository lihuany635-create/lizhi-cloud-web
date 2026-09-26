(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.KnowledgeWeavingValidator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const DOMAINS=Object.freeze(["ai","civil","software","media","learning","humanities"]);
  const RELATION_TYPES=Object.freeze(["extends","supports","contradicts","example-of","same-topic","prerequisite","application","replace"]);
  const STATUSES=Object.freeze(["researching","waiting_review","reviewing","approved","rejected","deferred"]);
  const RELATION_DECISIONS=Object.freeze(["pending","accepted","rejected"]);
  const SUPPORTED_SCHEMA_VERSION=1;
  const REQUIRED_FIELDS=Object.freeze(["schema_version","id","title","summary","sources","created_at","domain_candidates","node_candidates","relation_candidates","suggested_markdown","status"]);

  const isObject=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
  const isText=value=>typeof value==="string"&&value.trim().length>0;
  const relationLabel=relation=>relation?.target_title||relation?.target_node_id||relation?.id||"未命名關係";

  function validateProposal(proposal){
    const errors=[];
    if(!isObject(proposal))return {valid:false,errors:["Proposal 必須是物件"],multiDomain:false};
    for(const field of REQUIRED_FIELDS)if(!(field in proposal))errors.push(`缺少必要欄位：${field}`);
    if("schema_version" in proposal&&proposal.schema_version!==SUPPORTED_SCHEMA_VERSION)errors.push(`不支援的 schema_version：${proposal.schema_version}`);
    for(const field of ["id","title","summary","created_at","suggested_markdown"])if(field in proposal&&!isText(proposal[field]))errors.push(`${field} 必須是非空字串`);
    if(proposal.created_at&&Number.isNaN(Date.parse(proposal.created_at)))errors.push("created_at 必須是有效日期時間");
    if(proposal.status&&!STATUSES.includes(proposal.status))errors.push(`未知狀態：${proposal.status}`);
    if(!Array.isArray(proposal.sources)||proposal.sources.length===0)errors.push("sources 至少需要一筆來源");
    else proposal.sources.forEach((source,index)=>{if(!(isText(source)||(isObject(source)&&isText(source.label))))errors.push(`sources[${index}] 格式錯誤`);});
    if(!Array.isArray(proposal.domain_candidates)||proposal.domain_candidates.length===0)errors.push("domain_candidates 至少需要一個候選");
    else proposal.domain_candidates.forEach((candidate,index)=>{
      if(!isObject(candidate)||!DOMAINS.includes(candidate.domain))errors.push(`domain_candidates[${index}] 的 domain 無效`);
      if(!isObject(candidate)||!isText(candidate.reason))errors.push(`domain_candidates[${index}] 缺少推薦理由`);
    });
    if(!Array.isArray(proposal.node_candidates))errors.push("node_candidates 必須是陣列");
    else proposal.node_candidates.forEach((node,index)=>{
      if(!isObject(node)||!isText(node.id)||!isText(node.title))errors.push(`node_candidates[${index}] 格式錯誤`);
      if(node?.domain!==null&&!DOMAINS.includes(node?.domain))errors.push(`node_candidates[${index}] 的 domain 無效`);
    });
    if(!Array.isArray(proposal.relation_candidates))errors.push("relation_candidates 必須是陣列");
    else proposal.relation_candidates.forEach((relation,index)=>{
      if(!isObject(relation)||!isText(relation.id)||!isText(relation.target_node_id))errors.push(`relation_candidates[${index}] 格式錯誤`);
      if(!RELATION_TYPES.includes(relation?.type))errors.push(`relation_candidates[${index}] 的 type 無效`);
      if(!isText(relation?.reason))errors.push(`relation_candidates[${index}] 缺少關係理由`);
      if(!RELATION_DECISIONS.includes(relation?.decision))errors.push(`relation_candidates[${index}] 的 decision 無效`);
      if(relation?.decision!=="pending"&&relation?.decided_by!=="user")errors.push(`relation_candidates[${index}] 的決定必須來自使用者`);
    });
    if(proposal.status==="approved"&&proposal.review?.approved_by!=="user")errors.push("AI/nanobot 不能批准 Proposal");
    const domainSet=new Set((proposal.domain_candidates||[]).map(item=>item?.domain).filter(domain=>DOMAINS.includes(domain)));
    return {valid:errors.length===0,errors,multiDomain:domainSet.size>1};
  }

  function validateAiSubmission(proposal){
    const base=validateProposal(proposal),errors=[...base.errors];
    if(!["researching","waiting_review"].includes(proposal?.status))errors.push("AI/nanobot 只能提交待研究或等待人工審核的 Proposal");
    if((proposal?.relation_candidates||[]).some(relation=>relation.decision!=="pending"||"decided_by" in relation))errors.push("AI/nanobot 不能預先接受、拒絕或偽造關係決定");
    if("review" in (proposal||{}))errors.push("外部 Proposal 不得包含任何人工 review 欄位");
    if("inbox_source" in (proposal||{}))errors.push("外部 Proposal 不得自行指定 Inbox 來源");
    return {valid:errors.length===0,errors,multiDomain:base.multiDomain};
  }

  function selectedDomain(proposal){return proposal?.review?.selected_domain||null;}

  function validateAcceptedRelation(proposal,relation){
    const errors=[];
    const domain=selectedDomain(proposal);
    if(!domain)errors.push("必須先由使用者選擇單一 Domain");
    const node=(proposal.node_candidates||[]).find(item=>item.id===relation.target_node_id);
    if(!node)errors.push(`找不到關係目標：${relationLabel(relation)}`);
    else if(node.domain===null)errors.push(`未分類節點不能成為正式關係目標：${node.title}`);
    else if(domain&&node.domain!==domain)errors.push(`跨 Domain 關係不允許：${domain} → ${node.domain}`);
    return {valid:errors.length===0,errors};
  }

  function validateForApproval(proposal){
    const base=validateProposal(proposal),errors=[...base.errors];
    const domain=selectedDomain(proposal);
    if(!domain)errors.push("尚未由使用者選擇 Domain");
    else if(proposal.review?.domain_selected_by!=="user")errors.push("Domain 必須由使用者選擇");
    else if(!DOMAINS.includes(domain))errors.push("選擇的 Domain 無效");
    else if(!(proposal.domain_candidates||[]).some(item=>item.domain===domain))errors.push("Domain 必須從候選中由使用者選擇");
    for(const relation of proposal.relation_candidates||[]){
      if(relation.decision==="pending")errors.push(`尚未決定關係：${relationLabel(relation)}`);
      if(relation.decision==="accepted")errors.push(...validateAcceptedRelation(proposal,relation).errors);
    }
    return {valid:errors.length===0,errors,multiDomain:base.multiDomain};
  }

  function withSelectedDomain(proposal,domain){
    if(!DOMAINS.includes(domain))throw new Error("無效的 Domain");
    if(!(proposal.domain_candidates||[]).some(item=>item.domain===domain))throw new Error("只能選擇 Proposal 的 Domain 候選");
    return {...proposal,status:proposal.status==="waiting_review"?"reviewing":proposal.status,review:{...(proposal.review||{}),selected_domain:domain,domain_resolution:"selected",domain_selected_by:"user"}};
  }

  function withRelationDecision(proposal,relationId,decision){
    if(!["accepted","rejected"].includes(decision))throw new Error("關係必須明確接受或拒絕");
    const relation=(proposal.relation_candidates||[]).find(item=>item.id===relationId);
    if(!relation)throw new Error("找不到關係候選");
    if(decision==="accepted"){
      const result=validateAcceptedRelation(proposal,relation);
      if(!result.valid)throw new Error(result.errors.join("；"));
    }
    return {...proposal,status:["waiting_review","researching"].includes(proposal.status)?"reviewing":proposal.status,relation_candidates:proposal.relation_candidates.map(item=>item.id===relationId?{...item,decision,decided_by:"user"}:item)};
  }

  function approveProposal(proposal,reviewedAt=new Date().toISOString()){
    const result=validateForApproval(proposal);
    if(!result.valid)throw new Error(result.errors.join("；"));
    return {...proposal,status:"approved",review:{...proposal.review,approved_by:"user",reviewed_at:reviewedAt}};
  }

  function rejectProposal(proposal,reviewedAt=new Date().toISOString()){
    return {...proposal,status:"rejected",review:{...(proposal.review||{}),reviewed_by:"user",reviewed_at:reviewedAt}};
  }

  function deferProposal(proposal,resolution="deferred"){
    if(!["deferred","split"].includes(resolution))throw new Error("無效的暫存方式");
    return {...proposal,status:"deferred",review:{...(proposal.review||{}),domain_resolution:resolution}};
  }

  return {SUPPORTED_SCHEMA_VERSION,DOMAINS,RELATION_TYPES,STATUSES,RELATION_DECISIONS,REQUIRED_FIELDS,validateProposal,validateAiSubmission,validateAcceptedRelation,validateForApproval,withSelectedDomain,withRelationDecision,approveProposal,rejectProposal,deferProposal};
});
