import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist-mobile');
const dirs = ['a4-editor','ai-center','engineering','finance','image-graph','knowledge','library','licut','model-viewer','schemas'];
const excluded = new Set(['tests','gateway','node_modules','.git','.local-data','imports']);
const extensions = new Set(['.html','.js','.mjs','.css','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.ico','.woff','.woff2','.ttf','.wasm','.glb','.gltf','.bin','.obj','.mtl','.fbx','.txt','.mp3','.wav','.m4a','.mp4']);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const item of await readdir(root, { withFileTypes: true })) {
  if (!item.isFile() || !/\.(?:html|css|js|json|webmanifest)$/.test(item.name)) continue;
  if (['package.json','package-lock.json','capacitor.config.json','upload-status.json'].includes(item.name)) continue;
  await cp(resolve(root,item.name),resolve(out,item.name));
}
for (const dir of dirs) await cp(resolve(root,dir),resolve(out,dir), { recursive: true, filter: async path => {
  const parts = relative(root,path).split('/');
  if (parts.some(part => excluded.has(part) || part.startsWith('.'))) return false;
  return (await stat(path)).isDirectory() || extensions.has(extname(path));
}});
await mkdir(resolve(out,'mobile'), { recursive: true });
await cp(resolve(root,'mobile/mobile.css'),resolve(out,'mobile/mobile.css'));
await cp(resolve(root,'mobile/download-bridge.js'),resolve(out,'mobile/download-bridge.js'));
await build({ entryPoints:[resolve(root,'mobile/native-entry.mjs')], outfile:resolve(out,'mobile/native.js'), bundle:true, format:'iife', platform:'browser', target:'chrome109', minify:true, legalComments:'eof' });
let html = await readFile(resolve(out,'index.html'),'utf8');
html = html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '<script src="./mobile/native.js"></script>');
html = html.replace('</head>', '<link rel="stylesheet" href="./mobile/mobile.css">\n</head>');
if (!html.includes('./mobile/native.js') || html.includes('cdn.jsdelivr.net/npm/@supabase')) throw Error('Mobile SDK bundle injection failed');
await writeFile(resolve(out,'index.html'),html);
async function injectDownloadBridge(dir) {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const path=resolve(dir,item.name);
    if(item.isDirectory())await injectDownloadBridge(path);
    else if(item.name.endsWith('.html')) {
      const prefix=relative(dirname(path),out).split('/').join('/') || '.';
      const source=await readFile(path,'utf8');
      await writeFile(path,source.replace('</head>',`<script defer src="${prefix}/mobile/download-bridge.js"></script>\n</head>`));
    }
  }
}
await injectDownloadBridge(out);
await writeFile(resolve(out,'mobile/build.json'),JSON.stringify({version:JSON.parse(await readFile(resolve(root,'package.json'),'utf8')).version,builtAt:new Date().toISOString()},null,2));
console.log('Android web assets prepared: dist-mobile (local SDK, existing module assets, no server code).');
