// 立之雲端庫・首頁 3D 伸展台引擎
// 由 home-stage/characters.js 在首頁顯示時才載入。需要 window.THREE（r128）。
// 角色：預設程式生成角色，或自製 3D 模型（GLB／glTF／VRM／FBX）。
(function () {
  "use strict";

  const LIB = {
    gltf: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js",
    fflate: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/fflate.min.js",
    fbx: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js",
  };
  const WALK = 2.6, RUN = 5.4;

  // 伸展台尺寸（公尺）。角色從近端（+Z）出發，往遠端（-Z）走。
  const TOP = 0.35, RUN_W = 5, RUN_NEAR = 8, RUN_FAR = -600, FAR_R = 4.2, NEAR_R = 3, PAD = 0.32;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      const t = setTimeout(() => { s.remove(); reject(new Error("載入逾時：" + src)); }, 15000);
      s.src = src; s.async = true; s.crossOrigin = "anonymous";
      s.onload = () => { clearTimeout(t); resolve(); };
      s.onerror = () => { clearTimeout(t); reject(new Error("無法載入：" + src)); };
      document.head.appendChild(s);
    });
  }
  async function ensureLoader(format) {
    const THREE = window.THREE;
    if (format === "fbx") {
      if (!window.fflate) await loadScript(LIB.fflate);
      if (!THREE.FBXLoader) await loadScript(LIB.fbx);
    } else if (!THREE.GLTFLoader) await loadScript(LIB.gltf);
  }

  function allowed(x, z) {
    if (Math.abs(x) <= RUN_W / 2 - PAD && z <= RUN_NEAR && z >= RUN_FAR) return true;
    if (Math.hypot(x, z - RUN_FAR) <= FAR_R - PAD) return true;
    if (Math.hypot(x, z - RUN_NEAR) <= NEAR_R - PAD) return true;
    return false;
  }
  const toLinear = (o) => { const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { if (x.color && !x.userData.lin) { x.color.convertSRGBToLinear(); x.userData.lin = true; } }); };
  // 真實外框：骨架模型（例如 Mixamo）的 geometry 外框是綁定姿勢的，要用蒙皮後的頂點算
  function realBounds(THREE, model) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3(), v = new THREE.Vector3();
    model.traverse((o) => {
      const pos = o.geometry && o.geometry.attributes && o.geometry.attributes.position;
      if (!pos) return;
      if (o.isSkinnedMesh && o.boneTransform) {
        o.skeleton.update();
        const step = Math.max(1, Math.floor(pos.count / 4000));
        for (let i = 0; i < pos.count; i += step) { o.boneTransform(i, v); v.applyMatrix4(o.matrixWorld); box.expandByPoint(v); }
      } else if (o.isMesh) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      }
    });
    return box;
  }
  function disposeTree(root) {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { for (const k in x) if (x[k] && x[k].isTexture) x[k].dispose(); x.dispose(); }); });
  }

  // ───────────────────────── 預設角色（程式生成） ─────────────────────────
  function makeDefaultHero(THREE) {
    const mat = (color, rough = 0.7) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
    const M = { skin: mat(0xf1d3b3, 0.6), hair: mat(0x1c2226, 0.5), jacket: mat(0x2f6f73, 0.6), shirt: mat(0xeef5f3, 0.8), pants: mat(0x1d2a30, 0.75), shoe: mat(0x0d1114, 0.4), scarf: mat(0xd9a95f, 0.6), eye: mat(0x101416, 0.2) };
    const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
    const cyl = (rt, rb, h, m) => cast(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), m));
    const ball = (r, m) => cast(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m));
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const legs = [], arms = [];
    for (const s of [-1, 1]) {
      const thigh = new THREE.Group(); thigh.position.set(s * 0.11, 0.95, 0); body.add(thigh);
      const th = cyl(0.08, 0.07, 0.45, M.pants); th.position.y = -0.225; thigh.add(th);
      const knee = new THREE.Group(); knee.position.y = -0.45; thigh.add(knee);
      const sh = cyl(0.068, 0.058, 0.43, M.pants); sh.position.y = -0.215; knee.add(sh);
      const foot = cast(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.26), M.shoe)); foot.position.set(0, -0.46, 0.05); knee.add(foot);
      legs.push({ thigh, knee, side: s });
      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.25, 1.43, 0); shoulder.rotation.z = s * 0.08; body.add(shoulder);
      const ua = cyl(0.06, 0.055, 0.3, M.jacket); ua.position.y = -0.15; shoulder.add(ua);
      const elbow = new THREE.Group(); elbow.position.y = -0.3; shoulder.add(elbow);
      const fa = cyl(0.052, 0.046, 0.27, M.jacket); fa.position.y = -0.135; elbow.add(fa);
      const hand = ball(0.052, M.skin); hand.position.y = -0.3; elbow.add(hand);
      arms.push({ shoulder, elbow, side: s });
    }
    const torso = new THREE.Group(); torso.position.y = 0.95; body.add(torso);
    const hips = cyl(0.17, 0.16, 0.16, M.pants); hips.position.y = 0.05; torso.add(hips);
    const chest = cyl(0.21, 0.17, 0.52, M.jacket); chest.position.y = 0.36; torso.add(chest);
    const shirt = cast(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.04), M.shirt)); shirt.position.set(0, 0.4, 0.18); torso.add(shirt);
    const scarf = cast(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 10, 22), M.scarf)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.63; torso.add(scarf);
    const head = new THREE.Group(); head.position.y = 1.62; body.add(head);
    const neck = cyl(0.05, 0.06, 0.12, M.skin); neck.position.y = -0.1; head.add(neck);
    const skull = ball(0.165, M.skin); skull.position.y = 0.06; head.add(skull);
    const hair = cast(new THREE.Mesh(new THREE.SphereGeometry(0.175, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair)); hair.position.set(0, 0.08, -0.012); hair.rotation.x = -0.25; head.add(hair);
    const fringe = cast(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), M.hair)); fringe.position.set(0, 0.18, 0.12); fringe.rotation.x = 0.4; head.add(fringe);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.eye); e.position.set(s * 0.058, 0.07, 0.152); head.add(e); }
    root.traverse(toLinear);
    let phase = 0, t = 0;
    return {
      root, height: 1.78, clips: [],
      animate(dt, speed, air) {
        t += dt;
        const run = Math.min(1, speed / RUN), move = Math.min(1, speed / 0.6);
        phase += dt * (4 + speed * 2.1);
        const la = 0.35 + 0.65 * run, aa = 0.3 + 0.6 * run;
        for (const L of legs) { const p = phase + (L.side > 0 ? Math.PI : 0); L.thigh.rotation.x = air ? (L.side > 0 ? -0.6 : 0.3) : -Math.sin(p) * la * move; L.knee.rotation.x = air ? 1.1 : (0.08 + Math.max(0, Math.sin(p + 1.2)) * (0.5 + 0.9 * run)) * move + 0.04; }
        for (const A of arms) { const p = phase + (A.side > 0 ? 0 : Math.PI); A.shoulder.rotation.x = air ? -2.4 : -Math.sin(p) * aa * move + Math.sin(t * 1.6 + A.side) * 0.03 * (1 - move); A.elbow.rotation.x = air ? -0.3 : -(0.15 + 1.1 * run) * move - 0.12; }
        body.position.y = air ? 0 : Math.abs(Math.sin(phase)) * 0.06 * move + Math.sin(t * 2) * 0.006 * (1 - move);
        body.rotation.x = 0.16 * run; head.rotation.y = (1 - move) * Math.sin(t * 0.5) * 0.35; head.rotation.x = -0.1 * run;
      },
      dispose() { disposeTree(root); },
    };
  }

  // ───────────────────────── 自製角色（3D 模型） ─────────────────────────
  // def = { buffer: ArrayBuffer, format: 'glb'|'gltf'|'vrm'|'fbx', settings: { height, yaw, anim:{idle,walk,run} } }
  async function makeModelHero(THREE, def) {
    const format = def.format;
    await ensureLoader(format);
    let model, animations = [];
    if (format === "fbx") {
      model = new THREE.FBXLoader().parse(def.buffer, "");
      animations = model.animations || [];
    } else {
      const gltf = await new Promise((res, rej) => new THREE.GLTFLoader().parse(def.buffer, "", res, (e) => rej(new Error("模型解析失敗：" + (e && e.message || e)))));
      model = gltf.scene || gltf.scenes[0]; animations = gltf.animations || [];
    }
    if (!model) throw new Error("檔案裡沒有可顯示的模型");
    let meshes = 0;
    model.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { meshes++; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    if (!meshes) throw new Error("檔案裡沒有網格（mesh）");

    const s = def.settings || {};
    const wantH = Math.min(3, Math.max(0.3, +s.height || 1.7));
    const pivot = new THREE.Group(); pivot.add(model);
    pivot.rotation.y = ((+s.yaw || 0) * Math.PI) / 180;
    const box = realBounds(THREE, model), size = box.getSize(new THREE.Vector3());
    const k = wantH / (size.y || 1);
    model.scale.multiplyScalar(k);
    const box2 = realBounds(THREE, model), c = box2.getCenter(new THREE.Vector3());
    model.position.x -= c.x; model.position.z -= c.z; model.position.y -= box2.min.y;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.add(pivot);

    const clips = animations.map((a) => a.name || "(未命名)");
    const mixer = animations.length ? new THREE.AnimationMixer(model) : null;
    // 指定名稱優先；否則用關鍵字找，排除跳躍／攻擊等動作，取名稱最短的（Walking 勝過 WalkJump）
    const BAD = /jump|death|die|attack|punch|kick|hit|dance|wave|sit|pose|additive/i;
    const find = (name, re) => {
      if (name) return animations.find((a) => a.name === name);
      const hits = animations.filter((a) => re.test(a.name));
      const good = hits.filter((a) => !BAD.test(a.name));
      return (good.length ? good : hits).sort((x, y) => x.name.length - y.name.length)[0];
    };
    const anim = s.anim || {};
    const pick = {
      idle: find(anim.idle, /idle|stand|breath|待機/i),
      walk: find(anim.walk, /walk|走/i),
      run: find(anim.run, /run|sprint|jog|跑/i),
    };
    if (mixer && !pick.idle && !pick.walk && !pick.run && animations.length === 1) pick.idle = animations[0];
    const acts = {};
    if (mixer) for (const key of ["idle", "walk", "run"]) if (pick[key]) { const a = mixer.clipAction(pick[key]); a.play(); a.setEffectiveWeight(0); acts[key] = a; }
    const w = { idle: 1, walk: 0, run: 0 };
    let t = 0;
    return {
      root, height: wantH, clips,
      mapped: { idle: pick.idle && pick.idle.name, walk: pick.walk && pick.walk.name, run: pick.run && pick.run.name },
      animate(dt, speed, air) {
        t += dt;
        const run = Math.min(1, speed / RUN), moving = speed > 0.15;
        const target = { idle: moving ? 0 : 1, walk: moving ? 1 - run : 0, run: moving ? run : 0 };
        if (!acts.run) { target.walk += target.run; target.run = 0; }
        if (!acts.walk) { target.run += target.walk; target.walk = 0; }
        if (!acts.run && !acts.walk) target.idle = 1;
        const kk = 1 - Math.exp(-10 * dt);
        for (const key in acts) { w[key] += (target[key] - w[key]) * kk; acts[key].setEffectiveWeight(w[key]); }
        if (acts.walk) acts.walk.timeScale = Math.max(0.5, speed / WALK);
        if (acts.run) acts.run.timeScale = Math.max(0.6, speed / RUN);
        if (mixer) mixer.update(dt);
        // 沒有走／跑動畫時，用彈跳與前傾假裝在跑
        const fake = !acts.walk && !acts.run;
        body.position.y = fake && !air ? Math.abs(Math.sin(t * (6 + speed * 2))) * 0.07 * Math.min(1, speed / 0.6) : 0;
        body.rotation.x = fake ? 0.12 * run : 0;
      },
      dispose() { if (mixer) mixer.stopAllAction(); disposeTree(root); },
    };
  }

  // ───────────────────────── 場景（三種主題，600 公尺長） ─────────────────────────
  const THEMES = {
    night: {
      label: "夜晚", bg: 0x05090d, fog: [0x05090d, 18, 70], sky: ["#010407", "#061018"], exposure: 1.1,
      floor: 0x0a1419, top: [0x0e1d24, 0.28, 0.35], side: 0x102830, glow: 0x79c8d0, bulb: 0xbfeef0, mark: 0x5fb3bb,
      crowd: [0x0f1c22], riser: 0x0c181d, tree: 0x0c1b1d, trunk: 0x0b1214, cap: false, pole: 0x18303a, lamp: 0xbfeef0,
      hemi: [0x9fd6d9, 0x05090d, 0.45], key: [0xcfeef0, 0.55], follow: 2.2, stars: true, sun: false, flashes: true,
      particles: { count: 160, color: 0x79c8d0, size: 0.05, fall: 0.3, drift: 0.08, opacity: 0.7 },
    },
    day: {
      label: "白天", bg: 0xbcdcf0, fog: [0xd3e6f0, 40, 190], sky: ["#4f9bd6", "#dcecf5"], exposure: 1.0,
      floor: 0x8fb46a, top: [0xf3ede2, 0.55, 0.0], side: 0xd2c4ad, glow: 0xd9a95f, bulb: 0xfff1d0, mark: 0xb07a3a,
      crowd: [0xc8553d, 0x2f6f73, 0xd9a95f, 0x3c5a8a, 0x8a5a9a, 0xe8d6b8, 0x5a7d4f], riser: 0xe4d6bf, tree: 0x4f8a4b, trunk: 0x6b4a32, cap: false, pole: 0xe8e2d6, lamp: 0xfff7e6,
      hemi: [0xffffff, 0x8a9a6a, 0.95], key: [0xfff2dc, 1.7], follow: 0, stars: false, sun: true, flashes: false,
      particles: { count: 0 },
    },
    snow: {
      label: "下雪", bg: 0xd6dee5, fog: [0xdfe6ec, 12, 80], sky: ["#9fb0c0", "#e8edf1"], exposure: 1.05,
      floor: 0xf2f5f7, top: [0x36424c, 0.6, 0.1], side: 0x8796a3, glow: 0xbfe6ff, bulb: 0xffe8c0, mark: 0xdfeaf2,
      crowd: [0x7a2f35, 0x2c4a5e, 0x5d6b4a, 0x8a6a3a, 0x3a3f58, 0xb9b2a6], riser: 0xe6ebef, tree: 0x4e6e66, trunk: 0x5a4636, cap: true, pole: 0x56626c, lamp: 0xffe8c0,
      hemi: [0xeef4ff, 0xb7c3cc, 0.9], key: [0xf0f5ff, 0.75], follow: 1.0, stars: false, sun: false, flashes: false,
      particles: { count: 1800, color: 0xffffff, size: 0.09, fall: 1.3, drift: 0.5, opacity: 0.95 },
    },
  };
  const CHUNK = 40; // 觀眾與樹木每 40 公尺一段，只畫角色附近幾段

  function textSprite(THREE, text) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "700 150px 'Segoe UI', 'Noto Sans TC', sans-serif"; g.fillText(text, 256, 128);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  function buildScene(THREE, scene, quality) {
    const low = quality === "low";
    const std = (rough, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: 0xffffff, roughness: rough, metalness: 0 }, extra || {}));
    const M = {
      floor: std(0.95), top: std(0.3), side: std(0.6), riser: std(0.9), tree: std(0.85), trunk: std(0.9), cap: std(0.8, { color: 0xffffff }),
      pole: std(0.5, { metalness: 0.3 }), crowd: std(0.9), glow: new THREE.MeshBasicMaterial(), bulb: new THREE.MeshBasicMaterial(), lamp: new THREE.MeshBasicMaterial(),
    };
    scene.background = new THREE.Color();
    scene.fog = new THREE.Fog(0, 10, 60);
    const runLen = RUN_NEAR - RUN_FAR, midZ = (RUN_NEAR + RUN_FAR) / 2;

    // 天空穹頂（跟著鏡頭）
    const skyCanvas = document.createElement("canvas"); skyCanvas.width = 2; skyCanvas.height = 256;
    const skyTex = new THREE.CanvasTexture(skyCanvas); skyTex.encoding = THREE.sRGBEncoding;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10; scene.add(sky);
    const starPos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.95); starPos.set([Math.sin(ph) * Math.cos(th) * 190, Math.cos(ph) * 190, Math.sin(ph) * Math.sin(th) * 190], i * 3); }
    const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfe9ee, size: 1.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8, depthWrite: false }));
    sky.add(stars);
    const sunC = document.createElement("canvas"); sunC.width = sunC.height = 128;
    { const g = sunC.getContext("2d"), r = g.createRadialGradient(64, 64, 6, 64, 64, 64); r.addColorStop(0, "#fffef6"); r.addColorStop(0.25, "#fff4cf"); r.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sunC), fog: false, depthWrite: false, transparent: true }));
    sun.scale.set(40, 40, 1); sun.position.set(-70, 95, -120); sky.add(sun);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(420, runLen + 300), M.floor);
    floor.rotation.x = -Math.PI / 2; floor.position.z = midZ; floor.receiveShadow = true; scene.add(floor);
    const runway = new THREE.Mesh(new THREE.BoxGeometry(RUN_W, TOP, runLen), [M.side, M.side, M.top, M.side, M.side, M.side]);
    runway.position.set(0, TOP / 2, midZ); runway.receiveShadow = true; scene.add(runway);
    for (const [r, z] of [[FAR_R, RUN_FAR], [NEAR_R, RUN_NEAR]]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, TOP, 64), [M.side, M.top, M.side]);
      disc.position.set(0, TOP / 2, z); disc.receiveShadow = true; scene.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.08, 0.03, 8, 96), M.glow);
      rim.rotation.x = Math.PI / 2; rim.position.set(0, TOP + 0.01, z); scene.add(rim);
    }
    const centre = new THREE.Mesh(new THREE.PlaneGeometry(0.04, runLen), M.glow);
    centre.rotation.x = -Math.PI / 2; centre.position.set(0, TOP + 0.003, midZ); scene.add(centre);
    for (const s of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, runLen), M.glow);
      strip.position.set(s * (RUN_W / 2 - 0.08), TOP + 0.013, midZ); scene.add(strip);
    }
    const dummy = new THREE.Object3D();
    function instanced(geo, mat, list, colors) {
      // 空的批次不建立：同材質下有顏色與沒顏色的 InstancedMesh 共用 shader 會出錯
      if (!list.length) { const g = new THREE.Group(); scene.add(g); return g; }
      const m = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((p, i) => { dummy.position.set(p[0], p[1], p[2]); dummy.rotation.set(0, p[4] || 0, 0); dummy.scale.setScalar(p[3] || 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
      if (colors) list.forEach((p, i) => m.setColorAt(i, colors[i]));
      m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; scene.add(m); return m;
    }
    // 走道兩側小燈
    const bulbList = [];
    for (const s of [-1, 1]) for (let z = RUN_NEAR - 0.6; z > RUN_FAR; z -= 1.4) bulbList.push([s * (RUN_W / 2 + 0.12), TOP * 0.55, z]);
    instanced(new THREE.BoxGeometry(0.09, 0.09, 0.09), M.bulb, bulbList);
    // 燈柱（每 25 公尺）
    const poleList = [], lampList = [];
    for (const s of [-1, 1]) for (let z = RUN_NEAR - 4; z > RUN_FAR; z -= 25) { poleList.push([s * (RUN_W / 2 + 0.9), 2, z]); lampList.push([s * (RUN_W / 2 + 0.9), 4.1, z]); }
    instanced(new THREE.CylinderGeometry(0.05, 0.08, 4, 8), M.pole, poleList).castShadow = true;
    instanced(new THREE.SphereGeometry(0.18, 12, 8), M.lamp, lampList);

    // 距離標記（每 50 公尺）與拱門（每 100 公尺）
    const marks = [];
    for (let d = 50; d <= -RUN_FAR; d += 50) {
      const z = RUN_NEAR - 1.5 - d;
      const tex = textSprite(THREE, d + " m");
      const mk = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      mk.rotation.x = -Math.PI / 2; mk.position.set(0, TOP + 0.006, z); scene.add(mk); marks.push(mk);
      if (d % 100 === 0 && d < -RUN_FAR - 20) { const a = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.06, 8, 72, Math.PI), M.glow); a.position.set(0, TOP, z - 1.2); scene.add(a); }
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.06, 10, 120, Math.PI), M.glow);
    arch.position.set(0, TOP, RUN_FAR - FAR_R + 0.4); scene.add(arch);

    // 觀眾、看台、樹木：每 CHUNK 公尺一段
    const chunks = [], crowdGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.9, 7), headGeo = new THREE.SphereGeometry(0.17, 8, 6);
    const treeGeo = new THREE.ConeGeometry(1.1, 3.2, 7), capGeo = new THREE.ConeGeometry(0.75, 1.2, 7), trunkGeo = new THREE.CylinderGeometry(0.14, 0.18, 1, 6);
    const seats = low ? 2 : 3, crowdSpots = [];
    let rnd = 12345; const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    for (let z0 = RUN_NEAR; z0 > RUN_FAR - CHUNK; z0 -= CHUNK) {
      const bodies = [], heads = [], trees = [], caps = [], trunks = [];
      for (const s of [-1, 1]) {
        for (let row = 0; row < seats; row++) for (let z = z0 - 0.5; z > z0 - CHUNK && z > RUN_FAR + 1; z -= 1.15) {
          if (rand() < 0.12) continue;
          const x = s * (RUN_W / 2 + 1.9 + row * 1.1) + (rand() - 0.5) * 0.25, zz = z + (rand() - 0.5) * 0.4, y0 = row * 0.25;
          bodies.push([x, 0.45 + y0, zz]); heads.push([x, 1.05 + y0, zz]); crowdSpots.push([x - s * 0.15, 1.1 + y0, zz]);
        }
        for (let z = z0 - rand() * 4; z > z0 - CHUNK; z -= (low ? 7 : 4.5) + rand() * 3) {
          const x = s * (RUN_W / 2 + 6 + rand() * 22), k = 0.7 + rand() * 0.9;
          trees.push([x, 2.2 * k, z, k, rand() * 6]); caps.push([x, 3.35 * k, z, k, rand() * 6]); trunks.push([x, 0.5 * k, z, k]);
        }
      }
      const colorsOf = (n) => { const out = []; for (let i = 0; i < n; i++) out.push(new THREE.Color()); return out; };
      const cb = instanced(crowdGeo, M.crowd, bodies, colorsOf(bodies.length));
      const ch = instanced(headGeo, M.crowd, heads, colorsOf(heads.length));
      const tr = instanced(treeGeo, M.tree, trees); tr.castShadow = true;
      const cp = instanced(capGeo, M.cap, caps);
      const tk = instanced(trunkGeo, M.trunk, trunks);
      const riser = [];
      for (const s of [-1, 1]) for (let row = 1; row < seats; row++) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(1.1, row * 0.25, CHUNK), M.riser);
        r.position.set(s * (RUN_W / 2 + 1.9 + row * 1.1), row * 0.125, z0 - CHUNK / 2); r.receiveShadow = true; scene.add(r); riser.push(r);
      }
      chunks.push({ z0, z1: z0 - CHUNK, objs: [cb, ch, tr, cp, tk, ...riser], cb, ch, cp, seed: chunks.length });
    }

    // 閃光燈池（夜晚）
    const flashes = [];
    for (let i = 0; i < 10; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); f.scale.set(0.5, 0.5, 1); f.visible = false; scene.add(f); flashes.push({ f, next: Math.random() * 4 }); }

    // 粒子（夜晚光點／下雪）：跟著角色附近循環
    const PMAX = 1800, ppos = new Float32Array(PMAX * 3), pseed = new Float32Array(PMAX);
    for (let i = 0; i < PMAX; i++) { ppos.set([(Math.random() - 0.5) * 34, Math.random() * 14, RUN_NEAR - Math.random() * 70], i * 3); pseed[i] = Math.random() * 100; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(ppos, 3));
    const pmat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, depthWrite: false });
    const points = new THREE.Points(pg, pmat); points.frustumCulled = false; scene.add(points);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1);
    key.position.set(6, 14, 8); key.castShadow = true;
    const sz = low ? 1024 : 2048; key.shadow.mapSize.set(sz, sz);
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 });
    key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
    scene.add(key); scene.add(key.target);
    const follow = new THREE.SpotLight(0xe6fbff, 2.2, 14, 0.38, 0.6, 1.4);
    follow.position.set(0, 7, RUN_NEAR); scene.add(follow); scene.add(follow.target);

    const lin = (c, hex) => c.setHex(hex).convertSRGBToLinear();
    let T = THEMES.night, theme = "night";
    function setTheme(name, renderer) {
      theme = THEMES[name] ? name : "night"; T = THEMES[theme];
      lin(scene.background, T.bg); lin(scene.fog.color, T.fog[0]); scene.fog.near = T.fog[1]; scene.fog.far = T.fog[2];
      const g = skyCanvas.getContext("2d"), grd = g.createLinearGradient(0, 0, 0, 256);
      grd.addColorStop(0, T.sky[0]); grd.addColorStop(0.55, T.sky[1]); grd.addColorStop(1, T.sky[1]);
      g.fillStyle = grd; g.fillRect(0, 0, 2, 256); skyTex.needsUpdate = true;
      stars.visible = T.stars; sun.visible = T.sun;
      lin(M.floor.color, T.floor); lin(M.top.color, T.top[0]); M.top.roughness = T.top[1]; M.top.metalness = T.top[2];
      lin(M.side.color, T.side); lin(M.glow.color, T.glow); lin(M.bulb.color, T.bulb); lin(M.riser.color, T.riser);
      lin(M.tree.color, T.tree); lin(M.trunk.color, T.trunk); lin(M.pole.color, T.pole); lin(M.lamp.color, T.lamp);
      for (const mk of marks) lin(mk.material.color, T.mark);
      for (const c of chunks) {
        c.cp.visible = T.cap;
        let r2 = 777 + c.seed * 31; const rr = () => ((r2 = (r2 * 16807) % 2147483647) / 2147483647);
        const tint = new THREE.Color();
        for (const im of [c.cb, c.ch]) { for (let i = 0; i < im.count; i++) { lin(tint, T.crowd[Math.floor(rr() * T.crowd.length)]); if (im === c.ch && T.crowd.length > 1) lin(tint, [0xf1d3b3, 0xd9b08c, 0xa77b5a, 0x2d2925][Math.floor(rr() * 4)]); im.setColorAt(i, tint); } if (im.instanceColor) im.instanceColor.needsUpdate = true; }
      }
      lin(hemi.color, T.hemi[0]); lin(hemi.groundColor, T.hemi[1]); hemi.intensity = T.hemi[2];
      lin(key.color, T.key[0]); key.intensity = T.key[1];
      follow.intensity = T.follow; follow.visible = T.follow > 0;
      const P = T.particles; points.visible = P.count > 0;
      if (P.count) { lin(pmat.color, P.color); pmat.size = P.size; pmat.opacity = P.opacity; pg.setDrawRange(0, low ? Math.ceil(P.count * 0.6) : P.count); }
      for (const fl of flashes) { fl.f.visible = false; fl.f.material.opacity = 0; }
      if (renderer) renderer.toneMappingExposure = T.exposure;
    }

    return {
      key, follow, setTheme,
      get theme() { return theme; },
      update(t, dt, reduced, px, pz, cam) {
        sky.position.copy(cam.position);
        const far = T.fog[2] + 15;
        for (const c of chunks) { const vis = c.z1 < pz + 25 && c.z0 > pz - far; for (const o of c.objs) o.visible = vis && (o !== c.cp || T.cap); }
        if (T.flashes && !reduced) for (const fl of flashes) {
          fl.next -= dt;
          if (fl.next <= 0) { const near = crowdSpots.filter((s) => s[2] < pz + 4 && s[2] > pz - 35); if (near.length) { const s = near[Math.floor(Math.random() * near.length)]; fl.f.position.set(s[0], s[1], s[2]); fl.f.visible = true; fl.f.material.opacity = 1; } fl.next = 1.5 + Math.random() * 5; }
          fl.f.material.opacity = Math.max(0, fl.f.material.opacity - dt * 6); if (fl.f.material.opacity <= 0) fl.f.visible = false;
        }
        if (points.visible) {
          const P = T.particles, a = pg.attributes.position, n = pg.drawRange.count === Infinity ? P.count : Math.min(P.count, pg.drawRange.count);
          for (let i = 0; i < n; i++) {
            let y = a.getY(i) - dt * P.fall * (0.7 + (pseed[i] % 1) * 0.6), x = a.getX(i) + Math.sin(t * 0.8 + pseed[i]) * dt * P.drift, z = a.getZ(i);
            if (y < 0) { y = 14; x = px + (Math.random() - 0.5) * 34; }
            if (z > pz + 12) z -= 70; else if (z < pz - 58) z += 70;
            if (x > px + 17) x -= 34; else if (x < px - 17) x += 34;
            a.setXYZ(i, x, y, z);
          }
          a.needsUpdate = true;
        }
      },
    };
  }

  // ───────────────────────── 掛載 ─────────────────────────
  // opts.isBlocked(): 回傳 true 時（例如有對話框）鍵盤不控制角色
  function mount(container, opts) {
    opts = opts || {};
    const THREE = window.THREE;
    const coarse = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    const reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const quality = coarse || (navigator.hardwareConcurrency || 8) <= 4 ? "low" : "high";

    const renderer = new THREE.WebGLRenderer({ antialias: quality === "high", powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "low" ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none";
    canvas.setAttribute("aria-label", "3D 伸展台：可用方向鍵或點地板讓角色移動");
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 240);
    const world = buildScene(THREE, scene, quality);
    world.setTheme(opts.theme || "night", renderer);
    let hero = makeDefaultHero(THREE); scene.add(hero.root);

    const state = { x: 0, z: RUN_NEAR - 1.5, vx: 0, vz: 0, yaw: Math.PI, y: 0, vy: 0, target: null, stuck: 0 };
    const keys = new Set(), joy = { x: 0, y: 0, on: false };
    let paused = false;

    const KEYMAP = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r", ShiftLeft: "run", ShiftRight: "run", Space: "jump" };
    function blocked(e) {
      if (paused || (opts.isBlocked && opts.isBlocked())) return true;
      const el = e && e.target, tag = (el && el.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || (el && el.isContentEditable)) return true;
      if (e && e.code === "Space" && tag === "BUTTON") return true;
      return false;
    }
    function onKeyDown(e) {
      const k = KEYMAP[e.code]; if (!k || e.ctrlKey || e.metaKey || e.altKey || blocked(e)) return;
      e.preventDefault();
      if (k === "jump") { if (state.y <= 0.001) state.vy = 6; return; }
      keys.add(k); state.target = null;
    }
    function onKeyUp(e) { const k = KEYMAP[e.code]; if (k) keys.delete(k); }
    function onBlur() { keys.clear(); }
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("blur", onBlur);

    const marker = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 32), new THREE.MeshBasicMaterial({ color: 0x79c8d0, transparent: true, depthWrite: false }));
    marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.userData.t = 0; scene.add(marker);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 40), new THREE.MeshBasicMaterial({ color: 0x79c8d0, transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; scene.add(ring);

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TOP), hit = new THREE.Vector3();
    let held = false;
    function aim(e) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(plane, hit)) return;
      let tx = hit.x, tz = hit.z;
      if (!allowed(tx, tz)) { tx = Math.max(-(RUN_W / 2 - PAD), Math.min(RUN_W / 2 - PAD, tx)); tz = Math.max(RUN_FAR - FAR_R + PAD, Math.min(RUN_NEAR + NEAR_R - PAD, tz)); if (!allowed(tx, tz)) tx = 0; }
      state.target = { x: tx, z: tz }; state.stuck = 0;
      marker.position.set(tx, TOP + 0.015, tz); marker.visible = true; marker.userData.t = 0;
    }
    function onDown(e) { if (paused) return; const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); held = true; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} aim(e); }
    function onMove(e) { if (held) aim(e); }
    function onUp() { held = false; }
    canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);

    let joyEl = null;
    if (coarse) {
      joyEl = document.createElement("div");
      joyEl.className = "home-stage-joy";
      joyEl.innerHTML = "<i></i>";
      const knob = joyEl.firstChild;
      const upd = (e) => { const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = Math.hypot(dx, dy), R = r.width / 2; if (m > R) { dx *= R / m; dy *= R / m; } joy.x = dx / R; joy.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`; };
      joyEl.addEventListener("pointerdown", (e) => { e.stopPropagation(); joy.on = true; state.target = null; try { joyEl.setPointerCapture(e.pointerId); } catch (_) {} upd(e); });
      joyEl.addEventListener("pointermove", (e) => { if (joy.on) upd(e); });
      const end = () => { joy.on = false; joy.x = joy.y = 0; knob.style.transform = ""; };
      joyEl.addEventListener("pointerup", end); joyEl.addEventListener("pointercancel", end);
      container.appendChild(joyEl);
    }

    // 直式（手機）把畫面往下推，讓角色避開上方的大標題；桌機由 CSS 讓畫布只佔標題右側
    function shift() { const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight; return w < h ? { x: 0, y: -0.22 * h } : { x: 0, y: 0 }; }
    function resize() {
      const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const o = shift(); camera.setViewOffset(w, h, Math.round(o.x), Math.round(o.y), w, h);
      camera.updateProjectionMatrix();
    }
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    ro ? ro.observe(container) : window.addEventListener("resize", resize);
    resize();

    const camPos = new THREE.Vector3(0, 5, RUN_NEAR + 6), camLook = new THREE.Vector3(0, 1, RUN_NEAR - 4);
    const tmpV = new THREE.Vector3();
    let last = performance.now(), t = 0, raf = 0;
    const damp = (k, dt) => 1 - Math.exp(-k * dt);

    function step(now) {
      raf = 0;
      if (paused) return;
      raf = requestAnimationFrame(step);
      if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;

      let ix = 0, iz = 0, sprint = keys.has("run");
      if (keys.has("f")) iz -= 1; if (keys.has("b")) iz += 1; if (keys.has("l")) ix -= 1; if (keys.has("r")) ix += 1;
      if (joy.on) { ix += joy.x; iz += joy.y; if (Math.hypot(joy.x, joy.y) > 0.85) sprint = true; }
      let mag = Math.hypot(ix, iz);
      if (mag < 0.12 && state.target) {
        const dx = state.target.x - state.x, dz = state.target.z - state.z, d = Math.hypot(dx, dz);
        if (d < 0.18) { state.target = null; marker.visible = false; }
        else { ix = dx / d; iz = dz / d; mag = Math.min(1, d / 0.6); sprint = d > 3; }
      }
      if (mag > 1) { ix /= mag; iz /= mag; mag = 1; }
      const speed = (sprint ? RUN : WALK) * (mag < 0.12 ? 0 : mag), dl = Math.hypot(ix, iz) || 1, k = damp(state.y > 0 ? 3 : 10, dt);
      state.vx += ((ix / dl) * speed - state.vx) * k; state.vz += ((iz / dl) * speed - state.vz) * k;
      const nx = state.x + state.vx * dt, nz = state.z + state.vz * dt, ox = state.x, oz = state.z;
      if (allowed(nx, nz)) { state.x = nx; state.z = nz; }
      else if (allowed(nx, state.z)) { state.x = nx; state.vz *= 0.3; }
      else if (allowed(state.x, nz)) { state.z = nz; state.vx *= 0.3; }
      else { state.vx *= 0.2; state.vz *= 0.2; }
      if (state.target && Math.hypot(state.x - ox, state.z - oz) < 0.002 && (state.stuck += dt) > 0.4) { state.target = null; marker.visible = false; }
      if (state.vy !== 0 || state.y > 0) { state.vy -= 18 * dt; state.y += state.vy * dt; if (state.y <= 0) { state.y = 0; state.vy = 0; } }
      const planar = Math.hypot(state.vx, state.vz);
      if (planar > 0.2) { let d = Math.atan2(state.vx, state.vz) - state.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); state.yaw += d * damp(12, dt); }

      hero.root.position.set(state.x, TOP + state.y, state.z); hero.root.rotation.y = state.yaw;
      hero.animate(dt, planar, state.y > 0.02);
      ring.position.set(state.x, TOP + 0.012, state.z); ring.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
      if (marker.visible) { marker.userData.t += dt; marker.material.opacity = 0.8 * (0.6 + 0.4 * Math.sin(marker.userData.t * 8)); }
      world.key.position.set(state.x + 6, 14, state.z + 8); world.key.target.position.set(state.x, 0, state.z);
      world.follow.position.set(state.x, 7, state.z + 1.5); world.follow.target.position.set(state.x, TOP, state.z);

      const far = camera.aspect < 1 ? 1.5 : 1, hk = Math.max(1, hero.height / 1.75);
      camPos.lerp(tmpV.set(state.x * 0.6, (3.4 * far + 0.6) * hk, state.z + 6.8 * far * hk), damp(3.5, dt));
      camLook.lerp(tmpV.set(state.x * 0.8, 1.1 * hk, state.z - 2.2), damp(5, dt));
      camera.position.copy(camPos); camera.lookAt(camLook);
      world.update(t, dt, reduced, state.x, state.z, camera);
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(step);

    let loadToken = 0;
    const ctl = {
      // def 為 null 時換回預設角色；載入失敗會丟出錯誤並保留原本角色
      async setCharacter(def) {
        const my = ++loadToken;
        const next = def ? await makeModelHero(THREE, def) : makeDefaultHero(THREE);
        if (my !== loadToken) { next.dispose(); return null; }
        scene.remove(hero.root); hero.dispose();
        hero = next; scene.add(hero.root);
        hero.root.position.set(state.x, TOP + state.y, state.z); hero.root.rotation.y = state.yaw;
        hero.animate(1 / 60, 0, false); hero.root.updateMatrixWorld(true);
        return { clips: hero.clips || [], mapped: hero.mapped || {}, height: hero.height };
      },
      // 拍一張目前角色的縮圖（JPEG data URL）
      snapshot(size) {
        size = size || 256;
        const rt = new THREE.WebGLRenderTarget(size, size, { encoding: THREE.sRGBEncoding });
        rt.texture.encoding = THREE.sRGBEncoding;
        const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
        const h = hero.height || 1.7, p = hero.root.position;
        const fy = state.yaw;
        cam.position.set(p.x + Math.sin(fy) * h * 2.4, p.y + h * 0.62, p.z + Math.cos(fy) * h * 2.4);
        cam.lookAt(p.x, p.y + h * 0.5, p.z);
        const bg = scene.background; scene.background = new THREE.Color(0x0c1a20).convertSRGBToLinear();
        ring.visible = false; marker.visible = false;
        renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
        scene.background = bg; ring.visible = true;
        const px = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, px); rt.dispose();
        const c = document.createElement("canvas"); c.width = c.height = size;
        const g = c.getContext("2d"), img = g.createImageData(size, size);
        for (let y = 0; y < size; y++) img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
        g.putImageData(img, 0, 0);
        return c.toDataURL("image/jpeg", 0.82);
      },
      // 測試用：把角色移到指定距離（公尺）
      _teleport(d) { state.z = Math.max(RUN_FAR, RUN_NEAR - 1.5 - d); state.x = 0; state.vx = state.vz = 0; state.target = null; camPos.set(0, 5, state.z + 7); camLook.set(0, 1, state.z - 2); },
      setTheme(name) { world.setTheme(name, renderer); return world.theme; },
      get theme() { return world.theme; },
      setPaused(v) {
        paused = !!v; keys.clear(); held = false;
        if (!paused && !raf) { last = performance.now(); raf = requestAnimationFrame(step); }
      },
      get paused() { return paused; },
      get state() { return { x: state.x, z: state.z, y: state.y, speed: Math.hypot(state.vx, state.vz), distance: Math.max(0, RUN_NEAR - 1.5 - state.z), length: RUN_NEAR - 1.5 - RUN_FAR }; },
      destroy() {
        paused = true; if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur);
        ro ? ro.disconnect() : window.removeEventListener("resize", resize);
        hero.dispose(); disposeTree(scene);
        renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
        canvas.remove(); if (joyEl) joyEl.remove();
      },
    };
    return ctl;
  }

  window.LizhiStage = { mount, loadScript, themes: Object.keys(THEMES).map((k) => ({ id: k, label: THEMES[k].label })) };
})();
