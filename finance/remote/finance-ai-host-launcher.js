(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.FinanceAIHostLauncher=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const PROTOCOL_URL="lizhi-finance-ai://start";
  const MOBILE_PATTERN=/Android|iPhone|iPad|iPod|Mobile/i;
  const WINDOWS_PATTERN=/Windows/i;

  function environment(input={}){
    const userAgent=String(input.userAgent??root.navigator?.userAgent??"");
    const platform=String(input.platform??root.navigator?.platform??"");
    const mobile=MOBILE_PATTERN.test(userAgent);
    const windows=WINDOWS_PATTERN.test(`${userAgent} ${platform}`);
    return Object.freeze({mobile,windows,canLaunch:windows&&!mobile});
  }

  function launch(input={}){
    const current=environment(input);
    if(!current.canLaunch)return Object.freeze({launched:false,reason:current.mobile?"mobile_device":"unsupported_device"});
    const navigate=input.navigate||((url)=>root.location.assign(url));
    navigate(PROTOCOL_URL);
    return Object.freeze({launched:true,reason:null,url:PROTOCOL_URL});
  }

  return Object.freeze({PROTOCOL_URL,environment,launch});
});
