(function () {
  "use strict";

  const ALLOWED_EMAIL = "lihuany635@gmail.com";
  const params = new URLSearchParams(location.search);
  const authorizationId = params.get("authorization_id");
  const message = document.querySelector("#message");
  const approveButton = document.querySelector("#approve");
  const denyButton = document.querySelector("#deny");
  const clientName = document.querySelector("#client-name");
  const clientDetail = document.querySelector("#client-detail");
  const client = window.supabase.createClient(
    window.LIZHI_SUPABASE_URL,
    window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
  );

  function setBusy(busy) {
    approveButton.disabled = busy;
    denyButton.disabled = busy;
  }

  function fail(text) {
    message.textContent = text;
    setBusy(false);
  }

  function consentURL() {
    const url = new URL(location.href);
    url.hash = "";
    url.search = "";
    url.searchParams.set("authorization_id", authorizationId);
    return url.href;
  }

  async function signIn() {
    setBusy(true);
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: consentURL() },
    });
    if (error) fail(`無法開始登入：${error.message}`);
  }

  async function initialize() {
    if (!authorizationId) {
      fail("缺少 OAuth 授權識別碼。請從 ChatGPT 重新開始連線。");
      return;
    }

    setBusy(true);
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      fail(`無法確認登入狀態：${sessionError.message}`);
      return;
    }
    const user = sessionData.session?.user;
    if (!user) {
      clientName.textContent = "請先使用核准的 Google 帳號登入";
      clientDetail.textContent = "登入後會回到這個授權畫面。";
      approveButton.textContent = "使用 Google 登入";
      approveButton.onclick = signIn;
      denyButton.hidden = true;
      setBusy(false);
      return;
    }
    if (String(user.email || "").toLowerCase() !== ALLOWED_EMAIL) {
      await client.auth.signOut();
      fail("這個 Google 帳號未被核准使用立之圖書館。");
      return;
    }

    const { data, error } = await client.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error) {
      fail(`無法載入授權內容：${error.message}`);
      return;
    }
    if (!data.authorization_id && data.redirect_url) {
      location.assign(data.redirect_url);
      return;
    }
    clientName.textContent = data.client?.name || "未命名的 MCP 用戶端";
    const scopes = String(data.scope || "email").split(/\s+/).filter(Boolean).join("、");
    clientDetail.textContent = `要求權限：${scopes || "email"}`;
    approveButton.onclick = async () => {
      setBusy(true);
      const result = await client.auth.oauth.approveAuthorization(authorizationId);
      if (result.error) fail(`授權失敗：${result.error.message}`);
      else if (result.data?.redirect_url) location.assign(result.data.redirect_url);
      else fail("授權已完成，但服務沒有提供返回網址。");
    };
    denyButton.onclick = async () => {
      setBusy(true);
      const result = await client.auth.oauth.denyAuthorization(authorizationId);
      if (result.error) fail(`無法拒絕授權：${result.error.message}`);
      else if (result.data?.redirect_url) location.assign(result.data.redirect_url);
      else fail("已拒絕授權，但服務沒有提供返回網址。");
    };
    setBusy(false);
  }

  initialize().catch((error) => fail(`授權頁發生錯誤：${error.message}`));
})();
