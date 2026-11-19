// P5 candidate UI. Requires a trusted authenticated provider injected by the
// original Finance app after actual authorisation. No provider = NO writes.
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.FinanceGoalsP5Ui=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const categories=[
   ["food","餐費"],["daily","日常用品"],["transport","交通"],
   ["savings","固定儲蓄"],["investible_cash","彈性投資現金"],
   ["rent_reserve","房租準備金"],["insurance_reserve","保險準備金"],
   ["credit_card_reserve","信用卡預留"]
 ];
 const role={food:"first_bank_debit",daily:"first_bank_debit",
   transport:"first_bank_debit",savings:"first_bank_savings",
   investible_cash:"investment_cash_pool",rent_reserve:"investment_cash_pool",
   insurance_reserve:"investment_cash_pool",credit_card_reserve:"ctbc_salary"};
 const escape=value=>String(value??"").replace(/[&<>'"]/g,c=>({
   "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
 })[c]);
 const fail=code=>{const e=new Error(code);e.code=code;throw e;};
 const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const MONTH=/^20[0-9]{2}-(0[1-9]|1[0-2])$/;
 const money=v=>{if(!/^(0|[1-9][0-9]{0,15})$/.test(String(v??"")))fail("INVALID_AMOUNT");
   const x=Number(v);if(!Number.isSafeInteger(x))fail("INVALID_AMOUNT");return x;};
 const text=value=>typeof value==="string"&&value.trim().length>0&&value.length<=160;
 const id=v=>typeof v==="string"&&UUID.test(v);
 const opts=(data,selected)=>data.map(([key,label])=>
   '<option value="'+escape(key)+'"'+(key===selected?' selected':'')+'>'+escape(label)+'</option>').join("");
 const field=(name,label,type,value="",disabled=false)=>
   '<label>'+escape(label)+' <input name="'+escape(name)+'" type="'+escape(type)+
   '" value="'+escape(value)+'"'+(disabled?' disabled':'')+' required></label>';
 function render({enabled=false,month="2026-12",goals=[],plan=null,accounts=[]}={}){
   const off=!enabled;
   const disabled=off?" disabled":"";
   const goalOptions=(goals||[]).filter(g=>id(g.id)).map(g=>
     '<option value="'+escape(g.id)+'" data-version="'+escape(g.version)+
     '">'+escape(g.kind)+" · "+escape(g.id.slice(0,8))+'</option>').join("");
   const accountOptions='<option value="">尚未指定</option>'+
     (accounts||[]).filter(a=>text(a.id)).map(a=>
       '<option value="'+escape(a.id)+'">'+escape(a.name||a.id)+'</option>').join("");
   const consent='<label class="finance-goals-consent"><input type="checkbox" name="confirmed"'+disabled+
     ' required> 我確認這是規劃／預留紀錄，不是實際匯款或投資交易</label>';
   const currency='<small>金額單位：新臺幣（TWD）</small>';
   const goalForm='<form data-goals-form="goal" class="finance-goals-editor">'+
     '<h3>新增、修改或停用目標</h3>'+currency+
     '<label>月份 <input name="month" type="month" value="'+escape(month)+'"'+disabled+' required></label>'+
     '<label>動作 <select name="action"'+disabled+'>'+opts([
       ["create","新增目標"],["update","修改目標"],["remove","停用目標"]],"create")+'</select></label>'+
     '<label>既有目標 <select name="goal_id"'+disabled+
     '><option value="">新增時自動建立</option>'+goalOptions+'</select></label>'+
     '<label>目標種類 <select name="kind"'+disabled+'>'+opts([
       ["savings","固定儲蓄"],["investible_cash","待投入投資現金"],
       ["sinking_fund","房租／保險準備金"]],"savings")+'</select></label>'+
     field("target_amount","每月目標金額","number","0",off)+
     '<label>存放帳戶 <select name="account_id"'+disabled+'>'+accountOptions+'</select></label>'+
     '<label>準備金用途 <select name="purpose"'+disabled+'>'+opts([
       ["","無"],["rent","季繳房租"],["insurance","年繳保險"]],"")+'</select></label>'+
     '<label>確認帳單金額（可空） <input name="due_amount" type="number" min="0"'+disabled+'></label>'+
     '<label>到期月份（可空） <input name="due_month" type="month"'+disabled+'></label>'+
     consent+'<button type="submit"'+disabled+'>確認目標變更</button></form>';
   const allocationForm='<form data-goals-form="allocation" class="finance-goals-editor">'+
     '<h3>人工確認預留與釋出</h3>'+currency+
     '<label>月份 <input name="month" type="month" value="'+escape(month)+'"'+disabled+' required></label>'+
     '<label>目標 <select name="goal_id"'+disabled+' required>'+
     '<option value="">選擇既有目標</option>'+goalOptions+'</select></label>'+
     '<label>動作 <select name="action"'+disabled+'>'+opts([
       ["allocate","記錄已確認預留"],["release","釋出已預留款"]],"allocate")+'</select></label>'+
     field("amount","預留／釋出金額","number","0",off)+
     field("source_reference","資金來源切片識別碼","text","",off)+
     '<p>同一筆來源切片不可重複分配；釋出不得超過原本預留。</p>'+
     consent+'<button type="submit"'+disabled+'>確認資金紀錄</button></form>';
   const salaryLines=categories.map(([key,label])=>{
     const row=(plan?.lines||[]).find(x=>x.category===key);
     return field(key,label,"number",row?.amount??0,off);
   }).join("");
   const salaryForm='<form data-goals-form="salary" class="finance-goals-editor">'+
     '<h3>八項薪水分配</h3>'+currency+
     '<label>月份 <input name="month" type="month" value="'+escape(month)+'"'+disabled+' required></label>'+
     '<label>動作 <select name="action"'+disabled+'>'+opts([
       ["set","儲存薪資分配"],["remove","停用本月分配"]],"set")+'</select></label>'+
     '<label>預估薪水 <input name="estimated_income" type="number" min="0" value="'+
     escape(plan?.estimated_income??43000)+'"'+disabled+' required></label>'+
     salaryLines+consent+'<button type="submit"'+disabled+'>確認薪水分配</button></form>';
   return '<section class="finance-section finance-goals-actions" aria-label="目標管理操作">'+
     '<p role="status" data-goals-feedback>'+(off?
     '目前為候選介面，尚未完成正式本人驗證與 MCP 接線；所有儲存按鈕停用。':
     '請確認帳戶和目標資料；所有操作會要求再次確認。')+'</p>'+
     '<div class="finance-goals-forms">'+goalForm+allocationForm+salaryForm+'</div></section>';
 }
 function asObject(data){if(data&&typeof data.get==="function"){
   const out={};for(const [k,v] of data.entries())out[k]=v;return out;
 }return {...data};}
 function buildCommand(type,raw,{goals=[],plan=null,uuid}={}){
   const data=asObject(raw);
   if(data.confirmed!==true&&data.confirmed!=="on")fail("EXPLICIT_CONFIRMATION_REQUIRED");
   if(!MONTH.test(data.month||"")||typeof uuid!=="function")fail("INVALID_MONTH");
   const request_id=uuid();if(!id(request_id))fail("INVALID_REQUEST_ID");
   if(type==="goal"){
     const action=data.action;
     if(!["create","update","remove"].includes(action))fail("INVALID_ACTION");
     const selected=(goals||[]).find(g=>g.id===data.goal_id);
     const goal_id=action==="create"?uuid():data.goal_id;
     if(!id(goal_id))fail("INVALID_GOAL");
     if(action!=="create"&&!selected)fail("INVALID_GOAL");
     const base={month:data.month,goal_id,request_id,
       expected_version:action==="create"?0:selected.version,action};
     if(action==="remove")return {tool:"finance_goals_goal_set",args:base};
     if(!["savings","investible_cash","sinking_fund"].includes(data.kind))
       fail("INVALID_GOAL_KIND");
     const args={...base,kind:data.kind,target_amount:money(data.target_amount),
       account_id:data.account_id||null};
     if(data.kind==="sinking_fund"){
       if(!["rent","insurance"].includes(data.purpose))fail("INVALID_FUND");
       Object.assign(args,{purpose:data.purpose,
         cadence_months:data.purpose==="rent"?3:12,
         due_amount:data.due_amount===""?null:money(data.due_amount),
         due_month:data.due_month||null});
     }
     return {tool:"finance_goals_goal_set",args};
   }
   if(type==="allocation"){
     if(!(goals||[]).some(g=>g.id===data.goal_id))fail("INVALID_GOAL");
     if(!["allocate","release"].includes(data.action)||!text(data.source_reference))
       fail("INVALID_ALLOCATION");
     return {tool:"finance_goals_allocation_set",args:{
       month:data.month,goal_id:data.goal_id,request_id,action:data.action,
       amount:money(data.amount),source_reference:data.source_reference,
       confirmed_by_user:true}};
   }
   if(type==="salary"){
     if(!["set","remove"].includes(data.action))fail("INVALID_ACTION");
     const base={month:data.month,request_id,
       expected_version:plan?.version??0,action:data.action};
     if(data.action==="remove")return {tool:"finance_goals_salary_set",args:base};
     const lines=categories.map(([category])=>({
       category,amount:money(data[category]),accountRole:role[category],
       accountId:(plan?.lines||[]).find(x=>x.category===category)?.accountId??null
     }));
     const total=lines.reduce((sum,x)=>sum+x.amount,0);
     if(!Number.isSafeInteger(total)||total!==money(data.estimated_income))
       fail("SALARY_PLAN_UNBALANCED");
     return {tool:"finance_goals_salary_set",args:{
       ...base,estimated_income:money(data.estimated_income),lines}};
   }
   fail("UNKNOWN_FORM");
 }
 function createController({provider=null,authenticated=false,confirmAction=null,
   uuid=null,goals=[],plan=null}={}){
   const authorised=authenticated&&provider&&typeof provider.invoke==="function";
   const generate=uuid||(()=>globalThis.crypto.randomUUID());
   async function submit(type,data){
     if(!authorised)fail("GOALS_NOT_CONNECTED");
     const command=buildCommand(type,data,{goals,plan,uuid:generate});
     if(typeof confirmAction!=="function"||
       await confirmAction(command)!==true)fail("ACTION_NOT_CONFIRMED");
     // The server must still recheck authenticated identity and explicit approval.
     const result=await provider.invoke(command.tool,command.args);
     if(!result?.committed||result.actualTransfer!==false)
       fail("GOALS_RECEIPT_INVALID");
     return result;
   }
   function mount(root){
     if(!root||typeof root.addEventListener!=="function")fail("INVALID_ROOT");
     root.addEventListener("submit",event=>{
       const form=event.target?.closest?.("[data-goals-form]");
       if(!form)return;event.preventDefault();event.stopImmediatePropagation();
       if(!authorised)return;
       const feedback=root.querySelector("[data-goals-feedback]");
       Promise.resolve(submit(form.dataset.goalsForm,new FormData(form)))
       .then(()=>{if(feedback)feedback.textContent="已收到目標規劃寫入收據；請重新查詢確認。";})
       .catch(()=>{if(feedback)feedback.textContent="未能完成確認或寫入，請檢查資料及連線。";});
     },true);
   }
   return Object.freeze({enabled:!!authorised,submit,mount});
 }
 return Object.freeze({render,buildCommand,createController,escape});
});
