(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.EngineeringSupervisionDailyRecordModels=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RECORD_TYPES=Object.freeze(["contractor_construction_log","supervisor_daily_record"]);
  const STATUSES=Object.freeze(["draft","pending_review","returned","correction_draft","approved","archived"]);
  const DECISIONS=Object.freeze(["approved","returned"]);
  const EVENT_TYPES=Object.freeze(["record_created","draft_saved","submitted","returned","revision_started","approved","correction_started","archived","task_linked"]);
  const RECORD_FIELDS=Object.freeze(["id","workspace_id","project_id","module_id","record_type","record_date","timezone","reporting_party_id","site_location_id","shift_key","record_slot","identity_key","status","working_copy","current_revision","submitted_revision_id","approved_revision_id","created_by_member_id","submitted_by_member_id","submitted_at","reviewed_at","archived_at","version","created_at","updated_at","metadata"]);
  const REVISION_FIELDS=Object.freeze(["id","workspace_id","project_id","record_id","record_type","record_date","timezone","revision","content","reporting_party_snapshot","site_location_snapshot","work_item_snapshots","attachment_ids","attachment_snapshots","inspection_ids","defect_ids","task_ids","created_by_member_id","created_at","action_id","request_fingerprint","content_hash","metadata"]);
  const REVIEW_FIELDS=Object.freeze(["id","workspace_id","project_id","record_id","revision_id","reviewer_member_id","decision","comment","reviewed_at","action_id","request_fingerprint","metadata"]);
  const EVENT_FIELDS=Object.freeze(["id","workspace_id","project_id","record_id","revision_id","review_id","event_type","actor_member_id","from_status","to_status","record_version","action_id","request_fingerprint","occurred_at","metadata"]);
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  class DailyRecordError extends Error{constructor(code,message){super(message);this.name="DailyRecordError";this.code=code;}}
  const text=(value,name,max=4000,required=true)=>{const result=String(value??"").trim();if(required&&!result||result.length>max)throw new DailyRecordError("DAILY_RECORD_INVALID",`${name} 無效。`);return result;};
  const optionalText=(value,name,max)=>text(value,name,max,false)||null;
  const stamp=(value,name,required=false)=>{const result=optionalText(value,name,50);if(required&&!result)throw new DailyRecordError("DAILY_RECORD_INVALID",`${name} 不可空白。`);if(result&&!Number.isFinite(Date.parse(result)))throw new DailyRecordError("DAILY_RECORD_INVALID",`${name} 無效。`);return result;};
  const positive=(value,name,{zero=false}={})=>{const number=Number(value);if(!Number.isInteger(number)||number<(zero?0:1))throw new DailyRecordError("DAILY_RECORD_INVALID",`${name} 無效。`);return number;};
  const identifiers=value=>Object.freeze([...new Set((value||[]).map(String).map(item=>item.trim()).filter(Boolean))]);
  const metadata=value=>value&&typeof value==="object"&&!Array.isArray(value)?clone(value):{};
  const date=value=>{const result=text(value,"紀錄日期",10);if(!/^\d{4}-\d{2}-\d{2}$/.test(result)||Number.isNaN(Date.parse(`${result}T00:00:00Z`)))throw new DailyRecordError("DAILY_RECORD_DATE_INVALID","紀錄日期必須是 YYYY-MM-DD。");return result;};
  const basisPoints=(value,name)=>{const number=Number(value??0);if(!Number.isInteger(number)||number<0||number>10000)throw new DailyRecordError("DAILY_RECORD_INVALID",`${name} 必須是 0–10000 的整數。`);return number;};
  function workingCopy(input={}){
    const start=stamp(input.period_start_at,"開始時間"),end=stamp(input.period_end_at,"結束時間");
    if(Boolean(start)!==Boolean(end))throw new DailyRecordError("DAILY_RECORD_PERIOD_INVALID","開始與結束時間必須同時提供。");
    if(start&&end){const duration=Date.parse(end)-Date.parse(start);if(duration<=0||duration>24*60*60*1000)throw new DailyRecordError("DAILY_RECORD_PERIOD_INVALID","施工期間必須大於 0 且不超過 24 小時。");}
    const workforce=Number(input.workforce_count??0);
    if(!Number.isInteger(workforce)||workforce<0)throw new DailyRecordError("DAILY_RECORD_INVALID","人力數量必須是非負整數。");
    return Object.freeze({
      summary:text(input.summary,"摘要",10000),
      period_start_at:start,
      period_end_at:end,
      weather:text(input.weather,"天候",2000,false),
      work_description:text(input.work_description,"施工內容",10000,false),
      workforce_count:workforce,
      equipment:text(input.equipment,"機具",4000,false),
      materials:text(input.materials,"材料",4000,false),
      progress_planned_basis_points:basisPoints(input.progress_planned_basis_points,"預定進度"),
      progress_actual_basis_points:basisPoints(input.progress_actual_basis_points,"實際進度"),
      quality_notes:text(input.quality_notes,"品質紀錄",4000,false),
      safety_notes:text(input.safety_notes,"職安紀錄",4000,false),
      backfill_reason:text(input.backfill_reason,"補登原因",2000,false),
      attachment_ids:identifiers(input.attachment_ids),
      work_item_ids:identifiers(input.work_item_ids),
      inspection_ids:identifiers(input.inspection_ids),
      defect_ids:identifiers(input.defect_ids),
      task_ids:identifiers(input.task_ids)
    });
  }
  function DailyRecord(input={}){
    const record_type=String(input.record_type||""),status=String(input.status||"draft");
    if(!RECORD_TYPES.includes(record_type)||!STATUSES.includes(status))throw new DailyRecordError("DAILY_RECORD_INVALID","紀錄類型或狀態無效。");
    const current_revision=positive(input.current_revision??0,"目前版本",{zero:true}),version=positive(input.version??1,"資料版本");
    const value={id:text(input.id,"Record ID",180),workspace_id:text(input.workspace_id,"Workspace ID",180),project_id:text(input.project_id,"Project ID",180),module_id:String(input.module_id||"supervision"),record_type,record_date:date(input.record_date),timezone:text(input.timezone||"Asia/Taipei","時區",80),reporting_party_id:text(input.reporting_party_id,"填報單位",180),site_location_id:optionalText(input.site_location_id,"施工位置",180),shift_key:text(input.shift_key||"whole-day","班別",80),record_slot:text(input.record_slot||"primary","紀錄槽",80),identity_key:text(input.identity_key,"Identity Key",1000),status,working_copy:workingCopy(input.working_copy),current_revision,submitted_revision_id:optionalText(input.submitted_revision_id,"送審 Revision",180),approved_revision_id:optionalText(input.approved_revision_id,"核准 Revision",180),created_by_member_id:text(input.created_by_member_id,"建立者",180),submitted_by_member_id:optionalText(input.submitted_by_member_id,"提交者",180),submitted_at:stamp(input.submitted_at,"提交時間"),reviewed_at:stamp(input.reviewed_at,"審查時間"),archived_at:stamp(input.archived_at,"封存時間"),version,created_at:stamp(input.created_at,"建立時間",true),updated_at:stamp(input.updated_at,"更新時間",true),metadata:metadata(input.metadata)};
    if(value.module_id!=="supervision")throw new DailyRecordError("DAILY_RECORD_MODULE_FORGED","DailyRecord module_id 必須是 supervision。");
    if(status==="pending_review"&&(!value.submitted_revision_id||!value.submitted_by_member_id||!value.submitted_at))throw new DailyRecordError("DAILY_RECORD_INVALID","送審紀錄缺少 Revision 或提交資訊。");
    if(status==="approved"&&!value.approved_revision_id)throw new DailyRecordError("DAILY_RECORD_INVALID","核准紀錄缺少 approved revision。");
    if(status==="archived"&&!value.archived_at)throw new DailyRecordError("DAILY_RECORD_INVALID","封存紀錄缺少封存時間。");
    return Object.freeze(value);
  }
  function Revision(input={}){
    return Object.freeze({id:text(input.id,"Revision ID",180),workspace_id:text(input.workspace_id,"Workspace ID",180),project_id:text(input.project_id,"Project ID",180),record_id:text(input.record_id,"Record ID",180),record_type:RECORD_TYPES.includes(input.record_type)?input.record_type:(()=>{throw new DailyRecordError("DAILY_RECORD_REVISION_INVALID","Revision 類型無效。");})(),record_date:date(input.record_date),timezone:text(input.timezone,"時區",80),revision:positive(input.revision,"Revision"),content:workingCopy(input.content),reporting_party_snapshot:clone(input.reporting_party_snapshot||null),site_location_snapshot:clone(input.site_location_snapshot||null),work_item_snapshots:Object.freeze((input.work_item_snapshots||[]).map(item=>Object.freeze(clone(item)))),attachment_ids:identifiers(input.attachment_ids),attachment_snapshots:Object.freeze((input.attachment_snapshots||[]).map(item=>Object.freeze(clone(item)))),inspection_ids:identifiers(input.inspection_ids),defect_ids:identifiers(input.defect_ids),task_ids:identifiers(input.task_ids),created_by_member_id:text(input.created_by_member_id,"建立者",180),created_at:stamp(input.created_at,"建立時間",true),action_id:text(input.action_id,"Action ID",180),request_fingerprint:text(input.request_fingerprint,"Request fingerprint",180),content_hash:text(input.content_hash,"Content hash",180),metadata:metadata(input.metadata)});
  }
  function Review(input={}){const decision=String(input.decision||""),comment=text(input.comment,"審查意見",2000,false);if(!DECISIONS.includes(decision))throw new DailyRecordError("DAILY_RECORD_REVIEW_INVALID","審查決定無效。");if(decision==="returned"&&!comment)throw new DailyRecordError("DAILY_RECORD_REVIEW_COMMENT_REQUIRED","退回時必須填寫審查意見。");return Object.freeze({id:text(input.id,"Review ID",180),workspace_id:text(input.workspace_id,"Workspace ID",180),project_id:text(input.project_id,"Project ID",180),record_id:text(input.record_id,"Record ID",180),revision_id:text(input.revision_id,"Revision ID",180),reviewer_member_id:text(input.reviewer_member_id,"審查者",180),decision,comment:comment||null,reviewed_at:stamp(input.reviewed_at,"審查時間",true),action_id:text(input.action_id,"Action ID",180),request_fingerprint:text(input.request_fingerprint,"Request fingerprint",180),metadata:metadata(input.metadata)});}
  function Event(input={}){const event_type=String(input.event_type||"");if(!EVENT_TYPES.includes(event_type))throw new DailyRecordError("DAILY_RECORD_EVENT_INVALID","事件類型無效。");return Object.freeze({id:text(input.id,"Event ID",180),workspace_id:text(input.workspace_id,"Workspace ID",180),project_id:text(input.project_id,"Project ID",180),record_id:text(input.record_id,"Record ID",180),revision_id:optionalText(input.revision_id,"Revision ID",180),review_id:optionalText(input.review_id,"Review ID",180),event_type,actor_member_id:text(input.actor_member_id,"操作者",180),from_status:optionalText(input.from_status,"原狀態",80),to_status:text(input.to_status,"新狀態",80),record_version:positive(input.record_version,"Record version"),action_id:text(input.action_id,"Action ID",180),request_fingerprint:text(input.request_fingerprint,"Request fingerprint",180),occurred_at:stamp(input.occurred_at,"事件時間",true),metadata:metadata(input.metadata)});}
  const toRecord=(model,fields)=>(value=>{const normalized=model(value);return Object.fromEntries(fields.map(field=>[field,clone(normalized[field])]));});
  function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value;}
  function fingerprint(value){const input=JSON.stringify(stable(value));let hash=2166136261;for(let index=0;index<input.length;index++){hash^=input.charCodeAt(index);hash=Math.imul(hash,16777619);}return`fnv1a-${(hash>>>0).toString(16).padStart(8,"0")}-${input.length}`;}
  return Object.freeze({RECORD_TYPES,STATUSES,DECISIONS,EVENT_TYPES,DailyRecordError,workingCopy,fingerprint,DailyRecord:Object.freeze({FIELDS:RECORD_FIELDS,create:DailyRecord,toRecord:toRecord(DailyRecord,RECORD_FIELDS)}),Revision:Object.freeze({FIELDS:REVISION_FIELDS,create:Revision,toRecord:toRecord(Revision,REVISION_FIELDS)}),Review:Object.freeze({FIELDS:REVIEW_FIELDS,create:Review,toRecord:toRecord(Review,REVIEW_FIELDS)}),Event:Object.freeze({FIELDS:EVENT_FIELDS,create:Event,toRecord:toRecord(Event,EVENT_FIELDS)})});
});
