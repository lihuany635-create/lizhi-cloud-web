export function createGatewayLogger(sink=console){
  function write(level,event,details={}){const safe={event,time:new Date().toISOString(),requestId:details.requestId||null,route:details.route||null,status:details.status||null,code:details.code||null,elapsedMs:details.elapsedMs||null};(sink[level]||sink.log).call(sink,JSON.stringify(safe));}
  return Object.freeze({info:(event,details)=>write("info",event,details),warn:(event,details)=>write("warn",event,details),error:(event,details)=>write("error",event,details)});
}
