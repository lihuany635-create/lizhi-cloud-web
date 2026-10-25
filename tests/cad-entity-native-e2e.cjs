"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const output=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-entity-browser-evidence");
async function main(){
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:[
  "--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
  "--enable-unsafe-swiftshader","--no-sandbox"]});
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await ctx.newPage();
 const report={kind:"real-CADCraft-WASM-native-entity-read-and-single-move",passed:false,steps:[]};
 page.on("dialog",async d=>{await d.accept();});
 try{
  const response=await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded"});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
  report.steps.push("real pinned CADCraft Rust/WASM initialized in the original portal");
  const before=await page.evaluate(async()=>{
   try{return await window.LizhiCadHost.command("lizhi.inspect",{});}
   catch(error){return {blocked:String(error.message)};}
  });
  assert.match(before.blocked||"",/未啟用/);
  await page.locator('[data-cad-action="ai-enable"]').click();
  await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===true);
  const result=await page.evaluate(async()=>{
   const api=window.LizhiCadHost;
   await api.command("new",{metric:true});
   await api.command("rectang",{p1:[0,0],p2:[800,900]});
   const summary=await api.command("lizhi.inspect",{});
   const rows=await api.command("lizhi.entities",{limit:8,offset:0});
   return {summary,rows};
  });
  assert.ok(result.summary.entityCount>=1,"No native geometry in drawing");
  assert.equal(typeof result.summary.revision,"number");
  assert.ok(result.rows.entities.length>=1,"No native entity handles");
  const one=result.rows.entities.find(x=>typeof x.handle==="string"&&/^[0-9a-f]+$/i.test(x.handle));
  assert.ok(one,"No native stable entity handle returned");
  assert.equal(result.rows.revision,result.summary.revision);
  assert.ok(!JSON.stringify(result).includes("Drawing.dxf"),"Native read leaked file path/name");
  report.read={summary:result.summary,handle:one.handle,type:one.type,returned:result.rows.returned};
  report.steps.push("read real current CAD drawing revision, entity counts, handles and bounded geometry");

  const moved=await page.evaluate(async data=>window.LizhiCadHost.command("lizhi.move",{
    handles:[data.handle],delta:[100,0],expectedRevision:data.revision,confirmed:true
  }),{handle:one.handle,revision:result.summary.revision});
  assert.equal(moved.moved,1);
  assert.ok(moved.revisionAfter>moved.revisionBefore);
  const after=await page.evaluate(()=>window.LizhiCadHost.command("lizhi.inspect",{}));
  assert.equal(after.revision,moved.revisionAfter);
  const extents=after.extents;
  assert.ok(Array.isArray(extents)&&extents.length===2,"No extents after native move");
  for(const [actual,wanted] of [[extents[0][0],100],[extents[0][1],0],
                                [extents[1][0],900],[extents[1][1],900]]){
   assert.ok(Math.abs(actual-wanted)<0.0001,"Native move geometry mismatch "+JSON.stringify(extents));
  }
  report.move={beforeRevision:moved.revisionBefore,afterRevision:moved.revisionAfter,extents};
  report.steps.push("human-confirmed single-handle MOVE changed real Rust CAD geometry by +100 mm");

  const stale=await page.evaluate(async data=>{
    try{await window.LizhiCadHost.command("lizhi.move",{
      handles:[data.handle],delta:[100,0],expectedRevision:data.oldRevision,confirmed:true
    });return {blocked:false};}
    catch(e){return {blocked:true,message:String(e.message)};}
  },{handle:one.handle,oldRevision:result.summary.revision});
  assert.ok(stale.blocked&&stale.message.includes("CAD_REVISION_CONFLICT"),"Stale move was not rejected");
  const unchanged=await page.evaluate(()=>window.LizhiCadHost.command("lizhi.inspect",{}));
  assert.equal(unchanged.revision,after.revision,"Stale move altered the drawing");
  assert.deepEqual(unchanged.extents,after.extents);
  report.steps.push("stale revision move rejected with unchanged geometry");

  await page.screenshot({path:path.join(output,"cad-native-inspect-move.png")});
  await page.locator('[data-cad-action="ai-disable"]').click();
  await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===false);
  report.steps.push("owner STOP revokes native CAD tool access");
  report.passed=true;
 }catch(e){
  report.error=String(e.stack||e);
  await page.screenshot({path:path.join(output,"cad-native-entity-failure.png")}).catch(()=>{});
 }finally{
  await fs.writeFile(path.join(output,"report.json"),JSON.stringify(report,null,2));
  await ctx.close();await browser.close();
 }
 console.log("LIZHI_CAD_NATIVE_ENTITY_E2E",JSON.stringify(report));
 assert.ok(report.passed,report.error||"Native CAD entity E2E failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
