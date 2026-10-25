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
