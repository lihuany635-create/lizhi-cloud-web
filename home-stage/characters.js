// 立之雲端庫・首頁伸展台控制器與角色選單
// - 只在首頁（.shell.route-home）顯示；離開首頁就暫停並隱藏，不影響其他頁面。
// - 自製角色存在 Supabase：私有 bucket「lizhi-stage-characters」＋資料表「lizhi_stage_characters」，跨裝置同步。
// - 下載過的模型存在瀏覽器 Cache Storage，下次直接讀，不重複下載。
(function () {
  "use strict";

  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const STAGE_URL = "./home-stage/stage.js?v=2";
  const BUCKET = "lizhi-stage-characters", TABLE = "lizhi_stage_characters";
  const CACHE = "lizhi-stage-characters-v1";
  const MAX_BYTES = 50 * 1024 * 1024;
  const FORMATS = ["glb", "gltf", "vrm", "fbx"];

  const S = {
    on: false, booting: null, ctl: null, failed: false,
    chars: [], current: "default", // 目前在伸展台上的角色 id（"default" = 預設角色）
    session: [], // 未登入雲端時，本次匯入只存在這次瀏覽
    busy: "", msg: "", msgKind: "", editing: null, panelOpen: false,
  };
  let layer, stageBox, btn, panel, hint, fileInput, sceneBtn, hud;
  const THEME_KEY = "lizhi-stage-theme-v1", THEME_ORDER = ["night", "day", "snow"], THEME_LABEL = { night: "夜晚", day: "白天", snow: "下雪" };
  const savedTheme = () => { try { const v = localStorage.getItem(THEME_KEY); return THEME_ORDER.includes(v) ? v : "night"; } catch (_) { return "night"; } };
  function setTheme(name) {
    if (!THEME_ORDER.includes(name)) return;
    try { localStorage.setItem(THEME_KEY, name); } catch (_) {}
    if (S.ctl) S.ctl.setTheme(name);
    document.body.dataset.stageTheme = name;
    if (sceneBtn) sceneBtn.innerHTML = `<span aria-hidden="true">${name === "night" ? "☾" : name === "day" ? "☀" : "❄"}</span>${THEME_LABEL[name]}`;
  }
  function cycleTheme() { const cur = (S.ctl && S.ctl.theme) || savedTheme(); setTheme(THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length]); }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mb = (n) => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + " MB";
  const sb = () => window.LizhiAuth && window.LizhiAuth.client;
  const uid = () => window.LizhiAuth && window.LizhiAuth.user && window.LizhiAuth.user.id;
  const cloud = () => !!(sb() && uid());
  const coarse = () => !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  function webglOK() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (_) { return false; }
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script"); s.src = src; s.async = true; s.crossOrigin = "anonymous";
      const t = setTimeout(() => reject(new Error("載入逾時")), 15000);
      s.onload = () => { clearTimeout(t); resolve(); }; s.onerror = () => { clearTimeout(t); reject(new Error("無法載入 " + src)); };
      document.head.appendChild(s);
    });
  }

  // ───────────── 快取（Cache Storage） ─────────────
  const cacheKey = (id) => new Request(location.origin + "/__lizhi-stage-character/" + encodeURIComponent(id));
  async function cacheGet(id) { try { const c = await caches.open(CACHE); const r = await c.match(cacheKey(id)); return r ? await r.arrayBuffer() : null; } catch (_) { return null; } }
  async function cachePut(id, data) { try { const c = await caches.open(CACHE); await c.put(cacheKey(id), new Response(data)); } catch (_) {} }
  async function cacheDel(id) { try { const c = await caches.open(CACHE); await c.delete(cacheKey(id)); } catch (_) {} }

  // ───────────── 雲端資料 ─────────────
  function friendly(err) {
    const m = String((err && (err.message || err.error_description)) || err || "");
    if (/lizhi_stage_characters|relation .* does not exist|schema cache|404/i.test(m)) return "雲端角色庫還沒建立（需要先套用 Supabase 遷移 012_lizhi_stage_characters）。";
    if (/bucket not found/i.test(m)) return "雲端角色儲存空間還沒建立（需要先套用 Supabase 遷移 012）。";
    if (/exceeded|too large|413/i.test(m)) return "檔案太大，超過雲端上限 50 MB。";
    if (/fetch|network/i.test(m)) return "網路連線失敗，請稍後再試。";
    return m || "發生未知錯誤";
  }
  async function refreshList() {
    if (!cloud()) { S.chars = S.session.slice(); return; }
    const { data, error } = await sb().from(TABLE).select("id,name,file_name,format,size,storage_path,thumb,settings,is_selected,updated_at").order("created_at", { ascending: false });
    if (error) throw error;
    S.chars = data || [];
  }
  async function bufferOf(c) {
    if (c.buffer) return c.buffer;
    const hit = await cacheGet(c.id);
    if (hit) return hit;
    setBusy(`下載角色「${c.name}」中…（${mb(c.size)}）`);
    const { data, error } = await sb().storage.from(BUCKET).download(c.storage_path);
    if (error) throw error;
    const buf = await data.arrayBuffer();
    cachePut(c.id, buf.slice(0));
    return buf;
  }
  async function showOnStage(c) {
    if (!S.ctl) return null;
    if (!c) { await S.ctl.setCharacter(null); S.current = "default"; return null; }
    const buf = await bufferOf(c);
    setBusy(`載入角色「${c.name}」中…`);
    const info = await S.ctl.setCharacter({ buffer: buf, format: c.format, settings: c.settings || {} });
    S.current = c.id;
    return info;
  }
  async function applySelected() {
    const sel = S.chars.find((c) => c.is_selected);
    try { await showOnStage(sel || null); }
    catch (e) { console.warn("[home-stage]", e); flash(`角色「${sel && sel.name}」載入失敗：${friendly(e)}，先用預設角色。`, "err"); try { await showOnStage(null); } catch (_) {} }
    finally { setBusy(""); }
  }

  // ───────────── 動作 ─────────────
  async function choose(id) {
    if (S.busy) return;
    const c = id === "default" ? null : S.chars.find((x) => x.id === id);
    try {
      await showOnStage(c);
      if (cloud()) {
        const { error } = await sb().rpc("lizhi_stage_select_character", { target: c ? c.id : null });
        if (error) throw error;
      }
      S.chars.forEach((x) => { x.is_selected = !!c && x.id === c.id; });
      flash(c ? `已換上「${c.name}」${cloud() ? "，其他裝置也會同步" : ""}` : "已換回預設角色", "ok");
    } catch (e) { flash(friendly(e), "err"); }
    finally { setBusy(""); }
  }

  async function importFile(file) {
    if (!file || S.busy) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!FORMATS.includes(ext)) return flash("只支援 GLB、glTF（單一檔案）、VRM、FBX。", "err");
    if (file.size > MAX_BYTES) return flash(`檔案 ${mb(file.size)}，超過上限 50 MB。可以在 Blender 匯出時壓縮貼圖或減面。`, "err");
    const prev = S.chars.find((c) => c.id === S.current) || null;
    try {
      setBusy(`讀取「${file.name}」中…`);
      const buf = await file.arrayBuffer();
      const settings = { height: 1.7, yaw: ext === "vrm" ? 180 : 0 };
      const info = await S.ctl.setCharacter({ buffer: buf.slice(0), format: ext, settings });
      settings.clips = (info.clips || []).slice(0, 80);
      settings.anim = {}; settings.auto = info.mapped || {};
      await frame();
      const thumb = S.ctl.snapshot(192);
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "新角色";
      const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
      const row = { id, name, file_name: file.name.slice(0, 300), format: ext, size: file.size, thumb, settings };
      if (cloud()) {
        setBusy(`上傳到雲端中…（${mb(file.size)}）`);
        row.storage_path = `${uid()}/${id}.${ext}`;
        const up = await sb().storage.from(BUCKET).upload(row.storage_path, file, { contentType: "application/octet-stream", upsert: false });
        if (up.error) throw up.error;
        const ins = await sb().from(TABLE).insert(row);
        if (ins.error) { sb().storage.from(BUCKET).remove([row.storage_path]).catch(() => {}); throw ins.error; }
        const r = await sb().rpc("lizhi_stage_select_character", { target: id });
        if (r.error) throw r.error;
        await cachePut(id, buf);
        await refreshList();
      } else {
        S.session.unshift(Object.assign(row, { buffer: buf, is_selected: true }));
        S.session.forEach((x) => { x.is_selected = x.id === id; });
        S.chars = S.session.slice();
      }
      S.current = id;
      const anims = settings.clips.length;
      flash(`已匯入「${name}」${anims ? `（${anims} 段動畫）` : "（沒有動畫，會用彈跳代替跑步）"}${cloud() ? "，已同步到雲端" : "，只在這次瀏覽有效"}`, "ok");
      if (anims) S.editing = id; // 打開設定讓你確認動畫對應
    } catch (e) {
      console.warn("[home-stage] import", e);
      flash(`匯入失敗：${friendly(e)}`, "err");
      try { await showOnStage(prev); } catch (_) {}
    } finally { setBusy(""); }
  }

  async function saveSettings(id, form) {
    const c = S.chars.find((x) => x.id === id); if (!c || S.busy) return;
    const settings = Object.assign({}, c.settings || {});
    settings.height = Math.min(3, Math.max(0.3, parseFloat(form.height.value) || 1.7));
    settings.yaw = (parseInt(form.yaw.value, 10) || 0) % 360;
    settings.anim = { idle: form.idle.value || undefined, walk: form.walk.value || undefined, run: form.run.value || undefined };
    const name = form.cname.value.trim().slice(0, 80) || c.name;
    try {
      setBusy("套用設定中…");
      c.settings = settings; c.name = name;
      if (S.current === id) { await showOnStage(c); await frame(); c.thumb = S.ctl.snapshot(192); }
      if (cloud()) {
        const { error } = await sb().from(TABLE).update({ name, settings, thumb: c.thumb }).eq("id", id);
        if (error) throw error;
      }
      S.editing = null;
      flash("設定已儲存", "ok");
    } catch (e) { flash(friendly(e), "err"); }
    finally { setBusy(""); }
  }
  async function previewSettings(id, form) {
    const c = S.chars.find((x) => x.id === id); if (!c || S.busy) return;
    const tmp = Object.assign({}, c, { settings: Object.assign({}, c.settings, { height: parseFloat(form.height.value) || 1.7, yaw: parseInt(form.yaw.value, 10) || 0, anim: { idle: form.idle.value || undefined, walk: form.walk.value || undefined, run: form.run.value || undefined } }) });
    try { await showOnStage(tmp); flash("預覽中（還沒儲存）", ""); } catch (e) { flash(friendly(e), "err"); } finally { setBusy(""); }
  }

  async function remove(id) {
    const c = S.chars.find((x) => x.id === id); if (!c || S.busy) return;
    if (!confirm(`確定刪除角色「${c.name}」？雲端的模型檔也會一起刪掉。`)) return;
    try {
      setBusy("刪除中…");
      if (cloud()) {
        const { error } = await sb().from(TABLE).delete().eq("id", id);
        if (error) throw error;
        sb().storage.from(BUCKET).remove([c.storage_path]).catch(() => {});
        await cacheDel(id);
        await refreshList();
      } else { S.session = S.session.filter((x) => x.id !== id); S.chars = S.session.slice(); }
      if (S.current === id) await showOnStage(null);
      flash(`已刪除「${c.name}」`, "ok");
    } catch (e) { flash(friendly(e), "err"); }
    finally { setBusy(""); }
  }

  // ───────────── 介面 ─────────────
  function setBusy(t) { S.busy = t; renderPanel(); }
  let flashTimer = 0;
  function flash(t, kind) { S.msg = t; S.msgKind = kind || ""; renderPanel(); clearTimeout(flashTimer); if (kind === "ok") flashTimer = setTimeout(() => { S.msg = ""; renderPanel(); }, 6000); }

  function card(c) {
    const isDef = c === "default";
    const id = isDef ? "default" : c.id, on = S.current === id;
    const thumb = isDef ? '<div class="hs-thumb hs-thumb-def">立</div>' : c.thumb ? `<img class="hs-thumb" alt="" src="${esc(c.thumb)}">` : '<div class="hs-thumb">?</div>';
    const meta = isDef ? "內建・永遠保留" : `${esc(c.format.toUpperCase())}・${mb(c.size)}${(c.settings && c.settings.clips && c.settings.clips.length) ? `・${c.settings.clips.length} 段動畫` : "・無動畫"}`;
    let html = `<li class="hs-card${on ? " on" : ""}">${thumb}<div class="hs-info"><b>${isDef ? "預設角色" : esc(c.name)}</b><small>${meta}</small>${on ? '<em>使用中</em>' : ""}</div><div class="hs-actions">`;
    if (!on) html += `<button type="button" data-hs="use" data-id="${esc(id)}">使用</button>`;
    if (!isDef) html += `<button type="button" data-hs="edit" data-id="${esc(id)}" aria-expanded="${S.editing === id}">設定</button><button type="button" class="hs-danger" data-hs="del" data-id="${esc(id)}" aria-label="刪除">刪除</button>`;
    html += "</div>";
    if (!isDef && S.editing === id) {
      const s = c.settings || {}, clips = s.clips || [], a = s.anim || {};
      const auto = s.auto || {};
      const opt = (cur, key) => `<option value="">（自動${auto[key] ? `：${esc(auto[key])}` : "：無"}）</option>` + clips.map((n) => `<option value="${esc(n)}"${n === cur ? " selected" : ""}>${esc(n)}</option>`).join("");
      html += `<form class="hs-form" data-id="${esc(id)}">
        <label>名稱<input name="cname" maxlength="80" value="${esc(c.name)}"></label>
        <div class="hs-row"><label>身高（公尺）<input name="height" type="number" min="0.3" max="3" step="0.05" value="${esc(s.height || 1.7)}"></label>
        <label>面向<select name="yaw">${[0, 90, 180, 270].map((d) => `<option value="${d}"${(+s.yaw || 0) === d ? " selected" : ""}>${d === 0 ? "原始方向" : `轉 ${d}°`}</option>`).join("")}</select></label></div>
        ${clips.length ? `<label>待機動畫<select name="idle">${opt(a.idle, "idle")}</select></label><label>走路動畫<select name="walk">${opt(a.walk, "walk")}</select></label><label>跑步動畫<select name="run">${opt(a.run, "run")}</select></label>` : `<p class="hs-note">這個模型沒有動畫，會用彈跳代替跑步。要自然跑動，可以先在 Mixamo 綁骨架並套 Idle／Walk／Run 動畫再匯出。</p><input type="hidden" name="idle"><input type="hidden" name="walk"><input type="hidden" name="run">`}
        <div class="hs-form-actions"><button type="button" data-hs="preview" data-id="${esc(id)}">預覽</button><button type="submit" class="hs-primary">儲存</button></div>
      </form>`;
    }
    return html + "</li>";
  }

  function renderPanel() {
    if (!panel) return;
    btn.classList.toggle("on", S.panelOpen);
    panel.hidden = !S.panelOpen;
    if (!S.panelOpen) return;
    const keepScroll = panel.querySelector(".hs-list") ? panel.querySelector(".hs-list").scrollTop : 0;
    panel.innerHTML = `<header><div><small>RUNWAY CHARACTERS</small><h2>伸展台角色</h2></div><button type="button" class="hs-close" data-hs="close" aria-label="關閉">×</button></header>
      <div class="hs-drop" data-hs="pick" tabindex="0" role="button"><b>＋ 匯入 3D 模型</b><span>GLB／VRM／FBX／glTF（單檔），上限 50 MB<br>可以直接把檔案拖進來</span></div>
      ${cloud() ? "" : '<p class="hs-note">目前沒有連上雲端帳號，匯入的角色只在這次瀏覽有效。</p>'}
      ${S.busy ? `<p class="hs-status busy"><i></i>${esc(S.busy)}</p>` : S.msg ? `<p class="hs-status ${esc(S.msgKind)}">${esc(S.msg)}</p>` : ""}
      <ul class="hs-list">${card("default")}${S.chars.map(card).join("")}</ul>
      <p class="hs-tip">小提醒：含 Idle／Walk／Run 動畫的模型跑起來最自然；角色太大或太小可以在「設定」調身高。</p>`;
    const list = panel.querySelector(".hs-list"); if (list) list.scrollTop = keepScroll;
    panel.querySelectorAll("button, .hs-drop").forEach((el) => { if (S.busy && el.dataset.hs !== "close") el.setAttribute("disabled", ""); });
  }

  function onPanelClick(e) {
    const el = e.target.closest("[data-hs]"); if (!el || (S.busy && el.dataset.hs !== "close")) return;
    const id = el.dataset.id, form = el.closest("form");
    switch (el.dataset.hs) {
      case "close": togglePanel(false); break;
      case "pick": fileInput.click(); break;
      case "use": choose(id); break;
      case "edit": S.editing = S.editing === id ? null : id; renderPanel(); break;
      case "del": remove(id); break;
      case "preview": previewSettings(id, form); break;
    }
  }

  function togglePanel(open) {
    S.panelOpen = open == null ? !S.panelOpen : !!open;
    if (S.panelOpen && cloud()) refreshList().then(renderPanel).catch((e) => flash(friendly(e), "err"));
    renderPanel();
  }

  function buildDom() {
    layer = document.createElement("div"); layer.id = "home-stage"; layer.hidden = true;
    stageBox = document.createElement("div"); stageBox.className = "home-stage-canvas"; layer.appendChild(stageBox);
    hint = document.createElement("div"); hint.className = "home-stage-hint";
    hint.textContent = coarse() ? "左下搖桿移動・點伸展台跑過去・伸展台長 600 公尺" : "WASD／方向鍵移動・Shift 衝刺・空白鍵跳・點伸展台跑過去・伸展台長 600 公尺";
    btn = document.createElement("button"); btn.type = "button"; btn.className = "home-stage-btn home-stage-char"; btn.hidden = true;
    btn.innerHTML = '<span aria-hidden="true">◎</span>角色';
    btn.addEventListener("click", () => togglePanel());
    panel = document.createElement("aside"); panel.className = "home-stage-panel"; panel.hidden = true; panel.setAttribute("aria-label", "伸展台角色");
    panel.addEventListener("click", onPanelClick);
    panel.addEventListener("submit", (e) => { e.preventDefault(); saveSettings(e.target.dataset.id, e.target); });
    panel.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".hs-drop")) { e.preventDefault(); fileInput.click(); } if (e.key === "Escape") togglePanel(false); });
    ["dragenter", "dragover"].forEach((t) => panel.addEventListener(t, (e) => { e.preventDefault(); panel.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((t) => panel.addEventListener(t, (e) => { e.preventDefault(); panel.classList.remove("drag"); }));
    panel.addEventListener("drop", (e) => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) importFile(f); });
    fileInput = document.createElement("input"); fileInput.type = "file"; fileInput.hidden = true; fileInput.accept = ".glb,.gltf,.vrm,.fbx";
    fileInput.addEventListener("change", () => { const f = fileInput.files[0]; fileInput.value = ""; if (f) importFile(f); });
    sceneBtn = document.createElement("button"); sceneBtn.type = "button"; sceneBtn.className = "home-stage-btn home-stage-scene"; sceneBtn.hidden = true;
    sceneBtn.title = "切換伸展台場景（夜晚／白天／下雪）";
    sceneBtn.addEventListener("click", cycleTheme);
    hud = document.createElement("div"); hud.className = "home-stage-hud"; hud.hidden = true;
    document.body.append(layer, hint, sceneBtn, btn, panel, hud, fileInput);
  }

  // ───────────── 啟動與首頁偵測 ─────────────
  async function boot() {
    if (!webglOK()) throw new Error("此裝置不支援 WebGL");
    if (!window.THREE) await loadScript(THREE_URL);
    if (!window.LizhiStage) await loadScript(STAGE_URL);
    S.ctl = window.LizhiStage.mount(stageBox, { theme: savedTheme(), isBlocked: () => !!document.querySelector(".sidebar.open, .modal-backdrop") || (S.panelOpen && panel.contains(document.activeElement) && document.activeElement !== panel) });
    S.ctl.setPaused(!S.on);
    document.body.classList.add("home-stage-ready");
    btn.hidden = false; sceneBtn.hidden = false; hud.hidden = false; setTheme(savedTheme());
    let lastHud = "";
    setInterval(() => { if (!S.on || !S.ctl) return; const st = S.ctl.state, txt = `${Math.round(st.distance)} m ／ ${Math.round(st.length)} m`; if (txt !== lastHud) { hud.textContent = txt; lastHud = txt; } }, 250);
    try { await refreshList(); } catch (e) { console.warn("[home-stage] list", e); S.msg = friendly(e); S.msgKind = "err"; }
    await applySelected();
  }

  let hintTimer = 0;
  function setHome(on) {
    if (S.failed) return;
    S.on = on;
    if (!layer) buildDom();
    document.body.classList.toggle("home-stage-on", on);
    layer.hidden = !on;
    if (!on) togglePanel(false);
    if (on) { hint.classList.add("show"); clearTimeout(hintTimer); hintTimer = setTimeout(() => hint.classList.remove("show"), 9000); }
    else hint.classList.remove("show");
    if (S.ctl) S.ctl.setPaused(!on);
    if (on && !S.booting) S.booting = boot().catch((e) => {
      console.warn("[home-stage] 未啟用：", e && e.message);
      S.failed = true; document.body.classList.remove("home-stage-on", "home-stage-ready");
      if (layer) layer.hidden = true; if (btn) btn.hidden = true; if (sceneBtn) sceneBtn.hidden = true; if (hud) hud.hidden = true; if (hint) hint.classList.remove("show");
    });
  }

  function watch() {
    const app = document.querySelector("#app");
    if (!app) return;
    const shell = app.querySelector(".shell");
    if (!shell) { const mo = new MutationObserver(() => { if (app.querySelector(".shell")) { mo.disconnect(); watch(); } }); mo.observe(app, { childList: true }); return; }
    const sync = () => {
      const on = shell.classList.contains("route-home");
      document.body.classList.toggle("home-stage-drawer", shell.classList.contains("drawer-open"));
      if (on !== S.on) setHome(on);
    };
    new MutationObserver(sync).observe(shell, { attributes: true, attributeFilter: ["class"] });
    sync();
  }

  if (window.LIZHI_DISABLE_HOME_STAGE) return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
  window.LizhiHomeStage = { get state() { return S; }, togglePanel, importFile, choose, setTheme };
})();
