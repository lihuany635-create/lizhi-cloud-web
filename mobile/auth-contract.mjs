export const AUTH_CALLBACK = 'lizhi-cloud://auth/callback';

// Only an authorization code is accepted. Supabase verifies the locally held PKCE verifier.
export function callbackCode(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'lizhi-cloud:' || url.hostname !== 'auth' ||
      url.pathname !== '/callback' || url.port || url.username || url.password || url.hash) return null;
  if (url.searchParams.has('error')) throw new Error('Google 登入未完成，請回到登入頁重試。');
  if (url.searchParams.getAll('code').length !== 1) return null;
  const code = url.searchParams.get('code');
  return code && code.length <= 4096 ? code : null;
}

export function oauthURL(value, supabaseURL) {
  const url = new URL(value), expected = new URL(supabaseURL);
  if (url.protocol !== 'https:' || url.origin !== expected.origin ||
      url.pathname !== '/auth/v1/authorize' || url.username || url.password) {
    throw new Error('登入網址不符合目前的帳號服務設定。');
  }
  return url.href;
}
