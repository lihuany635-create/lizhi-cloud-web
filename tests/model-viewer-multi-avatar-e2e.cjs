
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
function floorGlb(){
  const vertices=new Float32Array([
    -10,0,-10, -10,0,10, 10,0,10,
    -10,0,-10, 10,0,10, 10,0,-10
  ]);
  // Both triangles are front-facing upwards under glTF +Y.
  const geometry=Buffer.from(vertices.buffer);
  const json={
    asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],
    meshes:[{primitives:[{attributes:{POSITION:0},material:0}]}],
    materials:[{doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[.8,.8,.8,1],metallicFactor:0,roughnessFactor:1}}],
    buffers:[{byteLength:geometry.length}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:geometry.length}],
    accessors:[{bufferView:0,componentType:5126,count:6,type:'VEC3',min:[-10,0,-10],max:[10,0,10]}]
  };
  let j=Buffer.from(JSON.stringify(json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);
  const header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
  header.write('glTF',0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+j.length+8+geometry.length,8);
  jh.writeUInt32LE(j.length,0);jh.write('JSON',4);
  bh.writeUInt32LE(geometry.length,0);bh.write('BIN\0',4);
  return Buffer.concat([header,jh,j,bh,geometry]);
}
async function loadFloor(page,buffer){
  await page.locator('#fileIn').setInputFiles({name:'avatar-floor.glb',mimeType:'model/gltf-binary',buffer});
  await page.waitForFunction(()=>document.querySelector('#fileName')?.textContent==='avatar-floor.glb'&&document.querySelector('#ov')?.hidden===true,null,{timeout:45000});
  await page.waitForTimeout(900);
}
async function main(){
  const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const failures=[];
  try{
    const context=await browser.newContext({viewport:{width:1200,height:800},deviceScaleFactor:1});
    const page=await context.newPage();page.on('pageerror',err=>failures.push(err.message));
    await page.goto('http://127.0.0.1:8771/model-viewer/',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#avatarPanelToggle',{timeout:30000});
    const buf=floorGlb();await loadFloor(page,buf);
    await page.locator('#avatarPanelToggle').click();
    const canvas=page.locator('#stage canvas');await canvas.waitFor();
    const b=await canvas.boundingBox();assert(b&&b.width>300&&b.height>200);
    for(let i=0;i<5;i++){
      await page.locator('#avatarAdd').click();
      await page.mouse.click(b.x+b.width*(.4+i*.045),b.y+b.height*.58);
      await page.waitForFunction(n=>Number(document.querySelector('#avatarNum')?.textContent)===n,i+1,{timeout:15000});
    }
    assert.equal(await page.locator('.avatar-row').count(),5,'five independent figures present');
    const before=await page.locator('.avatar-row small').allTextContents();
    await page.locator('.avatar-row').nth(1).getByRole('button',{name:'移動'}).click();
    await page.mouse.click(b.x+b.width*.68,b.y+b.height*.54);
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.avatar-row').count(),5,'moving must not create sixth figure');
    const after=await page.locator('.avatar-row small').allTextContents();
    assert.notEqual(after[1],before[1],'selected figure should move');
    assert.deepEqual(after.filter((_,i)=>i!==1),before.filter((_,i)=>i!==1),'other figures stay put');
    await page.locator('.avatar-row').nth(0).getByRole('button',{name:'視角'}).click();
    await page.waitForFunction(()=>!document.querySelector('#povUi').hidden);
    await page.locator('#avatarCamera').click();
    assert.equal(await page.locator('#avatarCamera').textContent(),'第一人稱');
    await page.locator('#avatarQuick').selectOption('avatar-3');
    assert.equal(await page.locator('#avatarQuick').inputValue(),'avatar-3');
    await page.locator('#avatarPanelToggle').click();
    await page.locator('.avatar-row').nth(3).getByRole('button',{name:'俯視'}).click();
    await page.waitForFunction(()=>document.querySelector('#povUi').hidden);
    await page.reload({waitUntil:'domcontentloaded'});
    await loadFloor(page,buf);
    await page.locator('#avatarPanelToggle').click();
    assert.equal(await page.locator('.avatar-row').count(),5,'positions persisted through reload');
    assert.deepEqual(await page.locator('.avatar-row small').allTextContents(),after);
    await page.setViewportSize({width:390,height:844});
    const panel=await page.locator('#avatarPanel').boundingBox();
    assert(panel&&panel.width>200&&panel.x>=0&&panel.x+panel.width<=391,'phone-width panel fits viewport');
    assert.deepEqual(failures,[],'no unhandled page JavaScript errors');
    console.log('PASS real Chromium: 5 avatars, independent move, POV switching, 3rd person, top view, reload, 390px viewport');
    await context.close();
  }catch(e){
    console.error('BROWSER_E2E_FAILED',e);
    throw e;
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
