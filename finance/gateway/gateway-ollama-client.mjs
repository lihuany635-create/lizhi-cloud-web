export class GatewayOllamaError extends Error{
  constructor(status,code,message){super(message);this.name="GatewayOllamaError";this.status=status;this.code=code;}
}
export async function generateGatewayPatch({prompt,config,fetchImpl=fetch,signal}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeoutMs),relay=()=>controller.abort();
  if(signal){if(signal.aborted)relay();else signal.addEventListener("abort",relay,{once:true});}
  try{
    const response=await fetchImpl(`${config.ollamaBaseUrl}/api/generate`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({model:config.model,prompt,stream:false,format:"json",options:{temperature:0,num_predict:220}}),signal:controller.signal});
    if(!response.ok)throw new GatewayOllamaError(502,"OLLAMA_UNAVAILABLE","The local model is unavailable");
    let body;try{body=await response.json();}catch{throw new GatewayOllamaError(502,"MODEL_OUTPUT_INVALID","The local model returned an invalid response");}
    if(typeof body?.response!=="string")throw new GatewayOllamaError(502,"MODEL_OUTPUT_INVALID","The local model returned an invalid response");
    return body.response;
  }catch(error){
    if(error instanceof GatewayOllamaError)throw error;
    if(controller.signal.aborted)throw new GatewayOllamaError(504,"OLLAMA_TIMEOUT","The local model timed out");
    throw new GatewayOllamaError(502,"OLLAMA_UNAVAILABLE","The local model is unavailable");
  }finally{clearTimeout(timer);signal?.removeEventListener("abort",relay);}
}

