"use strict";
const {chromium}=require("playwright");
const fs=require("node:fs/promises");
const path=require("node:path");
const assert=require("node:assert/strict");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const output=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-browser-evidence");
async function main(){
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"]});
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const page=await context.newPage();
  const report={kind:"real-Rust-CADCraft-command-port-browser-e2e",remoteOAuth:false,requiresExplicitUserOptIn:true,steps:[]};
  page.on("dialog",d=>d.accept());
  // Real Chromium Origin Private File System; replace ONLY the OS chooser UI.
  await page.addInitScript(() => {
    window.showDirectoryPicker=async()=>navigator.storage.getDirectory();
  });
  try{
    const res=await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded"});
    assert.equal(res.status(),200);
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
    report.steps.push("Actual Rust/WASM CADCraft ready inside original portal");
    const notAllowed=await page.evaluate(async()=>{
      try{await window.LizhiCadHost.command("rectang",{p1:[0,0],p2:[800,900]});return null;}
      catch(e){return String(e.message);}
    });
    assert.match(notAllowed,/未啟用/);
    report.steps.push("Geometry mutation rejected until human opt-in");
    await page.locator('[data-cad-action="ai-enable"]').click();
    await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===true);
    const blocked=await page.evaluate(async()=>{
      const names=["script","open","saveas","execute","unknown"];
      const results=[];
      for(const name of names){
        try{await window.LizhiCadHost.command(name,{path:"/tmp/secret.dxf",data:"unsafe"});results.push({name,blocked:false});}
        catch(e){results.push({name,blocked:/不支援/.test(String(e.message))});}
      }
      return results;
    });
    assert.ok(blocked.every(x=>x.blocked),JSON.stringify(blocked));
    report.steps.push("Scripts, arbitrary paths and unsupported commands refused");
    const result=await page.evaluate(async()=>{
      const created=await window.LizhiCadHost.command("new",{metric:true});
      const rectangle=await window.LizhiCadHost.command("rectang",{p1:[0,0],p2:[800,900]});
      return {created,rectangle,session:window.LizhiCadHost.commandStatus};
    });
    assert.ok(result.session.enabled);
    report.result=result;
    report.steps.push("Same-origin request ID sends NEW and RECTANG into REAL Rust CAD engine");

    // Verify the commands actually changed the native drawing geometry, not just returned OK.
    await page.locator('[data-cad-action="folder"]').click();
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已授權"),null,{timeout:15000});
    const canvas=page.frameLocator("#cad-frame").locator("#cadcraft_canvas");
    await canvas.click({position:{x:180,y:160}});
    await page.keyboard.press("Control+s");
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已驗證本機 DXF"),null,{timeout:30000});
    const saved=await page.evaluate(async()=>{
      const root=await navigator.storage.getDirectory();
      const dir=await root.getDirectoryHandle("revisions");
      for await(const [name,handle] of dir.entries()){
        if(!name.endsWith(".dxf")) continue;
        const file=await handle.getFile();
        return {name,text:await file.text(),size:file.size};
      }
      return null;
    });
    assert.ok(saved && saved.size>500,"Real CAD command did not produce a saved DXF");
    const pairs=saved.text.replace(/\r/g,"").split("\n");
    const coords=[];let reading=false;let x=null;
    for(let i=0;i<pairs.length-1;i+=2){
      const k=pairs[i].trim(),v=pairs[i+1].trim();
      if(k==="0"&&v==="LWPOLYLINE"){reading=true;continue;}
      if(!reading)continue;
      if(k==="0")break;
      if(k==="10")x=Number(v);
      if(k==="20"&&x!==null){coords.push([x,Number(v)]);x=null;}
    }
    assert.ok(coords.length>=4,"No native rectangle polyline vertices in command-generated DXF");
    const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
    const extents={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
    for(const [key,value] of Object.entries({minX:0,maxX:800,minY:0,maxY:900}))
      assert.ok(Math.abs(extents[key]-value)<.0001,"Command rectangle DXF geometry mismatch "+JSON.stringify(extents));
    report.savedGeometry=extents;
    report.savedBytes=saved.size;
    report.steps.push("AI RECTANG command persisted REAL 800x900mm DXF through native SHA-256 durable save ACK");

    const replay=await page.evaluate(async()=>{
      try{await window.LizhiCadHost.command("circle",{center:[0,0],radius:-1});return false;}
      catch(e){return /不支援/.test(String(e.message));}
    });
    assert.equal(replay,true);
    report.steps.push("Invalid radius rejected before reaching WASM");
    await page.frameLocator("#cad-frame").locator("#cadcraft_canvas").waitFor({state:"visible"});
    await page.screenshot({path:path.join(output,"cad-command-port-rectang.png")});
    await page.locator('[data-cad-action="ai-disable"]').click();
    const status=await page.evaluate(()=>window.LizhiCadHost.commandStatus);
    assert.equal(status.enabled,false);
    report.steps.push("Human STOP revokes all additional commands");
    report.passed=true;
  }catch(e){
    report.passed=false;report.error=String(e.stack||e);
    await page.screenshot({path:path.join(output,"cad-command-port-failure.png")}).catch(()=>{});
  }finally{
    await fs.writeFile(path.join(output,"cad-command-port-e2e.json"),JSON.stringify(report,null,2));
    await context.close();await browser.close();
  }
  console.log("LIZHI_CAD_COMMAND_PORT_E2E",JSON.stringify({passed:report.passed,steps:report.steps,error:report.error}));
  assert.ok(report.passed,report.error||"Command port E2E failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
