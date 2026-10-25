"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const output=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-browser-evidence");
async function main(){
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"]});
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const page=await context.newPage();
  const report={type:"real-CADCraft-WASM+mocked-Supabase-RPC",oauthProviderVerified:false,sqlDeployed:false,steps:[]};
  page.on("dialog",d=>d.accept());
  try {
    await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
    assert.equal(await page.locator('[data-cad-action="remote-connect"]').isHidden(),true);
    report.steps.push("Remote ChatGPT MCP connection hidden until explicit CAD AI consent");
    await page.evaluate(()=>{
      // Replace only the network RPC client. CADCraft iframe + Rust geometry are unmodified.
      const user={id:"test-owner"};
      const queue=[
        {id:"cad-test-job-new",command:"new",params:{metric:true}},
        {id:"cad-test-job-rect",command:"rectang",params:{p1:[0,0],p2:[800,900]}},
      ];
      const finished=[];
      const calls=[];
      window.__cadRemoteMock={queue,finished,calls,closed:false};
      window.LizhiAuth={
        user,client:{rpc:async(name,args)=>{
          calls.push({name,args});
          if(name==="lizhi_cad_begin_session"||name==="lizhi_cad_heartbeat")return {data:true,error:null};
          if(name==="lizhi_cad_close_session"){window.__cadRemoteMock.closed=true;return {data:true,error:null};}
          if(name==="lizhi_cad_claim_next")return {data:queue.shift()||null,error:null};
          if(name==="lizhi_cad_finish"){finished.push(args);return {data:true,error:null};}
          return {data:null,error:{message:"Unknown RPC"}};
        }}
      };
    });
    await page.locator('[data-cad-action="ai-enable"]').click();
    await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===true);
    await page.locator('[data-cad-action="remote-connect"]').click();
    await page.waitForFunction(()=>window.LizhiCadRelay?.state?.active===true,null,{timeout:10000});
    await page.waitForFunction(()=>window.__cadRemoteMock.finished.length===2,null,{timeout:25000});
    const res=await page.evaluate(()=>({
      finished:window.__cadRemoteMock.finished,
      rpcNames:window.__cadRemoteMock.calls.map(c=>c.name),
      state:window.LizhiCadRelay.state,
    }));
    assert.ok(res.finished.every(x=>x.p_ok===true),"Native CAD engine rejected mocked server job: "+JSON.stringify(res));
    assert.equal(new Set(res.finished.map(x=>x.p_job)).size,2);
    assert.ok(res.rpcNames.includes("lizhi_cad_claim_next")&&res.rpcNames.includes("lizhi_cad_finish"));
    report.steps.push("Simulated owner-scoped RPC queue executes NEW and 800x900 RECTANG in real CADCraft Rust/WASM, with job completion receipts");
    await page.locator('[data-cad-action="remote-disconnect"]').click();
    await page.waitForFunction(()=>window.LizhiCadRelay.state.active===false,null,{timeout:12000});
    const final=await page.evaluate(()=>({closed:window.__cadRemoteMock.closed,enabled:window.LizhiCadHost.commandStatus.enabled}));
    assert.equal(final.closed,true);
    assert.equal(final.enabled,true,"Remote disconnect should not secretly disable local CAD controls");
    report.steps.push("Remote disconnect closes only the authorized lease; manual local drawing remains available");
    await page.locator('[data-cad-action="ai-disable"]').click();
    await page.waitForFunction(()=>window.LizhiCadHost.commandStatus.enabled===false);
    report.steps.push("User STOP removes all CAD geometry privileges");
    report.passed=true;
  }catch(e){
    report.passed=false;report.error=String(e.stack||e);
    await page.screenshot({path:path.join(output,"cad-relay-mock-failure.png")}).catch(()=>{});
  }finally{
    await fs.writeFile(path.join(output,"cad-mcp-relay-mock-e2e.json"),JSON.stringify(report,null,2));
    await context.close();await browser.close();
  }
  console.log("LIZHI_CAD_MCP_RELAY_BROWSER_E2E",JSON.stringify(report));
  assert.ok(report.passed,report.error||"MCP relay mock E2E failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
