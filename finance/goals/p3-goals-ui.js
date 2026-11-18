(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceGoalsP3Ui=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const escape=value=>String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  })[c]);
  const money=n=>n==null?"尚未設定":new Intl.NumberFormat("zh-TW",{
    style:"currency",currency:"TWD",maximumFractionDigits:0
  }).format(n);
  const names=Object.freeze({
    savings:"固定儲蓄",investible_cash:"待投入投資現金",sinking_fund:"指定用途準備金"
  });
  const purpose=Object.freeze({rent:"房租（季繳）",insurance:"保險（年繳）"});
  const label=(title,value,detail="")=>
    '<article class="finance-goals-stat"><small>'+escape(title)+'</small>'+
    '<strong>'+money(value)+'</strong><p>'+escape(detail)+'</p></article>';
  const formStatus=(state)=>{
    if(state==="auth_required")return "請先完成本人登入，才能讀取目標資料。";
    if(state==="pending")return "目標資料尚待同步，無法當成正式已儲存結果。";
    if(state==="error")return "目標資料讀取失敗，請稍後再試。";
    return "目標管理功能尚未正式上線；目前只有隔離候選，沒有讀寫你的真實儲蓄與投資資料。";
  };
  function render({report=null,state="candidate_only"}={}){
    if(!report||state==="auth_required"||state==="error"){
      return '<section class="finance-section finance-goals-panel" aria-label="儲蓄與投資目標">'+
        '<header class="finance-section-head"><h2>儲蓄・投資・準備金</h2></header>'+
        '<p class="finance-goals-notice" role="status">'+escape(formStatus(state))+'</p>'+
        '<p>與現有「支出預算」分開管理。尚未確認入金的金額不會顯示為已存入或已投資。</p>'+
        '</section>';
    }
    const {allocation:a,goalProgress:goals=[],sinkingFunds:funds=[]}=report;
    const stats=a?[
      label("每月預計薪水",report.estimatedSalary,"目前僅為分配計畫"),
      label("生活費",a.spendingPlan,"仍以既有支出預算管理"),
      label("固定儲蓄目標",a.fixedSavings,"不代表已實際存入"),
      label("可自由擇機投資",a.flexibleInvestible,"與受保護準備金分開"),
      label("房租及保險準備金",a.protectedReserve,"保留現金，不投入市場"),
      label("信用卡預留",a.creditCardReserve,"待正式帳單後再調整")
    ].join(""):"";
    const progress=goals.map(g=>'<li><span>'+escape(names[g.kind]||g.kind)+'</span>'+
      '<strong>'+money(g.userConfirmedReserved)+' / '+money(g.targetAmount)+'</strong>'+
      '<small>使用者確認預留，非銀行核實</small></li>').join("");
    const due=funds.map(f=>'<li><span>'+escape(purpose[f.purpose]||f.purpose)+'</span>'+
      '<strong>每月 '+money(f.monthlyTarget)+'；週期推估 '+money(f.cycleProjection)+'</strong>'+
      '<small>帳單 '+(f.confirmedDueAmount==null?"未確認":money(f.confirmedDueAmount))+
      '；實際付款未核實</small></li>').join("");
    return '<section class="finance-section finance-goals-panel" aria-label="儲蓄與投資目標">'+
      '<header class="finance-section-head"><h2>儲蓄・投資・準備金</h2><small>'+
      escape(report.month)+'</small></header>'+
      '<p class="finance-goals-notice">此頁呈現規劃與使用者確認的預留。'+
      '不代表銀行存款、房租繳費或股票實際買進。</p>'+
      (stats?'<div class="finance-goals-grid">'+stats+'</div>':
      '<p role="status">本月尚未設定薪水分配計畫。</p>')+
      '<h3>本月目標進度（與消費分開）</h3>'+
      '<ul class="finance-goals-lines">'+(progress||'<li>本月沒有已建立的儲蓄或投資目標。</li>')+'</ul>'+
      '<h3>指定用途準備金</h3><ul class="finance-goals-lines">'+
      (due||'<li>本月沒有準備金目標。</li>')+'</ul>'+
      '<footer class="finance-goals-foot">獨立支出預算：'+money(report.separatelyConfiguredExpenseBudget)+
      '（不與儲蓄或資金轉移相加成消費）。來源：'+escape(report.source)+
      '；資料狀態：'+escape(report.syncStatus)+'</footer></section>';
  }
  return Object.freeze({render,escape,money});
});
