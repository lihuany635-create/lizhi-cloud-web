// Native filesystem promises cannot be aborted. Stop waiting and ignore their
// late result so a stalled Android provider cannot lock the folder browser.
export function sourceRead(run,label,{signal,timeoutMs=8000}={}){
 if(signal?.aborted)return Promise.reject(new DOMException('已停止讀取','AbortError'));
 return new Promise((resolve,reject)=>{
  const abort=()=>finish(reject,new DOMException('已停止讀取','AbortError'));
  const timer=setTimeout(()=>finish(reject,Object.assign(Error('讀取逾時：'+label+'。請重試，或選擇更小的資料夾。'),{code:'source_timeout'})),timeoutMs);
  let done=false;
  function finish(complete,value){if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);complete(value)}
  signal?.addEventListener('abort',abort,{once:true});
  Promise.resolve().then(()=>done?undefined:run()).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
