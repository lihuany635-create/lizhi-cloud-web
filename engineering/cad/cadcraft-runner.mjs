import {spawn} from "node:child_process";
import {mkdir,readFile,stat} from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {createCadcraftMcpClient,CadcraftMcpError} from "./cadcraft-mcp-client.mjs";

const require=createRequire(import.meta.url);
const {verifyAndRecord}=require("./cad-artifact-manifest.cjs");

export class CadcraftRunError extends Error{constructor(code,message,cause){super(message,{cause});this.name="CadcraftRunError";this.code=code;}}

function runProcess(executable,args,{env={}}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{stdio:["ignore","pipe","pipe"],windowsHide:true,env:{...process.env,...env}});let stdout="",stderr="";
    child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");
    child.stdout.on("data",chunk=>{stdout+=chunk;});child.stderr.on("data",chunk=>{stderr+=chunk;});
    child.on("error",error=>reject(new CadcraftRunError("CADCRAFT_START_FAILED","Unable to start CADCraft CLI.",error)));
    child.on("exit",code=>code===0?resolve({stdout,stderr}):reject(new CadcraftRunError("CADCRAFT_CLI_FAILED",`CADCraft CLI exited with code ${code}: ${stderr||stdout}`)));
  });
}

export function createCadcraftRunner({cliPath,timeoutMs=30000}={}){
  if(typeof cliPath!=="string"||!path.isAbsolute(cliPath))throw new CadcraftRunError("CADCRAFT_PATH_INVALID","CADCraft CLI path must be absolute.");
  return Object.freeze({
    async version(){const result=await runProcess(cliPath,["--version"]);return result.stdout.trim()||result.stderr.trim();},
    async execute(job,{outputDir}={}){
      if(!job?.job_key||typeof outputDir!=="string"||!path.isAbsolute(outputDir))throw new CadcraftRunError("CAD_JOB_INVALID","CAD export job and absolute output directory are required.");
      await mkdir(outputDir,{recursive:true});
      const dxfPath=path.join(outputDir,"drawing.dxf"),svgPath=path.join(outputDir,"drawing.svg"),pngPath=path.join(outputDir,"drawing.png"),configDir=path.join(outputDir,"cadcraft-profile");
      await mkdir(configDir,{recursive:true});
      const client=createCadcraftMcpClient({cliPath,timeoutMs,env:{CADCRAFT_CONFIG_DIR:configDir}});let initialized,before,after;
      try{
        initialized=await client.initialize();
        await client.tool("new_drawing",{metric:true});
        await client.tool("execute",{command:"layer.new",params:{name:"FURNITURE",current:true}});
        for(const operation of job.operations||[])await client.tool("execute",operation);
        before=(await client.tool("inspect_drawing",{entities:true,limit:Math.min(job.expected_entities+10,10000)})).json;
        await client.tool("save",{path:dxfPath});
        await client.tool("new_drawing",{metric:true});
        await client.tool("open",{path:dxfPath});
        after=(await client.tool("inspect_drawing",{entities:true,limit:Math.min(job.expected_entities+10,10000)})).json;
      }catch(error){throw error instanceof CadcraftMcpError?new CadcraftRunError(error.code,error.message,error):error;}
      finally{await client.close();}
      const cliEnv={CADCRAFT_CONFIG_DIR:configDir};
      const infoResult=await runProcess(cliPath,["info",dxfPath],{env:cliEnv});
      let cliInfo;try{cliInfo=JSON.parse(infoResult.stdout);}catch(error){throw new CadcraftRunError("CADCRAFT_INFO_INVALID","CADCraft CLI info output was not JSON.",error);}
      await runProcess(cliPath,["convert",dxfPath,svgPath,"--view","extents"],{env:cliEnv});
      await runProcess(cliPath,["convert",dxfPath,pngPath,"--view","extents"],{env:cliEnv});
      if(Number(cliInfo.entityCount)!==job.expected_entities||Number(after?.entityCount)!==job.expected_entities)throw new CadcraftRunError("CADCRAFT_ENTITY_MISMATCH","CADCraft round-trip entity count did not match the export job.");
      const artifacts={};
      for(const [format,file] of Object.entries({dxf:dxfPath,svg:svgPath,png:pngPath})){
        const bytes=await readFile(file),record=verifyAndRecord({job,format,bytes,revision:job.source_identity.revision});
        artifacts[format]={...record,filename:path.basename(file)};
      }
      return Object.freeze({server_info:initialized?.serverInfo||null,protocol_version:initialized?.protocolVersion||null,mcp_inspection_before:before,mcp_inspection_after:after,cli_info:cliInfo,artifacts,stderr:client.stderr});
    }
  });
}
