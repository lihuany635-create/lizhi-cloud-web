/* Read-only A22 workbench. Browser never receives OPERATOR or DEVICE secrets. */
(function(){
  const api = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-mobile-agent";
  let renderedHost = null;
  const attachedHosts = new WeakSet();
  let busy = false;
  let screenUrl = null;
  function cleanup(){ if(screenUrl)URL.revokeObjectURL(screenUrl);screenUrl=null; }
  function message(host,msg){const node=host.querySelector('[data-phone-message]');if(node)node.textContent=msg;}
  async function query(action){
    const auth=window.LizhiAuth;
    if(!auth?.user)throw Error('請先登入立之雲端庫');
    const {data,error}=await auth.client.auth.getSession();
    if(error || !data.session)throw Error('登入已逾期，請重新登入');
    const response=await fetch(api+'/'+action,{
      method:'GET',cache:'no-store',
      headers:{Authorization:'Bearer '+data.session.access_token,Accept:'application/json'}
    });
    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body.ok)throw Error(body.error||'手機代理未連線');
    return body;
  }
  async function load(host,action){
    if(busy)return;
    busy=true;
    message(host,'讀取 '+action+' 中…');
    try{
      const body=await query(action);
      if(action==='status'){
        const status=host.querySelector('[data-phone-status]');
        status.textContent='連線：'+(body.active?'控制已啟動':'未啟動')+
          '／觸控：'+(body.touchAllowed?'手機端已允許（請謹慎）':'關閉（唯讀）')+
          '／螢幕：'+(body.screenWidth||'?')+' × '+(body.screenHeight||'?');
      }else if(action==='ui'){
        const nodes=Array.isArray(body.nodes)?body.nodes.filter(n=>n.visibleToUser&&n.boundsValid).slice(0,100):[];
        host.querySelector('[data-phone-ui]').textContent=
          '畫面來源：'+String(body.package||'未知')+'\n'+
          JSON.stringify(nodes.map(n=>({text:n.text,description:n.description,
            bounds:n.bounds,class:n.class})),null,2);
      }else if(action==='screen'){
        const mime=body.mimeType==='image/jpeg'?'image/jpeg':'';
        if(!mime||typeof body.data!=='string'||body.data.length>6000000)throw Error('截圖資料格式不正確');
        const bin=atob(body.data);
        const bytes=new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
        cleanup();
        screenUrl=URL.createObjectURL(new Blob([bytes],{type:mime}));
        host.querySelector('[data-phone-screen]').src=screenUrl;
      }
      message(host,'讀取成功。所有功能目前僅供觀察；未提供遠端點擊。');
    }catch(e){message(host,'讀取失敗：'+(e?.message||'未知錯誤'));}
    finally{busy=false;}
  }
  window.LizhiPhoneAgent={
    mount(host){
      if(!host)return;
      if(renderedHost===host && host.querySelector("[data-phone-status]"))return;
      cleanup();
      renderedHost=host;
      host.innerHTML='<div class="phone-agent-card">'+
        '<div class="phone-agent-controls">'+
        '<button type="button" class="button" data-phone-read="status">檢查連線</button>'+
        '<button type="button" class="button" data-phone-read="ui">讀取 UI</button>'+
        '<button type="button" class="button" data-phone-read="screen">擷取畫面</button></div>'+
        '<p class="phone-agent-state" data-phone-status>尚未讀取狀態</p>'+
        '<p class="phone-agent-state" data-phone-message>只支援本人登入後的唯讀操作。</p>'+
        '<img class="phone-agent-screen" data-phone-screen alt="A22 螢幕畫面" hidden>'+
        '<pre class="phone-agent-ui" data-phone-ui hidden></pre>'+
        '<small>不保存 OPERATOR 金鑰，也不提供點擊、滑動與輸入功能。請勿在金融或敏感畫面使用。</small></div>';
      if(!attachedHosts.has(host)) {
        attachedHosts.add(host);
        host.addEventListener('click',e=>{
        const button=e.target.closest('[data-phone-read]');
        if(!button||!host.contains(button))return;
        const action=button.dataset.phoneRead;
        if(!['status','ui','screen'].includes(action))return;
        if(action==='ui')host.querySelector('[data-phone-ui]').hidden=false;
        if(action==='screen')host.querySelector('[data-phone-screen]').hidden=false;
        load(host,action);
        });
      }
      load(host,'status');
    }
  };
})();
