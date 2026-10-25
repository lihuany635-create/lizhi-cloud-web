/* 立之 CAD private MCP command relay. No file bytes, paths, screenshots or CAD engine on server. */
(function () {
  "use strict";
  let sessionId = null;
  let timer = null;
  let busy = false;
  let heartbeatDue = 0;
  let lastError = null;
  let active = false;
  let executingJob = null;
  let consentEpoch = 0;
  const POLL_MS = 2200;
  const LEASE_REFRESH_MS = 10000;

  const auth = () => window.LizhiAuth?.client || null;
  const commandHost = () => window.LizhiCadHost || null;
  function state() {
    return {
      active, sessionId: active ? sessionId : null,
      executing: !!executingJob, lastError,
      note: "登入者的幾何指令暫存中繼，原生 CAD 引擎與 DXF 仍在本機",
    };
  }
  async function rpc(name, args) {
    const client=auth();
    if (!client || !window.LizhiAuth?.user) throw new Error("必須先登入立之雲端庫 Google 帳號");
    const {data,error}=await client.rpc(name,args);
    if(error) throw new Error("CAD 中繼服務尚未就緒或授權不足 ("+name+")");
    return data;
  }
  async function tick() {
    if(!active || busy || !sessionId) return;
    busy=true;
    try {
      if(Date.now() >= heartbeatDue){
        const ok=await rpc("lizhi_cad_heartbeat",{p_session:sessionId});
        if(ok!==true)throw new Error("CAD AI 授權租約過期");
        heartbeatDue=Date.now()+LEASE_REFRESH_MS;
      }
      if(!active) return;
      const job=await rpc("lizhi_cad_claim_next",{p_session:sessionId});
      if(!job || !job.id || !active) return;
      executingJob=job.id;
      let ok=false,result=null,error=null;
      try {
        if(!commandHost()?.commandStatus?.enabled)throw new Error("使用者已停止 CAD AI 操作");
        result=await commandHost().command(job.command,job.params);
        ok=true;
      }catch(e){error=String(e?.message||"CAD 指令執行失敗").slice(0,300);}
      if(active){
        const success=await rpc("lizhi_cad_finish",{
          p_session:sessionId,p_job:job.id,p_ok:ok,
          p_result:ok ? (result ?? null) : null,
          p_error:ok ? null : error
        });
        if(!success)throw new Error("CAD 指令結果未完成登記；請查詢原工作 ID，勿重複送出繪圖");
      }
      executingJob=null;
      lastError=null;
    }catch(e){
      lastError=String(e?.message||"CAD 中繼暫時失去連線");
      // Never automatically retry the same CAD job: drawing operations aren't idempotent.
      executingJob=null;
      if(/租約過期|登入/.test(lastError)) {
        await disconnect();
      }
    }finally{busy=false;}
  }
  async function connect(){
    if(active)return state();
    if(!commandHost()?.commandStatus?.enabled || !commandHost()?.commandStatus?.ready)
      throw new Error("請先在 CAD 頁面手動按下「允許 AI 操作」");
    if(!window.LizhiAuth?.user) throw new Error("立之 CAD MCP 需要登入自己的 Google 帳號");
    const epoch=consentEpoch;
    const id=crypto.randomUUID();
    const opened=await rpc("lizhi_cad_begin_session",{p_session:id});
    if(opened!==true)throw new Error("無法建立已授權的 CAD MCP 工作階段");
    if(epoch!==consentEpoch || !commandHost()?.commandStatus?.enabled) {
      try{await rpc("lizhi_cad_close_session",{p_session:id});}catch{}
      throw new Error("使用者已撤銷 CAD AI 操作，連線取消");
    }
    sessionId=id;
    active=true;
    heartbeatDue=0;
    lastError=null;
    timer=setInterval(()=>{void tick();},POLL_MS);
    void tick();
    return state();
  }
  async function disconnect(){
    consentEpoch++;
    const previous=sessionId;
    active=false;
    sessionId=null;
    if(timer){clearInterval(timer);timer=null;}
    if(previous) {
      // Best effort: a server-side 30s heartbeat timeout also revokes crashed tabs.
      try{await rpc("lizhi_cad_close_session",{p_session:previous});}
      catch {lastError="遠端撤權請求失敗；服務端會因心跳過期自動停止接收新指令。";}
    }
    return state();
  }
  window.LizhiCadRelay={connect,disconnect,get state(){return state();}};
  window.addEventListener("pagehide",()=>{if(active)void disconnect();});
  window.addEventListener("lizhi-account-logout",()=>{if(active)void disconnect();});
})();
