/* Lizhi A22 5G read-only workbench v2.
   No operator/device tokens in browser storage, sources, or copy payload.
   User must explicitly request a screenshot or copy a text-only AI summary. */
(function(){
  const api='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-mobile-agent';
  let mountedHost=null;
  let busy=false;
  let screenUrl=null;
  const listeners=new WeakSet();
  let snapshot={status:null,ui:null};
  function setText(host,key,text){
    const node=host.querySelector('[data-phone-'+key+']');
    if(node)node.textContent=text;
  }
  function cleanup(){
    if(screenUrl)URL.revokeObjectURL(screenUrl);
    screenUrl=null;
  }
  function allowedNode(node){
    return !!node && node.visibleToUser===true && node.boundsValid===true &&
      Array.isArray(node.bounds) && node.bounds.length===4;
  }
  function short(value,max=140){
    return String(value==null?'':value).trim().slice(0,max);
  }
  function labelNode(node){
    const text=short(node.text,140);
    const description=short(node.description,140);
    const cls=short(node.class,70).split('.').pop();
    return text || description || cls || '無名稱元件';
  }
  async function query(action){
    const auth=window.LizhiAuth;
    if(!auth?.user)throw Error('請先登入立之雲端庫');
    const {data,error}=await auth.client.auth.getSession();
    if(error||!data.session)throw Error('登入已逾期，請重新登入');
    const response=await fetch(api+'/'+action,{
      method:'GET',
      cache:'no-store',
      headers:{Authorization:'Bearer '+data.session.access_token,Accept:'application/json'}
    });
    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body.ok)throw Error(body.error||'手機代理未連線');
    return body;
  }
  function showStatus(host,status){
    snapshot.status={
      active:status.active===true,
      touchAllowed:status.touchAllowed===true,
      width:status.screenWidth,
      height:status.screenHeight
    };
    setText(host,'status',
      '連線：'+(snapshot.status.active?'已啟動':'未啟動')+
      '  ·  觸控：'+(snapshot.status.touchAllowed?'已開啟（手機端可關閉）':'關閉（唯讀）')+
      '  ·  畫面：'+(status.screenWidth||'?')+' × '+(status.screenHeight||'?'));
  }
  function showUi(host,body){
    const all=Array.isArray(body.nodes)?body.nodes:[];
    const usable=all.filter(allowedNode).slice(0,100);
    snapshot.ui={
      package:short(body.package,160),
      total:all.length,
      usable:usable.map(n=>({
        label:labelNode(n),
        text:short(n.text,140),
        description:short(n.description,140),
        type:short(n.class,100),
        bounds:n.bounds.map(Number)
      }))
    };
    setText(host,'ui-count','有效可見元件 '+usable.length+' / '+all.length+'（僅展示前 100 個）');
    setText(host,'ui-package','目前 App：'+(snapshot.ui.package||'未知'));
    const list=host.querySelector('[data-phone-ui-list]');
    if(!list)return;
    list.replaceChildren();
    if(!usable.length){
      const empty=document.createElement('li');
      empty.textContent='未找到座標有效且可見的元件。';
      list.append(empty);
    }
    for(const entry of snapshot.ui.usable){
      const li=document.createElement('li');
      li.className='phone-agent-element';
      const title=document.createElement('strong');
      title.textContent=entry.label;
      const description=document.createElement('small');
      description.textContent=entry.type.split('.').pop()+
        ' · ('+entry.bounds.join(', ')+')';
      li.append(title,description);
      list.append(li);
    }
    host.querySelector('[data-phone-copy]').disabled=false;
  }
  function showScreen(host,body){
    if(body.mimeType!=='image/jpeg'||typeof body.data!=='string'||body.data.length>6000000){
      throw Error('截圖格式不符或內容過大');
    }
    const binary=atob(body.data);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    cleanup();
    screenUrl=URL.createObjectURL(new Blob([bytes],{type:'image/jpeg'}));
    const image=host.querySelector('[data-phone-screen]');
    const placeholder=host.querySelector('[data-phone-screen-empty]');
    image.src=screenUrl;
    image.hidden=false;
    placeholder.hidden=true;
  }
  function summary(){
    const data={
      purpose:'A22 5G Android 螢幕結構分析（唯讀）',
      generatedAt:new Date().toISOString(),
      deviceStatus:snapshot.status,
      package:snapshot.ui?.package||null,
      totalNodes:snapshot.ui?.total||0,
      validVisibleElements:snapshot.ui?.usable||[],
      warning:'此摘要不包含截圖或連線金鑰；不可依這些資料自行啟用觸控或對失效座標點擊。'
    };
    return JSON.stringify(data,null,2);
  }
  async function copySummary(host){
    if(!snapshot.ui){setText(host,'message','請先讀取 UI，再複製摘要。');return;}
    if(!navigator.clipboard?.writeText){setText(host,'message','瀏覽器不支援剪貼簿寫入。');return;}
    try{
      await navigator.clipboard.writeText(summary());
      setText(host,'message','已複製 AI 文字摘要。請檢查內容，再自行貼給 AI；截圖不會一併傳送。');
    }catch{
      setText(host,'message','無法複製，請確認瀏覽器剪貼簿權限。');
    }
  }
  async function load(host,action){
    if(busy)return;
    busy=true;
    host.querySelectorAll('[data-phone-read]').forEach(button=>button.disabled=true);
    setText(host,'message','正在讀取 '+({status:'連線狀態',ui:'UI 元件',screen:'手機截圖'}[action]||action)+'…');
    try{
      const body=await query(action);
      if(action==='status')showStatus(host,body);
      else if(action==='ui')showUi(host,body);
      else if(action==='screen')showScreen(host,body);
      setText(host,'message','讀取成功。手機控制仍依手機端授權；本頁只提供唯讀功能。');
    }catch(error){
      const msg=short(error?.message||'未知錯誤',200);
      setText(host,'message','讀取失敗：'+msg);
      if(action==='status'){
        setText(host,'status','無法取得最新連線狀態');
        snapshot.status=null;
      }
    }finally{
      busy=false;
      host.querySelectorAll('[data-phone-read]').forEach(button=>button.disabled=false);
    }
  }
  window.LizhiPhoneAgent={
    mount(host){
      if(!host)return;
      if(mountedHost===host && host.querySelector('[data-phone-status]'))return;
      cleanup();
      snapshot={status:null,ui:null};
      mountedHost=host;
      host.innerHTML='<div class="phone-agent-card">'+
        '<div class="phone-agent-controls">'+
          '<button type="button" class="button" data-phone-read="status">檢查連線</button>'+
          '<button type="button" class="button" data-phone-read="ui">讀取 UI</button>'+
          '<button type="button" class="button" data-phone-read="screen">擷取畫面</button>'+
          '<button type="button" class="button" data-phone-copy disabled>複製 AI 文字摘要</button>'+
        '</div>'+
        '<p class="phone-agent-state" data-phone-status>尚未讀取連線狀態</p>'+
        '<p class="phone-agent-state" data-phone-message>先在私人 A22 上啟動雲端配對，保持觸控權限關閉。</p>'+
        '<div class="phone-agent-columns">'+
          '<section class="phone-agent-display" aria-label="手機畫面">'+
            '<h2>手機畫面</h2>'+
            '<div class="phone-agent-screen-empty" data-phone-screen-empty>按「擷取畫面」取得手機目前的螢幕。<small>不會自動擷取或傳送給 AI。</small></div>'+
            '<img class="phone-agent-screen" data-phone-screen alt="A22 5G 螢幕畫面" hidden>'+
          '</section>'+
          '<section class="phone-agent-inspector" aria-label="UI 元件">'+
            '<h2>畫面元件</h2>'+
            '<p data-phone-ui-package>目前 App：尚未讀取</p>'+
            '<p data-phone-ui-count>按「讀取 UI」檢視可見元素。</p>'+
            '<ol class="phone-agent-elements" data-phone-ui-list></ol>'+
          '</section>'+
        '</div>'+
        '<p class="phone-agent-safety">只在無敏感資訊的畫面測試。複製操作須本人主動點擊；不會複製 DEVICE 或 OPERATOR 金鑰，也不會提供遠端點擊、滑動或輸入。</p>'+
      '</div>';
      if(!listeners.has(host)){
        listeners.add(host);
        host.addEventListener('click',event=>{
          const button=event.target.closest('button');
          if(!button||!host.contains(button))return;
          if(button.hasAttribute('data-phone-copy')){copySummary(host);return;}
          const action=button.dataset.phoneRead;
          if(!['status','ui','screen'].includes(action))return;
          load(host,action);
        });
      }
      load(host,'status');
    }
  };
})();
