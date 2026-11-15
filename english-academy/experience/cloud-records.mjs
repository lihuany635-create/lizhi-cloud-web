// Actual owner-scoped records from Supabase with existing Google sign-in.
// Only reads: candidate/formal cards and corrections. Practice exercises stay demo-only.
const root=document.getElementById('app');
const panel=document.createElement('section');
panel.className='p6-shell p6-cloud-wrap';
panel.setAttribute('aria-label','已儲存的英文雲端學習紀錄');
panel.innerHTML=
  '<div class="card">'+
  '<div class="p6-cloud-header"><h2>我的雲端學習紀錄</h2>'+
  '<button type="button" class="button" id="english-cloud-refresh">重新整理紀錄</button></div>'+
  '<p class="p6-note">ChatGPT 已同步的候選單字與錯句會顯示在這裡。下方七種題型仍為示範練習，作答不會自動儲存。</p>'+
  '<p id="english-cloud-status" class="p6-note" role="status" aria-live="polite">正在讀取已儲存的資料…</p>'+
  '<div id="english-cloud-results" hidden>'+
  '<div class="p6-cloud-counts"><span id="english-cloud-candidate-count"></span>'+
  '<span id="english-cloud-error-count"></span><span id="english-cloud-card-count"></span></div>'+
  '<div class="p6-cloud-cols"><div><h3>待審候選單字（最近 20 筆）</h3>'+
  '<ul class="p6-cloud-list" id="english-cloud-candidates"></ul></div>'+
  '<div><h3>已保存錯句（最近 20 筆）</h3>'+
  '<ul class="p6-cloud-list" id="english-cloud-errors"></ul></div></div></div></div>';
root.before(panel);
const status=panel.querySelector('#english-cloud-status');
const results=panel.querySelector('#english-cloud-results');
const refresh=panel.querySelector('#english-cloud-refresh');
const candidates=panel.querySelector('#english-cloud-candidates');
const errors=panel.querySelector('#english-cloud-errors');
const field=id=>panel.querySelector('#english-cloud-'+id);
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
 if(!items?.length){entry(container,'目前沒有紀錄','');return;}
 for(const item of items){
  const [primary,secondary]=formatter(item);
  entry(container,primary,secondary);
 }
}
let loading=false;
async function updateRecords(){
 if(loading)return;
 loading=true;refresh.disabled=true;
 results.hidden=true;status.textContent='正在使用已登入的本人帳號讀取雲端資料…';
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
    .select('id',{count:'exact',head:true})
  ]);
  if(pending.error||corrections.error||active.error)
   throw new Error('RLS_READ_UNAVAILABLE');
  fill(candidates,pending.data,record=>[
   record.term,record.meaning_zh
  ]);
  fill(errors,corrections.data,record=>[
   record.original_sentence,'修改：'+record.corrected_sentence
  ]);
  field('candidate-count').textContent='待審單字：'+(pending.count??pending.data.length);
  field('error-count').textContent='錯句紀錄：'+(corrections.count??corrections.data.length);
  field('card-count').textContent='正式單字卡：'+(active.count??0);
  status.textContent='已讀取雲端資料（僅本人可見）。';
  results.hidden=false;
 }catch{
  status.textContent='暫時無法讀取雲端紀錄，請稍後按「重新整理紀錄」。練習頁仍可使用。';
 }finally{loading=false;refresh.disabled=false;}
}
refresh.addEventListener('click',updateRecords);
void updateRecords();
