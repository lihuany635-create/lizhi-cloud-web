(function(root,factory){
  "use strict";
  const api=factory(typeof module==="object"&&module.exports
    ?require("./budget-domain.js"):root.FinanceBudgetDomain);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceBudgetUi=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Domain){
  "use strict";
  const monthPattern=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
  const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  })[char]);
  const money=value=>value==null?"尚未設定":new Intl.NumberFormat("zh-TW",{
    style:"currency",currency:"TWD",maximumFractionDigits:0
  }).format(value);
  const statusLabels=Object.freeze({
    unset:"未設定",normal:"正常",warning:"接近上限（80%）",
    limit:"已達上限（100%）",over:"已超支"
  });
  function taipeiMonth(date=new Date()){
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Taipei",
      year:"numeric",month:"2-digit"}).formatToParts(date);
    const get=key=>parts.find(p=>p.type===key)?.value;
    return get("year")+"-"+get("month");
  }
  function shiftMonth(value,offset){
    if(!monthPattern.test(value)||!Number.isInteger(offset)||Math.abs(offset)>12)
      throw new RangeError("BUDGET_INVALID_MONTH");
    const [year,month]=value.split("-").map(Number);
    const d=new Date(Date.UTC(year,month-1+offset,1));
    const result=d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0");
    if(!monthPattern.test(result))throw new RangeError("BUDGET_MONTH_OUT_OF_RANGE");
    return result;
  }
  function parseAmount(input){
    const text=String(input??"").trim();
    if(!/^(0|[1-9][0-9]*)$/.test(text))throw new RangeError("預算金額必須是 0 或正整數。");
    const num=Number(text);
    if(!Number.isSafeInteger(num)||num<0)throw new RangeError("預算金額超過安全範圍。");
    return num;
  }
  function parseScope(scope){
    if(scope==="total")return null;
    if(typeof scope!=="string"||!scope.startsWith("cat:")||scope.length<5)
      throw new TypeError("無效的預算分類。");
    return scope.slice(4);
  }
  const scopeOf=categoryId=>categoryId===null?"total":"cat:"+categoryId;
  const progress=(used,total,label)=>{
    if(total==null)return '<span class="finance-budget-notset">尚未設定上限</span>';
    const pct=total===0?(used>0?100:0):Math.min(100,used/total*100);
    const description=total===0?(used>0?"零元預算已超支":"零元預算"):
      (used/total*100).toFixed(1)+"% 已使用";
    return '<div class="finance-budget-progress" role="progressbar" aria-label="'+escapeHtml(label)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(pct)+'">'
      +'<span style="width:'+pct.toFixed(2)+'%"></span></div>'
      +'<small>'+escapeHtml(description)+'</small>';
  };
  function indicator(status){
    return '<span class="finance-budget-status '+escapeHtml(status)+'">'+escapeHtml(statusLabels[status]||"未知")+'</span>';
  }
  function render(input={}){
    const {month,rows=[],transactions=[],categories=[],accounts=[],creditCards=[],
      syncState="local",syncMessage="",cloudEnabled=false,ledgerSyncState="idle",editScope="total",deleteId=null,
      busy=false,error=""}=input;
    const summary=Domain.summary({month,budgets:rows,transactions,categories,accounts,creditCards});
    const current=rows.filter(b=>!b.deletedAt&&b.month===month&&b.currency==="TWD");
    const byScope=new Map(current.map(b=>[scopeOf(b.categoryId),b]));
    const expenseCats=categories.filter(c=>!c.archived&&!c.deletedAt&&c.type==="expense")
      .slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),"zh-TW"));
    const entries=new Map(summary.by_category.map(x=>[scopeOf(x.category_id),x]));
    for(const c of expenseCats){
      const scope=scopeOf(c.id);
      if(!entries.has(scope))entries.set(scope,{
        category_id:c.id,category:c.name,configured:!!byScope.get(scope),
        budget:byScope.get(scope)?.amount??null,used:0,
        remaining:byScope.get(scope)?.amount??null,
        status:byScope.has(scope)?"normal":"unset"
      });
    }
    const categoryRows=[...entries.values()].sort((a,b)=>{
      const a1=a.configured?1:0,b1=b.configured?1:0;
      return b1-a1||b.used-a.used||String(a.category).localeCompare(String(b.category),"zh-TW");
    });
    const draftScope=editScope==="total"||expenseCats.some(c=>scopeOf(c.id)===editScope)
      ?editScope:"total";
    const edited=byScope.get(draftScope)||null;
    const selectedMonth=escapeHtml(month);
    const pending=rows.filter(x=>x.dirty).length;
    const syncText=!cloudEnabled?"預算設定保留本機，雲端預算服務尚待 P1 驗收與正式啟用。"
      :syncState==="synced"&&pending===0?"預算設定已與雲端同步"
      :syncState==="syncing"?"正在同步預算"
      :syncState==="pending"?"預算設定存在未同步或衝突項目"
      :syncState==="auth_required"?"預算雲端驗證失效"
      :"預算設定待雲端同步";
    const ledgerText=ledgerSyncState==="error"
      ?"帳本同步失敗：本月支出可能不是雲端最新資料。"
      :ledgerSyncState==="pending"||ledgerSyncState==="syncing"
      ?"帳本同步中／等待同步：以下為本機已記錄支出。"
      :"以下依本機帳本計算，不代表銀行帳戶可用金額。";
    const totalStatus=summary.status;
    const selectable='<option value="total"'+(draftScope==="total"?" selected":"")+'>每月總預算</option>'
      +expenseCats.map(c=>{
        const scope=scopeOf(c.id);
        return '<option value="'+escapeHtml(scope)+'"'+(draftScope===scope?" selected":"")+'>'
          +escapeHtml(c.name)+'</option>';
      }).join("");
    const totals='<section class="finance-budget-hero '+escapeHtml(totalStatus)+'">'
      +'<div class="finance-budget-hero-top"><div><small>MONTHLY BUDGET · TWD</small><h3>每月總預算</h3></div>'
      +indicator(totalStatus)+'</div>'
      +'<div class="finance-budget-kpis">'
      +'<div><small>預算上限</small><strong>'+money(summary.budget)+'</strong></div>'
      +'<div><small>已使用</small><strong>'+money(summary.used)+'</strong></div>'
      +'<div><small>剩餘額度</small><strong>'+money(summary.remaining)+'</strong></div></div>'
      +progress(summary.used,summary.budget,"每月總預算使用進度")
      +(summary.category_budget_warning?
        '<p class="finance-budget-allocation-warning" role="status">分類預算合計 '+money(BigInt(summary.category_budget_total))+
        '，超過總預算 '+money(BigInt(summary.category_budget_excess))+
        '。此為提醒，不影響個別分類額度，也不阻擋儲存。</p>':"")
      +'<button class="finance-button finance-budget-action" type="button" data-finance-action="budget-edit" data-scope="total">設定總預算</button>'
      +'</section>';
    const cards=categoryRows.map(row=>{
      const scope=row.category_id===null?null:scopeOf(row.category_id),saved=scope?byScope.get(scope):null;
      return '<article class="finance-budget-category '+escapeHtml(row.status)+'">'
        +'<div class="finance-budget-category-head"><h3>'+escapeHtml(row.category)+'</h3>'+indicator(row.status)+'</div>'
        +'<div class="finance-budget-category-values"><span>預算 '+money(row.budget)+'</span>'
        +'<span>已使用 '+money(row.used)+'</span><span>剩餘 '+money(row.remaining)+'</span></div>'
        +progress(row.used,row.budget,row.category+"預算使用進度")
        +'<div class="finance-budget-category-actions">'+(scope?'<button type="button" class="finance-button" data-finance-action="budget-edit" data-scope="'+escapeHtml(scope)+'">設定</button>':'<small>待分類交易：請先補充分類</small>')
        +(saved?'<button type="button" class="finance-button" data-finance-action="budget-remove-request" data-id="'+escapeHtml(saved.id)+'">移除額度</button>':"")
        +'</div></article>';
    }).join("");
    const confirm=deleteId?'<div class="finance-budget-confirm" role="group" aria-label="確認移除預算">'
      +'<p>確定移除此預算設定嗎？不會刪除任何交易或分類。</p>'
      +'<button class="finance-button danger" type="button" data-finance-action="budget-remove-confirm" data-id="'+escapeHtml(deleteId)+'">確認移除</button>'
      +'<button class="finance-button" type="button" data-finance-action="budget-remove-cancel">取消</button></div>':"";
    return '<section class="finance-budget-page">'
      +'<div class="finance-page-head"><div><span>PERSONAL FINANCE</span><h2>預算管理</h2></div>'
      +'<div class="finance-budget-month-picker"><button class="finance-button" type="button" data-finance-action="budget-month-shift" data-offset="-1" aria-label="上一個月">‹</button>'
      +'<label><span class="finance-budget-sr">預算月份</span><input type="month" data-finance-budget-month value="'+selectedMonth+'" aria-label="預算月份"></label>'
      +'<button class="finance-button" type="button" data-finance-action="budget-month-shift" data-offset="1" aria-label="下一個月">›</button></div></div>'
      +'<div class="finance-budget-sync" role="status"><strong>'+escapeHtml(syncText)+'</strong><span>'+escapeHtml(ledgerText)+'</span>'
      +(pending?'<small>待同步的預算設定：'+pending+' 筆</small>':"")
      +(syncMessage?'<small role="status">'+escapeHtml(syncMessage)+'</small>':"")
      +(cloudEnabled?'<button type="button" class="finance-button" data-finance-action="budget-sync"'
        +(busy?' disabled':'')+'>立即同步預算</button>':"")+'</div>'
      +(error?'<div class="finance-alert error" role="alert">'+escapeHtml(error)+'</div>':"")
      +totals
      +'<section class="finance-section finance-budget-groups"><div class="finance-section-head"><h2>分類預算</h2><small>'+categoryRows.length+' 個分類</small></div>'
      +(cards?'<div class="finance-budget-categories">'+cards+'</div>':'<p class="finance-budget-empty">尚無支出分類，請先至「分類」建立支出分類。</p>')+'</section>'
      +'<section class="finance-section finance-budget-settings"><div class="finance-section-head"><h2>預算設定</h2>'
      +'<button class="finance-button" type="button" data-finance-action="budget-copy-previous"'+(busy?" disabled":"")+'>複製上月（只補未設定項目）</button></div>'
      +'<form data-finance-form="budget"><label>預算項目<select name="scope" aria-label="預算項目">'+selectable+'</select></label>'
      +'<label>額度（TWD 元）<input name="amount" inputmode="numeric" autocomplete="off" type="text" pattern="[0-9]*" value="'+(edited?edited.amount:"")+'" placeholder="例如：10000" aria-label="預算額度" required></label>'
      +'<button class="finance-button primary" type="submit"'+(busy?" disabled":"")+'>儲存預算</button></form>'
      +'<p>支出包含一般消費及信用卡刷卡，不包含卡費繳款與帳戶互轉本金。'
      +(cloudEnabled?'預算先儲存在本機，通過本人驗證後才同步雲端。':'所有修改目前只會儲存在本機。')+'</p>'
      +confirm+'</section>'
      +(summary.excluded_foreign_currency?'<p class="finance-budget-currency-alert">有 '
        +summary.excluded_foreign_currency+' 筆外幣消費未併入 TWD 預算。</p>':"")
      +'</section>';
  }
  return Object.freeze({taipeiMonth,shiftMonth,parseAmount,parseScope,scopeOf,render,escapeHtml});
});
