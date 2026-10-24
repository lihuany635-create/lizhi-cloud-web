import {access,readFile,rm} from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {createReadStream} from "node:fs";

const require=createRequire(import.meta.url);
const {prepareJob}=require("./cadcraft-export-job.cjs");
const MAX_BODY=1024*1024;
const send=(res,status,payload,headers={})=>{const body=JSON.stringify(payload);res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":Buffer.byteLength(body),"cache-control":"no-store",...headers});res.end(body);};
async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error("CAD request body is too large."),{code:"CAD_BODY_TOO_LARGE",statusCode:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch(error){throw Object.assign(new Error("CAD request body must be valid JSON."),{code:"CAD_BODY_INVALID",statusCode:400,cause:error});}}

export function createCadApi({store,runner,cliPath}={}){
  if(!store||!runner)throw new TypeError("CAD API store and runner are required.");
  let queue=Promise.resolve();
  const exclusive=operation=>{const next=queue.then(operation,operation);queue=next.catch(()=>{});return next;};
  return Object.freeze({
    async handleRequest(req,res,url){
      if(!url.pathname.startsWith("/api/engineering/cad/"))return false;
      try{
        if(req.method==="GET"&&url.pathname==="/api/engineering/cad/health"){
          try{await access(cliPath);send(res,200,{ok:true,exporter_version:await runner.version(),storage_root:store.rootDir});}catch(error){send(res,503,{ok:false,code:"CADCRAFT_UNAVAILABLE",message:error.message});}return true;
        }
        if(req.method==="GET"&&url.pathname==="/api/engineering/cad/jobs"){
          send(res,200,{jobs:await store.list(url.searchParams.get("projectId"),url.searchParams.get("designId"))});return true;
        }
        if(req.method==="POST"&&url.pathname==="/api/engineering/cad/jobs"){
          const request=await body(req),job=prepareJob(request.spec,{projectId:request.project_id,exporterVersion:"cadcraft-0.12.0"}),existing=await store.get(job.job_key);
          if(existing){send(res,200,{reused:true,record:existing});return true;}
          const record=await exclusive(async()=>{const duplicate=await store.get(job.job_key);if(duplicate)return duplicate;const tempDir=await store.createTemporary(job.job_key);try{return await store.commit({job,execution:await runner.execute(job,{outputDir:tempDir}),tempDir});}catch(error){await rm(tempDir,{recursive:true,force:true});throw error;}});
          send(res,201,{reused:false,record});return true;
        }
        const match=url.pathname.match(/^\/api\/engineering\/cad\/artifacts\/([0-9a-f]{64})\/(dxf|svg|png)$/);
        if(req.method==="GET"&&match){const value=await store.artifact(match[1],match[2]);res.writeHead(200,{"content-type":value.metadata.mime_type,"content-length":value.metadata.byte_size,"content-disposition":`attachment; filename="${path.basename(value.metadata.filename)}"`,"x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; sandbox","cache-control":"private, no-store"});createReadStream(value.file).pipe(res);return true;}
        send(res,404,{ok:false,code:"CAD_ROUTE_NOT_FOUND",message:"CAD route not found."});return true;
      }catch(error){const status=error.statusCode||({CAD_PROJECT_INVALID:400,CAD_SPEC_INVALID:400,CAD_SOURCE_INVALID:400,CAD_JOB_NOT_FOUND:404,CAD_ARTIFACT_NOT_FOUND:404,CAD_STORAGE_ID_INVALID:400}[error.code]||500);send(res,status,{ok:false,code:error.code||"CAD_EXPORT_FAILED",message:error.message||"CAD export failed."});return true;}
    }
  });
}
