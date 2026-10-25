"use strict";
// Isolated real CADCraft Chromium+WASM: native single-line move version safety.
// No user drawings, no Supabase, no actual ChatGPT tool, no formal release.
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const evidence=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-entity-move-evidence");
async function main(){
 await fs.mkdir(evidence,{recursive:true});
 const browser=await chromium.launch({headless:true,args:[
  "--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
  "--enable-unsafe-swiftshader","--disable-dev-shm-usage","--no-sandbox"
 ]});
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 const page=await context.newPage();
 let denyMove=false,dialogs=[];
 const proof={kind:"isolated-native-entity-handle-revision-move",deployed:false,steps:[]};
 page.on("dialog",async d=>{
  dialogs.push(d.message());
  if(denyMove&&d.message().includes("移動"))await d.dismiss();
  else await d.accept();
 });
 try{
  const response=await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded",timeout:60000});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:180000});
  await page.locator('[data-cad-action="ai-enable"]').click();
  await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===true);
  const initial=await page.evaluate(async()=>{
   await window.LizhiCadHost.command("new",{metric:true});
   await window.LizhiCadHost.command("line",{points:[[0,0],[800,900]]});
   const inspect=await window.LizhiCadHost.command("lizhi.inspect",{});
   const rows=await window.LizhiCadHost.command("lizhi.entities",{type:"Line",limit:8});
   return {inspect,rows};
  });
  const before=initial.rows.entities[0],revision=initial.inspect.revision;
  assert.ok(Number.isSafeInteger(revision)&&revision>=0);
  assert.equal(initial.rows.entities.length,1);
  assert.match(before.handle,/^[0-9A-Fa-f]{1,16}$/);
  assert.equal(before.geometry.a.x,0);assert.equal(before.geometry.b.x,800);
  proof.steps.push("Known native line read with stable handle and drawing revision");
  const stale=await page.evaluate(async({handle,revision})=>{
   try{
    await window.LizhiCadHost.command("lizhi.move",{handles:[handle],delta:[100,0],expectedRevision:revision+1,confirmed:true});
    return {blocked:false};
   }catch(e){return {blocked:true,error:String(e.message)}}
  },{handle:before.handle,revision});
  assert.equal(stale.blocked,true);
  assert.match(stale.error,/CAD_REVISION_CONFLICT/);
  const unchanged=await page.evaluate(()=>window.LizhiCadHost.command("lizhi.entities",{type:"Line",limit:8}));
  assert.equal(unchanged.entities[0].geometry.a.x,0);
  assert.equal(unchanged.entities[0].geometry.b.x,800);
  proof.steps.push("Stale revision rejected without geometry modification");
  denyMove=true;
  const cancelled=await page.evaluate(async({handle,revision})=>{
   try{
    await window.LizhiCadHost.command("lizhi.move",{handles:[handle],delta:[100,0],expectedRevision:revision,confirmed:true});
    return {cancelled:false};
   }catch(e){return {cancelled:true,error:String(e.message)}}
  },{handle:before.handle,revision});
  denyMove=false;
  assert.equal(cancelled.cancelled,true);
  assert.match(cancelled.error,/取消/);
  const noMove=await page.evaluate(()=>window.LizhiCadHost.command("lizhi.inspect",{}));
  assert.equal(noMove.revision,revision,"cancelled move changed native revision");
  proof.steps.push("Human confirmation cancellation left native drawing unchanged");
  const moved=await page.evaluate(({handle,revision})=>window.LizhiCadHost.command("lizhi.move",{
   handles:[handle],delta:[100,0],expectedRevision:revision,confirmed:true
  }),{handle:before.handle,revision});
  assert.equal(moved.moved,1);
  assert.equal(moved.completed,true);
  assert.equal(moved.revisionBefore,revision);
  assert.ok(moved.revisionAfter>revision,"accepted move must advance native revision");
  const after=await page.evaluate(async()=>{
   const inspect=await window.LizhiCadHost.command("lizhi.inspect",{});
   const rows=await window.LizhiCadHost.command("lizhi.entities",{type:"Line",limit:8});
   return {inspect,rows};
  });
  assert.equal(after.inspect.revision,moved.revisionAfter);
  assert.equal(after.rows.entities.length,1);
  const result=after.rows.entities[0];
  assert.equal(result.handle,before.handle,"edit must preserve entity identity");
  assert.ok(Math.abs(result.geometry.a.x-100)<1e-8);
  assert.ok(Math.abs(result.geometry.a.y-0)<1e-8);
  assert.ok(Math.abs(result.geometry.b.x-900)<1e-8);
  assert.ok(Math.abs(result.geometry.b.y-900)<1e-8);
  proof.steps.push("Actual native move applied +100 X, kept handle, and advanced revision");
  const staleAgain=await page.evaluate(async({handle,revision})=>{
   try{
    await window.LizhiCadHost.command("lizhi.move",{handles:[handle],delta:[100,0],expectedRevision:revision,confirmed:true});
    return {blocked:false};
   }catch(e){return {blocked:true,error:String(e.message)}}
  },{handle:before.handle,revision});
  assert.equal(staleAgain.blocked,true);
  assert.match(staleAgain.error,/CAD_REVISION_CONFLICT/);
  const noRepeat=await page.evaluate(()=>window.LizhiCadHost.command("lizhi.entities",{type:"Line",limit:8}));
  assert.ok(Math.abs(noRepeat.entities[0].geometry.a.x-100)<1e-8,"stale move was silently replayed");
  proof.steps.push("Original revision cannot be reused to move the line twice");
  // The real user's first CAD primitive is a rectangle (native LWPOLYLINE),
  // not four separate LINE entities. Confirm its original four vertices remain inspectable.
  const nativeRectangle=await page.evaluate(async()=>{
   await window.LizhiCadHost.command("rectang",{p1:[0,0],p2:[800,900]});
   return window.LizhiCadHost.command("lizhi.entities",{type:"Polyline",limit:8,offset:0});
  });
  assert.equal(nativeRectangle.count,1,"native rectangle must be one Polyline");
  assert.equal(nativeRectangle.entities.length,1);
  const rect=nativeRectangle.entities[0];
  assert.match(rect.handle,/^[0-9a-f]{1,16}$/i);
  assert.equal(rect.geometryAvailable,true,"native rectangle vertices must be visible");
  assert.equal(rect.geometry.type,"lwPolyline");
  assert.equal(rect.geometry.closed,true);
  const vertices=rect.geometry.vertices.map(v=>[v.p.x,v.p.y]);
  assert.equal(vertices.length,4,"expected four native polyline vertices");
  assert.deepEqual(
   vertices.slice().sort((x,y)=>x[0]-y[0]||x[1]-y[1]),
   [[0,0],[0,900],[800,0],[800,900]]
  );
  proof.rectangle={handle:rect.handle,vertices};
  proof.steps.push("Actual native 800x900 rectangle read as closed four-vertex Polyline");
  assert.ok(dialogs.some(x=>x.includes("移動")),"move not explicitly confirmed");
  await page.screenshot({path:path.join(evidence,"native-entity-line-moved.png")});
  proof.result={handle:result.handle,revisionBefore:revision,revisionAfter:moved.revisionAfter,
   before:[0,0,800,900],after:[result.geometry.a.x,result.geometry.a.y,result.geometry.b.x,result.geometry.b.y],
   dialogCount:dialogs.filter(x=>x.includes("移動")).length};
  proof.passed=true;
 }catch(e){
  proof.passed=false;proof.error=String(e.stack||e);
  await page.screenshot({path:path.join(evidence,"native-entity-move-failure.png")}).catch(()=>{});
 }finally{
  await fs.writeFile(path.join(evidence,"native-entity-move.json"),JSON.stringify(proof,null,2));
  await context.close();await browser.close();
 }
 console.log("CAD_NATIVE_MOVE_E2E",JSON.stringify({passed:proof.passed,steps:proof.steps,error:proof.error}));
 assert.equal(proof.passed,true,proof.error||"Native move E2E failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
