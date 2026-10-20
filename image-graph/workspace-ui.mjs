// Drawer and settings behavior only. No project, storage or network mutations.
export function createWorkspaceUI({doc=document,scope=window}={}){
 const $=s=>doc.querySelector(s),menu=$('#workspaceSettings'),backdrop=$('#workspaceBackdrop');
 let active=null,returnFocus=null,blocked=[];
 const width=()=>scope.innerWidth??globalThis.innerWidth;
 function closeSettings(){menu.open=false}
 function closePanels({restoreFocus=true}={}){
  if(!active)return;
  active.element.classList.remove('open');active.element.removeAttribute('role');active.element.removeAttribute('aria-modal');
  for(const [element,inert] of blocked)element.inert=inert;
  blocked=[];active=null;backdrop.hidden=true;doc.body.classList.remove('drawer-open');
  $('#mobileAssetsBtn').setAttribute('aria-expanded','false');$('#mobileSettingsBtn').setAttribute('aria-expanded','false');
  if(restoreFocus)returnFocus?.focus();returnFocus=null;
 }
 function open(kind){
  const library=kind==='library';if(width()>(library?600:900))return;
  closePanels({restoreFocus:false});closeSettings();returnFocus=doc.activeElement;
  active={element:$(library?'#assetLibrary':'#inspector'),close:$(library?'#mobileCloseLibrary':'#mobileClose')};
  for(const selector of ['header','.workspace-nav','.canvas-column',library?'#inspector':'#assetLibrary','#runsView']){
   const element=$(selector);if(element){blocked.push([element,element.inert]);element.inert=true}
  }
  active.element.classList.add('open');active.element.setAttribute('role','dialog');active.element.setAttribute('aria-modal','true');
  $(library?'#mobileAssetsBtn':'#mobileSettingsBtn').setAttribute('aria-expanded','true');backdrop.hidden=false;doc.body.classList.add('drawer-open');active.close.focus();
 }
 $('#mobileAssetsBtn').onclick=()=>active?.element===$('#assetLibrary')?closePanels():open('library');
 $('#mobileSettingsBtn').onclick=()=>open('inspector');
 $('#mobileCloseLibrary').onclick=()=>closePanels();$('#mobileClose').onclick=()=>closePanels();backdrop.onclick=()=>closePanels();
 menu.addEventListener('click',event=>{if(event.target.closest('button'))closeSettings()});
 doc.addEventListener('pointerdown',event=>{if(menu.open&&!menu.contains(event.target))closeSettings()});
 doc.addEventListener('keydown',event=>{
  if($('#modal')?.open)return;
  if(event.key==='Escape'){if(active){event.preventDefault();closePanels()}else if(menu.open){closeSettings();$('#settingsToggle').focus()}return}
  if(event.key!=='Tab'||!active)return;
  const focusable=[...active.element.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex!==-1&&el.getClientRects().length);
  const first=focusable[0]||active.close,last=focusable.at(-1)||active.close;
  if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus()}
 });
 scope.addEventListener?.('resize',()=>{if(active&&width()>(active.element===$('#assetLibrary')?600:900))closePanels({restoreFocus:false})});
 return {openInspector:()=>open('inspector'),closePanels,closeSettings};
}
