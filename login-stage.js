// 立之雲端庫・登入伸展台
// 只在未登入的登入畫面載入；登入後主站不會載入本檔或 Three.js。
// 任何一步失敗（沒有 WebGL、CDN 載不到）都只會安靜退出，登入卡片照常可用。
(function () {
  "use strict";

  const CONFIG = {
    // 想換成自己的角色：放一個 GLB（建議含 Idle / Walk / Run 動畫）並填路徑，例如 "./login-stage/hero.glb"
    characterUrl: "",
    threeUrl: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    gltfLoaderUrl: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js",
    walkSpeed: 2.6,
    runSpeed: 5.4,
  };

  // 伸展台尺寸（公尺）。角色從近端（+Z）出發，往遠端（-Z）的圓形舞台走。
  const TOP = 0.35;            // 台面高度
  const RUN_W = 5;             // 走道寬
  const RUN_NEAR = 8;          // 走道近端 z
  const RUN_FAR = -14;         // 走道遠端 z
  const FAR_R = 4.2;           // 遠端圓台半徑
  const NEAR_R = 3;            // 近端圓台半徑
  const PAD = 0.32;            // 角色與邊緣保留距離

  let active = null;

  function loadScript(src, timeoutMs) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      const t = setTimeout(() => { s.remove(); reject(new Error("timeout " + src)); }, timeoutMs || 12000);
      s.src = src; s.async = true; s.crossOrigin = "anonymous";
      s.onload = () => { clearTimeout(t); resolve(); };
      s.onerror = () => { clearTimeout(t); reject(new Error("load " + src)); };
      document.head.appendChild(s);
    });
  }

  function webglOK() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
    catch (_) { return false; }
  }

  function allowed(x, z) {
    if (Math.abs(x) <= RUN_W / 2 - PAD && z <= RUN_NEAR && z >= RUN_FAR) return true;
    if (Math.hypot(x, z - RUN_FAR) <= FAR_R - PAD) return true;
    if (Math.hypot(x, z - RUN_NEAR) <= NEAR_R - PAD) return true;
    return false;
  }

  // ───────────────────────── 程式生成角色 ─────────────────────────
  function makeHero(THREE) {
    const mat = (color, rough = 0.7, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0 }, extra));
    const M = {
      skin: mat(0xf1d3b3, 0.6), hair: mat(0x2d2925, 0.5), jacket: mat(0x8f6d4c, 0.65),
      shirt: mat(0xfffaf0, 0.8), pants: mat(0x3b3530, 0.75), shoe: mat(0x1f1b18, 0.4),
      scarf: mat(0xc8553d, 0.6), eye: mat(0x1a1614, 0.2),
    };
    const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
    const cyl = (rt, rb, h, m) => cast(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), m));
    const ball = (r, m) => cast(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m));

    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);

    const legs = [], arms = [];
    for (const s of [-1, 1]) {
      const thigh = new THREE.Group(); thigh.position.set(s * 0.11, 0.95, 0); body.add(thigh);
      const th = cyl(0.08, 0.07, 0.45, M.pants); th.position.y = -0.225; thigh.add(th);
      const knee = new THREE.Group(); knee.position.y = -0.45; thigh.add(knee);
      const sh = cyl(0.068, 0.058, 0.43, M.pants); sh.position.y = -0.215; knee.add(sh);
      const foot = cast(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.26), M.shoe)); foot.position.set(0, -0.46, 0.05); knee.add(foot);
      legs.push({ thigh, knee, side: s });

      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.25, 1.43, 0); body.add(shoulder);
      const ua = cyl(0.06, 0.055, 0.3, M.jacket); ua.position.y = -0.15; shoulder.add(ua);
      const elbow = new THREE.Group(); elbow.position.y = -0.3; shoulder.add(elbow);
      const fa = cyl(0.052, 0.046, 0.27, M.jacket); fa.position.y = -0.135; elbow.add(fa);
      const hand = ball(0.052, M.skin); hand.position.y = -0.3; elbow.add(hand);
      shoulder.rotation.z = s * 0.08;
      arms.push({ shoulder, elbow, side: s });
    }

    const torso = new THREE.Group(); torso.position.y = 0.95; body.add(torso);
    const hips = cyl(0.17, 0.16, 0.16, M.pants); hips.position.y = 0.05; torso.add(hips);
    const chest = cyl(0.21, 0.17, 0.52, M.jacket); chest.position.y = 0.36; torso.add(chest);
    const shirt = cast(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.04), M.shirt)); shirt.position.set(0, 0.4, 0.18); torso.add(shirt);
    const scarf = cast(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 10, 22), M.scarf)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.63; torso.add(scarf);
    const tail = cast(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.26, 0.03), M.scarf)); tail.position.set(0.08, 0.5, 0.2); tail.rotation.z = 0.15; torso.add(tail);

    const head = new THREE.Group(); head.position.y = 1.62; body.add(head);
    const neck = cyl(0.05, 0.06, 0.12, M.skin); neck.position.y = -0.1; head.add(neck);
    const skull = ball(0.165, M.skin); skull.position.y = 0.06; head.add(skull);
    const hair = cast(new THREE.Mesh(new THREE.SphereGeometry(0.175, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair));
    hair.position.set(0, 0.08, -0.012); hair.rotation.x = -0.25; head.add(hair);
    const fringe = cast(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), M.hair)); fringe.position.set(0, 0.18, 0.12); fringe.rotation.x = 0.4; head.add(fringe);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.eye); e.position.set(s * 0.058, 0.07, 0.152); head.add(e); }

    // 腳下的光圈，讓角色在伸展台上比較好找
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 40), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.55, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; root.add(ring);

    let phase = 0, t = 0;
    function animate(dt, speed, airborne) {
      t += dt;
      const run = Math.min(1, speed / CONFIG.runSpeed);
      const move = Math.min(1, speed / 0.6);
      phase += dt * (4 + speed * 2.1);
      const legAmp = 0.35 + 0.65 * run, armAmp = 0.3 + 0.6 * run;
      for (const L of legs) {
        const p = phase + (L.side > 0 ? Math.PI : 0);
        const swing = airborne ? (L.side > 0 ? -0.6 : 0.3) : -Math.sin(p) * legAmp * move;
        L.thigh.rotation.x = swing;
        L.knee.rotation.x = airborne ? 1.1 : (0.08 + Math.max(0, Math.sin(p + 1.2)) * (0.5 + 0.9 * run)) * move + 0.04;
      }
      for (const A of arms) {
        const p = phase + (A.side > 0 ? 0 : Math.PI);
        A.shoulder.rotation.x = airborne ? -2.4 : -Math.sin(p) * armAmp * move + Math.sin(t * 1.6 + A.side) * 0.03 * (1 - move);
        A.elbow.rotation.x = airborne ? -0.3 : -(0.15 + 1.1 * run) * move - 0.12;
      }
      body.position.y = airborne ? 0 : Math.abs(Math.sin(phase)) * 0.06 * move + Math.sin(t * 2) * 0.006 * (1 - move);
      body.rotation.x = 0.16 * run;
      head.rotation.y = (1 - move) * Math.sin(t * 0.5) * 0.35;
      head.rotation.x = -0.1 * run;
      ring.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
    return { root, animate };
  }

  // GLB 角色（選用）：有 Idle/Walk/Run 動畫就交叉淡入；失敗回傳 null 改用程式角色
  async function loadGlbHero(THREE, url) {
    if (!THREE.GLTFLoader) await loadScript(CONFIG.gltfLoaderUrl);
    const gltf = await new Promise((res, rej) => new THREE.GLTFLoader().load(url, res, undefined, rej));
    const model = gltf.scene;
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    const k = 1.7 / (size.y || 1); model.scale.setScalar(k);
    model.position.y = -box.min.y * k;
    const root = new THREE.Group(); root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const pick = (re) => gltf.animations.find((a) => re.test(a.name));
    const clips = { idle: pick(/idle|stand/i), walk: pick(/walk/i), run: pick(/run|sprint|jog/i) };
    const acts = {};
    for (const [k2, c] of Object.entries(clips)) if (c) { acts[k2] = mixer.clipAction(c); acts[k2].play(); acts[k2].setEffectiveWeight(0); }
    function animate(dt, speed) {
      const run = Math.min(1, speed / CONFIG.runSpeed), moving = speed > 0.15;
      const w = { idle: moving ? 0 : 1, walk: moving ? 1 - run : 0, run: moving ? run : 0 };
      if (!acts.run && acts.walk) { w.walk += w.run; w.run = 0; }
      for (const k2 in acts) acts[k2].setEffectiveWeight(w[k2] || 0);
      if (acts.walk) acts.walk.timeScale = 0.6 + speed / CONFIG.walkSpeed * 0.5;
      mixer.update(dt);
    }
    return { root, animate, isGlb: true };
  }

  // ───────────────────────── 場景 ─────────────────────────
  function textTexture(THREE) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 512); grd.addColorStop(0, "#3a332d"); grd.addColorStop(1, "#231f1b");
    g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = "#c9a47a"; g.lineWidth = 6; g.strokeRect(28, 28, 968, 456);
    g.fillStyle = "#c9a47a"; g.font = "600 34px system-ui, sans-serif"; g.textAlign = "center";
    g.fillText("P R I V A T E   C L O U D   A R C H I V E", 512, 150);
    g.fillStyle = "#fffaf0"; g.font = "700 150px 'Noto Serif TC', 'PingFang TC', 'Microsoft JhengHei', serif";
    g.fillText("立之雲端庫", 512, 330);
    g.fillStyle = "#8f6d4c"; g.fillRect(412, 380, 200, 4);
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    return tex;
  }

  function buildScene(THREE, scene, quality) {
    const std = (color, rough, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0 }, extra || {}));
    const bg = new THREE.Color(0xeee1cb);
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 22, 60);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), std(0xcfb994, 0.95));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const runMat = std(0x2d2925, 0.32, { metalness: 0.15 });
    const sideMat = std(0x4a3f36, 0.6);
    const runLen = RUN_NEAR - RUN_FAR;
    const runway = new THREE.Mesh(new THREE.BoxGeometry(RUN_W, TOP, runLen), [sideMat, sideMat, runMat, sideMat, sideMat, sideMat]);
    runway.position.set(0, TOP / 2, (RUN_NEAR + RUN_FAR) / 2); runway.receiveShadow = true; runway.castShadow = true; scene.add(runway);
    for (const [r, z] of [[FAR_R, RUN_FAR], [NEAR_R, RUN_NEAR]]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, TOP, 56), [sideMat, runMat, sideMat]);
      disc.position.set(0, TOP / 2, z); disc.receiveShadow = true; scene.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.08, 0.035, 8, 80), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
      rim.rotation.x = Math.PI / 2; rim.position.set(0, TOP + 0.01, z); scene.add(rim);
    }
    // 中線與兩側燈條
    const centre = new THREE.Mesh(new THREE.PlaneGeometry(0.06, runLen), new THREE.MeshBasicMaterial({ color: 0x8f6d4c }));
    centre.rotation.x = -Math.PI / 2; centre.position.set(0, TOP + 0.003, (RUN_NEAR + RUN_FAR) / 2); scene.add(centre);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xffdcaa });
    const bulbs = [];
    for (const s of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, runLen), stripMat);
      strip.position.set(s * (RUN_W / 2 - 0.08), TOP + 0.015, (RUN_NEAR + RUN_FAR) / 2); scene.add(strip);
      for (let z = RUN_NEAR - 0.6; z > RUN_FAR; z -= 1.4) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1d6 }));
        b.position.set(s * (RUN_W / 2 + 0.12), TOP * 0.55, z); scene.add(b); bulbs.push(b);
      }
    }

    // 背板
    const back = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.5), new THREE.MeshBasicMaterial({ map: textTexture(THREE) }));
    back.position.set(0, 3.3, RUN_FAR - FAR_R - 1.2); scene.add(back);
    const frameMat = std(0x8f6d4c, 0.5, { metalness: 0.3 });
    for (const s of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.4, 0.35), frameMat);
      pillar.position.set(s * 5.8, 3.2, back.position.z); pillar.castShadow = true; scene.add(pillar);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 0.35), frameMat);
    beam.position.set(0, 6.3, back.position.z); scene.add(beam);

    // 觀眾席剪影 + 閃光燈
    const crowdMat = std(0x5a4c40, 0.9);
    const crowdGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.9, 8), headGeo = new THREE.SphereGeometry(0.17, 10, 8);
    const flashes = [];
    const flashMat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const seats = quality === "low" ? 2 : 3;
    for (const s of [-1, 1]) for (let row = 0; row < seats; row++) for (let z = RUN_NEAR - 1; z > RUN_FAR + 1; z -= 1.15) {
      const x = s * (RUN_W / 2 + 1.6 + row * 1.1) + (Math.random() - 0.5) * 0.25;
      const zz = z + (Math.random() - 0.5) * 0.4, y0 = row * 0.25;
      const b = new THREE.Mesh(crowdGeo, crowdMat); b.position.set(x, 0.45 + y0, zz); scene.add(b);
      const h = new THREE.Mesh(headGeo, crowdMat); h.position.set(x, 1.05 + y0, zz); scene.add(h);
      if (Math.random() < 0.18) {
        const f = new THREE.Sprite(flashMat.clone()); f.scale.set(0.55, 0.55, 1);
        f.position.set(x - s * 0.15, 1.1 + y0, zz); scene.add(f); flashes.push({ f, next: Math.random() * 6 });
      }
    }
    const riser = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), std(0xb9a27f, 0.9));
    for (const s of [-1, 1]) for (let row = 1; row < seats; row++) {
      const r = riser.clone(); r.scale.set(1.1, row * 0.25, runLen - 1);
      r.position.set(s * (RUN_W / 2 + 1.6 + row * 1.1), row * 0.125, (RUN_NEAR + RUN_FAR) / 2); r.receiveShadow = true; scene.add(r);
    }

    // 燈光
    scene.add(new THREE.HemisphereLight(0xfff4e2, 0x6b5135, 0.75));
    const sun = new THREE.DirectionalLight(0xfff1dc, 0.85);
    sun.position.set(6, 14, 8); sun.castShadow = true;
    const sz = quality === "low" ? 1024 : 2048;
    sun.shadow.mapSize.set(sz, sz);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 16, bottom: -16, near: 1, far: 40 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    scene.add(sun); scene.add(sun.target);
    const spots = [];
    for (const s of [-1, 1]) {
      const sp = new THREE.SpotLight(0xffd29a, 1.4, 30, 0.32, 0.55, 1.2);
      sp.position.set(s * 6, 8, RUN_FAR + 3); sp.target.position.set(0, TOP, RUN_FAR);
      scene.add(sp); scene.add(sp.target); spots.push({ sp, s });
    }

    // 飄落的金色光點
    const N = quality === "low" ? 70 : 150, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = Math.random() * 8; pos[i * 3 + 2] = RUN_FAR - 4 + Math.random() * (runLen + 8); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xd9a95f, size: 0.07, transparent: true, opacity: 0.8, depthWrite: false }));
    scene.add(dust);

    return {
      sun,
      update(t, dt, reduced) {
        if (!reduced) for (const { sp, s } of spots) sp.target.position.set(Math.sin(t * 0.6 + s) * 2.2, TOP, RUN_FAR + Math.cos(t * 0.45 + s) * 2.5);
        for (const fl of flashes) {
          fl.next -= dt;
          if (fl.next <= 0 && !reduced) { fl.f.material.opacity = 1; fl.next = 2 + Math.random() * 7; }
          fl.f.material.opacity = Math.max(0, fl.f.material.opacity - dt * 6);
        }
        for (let i = 0; i < bulbs.length; i++) bulbs[i].scale.setScalar(1 + 0.25 * Math.sin(t * 3 - i * 0.5));
        const a = pg.attributes.position;
        for (let i = 0; i < N; i++) {
          let y = a.getY(i) - dt * 0.35; if (y < 0) y = 8;
          a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.08);
        }
        a.needsUpdate = true;
      },
    };
  }

  // ───────────────────────── 掛載 ─────────────────────────
  async function mount(container, opts) {
    destroy();
    opts = opts || {};
    if (!container || !webglOK()) return null;
    if (!window.THREE) await loadScript(CONFIG.threeUrl);
    const THREE = window.THREE;
    if (!container.isConnected) return null;

    const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const quality = coarse || (navigator.hardwareConcurrency || 8) <= 4 ? "low" : "high";

    const renderer = new THREE.WebGLRenderer({ antialias: quality === "high", powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "low" ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none";
    canvas.setAttribute("aria-label", "3D 伸展台：可用方向鍵或點地板讓角色移動");
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    const world = buildScene(THREE, scene, quality);

    let hero = null;
    const charUrl = opts.characterUrl || window.LIZHI_LOGIN_CHARACTER_URL || CONFIG.characterUrl;
    if (charUrl) { try { hero = await loadGlbHero(THREE, charUrl); } catch (e) { console.warn("[login-stage] 角色 GLB 載入失敗，改用預設角色", e); } }
    if (!hero) hero = makeHero(THREE);
    // r128 的十六進位顏色是線性值；輸出用 sRGB，所以先轉換，避免整體被洗白（GLB 角色本身已是正確色彩，不轉）
    const fixColor = (o) => { const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { if (x.color && !x.userData.srgb) { x.color.convertSRGBToLinear(); x.userData.srgb = true; } }); };
    scene.traverse(fixColor);
    if (!hero.isGlb) hero.root.traverse(fixColor);
    scene.background.convertSRGBToLinear(); scene.fog.color.convertSRGBToLinear();
    scene.add(hero.root);

    const state = { x: 0, z: RUN_NEAR - 1.5, vx: 0, vz: 0, yaw: Math.PI, y: 0, vy: 0, target: null, stuck: 0 };
    const keys = new Set();
    const joy = { x: 0, y: 0, on: false };

    // 鍵盤
    const KEYMAP = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r", ShiftLeft: "run", ShiftRight: "run", Space: "jump" };
    function onKeyDown(e) {
      const k = KEYMAP[e.code]; if (!k) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(tag) && k === "jump") return; // 焦點在按鈕上時，空白鍵保留給按鈕
      e.preventDefault();
      if (k === "jump") { if (state.y <= 0.001) state.vy = 6; return; }
      keys.add(k); state.target = null;
    }
    function onKeyUp(e) { const k = KEYMAP[e.code]; if (k) keys.delete(k); }
    function onBlur() { keys.clear(); }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // 點地板跑過去（按住可以一直追著指標跑）
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TOP), hit = new THREE.Vector3();
    let pointerHeld = false;
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
    function onDown(e) { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); pointerHeld = true; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); aim(e); }
    function onMove(e) { if (pointerHeld) aim(e); }
    function onUp() { pointerHeld = false; }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const marker = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 32), new THREE.MeshBasicMaterial({ color: 0xc8553d, transparent: true, depthWrite: false }));
    marker.rotation.x = -Math.PI / 2; marker.visible = false; scene.add(marker);

    // 手機搖桿
    let joyEl = null;
    if (coarse) {
      joyEl = document.createElement("div");
      joyEl.style.cssText = "position:absolute;left:22px;bottom:calc(22px + env(safe-area-inset-bottom));width:116px;height:116px;border-radius:50%;background:#2d292533;border:1px solid #fffaf077;touch-action:none;z-index:3;backdrop-filter:blur(4px)";
      joyEl.innerHTML = '<div style="position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:#fffaf0e6;box-shadow:0 4px 14px #0004;transition:transform .05s"></div>';
      const knob = joyEl.firstChild;
      const upd = (e) => {
        const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const m = Math.hypot(dx, dy), R = r.width / 2; if (m > R) { dx *= R / m; dy *= R / m; }
        joy.x = dx / R; joy.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
      };
      joyEl.addEventListener("pointerdown", (e) => { e.stopPropagation(); joy.on = true; state.target = null; joyEl.setPointerCapture(e.pointerId); upd(e); });
      joyEl.addEventListener("pointermove", (e) => { if (joy.on) upd(e); });
      const end = () => { joy.on = false; joy.x = joy.y = 0; knob.style.transform = ""; };
      joyEl.addEventListener("pointerup", end); joyEl.addEventListener("pointercancel", end);
      container.appendChild(joyEl);
    }

    // frameShift：畫面往上推的比例，手機直式時讓角色不被下方登入卡片擋住
    let frameShift = 0;
    function resize() {
      const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      if (frameShift > 0) camera.setViewOffset(w, h, 0, Math.round(h * frameShift), w, h); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    ro ? ro.observe(container) : window.addEventListener("resize", resize);
    resize();

    const camPos = new THREE.Vector3(0, 5, RUN_NEAR + 6), camLook = new THREE.Vector3(0, 1, RUN_NEAR - 4);
    let last = performance.now(), t = 0, raf = 0, running = true;
    const damp = (k, dt) => 1 - Math.exp(-k * dt);

    function step(now) {
      raf = requestAnimationFrame(step);
      if (!running) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;

      // 輸入 → 期望速度
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
      const speed = (sprint ? CONFIG.runSpeed : CONFIG.walkSpeed) * (mag < 0.12 ? 0 : mag);
      const dirLen = Math.hypot(ix, iz) || 1;
      const k = damp(state.y > 0 ? 3 : 10, dt);
      state.vx += ((ix / dirLen) * speed - state.vx) * k;
      state.vz += ((iz / dirLen) * speed - state.vz) * k;

      // 移動 + 邊界（沿邊緣滑動）
      const nx = state.x + state.vx * dt, nz = state.z + state.vz * dt;
      const ox = state.x, oz = state.z;
      if (allowed(nx, nz)) { state.x = nx; state.z = nz; }
      else if (allowed(nx, state.z)) { state.x = nx; state.vz *= 0.3; }
      else if (allowed(state.x, nz)) { state.z = nz; state.vx *= 0.3; }
      else { state.vx *= 0.2; state.vz *= 0.2; }
      if (state.target && Math.hypot(state.x - ox, state.z - oz) < 0.002) { if ((state.stuck += dt) > 0.4) { state.target = null; marker.visible = false; } }

      // 跳躍
      if (state.vy !== 0 || state.y > 0) { state.vy -= 18 * dt; state.y += state.vy * dt; if (state.y <= 0) { state.y = 0; state.vy = 0; } }

      const planar = Math.hypot(state.vx, state.vz);
      if (planar > 0.2) {
        const want = Math.atan2(state.vx, state.vz);
        let d = want - state.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
        state.yaw += d * damp(12, dt);
      }
      hero.root.position.set(state.x, TOP + state.y, state.z);
      hero.root.rotation.y = state.yaw;
      hero.animate(dt, planar, state.y > 0.02);

      if (marker.visible) { marker.userData.t += dt; marker.material.opacity = 0.8 * (0.6 + 0.4 * Math.sin(marker.userData.t * 8)); }
      world.update(t, dt, reduced);
      world.sun.position.set(state.x + 6, 14, state.z + 8); world.sun.target.position.set(state.x, 0, state.z);

      // 跟隨鏡頭（直式畫面拉遠一點）
      const far = camera.aspect < 1 ? 1.55 : 1;
      const want = new THREE.Vector3(state.x * 0.6, 3.6 * far + 0.6, state.z + 6.8 * far);
      camPos.lerp(want, damp(3.5, dt));
      camLook.lerp(new THREE.Vector3(state.x * 0.8, 1.1, state.z - 2.2), damp(5, dt));
      camera.position.copy(camPos); camera.lookAt(camLook);

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(step);
    const onVis = () => { running = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    active = {
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVis);
        ro ? ro.disconnect() : window.removeEventListener("resize", resize);
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); });
        renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
        canvas.remove(); joyEl && joyEl.remove();
      },
      setFrameShift(f) { frameShift = Math.max(0, Math.min(0.4, +f || 0)); resize(); },
      get state() { return { x: state.x, z: state.z, y: state.y, speed: Math.hypot(state.vx, state.vz) }; },
    };
    return active;
  }

  function destroy() { if (active) { try { active.destroy(); } catch (_) {} active = null; } }

  window.LizhiLoginStage = { mount, destroy, get active() { return active; }, CONFIG };
})();
