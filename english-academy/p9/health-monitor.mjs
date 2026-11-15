// P9-A isolated observability. Never sends telemetry or writes to production.
// Only aggregate, redacted alerts; no words, sentences, tokens or emails retained.
export const ALERT_CATALOG=Object.freeze({
  auth_denied:{level:'warning',threshold:12,windowSeconds:300},
  edge_5xx:{level:'critical',threshold:5,windowSeconds:300},
  sync_failure:{level:'warning',threshold:5,windowSeconds:300},
  consent_bypass_attempt:{level:'critical',threshold:1,windowSeconds:300},
  cross_owner_violation:{level:'critical',threshold:1,windowSeconds:300},
  legacy_mcp_regression:{level:'critical',threshold:1,windowSeconds:300},
  fsrs_persistence_error:{level:'warning',threshold:3,windowSeconds:300},
  unknown_error:{level:'warning',threshold:20,windowSeconds:300}
});
const TYPES=new Set(Object.keys(ALERT_CATALOG));
const validNow=x=>x instanceof Date&&Number.isFinite(x.valueOf());
const validISO=x=>typeof x==='string'&&!Number.isNaN(Date.parse(x));
const hashSafe=s=>typeof s==='string'&&/^[a-z0-9_.:-]{1,60}$/i.test(s);
export function aggregateHealthSignals({events=[],now=new Date(),environment='synthetic'}={}){
 if(!Array.isArray(events)||events.length>10000||!validNow(now)||
   !['synthetic','staging','production'].includes(environment))
   throw new TypeError('INVALID_MONITOR_INPUT');
 const counters={},alerts=[];
 for(const [type,config] of Object.entries(ALERT_CATALOG)){
  const start=now.getTime()-config.windowSeconds*1000;
  let count=0;
  for(const e of events){
   if(!e||!TYPES.has(e.type)||!validISO(e.at)||!hashSafe(e.component)||
      (e.environment&&e.environment!==environment))
     throw new TypeError('INVALID_MONITOR_EVENT');
   const t=Date.parse(e.at);
   if(e.type===type&&t>start&&t<=now.getTime())count++;
  }
  counters[type]=count;
  if(count>=config.threshold)alerts.push(Object.freeze({
    id:type+':'+Math.floor(now.getTime()/(config.windowSeconds*1000)),
    type,level:config.level,count,threshold:config.threshold,
    windowSeconds:config.windowSeconds,
    environment,
    description:'Threshold reached; consult P9 runbook',
    privateDataIncluded:false
  }));
 }
 const critical=alerts.some(a=>a.level==='critical');
 return {environment,observedAt:now.toISOString(),counts:counters,alerts,
   status:critical?'CRITICAL':alerts.length?'WARNING':'HEALTHY_IN_SAMPLE',
   liveMonitoringConfigured:false,
   needsHumanResponse:alerts.length>0,
   noExternalNotificationSent:true};
}
export function createSanitizedHealthEvent({type,component,environment='synthetic',
 at=new Date()}={}){
 if(!TYPES.has(type)||!hashSafe(component)||!validNow(at)||
    !['synthetic','staging','production'].includes(environment))
     throw new TypeError('INVALID_EVENT');
 // Never forward arbitrary error text, user IDs, English dialogue or token.
 return Object.freeze({type,component,environment,at:at.toISOString()});
}
export function reconcileAlertHistory(history=[],newAlerts=[]){
 if(!Array.isArray(history)||!Array.isArray(newAlerts)||
    history.some(x=>!x||typeof x.id!=='string')||
    newAlerts.some(x=>!x||typeof x.id!=='string'))
     throw new TypeError('INVALID_ALERT_HISTORY');
 const known=new Set(history.map(x=>x.id));
 return [...history,...newAlerts.filter(x=>!known.has(x.id)).map(x=>
   Object.freeze({...x,status:'open',acknowledged:false}))];
}
