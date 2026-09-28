/* Phase 7 browser speech recognition adapter. Audio is never recorded or uploaded by this module. */
(function(root,factory){
  "use strict";
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.FinanceVoiceInput=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const ERROR_MESSAGES=Object.freeze({
    "not-allowed":"麥克風權限未開啟，請允許後再試。",
    "service-not-allowed":"麥克風權限未開啟，請允許後再試。",
    "audio-capture":"找不到可用麥克風。",
    "no-speech":"沒有辨識到語音，請再試一次。",
    network:"語音辨識服務暫時無法使用。",
    aborted:"語音輸入已取消。",
    "language-not-supported":"此瀏覽器暫不支援繁體中文語音辨識。",
    unknown:"語音辨識暫時失敗，請改用文字輸入。"
  });
  const ACTIVE_STATES=new Set(["starting","listening","processing"]);

  function recognitionConstructor(scope=root){return scope?.SpeechRecognition||scope?.webkitSpeechRecognition||null;}
  function isSupported(scope=root){return typeof recognitionConstructor(scope)==="function";}
  function normalizeError(error){const code=String(error?.error||error?.code||error||"unknown").toLowerCase();return Object.hasOwn(ERROR_MESSAGES,code)?code:"unknown";}
  function mapError(error){const code=normalizeError(error);return Object.freeze({code,message:ERROR_MESSAGES[code],recoverable:true});}
  function appendTranscript(existing,transcript){
    const before=String(existing??"").trimEnd(),next=String(transcript??"").trim();
    if(!next)return before;
    if(!before)return next;
    return `${before}${/[\s，。！？；、,]$/.test(before)?"":"，"}${next}`;
  }

  function create(options={}){
    const scope=options.scope||root,Ctor=options.recognitionConstructor||recognitionConstructor(scope);
    const callbacks={onState:typeof options.onState==="function"?options.onState:()=>{},onInterim:typeof options.onInterim==="function"?options.onInterim:()=>{},onFinal:typeof options.onFinal==="function"?options.onFinal:()=>{},onError:typeof options.onError==="function"?options.onError:()=>{}};
    const supported=typeof Ctor==="function";
    let recognition=null,status=supported?"idle":"unsupported",destroyed=false,seenFinalIndexes=new Set();
    const state=extra=>Object.freeze({supported,status,...extra});
    const emitState=extra=>callbacks.onState(state(extra));
    const setStatus=(next,extra)=>{status=next;emitState(extra);};

    function handleResult(event){
      const finalParts=[],interimParts=[],start=Number.isInteger(event?.resultIndex)?event.resultIndex:0,results=event?.results||[];
      for(let index=start;index<results.length;index+=1){
        const result=results[index],text=String(result?.[0]?.transcript||"").trim();
        if(!text)continue;
        if(result.isFinal){if(!seenFinalIndexes.has(index)){seenFinalIndexes.add(index);finalParts.push(text);}}
        else interimParts.push(text);
      }
      callbacks.onInterim(interimParts.join(" ").trim());
      if(finalParts.length)callbacks.onFinal(finalParts.join(" ").trim());
    }
    function detach(){if(!recognition)return;recognition.onstart=null;recognition.onresult=null;recognition.onerror=null;recognition.onend=null;recognition.onnomatch=null;}
    function ensureRecognition(){
      if(recognition)return recognition;
      recognition=new Ctor();
      recognition.lang=options.lang||"zh-TW";
      recognition.continuous=options.continuous===true;
      recognition.interimResults=options.interimResults!==false;
      recognition.maxAlternatives=1;
      recognition.onstart=()=>{if(!destroyed)setStatus("listening");};
      recognition.onresult=event=>{if(!destroyed)handleResult(event);};
      recognition.onerror=event=>{if(destroyed)return;const mapped=mapError(event);callbacks.onInterim("");callbacks.onError(mapped);setStatus("error",{error:mapped});};
      recognition.onnomatch=()=>{if(destroyed)return;const mapped=mapError("no-speech");callbacks.onError(mapped);setStatus("error",{error:mapped});};
      recognition.onend=()=>{if(!destroyed){callbacks.onInterim("");setStatus("idle");}};
      return recognition;
    }
    function start(){
      if(!supported||destroyed||ACTIVE_STATES.has(status))return false;
      seenFinalIndexes=new Set();callbacks.onInterim("");setStatus("starting");
      try{ensureRecognition().start();return true;}catch(error){const mapped=mapError(error);callbacks.onError(mapped);setStatus("error",{error:mapped});return false;}
    }
    function stop(){
      if(!recognition||destroyed||!ACTIVE_STATES.has(status))return false;
      setStatus("processing");
      try{recognition.stop();return true;}catch(error){const mapped=mapError(error);callbacks.onError(mapped);setStatus("error",{error:mapped});return false;}
    }
    function cancel(){
      if(!recognition||destroyed)return false;
      callbacks.onInterim("");
      try{recognition.abort();setStatus("idle");return true;}catch(error){const mapped=mapError(error);callbacks.onError(mapped);setStatus("error",{error:mapped});return false;}
    }
    function destroy(){
      if(destroyed)return;
      destroyed=true;
      if(recognition){try{recognition.abort();}catch{}detach();recognition=null;}
      status=supported?"idle":"unsupported";
    }
    queueMicrotask(()=>{if(!destroyed)emitState();});
    return Object.freeze({supported,start,stop,cancel,destroy,getState:()=>state(),getRecognition:()=>recognition});
  }

  return Object.freeze({ERROR_MESSAGES,isSupported,mapError,appendTranscript,create});
});
