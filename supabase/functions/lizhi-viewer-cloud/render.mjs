// Server-side CPU renderer for cloud avatar screenshots (no GPU, no browser).
// Loads the canonical GLB, places it in the same "viewer coordinates" as the web viewer
// and the nav grid (glTF world space, shifted so the lowest vertex sits on y = 0), and
// rasterises the current cloud-avatar camera into RGBA pixels with a z-buffer.
// Scope: base colours + simple sun/hemisphere lighting. No textures, shadows, reflections
// or glass refraction; translucent/transmissive materials are drawn see-through.
import { encodeJpeg } from './jpeg-encoder.mjs';

export const WIDTH = 640, HEIGHT = 360, VFOV_DEG = 45, EYE_HEIGHT = 1.6, THIRD_DISTANCE = 3.2, THIRD_LIFT = 0.5;

export const MAX_TRIANGLES = 300000;
const COMPONENT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const WIDTH_OF = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readAccessor(gltf, bin, index) {
  const a = gltf.accessors[index];
  if (!a || a.bufferView === undefined || a.sparse) throw Error('GLB_ACCESSOR_UNSUPPORTED');
  const view = gltf.bufferViews?.[a.bufferView], Type = COMPONENT[a.componentType], n = WIDTH_OF[a.type];
  if (!view || (view.buffer ?? 0)!==0 || !Type || !n || a.normalized) throw Error('GLB_ACCESSOR_UNSUPPORTED');
  if(!Number.isSafeInteger(a.count)||a.count<0||a.count*n>3000000)throw Error('MODEL_TOO_LARGE_FOR_CLOUD_RENDER');
  const size = Type.BYTES_PER_ELEMENT, start = (view.byteOffset || 0) + (a.byteOffset || 0), stride = view.byteStride || n * size;
  const end = start + Math.max(0,a.count-1)*stride+n*size;
  if(!Number.isSafeInteger(start)||start<0||!Number.isSafeInteger(stride)||stride<n*size||end>bin.byteLength||end>(view.byteOffset||0)+view.byteLength)throw Error('INVALID_GLB_ACCESSOR_BOUNDS');
  const out = new Type(a.count * n);
  if (stride === n * size && (bin.byteOffset + start) % size === 0) {
    out.set(new Type(bin.buffer, bin.byteOffset + start, a.count * n));
    return out;
  }
  const dv = new DataView(bin.buffer, bin.byteOffset);
  const get = { 1: (o) => dv.getUint8(o), 2: (o) => dv.getUint16(o, true), 4: Type === Float32Array ? (o) => dv.getFloat32(o, true) : (o) => dv.getUint32(o, true) }[size];
  for (let i = 0; i < a.count; i++) for (let j = 0; j < n; j++) out[i * n + j] = get(start + i * stride + j * size);
  return out;
}

function multiply(a, b) { // column-major 4x4: a * b
  const r = new Float64Array(16);
  for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + row] * b[c * 4 + k]; r[c * 4 + row] = s;
  }
  return r;
}
function localMatrix(node) {
  if (node.matrix) return Float64Array.from(node.matrix);
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1], [sx, sy, sz] = node.scale || [1, 1, 1], [tx, ty, tz] = node.translation || [0, 0, 0];
  return Float64Array.from([
    (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1]);
}

function materialInfo(m) {
  const pbr = m?.pbrMetallicRoughness || {}, f = pbr.baseColorFactor || [1, 1, 1, 1];
  // Textured materials: the texture is not sampled; soften pure-white factors to a neutral tone.
  const k = pbr.baseColorTexture && f[0] === 1 && f[1] === 1 && f[2] === 1 ? 0.72 : 1;
  const e = m?.emissiveFactor || [0, 0, 0], es = m?.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1;
  const transmission = m?.extensions?.KHR_materials_transmission?.transmissionFactor ?? 0;
  const translucent = transmission > 0.4 || (m?.alphaMode === 'BLEND' && (f[3] ?? 1) < 0.95);
  return { color: [f[0] * k, f[1] * k, f[2] * k], emissive: [e[0] * es, e[1] * es, e[2] * es], translucent };
}

/** Parse a GLB into flat world-space triangles in viewer coordinates. */
export function parseModel(arrayBuffer, {deadline=Infinity}={}) {
  if(!(arrayBuffer instanceof ArrayBuffer)||arrayBuffer.byteLength<28)throw Error('INVALID_GLB');
  const bytes = new Uint8Array(arrayBuffer), dv = new DataView(arrayBuffer);
  if (dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(4, true) !== 2 || dv.getUint32(8,true)!==arrayBuffer.byteLength || dv.getUint32(16,true)!==0x4e4f534a) throw Error('INVALID_GLB');
  const jsonLength = dv.getUint32(12, true);
  if(jsonLength>bytes.byteLength-28)throw Error('INVALID_GLB');
  const gltf = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)));
  const binStart = 20 + jsonLength, binLength = dv.getUint32(binStart, true);
  if(dv.getUint32(binStart+4,true)!==0x004e4942||binStart+8+binLength>bytes.byteLength||(gltf.buffers||[]).some(b=>b.uri))throw Error('INVALID_GLB');
  const bin = bytes.subarray(binStart + 8, binStart + 8 + binLength);
  const materials = (gltf.materials || []).map(materialInfo), fallback = materialInfo(null);
  const meshCache = new Map(), parts = [];
  let total = 0;
  const meshOf = (i) => {
    if (meshCache.has(i)) return meshCache.get(i);
    if(!gltf.meshes?.[i]||(gltf.meshes[i].primitives||[]).some(p=>(p.mode??4)!==4||p.targets||p.extensions?.KHR_draco_mesh_compression))throw Error('GLB_PRIMITIVE_UNSUPPORTED');
    const prims = gltf.meshes[i].primitives.filter((p) => (p.mode ?? 4) === 4 && p.attributes?.POSITION !== undefined)
      .map((p) => ({ pos: readAccessor(gltf, bin, p.attributes.POSITION), idx: p.indices !== undefined ? readAccessor(gltf, bin, p.indices) : null, mat: materials[p.material] || fallback }));
    meshCache.set(i, prims); return prims;
  };
  const visit = (index, parent, depth) => {
    if (depth > 64) throw Error('GLB_NODE_DEPTH');
    if(performance.now()>deadline)throw Error('CLOUD_RENDER_BUDGET_EXCEEDED');
    const node = gltf.nodes?.[index];if(!node||node.skin!==undefined)throw Error('GLB_NODE_UNSUPPORTED');
    const world = multiply(parent, localMatrix(node));
    if (node.mesh !== undefined) for (const p of meshOf(node.mesh)) { parts.push([world, p]); const count=p.idx?p.idx.length:p.pos.length/3;if(count%3)throw Error('GLB_PRIMITIVE_UNSUPPORTED');total += count/3;if(total>MAX_TRIANGLES)throw Error('MODEL_TOO_LARGE_FOR_CLOUD_RENDER'); }
    for (const child of node.children || []) visit(child, world, depth + 1);
  };
  const identity = Float64Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  for (const root of gltf.scenes?.[gltf.scene || 0]?.nodes || []) visit(root, identity, 0);
  if(total===0)throw Error('GLB_NO_RENDERABLE_TRIANGLES');
  if(total>MAX_TRIANGLES)throw Error('MODEL_TOO_LARGE_FOR_CLOUD_RENDER');

  const tris = new Float32Array(total * 9), colors = new Float32Array(total * 3), emissive = new Float32Array(total * 3), translucent = new Uint8Array(total);
  let t = 0, minY = Infinity;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const [m, p] of parts) {
    const a = p.pos, ix = p.idx, count = ix ? ix.length : a.length / 3;
    for (let i = 0; i + 2 < count; i += 3, t++) {
      if((t&255)===0&&performance.now()>deadline)throw Error('CLOUD_RENDER_BUDGET_EXCEEDED');
      for (let v = 0; v < 3; v++) {
        const k = (ix ? ix[i + v] : i + v) * 3, x = a[k], y = a[k + 1], z = a[k + 2], o = t * 9 + v * 3;
        if(!Number.isSafeInteger(k)||k<0||k+2>=a.length)throw Error('INVALID_GLB_INDEX');
        const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if(![wx,wy,wz].every(Number.isFinite))throw Error('INVALID_GLB_POSITION');
        tris[o] = wx; tris[o + 1] = wy; tris[o + 2] = wz;
        if (wy < minY) minY = wy;
        if (wx < min[0]) min[0] = wx; if (wx > max[0]) max[0] = wx; if (wz < min[2]) min[2] = wz; if (wz > max[2]) max[2] = wz; if (wy > max[1]) max[1] = wy;
      }
      colors.set(p.mat.color, t * 3); emissive.set(p.mat.emissive, t * 3); translucent[t] = p.mat.translucent ? 1 : 0;
    }
  }
  const yOffset = Number.isFinite(minY) ? -minY : 0; // same rule as the viewer and nav grid
  for (let i = 1; i < tris.length; i += 3) tris[i] += yOffset;
  min[1] = 0; max[1] += yOffset;
  return { tris, colors, emissive, translucent, count: t, yOffset, bounds: { min, max } };
}

/** Camera that matches the web viewer's cloud-follow mode for this avatar. */
export function avatarCamera(avatar) {
  if(!Array.isArray(avatar?.position)||avatar.position.length!==3||!avatar.position.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000)||![avatar.yaw??0,avatar.pitch??0].every(Number.isFinite))throw Error('INVALID_AVATAR_CAMERA');
  const yaw = Number(avatar.yaw) || 0, pitch = Number(avatar.pitch) || 0, [x, y, z] = avatar.position;
  const eye = [x, y + EYE_HEIGHT, z], d = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const mode = ['first', 'third', 'free', 'top'].includes(avatar.mode) ? avatar.mode : 'first';
  if(mode==='top')return {mode,position:[eye[0],eye[1]+10,eye[2]],target:eye,hide_selected:false};
  if (mode === 'first') return { mode, position: eye, target: [eye[0] + d[0], eye[1] + d[1], eye[2] + d[2]], hide_selected: true };
  return { mode, position: [eye[0] - THIRD_DISTANCE * d[0], eye[1] - THIRD_DISTANCE * d[1] + THIRD_LIFT, eye[2] - THIRD_DISTANCE * d[2]], target: eye, hide_selected: false };
}

const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const toSrgb = (c) => { const v = c <= 0 ? 0 : c >= 1 ? 1 : c; return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); };

function avatarBoxes(avatars, hideId, selectedId) {
  // Simple mannequins (body + head) so other avatars and the third-person subject are visible.
  const out = [];
  for (const a of avatars) {
    if (!Array.isArray(a.position) || a.id === hideId) continue;
    const color = a.id === selectedId ? [0.85, 0.32, 0.08] : [0.12, 0.3, 0.85], yaw = Number(a.yaw) || 0, [px, py, pz] = a.position;
    for (const [w, h, d, y0] of [[0.42, 1.42, 0.26, 0], [0.24, 0.26, 0.24, 1.46]]) {
      const c = Math.cos(yaw), s = Math.sin(yaw), corner = [];
      for (const [dx, dy, dz] of [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]) {
        const lx = dx * w / 2, lz = dz * d / 2; corner.push([px + lx * c + lz * s, py + y0 + dy * h, pz - lx * s + lz * c]);
      }
      for (const [i, j, k, l] of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
        out.push([corner[i], corner[j], corner[k], color]); out.push([corner[i], corner[k], corner[l], color]);
      }
    }
  }
  return out;
}

/** Render one frame. Returns RGBA pixels plus the camera actually used. */
export function renderFrame(model, camera, avatars = [], selectedId = null, width = WIDTH, height = HEIGHT, {deadline=Infinity}={}) {
  const eye = camera.position, f = norm([camera.target[0] - eye[0], camera.target[1] - eye[1], camera.target[2] - eye[2]]);
  let s = cross(f, [0, 1, 0]); if (Math.hypot(...s) < 1e-6) s = [1, 0, 0]; s = norm(s);
  const u = cross(s, f), fy = 1 / Math.tan(VFOV_DEG * Math.PI / 360), fx = fy * height / width, NEAR = 0.05;
  const zbuf = new Float32Array(width * height).fill(Infinity), lin = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y++) { // sky gradient like the viewer stage background
    const t = y / (height - 1), r = 0.62 + 0.14 * t, g = 0.7 + 0.1 * t, b = 0.78 + 0.06 * t;
    for (let x = 0; x < width; x++) { const o = (y * width + x) * 3; lin[o] = r; lin[o + 1] = g; lin[o + 2] = b; }
  }
  const sun = norm([-0.8, 1.6, 1.1]);
  const cam = new Float64Array(9), clip = [], poly = [];
  let drawn = 0;

  let rasterCalls=0;
  const raster = (wv, base, emit, alpha) => {
    if((rasterCalls++&63)===0&&performance.now()>deadline)throw Error('CLOUD_RENDER_BUDGET_EXCEEDED');
    // wv: 9 world coords. Flat shading with a camera-facing normal (double-sided surfaces).
    const e1 = [wv[3] - wv[0], wv[4] - wv[1], wv[5] - wv[2]], e2 = [wv[6] - wv[0], wv[7] - wv[1], wv[8] - wv[2]];
    let n = norm(cross(e1, e2));
    const toEye = [eye[0] - wv[0], eye[1] - wv[1], eye[2] - wv[2]];
    if (n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2] < 0) n = [-n[0], -n[1], -n[2]];
    const diffuse = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]), hemi = 0.5 + 0.5 * n[1];
    const light = 0.46 + 0.24 * hemi + 0.56 * diffuse;
    const lr = base[0] * light + emit[0], lg = base[1] * light + emit[1], lb = base[2] * light + emit[2];
    for (let v = 0; v < 3; v++) {
      const dx = wv[v * 3] - eye[0], dy = wv[v * 3 + 1] - eye[1], dz = wv[v * 3 + 2] - eye[2];
      cam[v * 3] = dx * s[0] + dy * s[1] + dz * s[2]; cam[v * 3 + 1] = dx * u[0] + dy * u[1] + dz * u[2]; cam[v * 3 + 2] = dx * f[0] + dy * f[1] + dz * f[2];
    }
    if (cam[2] < NEAR && cam[5] < NEAR && cam[8] < NEAR) return;
    // Sutherland-Hodgman clip against the near plane.
    poly.length = 0;
    for (let v = 0; v < 3; v++) {
      const a = v * 3, b = ((v + 1) % 3) * 3, ain = cam[a + 2] >= NEAR, bin = cam[b + 2] >= NEAR;
      if (ain) poly.push([cam[a], cam[a + 1], cam[a + 2]]);
      if (ain !== bin) { const t = (NEAR - cam[a + 2]) / (cam[b + 2] - cam[a + 2]); poly.push([cam[a] + t * (cam[b] - cam[a]), cam[a + 1] + t * (cam[b + 1] - cam[a + 1]), NEAR]); }
    }
    if (poly.length < 3) return;
    clip.length = 0;
    for (const [x, y, z] of poly) clip.push([(x / z * fx + 1) * width / 2, (1 - y / z * fy) * height / 2, 1 / z]);
    drawn++;
    for (let k = 1; k + 1 < clip.length; k++) {
      const [x0, y0, w0] = clip[0], [x1, y1, w1] = clip[k], [x2, y2, w2] = clip[k + 1];
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (Math.abs(area) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1, y2)));
      if (minX > maxX || minY > maxY) continue;
      const inv = 1 / area;
      for (let py = minY; py <= maxY; py++) {
        if((py&31)===0&&performance.now()>deadline)throw Error('CLOUD_RENDER_BUDGET_EXCEEDED');
        const qy = py + 0.5;
        for (let px = minX; px <= maxX; px++) {
          const qx = px + 0.5;
          const b0 = ((x1 - qx) * (y2 - qy) - (x2 - qx) * (y1 - qy)) * inv, b1 = ((x2 - qx) * (y0 - qy) - (x0 - qx) * (y2 - qy)) * inv, b2 = 1 - b0 - b1;
          if (b0 < 0 || b1 < 0 || b2 < 0) continue;
          const depth = 1 / (b0 * w0 + b1 * w1 + b2 * w2), o = py * width + px;
          if (depth >= zbuf[o]) continue;
          const c = o * 3;
          if (alpha >= 1) { zbuf[o] = depth; lin[c] = lr; lin[c + 1] = lg; lin[c + 2] = lb; }
          else { lin[c] = lin[c] * (1 - alpha) + lr * alpha; lin[c + 1] = lin[c + 1] * (1 - alpha) + lg * alpha; lin[c + 2] = lin[c + 2] * (1 - alpha) + lb * alpha; }
        }
      }
    }
  };

  // Ground plane at y = 0 (the viewer also draws one), slightly below to avoid z-fighting.
  const { min, max } = model.bounds, cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2;
  const R = Math.max(max[0] - min[0], max[2] - min[2], 20) * 2, gy = -0.003, ground = [0.55, 0.57, 0.53], zero = [0, 0, 0];
  raster([cx - R, gy, cz - R, cx + R, gy, cz - R, cx + R, gy, cz + R], ground, zero, 1);
  raster([cx - R, gy, cz - R, cx + R, gy, cz + R, cx - R, gy, cz + R], ground, zero, 1);

  const wv = new Float64Array(9), T = model.tris, C = model.colors, E = model.emissive;
  for (const pass of [0, 1]) {
    for (let t = 0; t < model.count; t++) {
      if (model.translucent[t] !== pass) continue;
      for (let i = 0; i < 9; i++) wv[i] = T[t * 9 + i];
      raster(wv, [C[t * 3], C[t * 3 + 1], C[t * 3 + 2]], [E[t * 3], E[t * 3 + 1], E[t * 3 + 2]], pass ? 0.3 : 1);
    }
    if (pass === 0) for (const [a, b, c, color] of avatarBoxes(avatars, camera.hide_selected ? selectedId : null, selectedId)) raster([...a, ...b, ...c], color, zero, 1);
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < lin.length; i += 3, j += 4) { rgba[j] = toSrgb(lin[i]); rgba[j + 1] = toSrgb(lin[i + 1]); rgba[j + 2] = toSrgb(lin[i + 2]); rgba[j + 3] = 255; }
  return { rgba, width, height, triangles_drawn: drawn };
}

/** Render the current avatar view and encode it as JPEG. */
export function renderAvatarJpeg(model, state, avatarId, quality = 82, options={}) {
  const avatar = state.avatars.find((a) => a.id === avatarId);
  if (!avatar) throw Error('AVATAR_NOT_FOUND');
  const camera = avatarCamera(avatar);
  const frame = renderFrame(model, camera, state.avatars, avatarId, WIDTH, HEIGHT, options);
  const jpeg = encodeJpeg(frame.rgba, frame.width, frame.height, quality);
  const round = (v) => v.map((n) => Math.round(n * 1000) / 1000);
  return { jpeg, triangles_drawn: frame.triangles_drawn,
    camera: { mode: camera.mode, position: round(camera.position), target: round(camera.target), vfov_deg: VFOV_DEG, width: frame.width, height: frame.height, eye_height_m: EYE_HEIGHT } };
}
