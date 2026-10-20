// 工程中心改版：專案頁的分頁、子分頁與展開狀態。
// 全部內容一次畫好，切換分頁只改顯示；狀態存在 sessionStorage，重繪後保持在同一頁。
(function(root){
  "use strict";
  const KEY="lizhi-eng-ui";
  let memory={};
  try{memory=JSON.parse(root.sessionStorage?.getItem(KEY)||"{}")||{};}catch{memory={};}
  const save=()=>{try{root.sessionStorage?.setItem(KEY,JSON.stringify(memory));}catch{}};
  const slot=id=>(memory[id]??={tab:"overview",sub:{},rows:[]});

  const api={
    currentTab(id){return slot(id).tab;},
    currentSub(id,tab,fallback){return slot(id).sub[tab]||fallback;},
    isOpen(id,row){return slot(id).rows.includes(row);},
    set(id,tab,sub){const s=slot(id);s.tab=tab;if(sub)s.sub[tab]=sub;save();},
    setSub(id,tab,sub){slot(id).sub[tab]=sub;save();},
    setRow(id,row,open){const s=slot(id);s.rows=s.rows.filter(item=>item!==row);if(open)s.rows.push(row);save();}
  };
  root.EngineeringTabs=api;
  if(typeof document==="undefined")return;

  function show(shell,tab,sub){
    const id=shell.dataset.engProject;
    shell.querySelectorAll("[data-eng-panel]").forEach(el=>{el.hidden=el.dataset.engPanel!==tab;});
    shell.querySelectorAll("[data-eng-tab]").forEach(el=>{const on=el.dataset.engTab===tab;el.classList.toggle("active",on);if(on)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");});
    if(sub){
      const panel=shell.querySelector(`[data-eng-panel="${tab}"]`);
      panel?.querySelectorAll("[data-eng-subpanel]").forEach(el=>{el.hidden=el.dataset.engSubpanel!==sub;});
      panel?.querySelectorAll("[data-eng-sub]").forEach(el=>{const on=el.dataset.engSub===sub;el.classList.toggle("active",on);el.setAttribute("aria-selected",on?"true":"false");});
      api.setSub(id,tab,sub);
    }
    api.set(id,tab);
  }

  document.addEventListener("click",event=>{
    const el=event.target.closest("[data-eng-tab],[data-eng-sub],[data-eng-goto]");
    if(!el)return;
    const shell=el.closest("[data-eng-project]");if(!shell)return;
    event.preventDefault();
    if(el.dataset.engTab){show(shell,el.dataset.engTab);shell.scrollIntoView({block:"start"});window.scrollTo({top:0});return;}
    if(el.dataset.engSub){show(shell,el.closest("[data-eng-panel]").dataset.engPanel,el.dataset.engSub);return;}
    const [tab,target]=el.dataset.engGoto.split(":");
    const panel=shell.querySelector(`[data-eng-panel="${tab}"]`);
    if(!panel)return;
    const isSub=target&&panel.querySelector(`[data-eng-subpanel="${target}"]`);
    show(shell,tab,isSub?target:undefined);
    const row=target&&panel.querySelector(`[data-eng-row="${target}"]`);
    if(row){row.open=true;api.setRow(shell.dataset.engProject,target,true);setTimeout(()=>row.scrollIntoView({behavior:"smooth",block:"start"}),30);}
    else window.scrollTo({top:0});
  },true);

  document.addEventListener("toggle",event=>{
    const row=event.target;
    if(!(row instanceof HTMLDetailsElement)||!row.dataset.engRow)return;
    const shell=row.closest("[data-eng-project]");if(shell)api.setRow(shell.dataset.engProject,row.dataset.engRow,row.open);
  },true);
})(typeof globalThis!=="undefined"?globalThis:this);
