"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{spawn}=require("node:child_process");
const {runPreparedExport}=require("./cadcraft-cli-runner.cjs");
const job={job_key:"a".repeat(64),status:"prepared_not_executed",expected_entities:1,script:"_PLINE\n0,0\n20,0\n20,20\n0,20\n_C\n",source_identity:{design_id:"d",revision:1}};
test("already aborted export never launches CADCraft",async()=>{
 const controller=new AbortController();controller.abort();
 let started=false;
 await assert.rejects(runPreparedExport({job,signal:controller.signal,spawnImpl:()=>{
  started=true;throw Error("must not spawn");
 }}),{code:"CAD_LEASE_LOST"});
 assert.equal(started,false);
});
test("cancelling an active CLI process kills it and refuses CAD output",async()=>{
 const controller=new AbortController();
 const slow=(_bin,_args,options)=>spawn(process.execPath,["-e","setTimeout(()=>{},300000)"],options);
 const timeout=setTimeout(()=>controller.abort(),150);
 try{
  await assert.rejects(runPreparedExport({job,spawnImpl:slow,signal:controller.signal,timeoutMs:30000}),{code:"CAD_LEASE_LOST"});
 }finally{clearTimeout(timeout);}
});
