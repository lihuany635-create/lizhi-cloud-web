/**
 * P3 owner-scoped grant policy REFERENCE (single-process isolated test only).
 * NOT deployed, no real user credentials, no external MCP/AI call or paid API.
 * The host MUST inject server-side verifyOwnerSession, canReadProject, readTool.
 * Never wrap an all-powerful Bridge credential and call this a complete security boundary.
 * Real multi-instance deployment needs an atomic durable server-side grant ledger.
 */
import {createHash, randomBytes} from 'node:crypto';

export class GrantPolicyError extends Error {
  constructor(code) {super(code);this.name='GrantPolicyError';this.code=code;}
}
const deny=(code)=>{throw new GrantPolicyError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const identifier=v=>typeof v==='string' && /^[\w-]{1,128}$/.test(v);
const ALLOW=Object.freeze(['list_projects','get_project_context','get_project_handoff']);
const sha=s=>createHash('sha256').update(s).digest('hex');
const copy=x=>structuredClone(x);

export class ScopedReadGrantLedger {
  constructor({verifyOwnerSession,canReadProject,readTool,now=Date.now,maxTtlMs=300000,maxCalls=8}) {
    need([verifyOwnerSession,canReadProject,readTool,now].every(x=>typeof x==='function'),'HOST_NOT_CONFIGURED');
    need(Number.isSafeInteger(maxTtlMs)&&maxTtlMs>=1000&&maxTtlMs<=300000,'INVALID_LIMIT');
    need(Number.isSafeInteger(maxCalls)&&maxCalls>=1&&maxCalls<=20,'INVALID_LIMIT');
    this.verifyOwnerSession=verifyOwnerSession;
    this.canReadProject=canReadProject;
    this.readTool=readTool;this.now=now;
    this.maxTtlMs=maxTtlMs;this.maxCalls=maxCalls;
    this._grants=new Map();this.audit=[];
  }
  async _owner() {
    let s;
    try{s=await this.verifyOwnerSession();}catch{deny('OWNER_SESSION_INVALID');}
    need(s && s.verifiedByServer===true && identifier(s.subjectId) &&
      Number.isSafeInteger(s.expiresAt) && s.expiresAt>this.now() &&
      s.revoked!==true && s.isAnonymous!==true,'OWNER_SESSION_INVALID');
    return s;
  }
  async _canRead(owner,projectId){
    try{return await this.canReadProject({ownerSubject:owner.subjectId,projectId})===true;}
    catch{return false;}
  }
  _audit(decision,grant,tool=null){
    this.audit.push({grantId:grant?.grantId??null,projectId:grant?.projectId??null,
      tool,decision,at:this.now()});
  }
  async issue({projectId,mode='OFF',riskTier='L0',ttlMs=60000,callLimit=5}={}) {
    need(identifier(projectId),'PROJECT_NOT_ALLOWED');
    need(mode==='MANUAL','AUTO_DISABLED');
    need(riskTier==='L0','APPROVAL_REQUIRED');
    need(Number.isSafeInteger(ttlMs)&&ttlMs>0&&ttlMs<=this.maxTtlMs &&
      Number.isSafeInteger(callLimit)&&callLimit>0&&callLimit<=this.maxCalls,'INVALID_LIMIT');
    const owner=await this._owner();
    need(await this._canRead(owner,projectId),'PROJECT_NOT_ALLOWED');
    const at=this.now(),expiresAt=Math.min(at+ttlMs,owner.expiresAt);
    need(expiresAt>at,'OWNER_SESSION_INVALID');
    const token=randomBytes(32).toString('base64url');
    const grantId=randomBytes(16).toString('hex');
    const record={grantId,ownerSubject:owner.subjectId,projectId,expiresAt,
      remaining:callLimit,revoked:false,mode:'MANUAL',writeAllowed:false,paidApiAllowed:false,
      issuedAt:at};
    this._grants.set(sha(token),record);this._audit('ISSUED',record);
    return {token,grantId,expiresAt,projectId,tools:[...ALLOW],mode:'MANUAL',
      remaining:callLimit,writeAllowed:false,paidApiAllowed:false};
  }
  _lookup(token) {
    need(typeof token==='string' && token.length>=32 && token.length<=256,'GRANT_INVALID');
    const r=this._grants.get(sha(token));
    need(r,'GRANT_INVALID');return r;
  }
  async execute({token,tool,args={},mode='MANUAL',requestId}={}) {
    need(typeof tool==='string' && ALLOW.includes(tool),'TOOL_NOT_ALLOWED');
    need(identifier(requestId),'INVALID_REQUEST');
    need(mode==='MANUAL','AUTO_DISABLED');
    need(args && typeof args==='object' && !Array.isArray(args),'ARGUMENTS_INVALID');
    const r=this._lookup(token);
    need(!r.revoked && r.expiresAt>this.now() && r.remaining>0,'GRANT_EXPIRED_OR_REVOKED');
    const owner=await this._owner();
    need(owner.subjectId===r.ownerSubject && owner.expiresAt>this.now(),'OWNER_SESSION_INVALID');
    need(await this._canRead(owner,r.projectId),'PROJECT_NOT_ALLOWED');
    if(tool==='list_projects')need(Object.keys(args).length===0,'ARGUMENTS_INVALID');
    else need(Object.keys(args).length===1 && args.projectId===r.projectId,'PROJECT_NOT_ALLOWED');
    need(!r.revoked && r.expiresAt>this.now() && r.remaining>0,'GRANT_EXPIRED_OR_REVOKED');
    r.remaining--;this._audit('READ_ATTEMPT',r,tool);
    let raw;
    try{raw=await this.readTool({ownerSubject:r.ownerSubject,tool,args:
      tool==='list_projects'?{}:{projectId:r.projectId}});}
    catch {this._audit('READ_FAILED',r,tool);deny('READ_FAILED');}
    need(raw && typeof raw==='object','READ_RESULT_INVALID');
    if(tool==='list_projects'){
      need(Array.isArray(raw),'READ_RESULT_INVALID');
      const ownProject=raw.find(p=>p.projectId===r.projectId || p.id===r.projectId);
      need(ownProject && Number.isSafeInteger(ownProject.revision),'READ_RESULT_INVALID');
      this._audit('READ_OK',r,tool);
      return [{projectId:r.projectId,revision:ownProject.revision}];
    }
    need(raw.projectId===r.projectId && Number.isSafeInteger(raw.revision),'CROSS_PROJECT_RESULT');
    const trimmed={projectId:r.projectId,revision:raw.revision};
    if(tool==='get_project_context'){
      need(Array.isArray(raw.tasks),'READ_RESULT_INVALID');
      trimmed.tasks=raw.tasks.map(t=>{
        need(identifier(t.id)&&identifier(t.key)&&typeof t.status==='string','READ_RESULT_INVALID');
        return {id:t.id,key:t.key,status:t.status};
      });
    }else{
      trimmed.lastWorkKey=identifier(raw.lastWork?.key)?raw.lastWork.key:null;
      trimmed.unfinishedCount=Array.isArray(raw.unfinished)?raw.unfinished.length:null;
    }
    this._audit('READ_OK',r,tool);
    return copy(trimmed);
  }
  async revoke({token}={}){
    const r=this._lookup(token);
    const owner=await this._owner();
    need(owner.subjectId===r.ownerSubject,'OWNER_SESSION_INVALID');
    r.revoked=true;this._audit('REVOKED',r);return {grantId:r.grantId,revoked:true};
  }
  status(token){
    const r=this._lookup(token);
    return {grantId:r.grantId,projectId:r.projectId,expiresAt:r.expiresAt,
      remaining:r.remaining,revoked:r.revoked,writeAllowed:false,paidApiAllowed:false};
  }
  auditSnapshot(){return copy(this.audit);}
  tools(){return [...ALLOW];}
}
