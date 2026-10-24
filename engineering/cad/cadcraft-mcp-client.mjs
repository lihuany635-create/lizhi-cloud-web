import {spawn} from "node:child_process";

export class CadcraftMcpError extends Error {
  constructor(code,message,cause){super(message,{cause});this.name="CadcraftMcpError";this.code=code;}
}

export function createCadcraftMcpClient({cliPath,timeoutMs=30000,env={}}={}){
  if(typeof cliPath!=="string"||!cliPath)throw new CadcraftMcpError("CADCRAFT_PATH_REQUIRED","CADCraft CLI path is required.");
  const child=spawn(cliPath,["mcp"],{stdio:["pipe","pipe","pipe"],windowsHide:true,env:{...process.env,...env}});
  let nextId=1,stdout="",stderr="",closed=false;
  const pending=new Map();
  child.stderr.setEncoding("utf8");
  child.stderr.on("data",chunk=>{stderr=(stderr+chunk).slice(-65536);});
  child.stdout.setEncoding("utf8");
  child.stdout.on("data",chunk=>{
    stdout+=chunk;
    while(stdout.includes("\n")){
      const index=stdout.indexOf("\n"),line=stdout.slice(0,index).trim();stdout=stdout.slice(index+1);
      if(!line)continue;
      let message;
      try{message=JSON.parse(line);}catch(error){failAll(new CadcraftMcpError("CADCRAFT_PROTOCOL_INVALID","CADCraft MCP returned invalid JSON.",error));continue;}
      if(message.id==null||!pending.has(message.id))continue;
      const item=pending.get(message.id);pending.delete(message.id);clearTimeout(item.timer);
      if(message.error)item.reject(new CadcraftMcpError("CADCRAFT_RPC_ERROR",message.error.message||"CADCraft MCP request failed."));
      else item.resolve(message.result);
    }
  });
  const failAll=error=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(error);}pending.clear();};
  child.on("error",error=>failAll(new CadcraftMcpError("CADCRAFT_START_FAILED","Unable to start CADCraft MCP.",error)));
  child.on("exit",code=>{closed=true;if(pending.size)failAll(new CadcraftMcpError("CADCRAFT_EXITED",`CADCraft MCP exited with code ${code}. ${stderr}`.trim()));});
  const send=message=>{if(closed||!child.stdin.writable)throw new CadcraftMcpError("CADCRAFT_CLOSED","CADCraft MCP is not running.");child.stdin.write(JSON.stringify(message)+"\n");};
  const request=(method,params={})=>new Promise((resolve,reject)=>{
    const id=nextId++,timer=setTimeout(()=>{pending.delete(id);reject(new CadcraftMcpError("CADCRAFT_TIMEOUT",`Timed out waiting for ${method}.`));},timeoutMs);
    timer.unref?.();pending.set(id,{resolve,reject,timer});
    try{send({jsonrpc:"2.0",id,method,params});}catch(error){clearTimeout(timer);pending.delete(id);reject(error);}
  });
  const notify=(method,params={})=>send({jsonrpc:"2.0",method,params});
  async function tool(name,args={}){
    const result=await request("tools/call",{name,arguments:args});
    const text=(result?.content||[]).filter(item=>item.type==="text").map(item=>item.text).join("\n");
    if(result?.isError)throw new CadcraftMcpError("CADCRAFT_TOOL_FAILED",`${name}: ${text}`);
    let json=null;if(text){try{json=JSON.parse(text);}catch{json={text};}}
    return{result,json,text};
  }
  async function initialize(){
    const result=await request("initialize",{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"lizhi-engineering-cad",version:"1.0.0"}});
    notify("notifications/initialized");return result;
  }
  async function close(){
    if(closed)return;closed=true;failAll(new CadcraftMcpError("CADCRAFT_CLOSED","CADCraft MCP client closed."));
    child.stdin.end();await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},1000);timer.unref?.();child.once("exit",()=>{clearTimeout(timer);resolve();});});
  }
  return Object.freeze({initialize,request,tool,close,get stderr(){return stderr;}});
}
