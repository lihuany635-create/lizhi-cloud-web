"use strict";
// End-to-end browser validation against the existing LiZhi Cloud page + actual Rust/WASM CADCraft.
// A mock of the browser-native directory picker isolates test files. It is NOT a real OS picker test.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const origin = process.env.CAD_TEST_ORIGIN || "http://127.0.0.1:8771";
const evidence = path.resolve(process.env.CAD_BROWSER_EVIDENCE || "cad-browser-evidence");

function fixtureDxf() {
  const pairs = [
    [0,"SECTION"],[2,"HEADER"],[9,"$ACADVER"],[1,"AC1027"],[9,"$INSUNITS"],[70,"4"],[0,"ENDSEC"],
    [0,"SECTION"],[2,"TABLES"],[0,"ENDSEC"],
    [0,"SECTION"],[2,"BLOCKS"],[0,"ENDSEC"],
    [0,"SECTION"],[2,"ENTITIES"],
    [0,"LWPOLYLINE"],[5,"2A"],[100,"AcDbEntity"],[8,"0"],[100,"AcDbPolyline"],[90,"4"],[70,"1"],
    [10,"0"],[20,"0"],[10,"800"],[20,"0"],[10,"800"],[20,"900"],[10,"0"],[20,"900"],
    [0,"ENDSEC"],[0,"EOF"]
  ];
  return Buffer.from(pairs.map(p => p.join("\n")).join("\n") + "\n", "utf8");
}

function extentsFromDxf(text) {
  const arr = text.replace(/\r/g, "").split("\n");
  const pairs = [];
  for (let i=0;i<arr.length-1;i+=2) pairs.push([arr[i].trim(),arr[i+1].trim()]);
  const start=pairs.findIndex(([code,val])=>code==="0" && val==="LWPOLYLINE");
  assert.ok(start>=0,"No LWPOLYLINE in actually saved DXF");
  const vertices=[];let x=null;
  for(let i=start+1;i<pairs.length;i++) {
    const [code,val]=pairs[i];
    if(code==="0") break;
    if(code==="10") x=Number(val);
    if(code==="20"&&x!==null) {vertices.push([x,Number(val)]);x=null;}
  }
  assert.ok(vertices.length>=4,"Expected four polyline corners");
  const xs=vertices.map(v=>v[0]),ys=vertices.map(v=>v[1]);
  return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
}

async function main(){
  await fs.mkdir(evidence,{recursive:true});
  const browser=await chromium.launch({headless:true,args:[
    "--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
    "--enable-unsafe-swiftshader","--disable-dev-shm-usage","--no-sandbox"
  ]});
  const report={kind:"actual-chromium-wasm-portal-e2e",directoryPicker:"in-memory browser API mock (not OS picker)",notDeployed:true,steps:[],errors:[]};
  const context=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
  const page=await context.newPage();
  page.on("pageerror",err=>report.errors.push(String(err.message)));
  page.on("dialog",dlg=>dlg.accept());
  try {
    await page.addInitScript(() => {
      // Mock only the File System Access picker. The portal and CAD iframe are real production source.
      const data=new Map();
      window.__cadE2E={files:data,deny:false,dirtyEvents:[]};
      window.addEventListener("message", event => {
        if(event.origin===location.origin && event.source===document.querySelector("#cad-frame")?.contentWindow && event.data?.type==="cadcraft:dirty")
          window.__cadE2E.dirtyEvents.push(event.data.dirty);
      });
      const revisionDirectory={
        kind:"directory",
        async getFileHandle(name,{create=false}={}) {
          if(!create && !data.has(name)) throw new DOMException("Not found","NotFoundError");
          if(create && !data.has(name)) data.set(name,new Uint8Array());
          return {
            kind:"file",name,
            async createWritable() {
              return {
                async write(bytes) { data.set(name,new Uint8Array(bytes)); },
                async close() {},
                async abort() { data.delete(name); }
              };
            },
            async getFile() { return new File([data.get(name)],name,{type:"application/dxf"}); }
          };
        },
        async *entries() { for(const [name] of data) yield [name,{kind:"file",name}]; }
      };
      const parentDirectory={
        kind:"directory",
        async queryPermission() {return window.__cadE2E.deny?"denied":"granted";},
        async getDirectoryHandle(name,options={}) {
          if(name!=="revisions")throw Error("unexpected subdirectory");
          if(!options.create && data.size===0)throw new DOMException("Not found","NotFoundError");
          return revisionDirectory;
        }
      };
      window.showDirectoryPicker=async()=>parentDirectory;
    });
    const response=await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded",timeout:60000});
    assert.equal(response.status(),200);
    await page.locator("#cad-frame").waitFor({state:"attached",timeout:30000});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
    report.steps.push("Portal route + real iframe CADCraft WASM ready");
    const frame=page.frameLocator("#cad-frame");
    const canvas=frame.locator("#cadcraft_canvas");
    await canvas.waitFor({state:"visible",timeout:30000});
    const bounds=await canvas.boundingBox();
    assert.ok(bounds && bounds.width>300 && bounds.height>220);
    await page.screenshot({path:path.join(evidence,"cad-embedded-ready.png")});

    // Choose directory (Chrome File System Access mock) and import an actual ASCII DXF containing 800x900 mm.
    await page.locator('[data-cad-action="folder"]').click();
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已授權"),null,{timeout:10000});
    await page.locator("#cad-open-file").setInputFiles({name:"cabinet.dxf",mimeType:"application/dxf",buffer:fixtureDxf()});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已傳送"),null,{timeout:20000});
    await page.waitForTimeout(1300);
    report.steps.push("Imported actual 800x900mm DXF through CADCraft host postMessage");

    // The real CAD engine must save a real DXF through CADCraft->parent message.
    await canvas.click({position:{x:Math.min(300,bounds.width/3),y:Math.min(280,bounds.height/3)}});
    await page.keyboard.press("Control+s");
    await page.waitForFunction(()=>window.__cadE2E?.files.size>0,null,{timeout:25000});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已驗證本機 DXF"),null,{timeout:25000});
    await page.waitForFunction(()=>window.__cadE2E.dirtyEvents.at(-1)===false,null,{timeout:15000});
    report.steps.push("Native save-ack only confirms CAD durability after filesystem SHA-256 verification");
    const saved=await page.evaluate(()=>{
      const entries=[...window.__cadE2E.files.entries()];
      return entries.map(([name,bytes])=>({name,bytes:[...bytes]}));
    });
    assert.equal(saved.length,1,"First save must create exactly one immutable version");
    const first=saved[0];
    assert.match(first.name,/^cabinet-\d{4}-\d{2}-\d{2}T.*-(?:[0-9a-f]{8}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\.dxf$/);
    assert.ok(first.bytes.length>250);
    const extents=extentsFromDxf(Buffer.from(first.bytes).toString("utf8"));
    for(const [k,v] of Object.entries({minX:0,maxX:800,minY:0,maxY:900})) {
      assert.ok(Math.abs(extents[k]-v)<.0001,"DXF geometry differs: "+JSON.stringify(extents));
    }
    report.geometry=extents;
    report.savedBytes=first.bytes.length;
    report.steps.push("Real CADCraft save -> parent -> version write; exact 800x900 geometry verified");

    // History is displayed from the same device directory, reopening must not overwrite original.
    await page.locator('[data-cad-action="versions"]').click();
    const rev=page.locator("[data-cad-revision]");
    await rev.first().waitFor();
    assert.equal(await rev.first().getAttribute("data-cad-revision"),first.name);
    await rev.first().click();
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已傳送"),null,{timeout:20000});
    const countAfterRestore=await page.evaluate(()=>window.__cadE2E.files.size);
    assert.equal(countAfterRestore,1);
    report.steps.push("Version list and reopen without overwriting old revision");

    // Navigate away and back; the original iframe is preserved (not reset).
    await frame.locator("html").evaluate(()=>{window.__cadTestKeepalive="same-session";});
    await page.evaluate(()=>document.querySelector('[data-route="home"]').click());
    await page.evaluate(()=>document.querySelector('button[data-route="cad"]').click());
    const keepalive=await page.frameLocator("#cad-frame").locator("html").evaluate(()=>window.__cadTestKeepalive);
    assert.equal(keepalive,"same-session");
    report.steps.push("Cloud route switch preserves the exact CAD iframe session");

    // If permission expires, saving a DXF must download locally, not claim a revision was saved.
    await page.evaluate(()=>{window.__cadE2E.deny=true;});
    const downloadPromise=page.waitForEvent("download",{timeout:30000});
    await page.frameLocator("#cad-frame").locator("#cadcraft_canvas").click({position:{x:200,y:180}});
    await page.keyboard.press("Control+s");
    const downloaded=await downloadPromise;
    await downloaded.saveAs(path.join(evidence,"cad-permission-denied-fallback.dxf"));
    assert.equal(await page.evaluate(()=>window.__cadE2E.files.size),1);
    assert.match(await page.locator("#cad-status").textContent(),/已下載|未建立本機歷史版本/);
    assert.ok((await fs.stat(path.join(evidence,"cad-permission-denied-fallback.dxf"))).size>250);
    // Persisted browser-only rescue stays after a failed OS-directory save.
    await page.waitForFunction(()=>document.querySelector('[data-cad-action="recovery"]')?.textContent?.includes("（1）"),null,{timeout:10000});
    await page.locator('[data-cad-action="recovery"]').click();
    await page.locator("[data-cad-recovery-download]").first().waitFor();
    const recoveryDownload=page.waitForEvent("download",{timeout:15000});
    await page.locator("[data-cad-recovery-download]").first().click();
    const emergency=await recoveryDownload;
    await emergency.saveAs(path.join(evidence,"cad-rescued-from-indexeddb.dxf"));
    assert.ok((await fs.stat(path.join(evidence,"cad-rescued-from-indexeddb.dxf"))).size>250);
    await page.waitForFunction(()=>window.__cadE2E.dirtyEvents.at(-1)===true,null,{timeout:15000});
    report.steps.push("Native failed save-ack reports dirty after download fallback");
    report.steps.push("Emergency IndexedDB snapshot survives failed filesystem save; manual recovery downloads real CADCraft DXF");
        report.steps.push("Permission revoked -> original revisions unchanged; DXF download fallback");
    report.passed=true;
    await page.screenshot({path:path.join(evidence,"cad-embedded-complete.png")});
  }catch(err) {
    report.passed=false;
    report.error=String(err.stack||err);
    await page.screenshot({path:path.join(evidence,"cad-embedded-failure.png")}).catch(()=>{});
  }finally {
    await fs.writeFile(path.join(evidence,"cad-embedded-e2e.json"),JSON.stringify(report,null,2));
    await context.close();
    await browser.close();
  }
  console.log("LIZHI_CAD_PORTAL_E2E",JSON.stringify({passed:report.passed,steps:report.steps,geometry:report.geometry,error:report.error}));
  assert.ok(report.passed,report.error||"Browser CAD integration failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
