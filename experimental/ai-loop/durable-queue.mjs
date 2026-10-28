/**
 * P2 LOCAL SANDBOX ONLY. SQLite durable queue, not hosted, not a daemon, NO MCP.
 * Node >=22.16 with built-in experimental node:sqlite.
 * Security boundary: sandbox project IDs and mock payloads ONLY. No real tools.
 */
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export class QueueError extends Error {
  constructor(code) { super(code); this.name = 'QueueError'; this.code = code; }
}
const fail = (code) => { throw new QueueError(code); };
const need = (condition, code) => { if (!condition) fail(code); };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json = value => JSON.stringify(value);
const isId = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
const validMs = t => Number.isSafeInteger(t) && t >= 0;
const validState = new Set(['QUEUED', 'CLAIMED', 'RUNNING', 'SUBMITTED', 'RECONCILE_REQUIRED', 'NEEDS_OWNER']);
const schema = `
 CREATE TABLE IF NOT EXISTS control (
   id INTEGER PRIMARY KEY CHECK (id=1), mode TEXT NOT NULL CHECK(mode IN ('OFF','MANUAL','AUTO')),
   paused INTEGER NOT NULL CHECK(paused IN (0,1)), stopped INTEGER NOT NULL CHECK(stopped IN (0,1)),
   revision INTEGER NOT NULL
 );
 INSERT OR IGNORE INTO control VALUES (1,'OFF',0,0,1);
 CREATE TABLE IF NOT EXISTS jobs (
   job_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, state TEXT NOT NULL,
   payload_json TEXT NOT NULL, payload_hash TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
   owner TEXT, lease_until INTEGER, attempt_no INTEGER NOT NULL DEFAULT 0,
   last_request_id TEXT, last_result_json TEXT, created_at INTEGER NOT NULL
 );
 CREATE TABLE IF NOT EXISTS triggers (
   project_id TEXT NOT NULL, event_id TEXT NOT NULL, job_id TEXT NOT NULL,
   trigger_hash TEXT NOT NULL, PRIMARY KEY(project_id,event_id)
 );
 CREATE TABLE IF NOT EXISTS effects (
   project_id TEXT NOT NULL, request_id TEXT NOT NULL, job_id TEXT NOT NULL,
   effect_hash TEXT NOT NULL, uncertain INTEGER NOT NULL, result_json TEXT NOT NULL,
   PRIMARY KEY(project_id,request_id)
 );
 CREATE TABLE IF NOT EXISTS attempts (
   job_id TEXT NOT NULL, attempt_no INTEGER NOT NULL, worker_id TEXT NOT NULL,
   started_at INTEGER NOT NULL, completed_at INTEGER, outcome TEXT,
   PRIMARY KEY(job_id,attempt_no)
 );
 CREATE TABLE IF NOT EXISTS audit (
   seq INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT, event TEXT NOT NULL,
   detail_json TEXT NOT NULL, at INTEGER NOT NULL
 );
 CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state,created_at);
`;

export class DurableSandboxQueue {
  constructor(filename) {
    need(typeof filename === 'string' && filename.length > 0, 'INVALID_PATH');
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    this.db.exec(schema);
  }
  close() { this.db.close(); }
  _tx(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  _audit(jobId,event,detail,at) {
    this.db.prepare('INSERT INTO audit (job_id,event,detail_json,at) VALUES (?,?,?,?)')
      .run(jobId,event,json(detail),at);
  }
  _control() { return this.db.prepare('SELECT * FROM control WHERE id=1').get(); }
  control() { const x=this._control(); return {mode:x.mode, paused:!!x.paused, stopped:!!x.stopped, revision:x.revision}; }
  _job(jobId,projectId) {
    const j=this.db.prepare('SELECT * FROM jobs WHERE job_id=?').get(jobId);
    need(j, 'JOB_NOT_FOUND'); need(j.project_id===projectId, 'WRONG_PROJECT'); return j;
  }
  _export(j) {
    return {jobId:j.job_id, projectId:j.project_id, state:j.state, revision:j.revision,
      payload:JSON.parse(j.payload_json), owner:j.owner, leaseUntil:j.lease_until,
      attemptNo:j.attempt_no, lastRequestId:j.last_request_id,
      result:j.last_result_json===null?null:JSON.parse(j.last_result_json)};
  }
  get(jobId,projectId) { return this._export(this._job(jobId,projectId)); }
  audit() { return this.db.prepare('SELECT * FROM audit ORDER BY seq').all().map(a=>({...a,detail:JSON.parse(a.detail_json)})); }
  attempts(jobId,projectId) {this._job(jobId,projectId);return this.db.prepare('SELECT * FROM attempts WHERE job_id=? ORDER BY attempt_no').all(jobId);}
  setMode(mode,{at=0}={}) {
    need(['OFF','MANUAL','AUTO'].includes(mode),'INVALID_MODE');need(validMs(at),'INVALID_TIME');
    return this._tx(()=>{
      const c=this._control();need(!c.stopped||mode==='OFF','STOPPED');
      this.db.prepare('UPDATE control SET mode=?, revision=revision+1 WHERE id=1').run(mode);
      this._audit(null,'MODE',{mode},at);return this.control();
    });
  }
  pause({at=0}={}) {need(validMs(at),'INVALID_TIME');return this._tx(()=>{this.db.prepare('UPDATE control SET paused=1,revision=revision+1 WHERE id=1').run();this._audit(null,'PAUSE',{},at);return this.control();});}
  resume({at=0}={}) {need(validMs(at),'INVALID_TIME');return this._tx(()=>{need(!this._control().stopped,'STOPPED');this.db.prepare('UPDATE control SET paused=0,revision=revision+1 WHERE id=1').run();this._audit(null,'RESUME',{},at);return this.control();});}
  stop({at=0}={}) {need(validMs(at),'INVALID_TIME');return this._tx(()=>{
    this.db.prepare("UPDATE control SET mode='OFF',paused=1,stopped=1,revision=revision+1 WHERE id=1").run();
    const jobs=this.db.prepare("SELECT * FROM jobs WHERE state IN ('QUEUED','CLAIMED','RUNNING')").all();
    for(const j of jobs){const next=j.state==='QUEUED'?'CANCELLED':'NEEDS_OWNER';
      this.db.prepare('UPDATE jobs SET state=?,revision=revision+1 WHERE job_id=?').run(next,j.job_id);
      this._audit(j.job_id,next,{reason:'STOP',uncertain:j.state!=='QUEUED'},at);
    }
    this._audit(null,'STOP',{externalEffectsNotRecalled:true},at);return this.control();
  });}
  enqueue({projectId,jobId,eventId,kind,payload,allowlisted=false,at=0}) {
    need(isId(projectId)&&isId(jobId)&&isId(eventId),'INVALID_ID');
    need(['manual','auto'].includes(kind),'INVALID_TRIGGER');need(validMs(at),'INVALID_TIME');
    need(payload!==null&&typeof payload==='object'&&!Array.isArray(payload),'INVALID_PAYLOAD');
    // The caller's allowlisted flag is a MOCK input, not trusted authentication.
    const triggerHash=hash({jobId,kind,payload});
    return this._tx(()=>{
      const c=this._control();need(!c.stopped&&!c.paused,'PAUSED_OR_STOPPED');
      need((kind==='manual'&&c.mode==='MANUAL')||(kind==='auto'&&c.mode==='AUTO'&&allowlisted===true),'TRIGGER_NOT_AUTHORIZED');
      const prior=this.db.prepare('SELECT * FROM triggers WHERE project_id=? AND event_id=?').get(projectId,eventId);
      if(prior){need(prior.trigger_hash===triggerHash,'EVENT_ID_CONFLICT');return {duplicate:true,job:this.get(prior.job_id,projectId)};}
      need(!this.db.prepare('SELECT 1 FROM jobs WHERE job_id=?').get(jobId),'DUPLICATE_JOB');
      this.db.prepare("INSERT INTO jobs (job_id,project_id,state,payload_json,payload_hash,revision,created_at) VALUES (?,?, 'QUEUED',?,?,1,?)").run(jobId,projectId,json(payload),hash(payload),at);
      this.db.prepare('INSERT INTO triggers VALUES (?,?,?,?)').run(projectId,eventId,jobId,triggerHash);
      this._audit(jobId,'QUEUED',{kind,eventId},at);return {duplicate:false,job:this.get(jobId,projectId)};
    });
  }
  claim({jobId,projectId,workerId,expectedRevision,at,leaseMs=60000}) {
    need(isId(jobId)&&isId(projectId)&&isId(workerId),'INVALID_ID');
    need(validMs(at)&&validMs(leaseMs)&&leaseMs>0&&leaseMs<=3600000,'INVALID_LEASE');
    return this._tx(()=>{
      const c=this._control();need(!c.stopped&&!c.paused&&c.mode!=='OFF','PAUSED_OR_STOPPED');
      // MVP global cap=1 active worker across this queue, transaction-serialized.
      need(!this.db.prepare("SELECT 1 FROM jobs WHERE state IN ('CLAIMED','RUNNING') LIMIT 1").get(),'CAPACITY_REACHED');
      const j=this._job(jobId,projectId);need(j.revision===expectedRevision,'STALE_REVISION');need(j.state==='QUEUED','INVALID_TRANSITION');
      const until=at+leaseMs;need(Number.isSafeInteger(until),'INVALID_TIME');
      this.db.prepare("UPDATE jobs SET state='CLAIMED',owner=?,lease_until=?,revision=revision+1 WHERE job_id=?").run(workerId,until,jobId);
      this._audit(jobId,'CLAIMED',{workerId,leaseUntil:until},at);return this.get(jobId,projectId);
    });
  }
  begin({jobId,projectId,workerId,expectedRevision,at}){
    need(validMs(at),'INVALID_TIME');return this._tx(()=>{
      const j=this._job(jobId,projectId);need(j.revision===expectedRevision,'STALE_REVISION');
      need(j.state==='CLAIMED','INVALID_TRANSITION');need(j.owner===workerId,'LEASE_OWNER_MISMATCH');need(at<j.lease_until,'LEASE_EXPIRED');
      const attemptNo=j.attempt_no+1;
      this.db.prepare("UPDATE jobs SET state='RUNNING',revision=revision+1,attempt_no=? WHERE job_id=?").run(attemptNo,jobId);
      this.db.prepare('INSERT INTO attempts (job_id,attempt_no,worker_id,started_at) VALUES (?,?,?,?)').run(jobId,attemptNo,workerId,at);
      this._audit(jobId,'RUNNING',{workerId,attemptNo},at);return this.get(jobId,projectId);
    });
  }
  heartbeat({jobId,projectId,workerId,expectedRevision,at,extendMs=60000}){
    need(validMs(at)&&validMs(extendMs)&&extendMs>0&&extendMs<=3600000,'INVALID_LEASE');return this._tx(()=>{
      const j=this._job(jobId,projectId);need(j.revision===expectedRevision,'STALE_REVISION');
      need(['CLAIMED','RUNNING'].includes(j.state),'INVALID_TRANSITION');need(j.owner===workerId,'LEASE_OWNER_MISMATCH');
      need(at<j.lease_until,'LEASE_EXPIRED');need(!this._control().stopped,'STOPPED');
      const until=Math.max(j.lease_until,at+extendMs);this.db.prepare('UPDATE jobs SET lease_until=?,revision=revision+1 WHERE job_id=?').run(until,jobId);
      this._audit(jobId,'HEARTBEAT',{workerId,leaseUntil:until},at);return this.get(jobId,projectId);
    });
  }
  submit({jobId,projectId,workerId,expectedRevision,requestId,result,uncertain=false,at}) {
    need(isId(requestId)&&validMs(at),'INVALID_SUBMISSION');need(typeof result==='object'&&result!==null,'INVALID_RESULT');
    const effectHash=hash({jobId,workerId,result,uncertain});
    return this._tx(()=>{
      const prior=this.db.prepare('SELECT * FROM effects WHERE project_id=? AND request_id=?').get(projectId,requestId);
      if(prior){need(prior.effect_hash===effectHash,'REQUEST_ID_CONFLICT');return {duplicate:true,uncertain:!!prior.uncertain,job:this.get(prior.job_id,projectId)};}
      const j=this._job(jobId,projectId);need(j.revision===expectedRevision,'STALE_REVISION');
      need(j.state==='RUNNING','INVALID_TRANSITION');need(j.owner===workerId,'LEASE_OWNER_MISMATCH');need(at<j.lease_until,'LEASE_EXPIRED');
      need(!this._control().stopped,'STOPPED');
      this.db.prepare('INSERT INTO effects VALUES (?,?,?,?,?,?)').run(projectId,requestId,jobId,effectHash,uncertain?1:0,json(result));
      const next=uncertain?'NEEDS_OWNER':'SUBMITTED';
      this.db.prepare('UPDATE jobs SET state=?,revision=revision+1,last_request_id=?,last_result_json=?,owner=NULL,lease_until=NULL WHERE job_id=?').run(next,requestId,json(result),jobId);
      this.db.prepare('UPDATE attempts SET completed_at=?,outcome=? WHERE job_id=? AND attempt_no=?').run(at,uncertain?'UNKNOWN':'SUBMITTED',jobId,j.attempt_no);
      this._audit(jobId,next,{requestId,uncertain,readbackRequired:uncertain},at);return {duplicate:false,uncertain,job:this.get(jobId,projectId)};
    });
  }
  list({projectId,states=[]}={}) {
    need(!projectId||isId(projectId),'INVALID_ID');
    need(Array.isArray(states)&&states.every(x=>typeof x==='string'),'INVALID_STATE_FILTER');
    const rows=this.db.prepare('SELECT * FROM jobs ORDER BY created_at,job_id').all();
    return rows.filter(j=>(!projectId||j.project_id===projectId)&&(!states.length||states.includes(j.state))).map(j=>this._export(j));
  }
  sweepExpired({at}) {
    // Explicit recovery sweep, safe to call after crash/restart. Never requeue.
    need(validMs(at),'INVALID_TIME');
    return this._tx(()=>{
      const rows=this.db.prepare("SELECT * FROM jobs WHERE state IN ('CLAIMED','RUNNING') AND lease_until<=? ORDER BY job_id").all(at);
      for(const j of rows){
        this.db.prepare("UPDATE jobs SET state='RECONCILE_REQUIRED',owner=NULL,lease_until=NULL,revision=revision+1 WHERE job_id=?").run(j.job_id);
        this._audit(j.job_id,'RECONCILE_REQUIRED',{reason:'LEASE_EXPIRED_AFTER_RESTART',needsReadback:true,automaticRetry:false},at);
      }
      return rows.map(j=>this.get(j.job_id,j.project_id));
    });
  }
  expire({jobId,projectId,at}){
    need(validMs(at),'INVALID_TIME');return this._tx(()=>{
      const j=this._job(jobId,projectId);need(['CLAIMED','RUNNING'].includes(j.state),'INVALID_TRANSITION');
      need(j.lease_until!==null&&at>=j.lease_until,'LEASE_STILL_VALID');
      this.db.prepare("UPDATE jobs SET state='RECONCILE_REQUIRED',revision=revision+1,owner=NULL,lease_until=NULL WHERE job_id=?").run(jobId);
      this._audit(jobId,'RECONCILE_REQUIRED',{reason:'LEASE_EXPIRED',needsReadback:true,automaticRetry:false},at);
      return this.get(jobId,projectId);
    });
  }
  reconcile({jobId,projectId,expectedRevision,conclusion,readbackId,ownerApproved=false,at}){
    need(validMs(at)&&isId(readbackId),'READBACK_REQUIRED');need(['EFFECT_PRESENT','NO_EFFECT','UNKNOWN'].includes(conclusion),'INVALID_CONCLUSION');
    return this._tx(()=>{
      const j=this._job(jobId,projectId);need(j.revision===expectedRevision,'STALE_REVISION');need(j.state==='RECONCILE_REQUIRED','INVALID_TRANSITION');
      if(conclusion==='NO_EFFECT')need(ownerApproved===true,'OWNER_APPROVAL_REQUIRED');
      const next=conclusion==='NO_EFFECT'?'QUEUED':conclusion==='EFFECT_PRESENT'?'SUBMITTED':'NEEDS_OWNER';
      this.db.prepare('UPDATE jobs SET state=?,revision=revision+1 WHERE job_id=?').run(next,jobId);
      this._audit(jobId,'RECONCILED',{conclusion,readbackId,ownerApproved,next},at);return this.get(jobId,projectId);
    });
  }
}
