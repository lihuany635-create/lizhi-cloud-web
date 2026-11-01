// 立之 AI 工作台 v2 — 網頁看板（本人檢視與批准用；寫入由 AI 透過 MCP 完成）
const API = 'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-ai-workbench/';
const ROLE = { manager: '專案經理', advisor: '顧問', engineer: '工程師', user: '本人' };
const STATUS = { todo: '待辦', doing: '進行中', blocked: '卡住', review: '待驗收', done: '完成' };
const KIND = { dispatch: '派工', analysis: '分析', execution: '執行', blocked: '阻礙', acceptance: '驗收' };
const ACTION = { create_project: '建立專案', update_project: '更新專案', create_task: '建立任務', update_task: '更新任務', tick_check: '打勾', untick_check: '取消勾選', attach_report: '掛報告', notify: '通知', ack_notice: '已讀通知', user_approve: '本人批准', user_reject: '本人退回', archive_project: '封存專案', unarchive_project: '還原專案' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (s) => s ? new Date(s).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const link = (url, text) => /^https:\/\//.test(url || '') ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>` : esc(text);

const CSS = `
.aiwb{--b:#d9dee5;--t:#1d2733;--m:#5f6b78;--bg:#f7f8fa;--card:#fff;--ok:#1f7a4d;--warn:#b25e00;--bad:#b42318;--acc:#2f5bd3;color:var(--t);background:var(--bg);min-height:calc(100dvh - 70px);padding:16px;box-sizing:border-box;font-size:15px}
@media (prefers-color-scheme:dark){.aiwb{--b:#2d3540;--t:#e6eaef;--m:#9aa5b1;--bg:#12161b;--card:#1a2027;--acc:#7ea2ff}}
.aiwb *{box-sizing:border-box}.aiwb h1{font-size:20px;margin:0}.aiwb h2{font-size:15px;margin:22px 0 8px;color:var(--m);font-weight:600}
.aiwb-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.aiwb-top .sp{flex:1}.aiwb small{color:var(--m)}
.aiwb button{font:inherit;border:1px solid var(--b);background:var(--card);color:var(--t);border-radius:8px;padding:6px 12px;cursor:pointer}.aiwb button.pri{background:var(--acc);border-color:var(--acc);color:#fff}.aiwb button:disabled{opacity:.5}
.aiwb label{display:inline-flex;gap:4px;align-items:center;color:var(--m);font-size:13px}
.aiwb-card{background:var(--card);border:1px solid var(--b);border-radius:12px;padding:12px;margin:8px 0}
.aiwb-proj>summary{cursor:pointer;list-style:none;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.aiwb-proj>summary::-webkit-details-marker{display:none}
.aiwb-proj>summary b{font-size:16px}.aiwb-counts{display:flex;gap:6px;flex-wrap:wrap}
.aiwb-chip{display:inline-block;font-size:12px;padding:1px 8px;border-radius:999px;border:1px solid var(--b);color:var(--m);white-space:nowrap}
.aiwb-chip.todo{}.aiwb-chip.doing{color:var(--acc);border-color:var(--acc)}.aiwb-chip.blocked{color:var(--bad);border-color:var(--bad)}.aiwb-chip.review{color:var(--warn);border-color:var(--warn)}.aiwb-chip.done{color:var(--ok);border-color:var(--ok)}.aiwb-chip.need{color:#fff;background:var(--warn);border-color:var(--warn)}
.aiwb-task{border-top:1px solid var(--b);padding:10px 0}.aiwb-task:first-of-type{border-top:0}
.aiwb-task>div.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;cursor:pointer}.aiwb-task .code{font-family:ui-monospace,monospace;font-size:12px;color:var(--m)}
.aiwb-task .title{flex:1 1 200px;min-width:0}.aiwb-next{color:var(--m);font-size:13px;margin:4px 0 0}
.aiwb-bar{height:6px;background:var(--b);border-radius:9px;overflow:hidden;width:90px}.aiwb-bar i{display:block;height:100%;background:var(--ok)}
.aiwb-detail{margin-top:8px;padding:10px;border-radius:8px;background:var(--bg)}.aiwb-detail ul{list-style:none;margin:4px 0 10px;padding:0}.aiwb-detail li{padding:3px 0}
.aiwb-detail .ck{display:inline-block;width:1.3em;color:var(--ok);font-weight:700}.aiwb-detail .ck.no{color:var(--m)}
.aiwb a{color:var(--acc)}.aiwb-empty{color:var(--m);padding:20px 0;text-align:center}.aiwb-err{color:var(--bad)}
.aiwb-ev{font-size:13px;color:var(--m)}
`;

export function mount(host) {
  const state = { data: null, open: new Set(), details: {}, showDone: false, showArchived: false, busy: false, error: '' };
  host.replaceChildren();
  const style = document.createElement('style'); style.textContent = CSS; host.append(style);
  const root = document.createElement('div'); root.className = 'aiwb'; host.append(root);

  async function token() {
    const auth = window.LizhiAuth;
    if (!auth?.client) throw new Error('請先登入立之雲端庫');
    const { data, error } = await auth.client.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('請先登入立之雲端庫');
    return data.session.access_token;
  }
  async function api(path, body) {
    const r = await fetch(API + path, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { Authorization: 'Bearer ' + await token(), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const v = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(v.error || '工作台連線失敗');
    return v;
  }
  async function load() {
    try { state.data = await api('board'); state.error = ''; for (const id of state.open) state.details[id] = await api('task?id=' + id); }
    catch (e) { state.error = e.message; }
    render();
  }

  function taskRow(t) {
    const pct = t.checks_total ? Math.round(100 * t.checks_done / t.checks_total) : 0;
    const need = t.needs_approval && !t.approved_at && t.status !== 'done';
    const d = state.open.has(t.id) ? state.details[t.id] : null;
    return `<div class="aiwb-task" data-task="${t.id}">
      <div class="row" data-toggle="${t.id}"><span class="code">${esc(t.code)}</span><span class="title">${esc(t.title)}</span>
      ${need ? '<span class="aiwb-chip need">待你批准</span>' : ''}<span class="aiwb-chip ${t.status}">${STATUS[t.status]}</span>
      <span class="aiwb-chip">${ROLE[t.assignee]}</span>
      <span title="勾選進度"><span class="aiwb-bar"><i style="width:${pct}%"></i></span></span><small>${t.checks_done}/${t.checks_total}</small></div>
      ${t.next_step ? `<p class="aiwb-next">下一步：${esc(t.next_step)}</p>` : ''}
      ${state.open.has(t.id) ? (d ? detail(d) : '<div class="aiwb-detail">讀取中…</div>') : ''}
    </div>`;
  }
  function detail(d) {
    const t = d.task;
    return `<div class="aiwb-detail">
      ${t.needs_approval ? `<p><b>需本人批准</b>：${esc(t.approval_reason)} ${t.approved_at ? `<span class="aiwb-chip done">已批准 ${when(t.approved_at)}</span>` : ''}${t.approval_note ? `<br><small>備註：${esc(t.approval_note)}</small>` : ''}</p>` : ''}
      <b>檢查清單</b><ul>${d.checks.length ? d.checks.map((c) => `<li><span class="ck ${c.checked ? '' : 'no'}">${c.checked ? '✓' : '○'}</span>${esc(c.text)}${c.checked ? ` <small>· ${ROLE[c.checked_by] ?? esc(c.checked_by)} ${when(c.checked_at)}</small> ${link(c.evidence_url, '證據')}` : ''}</li>`).join('') : '<li><small>尚無勾選項</small></li>'}</ul>
      <b>報告書</b><ul>${d.reports.length ? d.reports.map((r) => `<li>${link(r.url, r.title)} <small>· ${KIND[r.kind]} · ${ROLE[r.role]} · ${esc(r.version)} · ${when(r.created_at)}</small></li>`).join('') : '<li><small>尚無報告</small></li>'}</ul>
      <b>最近紀錄</b><ul>${d.events.slice(0, 15).map((e) => `<li class="aiwb-ev">${when(e.at)} · ${ROLE[e.actor] ?? esc(e.actor)} · ${ACTION[e.action] ?? esc(e.action)}${e.detail?.text ? '：' + esc(e.detail.text) : e.detail?.title ? '：' + esc(e.detail.title) : e.detail?.status ? '：' + (STATUS[e.detail.status] ?? '') : ''}</li>`).join('')}</ul>
    </div>`;
  }

  function render() {
    const d = state.data;
    if (!d) { root.innerHTML = `<div class="aiwb-top"><h1>AI 工作台</h1></div><p class="${state.error ? 'aiwb-err' : 'aiwb-empty'}">${esc(state.error || '讀取中…')}</p>`; return; }
    const projects = d.projects.filter((p) => state.showArchived || !p.archived);
    const live = new Set(d.projects.filter((p) => !p.archived).map((p) => p.id));
    const approvals = d.tasks.filter((t) => t.needs_approval && !t.approved_at && t.status !== 'done' && live.has(t.project_id));
    root.innerHTML = `
      <div class="aiwb-top"><h1>AI 工作台</h1><span class="sp"></span>
        <label><input type="checkbox" data-opt="showDone" ${state.showDone ? 'checked' : ''}>顯示已完成</label>
        <label><input type="checkbox" data-opt="showArchived" ${state.showArchived ? 'checked' : ''}>顯示封存</label>
        <button data-act="refresh">重新整理</button></div>
      <small>給 AI 專用：專案經理／顧問／工程師透過 ChatGPT 讀寫；你在這裡看進度、批准重大決定。詳細內容在各任務的 Drive 報告書。</small>
      ${state.error ? `<p class="aiwb-err">${esc(state.error)}</p>` : ''}
      ${approvals.length ? `<h2>待你批准（${approvals.length}）</h2>${approvals.map((t) => `<div class="aiwb-card"><b>${esc(t.code)}</b> ${esc(t.title)}<p class="aiwb-next">${esc(t.approval_reason)}</p><button class="pri" data-approve="${t.id}">批准</button> <button data-reject="${t.id}">退回</button> <button data-toggle="${t.id}">看詳情</button></div>`).join('')}` : ''}
      ${d.notices.length ? `<h2>給你的通知（${d.notices.length}）</h2>${d.notices.map((n) => { const t = d.tasks.find((x) => x.id === n.task_id); return `<div class="aiwb-card"><small>${when(n.created_at)} · ${ROLE[n.from_role]}</small><br>${t ? `<b>${esc(t.code)}</b> ${esc(t.title)}<br>` : ''}${esc(n.next_step)} <button data-ack="${n.id}">已讀</button></div>`; }).join('')}` : ''}
      <h2>專案</h2>
      ${projects.length ? projects.map((p) => {
        const ts = d.tasks.filter((t) => t.project_id === p.id);
        const shown = ts.filter((t) => state.showDone || t.status !== 'done');
        const cnt = (s) => ts.filter((t) => t.status === s).length;
        return `<details class="aiwb-card aiwb-proj" open><summary><b>${esc(p.title)}</b>${p.archived ? '<span class="aiwb-chip">已封存</span>' : ''}
          <span class="aiwb-counts">${['doing', 'review', 'blocked', 'todo', 'done'].filter((s) => cnt(s)).map((s) => `<span class="aiwb-chip ${s}">${STATUS[s]} ${cnt(s)}</span>`).join('')}</span>
          ${p.drive_folder_url ? link(p.drive_folder_url, 'Drive 報告') : ''}</summary>
          ${p.goal ? `<p class="aiwb-next">${esc(p.goal)}</p>` : ''}
          ${shown.length ? shown.map(taskRow).join('') : `<p class="aiwb-empty">${ts.length ? '沒有未完成的任務' : '尚無任務'}</p>`}
          <p><button data-archive="${p.id}" data-to="${p.archived ? 'false' : 'true'}">${p.archived ? '還原專案' : '封存專案'}</button></p>
        </details>`;
      }).join('') : '<p class="aiwb-empty">目前沒有專案。由「專案經理」在 ChatGPT 用 aiwb_save_project 建立。</p>'}
      ${d.events.length ? `<h2>最近動態</h2><div class="aiwb-card">${d.events.slice(0, 12).map((e) => { const t = d.tasks.find((x) => x.id === e.task_id); return `<div class="aiwb-ev">${when(e.at)} · ${ROLE[e.actor] ?? esc(e.actor)} · ${ACTION[e.action] ?? esc(e.action)}${t ? ' · ' + esc(t.code) : ''}</div>`; }).join('')}</div>` : ''}`;
  }

  root.addEventListener('change', (e) => { const k = e.target.dataset.opt; if (k) { state[k] = e.target.checked; render(); } });
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-toggle],[data-act],[data-approve],[data-reject],[data-ack],[data-archive]');
    if (!el || e.target.closest('a')) return;
    try {
      if (el.dataset.toggle) {
        const id = el.dataset.toggle;
        if (state.open.has(id)) state.open.delete(id); else { state.open.add(id); render(); state.details[id] = await api('task?id=' + id); }
        return render();
      }
      if (el.dataset.act === 'refresh') return load();
      if (el.dataset.approve) { el.disabled = true; await api('approve', { task_id: el.dataset.approve, approve: true }); return load(); }
      if (el.dataset.reject) { const note = prompt('退回原因（會留在紀錄裡給專案經理看）：'); if (note === null) return; el.disabled = true; await api('approve', { task_id: el.dataset.reject, approve: false, note }); return load(); }
      if (el.dataset.ack) { el.disabled = true; await api('ack', { ids: [el.dataset.ack] }); return load(); }
      if (el.dataset.archive) { const to = el.dataset.to === 'true'; if (to && !confirm('封存這個專案？之後可以再還原。')) return; await api('archive', { project_id: el.dataset.archive, archived: to }); return load(); }
    } catch (err) { state.error = err.message; render(); }
  });

  render(); load();
  const timer = setInterval(() => { if (document.visibilityState === 'visible' && host.isConnected) load(); else if (!host.isConnected) clearInterval(timer); }, 60000);
}
