import {mkdir,readFile,writeFile,appendFile,open,rename} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const Validator=require("./knowledge-weaving-validator.js");
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const MAX_BODY_BYTES=1024*1024;

export function createProposalInbox(options={}){
  const dataDir=path.resolve(options.dataDir||path.join(process.cwd(),".local-data","knowledge-weaving"));
  const inboxDir=path.join(dataDir,"inbox");
  const auditFile=path.join(dataDir,"audit.jsonl");
  let mutationQueue=Promise.resolve();

  const serialize=operation=>{
    const next=mutationQueue.then(operation,operation);
    mutationQueue=next.catch(()=>{});
    return next;
  };

  async function initialize(){await mkdir(inboxDir,{recursive:true});}
  function proposalPath(id){if(!SAFE_ID.test(String(id||"")))throw new Error("Proposal id 只能使用英數、點、底線或連字號，最長 128 字元");return path.join(inboxDir,`${id}.json`);}
  function auditEvent({proposal_id,event_type,actor,details={},schema_version=1}){
    if(!["nanobot","user","system"].includes(actor))throw new Error("Audit actor 無效");
    return {event_id:randomUUID(),proposal_id:String(proposal_id||"unknown"),event_type,timestamp:new Date().toISOString(),actor,schema_version,details};
  }
  async function appendAudit(event){await initialize();await appendFile(auditFile,JSON.stringify(event)+"\n",{encoding:"utf8",flag:"a"});return event;}
  async function audit(input){return serialize(()=>appendAudit(auditEvent(input)));}
  async function readJson(file){try{return JSON.parse(await readFile(file,"utf8"));}catch(error){if(error.code==="ENOENT")return null;throw error;}}
  async function atomicCreate(file,data){
    const handle=await open(file,"wx");
    try{await handle.writeFile(JSON.stringify(data,null,2)+"\n","utf8");}finally{await handle.close();}
  }
  async function listProposals(){
    await initialize();
    const {readdir}=await import("node:fs/promises");
    const files=(await readdir(inboxDir)).filter(name=>name.endsWith(".json")).sort();
    const rows=[];
    for(const file of files){const proposal=await readJson(path.join(inboxDir,file));if(proposal)rows.push(proposal);}
    return rows.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
  }
  async function listAudit(proposalId=""){
    await initialize();let text="";
    try{text=await readFile(auditFile,"utf8");}catch(error){if(error.code!=="ENOENT")throw error;}
    return text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)).filter(event=>!proposalId||event.proposal_id===proposalId);
  }
  async function submit(proposal,actor="nanobot"){
    return serialize(async()=>{
      await initialize();
      const validation=Validator.validateAiSubmission(proposal);
      if(!validation.valid){
        await appendAudit(auditEvent({proposal_id:proposal?.id||"unknown",event_type:"proposal_validation_failed",actor,details:{errors:validation.errors},schema_version:Number.isInteger(proposal?.schema_version)?proposal.schema_version:0}));
        return {ok:false,status:422,error:"Proposal validation failed",errors:validation.errors};
      }
      let file;
      try{file=proposalPath(proposal.id);}catch(error){
        await appendAudit(auditEvent({proposal_id:proposal?.id||"unknown",event_type:"proposal_validation_failed",actor,details:{errors:[error.message]},schema_version:proposal?.schema_version||0}));
        return {ok:false,status:422,error:"Proposal validation failed",errors:[error.message]};
      }
      const stored={...proposal,inbox_source:actor};
      try{await atomicCreate(file,stored);}catch(error){
        if(error.code!=="EEXIST")throw error;
        await appendAudit(auditEvent({proposal_id:proposal.id,event_type:"proposal_validation_failed",actor,details:{errors:["duplicate_proposal_id"],message:"重複 Proposal ID；既有資料未被覆蓋"},schema_version:proposal.schema_version}));
        return {ok:false,status:409,error:"duplicate_proposal_id",errors:["重複 Proposal ID；既有資料未被覆蓋"]};
      }
      const event=await appendAudit(auditEvent({proposal_id:proposal.id,event_type:"proposal_created",actor,details:{status:proposal.status,source:actor},schema_version:proposal.schema_version}));
      return {ok:true,status:201,proposal:stored,audit_event:event};
    });
  }
  async function readBody(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY_BYTES)throw Object.assign(new Error("Request body too large"),{status:413});chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString("utf8"));}
  async function handleRequest(req,res,url){
    const json=(status,value)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(value));};
    if(req.method==="GET"&&url.pathname==="/api/weaving/inbox"){json(200,{schema_version:1,proposals:await listProposals()});return true;}
    if(req.method==="GET"&&url.pathname==="/api/weaving/audit"){json(200,{events:await listAudit(url.searchParams.get("proposal_id")||"")});return true;}
    if(req.method==="POST"&&url.pathname==="/api/weaving/inbox"){
      try{const result=await submit(await readBody(req),"nanobot");json(result.status,result);return true;}
      catch(error){json(error.status||400,{ok:false,error:error.message});return true;}
    }
    return false;
  }

  return {dataDir,inboxDir,auditFile,initialize,submit,listProposals,listAudit,audit,handleRequest};
}
