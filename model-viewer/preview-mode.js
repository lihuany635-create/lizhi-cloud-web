(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const sample=$('sampleSel'),pane=$('modelPreview'),image=$('previewImage');
  const base='revisions/hades-v2.4/';
  const scenes={
    'hades-house':{name:'哈德斯家',file:'hades-house.glb?v=2.4-20261022',review:base,views:[
      ['一樓俯視','H24_1F'],['二樓俯視','H24_2F'],['完整外觀','H24_EXTERIOR'],
      ['主角房','H24_BEDROOM'],['二樓走廊','H24_HALL'],['二樓起居區','H24_LOUNGE'],
      ['書房','H24_STUDY'],['早餐桌','H24_BREAKFAST'],['一樓客廳','H24_LIVING'],
      ['廚房','H24_KITCHEN'],['一樓閱讀工作角','H24_DEN'],['主角書桌','H24_DESK']
    ]},
    'reality-home':{name:'現實主角家',file:'reality-home.glb?v=2.3-merged-20261022',hero:'HERO_reality_home'},
    'reality-highschool':{name:'現實高中',file:'reality-highschool.glb?v=2.3-merged-20261022',hero:'HERO_highschool'},
    'xiji-station':{name:'溪磯鎮車站',file:'xiji-station.glb?v=2.3-merged-20261022',hero:'HERO_station'},
    'lahudi-academy':{name:'拉乎迪學院',file:'lahudi-academy.glb?v=2.3-merged-20261022',hero:'HERO_academy'}
  };
  let active=false,rendererAvailable=false,unavailable=false,zoom=1,onClose=null,onOpen=null;
  function key(){return scenes[sample.value]?sample.value:'reality-home';}
  const initial=(location.hash||'').slice(1).replace(/-v23$/,'');
  if(scenes[initial])sample.value=initial;
  function setZoom(value){
    zoom=Math.max(1,Math.min(3,Number(value)||1));
    $('previewZoom').value=String(Math.round(zoom*100));
    $('previewZoomOut').textContent=Math.round(zoom*100)+'%';
    image.style.width=Math.round(zoom*100)+'%';
  }
  function showView(index){
    const scene=scenes[key()],views=scene.views||[['完整外觀',scene.hero]];
    index=Math.max(0,Math.min(views.length-1,index));
    const view=views[index];
    $('previewShot').value=String(index);
    $('previewImageStatus').textContent='正在讀取配置圖…';
    image.alt=scene.name+'｜'+view[0];
    image.src=scene.views?base+'previews/'+view[1]+'.jpg':'fallback-previews/'+view[1]+'.jpg';
    Array.from($('previewFloors').children).forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    setZoom(1);$('previewViewport').scrollTo(0,0);
  }
  function refresh(){
    const scene=scenes[key()],views=scene.views||[['完整外觀',scene.hero]];
    $('fileName').textContent=scene.name+' · 圖片預覽';
    $('previewTitle').textContent=scene.name+'｜配置圖預覽';
    $('previewDownload').href=scene.file;
    $('previewReview').href=scene.review||'candidates/v2.3/';
    $('previewFloors').replaceChildren();$('previewShot').replaceChildren();
    views.forEach((view,i)=>{
      const option=document.createElement('option');option.value=String(i);option.textContent=view[0];$('previewShot').append(option);
      if(i<3){const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=view[0];button.onclick=()=>showView(i);$('previewFloors').append(button);}
    });
    $('previewMessage').textContent=unavailable?'此瀏覽器目前無法啟用 3D，已切換為圖片預覽。可切換視角、放大或下載模型。':'圖片預覽模式。可切換視角、放大，或返回 3D。';
    $('previewBack').hidden=!rendererAvailable||unavailable;
    showView(key()==='hades-house'?1:0);
  }
  function open(options){
    if(options&&options.unavailable)unavailable=true;
    if(onOpen)onOpen();
    active=true;pane.hidden=false;$('ov').hidden=true;$('hint').hidden=true;$('houseViews').hidden=true;
    document.querySelector('.panel').hidden=true;
    if(unavailable){sample.onchange=null;$('fileIn').disabled=true;document.querySelector('label[for="fileIn"]').hidden=true;}
    refresh();
  }
  function close(){
    if(!rendererAvailable||unavailable)return;
    active=false;pane.hidden=true;document.querySelector('.panel').hidden=false;$('hint').hidden=false;
    $('houseViews').hidden=key()!=='hades-house';
    if(onClose)onClose();
  }
  image.onload=()=>{$('previewImageStatus').textContent=image.alt+' · 圖片預覽，可放大檢查';};
  image.onerror=()=>{$('previewImageStatus').textContent='預覽圖讀取失敗。可開啟完整配置圖或下載 GLB 模型。';};
  $('openPreview').onclick=()=>open();$('previewBack').onclick=close;
  $('previewRetry').onclick=()=>location.reload();
  $('previewShot').onchange=event=>showView(Number(event.target.value));
  $('previewZoom').oninput=event=>setZoom(Number(event.target.value)/100);
  $('previewReset').onclick=()=>{setZoom(1);$('previewViewport').scrollTo(0,0);};
  sample.addEventListener('change',()=>{
    if(!active)return;
    history.replaceState(null,'','#'+key());refresh();
  });
  window.addEventListener('hashchange',()=>{
    const next=location.hash.slice(1).replace(/-v23$/,'');
    if(active&&scenes[next]){sample.value=next;refresh();}
  });
  window.GLBPreview={open,ready(closeCallback,openCallback){rendererAvailable=true;onClose=closeCallback;onOpen=openCallback;},get active(){return active;}};
})();
