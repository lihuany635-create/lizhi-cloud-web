import {readFileSync} from 'node:fs';import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';import {test} from 'node:test';import assert from 'node:assert/strict';
const compile=(file,replacements=[])=>{let s=readFileSync(file,'utf8');for(const [a,b]of replacements)s=s.replaceAll(a,b);return 'data:text/javascript;base64,'+Buffer.from(transpileModule(s,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText).toString('base64');};
const model=compile('lib/model-flow.ts'),workflow=compile('lib/workflow.ts',[["from './model-flow'",`from '${model}'`]]),portfolio=compile('lib/portfolio.ts',[["from './workflow.ts'",`from '${workflow}'`]]),managed=compile('lib/project-management.ts',[["from './workflow.ts'",`from '${workflow}'`],["from './portfolio.ts'",`from '${portfolio}'`]]),images=compile('lib/project-images.ts',[["from './workflow.ts'",`from '${workflow}'`],["from './project-management.ts'",`from '${managed}'`]]),backend=compile('backend/images.ts',[["from '../lib/workflow.ts'",`from '${workflow}'`],["from '../lib/project-management.ts'",`from '${managed}'`],["from '../lib/project-images.ts'",`from '${images}'`]]);
const {operateManaged,managedView}=await import(managed),{inspectImage,imageObjectPath,attachProjectImage,findProjectImage,updateProjectImage,MAX_IMAGE_BYTES}=await import(images),{handleProjectImages}=await import(backend),{FlowError}=await import(workflow);
const {Workbench,MARKER,WORKSPACE_TITLE,encodeRow,decodeRow}=await import('../../../photo-sheet/workbench.mjs');
const {projectImageTool}=await import(compile('lib/mcp-images.ts',[["from './workflow'",`from '${workflow}'`]]));
const owner=crypto.randomUUID(),author={id:owner,name:'隔離作者',kind:'author'},ai={id:owner,name:'隔離MCP',kind:'ai'};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
function harness(){
 const made=operateManaged({rows:[]},'createManagedProject',[{key:crypto.randomUUID(),type:'general',name:WORKSPACE_TITLE,description:MARKER}],author);
 let current={revision:1,data:made.state};const objects=new Map();
 const services={read:async()=>structuredClone(current),commit:async(revision,data)=>{assert.equal(revision,current.revision);current={revision:revision+1,data};},upload:async(path,bytes)=>objects.set(path,bytes),remove:async path=>objects.delete(path),signed:async path=>'https://fixture.invalid/'+path};
 const request=async(path,body)=>{
  const u=new URL('https://fixture.invalid/'+path);
  if(u.pathname==='/workspace')return operateManaged(current.data,u.searchParams.has('id')?'getManagedProject':'listManagedProjects',u.searchParams.has('id')?[u.searchParams.get('id')]:[],author).result;
  return handleProjectImages(new Request('https://fixture.invalid/images'+u.search,{method:body?'POST':'GET',...body?{headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body:body instanceof FormData?body:JSON.stringify(body)}:{}}),author,services);
 };
 const deps={project:async id=>managedView(current.data,id),request:async(path,req)=>{try{return Response.json(await handleProjectImages(new Request('https://fixture.invalid/images'+path,req),ai,services));}catch(e){return Response.json({error:e.message},{status:e.status||500});}},fetch:async url=>{const bytes=objects.get(new URL(url).pathname.slice(1));return new Response(bytes,{status:bytes?200:404});}};
 return {id:made.result.id,request,deps,objects,get project(){return managedView(current.data,made.result.id);}};
}
const parsed=r=>JSON.parse(r.content[0].text);
async function importPhoto(h,batch){const p=h.project,row={rowKey:crypto.randomUUID(),name:'測試.png',time:100,w:1,h:1,text:'2F_鋼筋查驗',driveFileId:'fixture-drive-file',driveFolderId:'fixture-drive-folder'};const result=parsed(await projectImageTool('import_project_image',{projectId:p.id,revision:p.revision,key:crypto.randomUUID(),filename:'fixture.png',mimeType:'image/png',dataBase64:png.toString('base64'),description:encodeRow(row,0,batch),recordId:'',stageId:''},h.deps));return {row,result};}
test('隔離整合：既有MCP處理器匯入PNG→網頁列批次→下載核對→回填→重新開啟',async()=>{
 const h=harness(),{result}=await importPhoto(h,'A'),client=new Workbench(h.request);
 assert.equal((await client.list()).length,1);await client.open(h.id);assert.deepEqual(await client.batches(),['A']);
 const originalFetch=globalThis.fetch;globalThis.fetch=h.deps.fetch;let rows;
 try{rows=await client.loadRows('A');assert.equal(rows.length,1);assert.deepEqual(Buffer.from(await rows[0].blob.arrayBuffer()),png);assert.equal(rows[0].driveFileId,'fixture-drive-file');
 const image=h.project.images[0],next={...JSON.parse(image.description),text:'2F_柱鋼筋綁紮'};
 await projectImageTool('update_project_image',{projectId:h.id,revision:h.project.revision,key:crypto.randomUUID(),imageId:result.image.id,description:JSON.stringify(next),recordId:'',stageId:''},h.deps);
 await assert.rejects(client.save(rows,'A'),/更新/);await client.open(h.id);const refreshed=await client.loadRows('A');assert.equal(refreshed[0].text,'2F_柱鋼筋綁紮');assert.deepEqual(Buffer.from(await refreshed[0].blob.arrayBuffer()),png);refreshed.forEach(r=>URL.revokeObjectURL(r.url));
 }finally{globalThis.fetch=originalFetch;rows?.forEach(r=>URL.revokeObjectURL(r.url));}
});
test('隔離整合：網頁修改說明經後端保存，MCP讀回原圖與來源ID不變',async()=>{
 const h=harness();await importPhoto(h,'A');await importPhoto(h,'B');const client=new Workbench(h.request);await client.open(h.id);
 const image=h.project.images.find(i=>decodeRow(i).batch==='A'),row=decodeRow(image);row.text='人工複查完成';await client.save([row],'A');const read=await projectImageTool('read_project_image',{projectId:h.id,imageId:image.id},h.deps);
 assert.equal(decodeRow(h.project.images.find(i=>i.id===image.id)).text,'人工複查完成');assert.deepEqual(Buffer.from(read.content[1].data,'base64'),png);assert.equal(decodeRow(h.project.images.find(i=>i.id===image.id)).driveFolderId,'fixture-drive-folder');assert.equal(h.project.images.length,2);assert.equal(h.objects.size,2);
});
