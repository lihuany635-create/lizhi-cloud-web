// Local Node-only evidence. This does NOT measure Supabase Edge CPU/memory/cold start.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {parseModel,renderAvatarJpeg} from '../supabase/functions/lizhi-viewer-cloud/render.mjs';
const key=process.argv[2]||'lahudi-academy',out=resolve(process.argv[3]||'/tmp/viewer-cloud-render-qa');
const manifest=JSON.parse(readFileSync('model-viewer/current-models.json'));
const entry=manifest.models.find(m=>m.model===key+'.glb');if(!entry)throw Error('UNKNOWN_LOCAL_MODEL');
const b=readFileSync('model-viewer/'+key+'.glb'),sha=createHash('sha256').update(b).digest('hex');
if(sha!==entry.current_sha256)throw Error('GLB_SHA_MISMATCH');
const t=performance.now(),cpu=process.cpuUsage();
const model=parseModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),{deadline:performance.now()+700});
const parseMs=performance.now()-t;
// A documented synthetic QA avatar/camera only; no production state or avatar is modified.
const a={id:'LOCAL_QA_NOT_PRODUCTION',position:[0,2.2,-120],yaw:0,pitch:0.05};
mkdirSync(out,{recursive:true});const frames=[];
for(const mode of ['first','third','top','first','first']){
 const start=performance.now();const shot=renderAvatarJpeg(model,{avatars:[{...a,mode}]},a.id,82,{deadline:performance.now()+900});
 const file=key+'-'+mode+'-'+frames.length+'.jpg';writeFileSync(resolve(out,file),shot.jpeg);
 frames.push({mode,file,render_encode_ms:+(performance.now()-start).toFixed(2),jpeg_bytes:shot.jpeg.length,sha256:createHash('sha256').update(shot.jpeg).digest('hex'),camera:shot.camera});
}
const used=process.cpuUsage(cpu),mem=process.memoryUsage();
const result={scope:'local Node process / actual SHA-verified canonical GLB / synthetic QA camera; NOT Supabase production performance or ChatGPT MCP acceptance',runtime:process.version,model:key,model_sha:sha,triangles:model.count,parse_ms:+parseMs.toFixed(2),total_wall_ms:+(performance.now()-t).toFixed(2),total_process_cpu_ms:(used.user+used.system)/1000,memory:{rss:mem.rss,heapUsed:mem.heapUsed,arrayBuffers:mem.arrayBuffers},geometry_bytes:model.tris.byteLength+model.colors.byteLength+model.emissive.byteLength+model.translucent.byteLength,frames};
writeFileSync(resolve(out,key+'-report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
