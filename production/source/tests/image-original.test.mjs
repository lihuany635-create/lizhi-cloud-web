import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
const js=transpileModule(readFileSync('app/image-original.ts','utf8'),{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText;
const {openOriginalImage}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('點擊時同步開啟視窗，再等待簽章網址；移除 opener 後才載入原圖',async()=>{
 const events=[];let resolve;const url=new Promise(r=>resolve=r),popup={opener:{},location:{replace:u=>events.push(['navigate',u])},close:()=>events.push(['close'])};
 const pending=openOriginalImage(()=>{events.push(['access']);return url;},()=>{events.push(['open']);return popup;});
 assert.deepEqual(events,[['open'],['access']]);assert.equal(popup.opener,null);
 resolve('https://storage.example/image.png');await pending;assert.deepEqual(events,[['open'],['access'],['navigate','https://storage.example/image.png']]);
});
test('被阻擋時顯示明確錯誤，不進行讀取或假裝原圖已開啟',async()=>{
 let reads=0;await assert.rejects(openOriginalImage(async()=>{reads++;return 'unused';},()=>null),/瀏覽器阻擋/);assert.equal(reads,0);
});
test('讀取原圖失敗時關閉暫用視窗、保留原錯誤，不自動重試',async()=>{
 let reads=0,closed=0,navigated=0;const error=Error('signed url failed'),popup={opener:{},location:{replace:()=>navigated++},close:()=>closed++};
 await assert.rejects(openOriginalImage(async()=>{reads++;throw error;},()=>popup),e=>e===error);assert.equal(reads,1);assert.equal(closed,1);assert.equal(navigated,0);
});
