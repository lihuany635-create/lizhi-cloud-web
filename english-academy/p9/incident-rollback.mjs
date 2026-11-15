// P9-A incident handling & rollback rehearsal only. No external I/O.
export const INCIDENT_LEVELS=Object.freeze(['SEV1','SEV2','SEV3']);
const STATES=['detected','triaged','contained','recovered','reviewed'];
const TYPES=['auth','data','sync','mcp','deployment','availability'];
const SHA=/^[a-f0-9]{40}$/;
const PLAN=Object.freeze([
 {id:'freeze-new-writes',title:'Stop new English-specific writes, leave legacy site intact',scope:'supabase_edge'},
 {id:'disable-english-entry',title:'Disable English entry only, preserve existing main routes',scope:'github_pages'},
 {id:'disable-english-mcp-namespace',title:'Disable only english_* MCP tool namespace, keep AI workbench/photo tools',scope:'private_site'},
 {id:'restore-previous-edge',title:'Restore last reviewed English Edge after approval',scope:'supabase_edge'},
 {id:'recheck-legacy',title:'Check existing study/workbench/photo/Side/Licut tools',scope:'private_site'},
 {id:'verify-data',title:'Verify owner isolation, events and backup integrity read-only',scope:'supabase_schema'}
]);
export const ROLLBACK_PLAN=PLAN;
export function createIncident({id,severity,type,detectedAt,summary}={}){
 if(!/^ENG-[0-9]{4,7}$/.test(id??'')||!INCIDENT_LEVELS.includes(severity)||
   !TYPES.includes(type)||!(detectedAt instanceof Date)||
   !Number.isFinite(detectedAt.valueOf())||typeof summary!=='string'||
   summary.trim().length<3||summary.length>300)
   throw new TypeError('INVALID_INCIDENT');
 return Object.freeze({id,severity,type,detectedAt:detectedAt.toISOString(),
   summary:summary.trim(),state:'detected',history:Object.freeze([
    {state:'detected',at:detectedAt.toISOString(),actor:'synthetic-runbook'}]),
   requiresOwnerForChanges:true,productionMutated:false});
}
export function transitionIncident(incident,{state,at,actor}={}){
 if(!incident||!STATES.includes(incident.state)||!STATES.includes(state)||
    STATES.indexOf(state)!==STATES.indexOf(incident.state)+1||
    !(at instanceof Date)||!Number.isFinite(at.valueOf())||
    at.getTime()<Date.parse(incident.history.at(-1).at)||
    typeof actor!=='string'||actor.trim().length<2||actor.length>80)
     throw new TypeError('INCIDENT_INVALID_TRANSITION');
 return Object.freeze({...incident,state,history:Object.freeze([
   ...incident.history,{state,at:at.toISOString(),actor:actor.trim()}])});
}
export function prepareRollback({incident,commitSha,authorizations=[],
  existingToolInventory=[]}={}){
 if(!incident||!SHA.test(commitSha??'')||
  !Array.isArray(authorizations)||!Array.isArray(existingToolInventory))
   throw new TypeError('INVALID_ROLLBACK_INPUT');
 const toolNames=existingToolInventory.map(x=>typeof x==='string'?x:x?.name);
 const preserved=['aiwb_overview','aiwb_get_task'].every(n=>toolNames.includes(n))&&
   ['list_projects','get_project'].every(n=>toolNames.includes(n));
 const warnings=[];
 if(!preserved)warnings.push('LEGACY_INVENTORY_NOT_VERIFIED');
 if(incident.state==='detected')warnings.push('INCIDENT_NOT_TRIAGED');
 const permitted=PLAN.map(p=>({
   ...p,approvedOnRecord:authorizations.some(a=>a?.scope===p.scope&&
    a.commitSha===commitSha&&a.trustedVerifier===true&&a.incidentId===incident.id),
   action:'MANUAL_ONLY_NO_AUTOMATION',executed:false
 }));
 return {incidentId:incident.id,commitSha,steps:permitted,warnings,
  note:'Manual draft only. Restore and disable actions require separate owner authority',
  prohibitedActions:['drop_english_tables','delete_owner_records',
   'clear_service_secrets','replace_entire_mcp_route','force_push_main'],
  canExecute:false,hasPerformedRollback:false,
  status:'AWAIT_OWNER_AUTHORIZATION_AND_INDEPENDENT_REVIEW'};
}
export function dryRunRollback({plan,simulatedFailures=[]}={}){
 if(!plan||!Array.isArray(plan.steps)||!Array.isArray(simulatedFailures))
   throw new TypeError('INVALID_ROLLBACK_PLAN');
 const names=new Set(plan.steps.map(x=>x.id));
 if(simulatedFailures.some(x=>!names.has(x)))throw new TypeError('UNKNOWN_SIMULATED_STEP');
 const steps=plan.steps.map(x=>({id:x.id,simulated:true,
   state:simulatedFailures.includes(x.id)?'failed':'passed'}));
 return {status:steps.some(x=>x.state==='failed')?'SIMULATED_FAILURE':'SIMULATED_PASS',
  steps,productionActions:0,databaseWrites:0,siteUpdates:0,
  realRollbackPerformed:false};
}
