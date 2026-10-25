// Limit inbound requests by UTF-8 bytes BEFORE accumulating the entire body.
// The size guard is intentionally independent of Content-Length (which can be omitted).
export async function readBoundedBody(request,maxBytes=16384){
  const header=request.headers.get("content-length");
  if(header!==null&&(!/^[0-9]+$/.test(header)||Number(header)>maxBytes))
    throw new Error("BODY_TOO_LARGE");
  if(!request.body)return "";
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let bytes=0,text="";
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      if(!value)continue;
      bytes+=value.byteLength;
      if(bytes>maxBytes)throw new Error("BODY_TOO_LARGE");
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  }finally{try{await reader.cancel();}catch{}}
}
