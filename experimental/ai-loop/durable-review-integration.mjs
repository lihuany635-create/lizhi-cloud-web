/**
 * P2↔P4 INTEGRATION: an isolated, single-process-per-claim, SQLite sandbox.
 * No external AI, no MCP writes, no user auth, no background daemon.
 *
 * A crash between sandbox handoff and queue.submit MUST remain uncertain.
 * Recovery only sweeps to RECONCILE_REQUIRED; never auto-runs work again.
 */
import {createHash} from 'node:crypto';
import {DurableSandboxQueue} from './durable-queue.mjs';
import {SandboxReviewRepair} from './review-repair-sandbox.mjs';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const check = (ok,code) => {if(!ok)throw new IntegrationError(code);};
const identifier = x => typeof x==='string' && /^[\w-]{1,128}$/.test(x);
const copy = x => structuredClone(x);

export class IntegrationError extends Error {
  constructor(code) {super(code);this.name='IntegrationError';this.code=code;}
}

export class DurableReviewSandbox {
  constructor({filename,projectId,assess,repair,at=()=>Date.now(),onArtifact=()=>{}}) {
    check(identifier(projectId) && typeof filename==='string' && filename.length,'INVALID_SCOPE');
    check(typeof assess==='function' && typeof repair==='function' &&
      typeof at==='function' && typeof onArtifact==='function','INVALID_PORT');
    this.projectId=projectId;this.at=at;this.assess=assess;this.repair=repair;
    this.onArtifact=onArtifact;
    this.queue=new DurableSandboxQueue(filename);
    this.db=this.queue.db;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS integration_artifacts (
        project_id TEXT NOT NULL,job_id TEXT NOT NULL,attempt INTEGER NOT NULL,
        artifact_id TEXT NOT NULL UNIQUE,version INTEGER NOT NULL,
        content_json TEXT NOT NULL,content_hash TEXT NOT NULL,
        PRIMARY KEY(project_id,job_id,attempt)
      );
      CREATE TABLE IF NOT EXISTS integration_handoffs (
        project_id TEXT NOT NULL,job_id TEXT NOT NULL,request_id TEXT NOT NULL,
        record_id TEXT NOT NULL UNIQUE,payload_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        PRIMARY KEY(project_id,job_id,request_id)
      );
    `);
  }
  close(){this.queue.close();}
  initManual(at=this.at()){this.queue.setMode('MANUAL',{at});}
  enqueue({jobId,eventId,taskId,requestId,initialContent,expectedRevision,riskTier='L0',
    paidApi=false,at=this.at()}){
    check([jobId,eventId,taskId,requestId].every(identifier),'INVALID_ID');
    check(riskTier==='L0' && paidApi===false,'APPROVAL_REQUIRED');
    check(Number.isSafeInteger(expectedRevision) && expectedRevision>=0,'INVALID_REVISION');
    return this.queue.enqueue({projectId:this.projectId,jobId,eventId,kind:'manual',
      payload:{taskId,requestId,initialContent,expectedRevision,riskTier,paidApi},
      at});
  }
  // SQLite tables and unique keys guarantee idempotence within the isolated DB.
  _artifact(job,requestId,entry){
    const {projectId,jobId}=job;
    check(projectId===this.projectId,'WRONG_PROJECT');
    const contentHash=digest(entry.content);
    const stableId='artifact-'+digest([projectId,jobId,entry.attempt]).slice(0,32);
    return this.queue._tx(()=>{
      const prior=this.db.prepare('SELECT * FROM integration_artifacts WHERE project_id=? AND job_id=? AND attempt=?')
        .get(projectId,jobId,entry.attempt);
      if(prior) {
        check(prior.content_hash===contentHash,'ARTIFACT_REPLAY_CONFLICT');
        return {projectId,artifactId:prior.artifact_id,version:prior.version};
      }
      // Recheck queue state in the transaction before a sandbox write.
      const live=this.queue.get(jobId,projectId);
      check(live.state==='RUNNING','JOB_NOT_RUNNING');
      const version=entry.attempt;
      this.db.prepare(`INSERT INTO integration_artifacts
        (project_id,job_id,attempt,artifact_id,version,content_json,content_hash)
        VALUES(?,?,?,?,?,?,?)`).run(projectId,jobId,entry.attempt,stableId,version,
          JSON.stringify(entry.content),contentHash);
      return {projectId,artifactId:stableId,version};
    });
  }
  _readArtifact(job,artifactId){
    const row=this.db.prepare(`SELECT * FROM integration_artifacts
      WHERE project_id=? AND job_id=? AND artifact_id=?`).get(this.projectId,job.jobId,artifactId);
    check(row,'ARTIFACT_NOT_FOUND');
    const content=JSON.parse(row.content_json);
    check(digest(content)===row.content_hash,'ARTIFACT_CORRUPTED');
    return {projectId:this.projectId,artifactId,version:row.version,content};
  }
  _handoff(job,draft){
    check(draft.projectId===this.projectId && draft.taskId===job.payload.taskId &&
      draft.requestId===job.payload.requestId && draft.authorApproved===false,'HANDOFF_SCOPE_INVALID');
    const hash=digest(draft);
    const recordId='record-'+digest([this.projectId,job.jobId,draft.requestId]).slice(0,32);
    return this.queue._tx(()=>{
      const prior=this.db.prepare(`SELECT * FROM integration_handoffs
        WHERE project_id=? AND job_id=? AND request_id=?`).get(this.projectId,job.jobId,draft.requestId);
      if(prior) {
        check(prior.payload_hash===hash,'HANDOFF_REPLAY_CONFLICT');
        return {projectId:this.projectId,recordId:prior.record_id};
      }
      const live=this.queue.get(job.jobId,this.projectId);
      check(live.state==='RUNNING','JOB_NOT_RUNNING');
      this.db.prepare(`INSERT INTO integration_handoffs
      (project_id,job_id,request_id,record_id,payload_json,payload_hash)
      VALUES(?,?,?,?,?,?)`).run(this.projectId,job.jobId,draft.requestId,recordId,JSON.stringify(draft),hash);
      return {projectId:this.projectId,recordId};
    });
  }
  _readHandoff(job,recordId){
    const row=this.db.prepare(`SELECT * FROM integration_handoffs
      WHERE project_id=? AND job_id=? AND record_id=?`).get(this.projectId,job.jobId,recordId);
    check(row,'HANDOFF_NOT_FOUND');
    const value=JSON.parse(row.payload_json);
    check(digest(value)===row.payload_hash,'HANDOFF_CORRUPTED');
    return {...value,recordId};
  }
  evidence(jobId){
    const job=this.queue.get(jobId,this.projectId);
    const artifacts=this.db.prepare('SELECT * FROM integration_artifacts WHERE project_id=? AND job_id=? ORDER BY attempt')
      .all(this.projectId,jobId).map(row=>({artifactId:row.artifact_id,version:row.version,
        verifiedHash:digest(JSON.parse(row.content_json))===row.content_hash}));
    const rows=this.db.prepare('SELECT * FROM integration_handoffs WHERE project_id=? AND job_id=?')
      .all(this.projectId,jobId);
    const handoffs=rows.map(row=>({recordId:row.record_id,confirmedHash:
      digest(JSON.parse(row.payload_json))===row.payload_hash,
      authorApproved:JSON.parse(row.payload_json).authorApproved}));
    return {jobId,projectId:this.projectId,state:job.state,artifacts,handoffs};
  }
  async runOnce({jobId,workerId,leaseMs=60000,crashAfterHandoff=false}){
    check(identifier(jobId)&&identifier(workerId),'INVALID_ID');
    const now=this.at();
    const current=this.queue.get(jobId,this.projectId);
    check(current.state==='QUEUED','RECONCILE_BEFORE_RETRY');
    const claimed=this.queue.claim({jobId,projectId:this.projectId,workerId,
      expectedRevision:current.revision,at:now,leaseMs});
    const running=this.queue.begin({jobId,projectId:this.projectId,workerId,
      expectedRevision:claimed.revision,at:now});
    const payload=copy(running.payload);
    const allowed=()=>{const c=this.queue.control(),j=this.queue.get(jobId,this.projectId);
      return c.mode==='MANUAL' && !c.paused && !c.stopped &&
        j.state==='RUNNING' && j.owner===workerId && this.at()<j.leaseUntil;};
    const engine=new SandboxReviewRepair({
      projectId:this.projectId,
      checkStillAllowed:allowed,
      assessArtifact:async args=>this.assess(copy(args)),
      proposeRepair:async args=>this.repair(copy(args)),
      writeSandboxArtifact:async item=>{
        const info=this._artifact(running,payload.requestId,item);
        await this.onArtifact(info);
        return info;
      },
      readSandboxArtifact:async ({artifactId})=>this._readArtifact(running,artifactId),
      appendSandboxHandoff:async draft=>this._handoff(running,draft),
      readSandboxHandoff:async ({recordId})=>this._readHandoff(running,recordId),
    });
    // No catch/retry on unknown state. Crash/test interruptions remain RUNNING.
    const verdict=await engine.run({projectId:this.projectId,...payload,mode:'MANUAL'});
    if(crashAfterHandoff && verdict.status==='RECORDED')
      throw new IntegrationError('SIMULATED_PROCESS_CRASH');
    check(allowed(),'RECONCILE_BEFORE_RETRY');
    const uncertain=verdict.status!=='RECORDED';
    const submission=this.queue.submit({jobId,projectId:this.projectId,workerId,
      expectedRevision:running.revision,requestId:payload.requestId,
      result:{status:verdict.status,reason:verdict.reason??null,recordId:verdict.recordId??null,
        authorApproved:false},uncertain,at:this.at()});
    return {verdict,submission,evidence:this.evidence(jobId)};
  }
  // Re-opening after crash never runs the job. Only marks expired claims for manual evidence review.
  sweepExpired(){return this.queue.sweepExpired({at:this.at()});}
  reconcileAfterInspection({jobId,readbackId,conclusion='UNKNOWN',ownerApproved=false}){
    const job=this.queue.get(jobId,this.projectId);
    check(job.state==='RECONCILE_REQUIRED','RECONCILE_NOT_REQUIRED');
    const evidence=this.evidence(jobId);
    if(conclusion==='EFFECT_PRESENT') {
      check(evidence.handoffs.length===1 && evidence.handoffs[0].confirmedHash &&
        evidence.handoffs[0].authorApproved===false &&
        evidence.artifacts.every(x=>x.verifiedHash),'EVIDENCE_INCOMPLETE');
    }
    // Owner approval is a mock parameter here, never a real authorization credential.
    return this.queue.reconcile({jobId,projectId:this.projectId,
      expectedRevision:job.revision,conclusion,readbackId,ownerApproved,at:this.at()});
  }
}
