(function () {
  const ALLOWED_EMAIL = "lihuany635@gmail.com";
  const client = window.supabase.createClient(
    window.LIZHI_SUPABASE_URL,
    window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  let currentUser = null;
  const allowedRoutes = new Set(["home","knowledge","weave","finance","engineering","media","chat","study","a4","licut","cad","imagegraph","animationflow","phoneagent","trash","settings","uploads","library","ai"]);
  function returnURL() {
    const target = new URL(location.origin + location.pathname), requested = new URLSearchParams(location.search).get("open");
    if (allowedRoutes.has(requested)) target.searchParams.set("open", requested);
    return target.href;
  }
  function disconnectWorkbenches() {
    document.querySelectorAll('iframe').forEach(frame => frame.contentWindow?.postMessage({type:"lizhi-account-logout"}, location.origin));
  }

  const GATE_CSS = `#lizhi-gate{position:fixed;inset:0;overflow:hidden;display:grid;place-items:center;background:#f3ead9;color:#2d2925;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px}
#lizhi-stage{position:absolute;inset:0}
#lizhi-gate-card{position:relative;z-index:2;width:min(440px,100%);background:#fffaf0;border:1px solid #d8c9b3;border-radius:20px;padding:32px;box-shadow:0 18px 60px #6b513522;text-align:center;transition:transform .35s ease,opacity .35s ease}
#lizhi-gate-hint,#lizhi-gate-toggle{display:none}
#lizhi-gate.staged{display:block;padding:0}
#lizhi-gate.staged #lizhi-gate-card{position:absolute;right:28px;top:50%;transform:translateY(-50%);width:min(360px,calc(100% - 32px));padding:26px;background:#fffaf0e8;backdrop-filter:blur(10px)}
#lizhi-gate.staged.collapsed #lizhi-gate-card{opacity:0;pointer-events:none;transform:translateY(-50%) translateX(30px)}
#lizhi-gate.staged #lizhi-gate-hint{display:block;position:absolute;left:16px;top:calc(14px + env(safe-area-inset-top));z-index:2;max-width:calc(100% - 32px);background:#2d2925cc;color:#fffaf0;font-size:12px;line-height:1.5;border-radius:999px;padding:7px 14px;pointer-events:none}
#lizhi-gate.staged #lizhi-gate-toggle{display:block;position:absolute;right:16px;top:calc(12px + env(safe-area-inset-top));z-index:4;border:1px solid #d8c9b3;border-radius:999px;padding:7px 14px;background:#fffaf0ee;color:#2d2925;font-size:13px;cursor:pointer}
@media (max-width:720px){#lizhi-gate.staged #lizhi-gate-card{right:50%;top:auto;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(50%);padding:18px 18px 14px}
#lizhi-gate.staged.collapsed #lizhi-gate-card{transform:translateX(50%) translateY(40px)}
#lizhi-gate.staged #lizhi-gate-card h1{font-size:24px;margin:6px 0 4px}#lizhi-gate.staged #lizhi-gate-card p{margin:6px 0}#lizhi-gate.staged #lizhi-gate-card p:last-child{display:none}
#lizhi-gate.staged.joy #lizhi-gate-card{bottom:calc(150px + env(safe-area-inset-bottom))}}`;

  // 登入畫面背景的 3D 伸展台（login-stage.js）。只有登入畫面會載入；任何失敗都保留原本的卡片。
  function mountLoginStage() {
    try {
      if (!document.createElement || !document.head || window.LIZHI_DISABLE_LOGIN_STAGE) return;
      const gate = document.querySelector("#lizhi-gate"), stage = document.querySelector("#lizhi-stage");
      if (!gate || !stage) return;
      const start = () => window.LizhiLoginStage.mount(stage).then((ctl) => {
        if (!ctl || !gate.isConnected) return;
        const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
        gate.classList.add("staged"); if (coarse) gate.classList.add("joy");
        const narrow = () => window.innerWidth <= 720;
        const shift = () => ctl.setFrameShift(narrow() && !gate.classList.contains("collapsed") ? 0.24 : 0);
        shift(); window.addEventListener("resize", shift);
        document.querySelector("#lizhi-gate-hint").textContent = coarse ? "左下搖桿移動（推到底衝刺）・點伸展台跑過去" : "WASD／方向鍵移動・Shift 衝刺・空白鍵跳・點伸展台跑過去";
        const toggle = document.querySelector("#lizhi-gate-toggle");
        toggle.addEventListener("click", () => { const c = gate.classList.toggle("collapsed"); toggle.textContent = c ? "登入" : "收起"; toggle.blur(); shift(); });
      }).catch((e) => console.warn("[login-stage] 未啟用：", e && e.message));
      if (window.LizhiLoginStage) { start(); return; }
      const s = document.createElement("script");
      s.src = "./login-stage.js?v=1"; s.onload = start;
      document.head.appendChild(s);
    } catch (_) { /* 伸展台只是裝飾，不影響登入 */ }
  }

  function renderGate(message = "請使用核准的 Google 帳號登入。") {
    try { window.LizhiLoginStage?.destroy(); } catch (_) {}
    document.body.innerHTML = `<style>${GATE_CSS}</style><main id="lizhi-gate"><div id="lizhi-stage"></div><div id="lizhi-gate-hint"></div><button type="button" id="lizhi-gate-toggle">收起</button><section id="lizhi-gate-card"><div style="font-size:14px;letter-spacing:.16em;color:#8f6d4c">PRIVATE CLOUD ARCHIVE</div><h1 style="margin:12px 0 8px">立之雲端庫</h1><p style="line-height:1.7;color:#65594e">${message}</p><button id="lizhi-google-login" style="border:0;border-radius:999px;padding:12px 20px;background:#2d2925;color:#fffaf0;font-size:16px;cursor:pointer">使用 Google 登入</button><p style="font-size:12px;color:#887a6c;margin-top:18px">只允許核准帳號存取個人資料</p></section></main>`;
    mountLoginStage();
    document.querySelector("#lizhi-google-login")?.addEventListener("click", async () => {
      const button = document.querySelector("#lizhi-google-login");
      button.disabled = true;
      button.textContent = "正在前往 Google…";
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: returnURL() }
      });
      if (error) renderGate(`登入設定尚未完成：${error.message}`);
    });
  }

  function mountAccountControl(user) {
    if (document.querySelector("#lizhi-account-control")) return;
    const el = document.createElement("div");
    el.id = "lizhi-account-control";
    el.style.cssText = "position:fixed;right:16px;top:14px;z-index:30;display:flex;align-items:center;gap:8px;background:#fffaf0ee;border:1px solid #d8c9b3;border-radius:999px;padding:6px 8px 6px 12px;font:12px system-ui;color:#51473f;box-shadow:0 6px 20px #6b513522";
    el.innerHTML = `<span>${user.email}</span><button type="button" style="border:0;border-radius:999px;padding:6px 10px;background:#2d2925;color:#fffaf0;cursor:pointer">登出</button>`;
    el.querySelector("button").addEventListener("click", () => { disconnectWorkbenches(); client.auth.signOut().then(() => location.reload()); });
    document.body.append(el);
  }

  async function requireUser() {
    const { data, error } = await client.auth.getSession();
    if (error) { renderGate(`無法取得登入狀態：${error.message}`); return null; }
    const user = data.session?.user || null;
    if (!user || String(user.email || "").toLowerCase() !== ALLOWED_EMAIL) {
      if (user) await client.auth.signOut();
      renderGate(user ? "此 Google 帳號未被核准使用本網站。" : undefined);
      return null;
    }
    currentUser = user;
    // Resume a pending OAuth consent only after an authenticated session exists.
    // The target path is fixed to this site's consent page (never user-controlled).
    const pending=sessionStorage.getItem('lizhi_mobile_pending_oauth_authorization_v1');
    if(pending && /^[a-zA-Z0-9_-]{12,256}$/.test(pending)) {
      sessionStorage.removeItem('lizhi_mobile_pending_oauth_authorization_v1');
      const target=new URL('./oauth/consent/',location.origin+location.pathname);
      target.searchParams.set('authorization_id',pending);
      location.replace(target.href);
      return null;
    }
    return user;
  }

  // 右上角的帳號／登出按鈕已拿掉（會擋到畫面）；需要登出時可呼叫 LizhiAuth.signOut()
  const signOut = () => { disconnectWorkbenches(); return client.auth.signOut().then(() => location.reload()); };
  window.LizhiAuth = { client, allowedEmail: ALLOWED_EMAIL, requireUser, signOut, get user() { return currentUser; } };
})();
