#!/usr/bin/env node
/**
 * 立之 CAD cloud worker. Runs in GitHub Actions with a prebuilt headless `cadcraft-cli`;
 * needs no browser and no user computer.
 *
 * Per job: start `cadcraft-cli mcp`, open the drawing's current DXF revision (or start a new
 * drawing), run the one call as an MCP tool, and when the drawing changed save it as the next
 * revision. Rendered PNGs become private files. Stops when the queue is empty or the time
 * budget runs out.
 *
 * Env: LIZHI_CAD_WORKER_URL, LIZHI_CAD_WORKER_TOKEN, CADCRAFT_CLI (path), WORKER_RUN_ID,
 *      WORKER_BUDGET_SECONDS (default 600). Logs carry job ids and states only.
 */
import {spawn} from "node:child_process";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

const MAX_RESULT_CHARS=200_000;
const MUTATING=new Set(["execute","cmdline","script"]);

/** Maps a checked call to the CADCraft MCP tool and arguments. */
export function toolFor(call){
 const pick=keys=>Object.fromEntries(keys.filter(k=>call[k]!==undefined).map(k=>[k,call[k]]));
 switch(call?.op){
  case "execute": return ["execute",{command:call.command,params:call.params??{}}];
  case "cmdline": return ["command_line",{text:call.text}];
  case "script": return ["script",{text:call.text}];
  case "commands": return ["list_commands",pick(["filter"])];
  case "inspect": return ["inspect_drawing",pick(["entities","limit"])];
  case "render": return ["render",pick(["width","height","fit","window"])];
  default: return null;
 }
}

/** A minimal MCP stdio client over one `cadcraft-cli mcp` process. */
export function startMcp(cli,{timeoutMs=120_000}={}){
 const p=spawn(cli,["mcp"],{stdio:["pipe","pipe","pipe"]});
 let buf="",nextId=1;const waiting=new Map();
 p.stdout.setEncoding("utf8");
 p.stdout.on("data",d=>{
  buf+=d;let i;
  while((i=buf.indexOf("\n"))>=0){
   const line=buf.slice(0,i).trim();buf=buf.slice(i+1);
   if(!line)continue;
   let m;try{m=JSON.parse(line)}catch{continue}
   const w=waiting.get(m.id);if(w){waiting.delete(m.id);clearTimeout(w.t);w.resolve(m)}
  }
 });
 p.stderr.on("data",()=>{});
 const fail=e=>{for(const w of waiting.values()){clearTimeout(w.t);w.reject(e)}waiting.clear()};
 p.on("close",()=>fail(Error("CADCRAFT_EXITED")));
 const request=(method,params)=>new Promise((resolve,reject)=>{
  const id=nextId++;
  const t=setTimeout(()=>{waiting.delete(id);reject(Error("CADCRAFT_TIMEOUT"))},timeoutMs);
  waiting.set(id,{resolve,reject,t});
  p.stdin.write(JSON.stringify({jsonrpc:"2.0",id,method,params})+"\n");
 });
 const notify=(method,params)=>p.stdin.write(JSON.stringify({jsonrpc:"2.0",method,...(params?{params}:{})})+"\n");
 return {
  async init(){await request("initialize",{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"lizhi-cad-worker",version:"1"}});notify("notifications/initialized")},
  async tool(name,args){const m=await request("tools/call",{name,arguments:args});
   if(m.error)return {isError:true,error:m.error,content:[]};return m.result??{isError:true,content:[]}},
  close(){try{p.stdin.end()}catch{};setTimeout(()=>{try{p.kill("SIGKILL")}catch{}},2000)},
 };
}

const textOf=r=>(r?.content??[]).filter(c=>c.type==="text").map(c=>c.text).join("\n");
const parse=t=>{try{return JSON.parse(t)}catch{return t}};

/** Executes ONE claimed job with injected deps (testable without cadcraft-cli or network). */
export async function runJob(job,{api,mcp,http,workdir}){
 const mapped=toolFor(job.call);
 if(!mapped)return {success:false,mutated:false,error:"WORKER_UNKNOWN_OP"};
 const file=join(workdir,`${job.job_id}.dxf`), out=join(workdir,`${job.job_id}.out.dxf`);
 await mcp.init();
 if(job.download_url){
  const res=await http(job.download_url,{method:"GET"});
  if(!res.ok)return {success:false,mutated:false,error:"WORKER_DOWNLOAD_FAILED"};
  await writeFile(file,Buffer.from(await res.arrayBuffer()));
  const opened=await mcp.tool("open",{path:file});
  if(opened.isError)return {success:false,mutated:false,error:"WORKER_OPEN_FAILED"};
 }else{
  const made=await mcp.tool("new_drawing",{metric:job.metric!==false});
  if(made.isError)return {success:false,mutated:false,error:"WORKER_NEW_DRAWING_FAILED"};
 }
 const isMutating=MUTATING.has(job.call.op);
 const before=isMutating?textOf(await mcp.tool("inspect_drawing",{})):null;
 const [tool,args]=mapped;
 const r=await mcp.tool(tool,args);
 if(r.isError){
  const detail=r.error??parse(textOf(r));
  return {success:false,mutated:false,error:"CAD_ENGINE_REFUSED",result:{error:typeof detail==="string"?detail.slice(0,2000):detail}};
 }
 const changed=isMutating&&textOf(await mcp.tool("inspect_drawing",{}))!==before;
 const mutated=changed||!job.download_url;
 let newPath=null;
 if(mutated){
  const saved=await mcp.tool("save",{path:out});
  if(saved.isError)return {success:false,mutated:false,error:"WORKER_SAVE_FAILED"};
  const bytes=await readFile(out);
  const up=await api({op:"upload_url",job_id:job.job_id,kind:"revision"});
  if(!up?.ok)return {success:false,mutated:false,error:"WORKER_REVISION_UPLOAD_URL_FAILED"};
  const put=await http(up.upload_url,{method:"PUT",headers:{"Content-Type":"application/dxf"},body:bytes});
  if(!put.ok)return {success:false,mutated:false,error:"WORKER_REVISION_UPLOAD_FAILED"};
  newPath=up.path;
 }
 const texts=(r.content??[]).filter(c=>c.type==="text").map(c=>parse(c.text));
 const result={output:texts.length===1?texts[0]:texts,mutated};
 const images=(r.content??[]).filter(c=>c.type==="image"&&c.mimeType==="image/png"&&typeof c.data==="string");
 if(images.length){
  const bytes=Buffer.from(images[0].data,"base64");
  const u=await api({op:"upload_url",job_id:job.job_id,kind:"artifact",ext:"png"});
  let a={dropped:"UPLOAD_URL_FAILED"};
  if(u?.ok){const put=await http(u.upload_url,{method:"PUT",headers:{"Content-Type":"image/png"},body:bytes});
   a=put.ok?{bucket:"lizhi-cad-files",path:u.path,mime:"image/png",bytes:bytes.length}:{dropped:"UPLOAD_FAILED"}}
  result.artifacts={png_base64:a};
 }
 const stored=JSON.stringify(result).length>MAX_RESULT_CHARS
  ?{truncated:true,mutated,artifacts:result.artifacts??null}:result;
 return {success:true,mutated,new_path:newPath,result:stored};
}

export async function workLoop({api,newMcp,http,runId,budgetMs,now=Date.now,log=console.log}){
 const start=now();const workdir=await mkdtemp(join(tmpdir(),"lizhi-cad-"));let done=0;
 try{
  while(now()-start<budgetMs){
   const claim=await api({op:"claim",run_id:runId});
   if(!claim?.ok){log("claim failed");break}
   if(!claim.job)break;
   const job=claim.job;const mcp=newMcp();let outcome;
   try{outcome=await runJob(job,{api,mcp,http,workdir})}
   catch{outcome={success:false,mutated:false,error:"WORKER_EXCEPTION"}}
   finally{mcp.close()}
   const fin=await api({op:"finish",job_id:job.job_id,...outcome});
   log(`job ${job.job_id} ${outcome.success?"succeeded":"failed"}${outcome.mutated?" (new revision)":""} ack=${fin?.ok===true}`);
   done++;
  }
 }finally{await rm(workdir,{recursive:true,force:true})}
 return done;
}

if(import.meta.url===`file://${process.argv[1]}`){
 const url=process.env.LIZHI_CAD_WORKER_URL,token=process.env.LIZHI_CAD_WORKER_TOKEN;
 const cli=process.env.CADCRAFT_CLI||"cadcraft-cli";
 if(!url||!token){console.error("worker not configured");process.exit(2)}
 const api=async body=>{const r=await fetch(url,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
  try{return await r.json()}catch{return null}};
 const n=await workLoop({api,newMcp:()=>startMcp(cli),http:(u,i)=>fetch(u,i),
  runId:(process.env.WORKER_RUN_ID||"local").slice(0,120),budgetMs:1000*Number(process.env.WORKER_BUDGET_SECONDS||600)});
 console.log(`processed ${n} job(s)`);
}
