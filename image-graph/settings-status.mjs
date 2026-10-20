// 設定選單的「目前狀態」：只讀取畫面上既有的狀態文字並同步顯示，不改任何專案、儲存或連線。
const rules={
 handoff:{source:'#integrationStatus',fallback:'這個入口不使用任務交接',tone:text=>/已連接/.test(text)&&!/尚未/.test(text)?'ok':/等待|暫無|已關閉|重新/.test(text)?'warn':'idle'},
 source:{source:'#sourceLocation',fallback:'尚未連接資料夾',tone:text=>!text||/尚未/.test(text)?'idle':'ok'},
 save:{source:'#saveStatus',fallback:'專案尚未開啟',tone:text=>/失敗/.test(text)?'bad':/已儲存|已保存/.test(text)?'ok':'idle'}
};
const label={handoff:t=>t.replace(/私人交接/g,'任務交接'),source:t=>t,save:t=>t};
const watched=new WeakSet();

function paint(key){
 const rule=rules[key],row=document.querySelector(`[data-settings-status="${key}"]`),out=row?.querySelector('small');
 if(!row||!out)return;
 const text=(document.querySelector(rule.source)?.textContent||'').trim()||rule.fallback;
 out.textContent=label[key](text);
 row.dataset.tone=rule.tone(text);
}

function watch(){
 for(const [key,rule] of Object.entries(rules)){
  const el=document.querySelector(rule.source);
  if(el&&!watched.has(el)){watched.add(el);new MutationObserver(()=>paint(key)).observe(el,{childList:true,characterData:true,subtree:true})}
  paint(key);
 }
}

watch();
// 任務交接列由主程式稍後才加進畫面，出現時再接上
const late=new MutationObserver(()=>{if(document.querySelector('#integrationStatus')&&!watched.has(document.querySelector('#integrationStatus'))){watch();late.disconnect()}});
late.observe(document.body,{childList:true,subtree:true});
setTimeout(()=>{late.disconnect();watch()},8000);
document.querySelector('#workspaceSettings')?.addEventListener('toggle',watch);
// 手機版的設定是底部面板，點面板外的暗色背景就關閉
const menu=document.querySelector('#workspaceSettings');
menu?.addEventListener('pointerdown',event=>{if(event.target===menu&&menu.open){event.preventDefault();menu.open=false}});
