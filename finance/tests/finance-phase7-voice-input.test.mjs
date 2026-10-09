import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const Voice=require('../voice/finance-voice-input.js');
const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(dirname,'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

function fakeRecognition(){
  let instance=null,starts=0,stops=0,aborts=0;
  class FakeRecognition{
    constructor(){instance=this;}
    start(){starts+=1;this.onstart?.();}
    stop(){stops+=1;this.onend?.();}
    abort(){aborts+=1;this.onend?.();}
  }
  return {FakeRecognition,get instance(){return instance;},counts:()=>({starts,stops,aborts})};
}
const speechResult=(text,isFinal)=>Object.assign([{transcript:text}],{isFinal});

test('P7-VOICE-01 SpeechRecognition feature detection supports the standard API',()=>{
  assert.equal(Voice.isSupported({SpeechRecognition:class{}}),true);
});

test('P7-VOICE-02 webkitSpeechRecognition is accepted as the browser fallback',()=>{
  assert.equal(Voice.isSupported({webkitSpeechRecognition:class{}}),true);
});

test('P7-VOICE-03 unsupported browsers keep a safe text-only controller',()=>{
  const controller=Voice.create({scope:{}});assert.equal(controller.supported,false);assert.equal(controller.getState().status,'unsupported');assert.equal(controller.start(),false);
});

test('P7-VOICE-04 recognition is not constructed or started before an explicit start call',()=>{
  const fake=fakeRecognition(),controller=Voice.create({recognitionConstructor:fake.FakeRecognition});assert.equal(fake.instance,null);assert.deepEqual(fake.counts(),{starts:0,stops:0,aborts:0});controller.start();assert.equal(fake.counts().starts,1);
});

test('P7-VOICE-05 recognition language is zh-TW',()=>{
  const fake=fakeRecognition(),controller=Voice.create({recognitionConstructor:fake.FakeRecognition});controller.start();assert.equal(fake.instance.lang,'zh-TW');
});

test('P7-VOICE-06 push-to-talk uses non-continuous recognition',()=>{
  const fake=fakeRecognition(),controller=Voice.create({recognitionConstructor:fake.FakeRecognition});controller.start();assert.equal(fake.instance.continuous,false);
});

test('P7-VOICE-07 interim results are enabled with one alternative',()=>{
  const fake=fakeRecognition(),controller=Voice.create({recognitionConstructor:fake.FakeRecognition});controller.start();assert.equal(fake.instance.interimResults,true);assert.equal(fake.instance.maxAlternatives,1);
});

test('P7-VOICE-08 interim transcript never invokes the final callback',()=>{
  const fake=fakeRecognition(),interim=[],final=[];const controller=Voice.create({recognitionConstructor:fake.FakeRecognition,onInterim:text=>interim.push(text),onFinal:text=>final.push(text)});controller.start();fake.instance.onresult({resultIndex:0,results:[speechResult('早餐兩百',false)]});assert.equal(interim.at(-1),'早餐兩百');assert.deepEqual(final,[]);
});

test('P7-VOICE-09 final transcript reaches the final callback',()=>{
  const fake=fakeRecognition(),final=[];const controller=Voice.create({recognitionConstructor:fake.FakeRecognition,onFinal:text=>final.push(text)});controller.start();fake.instance.onresult({resultIndex:0,results:[speechResult('早餐兩百五，用錢包',true)]});assert.deepEqual(final,['早餐兩百五，用錢包']);
});

test('P7-VOICE-10 existing typed text is preserved when final speech is appended',()=>{
  assert.equal(Voice.appendTranscript('昨天午餐120元','用錢包'),'昨天午餐120元，用錢包');
});

test('P7-VOICE-11 repeated final result indexes are not appended twice',()=>{
  const fake=fakeRecognition(),final=[];const controller=Voice.create({recognitionConstructor:fake.FakeRecognition,onFinal:text=>final.push(text)});controller.start();const event={resultIndex:0,results:[speechResult('午餐180',true)]};fake.instance.onresult(event);fake.instance.onresult(event);assert.deepEqual(final,['午餐180']);
});

test('P7-VOICE-12 a new speech session may use result index zero again',()=>{
  const fake=fakeRecognition(),final=[];const controller=Voice.create({recognitionConstructor:fake.FakeRecognition,onFinal:text=>final.push(text)});controller.start();fake.instance.onresult({resultIndex:0,results:[speechResult('第一段',true)]});fake.instance.onend();controller.start();fake.instance.onresult({resultIndex:0,results:[speechResult('第二段',true)]});assert.deepEqual(final,['第一段','第二段']);
});

for(const [id,code,message] of [
  ['13','not-allowed','麥克風權限未開啟'],
  ['14','no-speech','沒有辨識到語音'],
  ['15','audio-capture','找不到可用麥克風'],
  ['16','network','語音辨識服務暫時無法使用'],
  ['17','aborted','語音輸入已取消']
])test(`P7-VOICE-${id} ${code} maps to a safe Chinese error`,()=>{const mapped=Voice.mapError(code);assert.equal(mapped.code,code);assert.match(mapped.message,new RegExp(message));assert.equal(mapped.recoverable,true);});

test('P7-VOICE-18 stop ends the current recognition session without starting another',()=>{
  const fake=fakeRecognition(),controller=Voice.create({recognitionConstructor:fake.FakeRecognition});controller.start();assert.equal(controller.stop(),true);assert.deepEqual(fake.counts(),{starts:1,stops:1,aborts:0});assert.equal(controller.getState().status,'idle');
});

test('P7-VOICE-19 destroy aborts recognition and prevents future starts',()=>{
  const fake=fakeRecognition(),controller=Voice.create({recognitionConstructor:fake.FakeRecognition});controller.start();controller.destroy();assert.equal(fake.counts().aborts,1);assert.equal(controller.start(),false);
});

test('P7-VOICE-20 voice completion never auto-submits the AI form',()=>{
  const source=read('finance/pages/home.js');assert.match(source,/onFinal:appendVoiceTranscript/);assert.doesNotMatch(source,/onFinal:\s*(?:async\s*)?[^,}]*parseAiText/);assert.match(source,/data-finance-ai-submit/);
});

test('P7-VOICE-21 page background and pagehide stop the microphone lifecycle',()=>{
  const source=read('finance/pages/home.js');assert.match(source,/visibilityState==="hidden"&&voiceActive\(\).*cancel\(\)/);assert.match(source,/pagehide",destroyVoiceController/);
});

test('P7-VOICE-22 host refresh and interim speech use local DOM patches',()=>{
  const source=read('finance/pages/home.js');assert.match(source,/silent&&productionJobBridge&&!aiHostMode\)updateHostStatusIndicators\(\)/);assert.match(source,/onInterim:text=>\{ui\.voice\.interim=text;updateVoiceIndicators\(\)/);assert.doesNotMatch(source,/onInterim:[^}]*update\(\)/);
});

test('P7-VOICE-23 no audio recording or upload API exists in the Phase 7 module',()=>{
  const source=read('finance/voice/finance-voice-input.js');assert.doesNotMatch(source,/MediaRecorder|mediaDevices|getUserMedia|Blob|base64|fetch\(|Supabase|Gateway|Ollama/);
});

test('P7-VOICE-24 production assets and safety boundaries remain correct',()=>{
  const index=read('index.html'),sw=read('sw.js'),home=read('finance/pages/home.js'),db=read('finance/storage/finance-db.js');assert.match(index,/finance\/voice\/finance-voice-input\.js\?v=1[\s\S]*finance\/pages\/home\.js\?v=68/);assert.match(index,/finance\/styles\/home\.css\?v=62/);assert.match(sw,/lizhi-cloud-v79/);assert.match(sw,/finance\/voice\/finance-voice-input\.js\?v=1/);assert.match(db,/DB_VERSION=1/);assert.match(home,/aiAutoEntryEnabled=false/);
});
