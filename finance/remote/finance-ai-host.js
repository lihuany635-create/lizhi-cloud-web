(function(root,factory){
  const isNode=typeof module!=="undefined"&&module.exports;
  const api=factory(root,isNode?require("./finance-ai-job-store.js"):root.FinanceAIJobStore,isNode?require("./finance-ai-host-id.js"):root.FinanceAIHostId,isNode?require("../ai/finance-ai-gateway-connector.js"):root.FinanceAIGatewayConnector);
  if(isNode)module.exports=api;
  root.FinanceAIHost=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,Store,HostId,Gateway){
  "use strict";
  const VERSION="phase6b";
  const SAFE_ERROR_CODES=new Set(["AUTH_REQUIRED","AUTH_INVALID","USER_NOT_ALLOWED","RATE_LIMITED","BUSY","OLLAMA_UNAVAILABLE","OLLAMA_TIMEOUT","TIMEOUT","MODEL_OUTPUT_INVALID","CONNECTION_FAILED","CANCELLED"]);
  function safeErrorCode(error){const code=String(error?.code||"");return SAFE_ERROR_CODES.has(code)?code:"AI_HOST_FAILED";}
  function parseGatewayResult(response){let patch;try{patch=JSON.parse(response?.rawText||"{}");}catch{throw Object.assign(new Error("Gateway patch is not JSON."),{code:"MODEL_OUTPUT_INVALID"});}if(!patch||typeof patch!=="object"||Array.isArray(patch))throw Object.assign(new Error("Gateway patch is invalid."),{code:"MODEL_OUTPUT_INVALID"});return {patch,issues:Array.isArray(response?.metrics?.issues)?response.metrics.issues:[],model:String(response?.model||"finance-gateway"),elapsedMs:Number(response?.metrics?.elapsedMs||0)};}
  function createFinanceAIHost(options={}){
    const store=options.store||Store,gateway=options.gateway||Gateway,hostId=options.hostId||HostId.getHostId(),client=options.client,gatewaySettings=options.gatewaySettings||Gateway.DEFAULT_SETTINGS;
    const heartbeatMs=Math.max(1000,Number(options.heartbeatMs||10000)),pollMs=Math.max(250,Number(options.pollMs||1500));
    let active=false,paused=false,busy=false,timer=null,heartbeatTimer=null,currentJob=null,lastError=null,lastCompleted=null;
    const listeners=new Set();
    const snapshot=()=>Object.freeze({active,paused,busy,hostId,currentJob,lastError,lastCompleted,version:VERSION});
    const notify=()=>{const value=snapshot();for(const listener of listeners)try{listener(value);}catch{}};
    const schedule=()=>{if(active&&!paused)timer=setTimeout(poll,pollMs);};
    async function beat(status=busy?"busy":"online"){try{await store.heartbeat(hostId,status,{client,version:VERSION});lastError=null;}catch(error){lastError=error;}notify();}
    async function process(job){
      busy=true;currentJob=job;notify();await beat("busy");
      try{
        const context=job.request_payload||{},started=Date.now(),response=await gateway.generateConstrainedFinancePatch({},gatewaySettings,{context,client});
        const result=parseGatewayResult(response);result.elapsedMs=result.elapsedMs||Date.now()-started;
        await store.complete(job.id,hostId,result,{client});lastCompleted={id:job.id,requestId:job.request_id,status:"completed",elapsedMs:result.elapsedMs};lastError=null;
      }catch(error){const code=safeErrorCode(error);await store.fail(job.id,hostId,code,{client}).catch(()=>{});lastCompleted={id:job.id,requestId:job.request_id,status:"failed",errorCode:code};lastError=error;}
      finally{busy=false;currentJob=null;await beat("online");notify();}
    }
    async function poll(){
      timer=null;if(!active||paused||busy)return schedule();
      try{const job=await store.claim(hostId,{client});if(job)await process(job);else lastError=null;}catch(error){lastError=error;notify();}
      schedule();
    }
    async function start(){if(active)return snapshot();active=true;paused=false;await gateway.checkGatewayHealth(gatewaySettings);await beat("online");heartbeatTimer=setInterval(()=>void beat(),heartbeatMs);void poll();notify();return snapshot();}
    async function stop(){active=false;paused=false;if(timer)clearTimeout(timer);if(heartbeatTimer)clearInterval(heartbeatTimer);timer=heartbeatTimer=null;await store.heartbeat(hostId,"offline",{client,version:VERSION}).catch(()=>{});notify();}
    async function wake(){if(active&&!paused)await beat(busy?"busy":"online");return snapshot();}
    function pause(){paused=true;if(timer)clearTimeout(timer);timer=null;notify();}
    function resume(){if(!active)return;paused=false;notify();void poll();}
    async function health(){const result=await gateway.checkGatewayHealth(gatewaySettings);lastError=null;notify();return result;}
    function subscribe(listener){listeners.add(listener);listener(snapshot());return()=>listeners.delete(listener);}
    return Object.freeze({hostId,start,stop,wake,pause,resume,health,subscribe,snapshot,processJob:process});
  }
  return Object.freeze({VERSION,safeErrorCode,parseGatewayResult,createFinanceAIHost});
});

