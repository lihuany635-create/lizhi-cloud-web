import test from 'node:test';
import assert from 'node:assert/strict';
import { exportName, saveBlob } from '../export-file.mjs';
test('Export names cannot escape the app export folder',()=>{
  assert.equal(exportName('../../unsafe.json'),'__.._unsafe.json');
  assert.equal(exportName('工程備份.json'),'工程備份.json');
  assert.ok(exportName('x'.repeat(200)).length<=120);
});
test('Native export preserves all bytes across bridge chunks and shares only after writing',async()=>{
  const input=new Uint8Array(1200000);for(let i=0;i<input.length;i++)input[i]=i%251;
  const chunks=[];let shared=false;
  const filesystem={mkdir:async()=>{},writeFile:async({data})=>{chunks.push(Buffer.from(data,'base64'));},appendFile:async({data})=>{chunks.push(Buffer.from(data,'base64'));},getUri:async()=>({uri:'file:///cache/exports/id/test.bin'})};
  const share={share:async({files})=>{assert.deepEqual(files,['file:///cache/exports/id/test.bin']);assert.deepEqual(Buffer.concat(chunks),Buffer.from(input));shared=true;}};
  await saveBlob(new Blob([input]),'test.bin',{filesystem,share,directory:'CACHE',id:'id'});assert.equal(chunks.length,3);assert.equal(shared,true);
});
test('A failed native write does not report a completed export',async()=>{
  let shared=false;await assert.rejects(saveBlob(new Blob(['test']),'test.txt',{filesystem:{mkdir:async()=>{},writeFile:async()=>{throw Error('disk full');}},share:{share:async()=>{shared=true;}},directory:'CACHE',id:'id'}));assert.equal(shared,false);
});
