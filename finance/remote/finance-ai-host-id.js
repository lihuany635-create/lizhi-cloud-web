(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAIHostId=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const STORAGE_KEY="lizhi.finance.aiHostId.v1";
  function createHostId(){
    const id=root.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
    return `browser-${id}`.slice(0,120);
  }
  function getHostId(storage=root.localStorage){
    let value="";
    try{value=String(storage?.getItem?.(STORAGE_KEY)||"").trim();}catch{}
    if(/^browser-[a-zA-Z0-9-]{8,112}$/.test(value))return value;
    value=createHostId();
    try{storage?.setItem?.(STORAGE_KEY,value);}catch{}
    return value;
  }
  return Object.freeze({STORAGE_KEY,createHostId,getHostId});
});

