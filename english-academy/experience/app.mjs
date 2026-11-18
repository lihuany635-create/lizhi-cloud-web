// P6 client-side demonstration only. No credentials, cloud DB or automatic AI scoring.
import { DEMO_PRACTICE_BANK } from '../p6/sample-bank.mjs';
import { gradeExercise, proposeFeedback, MODES, RUBRIC } from '../p6/practice-engine.mjs';
import { DIAGNOSTIC_BANK, createDiagnostic, recordDiagnosticAnswer,
  diagnosticSummary } from '../p6/diagnostic-engine.mjs';
const root=document.getElementById('app');
const topbar=document.getElementById('english-topbar');
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skillNames={vocabulary:'單字',grammar:'文法',reading:'閱讀',writing:'寫作',listening:'聽力',speaking:'口說'};
const states={'observed-sample':'示範樣本','not-assessed':'尚未評估'};
const names={flip:'翻卡',choice:'選擇題',spelling:'拼字',fill:'填空',
  translation:'翻譯',listening:'聽力',sentence:'造句'};
const englishNames={flip:'Flashcard',choice:'Multiple choice',spelling:'Spelling',fill:'Fill in the blank',
  translation:'Translation',listening:'Listening',sentence:'Sentence'};
const svg=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const icons={
 moon:svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
 sun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
 info:svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
 check:svg('<path d="M20 6 9 17l-5-5"/>'),
 retry:svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
 note:svg('<path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="9"/>'),
 play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>'
};
let page='practice',index=0,diagnosticPos=0;
let localAttempts=[],diag=createDiagnostic({ownerId:'local-p6-demo',
 sessionId:'diagnostic-demo-00001',startedAt:new Date()});
let current=null,proposal=null,viewResult=null,spoken=false,activeTheme='light';
const q=()=>DEMO_PRACTICE_BANK[index];
const d=()=>DIAGNOSTIC_BANK[diagnosticPos];
const btn=(label,action,extra='')=>'<button type="button" class="button '+extra+'" '+action+'>'+label+'</button>';

function header(){
 return '<div class="p6-shell"><div class="p6-header"><div class="p6-brand"><div class="p6-mark" aria-hidden="true">E</div>'+
  '<div><div class="p6-logo">英文學習教室</div><div class="p6-tagline">立之雲端庫 · English Academy</div></div></div>'+
  '<div class="p6-header-actions"><span class="pill"><span class="dot"></span>練習體驗版 · 雲端紀錄已接通</span>'+
  btn(activeTheme==='light'?icons.moon:icons.sun,'data-theme="1" aria-label="'+(activeTheme==='light'?'深色模式':'淺色模式')+
   '" title="'+(activeTheme==='light'?'深色模式':'淺色模式')+'"','icon-button ghost')+'</div></div>'+
  '<nav class="p6-switch" aria-label="學習模式"><div class="p6-seg" role="tablist">'+
  btn('七題型練習','data-page="practice" role="tab" aria-selected="'+(page==='practice')+'"',page==='practice'?'active':'')+
  btn('初始程度測驗','data-page="diagnostic" role="tab" aria-selected="'+(page==='diagnostic')+'"',page==='diagnostic'?'active':'')+
  '</div><details class="p6-about"><summary>'+icons.info+'<span>關於這個頁面</span></summary></details></nav>'+
  '<div class="p6-about-body" hidden><div class="notice">本頁使用示範題目，作答不會自動存檔或評估 CEFR。你可以直接在 ChatGPT 請我同步單字與錯句，不必另行授權；上方能查看實際已保存的雲端紀錄。正式單字卡的審核功能尚未整合到這個練習頁面。</div></div></div>';
}
function result(){
 if(!viewResult)return '';
 const tone=viewResult.tone||'info';
 const icon=tone==='success'?icons.check:tone==='retry'?icons.retry:icons.note;
 return '<div class="p6-result tone-'+tone+'" role="status"><span class="ico">'+icon+'</span><div><strong>'+
  h(viewResult.title)+'</strong><span class="msg">'+h(viewResult.message??'')+'</span></div></div>';
}
function questionForm(exercise,diagnostic=false){
 const m=exercise.mode;
 const kind='<div class="p6-kind">'+h(names[m]||m)+' · '+h(englishNames[m]||m)+'</div>';
 const prompt=kind+'<div class="p6-question">'+h(exercise.prompt)+'</div>';
 const formId=diagnostic?'diagnostic-answer':'practice-answer';
 if(m==='choice')return prompt+'<div class="p6-options">'+exercise.choices.map((c,i)=>
    btn('<span class="key">'+'ABCDEFGH'[i]+'</span><span>'+h(c)+'</span>','data-choice="'+h(c)+'"','p6-option')).join('')+'</div>';
 if(m==='flip')return prompt+'<p class="p6-note">先在心裡想出意思，再誠實選擇你記得的程度。</p>'+
    '<div class="p6-rate">'+[['忘記','完全想不起'],['困難','想了很久'],['記得','稍微想一下'],['很簡單','立刻知道']].map(([label,hint],i)=>
    btn(label+'<small>'+hint+'</small>','data-flip="'+(i+1)+'"')).join('')+'</div>';
 if(m==='listening')return prompt+
   '<div class="p6-listen">'+btn(icons.play,'data-play="1" aria-label="'+(spoken?'重播英語':'播放英語')+'"','primary p6-play')+
   '<div><strong>'+(spoken?'重播英語':'播放英語')+'</strong><p class="p6-note">本機語音只能示範；沒有受信任的音訊驗證，因此不計正式聽力成績。</p></div></div>'+
   '<form class="p6-form" id="'+formId+'">'+
   '<input name="answer" class="input" required maxlength="500" autocomplete="off" placeholder="輸入你聽到的英文">'+
   '<button class="button primary" type="submit">送出聽寫</button></form>';
 const element=m==='sentence'?
   '<textarea name="answer" class="input" rows="4" required maxlength="2000" placeholder="Write your own sentence"></textarea>':
   '<input name="answer" class="input" required maxlength="500" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="輸入你的英文答案">';
 return prompt+'<form class="p6-form" id="'+formId+'">'+
   element+'<button class="button primary" type="submit">送出作答</button></form>';
}
function practice(){
 const exercise=q();
 const steps='<div class="p6-steps" aria-hidden="true">'+DEMO_PRACTICE_BANK.map((_,i)=>
   '<i class="'+(i===index?'on':i<index?'done':'')+'"></i>').join('')+'</div>';
 const modes='<div class="p6-mini-list" role="tablist" aria-label="題型">'+DEMO_PRACTICE_BANK.map((x,i)=>btn(names[x.mode],
   'data-mode-index="'+i+'" role="tab" aria-selected="'+(i===index)+'"',i===index?'active':'')).join('')+'</div>';
 const body=!current?questionForm(exercise):
   '<div class="p6-kind">'+h(names[exercise.mode])+' · '+h(englishNames[exercise.mode])+'</div>'+
   '<div class="p6-question">'+h(exercise.prompt)+'</div>'+result()+
   (current.status==='needs-human-review'?sentenceReview(exercise):'');
 return '<div class="p6-section-head"><div><h1 class="view-title">七種英文練習</h1>'+
  '<p class="view-subtitle">示範題庫與基礎判分，不代表真實課程或 CEFR 認證。</p></div></div>'+
  '<section class="card p6-practice"><div class="p6-progress"><span class="eyebrow">PRACTICE · '+(index+1)+' / '+MODES.length+
  '</span></div>'+steps+modes+'<div class="p6-stage">'+body+'</div>'+
  '<div class="p6-card-foot"><p class="p6-note">已完成 '+localAttempts.length+' 次示範作答；沒有寫入正式資料庫。</p>'+
  (current?btn('換下一種練習 <span class="arrow">→</span>','data-next="1"','primary'):'')+'</div></section>';
}
function sentenceReview(exercise){
 if(!proposal)return '';
 return '<div class="notice"><strong>僅供練習的固定參考句（不是 AI 實際分析）：</strong>'+
  h(exercise.explanation||'Please write a clear sentence using the target word.')+'</div>'+
 '<form id="self-review"><div class="p6-rubric">'+RUBRIC.map((r,i)=>
 '<label><input type="checkbox" name="r'+i+'"> '+h(r.criterion)+'</label>').join('')+
 '</div><p class="p6-note">請自行檢查四項要點。此頁產生的自評不會當成正式已驗證的語言能力。</p><div class="gap"></div>'+
 '<button class="button primary" type="submit">記錄示範自評</button></form>';
}
function diagnostic(){
 const summary=diagnosticSummary(diag);
 const total=DIAGNOSTIC_BANK.length;
 if(diagnosticPos>=total){
   return '<div class="p6-section-head"><div><h1 class="view-title">測驗結果（非官方）</h1>'+
     '<p class="view-subtitle">依示範作答整理各技能狀態，僅供學習規劃參考。</p></div></div>'+
     '<section class="card p6-practice p6-stage"><span class="eyebrow">示範作答</span>'+
     '<div class="p6-score"><b>'+summary.answered+'</b><span>/ '+summary.total+' 題</span></div>'+
     '<div class="p6-skill-grid">'+Object.entries(summary.skills).map(([skill,value])=>
     '<div class="p6-skill"><span class="tag'+(value.state==='observed-sample'?' on':'')+'">'+h(states[value.state]||value.state)+'</span>'+
     '<strong>'+h(skillNames[skill]||skill)+'</strong><span>'+value.reviewed+' 已評分 · '+value.pendingReview+' 待覆核</span></div>').join('')+'</div>'+
     '<div class="notice">這些題目不足以認證 CEFR 等級；口說及未經驗證的聽力不會自動給分。</div>'+
     '<div class="p6-card-foot"><span></span>'+btn('重新開始示範測驗','data-restart="1"','primary')+'</div></section>';
 }
 const ex=d();
 const pct=Math.round(diagnosticPos/total*100);
 return '<div class="p6-section-head"><div><h1 class="view-title">初始程度測驗</h1>'+
  '<p class="view-subtitle">A0～C2 題目參考分級，非你的正式英文程度。</p></div></div>'+
  '<section class="card p6-practice"><div class="p6-progress"><span class="eyebrow">'+(diagnosticPos+1)+' / '+total+
  ' · 題目參考級別 '+h(ex.level)+' · '+h(skillNames[ex.skill]||ex.skill)+'</span><span class="p6-level">'+h(ex.level)+'</span></div>'+
  '<div class="p6-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><span style="width:'+Math.max(pct,3)+'%"></span></div>'+
  '<div class="p6-stage">'+(!current?questionForm(ex,true):
   '<div class="p6-question">'+h(ex.prompt)+'</div>'+result())+'</div>'+
  '<div class="p6-card-foot"><p class="p6-note">略過的題目不會算作已作答。</p>'+
  btn(current?'下一題 <span class="arrow">→</span>':'略過這題','data-diag-next="1"',current?'primary':'ghost')+'</div></section>';
}
function render(){
 document.documentElement.dataset.theme=activeTheme;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',activeTheme==='dark'?'#0b0d17':'#f6f7fb');
 if(topbar){
   const open=topbar.querySelector('.p6-about')?.open;
   topbar.innerHTML=header();
   const about=topbar.querySelector('.p6-about');
   const body=topbar.querySelector('.p6-about-body');
   about.open=!!open;body.hidden=!open;
   about.addEventListener('toggle',()=>{body.hidden=!about.open;});
 }
 root.innerHTML='<div class="p6-shell"><main>'+
 (page==='practice'?practice():diagnostic())+
 '</main><footer class="p6-footer">英文教室練習體驗版 · 作答僅存在本次頁面 · 雲端單字與錯句經 ChatGPT MCP 同步</footer></div>';
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
     viewResult={tone:'info',title:'請自行覆核',message:'造句先保存為未評分草稿，需確認用字與文法。'};
   } else if(event.status==='objective-graded'){
     viewResult={tone:event.correct?'success':'retry',title:event.correct?'正確':'還可以再練習',
       message:event.explanation||'本題以預先設定的答案進行比對。'};
   } else {
     viewResult={tone:'info',title:'已記錄示範操作',message:event.status==='audio-unverified'?'音訊驗證尚未完成，因此不計入聽力能力成績。':(event.note||'此項不計入正式技能成績。')};
   }
 }catch(e){viewResult={tone:'retry',title:'尚未記錄',message:e.message};}
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
   const graded=row.status==='objective-graded';
   viewResult={tone:graded?(row.correct?'success':'retry'):'info',
     title:graded?(row.correct?'答對了':'還可以再練習'):'未納入已驗證能力分數',
     message:'所有初始測驗結果僅供學習規劃，不會認證 CEFR 等級。'};
 }catch(e){viewResult={tone:'retry',title:'未記錄',message:e.message};}
 render();
}
function onClick(e){
 const t=e.target.closest('button');
 if(!t||!(root.contains(t)||topbar?.contains(t)))return;
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
   if(!('speechSynthesis' in window)){viewResult={tone:'retry',title:'無法播放',message:'本瀏覽器不支援語音播放。'};render();return;}
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
}
document.addEventListener('click',onClick);
root.addEventListener('submit',e=>{
 const form=e.target;
 if(!['practice-answer','diagnostic-answer','self-review'].includes(form.id))return;
 e.preventDefault();
 if(form.id==='self-review'){
   const checks=RUBRIC.map((_,i)=>new FormData(form).get('r'+i)==='on');
   viewResult={tone:'info',title:'示範自評已記錄',message:'你勾選 '+checks.filter(Boolean).length+'/4 項。這不是由後端驗證的正式覆核。'};
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
