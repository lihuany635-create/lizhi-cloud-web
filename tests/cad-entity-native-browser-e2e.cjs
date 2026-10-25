"use strict";
// Real Chromium + source-built Rust CADCraft WASM. No Supabase, DXF upload, or production mutation.
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const evidence=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-entity-preview-evidence");
async function main(){
 await fs.mkdir(evidence,{recursive:true});
 const browser=await chromium.launch({headless:true,args:[
  "--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
  "--enable-unsafe-swiftshader","--disable-dev-shm-usage","--no-sandbox"
 ]});
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 const page=await context.newPage();
 const report={kind:"cad-native-entity-inspect-real-wasm",productionDeployment:false,steps:[]};
 page.on("dialog",d=>d.accept());
 try{
  const pageResult=await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded",timeout:60000});
  assert.equal(pageResult.status(),200);
  await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:180000});
  report.steps.push("Real local CADCraft Rust/WASM ready in same-origin iframe");
  const refused=await page.evaluate(async()=>{
   try{await window.LizhiCadHost.command("lizhi.inspect",{});return "UNEXPECTED_ALLOWED";}
   catch(e){return String(e.message)}
  });
  assert.match(refused,/未啟用/);
  report.steps.push("Read blocked without explicit user AI consent");
  await page.locator('[data-cad-action="ai-enable"]').click();
  await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===true);
  const result=await page.evaluate(async()=>{
   const newDrawing=await window.LizhiCadHost.command("new",{metric:true});
   const line=await window.LizhiCadHost.command("line",{points:[[0,0],[800,900]]});
   const overview=await window.LizhiCadHost.command("lizhi.inspect",{});
   const listing=await window.LizhiCadHost.command("lizhi.entities",{type:"Line",limit:8,offset:0});
   const overviewAgain=await window.LizhiCadHost.command("lizhi.inspect",{});
   return {newDrawing,line,overview,listing,overviewAgain};
  });
  assert.ok(Number.isSafeInteger(result.overview.revision),"native drawing revision missing");
  assert.equal(result.overview.revision,result.listing.revision,"read must not alter the CAD revision");
  assert.equal(result.overview.revision,result.overviewAgain.revision,"inspections must remain read-only");
  assert.ok(result.overview.entityCount>=1,"native CAD must contain the drawn line");
  assert.equal(result.listing.count,1,"filtered native LINE query must return one entity");
  assert.equal(result.listing.returned,1);
  assert.equal(result.listing.entities.length,1);
  const entity=result.listing.entities[0];
  assert.match(entity.handle,/^[0-9A-Fa-f]{1,16}$/);
  assert.equal(entity.type,"Line");
  assert.equal(entity.geometryAvailable,true,"native geometry projection should be numeric");
  const geometry=entity.geometry;
  assert.equal(geometry.type,"line");
  function close(a,b){assert.ok(Math.abs(a-b)<1e-8,a+" != "+b);}
  close(geometry.a.x,0);close(geometry.a.y,0);
  close(geometry.b.x,800);close(geometry.b.y,900);
  // Inspections must not leak original local file names, embedded DXF, texts or secrets.
  for(const key of ["path","title","entities","blocks","undo","skipped"]){
   assert.equal(Object.hasOwn(result.overview,key),false,"overview leaked "+key);
  }
  for(const key of ["text","path","rawDxf","attributes"]){
   assert.equal(Object.hasOwn(entity,key),false,"entity leaked "+key);
  }
  report.result={revision:result.overview.revision,entityCount:result.overview.entityCount,
   lineHandle:entity.handle,points:[[geometry.a.x,geometry.a.y],[geometry.b.x,geometry.b.y]],
   entityType:entity.type,geometryAvailable:entity.geometryAvailable};
  report.steps.push("Native WASM returned exact numeric line geometry, handle and revision");
  report.steps.push("Multiple inspect calls left drawing revision unchanged");
  const block=await page.evaluate(async()=>{
   const bad=[["lizhi.entities",{limit:99}],["lizhi.entities",{path:"C:/private.dxf"}],["erase",{handles:["1"]}]];
   const status=[];
   for(const [name,args] of bad){
    try{await window.LizhiCadHost.command(name,args);status.push("ALLOWED")}
    catch(e){status.push(/不支援/.test(String(e.message))?"BLOCKED":String(e.message));}
   }
   return status;
  });
  assert.deepEqual(block,["BLOCKED","BLOCKED","BLOCKED"]);
  report.steps.push("Unbounded reads, arbitrary paths and erase command denied");
  await page.screenshot({path:path.join(evidence,"entity-read-native-wasm.png")});
  await page.locator('[data-cad-action="ai-disable"]').click();
  const after=await page.evaluate(async()=>{
   try{await window.LizhiCadHost.command("lizhi.entities",{limit:8});return "UNEXPECTED_ALLOWED"}
   catch(e){return String(e.message)}
  });
  assert.match(after,/未啟用/);
  report.steps.push("Human STOP revoked subsequent CAD inspection");
  report.passed=true;
 }catch(e){
  report.passed=false;report.error=String(e.stack||e);
  await page.screenshot({path:path.join(evidence,"entity-read-native-wasm-failure.png")}).catch(()=>{});
 }finally{
  await fs.writeFile(path.join(evidence,"entity-read-native-wasm.json"),JSON.stringify(report,null,2));
  await context.close();await browser.close();
 }
 console.log("CAD_NATIVE_ENTITY_WASM_E2E",JSON.stringify({passed:report.passed,steps:report.steps,error:report.error}));
 assert.equal(report.passed,true,report.error||"Native entity-read E2E failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
