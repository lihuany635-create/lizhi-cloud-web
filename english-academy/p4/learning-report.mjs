// P4 evidence-based weekly summaries. Never infer official CEFR or fabricate
// missing activity. Time windows use UTC timestamps for repeatable tests.
import {analyzeSkills,SKILLS} from './adaptive-planner.mjs';
const DAY=86400000;
const at=value=>value instanceof Date?value.getTime():Date.parse(value);
const stamp=x=>new Date(x).toISOString().slice(0,10);
const knownMode=new Set(['flip','choice','spelling','fill','translation','listening','sentence']);
export function buildLearningReport({
 ownerId,asOf,practiceEvents=[],evidence=[],errors=[],completedSessions=[],
 plannedGoals=[],previousReport=null
}={}){
 if(typeof ownerId!=='string'||!ownerId.trim()||!Number.isFinite(at(asOf)))
   throw new TypeError('INVALID_REPORT_CONTEXT');
 const now=at(asOf),start=now-7*DAY;
 for(const [name,rows] of Object.entries({practiceEvents,evidence,errors,completedSessions,plannedGoals})){
   if(!Array.isArray(rows)||rows.length>5000)throw new TypeError('INVALID_REPORT_DATA:'+name);
   if(rows.some(x=>x?.ownerId!==ownerId))throw new Error('OWNER_SCOPE_MISMATCH:'+name);
 }
 const observed=analyzeSkills({ownerId,evidence,errors,asOf});
 const unique=new Set(),events=[];
 for(const row of practiceEvents){
   if(typeof row.eventId!=='string'||!row.eventId.trim()||!knownMode.has(row.mode)||
     !Number.isFinite(at(row.recordedAt))||at(row.recordedAt)>now)
     throw new TypeError('INVALID_PRACTICE_EVENT');
   if(unique.has(row.eventId))continue;
   unique.add(row.eventId);
   if(at(row.recordedAt)<start)continue;
   events.push(row);
 }
 const days=new Set(events.map(row=>stamp(row.recordedAt)));
 const attempts=events.length;
 const objective=events.filter(x=>x.graderType==='objective'&&typeof x.correct==='boolean');
 const reviewed=events.filter(x=>x.graderType==='learner_self');
 const correct=objective.filter(x=>x.correct).length;
 const sessions=completedSessions.filter(s=>{
   if(s.status!=='completed'||!Number.isFinite(at(s.finishedAt))||
     at(s.finishedAt)>now)return false;
   return at(s.finishedAt)>=start;
 });
 const goals=plannedGoals.filter(g=>Number.isFinite(at(g.forDate))&&at(g.forDate)<=now&&at(g.forDate)>=start);
 const minutes=sessions.reduce((n,s)=>{
   if(!Number.isFinite(s.actualMinutes)||s.actualMinutes<0||s.actualMinutes>360)
     throw new TypeError('INVALID_SESSION_DURATION');
   return n+s.actualMinutes;
 },0);
 const breakdown=Object.fromEntries(SKILLS.map(skill=>[skill,{
   observations:observed[skill].observations,
   performance:observed[skill].correctRate,
   evidenceRefs:observed[skill].weaknessEvidenceIds.slice(0,5),
   cefrLevel:null,
   state:observed[skill].state
 }]));
 const prior=previousReport?.ownerId===ownerId&&previousReport?.objectiveAccuracy!==null &&
   typeof previousReport?.objectiveAccuracy==='number'?previousReport.objectiveAccuracy:null;
 const accuracy=objective.length?Number((correct/objective.length).toFixed(3)):null;
 const change=prior!==null&&accuracy!==null?
   Number((accuracy-prior).toFixed(3)):null;
 return {
   ownerId,rangeStart:new Date(start).toISOString(),rangeEnd:new Date(now).toISOString(),
   trackedPracticeEvents:attempts,objectiveEvaluated:objective.length,
   objectiveAccuracy:accuracy,objectiveAccuracyChange:change,
   selfRatings:reviewed.length,activeDays:days.size,
   completedSessions:sessions.length,recordedMinutes:minutes,
   plannedDays:goals.length,
   missedDayPenalty:0,missingDaysNotPenalized:true,
   skills:breakdown,
   cautions:[
     '只有附帶事件編號的練習與可信後端保存的活動才可列入實績',
     '未評測能力一律不給 CEFR 等級',
     '造句主觀自評不計入客觀題正確率'
   ],
   provenance:{practiceEventIds:events.map(x=>x.eventId),
     sessionIds:sessions.map(x=>x.sessionId),
     assessmentDataSource:'verified-learning-events-only'},
   version:'p4-report-v1'
 };
}
