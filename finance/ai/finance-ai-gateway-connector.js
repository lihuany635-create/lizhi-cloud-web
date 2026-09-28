(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAIGatewayConnector=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const DEFAULT_SETTINGS=Object.freeze({provider:"finance-gateway",baseUrl:"http://127.0.0.1:4181",timeout:30000});
  class GatewayConnectorError extends Error{constructor(code,message,details={},cause){super(message,{cause});this.name="GatewayConnectorError";this.code=code;this.details=details;}}
  function isLoopbackUrl(value){let url;try{url=new URL(String(value));}catch{return false;}return ["127.0.0.1","localhost","[::1]"].includes(url.hostname);}
  function normalizeSettings(input={}){
    let url;try{url=new URL(String(input.baseUrl||DEFAULT_SETTINGS.baseUrl).trim());}catch(cause){throw new GatewayConnectorError("INVALID_BASE_URL","Gateway URL 格式不正確。",{},cause);}
    const local=url.protocol==="http:"&&["127.0.0.1","localhost","[::1]"].includes(url.hostname),secure=url.protocol==="https:";
    if(!local&&!secure)throw new GatewayConnectorError("UNSAFE_BASE_URL","Gateway URL 必須是本機 HTTP 或 HTTPS。");
    const timeout=Number(input.timeout??DEFAULT_SETTINGS.timeout);if(!Number.isSafeInteger(timeout)||timeout<1000||timeout>60000)throw new GatewayConnectorError("INVALID_TIMEOUT","Gateway timeout 必須是 1000 到 60000 毫秒。");
    return Object.freeze({provider:"finance-gateway",baseUrl:url.href.replace(/\/$/,""),timeout});
  }
  async function accessToken(){
    const auth=root.LizhiAuth?.client?.auth;if(!auth?.getSession)throw new GatewayConnectorError("AUTH_REQUIRED","請先登入立之雲端庫。");
    const {data,error}=await auth.getSession();const token=data?.session?.access_token;
    if(error||!token)throw new GatewayConnectorError("AUTH_REQUIRED","登入狀態已失效，請重新登入。",{},error);
    return token;
  }
  function requestId(){if(root.crypto?.randomUUID)return root.crypto.randomUUID();return `finance-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
  async function gatewayRequest(path,{settings=DEFAULT_SETTINGS,method="GET",body,signal,authorized=false}={}){
    const config=normalizeSettings(settings),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeout),relay=()=>controller.abort();
    if(signal){if(signal.aborted)relay();else signal.addEventListener("abort",relay,{once:true});}
    try{
      const headers=body?{"content-type":"application/json"}:{};if(authorized)headers.authorization=`Bearer ${await accessToken()}`;
      const requestOptions={method,headers,body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:"no-store"};
      if(isLoopbackUrl(config.baseUrl))requestOptions.targetAddressSpace="loopback";
      const response=await fetch(`${config.baseUrl}${path}`,requestOptions);
      let payload={};try{payload=await response.json();}catch{}
      if(!response.ok){const code=payload?.error?.code||"GATEWAY_ERROR";throw new GatewayConnectorError(code,`Finance AI Gateway 回傳 HTTP ${response.status}。`,{status:response.status});}
      return payload;
    }catch(error){
      if(error instanceof GatewayConnectorError)throw error;
      if(controller.signal.aborted){if(signal?.aborted)throw new GatewayConnectorError("CANCELLED","已取消本機模型解析。",{},error);throw new GatewayConnectorError("TIMEOUT","Finance AI Gateway 回應逾時。",{timeout:config.timeout},error);}
      throw new GatewayConnectorError("CONNECTION_FAILED","無法連線 Finance AI Gateway。",{},error);
    }finally{clearTimeout(timer);signal?.removeEventListener("abort",relay);}
  }
  async function checkGatewayHealth(settings=DEFAULT_SETTINGS,{signal}={}){const data=await gatewayRequest("/health",{settings,signal});return Object.freeze({connected:data.status==="ok",service:data.service,version:data.version});}
  async function generateConstrainedFinancePatch(promptPackage,settings=DEFAULT_SETTINGS,{signal,context}={}){
    if(!context?.draft)throw new GatewayConnectorError("INVALID_CONTEXT","缺少 Canonical Finance Draft context。");
    const data=await gatewayRequest("/finance/parse",{settings,method:"POST",authorized:true,signal,body:{task:"finance_parse",requestId:requestId(),rawText:context.rawText,draft:context.draft,lockedFields:context.lockedFields,typeHints:context.typeHints,allowedValues:{types:context.allowedValues.types||[],accounts:context.allowedValues.accounts||[],creditCards:context.allowedValues.creditCards||[],categories:context.allowedValues.categories||[]}}});
    return Object.freeze({rawText:JSON.stringify(data.patch||{}),model:"finance-gateway",metrics:Object.freeze({requestId:data.requestId,elapsedMs:data.elapsedMs,issues:data.issues||[]})});
  }
  return Object.freeze({DEFAULT_SETTINGS,GatewayConnectorError,isLoopbackUrl,normalizeSettings,checkGatewayHealth,generateConstrainedFinancePatch});
});
