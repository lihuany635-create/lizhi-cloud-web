/* Finance remote UI browser host. Created only after a trusted user click
 * enables LizhiFinanceUIAgent. The browser holds its own Supabase user session;
 * a private Supabase queue holds short-lived structured UI commands only.
 * Service-role tokens never reach this page. All financial writes are performed
 * through the pre-existing FinanceHome UI handlers.
 */
(function(root) {
  "use strict";
  let sessionId = null, enabled = false, timer = null, busy = false;
  let heartbeatDue = 0, consentEpoch = 0, lastError = null, runningJob = null;
  const POLL_MS = 2200, HEARTBEAT_MS = 10000;
  const auth = () => root.LizhiAuth?.client || null;
  const driver = () => root.LizhiFinanceUIAgent || null;
  const uuid = () => root.crypto?.randomUUID?.();
  async function rpc(method,params) {
    if (!root.LizhiAuth?.user || !auth()) throw Error("AUTH_REQUIRED");
    const {data,error} = await auth().rpc(method,params);
    if(error)throw Error("FINANCE_UI_RPC_FAILED_" + method);
    return data;
  }
  const getState=()=>({connected:enabled,session_id:enabled?sessionId:null,
    authorized:!!driver()?.state?.enabled,executing:!!runningJob,last_error:lastError});
  async function tick() {
    if(!enabled||!sessionId||busy)return;
    busy=true;
    try {
      if(!driver()?.state?.enabled)throw Error("FINANCE_UI_CONSENT_REVOKED");
      if(Date.now()>=heartbeatDue) {
        const ping=await rpc("lizhi_finance_ui_heartbeat",{p_session:sessionId});
        if(ping!==true)throw Error("FINANCE_UI_LEASE_EXPIRED");
        heartbeatDue=Date.now()+HEARTBEAT_MS;
      }
      const job=await rpc("lizhi_finance_ui_claim",{p_session:sessionId});
      if(!job||!job.id||!enabled||!driver()?.state?.enabled)return;
      runningJob=job.id;
      let result,success=false,reason=null;
      try {
        if(job.operation==="inspect")result=driver().inspect();
        else if(job.operation==="interact")result=driver().interact(job.params);
        else throw Error("UNSUPPORTED_UI_OPERATION");
        success=result?.ok===true;
        reason=success?null:String(result?.code||"FINANCE_UI_ACTION_REJECTED").slice(0,120);
      }catch{reason="FINANCE_UI_ACTION_FAILED";result={ok:false,code:reason};}
      // A failed acknowledgement NEVER triggers a replay of a UI click.
      if(enabled&&sessionId) {
        const acknowledged=await rpc("lizhi_finance_ui_complete",{
          p_session:sessionId,p_job:job.id,p_ok:success,
          p_result:result,p_error:reason
        });
        if(!acknowledged)throw Error("FINANCE_UI_JOB_RECEIPT_UNKNOWN_NO_RETRY");
      }
      runningJob=null;lastError=null;
    }catch(err) {
      runningJob=null;
      lastError=String(err?.message||"FINANCE_UI_RELAY_FAILED").slice(0,200);
      if(/LEASE_EXPIRED|CONSENT_REVOKED|AUTH_REQUIRED/.test(lastError)) {
        await disconnect({revokeLocal:true});
      }
    }finally{busy=false;}
  }
  async function connect() {
    if(enabled)return getState();
    if(!driver()?.state?.enabled || !root.LizhiAuth?.user)return getState();
    const epoch=consentEpoch;
    const generated=uuid();
    if(!generated){lastError="SECURE_RANDOM_ID_UNAVAILABLE";driver()?.stop();return getState();}
    try {
      const opened=await rpc("lizhi_finance_ui_begin",{p_session:generated});
      if(opened!==true)throw Error("FINANCE_UI_SESSION_DENIED");
      if(epoch!==consentEpoch||!driver()?.state?.enabled){
        try{await rpc("lizhi_finance_ui_close",{p_session:generated});}catch{}
        return getState();
      }
      sessionId=generated;enabled=true;heartbeatDue=0;lastError=null;
      timer=setInterval(()=>void tick(),POLL_MS);
      void tick();
      return getState();
    }catch(err) {
      lastError=String(err?.message||"FINANCE_UI_CONNECT_FAILED").slice(0,160);
      driver()?.stop();
      return getState();
    }
  }
  async function disconnect({revokeLocal=false}={}) {
    consentEpoch++;
    const previous=sessionId;
    enabled=false;sessionId=null;
    if(timer){clearInterval(timer);timer=null;}
    if(revokeLocal&&driver()?.state?.enabled)driver().stop();
    if(previous) {
      try{await rpc("lizhi_finance_ui_close",{p_session:previous});}
      catch{lastError="FINANCE_UI_REMOTE_REVOKE_PENDING_EXPIRY";}
    }
    return getState();
  }
  root.addEventListener("lizhi-finance-remote-consent",e=>{
    if(e?.detail?.enabled===true){void connect();}
    else if(enabled || sessionId){void disconnect();}
  });
  root.addEventListener("pagehide",()=>{if(enabled)void disconnect();});
  root.addEventListener("lizhi-account-logout",()=>{if(enabled)void disconnect();});
  root.LizhiFinanceUIRelay=Object.freeze({get state(){return getState();},disconnect});
})(typeof globalThis !== "undefined" ? globalThis : this);
