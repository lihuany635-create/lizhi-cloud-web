// 雙AI工作室｜網站群聊（v1）
// 網站 ⇄ Supabase（lizhi_dualai_*）⇄ 本人電腦上的轉接程式 ⇄ 本機 Claude、Codex
// 只有成功的資料庫回應才算「已送到雲端」；未送出的訊息先存在此裝置，恢復後自動補送。

const POLL_MS = 4000;
const STATUS_MS = 10000;
const ONLINE_WITHIN_MS = 25000;
const OUTBOX_KEY = 'lizhi-dualai-outbox';
const AGENT_NAMES = { claude: 'Claude', codex: 'Codex' };

let host = null;
const s = { messages: [], ids: new Set(), lastTs: null, outbox: [], status: null, timer: 0, statusTimer: 0, busy: false, error: '' };

function client() { return window.LizhiAuth && window.LizhiAuth.client; }
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function readOutbox() { try { const v = JSON.parse(localStorage.getItem(OUTBOX_KEY)); return Array.isArray(v) ? v : []; } catch { return []; } }
function writeOutbox() { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(s.outbox)); } catch { /* 空間不足時仍保留在記憶體 */ } }
function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
function timeText(iso) { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }); }

function ensureCss() {
  if (document.querySelector('link[data-dualai-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = './dual-ai/dual-ai.css?v=1'; link.dataset.dualaiCss = '1';
  document.head.append(link);
}

async function session() {
  const c = client(); if (!c) return null;
  return (await c.auth.getSession()).data.session;
}

// ---------- 畫面 ----------

function build() {
  host.replaceChildren();
  const wrap = el('div', 'dualai');
  const head = el('div', 'dualai-head');
  const title = el('div', 'dualai-title');
  title.append(el('strong', '', '雙AI工作室'), el('span', 'dualai-sub', 'Claude ＋ Codex 群聊'));
  const pill = el('span', 'dualai-pill', '檢查中…'); pill.dataset.role = 'pill';
  head.append(title, pill);

  const list = el('div', 'dualai-list'); list.dataset.role = 'list'; list.setAttribute('aria-live', 'polite');
  const note = el('div', 'dualai-note'); note.dataset.role = 'note';

  const form = el('form', 'dualai-compose');
  const quick = el('div', 'dualai-quick');
  for (const name of Object.keys(AGENT_NAMES)) {
    const b = el('button', 'dualai-chip', '@' + name); b.type = 'button';
    b.addEventListener('click', () => { const t = form.querySelector('textarea'); t.value = ('@' + name + ' ' + t.value.replace(/^@\w+\s*/, '')); t.focus(); });
    quick.append(b);
  }
  const box = el('textarea'); box.rows = 2; box.maxLength = 10000; box.placeholder = '輸入訊息，用 @claude 或 @codex 指定 AI';
  box.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });
  const send = el('button', 'dualai-send', '送出'); send.type = 'submit';
  form.append(quick, box, send);
  form.addEventListener('submit', e => { e.preventDefault(); queue(box.value); box.value = ''; });

  const setup = el('details', 'dualai-setup');
  setup.append(el('summary', '', '電腦端轉接設定'));
  const setupBody = el('div', 'dualai-setup-body'); setupBody.dataset.role = 'setup';
  setup.append(setupBody);

  wrap.append(head, list, note, form, setup);
  host.append(wrap);
  renderSetup();
}

function bubble(m) {
  const mine = m.sender_kind === 'human';
  const row = el('div', 'dualai-msg ' + (m.sender_kind === 'system' ? 'is-system' : mine ? 'is-me' : 'is-agent'));
  if (!mine && m.sender_kind !== 'system') {
    const key = String(m.sender || '').replace(/-\d+$/, '').toLowerCase();
    row.append(el('div', 'dualai-who', AGENT_NAMES[key] || m.sender));
  }
  const body = el('div', 'dualai-bubble'); body.textContent = m.content;
  row.append(body);
  const meta = el('div', 'dualai-meta', m.pending ? (m.failed ? '尚未送出，恢復連線後補送' : '傳送中…') : (timeText(m.created_at) + (mine && m.source === 'local' ? ' · 電腦' : '')));
  row.append(meta);
  return row;
}

function renderList() {
  const list = host && host.querySelector('[data-role=list]'); if (!list) return;
  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  list.replaceChildren();
  if (!s.messages.length && !s.outbox.length) list.append(el('div', 'dualai-empty', '還沒有訊息。試試看：「@claude 你好」'));
  for (const m of s.messages) list.append(bubble(m));
  for (const o of s.outbox) list.append(bubble({ sender_kind: 'human', content: o.content, pending: true, failed: !!s.error }));
  if (nearBottom || s.outbox.length) list.scrollTop = list.scrollHeight;
}

function renderStatus() {
  const pill = host && host.querySelector('[data-role=pill]'); const note = host && host.querySelector('[data-role=note]');
  if (!pill) return;
  const st = s.status;
  let text = '檢查中…', cls = '';
  if (st) {
    const online = st.last_seen_at && (Date.now() - Date.parse(st.last_seen_at) < ONLINE_WITHIN_MS);
    if (!st.bridge_configured) { text = '電腦端未設定'; cls = 'is-off'; }
    else if (online) { text = '● AI 在線'; cls = 'is-on'; }
    else { text = '○ AI 離線'; cls = 'is-off'; }
  }
  pill.textContent = text; pill.className = 'dualai-pill ' + cls;
  const pending = st ? Number(st.pending_count) || 0 : 0;
  note.textContent = s.error ? s.error
    : (st && !st.bridge_configured) ? '電腦端還沒設定轉接：請打開下方「電腦端轉接設定」。'
    : (cls === 'is-off' && pending) ? `電腦目前離線，有 ${pending} 則訊息會在電腦開啟雙AI工作室後送達 AI。`
    : '';
}

function renderSetup() {
  const box = host && host.querySelector('[data-role=setup]'); if (!box) return;
  box.replaceChildren();
  const st = s.status;
  box.append(el('p', '', st && st.bridge_configured
    ? `已設定轉接金鑰（末四碼 ${st.key_last4}）。重新產生會讓舊金鑰立即失效。`
    : '在你的電腦上，雙AI工作室需要一把「轉接金鑰」才能收送網站訊息。'));
  const btn = el('button', 'dualai-chip', st && st.bridge_configured ? '重新產生轉接金鑰' : '產生轉接金鑰'); btn.type = 'button';
  btn.addEventListener('click', createKey);
  box.append(btn);
}

async function createKey() {
  if (s.status && s.status.bridge_configured && !confirm('重新產生後，電腦上的舊金鑰會立即失效，要繼續嗎？')) return;
  const box = host.querySelector('[data-role=setup]');
  try {
    const { data, error } = await client().rpc('lizhi_dualai_create_bridge_key');
    if (error) throw error;
    const cfg = JSON.stringify({ supabase_url: window.LIZHI_SUPABASE_URL, publishable_key: window.LIZHI_SUPABASE_PUBLISHABLE_KEY, bridge_key: data }, null, 2);
    box.replaceChildren();
    box.append(el('p', '', '這把金鑰只會顯示這一次。請把下面整段存成電腦上 agentchattr 資料夾裡的 bridge.local.json，然後重新啟動雙AI工作室：'));
    const pre = el('textarea', 'dualai-key'); pre.readOnly = true; pre.rows = 5; pre.value = cfg;
    const copy = el('button', 'dualai-chip', '複製'); copy.type = 'button';
    copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(cfg); copy.textContent = '已複製'; } catch { pre.select(); } });
    box.append(pre, copy, el('p', 'dualai-warn', '不要把這段貼到聊天或公開的地方；外洩時按「重新產生」即可作廢。'));
    await refreshStatus();
  } catch (e) {
    box.append(el('p', 'dualai-warn', '產生失敗：' + (e.message || e)));
  }
}

// ---------- 資料 ----------

function addMessages(rows) {
  let changed = false;
  for (const r of rows || []) {
    if (s.ids.has(r.id)) continue;
    s.ids.add(r.id); s.messages.push(r); changed = true;
    if (!s.lastTs || r.created_at > s.lastTs) s.lastTs = r.created_at;
  }
  if (changed) { s.messages.sort((a, b) => a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0); if (s.messages.length > 300) s.messages.splice(0, s.messages.length - 300); }
  return changed;
}

async function loadInitial() {
  const { data, error } = await client().from('lizhi_dualai_messages')
    .select('id,source,sender,sender_kind,content,created_at')
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100);
  if (error) throw error;
  addMessages((data || []).reverse());
}

async function loadNew() {
  let q = client().from('lizhi_dualai_messages').select('id,source,sender,sender_kind,content,created_at')
    .order('created_at', { ascending: true }).limit(100);
  if (s.lastTs) q = q.gte('created_at', s.lastTs);
  const { data, error } = await q;
  if (error) throw error;
  return addMessages(data);
}

async function refreshStatus() {
  const { data, error } = await client().rpc('lizhi_dualai_status');
  if (error) throw error;
  const before = JSON.stringify(s.status && [s.status.bridge_configured, s.status.key_last4]);
  s.status = Array.isArray(data) ? data[0] : data;
  renderStatus();
  if (before !== JSON.stringify(s.status && [s.status.bridge_configured, s.status.key_last4])) renderSetup();
}

function queue(text) {
  const content = String(text || '').trim();
  if (!content) return;
  s.outbox.push({ id: uuid(), content: content.slice(0, 10000) });
  writeOutbox(); renderList(); void flush();
}

async function flush() {
  while (s.outbox.length) {
    const item = s.outbox[0];
    const { data, error } = await client().rpc('lizhi_dualai_send', { p_id: item.id, p_content: item.content });
    if (error) { s.error = '雲端暫時無法同步，訊息先保存在此裝置，恢復後自動補送'; renderStatus(); renderList(); return; }
    s.outbox.shift(); writeOutbox(); s.error = '';
    addMessages([data]); renderList(); renderStatus();
  }
}

async function tick() {
  if (!host || !host.isConnected) { stop(); return; }
  if (document.hidden) return;
  if (s.busy) return; s.busy = true;
  try { await flush(); if (await loadNew()) renderList(); if (!s.error) renderStatus(); }
  catch { s.error = '雲端暫時無法同步，稍後自動重試'; renderStatus(); }
  finally { s.busy = false; }
}

function stop() { clearInterval(s.timer); clearInterval(s.statusTimer); s.timer = s.statusTimer = 0; }

export async function mount(target) {
  stop();
  host = target; ensureCss();
  s.messages = []; s.ids = new Set(); s.lastTs = null; s.outbox = readOutbox(); s.error = '';
  if (!(await session())) {
    host.replaceChildren(el('div', 'production-loading', '請先登入立之雲端庫，才能使用雙AI工作室。'));
    return;
  }
  build();
  try { await loadInitial(); } catch { s.error = '讀取訊息失敗，稍後自動重試'; }
  renderList();
  try { await refreshStatus(); } catch { /* 下次重試 */ }
  void flush();
  s.timer = setInterval(tick, POLL_MS);
  s.statusTimer = setInterval(() => { if (!document.hidden && host && host.isConnected) refreshStatus().catch(() => {}); }, STATUS_MS);
  if (!s.listening) {
    s.listening = true;
    document.addEventListener('visibilitychange', () => { if (!document.hidden && s.timer) void tick(); });
    window.addEventListener('online', () => { if (s.timer) void tick(); });
  }
}
