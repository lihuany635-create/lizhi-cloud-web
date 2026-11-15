// P5: deliberately SYNTHETIC end-to-end integration. Never real accounts,
// Supabase tables, ChatGPT OAuth, private Site or production deploy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Rating} from 'ts-fsrs';
import {createMcpHandler,MCP_VERSION} from '../../p3/mcp-server.mjs';
import {createCandidateBackend} from '../../p3/memory-backend.mjs';
import {createEnglishScheduler,createReviewCard,reviewEnglishCard}
  from '../../p2/fsrs-engine.mjs';
import {gradePractice,makeSkillEvidence} from '../../p2/practice-evidence.mjs';
import {createAdaptiveDailyPlan} from '../../p4/adaptive-planner.mjs';
import {listCurriculum,proposeSkillAdvancement} from '../../p4/curriculum.mjs';
import {buildLearningReport} from '../../p4/learning-report.mjs';
import {suggestErrorDrills,validateTeacherProposal} from '../../p4/error-drills.mjs';

const now=new Date('2026-11-15T08:00:00.000Z');
const owner='synthetic-owner',outsider='synthetic-outsider',session='english-practice-session-1';
const rid='p5-e2e-request-000001';
function setup(){
 const backend=createCandidateBackend({now:()=>now});
 backend.registerLearningSession({ownerId:owner,sessionId:session,confirmedByWebsite:true});
 const granted=new Set(['p5-approved-direct-card-01']);
 const handler=createMcpHandler({
   backend,
   authenticate:async({bearer})=>{
     if(!['owner-token','other-token'].includes(bearer))throw Error('revoked');
     const id=bearer==='owner-token'?owner:outsider;
     return {serverVerified:true,active:true,userId:id,verifiedClientId:'synthetic-chatgpt-client',
       scopes:['english:read','english:candidate','english:formal_write']};
   },
   verifyApproval:async({actor,action,requestId})=>({
     verified:actor.userId===owner&&action==='add_vocabulary'&&granted.has(requestId),
     ownerId:actor.userId,action,requestId
   }),
   allowedOrigins:['https://chatgpt.com']
 });
 let seq=0;
 async function call(name,args={},token='owner-token'){
   const response=await handler(new Request('https://mock.invalid/mcp',{
     method:'POST',
     headers:{
       origin:'https://chatgpt.com',
       authorization:'Bearer '+token,
       'content-type':'application/json',
       'mcp-protocol-version':MCP_VERSION
     },
     body:JSON.stringify({jsonrpc:'2.0',id:++seq,method:'tools/call',params:{
       name,arguments:args,
       _meta:{
         'io.modelcontextprotocol/protocolVersion':MCP_VERSION,
         'io.modelcontextprotocol/clientCapabilities':{}
       }
     }})
   }));
   assert.equal(response.status,200);
   const result=await response.json();
   return {isError:result.result.isError,data:JSON.parse(result.result.content[0].text)};
 }
 return {backend,call};
}

test('synthetic full loop: approved English chat -> candidate -> review -> formal card -> score -> FSRS -> adaptive plan/report',async()=>{
 const {backend,call}=setup();
 const synced=await call('sync_learning_session',{
   requestId:rid,sourceSessionId:session,
   candidates:[{term:'hungry',meaningZh:'餓的'}],
   errors:[{
     original:"I hasn't ate.",corrected:"I haven't eaten.",
     explanation:'Present perfect uses have + past participle'
   }]
 });
 assert.equal(synced.isError,false);
 assert.equal(synced.data.pendingAdded,1);
 assert.equal(synced.data.errorsAdded,1);
 const pending=await call('list_card_candidates');
 assert.equal(pending.data.items.length,1);
 assert.equal(pending.data.items[0].status,'pending');
 assert.equal(backend.inspectionSnapshot(owner).cards.length,0,
   'MCP candidate cannot silently become an official card');
 const beforeApproval=await call('add_vocabulary',{
   requestId:'not-approved-card-001',term:'hungry',meaningZh:'餓的'
 });
 assert.equal(beforeApproval.isError,true);
 assert.equal(beforeApproval.data.code,'EXPLICIT_APPROVAL_REQUIRED');
 const approved=await call('add_vocabulary',{
   requestId:'p5-approved-direct-card-01',term:'hungry',meaningZh:'餓的'
 });
 assert.equal(approved.isError,false);
 assert.equal(approved.data.created,true);
 const replay=await call('add_vocabulary',{
   requestId:'p5-approved-direct-card-01',term:'hungry',meaningZh:'餓的'
 });
 assert.equal(replay.data.replay,true);
 assert.equal(backend.inspectionSnapshot(owner).cards.length,1);
 const scheduler=await createEnglishScheduler();
 const card=createReviewCard(scheduler,{cardId:'english-card-0001',now});
 const practice=gradePractice({mode:'spelling',expected:'hungry',answer:' Hungry.  '});
 assert.equal(practice.correct,true);
 const review=reviewEnglishCard({scheduler,card,now,rating:Rating.Good,
   requestId:'p5-review-request-00001'});
 const evidence=makeSkillEvidence({
   ownerId:owner,activityId:'p5-spelling-0001',mode:'spelling',skill:'vocabulary',
   observedAt:now,gradeResult:practice
 });
 assert.equal(evidence.state,'observed');
 const error=[{ownerId:owner,id:'p5-grammar-error-1',skill:'grammar',
   category:'present-perfect',at:now.toISOString()}];
 const lessons=listCurriculum({ownerId:owner});
 const planDate=new Date(Math.max(now.getTime()+1000,review.card.dueAt.getTime()+1000));
 const plan=createAdaptiveDailyPlan({
   ownerId:owner,asOf:planDate,goalMinutes:20,
   evidence:[evidence],errors:error,
   reviewCards:[{ownerId:owner,cardId:card.cardId,dueAt:review.card.dueAt.toISOString()}],
   lessons,completedLessonIds:[],
 });
 assert.equal(plan.status,'suggested-not-completed');
 assert.equal(plan.dueCount,1);
 assert.equal(plan.allocatedMinutes,20);
 assert.ok(plan.tasks.some(t=>t.type==='review'));
 assert.equal(plan.officialCefrLevel,null);
 const drills=suggestErrorDrills({ownerId:owner,errors:error,
   asOf:new Date(now.getTime()+86400000).toISOString()});
 assert.equal(drills[0].category,'present-perfect');
 assert.deepEqual(drills[0].evidenceRefs,['p5-grammar-error-1']);
 const report=buildLearningReport({
   ownerId:owner,asOf:new Date(now.getTime()+86400000),
   evidence:[evidence],errors:error,
   practiceEvents:[{ownerId:owner,eventId:'p5-practice-event-1',mode:'spelling',
     recordedAt:now.toISOString(),graderType:'objective',correct:true}],
   completedSessions:[{ownerId:owner,sessionId:'synthetic-session-1',status:'completed',
     finishedAt:now.toISOString(),actualMinutes:10}]
 });
 assert.equal(report.trackedPracticeEvents,1);
 assert.equal(report.objectiveAccuracy,1);
 assert.equal(report.recordedMinutes,10);
 assert.equal(report.skills.speaking.state,'not-tested');
 assert.equal(report.skills.speaking.cefrLevel,null);
 assert.equal(report.provenance.practiceEventIds[0],'p5-practice-event-1');
 assert.equal(report.missedDayPenalty,0);
 const noPromotion=proposeSkillAdvancement({
   ownerId:owner,skill:'vocabulary',currentLevel:'A0',evidence:[evidence],
   verifiedAssessments:[]
 });
 assert.equal(noPromotion.status,'insufficient-evidence');
 assert.equal(noPromotion.autoPromoted,false);
});

test('cross-owner calls and unapproved conversations cannot enter learning history',async()=>{
 const {backend,call}=setup();
 const other=await call('sync_learning_session',{
   requestId:'p5-other-owner-00001',sourceSessionId:session,
   candidates:[{term:'secret',meaningZh:'秘密'}]
 },'other-token');
 assert.equal(other.isError,true);
 assert.equal(other.data.code,'LEARNING_SESSION_NOT_AUTHORIZED');
 const outside=await call('create_card_candidates',{
   requestId:'p5-outside-chat-00001',sourceSessionId:'unlisted-chat-00001',
   candidates:[{term:'anything',meaningZh:'任何'}]
 });
 assert.equal(outside.isError,true);
 assert.equal(outside.data.code,'LEARNING_SESSION_NOT_AUTHORIZED');
 assert.equal(backend.inspectionSnapshot(owner).candidates.length,0);
 assert.equal(backend.inspectionSnapshot(outsider).candidates.length,0);
});

test('tampered review and AI model proposal cannot grant level or modify private history',async()=>{
 const result=gradePractice({mode:'sentence',expected:'I am hungry.',
   answer:'I hungry'});
 assert.equal(result.correct,null);
 const evidence=makeSkillEvidence({
   ownerId:owner,activityId:'p5-writing-0001',mode:'sentence',skill:'writing',
   observedAt:now,gradeResult:result
 });
 assert.equal(evidence.state,'unassessed');
 assert.throws(()=>validateTeacherProposal({
   ownerId:owner,allowedEvidenceIds:['p5-evidence-001'],
   proposal:{ownerId:owner,skill:'writing',evidenceRefs:['p5-evidence-001'],
     explanation:'Proposed exercise',autoPromote:true,officialCefrLevel:'C2'}
 }),/(UNAUTHORIZED_CEFR_CLAIM|UNAUTHORIZED_ACTION)/);
 const blank=buildLearningReport({ownerId:owner,asOf:now});
 assert.equal(blank.objectiveAccuracy,null);
 assert.equal(blank.skills.speaking.state,'not-tested');
});

test('adaptive planner fails closed if another owner is injected',()=>{
 assert.throws(()=>createAdaptiveDailyPlan({
   ownerId:owner,asOf:now,
   reviewCards:[{ownerId:outsider,cardId:'secret-card',dueAt:now.toISOString()}]
 }),/OWNER_SCOPE_MISMATCH/);
});
