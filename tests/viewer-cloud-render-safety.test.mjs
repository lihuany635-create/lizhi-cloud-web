import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseModel,avatarCamera,renderAvatarJpeg,MAX_TRIANGLES} from '../supabase/functions/lizhi-viewer-cloud/render.mjs';
import {encodeJpeg} from '../supabase/functions/lizhi-viewer-cloud/jpeg-encoder.mjs';
import {isViewerJpeg} from '../sites-migration/viewer-cloud-direct/site-cloud-direct-mcp.mjs';
function fixture(edit=()=>{}){
 const f=new Float32Array([-1,2,3,1,2,3,0,4,3]);
 const g={asset:{version:'2.0'},buffers:[{byteLength:f.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:f.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],nodes:[{mesh:0,translation:[2,-3,4]}],scenes:[{nodes:[0]}],scene:0};
 edit(g);let text=Buffer.from(JSON.stringify(g));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]);
 const b=Buffer.alloc(28+text.length+f.byteLength);b.writeUInt32LE(0x46546c67,0);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);b.writeUInt32LE(text.length,12);b.writeUInt32LE(0x4e4f534a,16);text.copy(b,20);b.writeUInt32LE(f.byteLength,20+text.length);b.writeUInt32LE(0x004e4942,24+text.length);Buffer.from(f.buffer).copy(b,28+text.length);
 return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
}
test('viewer coordinate transform applies node translation and lowest-point Y normalization',()=>{
 const m=parseModel(fixture());assert.equal(m.count,1);assert.equal(m.yOffset,1);
 assert.deepEqual([...m.tris],[1,0,7,3,0,7,2,2,7]);
});
test('camera first, third and top use distinct correct positions; free fallback is explicit',()=>{
 const a={position:[1,2,3],yaw:0,pitch:0};
 assert.deepEqual(avatarCamera({...a,mode:'first'}).position,[1,3.6,3]);
 assert.deepEqual(avatarCamera({...a,mode:'third'}).position,[1,4.1,-0.20000000000000018]);
 assert.deepEqual(avatarCamera({...a,mode:'top'}).position,[1,13.6,3]);
 assert.deepEqual(avatarCamera({...a,mode:'free'}).position,avatarCamera({...a,mode:'third'}).position);
 assert.throws(()=>avatarCamera({...a,position:[NaN,0,0]}),/INVALID_AVATAR_CAMERA/);
});
test('malformed/empty/oversized/unsupported geometry is rejected instead of a sky-only success',()=>{
 assert.throws(()=>parseModel(new ArrayBuffer(4)),/INVALID_GLB/);
 assert.throws(()=>parseModel(fixture(g=>g.scenes[0].nodes=[])),/GLB_NO_RENDERABLE_TRIANGLES/);
 assert.throws(()=>parseModel(fixture(g=>g.accessors[0].count=3000001)),/MODEL_TOO_LARGE/);
 assert.throws(()=>parseModel(fixture(g=>g.accessors[0].byteOffset=9999)),/INVALID_GLB_ACCESSOR_BOUNDS/);
 assert.throws(()=>parseModel(fixture(g=>g.nodes[0].skin=0)),/GLB_NODE_UNSUPPORTED/);
 assert.throws(()=>parseModel(fixture(g=>g.meshes[0].primitives[0].mode=1)),/GLB_PRIMITIVE_UNSUPPORTED/);
 assert.equal(MAX_TRIANGLES,300000);
});
test('cooperative CPU budgets fail closed and real encoder output has required dimensions',()=>{
 assert.throws(()=>parseModel(fixture(),{deadline:-1}),/CLOUD_RENDER_BUDGET_EXCEEDED/);
 const m=parseModel(fixture()),state={avatars:[{id:'qa',position:[0,0,0],mode:'first',yaw:0,pitch:0}]};
 assert.throws(()=>renderAvatarJpeg(m,state,'qa',82,{deadline:-1}),/CLOUD_RENDER_BUDGET_EXCEEDED/);
 const shot=renderAvatarJpeg(m,state,'qa');assert(isViewerJpeg(Buffer.from(shot.jpeg).toString('base64')));
 assert(!isViewerJpeg('/9j/'+'A'.repeat(1100)));assert(!isViewerJpeg('not-base64'));
});
test('actual academy geometry produces different JPEGs for changed camera modes',()=>{
 const b=readFileSync('model-viewer/lahudi-academy.glb');const m=parseModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 const a={id:'qa',position:[0,2.2,-120],yaw:0,pitch:0.05};
 const pictures=['first','third','top'].map(mode=>Buffer.from(renderAvatarJpeg(m,{avatars:[{...a,mode}]},'qa').jpeg).toString('base64'));
 assert.equal(new Set(pictures).size,3);for(const p of pictures)assert(isViewerJpeg(p));
});

test('reused JPEG encoder resets frame state and honors dimensions and quality',()=>{
 const data=new Uint8Array(640*360*4).fill(180);
 const first=Buffer.from(encodeJpeg(data,640,360,82));
 encodeJpeg(new Uint8Array(320*180*4).fill(12),320,180,40);
 assert.deepEqual(Buffer.from(encodeJpeg(data,640,360,82)),first);
 assert(isViewerJpeg(first.toString('base64')));
 assert(!isViewerJpeg(Buffer.from(encodeJpeg(new Uint8Array(320*180*4),320,180,82)).toString('base64')));
 assert.throws(()=>encodeJpeg(data,100000,360,82),/INVALID_JPEG_INPUT/);
});
