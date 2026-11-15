import {
 initialDemoState, candidateDecision, addExplicitDemoCard,
 recordDemoPractice, getDemoSummary, EXERCISE_MODES, COURSE_STAGES, normalizeTerm, filterDemoCards
} from './state.mjs';

const app = document.getElementById('app');
let model = initialDemoState();
let tab = 'home';
let mode = 'flip';
let cardIndex = 0;
let flipped = false;
let message = '';
let answer = '';
let search = '';
const names = {home:'首頁',cards:'單字',practice:'練習',courses:'課程',analytics:'分析',settings:'設定'};
const symbols = {home:'⌂',cards:'▣',practice:'✎',courses:'◇',analytics:'▥',settings:'⚙'};
const modeNames = {flip:'翻卡',choice:'選擇題',spelling:'拼字',listening:'聽力',sentence:'造句'};
const feedback = {APPROVED:'已加入示範單字庫',IGNORED:'已略過候選單字',DUPLICATE:'示範單字庫已存在此單字',CREATED:'已新增示範單字',INVALID_CARD:'請輸入有效的單字與中文意思'};
const actionLabels = {approve_candidate:'核准候選單字',ignore_candidate:'略過候選單字',add_demo_card:'新增示範單字',demo_practice:'完成示範練習'};
const h = value => String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function navigate(next) {
 if (!Object.hasOwn(names,next)) return;
 tab=next; message=''; answer=''; flipped=false;
 render();
}
function navButtons(className,keys) {
 return '<nav class="'+className+'" aria-label="主要導覽">'+keys.map(key=>
   '<button type="button" data-tab="'+key+'" class="'+(tab===key?'active':'')+'" aria-current="'+(tab===key?'page':'false')+'">'+
   (className==='bottom-nav'?'<span class="emoji">'+symbols[key]+'</span>':'')+names[key]+'</button>').join('')+'</nav>';
}
function title(name,caption) {
 return '<h1 class="view-title">'+name+'</h1><p class="view-subtitle">'+caption+'</p>';
}
function home() {
 const sum=getDemoSummary(model);
 return title('每天進步一點點','你的個人英文學習空間。以下是尚未連接帳號的展示資料。')+
 '<div class="content-grid"><div class="list">'+
 '<section class="card hero"><div class="eyebrow">TODAY’S LEARNING</div><div class="hero-title">Good to see you!</div>'+
 '<p class="hero-copy">透過單字、句型與日常英文聊天逐步建立信心。你可先試用候選單字審核及卡片練習。</p>'+
 '<div class="actions"><button class="button primary" data-tab="practice">開始今日學習 →</button>'+
 '<button class="button" data-tab="cards">審核候選單字</button></div></section>'+
 '<div class="stats">'+
 '<div class="card"><div class="value">'+sum.cards+'</div><div class="label">示範單字</div></div>'+
 '<div class="card"><div class="value">'+sum.pending+'</div><div class="label">待審核候選</div></div>'+
 '<div class="card"><div class="value">'+sum.done+'</div><div class="label">示範作答</div></div></div>'+
 '</div><div class="list">'+
 '<section class="card"><div class="eyebrow">YOUR LEVEL</div><h2 style="font-size:24px;margin-top:8px">尚未評估</h2>'+
 '<p class="muted small">尚無初始英文程度測驗資料，不能據此判定 CEFR 等級。</p>'+
 '<div class="progress"><div style="width:0"></div></div></section>'+
 '<section class="card"><div class="eyebrow">AI STUDY PLAN</div><h2 style="margin-top:8px">今日建議</h2>'+
 '<div class="list"><div class="notice">① 先審核 '+sum.pending+' 張候選單字</div>'+
 '<div class="notice">② 用選擇題與翻卡熟悉句型</div>'+
 '<div class="notice">③ 正式 AI 自適應安排將在後續階段串接</div></div></section>'+
 '</div></div>';
}
function cardRows(cards) {
 return cards.length ? cards.map(c=>
 '<div class="list-row"><div><strong>'+h(c.term)+'</strong> · '+h(c.meaning)+'<p>'+h(c.example||'自訂單字')+'</p></div></div>').join('')
 : '<div class="notice">沒有符合搜尋條件的單字。</div>';
}
function cards() {
 const pending=model.candidates.filter(c=>c.status==='pending');
 const filtered=filterDemoCards(model,search);
 return title('單字中心','候選卡先審核，再進入正式複習庫。現在是純展示資料。')+
 '<div class="content-grid"><div class="list"><section class="card"><div class="flex-row"><h2>待審核候選 <span class="pill">'+pending.length+'</span></h2></div>'+
 '<div class="list">'+(pending.length?pending.map(c=>
 '<div class="list-row"><div><strong>'+h(c.term)+'</strong> · '+h(c.meaning)+
 '<p>'+h(c.example)+'</p></div><div class="actions">'+
 '<button class="button primary small-button" data-accept="'+h(c.id)+'">加入單字庫</button>'+
 '<button class="button small-button" data-ignore="'+h(c.id)+'">略過</button></div></div>').join(''):'<div class="notice">所有示範候選都已處理。</div>')+'</div></section>'+
 '<section class="card"><h2>正式單字庫（示範）</h2>'+
 '<label class="small muted" for="word-search">搜尋英文或中文</label>'+
 '<input class="input" id="word-search" placeholder="例如 hungry" value="'+h(search)+'">'+
 '<div class="gap"></div><div class="list" id="demo-card-rows">'+cardRows(filtered)+'</div></section></div>'+
 '<section class="card"><h2>手動加入展示單字</h2>'+
 '<form id="add-word"><label class="small muted" for="word-term">英文</label>'+
 '<input id="word-term" name="term" class="input" required maxlength="120" placeholder="例如 apple">'+
 '<div class="gap"></div><label class="small muted" for="word-meaning">中文意思</label>'+
 '<input id="word-meaning" name="meaning" class="input" required maxlength="250" placeholder="例如 蘋果">'+
 '<div class="gap"></div><button class="button primary" type="submit">加入展示單字</button></form>'+
 '<p class="muted small">不會同步到 Supabase 或 ChatGPT；重新整理頁面會清空本次更動。</p></section></div>';
}
function practice() {
 const card=model.cards[cardIndex % model.cards.length];
 const view=EXERCISE_MODES.map(m=>
 '<button class="button small-button '+(mode===m?'selected':'')+'" data-mode="'+m+'">'+modeNames[m]+'</button>').join('');
 let question='';
 if(mode==='flip'){
   question='<div class="flashcard"><div class="letter">'+h(card.term)+'</div>'+
   (flipped?'<div class="meaning">'+h(card.meaning)+'</div><div class="example">'+h(card.example||'')+'</div>':'<div class="muted small">先想想它的中文意思</div>')+'</div>'+
   '<div class="actions">'+(flipped?'<button class="button" data-grade="false">忘記了</button><button class="button primary" data-grade="true">我記得</button>':'<button class="button primary" data-flip="1">顯示答案</button>')+'</div>';
 } else if(mode==='choice'){
   const distractors=['快樂的','想睡的','工作','米飯','蘋果','已經吃過'].filter(x=>x!==card.meaning).slice(0,3);
   const choices=[card.meaning,...distractors].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
   question='<div class="flashcard"><div class="letter">'+h(card.term)+'</div><div class="muted small">選出最合適的意思</div></div>'+
   '<div class="answer-grid">'+choices.map(x=>'<button class="button" data-choice="'+h(x)+'">'+h(x)+'</button>').join('')+'</div>';
 } else if(mode==='spelling') {
   question='<div class="flashcard"><div class="meaning">'+h(card.meaning)+'</div><div class="muted small">寫出英文</div></div>'+
   '<form id="practice-form"><input class="input" name="answer" autocomplete="off" required placeholder="輸入英文拼字">'+
   '<div class="gap"></div><button class="button primary">檢查拼字</button></form>';
 } else if(mode==='listening'){
   question='<div class="flashcard"><div class="meaning">聽音辨識</div><p class="muted small">使用裝置瀏覽器的英文語音功能</p>'+
   '<button class="button" data-speak="1">▶ 播放單字</button></div><form id="practice-form">'+
   '<input class="input" name="answer" autocomplete="off" placeholder="你聽到的英文" required>'+
   '<div class="gap"></div><button class="button primary">檢查答案</button></form>';
 } else {
   question='<div class="flashcard"><div class="letter">'+h(card.term)+'</div><div class="muted small">用這個字寫一句英文</div></div>'+
   (flipped ? '<div class="notice">你的句子：'+h(answer)+'</div>'+
     '<div class="notice">參考句：'+h(card.example||'請用這個單字組成自然的句子。')+'</div>'+
     '<div class="gap"></div><div class="actions"><button class="button" data-grade="false">需再練習</button><button class="button primary" data-grade="true">自評通過</button></div>'
     : '<form id="practice-form"><textarea class="input" name="answer" rows="3" required placeholder="Write your sentence..."></textarea>'+
       '<div class="gap"></div><button class="button primary">查看參考句</button></form>');
 }
 return title('卡片練習','依你的目標挑選練習模式。FSRS 與 AI 評分會在後續階段提供。')+
 '<div class="content-grid"><section class="card"><div class="flex-row"><h2>今日練習</h2><span class="pill">第 '+(cardIndex%model.cards.length+1)+' / '+model.cards.length+' 張</span></div>'+
 '<div class="mode-tabs">'+view+'</div>'+question+
 '<div class="gap"></div><button class="button ghost" data-next="1">下一張卡 →</button>'+
 (message?'<div class="toast" role="status">'+h(message)+'</div>':'')+'</section>'+
 '<aside class="card"><h2>本次提醒</h2><p class="muted small">這是 P1 開發候選版，答題會暫存在這個頁面中，不會同步至正式學習帳號。</p>'+
 '<div class="notice">翻卡可自行標記是否記得；造句暫時僅能自評，沒有 AI 自動評分。</div>'+
 '<div class="gap"></div><div class="notice">聽力使用瀏覽器的語音合成功能，裝置不支援時會顯示提示。</div></aside></div>';
}
function courses() {
 const descriptions=['入門準備','基礎交流','生活英文','獨立表達','討論與分析','進階應用','高度精熟'];
 return title('學習階段','CEFR 作為參考。A0 是本系統自訂入門級別；你尚未接受正式程度測驗。')+
 '<section class="card"><div class="stage-grid">'+COURSE_STAGES.map((s,i)=>
 '<div class="stage"><span>LEVEL</span><strong>'+s+'</strong><span>'+descriptions[i]+'</span></div>').join('')+
 '</div></section><div class="gap"></div><div class="two-cols"><section class="card"><h2>基礎英文</h2>'+
 '<p class="muted">單字、文法、句型與拼字，依弱點建立基礎。</p></section>'+
 '<section class="card"><h2>生活對話</h2><p class="muted">從用餐、購物、朋友到分享日常。</p></section>'+
 '<section class="card"><h2>興趣與專業英文</h2><p class="muted">可選科技、工程、AI 等學習主題。</p></section>'+
 '<section class="card"><h2>升級機制</h2><p class="muted">需要測驗、實際應用與長期表現證據，不依單字數直接升級。</p></section></div>';
}
function analytics() {
 const sum=getDemoSummary(model);
 return title('學習分析','正式報告需要實際測驗與持續練習資料，這裡僅統計本次展示操作。')+
 '<div class="stats"><div class="card"><div class="value">'+sum.done+'</div><div class="label">本次練習</div></div>'+
 '<div class="card"><div class="value">'+(sum.accuracy==null?'—':sum.accuracy+'%')+'</div><div class="label">示範正確率</div></div>'+
 '<div class="card"><div class="value">'+model.audit.length+'</div><div class="label">本次操作紀錄</div></div></div>'+
 '<div class="gap"></div><div class="two-cols"><section class="card"><h2>六項英文能力</h2>'+
 ['單字','文法','閱讀','寫作','聽力','口說'].map(x=>
 '<div class="metric"><div class="flex-row"><strong>'+x+'</strong><span class="muted small">尚未正式評估</span></div><div class="bar"><div style="width:0"></div></div></div>').join('')+
 '</section><section class="card"><h2>最近展示操作</h2>'+
 (model.audit.length?'<div class="list">'+model.audit.slice(-8).reverse().map(a=>
 '<div class="list-row"><div><strong>#'+a.seq+' '+h(actionLabels[a.action]||a.action)+'</strong><p>'+h((model.cards.find(c=>c.id===a.detail)||model.candidates.find(c=>c.id===a.detail))?.term||a.detail)+'</p></div></div>').join('')+'</div>':
 '<p class="muted">尚無作答或審核紀錄。</p>')+
 '<div class="gap"></div><div class="notice">此處不是 Supabase 的 audit_logs。正式版必須由受信任後端保存。</div></section></div>';
}
function settings() {
 return title('個人設定','目前所有變更只影響本次展示頁面。')+
 '<div class="two-cols"><section class="card"><h2>介面設定</h2><p class="muted small">網站支援深色／淺色模式。</p>'+
 '<button class="button" data-theme="1">'+(model.theme==='light'?'切換成深色模式':'切換成淺色模式')+'</button>'+
 '<div class="gap"></div><h2>每日新單字目標</h2>'+
 '<div class="actions"><button class="button" data-goal="-1">−</button><span class="pill">'+model.goal+' 個／日</span><button class="button" data-goal="1">＋</button></div></section>'+
 '<section class="card"><h2>登入與資料</h2>'+
 '<p class="muted">正式版計畫沿用立之雲端庫 Google 帳號登入；本候選頁面沒有連接正式帳號與資料庫。</p>'+
 '<div class="notice">目前不具備雲端同步、帳號綁定、正式資料刪除等權限。</div>'+
 '<div class="gap"></div><button class="button danger" data-reset="1">重設展示資料</button></section></div>';
}
function render() {
 document.documentElement.dataset.theme=model.theme;
 const summaries={home,cards,practice,courses,analytics,settings};
 app.innerHTML='<div class="app-shell"><header class="header">'+
 '<div class="brand"><div class="brand-mark" aria-hidden="true">E</div><div><strong>立之英文學習教室</strong><span class="small">AI ENGLISH ACADEMY</span></div></div>'+
 '<span class="pill">P1 · 開發候選版</span></header>'+
 '<div class="demo-banner"><strong>展示模式 · 尚未連接正式資料</strong><span>無 Google 登入、Supabase 寫入或 ChatGPT MCP 同步</span></div>'+
 navButtons('nav',['home','cards','practice','courses','analytics','settings'])+
 '<main id="main-content">'+(message && tab!=='practice'?'<div class="notice" role="status">'+h(message)+'</div><div class="gap"></div>':'')+summaries[tab]()+'</main>'+
 '<footer class="footer">立之雲端庫整合候選模組 · 不代表實際英文程度評估或已完成部署</footer></div>'+
 navButtons('bottom-nav',['home','cards','practice','courses','analytics','settings']);
}
app.addEventListener('click',event=>{
 const el=event.target.closest('button');
 if(!el) return;
 if(el.dataset.tab) return navigate(el.dataset.tab);
 if(el.dataset.accept){
   const r=candidateDecision(model,el.dataset.accept,'accept');model=r.state;message=feedback[r.code]||r.code;return render();
 }
 if(el.dataset.ignore){
   const r=candidateDecision(model,el.dataset.ignore,'ignore');model=r.state;message=feedback[r.code]||r.code;return render();
 }
 if(el.dataset.mode){mode=el.dataset.mode;flipped=false;answer='';message='';return render();}
 if(el.dataset.flip){flipped=true;return render();}
 if(el.dataset.next){cardIndex++;flipped=false;answer='';message='';return render();}
 if(el.dataset.grade){
   const card=model.cards[cardIndex % model.cards.length];
   const r=recordDemoPractice(model,{cardId:card.id,mode,correct:el.dataset.grade==='true'});
   model=r.state;message='已記錄本次展示作答';return render();
 }
 if(el.dataset.choice!=null){
   const card=model.cards[cardIndex % model.cards.length];
   const correct=el.dataset.choice===card.meaning;
   model=recordDemoPractice(model,{cardId:card.id,mode,correct}).state;
   message=(correct?'答對了！ ':'還可以再練習。')+'正確答案：'+card.meaning;
   return render();
 }
 if(el.dataset.speak){
   if(!('speechSynthesis' in window)){message='此瀏覽器不支援語音播放';return render();}
   const utterance=new SpeechSynthesisUtterance(model.cards[cardIndex%model.cards.length].term);
   utterance.lang='en-US';window.speechSynthesis.speak(utterance);return;
 }
 if(el.dataset.theme){model={...model,theme:model.theme==='light'?'dark':'light'};return render();}
 if(el.dataset.goal){model={...model,goal:Math.max(1,Math.min(30,model.goal+Number(el.dataset.goal)))};return render();}
 if(el.dataset.reset){model=initialDemoState();cardIndex=0;mode='flip';message='已重設本頁展示資料';return render();}
});
app.addEventListener('submit',event=>{
 if(event.target.id==='add-word'){
   event.preventDefault();const d=new FormData(event.target);
   const r=addExplicitDemoCard(model,{term:String(d.get('term')||''),meaning:String(d.get('meaning')||'')});
   model=r.state;message=feedback[r.code]||r.code;render();return;
 }
 if(event.target.id==='practice-form'){
   event.preventDefault();const d=new FormData(event.target);
   const response=String(d.get('answer')||'').trim();
   const card=model.cards[cardIndex%model.cards.length];
   if(mode==='sentence'){
     if(!response){message='請輸入一個句子';render();return;}
     answer=response;
     flipped=true;
     message='請對照參考句並自行評估。這不是 AI 自動評分。';
     return render();
   }
   const correct=normalizeTerm(response)===normalizeTerm(card.term);
   model=recordDemoPractice(model,{cardId:card.id,mode,correct}).state;
   message=(correct?'答對了！':'可以再練習。')+' 正確拼字：'+card.term;
   return render();
 }
});
app.addEventListener('input',event=>{
 if(event.target.id==='word-search'){
   search=event.target.value;
   const list=app.querySelector('#demo-card-rows');
   if(list)list.innerHTML=cardRows(filterDemoCards(model,search));
 }
});
// Search updates results immediately without removing the focused input.
render();
