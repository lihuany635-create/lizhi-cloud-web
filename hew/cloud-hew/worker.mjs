#!/usr/bin/env node
/**
 * 立之 3D cloud Hew worker. Runs in GitHub Actions with a prebuilt headless
 * `hew-cli`; needs no browser and no user computer.
 *
 * Loop: claim a job -> download the document's current .hew (or create an
 * empty one) -> `hew-cli dispatch <method> <params> --file model.hew` ->
 * upload the next revision if the file changed, upload binary results ->
 * finish. Stops when the queue is empty or the time budget runs out.
 *
 * Env: LIZHI_MODEL_WORKER_URL, LIZHI_MODEL_WORKER_TOKEN, HEW_CLI (path),
 *      WORKER_RUN_ID, WORKER_BUDGET_SECONDS (default 600).
 * Logs carry job ids and states only, never model contents or URLs.
 */
import {spawn} from "node:child_process";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {createHash} from "node:crypto";
import {tmpdir} from "node:os";
import {join} from "node:path";

/** Base64 result fields that become private files. */
export const ARTIFACT_FIELDS={
 png_base64:"png",depth_png_base64:"depth.png",normals_png_base64:"normals.png",
 id_buffer_base64:"ids.bin",pdf_base64:"pdf",bytes_base64:"bin",
};
const MIME={png:"image/png","depth.png":"image/png","normals.png":"image/png",pdf:"application/pdf",
 glb:"model/gltf-binary",stl:"model/stl","3mf":"model/3mf",usdz:"model/vnd.usdz+zip",skp:"application/octet-stream",
 svg:"image/svg+xml",json:"application/json"};
const FORMAT_EXT={glb:"glb",gltf:"glb",stl:"stl","3mf":"3mf",usdz:"usdz",skp:"skp",skp2017:"skp",hew:"hew"};
const MAX_RESULT_CHARS=200_000;
const NEW_DOCUMENT_SCRIPT=[
 {jsonrpc:"2.0",id:1,method:"hew.meta.hello",params:{protocol:1}},
 {jsonrpc:"2.0",id:2,method:"hew.doc.new",params:{}},
].map(f=>JSON.stringify(f)).join("\n")+"\n";

export function runProcess(cmd,args,{maxBytes=64*1024*1024,timeoutMs=240_000}={}){
 return new Promise(resolve=>{
  const p=spawn(cmd,args,{stdio:["ignore","pipe","pipe"]});
  const out=[],err=[];let size=0,killed=false;
  const t=setTimeout(()=>{killed=true;p.kill("SIGKILL")},timeoutMs);
  p.stdout.on("data",d=>{size+=d.length;if(size>maxBytes){killed=true;p.kill("SIGKILL")}else out.push(d)});
  p.stderr.on("data",d=>{if(err.length<64)err.push(d)});
  p.on("close",code=>{clearTimeout(t);resolve({code:killed?-1:code,
   stdout:Buffer.concat(out).toString("utf8"),stderr:Buffer.concat(err).toString("utf8").slice(0,2000)})});
 });
}

const sha=b=>createHash("sha256").update(b).digest("hex");

/**
 * Executes ONE claimed job. Pure orchestration over injected deps so it can
 * be tested without hew-cli or the network.
 */
export async function runJob(job,{api,hew,http,workdir}){
 const file=join(workdir,`${job.job_id}.hew`);
 // 1. Materialize the current revision.
 if(job.download_url){
  const res=await http(job.download_url,{method:"GET"});
  if(!res.ok)return {success:false,mutated:false,error:"WORKER_DOWNLOAD_FAILED"};
  await writeFile(file,Buffer.from(await res.arrayBuffer()));
 }else{
  const script=join(workdir,`${job.job_id}.new.jsonl`);
  await writeFile(script,NEW_DOCUMENT_SCRIPT);
  const made=await hew(["run",script,"--out",file]);
  if(made.code!==0)return {success:false,mutated:false,error:"WORKER_NEW_DOCUMENT_FAILED"};
 }
 const before=sha(await readFile(file));
 // 2. One headless dispatch; hew-cli saves the file back only after a mutation.
 const ran=await hew(["dispatch",job.method,JSON.stringify(job.params??{}),"--file",file]);
 let envelope=null;
 const firstLine=ran.stdout.split("\n").find(l=>l.trim());
 try{envelope=firstLine?JSON.parse(firstLine):null}catch{envelope=null}
 if(envelope&&envelope.error)
  return {success:false,mutated:false,error:"HEW_KERNEL_REFUSED",result:{error:envelope.error}};
 if(ran.code!==0||!envelope||envelope.result===undefined)
  return {success:false,mutated:false,error:"WORKER_HEW_CLI_FAILED"};
 const afterBytes=await readFile(file);
 const mutated=sha(afterBytes)!==before||!job.download_url;
 // 3. Next revision file (an empty new document also becomes revision 1).
 let newPath=null;
 if(mutated){
  const up=await api({op:"upload_url",job_id:job.job_id,kind:"revision"});
  if(!up?.ok)return {success:false,mutated:false,error:"WORKER_REVISION_UPLOAD_URL_FAILED"};
  const put=await http(up.upload_url,{method:"PUT",headers:{"Content-Type":"application/zip"},body:afterBytes});
  if(!put.ok)return {success:false,mutated:false,error:"WORKER_REVISION_UPLOAD_FAILED"};
  newPath=up.path;
 }
 // 4. Binary results -> private files.
 const result={...(envelope.result&&typeof envelope.result==="object"&&!Array.isArray(envelope.result)
   ?envelope.result:{value:envelope.result})};
 const artifacts={};
 const upload=async(key,bytes,ext)=>{
  const u=await api({op:"upload_url",job_id:job.job_id,kind:"artifact",ext});
  if(!u?.ok){artifacts[key]={dropped:"UPLOAD_URL_FAILED"};return}
  const mime=MIME[ext]??"application/octet-stream";
  const r=await http(u.upload_url,{method:"PUT",headers:{"Content-Type":mime},body:bytes});
  artifacts[key]=r.ok?{bucket:"lizhi-model-files",path:u.path,mime,bytes:bytes.length}:{dropped:"UPLOAD_FAILED"};
 };
 for(const [key,ext0] of Object.entries(ARTIFACT_FIELDS)){
  if(typeof result[key]!=="string")continue;
  const b64=result[key];delete result[key];
  const ext=key==="bytes_base64"?(FORMAT_EXT[result.format]??"bin"):ext0;
  await upload(key,Buffer.from(b64,"base64"),ext);
 }
 if(typeof result.svg==="string"&&result.svg.length>32768){
  const svg=result.svg;delete result.svg;
  await upload("svg",Buffer.from(svg,"utf8"),"svg");
 }
 if(Object.keys(artifacts).length)result.artifacts=artifacts;
 let stored=result;
 if(JSON.stringify(stored).length>MAX_RESULT_CHARS){
  const full=Buffer.from(JSON.stringify(result),"utf8");
  const holder={};
  await (async()=>{const u=await api({op:"upload_url",job_id:job.job_id,kind:"artifact",ext:"json"});
   if(!u?.ok)return;const r=await http(u.upload_url,{method:"PUT",headers:{"Content-Type":"application/json"},body:full});
   if(r.ok)holder.result_json={bucket:"lizhi-model-files",path:u.path,mime:"application/json",bytes:full.length};})();
  stored={truncated:true,artifacts:{...(result.artifacts??{}),...holder}};
 }
 return {success:true,mutated,new_path:newPath,result:stored};
}

export async function workLoop({api,hew,http,runId,budgetMs,now=Date.now,log=console.log}){
 const start=now();
 const workdir=await mkdtemp(join(tmpdir(),"lizhi-hew-"));
 let done=0;
 try{
  while(now()-start<budgetMs){
   const claim=await api({op:"claim",run_id:runId});
   if(!claim?.ok){log("claim failed");break}
   if(!claim.job)break;
   const job=claim.job;
   let outcome;
   try{outcome=await runJob(job,{api,hew,http,workdir})}
   catch{outcome={success:false,mutated:false,error:"WORKER_EXCEPTION"}}
   const fin=await api({op:"finish",job_id:job.job_id,...outcome});
   log(`job ${job.job_id} ${outcome.success?"succeeded":"failed"}${outcome.mutated?" (new revision)":""} ack=${fin?.ok===true}`);
   done++;
  }
 }finally{await rm(workdir,{recursive:true,force:true})}
 return done;
}

if(import.meta.url===`file://${process.argv[1]}`){
 const url=process.env.LIZHI_MODEL_WORKER_URL,token=process.env.LIZHI_MODEL_WORKER_TOKEN;
 const cli=process.env.HEW_CLI||"hew-cli";
 if(!url||!token){console.error("worker not configured");process.exit(2)}
 const api=async body=>{
  const r=await fetch(url,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify(body)});
  try{return await r.json()}catch{return null}
 };
 const n=await workLoop({api,hew:args=>runProcess(cli,args),http:(u,i)=>fetch(u,i),
  runId:(process.env.WORKER_RUN_ID||"local").slice(0,120),
  budgetMs:1000*Number(process.env.WORKER_BUDGET_SECONDS||600)});
 console.log(`processed ${n} job(s)`);
}
