// GitHub Actions P9-A run: synthetic release and rollback rehearsal, not monitoring.
import {writeFile,mkdir} from 'node:fs/promises';
import {getReleaseChecklist} from '../release-readiness.mjs';
import {createSanitizedHealthEvent,aggregateHealthSignals} from '../health-monitor.mjs';
import {createIncident,prepareRollback,dryRunRollback} from '../incident-rollback.mjs';
const commitSha=process.env.GITHUB_SHA?.match(/^[0-9a-f]{40}$/)?.[0]??'0'.repeat(40);
const now=new Date('2026-11-15T08:00:00.000Z');
const alertEvents=[createSanitizedHealthEvent({type:'cross_owner_violation',component:'english-edge',at:now})];
const monitor=aggregateHealthSignals({events:alertEvents,now,environment:'synthetic'});
const incident=createIncident({id:'ENG-0001',type:'data',severity:'SEV1',detectedAt:now,
 summary:'Synthetic cross-owner data isolation simulation'});
const rollback=prepareRollback({incident,commitSha,existingToolInventory:[
 'aiwb_overview','aiwb_get_task','list_projects','get_project'
]});
const rehearsal=dryRunRollback({plan:rollback,
 simulatedFailures:['disable-english-mcp-namespace']});
const readiness=getReleaseChecklist({commitSha,environment:'isolated'});
const output={
 stage:'P9-A',environment:'synthetic',commitSha,
 generatedAt:new Date().toISOString(),
 release:{status:readiness.candidateStatus,missing:readiness.missing,
   noDeployment:true,componentCount:readiness.steps.length},
 health:{status:monitor.status,alerts:monitor.alerts,
   liveMonitoringConfigured:false},
 incident:{id:incident.id,severity:incident.severity,state:incident.state},
 rollback:{status:rehearsal.status,steps:rehearsal.steps,
   realRollbackPerformed:false,productionActions:0,databaseWrites:0},
 formalGates:{passed:0,required:12,state:'NOT_TESTED'},
 notice:'Synthetic failure injection is intentional. No cloud monitor, Site or database changed.'
};
await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
await writeFile(new URL('../test-results/operations-rehearsal.json',import.meta.url),
 JSON.stringify(output,null,2)+'\n');
console.log('P9_SYNTHETIC_OPERATIONS_REHEARSAL_COMPLETE_REAL_DEPLOYMENTS_0');
