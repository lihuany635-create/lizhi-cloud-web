import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFile(resolve(root,p),'utf8');
test('完整前端清單均可用且雜湊一致，模組相對引用沒有遺漏',async()=>{
 const manifest=JSON.parse(await read('image-graph/source-manifest.json'));
 for(const file of manifest.files){const source=await read('image-graph/'+file.name);assert.equal(createHash('sha256').update(source).digest('hex'),file.sha256,file.name);
  for(const match of source.matchAll(/(?:from\s*|import\s*)['"]\.\/([^'"?]+)(?:\?[^'"]*)?['"]/g))await access(resolve(root,'image-graph',match[1]));
 }
 assert.ok(manifest.files.some(f=>f.name==='source-folders.mjs'));assert.ok(manifest.files.some(f=>f.name==='returned-images.mjs'));
 assert.ok(!manifest.files.some(f=>/bridge-server|bridge\.html|hosting|secret/.test(f.name)));
});
test('離線快取包含新模組，既有模組來源與新增 iframe 同源，不導向第三方原圖來源',async()=>{
 const handlers={},context={URL,Response,self:{location:{origin:'https://lihuany635-create.github.io'},registration:{scope:'https://lihuany635-create.github.io/lizhi-cloud-web/'},addEventListener:(event,fn)=>handlers[event]=fn}};
 const source=await read('sw.js');vm.runInNewContext(source+';globalThis.assets=FILES;',context);for(const url of context.assets){const path=new URL(url).pathname.replace('/lizhi-cloud-web/','');await access(resolve(root,path||'index.html'));}
 assert.ok(context.assets.some(url=>url.includes('image-graph/runtime-config.mjs?v=26')));assert.ok(context.assets.some(url=>url.includes('engineering/engineering.js')));assert.ok(context.assets.some(url=>url.includes('finance/pages/home.js')));
 const app=await read('app.js'),render=app.slice(app.indexOf('function renderImageGraph()'),app.indexOf('function renderLicut()'));
 const markup=vm.runInNewContext(render+';renderImageGraph()',{});const src=markup.match(/<iframe[^>]+src="([^"]+)"/)[1];assert.equal(new URL(src,context.self.registration.scope).origin,context.self.location.origin);assert.doesNotMatch(markup,/sandbox|chatgpt.site/);
});
test('選單切換保留同一映構 iframe，避免丟失畫布與裝置授權狀態',async()=>{
 class Element{constructor(){this.hidden=false;this.dataset={};this.classList={toggle(){}};this.html='';this.children=[]}set innerHTML(value){this.html=value;this.loads=(this.loads||0)+1}get innerHTML(){return this.html}hasChildNodes(){return !!this.html}append(child){this.children.push(child)}setAttribute(){}contains(){return false}querySelector(){return new Element()}}
 const elements=new Map(),doc={querySelector:s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>new Element(),activeElement:null};let renders=0;
 const context={document:doc,app:new Element(),window:{},state:{route:'imagegraph',sidebar:false,cloudMedia:[]},IS_CLOUD_SITE:true,renderImageGraph:()=>{renders++;return '<iframe title="映構"></iframe>'},renderModal:()=>'',renderHome:()=>'<p>home</p>',KnowledgeHome:{render:()=>''},KnowledgeWeaving:{render:()=>''},FinanceHome:{render:()=>''},renderTrash:()=>'',renderSettings:()=>'',renderUploads:()=>''};
 vm.runInNewContext(await read('workspace-ui.js'),context);vm.runInNewContext('renderWorkspace()',context);const panel=elements.get('.main').children[0];assert.equal(renders,1);
 context.state.route='home';vm.runInNewContext('renderWorkspace()',context);assert.equal(panel.hidden,true);context.state.route='imagegraph';vm.runInNewContext('renderWorkspace()',context);assert.equal(panel.hidden,false);assert.equal(renders,1);assert.equal(panel.loads,1);
});
