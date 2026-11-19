import {createAdaptiveDailyPlan,SKILLS} from '../adaptive-planner.mjs';
import {listCurriculum,buildSkillRoadmap} from '../curriculum.mjs';
import {buildLearningReport} from '../learning-report.mjs';
import {suggestErrorDrills} from '../error-drills.mjs';

const app=document.getElementById('app');
const OWNER='anonymous-p4-demo';
const AS_OF='2026-11-15T08:00:00.000Z';
const TABS={today:'今日學習',roadmap:'課程地圖',report:'學習報告',errors:'錯題補強'};
const ZH={vocabulary:'單字',grammar:'文法',reading:'閱讀',writing:'寫作',listening:'聽力',speaking:'口說'};
const demoEvidence=[
 {ownerId:OWNER,activityId:'demo-gram-1',skill:'grammar',state:'observed',score:0,weight:1,observedAt:'2026-11-12T08:00:00Z'},
 {ownerId:OWNER,activityId:'demo-gram-2',skill:'grammar',state:'observed',score:0.3,weight:1,observedAt:'2026-11-13T08:00:00Z'},
 {ownerId:OWNER,activityId:'demo-gram-3',skill:'grammar',state:'observed',score:0.5,weight:1,observedAt:'2026-11-14T08:00:00Z'},
 {ownerId:OWNER,activityId:'demo-vocab-1',skill:'vocabulary',state:'observed',score:1,weight:1,observedAt:'2026-11-12T08:00:00Z'},
 {ownerId:OWNER,activityId:'demo-vocab-2',skill:'vocabulary',state:'observed',score:0.9,weight:1,observedAt:'2026-11-13T08:00:00Z'},
 {ownerId:OWNER,activityId:'demo-vocab-3',skill:'vocabulary',state:'observed',score:1,weight:1,observedAt:'2026-11-14T08:00:00Z'}
];
const demoErrors=[
 {ownerId:OWNER,id:'demo-error-1',skill:'grammar',category:'present-perfect',at:'2026-11-14T08:00:00Z'},
 {ownerId:OWNER,id:'demo-error-2',skill:'grammar',category:'present-perfect',at:'2026-11-13T08:00:00Z'},
 {ownerId:OWNER,id:'demo-error-3',skill:'grammar',category:'past-participle',at:'2026-11-12T08:00:00Z'}
];
const demoCards=[
 {ownerId:OWNER,cardId:'review-hungry',dueAt:'2026-11-14T08:00:00Z'},
 {ownerId:OWNER,cardId:'review-rice',dueAt:'2026-11-15T00:00:00Z'},
 {ownerId:OWNER,cardId:'review-eaten',dueAt:'2026-11-20T08:00:00Z'}
];
const demoEvents=[
 {ownerId:OWNER,eventId:'demo-practice-1',cardId:'review-hungry',mode:'choice',correct:true,graderType:'objective',recordedAt:'2026-11-12T08:00:00Z'},
 {ownerId:OWNER,eventId:'demo-practice-2',cardId:'review-rice',mode:'fill',correct:false,graderType:'objective',recordedAt:'2026-11-13T08:00:00Z'},
 {ownerId:OWNER,eventId:'demo-practice-3',cardId:'review-hungry',mode:'sentence',correct:null,graderType:'learner_self',recordedAt:'2026-11-14T08:00:00Z'}
];
const sessions=[{ownerId:OWNER,sessionId:'demo-session',status:'completed',finishedAt:'2026-11-14T08:00:00Z',actualMinutes:12}];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={tab:'today',goalMinutes:20,skillPreference:null,completedLessonIds:[],theme:'light',chosen:null,notice:''};
function compute(){
 const lessons=listCurriculum({ownerId:OWNER,completedIds:state.completedLessonIds});
 const plan=createAdaptiveDailyPlan({ownerId:OWNER,asOf:AS_OF,goalMinutes:state.goalMinutes,
  skillPreference:state.skillPreference,evidence:demoEvidence,errors:demoErrors,reviewCards:demoCards,
  lastSessionAt:'2026-11-14T08:00:00Z',lessons,completedLessonIds:state.completedLessonIds});
 const roadmap=buildSkillRoadmap({ownerId:OWNER,completedIds:state.completedLessonIds});
 const report=buildLearningReport({ownerId:OWNER,asOf:AS_OF,evidence:demoEvidence,errors:demoErrors,
  practiceEvents:demoEvents,completedSessions:sessions});
 const drills=suggestErrorDrills({ownerId:OWNER,asOf:AS_OF,errors:demoErrors});
 return {lessons,plan,roadmap,report,drills};
}
function buttonTab(){
 return '<nav class="p4-nav" aria-label="P4 學習導覽">'+Object.entries(TABS).map(([key,label])=>
  '<button class="button '+(state.tab===key?'active':'')+'" type="button" data-tab="'+key+
  '" aria-current="'+(state.tab===key?'page':'false')+'">'+label+'</button>').join('')+'</nav>';
}
function today(data){
 const p=data.plan;
 const pref='<label for="focus-skill" class="p4-label">想先加強的能力（可手動選擇）</label>'+
  '<select class="input p4-select" id="focus-skill">'+
  '<option value="auto"'+(!state.skillPreference?' selected':'')+'>依學習證據自動建議</option>'+
  SKILLS.map(s=>'<option value="'+s+'"'+(state.skillPreference===s?' selected':'')+'>'+ZH[s]+'</option>').join('')+'</select>';
 return '<div class="p4-grid"><section class="card"><div class="eyebrow">YOUR DAILY STUDY</div>'+
 '<h2 style="font-size:24px;margin:8px 0">今日學習計畫</h2>'+
 '<p class="muted">建議加強：<strong>'+ZH[p.focusSkill]+'</strong> · '+
  (p.focusBasis==='observed-weakness'?'依實際錯題證據':p.focusBasis==='user-preference'?'依手動選擇':'初始探索')+'</p>'+
 '<div class="stats"><div><div class="value">'+p.goalMinutes+'</div><div class="label">每日目標（分鐘）</div></div>'+
 '<div><div class="value">'+p.dueCount+'</div><div class="label">FSRS 到期示範卡</div></div>'+
 '<div><div class="value">'+p.tasks.length+'</div><div class="label">建議任務</div></div></div>'+
 '<div class="gap"></div><div class="actions"><button class="button" data-goal="-5">目標 −5 分</button>'+
 '<button class="button" data-goal="5">目標 ＋5 分</button></div>'+
 '<div class="gap"></div>'+pref+
 '<div class="gap"></div><h2>每日任務建議</h2>'+
 p.tasks.map((task,i)=>'<article class="p4-outline"><div class="flex-row"><h3>'+(i+1)+'. '+
  (task.type==='review'?'到期單字複習':task.type==='lesson'?'課程學習':task.type==='light-conversation'?'輕量對話':'能力練習')+'</h3>'+
  '<span class="pill">'+task.minutes+' 分鐘</span></div>'+
  (task.lessonId?'<p><strong>'+esc(data.lessons.find(l=>l.id===task.lessonId)?.title||task.lessonId)+'</strong></p>':'')+
  '<p class="muted small">'+esc(task.reason)+'</p>'+
  (task.evidenceRefs?.length?'<div class="p4-tags">'+task.evidenceRefs.map(id=>'<span class="pill">'+esc(id)+'</span>').join('')+'</div>':'')+
  (task.lessonId?'<div class="gap"></div><button class="button small-button" data-complete="'+esc(task.lessonId)+'">模擬完成這節課</button>':'')+
 '</article>').join('')+'</section>'+
 '<aside class="card"><h2>推薦的依據</h2><p class="muted">只根據練習證據與到期排程提出建議，不會自動更改學習等級。</p>'+
 '<div class="notice">所有數值都來自本頁固定的匿名示範資料；尚未連接你的正式學習紀錄。</div>'+
 '<div class="gap"></div><button class="button" data-tab="errors">查看錯題補強</button></aside></div>';
}
function roadmap(data){
 return '<section class="card"><h2>六項能力 · 各自進階</h2>'+
 '<p class="muted">CEFR 目前均為尚未正式評估。課程完成也不等於程度認證。</p>'+
 '<div class="stage-grid">'+SKILLS.map(skill=>'<div class="stage"><span>'+ZH[skill]+'</span><strong>—</strong>'+
 '<span>課程 '+data.roadmap[skill].completedLessons+' / '+data.roadmap[skill].totalLessons+'</span></div>').join('')+'</div></section>'+
 '<div class="gap"></div><section class="card"><h2>A0～C2 課程地圖</h2><div class="list">'+
  data.lessons.map(l=>'<div class="list-row"><div><span class="pill">'+l.level+'</span> <strong>'+
  esc(l.title)+'</strong><p>'+l.skills.map(s=>ZH[s]).join('、')+' · '+l.minutes+' 分鐘</p></div>'+
  '<span class="pill">'+(l.status==='completed'?'示範完成':'尚未完成')+'</span></div>').join('')+'</div></section>';
}
function reportView(data){
 const r=data.report;
 return '<div class="stats"><div class="card"><div class="value">'+r.trackedPracticeEvents+'</div><div class="label">示範練習紀錄</div></div>'+
 '<div class="card"><div class="value">'+(r.objectiveAccuracy===null?'—':Math.round(r.objectiveAccuracy*100)+'%')+'</div><div class="label">客觀題正確率</div></div>'+
 '<div class="card"><div class="value">'+r.recordedMinutes+'</div><div class="label">已紀錄學習分鐘</div></div></div>'+
 '<div class="gap"></div><section class="card"><h2>分能力觀察（非正式認證）</h2>'+
 SKILLS.map(s=>'<div class="metric"><div class="flex-row"><strong>'+ZH[s]+'</strong>'+
 '<span class="muted small">'+(r.skills[s].performance===null?'尚未測驗':
 '示範證據 '+r.skills[s].observations+' 筆')+'</span></div>'+
 '<div class="bar"><div style="width:'+(r.skills[s].performance===null?0:Math.round(r.skills[s].performance*100))+'%"></div></div></div>').join('')+
 '<div class="notice">未練習日不扣分。自由造句自評不計入客觀題正確率；沒有測驗不能推定 CEFR 等級。</div></section>';
}
function errorsView(data){
 return '<section class="card"><h2>根據錯誤證據補強</h2>'+
 '<p class="muted">模板練習用於示範補強規則，不直接讀取、公開原始私人聊天內容。</p>'+
 data.drills.map(d=>'<article class="p4-outline"><span class="pill">'+ZH[d.skill]+'</span>'+
 '<h3>'+esc(d.title)+'</h3><p>'+esc(d.question)+'</p>'+
 (d.options.length?'<div class="p4-options">'+d.options.map((o,i)=>
  '<button class="button small-button" data-answer="'+d.category+'" data-choice="'+i+'">'+esc(o)+'</button>').join('')+'</div>':
 '<p class="muted small">這一題需要人工或 AI 覆核，不自動判定正確率。</p>')+
 '<div class="gap"></div><div class="muted small">推薦來源：'+d.evidenceRefs.map(esc).join('、')+'</div>'+
 (state.chosen?.category===d.category?'<div class="notice" role="status">'+
 (state.chosen.index===d.correctIndex?'回答正確。':'可再練習。')+esc(d.explanation)+'</div>':'')+
 '</article>').join('')+'</section>';
}
function render(){
 document.documentElement.dataset.theme=state.theme;
 const data=compute();
 const screens={today,roadmap,report:reportView,errors:errorsView};
 app.innerHTML='<div class="app-shell"><header class="header"><div class="brand"><div class="brand-mark">E</div>'+
 '<div><strong>立之英文學習教室</strong><span class="small">P4 ADAPTIVE LEARNING</span></div></div>'+
 '<button class="button small-button" data-theme="1">'+(state.theme==='light'?'深色模式':'淺色模式')+'</button></header>'+
 '<div class="demo-banner p4-banner"><strong>隔離展示候選版 · 無正式帳號資料</strong>'+
 '<span>數據為固定匿名示範資料，不是你的測驗成績</span></div>'+
 buttonTab()+'<main><h1 class="view-title">'+TABS[state.tab]+'</h1>'+
 '<p class="view-subtitle">依可追溯學習證據推薦，不會自動升級或宣稱正式 CEFR。</p>'+
 (state.notice?'<div class="notice" role="status">'+esc(state.notice)+'</div><div class="gap"></div>':'')+
 screens[state.tab](data)+'</main><footer class="footer">P4 規則候選 · 沒有 AI API 呼叫、Google 登入或正式資料庫寫入</footer></div>';
}
app.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.tab){state.tab=b.dataset.tab;state.notice='';state.chosen=null;render();return;}
 if(b.dataset.goal){state.goalMinutes=Math.max(5,Math.min(90,state.goalMinutes+Number(b.dataset.goal)));render();return;}
 if(b.dataset.complete){state.completedLessonIds=[...new Set([...state.completedLessonIds,b.dataset.complete])];
  state.notice='已在本頁展示資料中標記課程完成；不會同步至正式學習紀錄';render();return;}
 if(b.dataset.theme){state.theme=state.theme==='light'?'dark':'light';render();return;}
 if(b.dataset.answer){state.chosen={category:b.dataset.answer,index:Number(b.dataset.choice)};render();return;}
});
app.addEventListener('change',e=>{
 if(e.target.id==='focus-skill'){state.skillPreference=e.target.value==='auto'?null:e.target.value;render();}
});
render();
