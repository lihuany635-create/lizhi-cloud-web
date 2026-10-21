// Copy only reviewable public frontend source. Runtime data, native handles,
// credentials, backend storage and hosting manifests are never vendored.
import {readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),source=process.argv[2];
if(!source)throw Error('Usage: node scripts/vendor-image-graph.mjs /absolute/path/to/image-graph-workbench');
const sourceRoot=resolve(source),publicRoot=resolve(sourceRoot,'public/workbench'),target=resolve(root,'image-graph');
const excluded=new Set(['bridge.html','bridge-page.mjs','bridge-server.mjs']);
await mkdir(target,{recursive:true});const files=[];
for(const entry of await readdir(publicRoot,{withFileTypes:true})){
 if(!entry.isFile()||!/^[-a-z0-9]+\.(mjs|css|html)$/.test(entry.name)||excluded.has(entry.name))continue;
 let content=await readFile(resolve(publicRoot,entry.name),'utf8');
 if(entry.name==='runtime-config.mjs')content="export const integrationConfig=Object.freeze({backendOrigin:'https://lizhi-image-graph.lihuany635.chatgpt.site',libraryURL:new URL('../',import.meta.url).href});\n";
 await writeFile(resolve(target,entry.name),content);files.push({name:entry.name,sha256:createHash('sha256').update(content).digest('hex')});
}
files.sort((a,b)=>a.name.localeCompare(b.name));
for(const name of await readdir(target))if(!files.some(f=>f.name===name)&&name!=='source-manifest.json')await rm(resolve(target,name));
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:sourceRoot,encoding:'utf8'}).trim();
await writeFile(resolve(target,'source-manifest.json'),JSON.stringify({source:'映構圖片關係生成工作台',source_commit:commit,backend:'https://lizhi-image-graph.lihuany635.chatgpt.site',files},null,2)+'\n');
const swPath=resolve(root,'sw.js'),sw=await readFile(swPath,'utf8'),start='  // BEGIN IMAGE GRAPH ASSETS',end='  // END IMAGE GRAPH ASSETS';
const queries=new Map();for(const f of files){const content=await readFile(resolve(target,f.name),'utf8');for(const match of content.matchAll(/(?:\.\/)?([a-z0-9-]+\.(?:mjs|css))\?v=(\d+)/g)){const set=queries.get(match[1])||new Set();set.add(match[2]);queries.set(match[1],set)}}
const assets=['image-graph/?v=36',...files.flatMap(f=>queries.has(f.name)?[...queries.get(f.name)].map(v=>'image-graph/'+f.name+'?v='+v):['image-graph/'+f.name]),'image-graph/source-manifest.json'];
const block=start+'\n'+assets.map(a=>'  '+JSON.stringify(a)+',').join('\n')+'\n'+end+'\n';
const updated=sw.includes(start)?sw.slice(0,sw.indexOf(start))+block+sw.slice(sw.indexOf(end)+end.length+1):sw.replace('const FILES=[\n','const FILES=[\n'+block);
await writeFile(swPath,updated);process.stdout.write('Vendored '+files.length+' frontend files; runtime credentials/data excluded.\n');
