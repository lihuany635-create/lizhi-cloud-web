"use strict";
// E2E: REAL Chromium Origin Private File System (OPFS) + real IndexedDB handle cloning.
// Only the directory picker UI is replaced; no fake filesystem objects are used.
// Does not prove Windows/Android OS picker behavior or real user permission prompts.
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const evidence=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-browser-evidence");
const fixture=Buffer.from([
"0","SECTION","2","HEADER","9","$ACADVER","1","AC1027","9","$INSUNITS","70","4","0","ENDSEC",
"0","SECTION","2","TABLES","0","ENDSEC","0","SECTION","2","BLOCKS","0","ENDSEC",
"0","SECTION","2","ENTITIES","0","LWPOLYLINE","5","2A","100","AcDbEntity","8","0",
"100","AcDbPolyline","90","4","70","1","10","0","20","0","10","800","20","0",
"10","800","20","900","10","0","20","900","0","ENDSEC","0","EOF",""
].join("\n"));
async function revisions(page) {
  return await page.evaluate(async()=>{
    const root=await navigator.storage.getDirectory();
    const dir=await root.getDirectoryHandle("revisions");
    const files=[];
    for await(const [name,h] of dir.entries()) {
      if(h.kind!=="file")continue;
      const file=await h.getFile();
      files.push({name,bytes:[...new Uint8Array(await file.arrayBuffer())]});
    }
    return files.sort((a,b)=>a.name.localeCompare(b.name));
  });
}
async function main(){
  await fs.mkdir(evidence,{recursive:true});
  const report={kind:"real-Chromium-OPFS-plus-IndexedDB-reload",realStorage:true,picker:"only picker UI overridden to return real OPFS handle",notOSDirectoryPicker:true,steps:[]};
  const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage","--no-sandbox"]});
  const context=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
  const page=await context.newPage();
  // Human-facing restore confirmation must be explicitly accepted during automated E2E.
  page.on("dialog",dialog=>dialog.accept());
  try{
    await page.addInitScript(()=>{
      window.showDirectoryPicker=async()=>navigator.storage.getDirectory();
    });
    await page.goto(origin+"/?open=cad",{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
    const opfs=await page.evaluate(async()=>{
      const root=await navigator.storage.getDirectory();
      const permissions=typeof root.queryPermission==="function" ? await root.queryPermission({mode:"readwrite"}) : "method_missing";
      return {permissions,kind:root.kind};
    });
    assert.equal(opfs.kind,"directory");
    assert.equal(opfs.permissions,"granted","Browser-native OPFS handle must report write permission");
    await page.locator('[data-cad-action="folder"]').click();
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已授權"),null,{timeout:12000});
    report.steps.push("Real Chromium FileSystemDirectoryHandle granted and selected");
    await page.locator("#cad-open-file").setInputFiles({name:"cabinet-opfs.dxf",mimeType:"application/dxf",buffer:fixture});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已傳送"),null,{timeout:20000});
    const frame=page.frameLocator("#cad-frame");
    const canvas=frame.locator("#cadcraft_canvas");
    await canvas.waitFor({state:"visible"});
    await canvas.click({position:{x:200,y:180}});
    await page.keyboard.press("Control+s");
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已儲存在所選資料夾"),null,{timeout:25000});
    const first=await revisions(page);
    assert.equal(first.length,1);
    assert.ok(Buffer.from(first[0].bytes).toString("utf8").includes("LWPOLYLINE"));
    report.steps.push("Actual DXF file persisted in real browser OPFS via createWritable()");
    report.firstName=first[0].name;
    report.firstBytes=first[0].bytes.length;
    // Verify real IndexedDB contains structured-cloned FileSystemDirectoryHandle, not JavaScript fake.
    const stored=await page.evaluate(async()=>{
      return await new Promise((resolve,reject)=>{
        const req=indexedDB.open("lizhi-cad-local");
        req.onerror=()=>reject(req.error);
        req.onsuccess=()=>{
          const db=req.result;
          const get=db.transaction("permissions","readonly").objectStore("permissions").get("cad-directory");
          get.onsuccess=()=>{const handle=get.result;resolve({kind:handle?.kind,name:handle?.name,queryPermission:typeof handle?.queryPermission});db.close();};
          get.onerror=()=>reject(get.error);
        };
      });
    });
    assert.equal(stored.kind,"directory");
    assert.equal(stored.queryPermission,"function");
    report.steps.push("Actual native FileSystemDirectoryHandle roundtripped through IndexedDB");
    await page.reload({waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已就緒"),null,{timeout:120000});
    await page.locator('[data-cad-action="versions"]').click();
    const button=page.locator("[data-cad-revision]");
    await button.first().waitFor({timeout:15000});
    // The list is inserted before its async handler updates the status; avoid racing an older status write.
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已列出最近 1 個版本"),null,{timeout:15000});
    assert.equal(await button.count(),1);
    assert.equal(await button.first().textContent(),first[0].name);
    await button.first().click();
    await page.waitForFunction(()=>document.querySelector("#cad-status")?.textContent?.includes("已傳送"),null,{timeout:20000});
    await page.waitForTimeout(750);
    const loadedCanvas=page.frameLocator("#cad-frame").locator("#cadcraft_canvas");
    await loadedCanvas.click({position:{x:200,y:180}});
    await page.keyboard.press("Control+s");
    await page.waitForFunction(async()=>{
      const message=document.querySelector("#cad-status")?.textContent||"";
      if(!message.includes("已儲存在所選資料夾"))return false;
      const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle("revisions");
      let n=0;for await(const [,h] of dir.entries())if(h.kind==="file")n++;
      return n===2;
    },null,{timeout:25000});
    const final=await revisions(page);
    assert.equal(final.length,2);
    assert.notEqual(final[0].name,final[1].name);
    assert.ok(final.every(x=>Buffer.from(x.bytes).toString("utf8").includes("LWPOLYLINE")));
    report.steps.push("Reload recovers saved directory permission handle and original DXF, then new immutable revision");
    report.secondName=final.find(f=>f.name!==first[0].name).name;
    report.savedRevisions=2;
    report.passed=true;
  }catch(e){
    report.passed=false;report.error=String(e.stack||e);
    report.diagnostics=await page.evaluate(async()=>{
      const out={status:document.querySelector("#cad-status")?.textContent,origin:location.origin};
      try {
        const root=await navigator.storage.getDirectory();
        out.rootEntries=[];
        for await (const [name,handle] of root.entries())out.rootEntries.push({name,kind:handle.kind});
        const rev=await root.getDirectoryHandle("revisions");
        out.revisions=[];
        for await (const [name,handle] of rev.entries()){
          let size;try{size=(await handle.getFile()).size;}catch(err){size=String(err);}
          out.revisions.push({name,size});
        }
      }catch(err){out.directoryError=String(err);}
      return out;
    }).catch(err=>({diagnosticError:String(err)}));
    await page.screenshot({path:path.join(evidence,"cad-opfs-failure.png")}).catch(()=>{});
  }finally{
    await fs.writeFile(path.join(evidence,"cad-opfs-persistence-e2e.json"),JSON.stringify(report,null,2));
    await context.close();await browser.close();
  }
  console.log("LIZHI_CAD_OPFS_E2E",JSON.stringify(report));
  assert.ok(report.passed,report.error||"OPFS/IDB test failed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
