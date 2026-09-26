(function () {
  const ALLOWED_EMAIL = "lihuany635@gmail.com";
  const client = window.supabase.createClient(
    window.LIZHI_SUPABASE_URL,
    window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  let currentUser = null;

  function renderGate(message = "請使用核准的 Google 帳號登入。") {
    document.body.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;background:#f3ead9;color:#2d2925;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px"><section style="width:min(440px,100%);background:#fffaf0;border:1px solid #d8c9b3;border-radius:20px;padding:32px;box-shadow:0 18px 60px #6b513522;text-align:center"><div style="font-size:14px;letter-spacing:.16em;color:#8f6d4c">PRIVATE CLOUD ARCHIVE</div><h1 style="margin:12px 0 8px">立之雲端庫</h1><p style="line-height:1.7;color:#65594e">${message}</p><button id="lizhi-google-login" style="border:0;border-radius:999px;padding:12px 20px;background:#2d2925;color:#fffaf0;font-size:16px;cursor:pointer">使用 Google 登入</button><p style="font-size:12px;color:#887a6c;margin-top:18px">只允許核准帳號存取個人資料</p></section></main>`;
    document.querySelector("#lizhi-google-login")?.addEventListener("click", async () => {
      const button = document.querySelector("#lizhi-google-login");
      button.disabled = true;
      button.textContent = "正在前往 Google…";
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}${location.pathname}` }
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
    el.querySelector("button").addEventListener("click", () => client.auth.signOut().then(() => location.reload()));
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
    mountAccountControl(user);
    return user;
  }

  window.LizhiAuth = { client, allowedEmail: ALLOWED_EMAIL, requireUser, get user() { return currentUser; } };
})();
