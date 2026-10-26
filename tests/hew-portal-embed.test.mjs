import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
const read=path=>readFileSync(path,'utf8')
function setup({available=true,authorized=true}={}) {
 const login={data:{user:authorized?{id:'11111111-1111-4111-8111-111111111111',email:'owner@example.test'}:null},error:null}
 const host={dataset:{},children:[],replaceChildren(...items){this.children=items}}
 const panel={querySelector:key=>key==='#lizhi-hew-editor-root'?host:null}
 const calls=[]
 const win={LizhiAuth:{allowedEmail:'owner@example.test',client:{auth:{getUser:async()=>login}}}}
 const doc={createElement(tag){return {tag,setAttribute(k,v){this[k]=v},style:{},textContent:''}}}
 const context={URL,window:win,document:doc,location:{
   origin:'https://lihuany635-create.github.io',pathname:'/lizhi-cloud-web/',},
   fetch:async(url,opts)=>{calls.push({url:String(url),opts});return {
      status:available?200:404,headers:{get:()=>available?'text/html':'text/html'},
   }},
 }
 vm.runInNewContext(read('hew/portal-host.js'),context)
 return {mount:()=>win.LizhiHewEditor.mount(panel),win,host,calls}
}
test('Cloud parent mounts only a same-origin vetted Hew WASM iframe',async()=>{
 const {mount,host,calls}=setup()
 await mount()
 assert.equal(calls.length,1)
 assert.equal(calls[0].url,'https://lihuany635-create.github.io/lizhi-cloud-web/hew-editor/index.html')
 assert.equal(calls[0].opts.method,'HEAD')
 assert.equal(host.dataset.lizhiMounted,'true')
 assert.equal(host.children[0].tag,'iframe')
 assert.equal(host.children[0].src,'https://lihuany635-create.github.io/lizhi-cloud-web/hew-editor/?lizhi-model-queue=1')
 assert.ok(!host.children[0].src.includes('token'))
})
test('Cloud Hew host fails closed without real compiled iframe assets',async()=>{
 const {mount,host}=setup({available:false})
 await mount()
 assert.notEqual(host.dataset.lizhiMounted,'true')
 assert.match(host.children[0].textContent,/尚未部署/)
})
test('Cloud Hew host refuses unauthenticated users before any network probe',async()=>{
 const {mount,host,calls}=setup({authorized:false})
 await mount()
 assert.equal(calls.length,0)
 assert.match(host.children[0].textContent,/未通過本人/)
})
test('Hew route is separate from the existing GLB viewer and CAD route',()=>{
 const app=read('app.js'),ui=read('workspace-ui.js'),auth=read('auth.js')
 assert.match(app,/function renderModel3d\(\)/)
 assert.match(app,/function renderHew3d\(\)/)
 assert.match(app,/"model3d","模","3D 模型檢視器"/)
 assert.match(app,/"hew3d","立","Hew 3D 建模"/)
 assert.match(ui,/state\.route === 'hew3d'/)
 assert.match(ui,/LizhiHewEditor\?\.mount\(panel\)/)
 assert.match(auth,/"hew3d"/)
 assert.ok(!read('hew/portal-host.js').includes('window.postMessage('))
})

test('Pages deploy pins an immutable Hew source and preserves original CAD before adding editor',()=>{
 const pages=read('.github/workflows/pages.yml')
 const preview=read('.github/workflows/hew-editor-integration-preview.yml')
 const pin='6ecaae5c0758b1d0b03d3be8e2bd63a335b89245'
 assert.ok(pages.includes('ref: '+pin))
 assert.ok(preview.includes('ref: '+pin))
 assert.ok(pages.indexOf('Compile CADCraft into existing portal') <
           pages.indexOf('Compile native Hew editor to relative URL subpath'))
 assert.match(pages,/bash hew\/build-embedded-runtime\.sh/)
 assert.match(pages,/node --test tests\/hew-portal-embed\.test\.mjs/)
 assert.match(pages,/Remove temporary Hew source and build dependencies/)
 const builder=read('hew/build-embedded-runtime.sh')
 assert.match(builder,/REFUSING_TO_OVERWRITE_NONGENERATED_HEW_EDITOR/)
 assert.match(builder,/AGPL-3\.0\.txt/)
 assert.match(builder,/SOURCE\.txt/)
 assert.match(builder,/LIZHI_HEW_EDITOR_ASSEMBLED/)
})
