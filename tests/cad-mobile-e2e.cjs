"use strict";
// Real Chromium mobile viewport with original portal + CADCraft WASM. No device/Samsung claims.
const {chromium}=require("playwright");
const fs=require("node:fs/promises");
const path=require("node:path");
const assert=require("node:assert/strict");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const output=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-browser-evidence");
async function test(browser,device){
  const context=await browser.newContext({viewport:device.viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
    const res=await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded",timeout:60000});
    assert.equal(res.status(),200);
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
    const root=page.locator(".cad-embedded");
    await root.waitFor({state:"visible"});
    const canvas=page.frameLocator("#cad-frame").locator("#cadcraft_canvas");
    await canvas.waitFor({state:"visible"});
    const bb=await canvas.boundingBox();
    assert.ok(bb?.width>200&&bb?.height>150,"Mobile CAD canvas has insufficient space: "+JSON.stringify(bb));
    const toolbar=await page.locator(".cad-toolbar").boundingBox();
    assert.ok(toolbar?.width>200,"Mobile toolbar collapsed");
    const actions=await page.locator("[data-cad-action]").count();
    assert.ok(actions>=5,"Mobile workspace lost actions");
    await page.screenshot({path:path.join(output,"cad-mobile-"+device.name+".png"),fullPage:true});
    assert.equal(errors.length,0,"mobile JavaScript page errors: "+errors.join(" | "));
    return {device:device.name,passed:true,viewport:device.viewport,canvas:{width:bb.width,height:bb.height},actions};
  }catch(err){
    await page.screenshot({path:path.join(output,"cad-mobile-"+device.name+"-failed.png"),fullPage:true}).catch(()=>{});
    return {device:device.name,passed:false,error:String(err.stack||err),errors};
  }finally{await context.close();}
}
async function main(){
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"]});
  let results;
  try{results=[await test(browser,{name:"phone-390",viewport:{width:390,height:844}}),await test(browser,{name:"tablet-820",viewport:{width:820,height:1180}})];}
  finally{await browser.close();}
  await fs.writeFile(path.join(output,"cad-mobile-e2e.json"),JSON.stringify({actualChromium:true,realDevice:false,results},null,2));
  console.log("LIZHI_CAD_MOBILE_E2E",JSON.stringify(results));
  assert.ok(results.every(v=>v.passed),"Mobile viewport E2E failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
