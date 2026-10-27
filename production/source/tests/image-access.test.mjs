import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
import {test} from 'node:test';import assert from 'node:assert/strict';
const code=transpileModule(readFileSync('app/image-access.ts','utf8'),{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText;
const {createImageAccess}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const reply=ids=>({expiresIn:300,urls:ids.map(imageId=>({imageId,url:'https://private.test/'+imageId}))});
test('24張卡片同時要求連結合併為一次讀取，同ID共用請求與快取',async()=>{
 const calls=[],loader=createImageAccess(async ids=>{calls.push(ids);return reply(ids);});
 const values=await Promise.all(Array.from({length:24},(_,i)=>loader.get(String(i))));assert.equal(calls.length,1);assert.equal(calls[0].length,24);assert.equal(values[3],'https://private.test/3');await loader.get('3');assert.equal(calls.length,1);
});
test('120張圖片分成最多50張一批，批次依序而非同時轟炸後端',async()=>{
 const sizes=[];let active=0,peak=0;const loader=createImageAccess(async ids=>{active++;peak=Math.max(peak,active);await Promise.resolve();sizes.push(ids.length);active--;return reply(ids);});
 await Promise.all(Array.from({length:120},(_,i)=>loader.get(String(i))));assert.deepEqual(sizes,[50,50,20]);assert.equal(peak,1);
});
test('讀取失敗不自動重送，使用者重試可恢復，單張重試不刷新其他圖片',async()=>{
 let calls=0;const loader=createImageAccess(async ids=>{calls++;if(calls===1)throw Error('temporary database error');return reply(ids);});
 await assert.rejects(loader.get('a'),/temporary/);assert.equal(calls,1);assert.equal(await loader.get('a',true),'https://private.test/a');await loader.get('b');await loader.get('a',true);await loader.get('b');assert.equal(calls,4);
});
test('簽名連結到期前留30秒緩衝，讀取重新簽名而不使用過期網址',async()=>{
 let time=0,calls=0;const loader=createImageAccess(async ids=>{calls++;return reply(ids);},()=>time);
 await loader.get('a');time=269999;await loader.get('a');assert.equal(calls,1);time=270000;await loader.get('a');assert.equal(calls,2);
});
test('無回應15秒上限的同等短測試會結束等待，後續手動重試仍可用',async()=>{
 let calls=0;const loader=createImageAccess(async ids=>++calls===1?new Promise(()=>{}):reply(ids),Date.now,10);
 await assert.rejects(loader.get('a'),/逾時/);assert.equal(calls,1);assert.equal(await loader.get('a',true),'https://private.test/a');
});
test('缺少一張連結只回報該張失敗，不把其他成功圖片丟掉',async()=>{
 const loader=createImageAccess(async()=>reply(['a']));const r=await Promise.allSettled([loader.get('a'),loader.get('b')]);assert.equal(r[0].status,'fulfilled');assert.equal(r[1].status,'rejected');
});
