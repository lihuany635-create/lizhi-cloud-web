/** P4 sandbox-only review/repair/handoff. Deterministic ports; no AI model or MCP write. */
import {createHash} from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const clone = v => structuredClone(v);
const validId = v => typeof v==='string' && /^[\w-]{1,128}$/.test(v);
const expect = (ok,code) => {if(!ok)throw new RepairLoopError(code);};
export class RepairLoopError extends Error {
  constructor(code) {super(code);this.name='RepairLoopError';this.code=code;}
}

/** No side effects except through explicitly injected SANDBOX-only ports. */
export class SandboxReviewRepair {
  constructor({projectId,writeSandboxArtifact,readSandboxArtifact,assessArtifact,proposeRepair,
    appendSandboxHandoff,readSandboxHandoff,maxRepairs=2,checkStillAllowed=()=>true}) {
    expect(validId(projectId),'PROJECT_INVALID');
    expect([writeSandboxArtifact,readSandboxArtifact,assessArtifact,proposeRepair,
      appendSandboxHandoff,readSandboxHandoff,checkStillAllowed].every(x=>typeof x==='function'),'PORT_MISSING');
    expect(Number.isInteger(maxRepairs) && maxRepairs>=0 && maxRepairs<=2,'REPAIR_LIMIT_INVALID');
    Object.assign(this,{projectId,writeSandboxArtifact,readSandboxArtifact,assessArtifact,
      proposeRepair,appendSandboxHandoff,readSandboxHandoff,maxRepairs,checkStillAllowed});
    this.receipts=[];
  }
  async run({projectId,taskId,requestId,initialContent,expectedRevision,mode='MANUAL',riskTier='L0',paidApi=false}) {
    expect(projectId===this.projectId && validId(taskId) && validId(requestId),'SCOPE_DENIED');
    expect(mode==='MANUAL' && riskTier==='L0' && paidApi===false,'APPROVAL_REQUIRED');
    expect(Number.isSafeInteger(expectedRevision) && expectedRevision>=0,'REVISION_INVALID');
    const receipts=[];
    let content=clone(initialContent);
    let repairs=0;
    while(true) {
      expect(await this.checkStillAllowed(),'STOPPED');
      let posted;
      try {posted=await this.writeSandboxArtifact({projectId,taskId,requestId,content:clone(content),attempt:repairs+1});}
      catch {return {status:'NEEDS_OWNER',reason:'UNCERTAIN_ARTIFACT_WRITE',repairs,receipts,authorApproved:false};}
      if(posted?.uncertain===true)return {status:'NEEDS_OWNER',reason:'UNCERTAIN_ARTIFACT_WRITE',repairs,receipts,authorApproved:false};
      expect(posted?.projectId===projectId && validId(posted.artifactId) && Number.isSafeInteger(posted.version),'SANDBOX_WRITE_NOT_CONFIRMED');
      receipts.push({role:repairs?'Repairer':'Executor',attempt:repairs+1,artifactId:posted.artifactId,version:posted.version,hash:digest(content)});
      expect(await this.checkStillAllowed(),'STOPPED');
      // Reviewer always re-reads the sandbox artifact via its separate read port.
      const actual=await this.readSandboxArtifact({projectId,artifactId:posted.artifactId});
      expect(actual?.projectId===projectId,'CROSS_PROJECT_RESULT');
      expect(actual?.artifactId===posted.artifactId && actual?.version===posted.version,'VERSION_CHANGED');
      expect(digest(actual.content)===digest(content),'SOURCE_CHANGED');
      const verdict=await this.assessArtifact({projectId,taskId,revision:expectedRevision,content:clone(actual.content),attempt:repairs+1});
      expect(verdict && Array.isArray(verdict.defects) && verdict.defects.every(v=>typeof v==='string'),'REVIEW_INVALID');
      receipts.push({role:'Reviewer',attempt:repairs+1,readback:true,artifactId:posted.artifactId,
        version:posted.version,actualHash:digest(actual.content),accepted:verdict.defects.length===0,defects:[...verdict.defects]});
      if(verdict.defects.length===0) {
        expect(await this.checkStillAllowed(),'STOPPED');
        const draft={projectId,taskId,requestId,expectedRevision,artifactId:posted.artifactId,
          artifactVersion:posted.version,artifactHash:digest(actual.content),reviewed:true,
          authorApproved:false,status:'REVIEW_PASSED',scope:'sandbox-only'};
        let saved;
        try {saved=await this.appendSandboxHandoff(clone(draft));}
        catch {return {status:'NEEDS_OWNER',reason:'UNCERTAIN_HANDOFF_WRITE',repairs,receipts,authorApproved:false};}
        if(saved?.uncertain===true)return {status:'NEEDS_OWNER',reason:'UNCERTAIN_HANDOFF_WRITE',repairs,receipts,authorApproved:false};
        expect(saved?.projectId===projectId && validId(saved.recordId),'HANDOFF_UNCONFIRMED');
        const back=await this.readSandboxHandoff({projectId,recordId:saved.recordId});
        expect(back?.recordId===saved.recordId,'HANDOFF_READBACK_MISSING');
        for (const [k,v] of Object.entries(draft))expect(JSON.stringify(back[k])===JSON.stringify(v),'HANDOFF_READBACK_MISMATCH');
        receipts.push({role:'Handover',readback:true,recordId:saved.recordId,authorApproved:false});
        this.receipts=clone(receipts);
        return {status:'RECORDED',recordId:saved.recordId,repairs,receipts,authorApproved:false,scope:'sandbox-only'};
      }
      if(repairs>=this.maxRepairs)return {status:'NEEDS_OWNER',reason:'REPAIR_LIMIT_REACHED',repairs,receipts,authorApproved:false};
      // Repairer can only propose the next candidate; no tool permissions are passed.
      const proposed=await this.proposeRepair({projectId,taskId,content:clone(actual.content),defects:[...verdict.defects],repairNumber:repairs+1});
      expect(proposed && Object.hasOwn(proposed,'content'),'REPAIR_PROPOSAL_INVALID');
      content=clone(proposed.content);
      repairs++;
    }
  }
}
