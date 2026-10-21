import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { createClient } from '@supabase/supabase-js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AUTH_CALLBACK, callbackCode, oauthURL } from './auth-contract.mjs';
import { saveBlob } from './export-file.mjs';

window.supabase = { createClient };
window.LizhiPlatform = Object.freeze({ isNative: Capacitor.isNativePlatform(), version: '0.1.0' });
let activeCallback = null;
let clientReady;
const authClient = new Promise(resolve => { clientReady = resolve; });

async function receiveURL(value, cold = false) {
  let code;
  try {
    code = callbackCode(value);
    if (!code || activeCallback === code) return;
    activeCallback = code;
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)))].map(byte => byte.toString(16).padStart(2,'0')).join('');
    if (sessionStorage.getItem('lizhi-mobile-auth-return') === digest) return;
    const client = await authClient;
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    sessionStorage.setItem('lizhi-mobile-auth-return', digest);
    await Browser.close().catch(() => {});
    // Never retain the authorization code in navigation/history or logs.
    if (!cold) location.reload();
  } catch {
    window.LizhiMobile.authError = '登入回傳未完成，請確認 App 登入回傳網址已設定，再重新登入。';
    activeCallback = null;
    document.querySelector('[data-mobile-auth-error]')?.remove();
    const note = document.createElement('p');
    note.dataset.mobileAuthError = '';
    note.textContent = window.LizhiMobile.authError;
    document.querySelector('#lizhi-google-login')?.after(note);
  }
}

window.LizhiMobile = {
  async saveExport(blob, name) {
    if (Object.prototype.toString.call(blob) !== '[object Blob]') throw new Error('匯出檔格式不正確');
    return saveBlob(blob,name,{filesystem:Filesystem,share:Share,directory:Directory.Cache,id:crypto.randomUUID()});
  },
  callbackURL: AUTH_CALLBACK,
  attachAuth(client) { clientReady(client); },
  async signIn(client) {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: AUTH_CALLBACK, skipBrowserRedirect: true }
    });
    if (error) throw error;
    const href = oauthURL(data.url, window.LIZHI_SUPABASE_URL);
    await Browser.open({ url: href });
  },
  async openExternal(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('只支援 HTTPS 連結');
    await Browser.open({ url: url.href });
  }
};

window.LizhiMobile.ready = (async () => {
  if (!Capacitor.isNativePlatform()) return;
  await App.addListener('appUrlOpen', event => { void receiveURL(event.url); });
  await App.addListener('backButton', () => {
    if (window.LizhiNavigation?.back()) return;
    if (location.pathname !== '/' && location.pathname !== '/index.html') {
      location.href = './index.html'; return;
    }
    void App.minimizeApp();
  });
  await App.addListener('appStateChange', ({ isActive }) => {
    const auth = window.LizhiAuth?.client?.auth;
    if (isActive) auth?.startAutoRefresh(); else auth?.stopAutoRefresh();
  });
  const launch = await App.getLaunchUrl();
  if (launch?.url) await receiveURL(launch.url, true);
})();

document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!Capacitor.isNativePlatform() || !link || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.href);
  if (url.origin === location.origin) {
    const route = { '/image-graph/':'imagegraph', '/model-viewer/':'model3d', '/licut/':'licut', '/a4-editor/':'a4' }[url.pathname];
    if (route && link.target === '_blank' && window.LizhiNavigation?.open) {
      event.preventDefault(); window.LizhiNavigation.open(route);
    }
    return;
  }
  if (url.protocol !== 'https:') return;
  event.preventDefault();
  void window.LizhiMobile.openExternal(url.href).catch(() => {});
});
