// P6 client-side demonstration only. No credentials, cloud DB or automatic AI scoring.
import { DEMO_PRACTICE_BANK } from '../p6/sample-bank.mjs';
import { gradeExercise, proposeFeedback, MODES, RUBRIC } from '../p6/practice-engine.mjs';
import { DIAGNOSTIC_BANK, createDiagnostic, recordDiagnosticAnswer,
  diagnosticSummary } from '../p6/diagnostic-engine.mjs';
const root=document.getElementById('app');
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skillNames={vocabulary:'單字',grammar:'文法',reading:'閱讀',writing:'寫作',listening:'聽力',speaking:'口說'};
const states={'observed-sample':'示範樣本','not-assessed':'尚未評估'};
const names={flip:'翻卡',choice:'選擇題',spelling:'拼字',fill:'填空',
  translation:'翻譯',listening:'聽力',sentence:'造句'};
let page='practice',index=0,diagnosticPos=0;
let localAttempts=[],diag=createDiagnostic({ownerId:'local-p6-demo',
 sessionId:'diagnostic-demo-00001',startedAt:new Date()});
let current=null,proposal=null,viewResult=null,spoken=false,activeTheme='light';
const q=()=>DEMO_PRACTICE_BANK[index];
const d=()=>DIAGNOSTIC_BANK[diagnosticPos];
const btn=(label,action,extra='')=>'<button type="button" class="button '+extra+'" '+action+'>'+label+'</button>';
function header(){
 return '<header class="p6-header"><div class="p6-logo">E · 英文學習教室</div>'+
  '<span class="pill">網站體驗版 · 尚未連接雲端</span></header>'+
  '<div class="notice">本頁為經主站登入後的英文練習體驗版。使用示範題目；未啟用正式學習資料同步、MCP 或 AI 自動評分，重整後作答會清空。</div>'+
  '<nav class="p6-switch" aria-label="學習模式">'+
  btn('七題型練習','data-page="practice"',page==='practice'?'active':'')+
  btn('初始程度測驗','data-page="diagnostic"',page==='diagnostic'?'active':'')+
  btn(activeTheme==='light'?'深色模式':'淺色模式','data-theme="1"')+'</nav>';
}
function result(){
 if(!viewResult)return '';
 const text=viewResult.message??'';
 return '<div class="p6-result" role="status"><strong>'+h(viewResult.title)+'</strong>'+h(text)+'</div>';
}
function questionForm(exercise,diagnostic=false){
 const prompt='<div class="p6-question">'+h(exercise.prompt)+'</div>';
 const m=exercise.mode;
 if(m==='choice')return prompt+'<div class="p6-options">'+exercise.choices.map(c=>
    btn(h(c),'data-choice="'+h(c)+'"','')).join('')+'</div>';
 if(m==='flip')return prompt+'<p class="p6-note">先想意思，再選擇自己記得的程度。</p>'+
    '<div class="actions">'+[1,2,3,4].map((n,i)=>btn(['忘記','困難','記得','很簡單'][i],
    'data-flip="'+n+'"')).join('')+'</div>';
 if(m==='listening')return prompt+
   btn(spoken?'重播英語':'播放英語','data-play="1"')+
   '<p class="p6-note">本機語音只能示範；沒有受信任的音訊驗證，因此不計正式聽力成績。</p>'+
   '<form class="p6-form" id="'+(diagnostic?'diagnostic-answer':'practice-answer')+'">'+
   '<input name="answer" class="input" required maxlength="500" autocomplete="off" placeholder="輸入你聽到的英文">'+
   '<button class="button primary" type="submit">送出聽寫</button></form>';
 const element=m==='sentence'?
   '<textarea name="answer" class="input" rows="4" required maxlength="2000" placeholder="Write your own sentence"></textarea>':
   '<input name="answer" class="input" required maxlength="500" autocomplete="off" placeholder="輸入你的英文答案">';
 return prompt+'<form class="p6-form" id="'+(diagnostic?'diagnostic-answer':'practice-answer')+'">'+
   element+'<button class="button primary" type="submit">送出作答</button></form>';
}
function practice(){
 const exercise=q();
 const modes='<div class="p6-mini-list">'+DEMO_PRACTICE_BANK.map((x,i)=>btn(names[x.mode],
   'data-mode-index="'+i+'"',i===index?'active':'')).join('')+'</div>';
 return '<h1 class="view-title">七種英文練習</h1><p class="view-subtitle">示範題庫與基礎判分，不代表真實課程或 CEFR 認證。</p>'+
 '<section class="card"><div class="eyebrow">PRACTICE · '+(index+1)+' / '+MODES.length+'</div>'+modes+
 '<div class="gap"></div>'+(!current?questionForm(exercise):result()+
 (current.status==='needs-human-review'?sentenceReview(exercise):'')+
 btn('換下一種練習','data-next="1"','primary'))+
 '<div class="gap"></div><p class="p6-note">已完成 '+localAttempts.length+' 次示範作答；沒有寫入正式資料庫。</p></section>';
}
function sentenceReview(exercise){
 if(!proposal)return '';
 return '<div class="notice"><strong>僅供練習的固定參考句（不是 AI 實際分析）：</strong>'+
  h(exercise.explanation||'Please write a clear sentence using the target word.')+'</div>'+
 '<p class="p6-note">請自行檢查四項要點。此頁產生的自評不會當成正式已驗證的語言能力。</p>'+
 '<form id="self-review"><div class="p6-rubric">'+RUBRIC.map((r,i)=>
 '<label><input type="checkbox" name="r'+i+'"> '+h(r.criterion)+'</label>').join('')+
 '</div><button class="button primary" type="submit">記錄示範自評</button></form>';
}
function diagnostic(){
 const summary=diagnosticSummary(diag);
 if(diagnosticPos>=DIAGNOSTIC_BANK.length){
   return '<h1 class="view-title">測驗結果（非官方）</h1><section class="card"><h2>示範作答 '+summary.answered+' / '+summary.total+'</h2>'+
     '<div class="list">'+Object.entries(summary.skills).map(([skill,value])=>
     '<div class="list-row"><strong>'+h(skillNames[skill]||skill)+'</strong><span>'+h(states[value.state]||value.state)+
     ' · '+value.reviewed+' 已評分 / '+value.pendingReview+' 待覆核</span></div>').join('')+'</div>'+
     '<div class="gap"></div><div class="notice">這些題目不足以認證 CEFR 等級；口說及未經驗證的聽力不會自動給分。</div>'+
     btn('重新開始示範測驗','data-restart="1"','primary')+'</section>';
 }
 const ex=d();
 return '<h1 class="view-title">初始程度測驗</h1><p class="view-subtitle">A0～C2 題目參考分級，非你的正式英文程度。</p>'+
  '<section class="card"><div class="eyebrow">'+(diagnosticPos+1)+' / '+DIAGNOSTIC_BANK.length+
  ' · 題目參考級別 '+h(ex.level)+' · '+h(ex.skill)+'</div>'+
  '<div class="gap"></div>'+(!current?questionForm(ex,true):result())+
  '<div class="gap"></div>'+btn(current?'下一題':'略過這題','data-diag-next="1"')+'</section>';
}
function render(){
 document.documentElement.dataset.theme=activeTheme;
 root.innerHTML='<div class="p6-shell">'+header()+'<main>'+
 (page==='practice'?practice():diagnostic())+
 '</main><footer class="p6-footer">英文教室體驗版 · 已透過雲端庫入口登入 · 尚無 FSRS 雲端保存及 ChatGPT MCP</footer></div>';
}
function recordPractice(response,extra={}){
 try{
   const event=gradeExercise({exercise:q(),ownerId:'local-p6-demo',
     attemptId:'attempt-'+String(localAttempts.length+1).padStart(12,'0'),
     response,createdAt:new Date(),...extra});
   current=event;localAttempts=[...localAttempts,event];
   if(event.status==='needs-human-review'){
     proposal=proposeFeedback({draft:event,reviewerType:'template',
       comment:'Static demonstration reference only; no AI service was contacted.',
       rubricChecks:[null,null,null,null]});
     viewResult={title:'請自行覆核',message:'造句先保存為未評分草稿，需確認用字與文法。'};
   } else if(event.status==='objective-graded'){
     viewResult={title:event.correct?'正確':'還可以再練習',
       message:event.explanation||'本題以預先設定的答案進行比對。'};
   } else {
     viewResult={title:'已記錄示範操作',message:event.status==='audio-unverified'?'音訊驗證尚未完成，因此不計入聽力能力成績。':(event.note||'此項不計入正式技能成績。')};
   }
 }catch(e){viewResult={title:'尚未記錄',message:e.message};}
 render();
}
function recordDiagnostic(response){
 try{
   const ex=d();
   diag=recordDiagnosticAnswer({session:diag,questionId:ex.id,response,
     attemptId:'diag-attempt-'+String(diagnosticPos+1).padStart(10,'0'),
     createdAt:new Date()});
   const row=diag.attempts.at(-1);
   current=row;
   viewResult={title:row.status==='objective-graded'?
     (row.correct?'答對了':'還可以再練習'):'未納入已驗證能力分數',
     message:'所有初始測驗結果僅供學習規劃，不會認證 CEFR 等級。'};
 }catch(e){viewResult={title:'未記錄',message:e.message};}
 render();
}
root.addEventListener('click',e=>{
 const t=e.target.closest('button');
 if(!t)return;
 if(t.dataset.page){page=t.dataset.page;current=null;viewResult=null;render();return;}
 if(t.dataset.theme){activeTheme=activeTheme==='light'?'dark':'light';render();return;}
 if(t.dataset.modeIndex!==undefined){index=Number(t.dataset.modeIndex);
   current=null;proposal=null;viewResult=null;spoken=false;render();return;}
 if(t.dataset.next){index=(index+1)%MODES.length;current=null;proposal=null;
   viewResult=null;spoken=false;render();return;}
 if(t.dataset.flip){recordPractice('',{recalledRating:Number(t.dataset.flip)});return;}
 if(t.dataset.choice!==undefined){
   if(page==='practice')recordPractice(t.dataset.choice);
   else recordDiagnostic(t.dataset.choice);
   return;
 }
 if(t.dataset.play){
   if(!('speechSynthesis' in window)){viewResult={title:'無法播放',message:'本瀏覽器不支援語音播放。'};render();return;}
   const utter=new SpeechSynthesisUtterance((page==='practice'?q():d()).audioText.slice(3));
   utter.lang='en-US';
   utter.onend=()=>{spoken=true};
   window.speechSynthesis.speak(utter);return;
 }
 if(t.dataset.diagNext){
   diagnosticPos++;
   current=null;viewResult=null;render();return;
 }
 if(t.dataset.restart){
   diag=createDiagnostic({ownerId:'local-p6-demo',sessionId:'diagnostic-demo-00001',startedAt:new Date()});
   diagnosticPos=0;current=null;viewResult=null;render();return;
 }
});
root.addEventListener('submit',e=>{
 const form=e.target;
 if(!['practice-answer','diagnostic-answer','self-review'].includes(form.id))return;
 e.preventDefault();
 if(form.id==='self-review'){
   const checks=RUBRIC.map((_,i)=>new FormData(form).get('r'+i)==='on');
   viewResult={title:'示範自評已記錄',message:'你勾選 '+checks.filter(Boolean).length+'/4 項。這不是由後端驗證的正式覆核。'};
   current={...current,status:'pending-server-verification',evidenceStatus:'unassessed'};
   return render();
 }
 const response=String(new FormData(form).get('answer')||'');
 if(page==='practice')recordPractice(response);
 else recordDiagnostic(response);
});
render();

// The protected portal sends a logout message before its session is cleared.
window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='lizhi-account-logout'){root.replaceChildren();document.body.textContent='已登出，請回到立之雲端庫重新登入。';}});
