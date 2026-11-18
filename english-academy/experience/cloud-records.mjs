// Actual owner-scoped records from Supabase with existing Google sign-in.
// Only reads: candidate/formal cards and corrections. Practice exercises stay demo-only.
const root=document.getElementById('app');
const panel=document.createElement('section');
panel.className='p6-shell p6-cloud-wrap';
panel.setAttribute('aria-label','已儲存的英文雲端學習紀錄');
panel.innerHTML=
  '<div class="p6-hero">'+
  '<div class="p6-cloud-header"><div><span class="eyebrow">MY LEARNING · 雲端紀錄</span><h2>我的雲端學習紀錄</h2>'+
  '<p class="p6-note">ChatGPT 已同步的候選單字與錯句會顯示在這裡。下方七種題型仍為示範練習，作答不會自動儲存。</p></div>'+
  '<button type="button" class="button" id="english-cloud-refresh">'+
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>'+
  '重新整理紀錄</button></div>'+
  '<p id="english-cloud-status" class="p6-note" aria-live="polite">正在讀取已儲存的資料…</p>'+
  '<div class="p6-skeleton" id="english-cloud-skeleton" aria-hidden="true"><i></i><i></i><i></i></div>'+
  '<div id="english-cloud-results" hidden>'+
  '<div class="p6-cloud-counts">'+
  '<div class="p6-stat accent"><b id="english-cloud-candidate-count">0</b><span>待審單字</span></div>'+
  '<div class="p6-stat"><b id="english-cloud-error-count">0</b><span>錯句紀錄</span></div>'+
  '<div class="p6-stat"><b id="english-cloud-card-count">0</b><span>正式單字卡</span></div></div>'+
  '<section id="english-flashcard-deck" class="p6-deck" aria-label="英文單字卡預覽">'+
  '<div class="p6-deck-head"><div><span class="p6-deck-eyebrow">VOCABULARY · 單字卡</span>'+
  '<h3>翻翻看，記住今天的單字</h3></div><span class="p6-deck-counter" id="english-deck-counter"></span></div>'+
  '<div class="p6-deck-stage"><button type="button" id="english-deck-card" class="p6-deck-card" aria-label="翻面查看單字意思">'+
  '<span class="p6-deck-label" id="english-deck-label"></span>'+
  '<span class="p6-deck-word" id="english-deck-word"></span>'+
  '<span class="p6-deck-help" id="english-deck-help"></span>'+
  '<span class="p6-deck-example" id="english-deck-example"></span>'+
  '</button></div>'+
  '<div class="p6-deck-actions"><button class="button" type="button" id="english-deck-prev" aria-label="上一張">← 上一張</button>'+
  '<button class="button primary" type="button" id="english-deck-flip">翻面</button>'+
  '<button class="button" type="button" id="english-deck-speak">'+
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>'+
  '播放發音</button>'+
  '<button class="button" type="button" id="english-deck-next" aria-label="下一張">下一張 →</button></div>'+
  '<p class="p6-note">本區直接使用你雲端已保存的單字。翻卡和發音僅供體驗，不會改動正式單字卡或複習排程。</p>'+
  '<p id="english-deck-message" class="p6-note" aria-live="polite"></p></section></div></div>'+
  '<div class="p6-cloud-cols" id="english-cloud-cols" hidden><div><h3>待審候選單字（最近 20 筆）</h3>'+
  '<ul class="p6-cloud-list" id="english-cloud-candidates"></ul></div>'+
  '<div><h3>已保存錯句（最近 20 筆）</h3>'+
  '<ul class="p6-cloud-list" id="english-cloud-errors"></ul></div></div>';
const slot=document.getElementById('english-cloud-slot');
if(slot)slot.replaceChildren(panel);else root.before(panel);
const status=panel.querySelector('#english-cloud-status');
const results=panel.querySelector('#english-cloud-results');
const columns=panel.querySelector('#english-cloud-cols');
const skeleton=panel.querySelector('#english-cloud-skeleton');
const refresh=panel.querySelector('#english-cloud-refresh');
const candidates=panel.querySelector('#english-cloud-candidates');
const errors=panel.querySelector('#english-cloud-errors');
const field=id=>panel.querySelector('#english-cloud-'+id);
const deck=panel.querySelector('#english-flashcard-deck');
const card=panel.querySelector('#english-deck-card');
const deckName=panel.querySelector('#english-deck-word');
const deckLabel=panel.querySelector('#english-deck-label');
const deckHelp=panel.querySelector('#english-deck-help');
const deckExample=panel.querySelector('#english-deck-example');
const deckCounter=panel.querySelector('#english-deck-counter');
const deckMessage=panel.querySelector('#english-deck-message');
const deckButtons={
 prev:panel.querySelector('#english-deck-prev'),
 next:panel.querySelector('#english-deck-next'),
 flip:panel.querySelector('#english-deck-flip'),
 speak:panel.querySelector('#english-deck-speak')
};
const exampleSentences=Object.freeze({
 hungry:'I am hungry after class.',
 sleepy:'I feel sleepy today.',
 anime:'I enjoy watching anime.'
});
let flashcards=[],cardIndex=0,flipped=false;
function renderFlashcard(){
 if(!flashcards.length){deck.hidden=true;return;}
 deck.hidden=false;
 cardIndex=(cardIndex+flashcards.length)%flashcards.length;
 const entry=flashcards[cardIndex];
 deckCounter.textContent=(cardIndex+1)+' / '+flashcards.length;
 deckLabel.textContent=entry.pending?'待審候選單字':'正式單字卡';
 card.classList.toggle('is-flipped',flipped);
 deckName.textContent=flipped?entry.meaning:entry.term;
 deckHelp.textContent=flipped?entry.term:'點擊卡片翻面，查看中文意思';
 const example=exampleSentences[entry.term.toLowerCase().trim()];
 deckExample.textContent=flipped&&example?'示範例句：'+example:'';
 deckButtons.flip.textContent=flipped?'看英文':'翻面';
 deckButtons.prev.disabled=flashcards.length<2;
 deckButtons.next.disabled=flashcards.length<2;
 deckMessage.textContent='';
}
function shiftCard(offset){
 if(!flashcards.length)return;
 cardIndex=(cardIndex+offset+flashcards.length)%flashcards.length;
 flipped=false;
 renderFlashcard();
}
function flipCard(){
 if(!flashcards.length)return;
 flipped=!flipped;
 card.classList.remove('is-turning');
 void card.offsetWidth; // restart the flip animation on every turn
 card.classList.add('is-turning');
 renderFlashcard();
}
card.addEventListener('animationend',()=>card.classList.remove('is-turning'));
card.addEventListener('click',flipCard);
deckButtons.flip.addEventListener('click',flipCard);
deckButtons.prev.addEventListener('click',()=>shiftCard(-1));
deckButtons.next.addEventListener('click',()=>shiftCard(1));
deckButtons.speak.addEventListener('click',()=>{
 if(!flashcards.length)return;
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
  deckMessage.textContent='此瀏覽器不支援英文語音播放。';
  return;
 }
 const sentence=new SpeechSynthesisUtterance(flashcards[cardIndex].term);
 sentence.lang='en-US';sentence.rate=.85;
 window.speechSynthesis.cancel();
 window.speechSynthesis.speak(sentence);
 deckMessage.textContent='正在播放：'+flashcards[cardIndex].term;
});

function entry(container,main,secondary){
 const item=document.createElement('li');
 const strong=document.createElement('strong');
 strong.textContent=String(main||'');
 const small=document.createElement('small');
 small.textContent=String(secondary||'');
 item.append(strong,small);container.append(item);
}
function fill(container,items,formatter){
 container.replaceChildren();
 if(!items?.length){entry(container,'目前沒有紀錄','');container.lastChild.className='is-empty';return;}
 for(const item of items){
  const [primary,secondary]=formatter(item);
  entry(container,primary,secondary);
 }
}
let loading=false;
async function updateRecords(){
 if(loading)return;
 loading=true;refresh.disabled=true;
 results.hidden=true;columns.hidden=true;skeleton.hidden=false;
 flashcards=[];cardIndex=0;flipped=false;
 status.textContent='正在使用已登入的本人帳號讀取雲端資料…';
 try{
  const auth=window.parent!==window&&window.parent.LizhiAuth;
  const client=auth?.client;
  if(!auth?.user?.id||!client?.auth?.getSession||!client?.from){
   status.textContent='僅在正式立之雲端庫完成 Google 登入後，才能查看私人紀錄。';
   return;
  }
  const {data:session,error:sessionError}=await client.auth.getSession();
  if(sessionError||!session?.session?.access_token||
     session.session.user?.id!==auth.user.id){
   status.textContent='登入狀態已失效，請重新登入立之雲端庫。';
   return;
  }
  // Browser only supplies its own Google JWT; PostgREST RLS enforces owner_id.
  const [pending,corrections,active]=await Promise.all([
   client.from('english_card_candidates')
    .select('term,meaning_zh,created_at',{count:'exact'})
    .eq('status','pending').order('created_at',{ascending:false}).limit(20),
   client.from('english_error_records')
    .select('original_sentence,corrected_sentence,occurred_at',{count:'exact'})
    .order('occurred_at',{ascending:false}).limit(20),
   client.from('english_cards')
    .select('term,meaning_zh,created_at',{count:'exact'})
    .order('created_at',{ascending:false}).limit(20)
  ]);
  if(pending.error||corrections.error||active.error)
   throw new Error('RLS_READ_UNAVAILABLE');
  fill(candidates,pending.data,record=>[
   record.term,record.meaning_zh
  ]);
  fill(errors,corrections.data,record=>[
   record.original_sentence,'修改：'+record.corrected_sentence
  ]);
  field('candidate-count').textContent=String(pending.count??pending.data.length);
  field('error-count').textContent=String(corrections.count??corrections.data.length);
  field('card-count').textContent=String(active.count??0);
  const words=[
   ...(active.data||[]).map(x=>({term:String(x.term||''),meaning:String(x.meaning_zh||''),pending:false})),
   ...(pending.data||[]).slice().reverse().map(x=>({term:String(x.term||''),meaning:String(x.meaning_zh||''),pending:true}))
  ].filter(x=>x.term&&x.meaning);
  const previous=flashcards[cardIndex]?.term;
  flashcards=words;
  const matched=words.findIndex(x=>x.term===previous);
  cardIndex=matched<0?0:matched;
  flipped=false;
  renderFlashcard();
  status.textContent='已讀取雲端資料（僅本人可見）。';
  results.hidden=false;columns.hidden=false;
 }catch{
  status.textContent='暫時無法讀取雲端紀錄，請稍後按「重新整理紀錄」。練習頁仍可使用。';
 }finally{loading=false;refresh.disabled=false;skeleton.hidden=true;}
}
refresh.addEventListener('click',updateRecords);
void updateRecords();
