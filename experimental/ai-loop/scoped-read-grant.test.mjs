import test from 'node:test';
import assert from 'node:assert/strict';
import {ScopedReadGrantLedger,GrantPolicyError} from './scoped-read-grant.mjs';
const P='61b88bec-9b3e-49e6-8780-d073fc816516';
const NOW={value:1700000000000};
const reject=(fn,code)=>assert.rejects(fn,e=>e instanceof GrantPolicyError && e.code===code);
function setup(options={}){
 let calls=0,verified=0;const clock=options.clock??{value:NOW.value};
 const ledger=new ScopedReadGrantLedger({now:()=>clock.value,
 verifyOwnerSession:async()=>{verified++;return {verifiedByServer:!options.unverified,
 subjectId:options.wrongOwner?'OTHER':'owner-1',
 expiresAt:options.sessionExpiry??clock.value+100000,revoked:!!options.revoked,
 isAnonymous:!!options.anonymous};},
 canReadProject:async({projectId})=>projectId===P&&!options.denied,
 readTool:async({tool,args})=>{calls++;if(options.failRead)throw Error('secret from provider');
 const projectId=options.wrongProject?'OTHER':P;
 if(tool==='list_projects')return [{projectId,revision:71,privateNote:'SECRET'},
 {projectId:'another',revision:45,privateNote:'SECRET'}];
 if(tool==='get_project_context')return {projectId,revision:71,tasks:[{id:'task1',key:'build',status:'IN_PROGRESS',privateNote:'SECRET'}]};
 return {projectId,revision:71,lastWork:{key:'latest',secret:'SECRET'},unfinished:[],privateNote:'SECRET'};}
 });
 return {ledger,clock,metrics:()=>({calls,verified})};
}
const issue=(ledger,opts={})=>ledger.issue({projectId:P,mode:'MANUAL',...opts});
test('GRANT01 cannot issue in OFF or AUTO',async()=>{const {ledger}=setup();for(const mode of ['OFF','AUTO'])await reject(()=>issue(ledger,{mode}),'AUTO_DISABLED')});
test('GRANT02 invalid and revoked owner sessions cannot issue',async()=>{for(const opts of [{unverified:true},{revoked:true},{anonymous:true}]){const {ledger}=setup(opts);await reject(()=>issue(ledger),'OWNER_SESSION_INVALID')}});
test('GRANT03 no grant to project outside server authorisation',async()=>{const {ledger}=setup({denied:true});await reject(()=>issue(ledger),'PROJECT_NOT_ALLOWED')});
test('GRANT04 issue yields random opaque value but audit never logs it',async()=>{const {ledger}=setup();const a=await issue(ledger),b=await issue(ledger);assert.notEqual(a.token,b.token);assert.equal(a.writeAllowed,false);assert.equal(a.paidApiAllowed,false);assert.equal(JSON.stringify(ledger.auditSnapshot()).includes(a.token),false)});
test('GRANT05 scopes only three read tools',async()=>{const {ledger}=setup();const g=await issue(ledger);for(const tool of ['append_work_record','phone_tap','cad_draw','finance_create_transaction'])await reject(()=>ledger.execute({token:g.token,tool,requestId:'r1'}),'TOOL_NOT_ALLOWED')});
test('GRANT06 returns only permitted project for list_projects',async()=>{const {ledger}=setup();const g=await issue(ledger);const list=await ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'});assert.deepEqual(list,[{projectId:P,revision:71}]);assert.equal(JSON.stringify(list).includes('SECRET'),false)});
test('GRANT07 context redacts source and retains task status',async()=>{const {ledger}=setup();const g=await issue(ledger);const r=await ledger.execute({token:g.token,tool:'get_project_context',args:{projectId:P},requestId:'r1'});assert.deepEqual(r,{projectId:P,revision:71,tasks:[{id:'task1',key:'build',status:'IN_PROGRESS'}]})});
test('GRANT08 handoff redacts untrusted source',async()=>{const {ledger}=setup();const g=await issue(ledger);const r=await ledger.execute({token:g.token,tool:'get_project_handoff',args:{projectId:P},requestId:'r1'});assert.deepEqual(r,{projectId:P,revision:71,lastWorkKey:'latest',unfinishedCount:0})});
test('GRANT09 cross-project argument denied before any read',async()=>{const x=setup(),g=await issue(x.ledger);await reject(()=>x.ledger.execute({token:g.token,tool:'get_project_context',args:{projectId:'other'},requestId:'r1'}),'PROJECT_NOT_ALLOWED');assert.equal(x.metrics().calls,0)});
test('GRANT10 caller-invented authenticated flag cannot grant access',async()=>{const x=setup({unverified:true});await reject(()=>x.ledger.issue({projectId:P,mode:'MANUAL',authenticated:true,ownerApproved:true}),'OWNER_SESSION_INVALID')});
test('GRANT11 expiry prevents read',async()=>{const x=setup(),g=await issue(x.ledger,{ttlMs:1000});x.clock.value+=1001;await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'}),'GRANT_EXPIRED_OR_REVOKED')});
test('GRANT12 revocation takes effect before next read',async()=>{const x=setup(),g=await issue(x.ledger);await x.ledger.revoke({token:g.token});await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'}),'GRANT_EXPIRED_OR_REVOKED')});
test('GRANT13 wrong owner session cannot reuse grant',async()=>{let wrong=false;const x=setup();x.ledger.verifyOwnerSession=async()=>({verifiedByServer:true,subjectId:wrong?'owner-2':'owner-1',expiresAt:x.clock.value+30000});const g=await issue(x.ledger);wrong=true;await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'}),'OWNER_SESSION_INVALID')});
test('GRANT14 no read after call budget spent',async()=>{const x=setup(),g=await issue(x.ledger,{callLimit:1});await x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'});await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r2'}),'GRANT_EXPIRED_OR_REVOKED');assert.equal(x.metrics().calls,1)});
test('GRANT15 failed upstream call consumes budget, no automatic retry',async()=>{const x=setup({failRead:true}),g=await issue(x.ledger,{callLimit:1});await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'}),'READ_FAILED');await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r2'}),'GRANT_EXPIRED_OR_REVOKED');assert.equal(x.metrics().calls,1)});
test('GRANT16 no AUTO or paid/external tool execution',async()=>{const x=setup(),g=await issue(x.ledger);await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',mode:'AUTO',requestId:'r1'}),'AUTO_DISABLED');assert.equal(x.metrics().calls,0)});
test('GRANT17 invalid untrusted bearer is refused',async()=>{const x=setup();await reject(()=>x.ledger.execute({token:'totally-fake-token',tool:'list_projects',requestId:'r1'}),'GRANT_INVALID')});
test('GRANT18 malformed input schemas refused',async()=>{const x=setup(),g=await issue(x.ledger);await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',args:{projectId:P},requestId:'r1'}),'ARGUMENTS_INVALID');await reject(()=>x.ledger.execute({token:g.token,tool:'get_project_context',args:{projectId:P,foo:1},requestId:'r2'}),'PROJECT_NOT_ALLOWED')});
test('GRANT19 runtime declines mis-scoped results',async()=>{const x=setup({wrongProject:true}),g=await issue(x.ledger);await reject(()=>x.ledger.execute({token:g.token,tool:'get_project_context',args:{projectId:P},requestId:'r1'}),'CROSS_PROJECT_RESULT')});
test('GRANT20 no secrets in audit, no write actions ever routed',async()=>{const x=setup(),g=await issue(x.ledger);await x.ledger.execute({token:g.token,tool:'list_projects',requestId:'request-1'});const audit=JSON.stringify(x.ledger.auditSnapshot());assert.equal(audit.includes(g.token),false);assert.equal(audit.includes('SECRET'),false);assert.equal(x.ledger.tools().length,3)});
test('GRANT21 rejects invalid TTL and tier escalation',async()=>{const x=setup();await reject(()=>issue(x.ledger,{ttlMs:600000}),'INVALID_LIMIT');await reject(()=>issue(x.ledger,{riskTier:'L2'}),'APPROVAL_REQUIRED')});
test('GRANT22 stale owner session invalid at read time',async()=>{const x=setup(),g=await issue(x.ledger,{ttlMs:60000});x.ledger.verifyOwnerSession=async()=>({verifiedByServer:true,subjectId:'owner-1',expiresAt:x.clock.value-1});await reject(()=>x.ledger.execute({token:g.token,tool:'list_projects',requestId:'r1'}),'OWNER_SESSION_INVALID')});
