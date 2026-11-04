// 立之 AI 工作台：「其他 AI 紀錄」— 三角色以外的任何 AI 都能寫的工作日誌／交接與待辦勾選。
// 不需要 role；每筆紀錄以 agent（AI 名稱）標示是誰寫的。AI 可以新增、修改、刪除。

export type Db = (path: string, init?: RequestInit) => Promise<any>;
export class SideFail extends Error { constructor(msg: string, public status = 400) { super(msg); } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["todo", "doing", "blocked", "done"] as const;
const q = (v: string) => encodeURIComponent(v);
const S = { type: "string" };

function text(v: unknown, name: string, max: number, required = false): string {
  if (v === undefined || v === null) { if (required) throw new SideFail(`缺少 ${name}`); return ""; }
  if (typeof v !== "string") throw new SideFail(`${name} 必須是文字`);
  const s = v.trim();
  if (required && !s) throw new SideFail(`缺少 ${name}`);
  if (s.length > max) throw new SideFail(`${name} 超過 ${max} 字`);
  return s;
}
function uuid(v: unknown, name: string): string {
  if (typeof v !== "string" || !UUID.test(v)) throw new SideFail(`${name} 格式錯誤（應為 UUID，可先用 side_overview 查）`);
  return v;
}
function links(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > 20) throw new SideFail("links 必須是最多 20 個網址的陣列");
  return v.map((x, i) => { const s = text(x, `links[${i}]`, 2000, true); if (!/^https:\/\/\S+$/.test(s)) throw new SideFail(`links[${i}] 必須是 https:// 網址`); return s; });
}
function checks(v: unknown): { text: string; done: boolean }[] {
  if (!Array.isArray(v) || v.length > 50) throw new SideFail("checks 必須是最多 50 項的陣列");
  return v.map((x, i) => {
    if (typeof x === "string") return { text: text(x, `checks[${i}]`, 300, true), done: false };
    const o = x as { text?: unknown; done?: unknown };
    return { text: text(o?.text, `checks[${i}].text`, 300, true), done: o?.done === true };
  });
}

function tool(name: string, description: string, properties: Record<string, unknown>, required: string[], readOnly: boolean, destructive = false) {
  return {
    name, description,
    inputSchema: { type: "object", properties: { agent: { type: "string", description: "你是哪個 AI（例如 Claude、Codex、Gemini、ChatGPT），1～40 字。用金鑰連線時可省略，會用金鑰登記的名稱。" }, ...properties }, required, additionalProperties: false },
    annotations: { readOnlyHint: readOnly, destructiveHint: destructive },
  };
}

export const SIDE_TOOLS: any[] = [
  tool("side_overview", "其他 AI 紀錄總覽：未完成的待辦（含勾選進度）、最近的工作日誌，以及用過的專案名稱。開工先呼叫，接手前先看同一專案最近的交接。", { project: { ...S, description: "只看這個專案（選填）" }, limit: { type: "integer", minimum: 1, maximum: 100 } }, [], true),
  tool("side_log_save", "寫一筆工作日誌／交接；帶 id 就是修改那一筆。工作結束時寫：做了什麼、證據、沒完成的、下一步。", {
    id: S, project: { ...S, description: "專案名稱，例如「立之讀書室」，沿用 side_overview 列出的寫法" }, title: S,
    done: { ...S, description: "已完成（可多行）" }, evidence: { ...S, description: "驗證證據：測試結果、commit、PR、截圖說明" },
    not_done: { ...S, description: "未完成或阻礙" }, next_step: { ...S, description: "下一步" },
    links: { type: "array", items: S, maxItems: 20, description: "相關網址（https）" },
  }, [], false),
  tool("side_log_list", "列出工作日誌，可依專案或 AI 篩選。", { project: S, by_agent: { ...S, description: "只看這個 AI 寫的" }, limit: { type: "integer", minimum: 1, maximum: 100 } }, [], true),
  tool("side_todo_save", "建立或修改待辦（帶 id 就是修改）。checks 會整份取代原本的勾選清單；只想勾一項用 side_todo_tick。", {
    id: S, project: S, title: S, status: { type: "string", enum: [...STATUSES], description: "todo 待辦／doing 進行中／blocked 卡住／done 完成" }, note: S,
    checks: { type: "array", maxItems: 50, items: { anyOf: [S, { type: "object", properties: { text: S, done: { type: "boolean" } }, required: ["text"], additionalProperties: false }] } },
    add_checks: { type: "array", items: S, maxItems: 50, description: "在原清單後面加項目" },
  }, [], false),
  tool("side_todo_tick", "勾選或取消勾選待辦裡的一項（index 從 0 開始）。全部勾完不會自動完成，要另外把 status 改 done。", { id: S, index: { type: "integer", minimum: 0 }, done: { type: "boolean" } }, ["id", "index", "done"], false),
  tool("side_todo_list", "列出待辦，可依專案、狀態、AI 篩選；預設不含已完成。", { project: S, status: { type: "string", enum: [...STATUSES] }, by_agent: S, include_done: { type: "boolean" }, limit: { type: "integer", minimum: 1, maximum: 100 } }, [], true),
  tool("side_delete", "刪除一筆工作日誌或待辦。", { kind: { type: "string", enum: ["log", "todo"] }, id: S }, ["kind", "id"], false, true),
];

export const SIDE_INSTRUCTIONS = [
  "「其他 AI 紀錄」：三角色以外的任何 AI 都能用，不需要 role。每次呼叫帶 agent 說明你是誰（用金鑰連線可省略）。",
  "開工先 side_overview；接手同一專案前先看最近的交接。工作結束用 side_log_save 寫交接：done 已完成、evidence 證據、not_done 未完成、next_step 下一步。",
  "待辦用 side_todo_save 建立，side_todo_tick 勾選，完成時把 status 改 done。只寫實際做過、驗證過的事。",
].join("\n");

function agentOf(a: Record<string, unknown>, fixed?: string): string {
  const given = text(a.agent, "agent", 40);
  const agent = given || fixed || "";
  if (!agent) throw new SideFail("缺少 agent：請說明你是哪個 AI（例如 Claude、Codex、Gemini、ChatGPT）");
  return agent;
}
const lim = (v: unknown, d: number) => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 100 ? (v as number) : d);
const filt = (owner: string, a: Record<string, unknown>) => {
  let f = `owner_id=eq.${q(owner)}`;
  const project = text(a.project, "project", 80);
  const by = text(a.by_agent, "by_agent", 40);
  if (project) f += `&project=eq.${q(project)}`;
  if (by) f += `&agent=eq.${q(by)}`;
  return f;
};
const LOG_COLS = "id,agent,project,title,done,evidence,not_done,next_step,links,created_at,updated_at";
const TODO_COLS = "id,agent,project,title,status,note,checks,created_at,updated_at,done_at";

async function getOne(db: Db, table: string, owner: string, id: string, cols: string) {
  const r = await db(`${table}?id=eq.${q(id)}&owner_id=eq.${q(owner)}&select=${cols}`);
  if (r.length !== 1) throw new SideFail("找不到這筆紀錄", 404);
  return r[0];
}
const progress = (t: any) => ({ ...t, checks_done: (t.checks ?? []).filter((c: any) => c.done).length, checks_total: (t.checks ?? []).length });

export async function sideData(db: Db, owner: string, a: Record<string, unknown> = {}) {
  const f = filt(owner, a);
  const n = lim(a.limit, 30);
  const [todos, logs, projects] = await Promise.all([
    db(`aiwb_side_todos?${f}&status=neq.done&select=${TODO_COLS}&order=updated_at.desc&limit=100`),
    db(`aiwb_side_logs?${f}&select=${LOG_COLS}&order=created_at.desc&limit=${n}`),
    db(`aiwb_side_logs?owner_id=eq.${q(owner)}&select=project&order=created_at.desc&limit=500`),
  ]);
  const doneTodos = await db(`aiwb_side_todos?${f}&status=eq.done&select=${TODO_COLS}&order=done_at.desc&limit=20`);
  return { todos: todos.map(progress), done_todos: doneTodos.map(progress), logs, projects: [...new Set(projects.map((p: any) => p.project).filter(Boolean))] };
}

export async function runSideTool(db: Db, name: string, a: Record<string, unknown>, owner: string, fixedAgent?: string): Promise<unknown> {
  const now = new Date().toISOString();
  const post = (table: string, row: unknown) => db(table, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }).then((r: any[]) => r[0]);
  const patch = (table: string, id: string, row: unknown) => db(`${table}?id=eq.${q(id)}&owner_id=eq.${q(owner)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }).then((r: any[]) => r[0]);

  switch (name) {
    case "side_overview": return await sideData(db, owner, a);
    case "side_log_list": return { logs: await db(`aiwb_side_logs?${filt(owner, a)}&select=${LOG_COLS}&order=created_at.desc&limit=${lim(a.limit, 30)}`) };
    case "side_todo_list": {
      let f = filt(owner, a);
      if (a.status) f += `&status=eq.${q(String(a.status))}`; else if (a.include_done !== true) f += "&status=neq.done";
      return { todos: (await db(`aiwb_side_todos?${f}&select=${TODO_COLS}&order=updated_at.desc&limit=${lim(a.limit, 50)}`)).map(progress) };
    }
    case "side_log_save": {
      const agent = agentOf(a, fixedAgent);
      const row: Record<string, unknown> = { updated_at: now };
      for (const [k, max] of [["project", 80], ["title", 200], ["done", 8000], ["evidence", 4000], ["not_done", 4000], ["next_step", 2000]] as const) if (a[k] !== undefined) row[k] = text(a[k], k, max);
      if (a.links !== undefined) row.links = links(a.links);
      if (a.id !== undefined) {
        const id = uuid(a.id, "id");
        await getOne(db, "aiwb_side_logs", owner, id, "id");
        if (row.title === "") throw new SideFail("title 不能是空的");
        return { log: await patch("aiwb_side_logs", id, row) };
      }
      if (!row.title) throw new SideFail("缺少 title");
      return { log: await post("aiwb_side_logs", { owner_id: owner, agent, ...row }) };
    }
    case "side_todo_save": {
      const agent = agentOf(a, fixedAgent);
      const row: Record<string, unknown> = { updated_at: now };
      for (const [k, max] of [["project", 80], ["title", 200], ["note", 4000]] as const) if (a[k] !== undefined) row[k] = text(a[k], k, max);
      if (a.status !== undefined) {
        if (!(STATUSES as readonly string[]).includes(String(a.status))) throw new SideFail(`status 必須是 ${STATUSES.join("／")} 之一`);
        row.status = a.status; row.done_at = a.status === "done" ? now : null;
      }
      let list = a.checks !== undefined ? checks(a.checks) : undefined;
      const add = a.add_checks !== undefined ? checks(a.add_checks) : [];
      if (a.id !== undefined) {
        const id = uuid(a.id, "id");
        const cur = await getOne(db, "aiwb_side_todos", owner, id, TODO_COLS);
        if (row.title === "") throw new SideFail("title 不能是空的");
        if (list || add.length) row.checks = [...(list ?? cur.checks ?? []), ...add];
        if (Array.isArray(row.checks) && row.checks.length > 50) throw new SideFail("勾選項目最多 50 項");
        return { todo: progress(await patch("aiwb_side_todos", id, row)) };
      }
      if (!row.title) throw new SideFail("缺少 title");
      list = [...(list ?? []), ...add];
      if (list.length > 50) throw new SideFail("勾選項目最多 50 項");
      return { todo: progress(await post("aiwb_side_todos", { owner_id: owner, agent, status: "todo", ...row, checks: list })) };
    }
    case "side_todo_tick": {
      const id = uuid(a.id, "id");
      const cur = await getOne(db, "aiwb_side_todos", owner, id, TODO_COLS);
      const i = Number(a.index);
      const list = [...(cur.checks ?? [])];
      if (!Number.isInteger(i) || i < 0 || i >= list.length) throw new SideFail(`index 超出範圍（共 ${list.length} 項，從 0 開始）`);
      list[i] = { ...list[i], done: a.done === true };
      return { todo: progress(await patch("aiwb_side_todos", id, { checks: list, updated_at: now })) };
    }
    case "side_delete": {
      const table = a.kind === "log" ? "aiwb_side_logs" : a.kind === "todo" ? "aiwb_side_todos" : "";
      if (!table) throw new SideFail("kind 必須是 log 或 todo");
      const id = uuid(a.id, "id");
      await getOne(db, table, owner, id, "id");
      await db(`${table}?id=eq.${q(id)}&owner_id=eq.${q(owner)}`, { method: "DELETE" });
      return { deleted: { kind: a.kind, id } };
    }
  }
  throw new SideFail("沒有這個工具：" + name, 404);
}

// ---------- 其他 AI 的專用金鑰（本人在網頁產生／撤銷） ----------
export async function sha256(s: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function createAgentKey(db: Db, owner: string, agentName: unknown) {
  const agent = text(agentName, "agent", 40, true);
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const key = "lza_" + btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const row = await db("aiwb_agent_keys", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ owner_id: owner, agent, key_hash: await sha256(key), key_hint: key.slice(-4) }) }).then((r: any[]) => r[0]);
  return { id: row.id, agent, key, key_hint: row.key_hint };
}
export async function listAgentKeys(db: Db, owner: string) {
  return await db(`aiwb_agent_keys?owner_id=eq.${q(owner)}&select=id,agent,key_hint,created_at,last_used_at,revoked_at&order=created_at.desc`);
}
export async function revokeAgentKey(db: Db, owner: string, id: unknown) {
  const kid = uuid(id, "id");
  await db(`aiwb_agent_keys?id=eq.${q(kid)}&owner_id=eq.${q(owner)}`, { method: "PATCH", body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
  return { ok: true };
}
/** 驗證 lza_ 金鑰，回傳 owner 與 AI 名稱。 */
export async function checkAgentKey(db: Db, token: string) {
  const r = await db(`aiwb_agent_keys?key_hash=eq.${await sha256(token)}&revoked_at=is.null&select=id,owner_id,agent`);
  if (r.length !== 1) throw new SideFail("AI 金鑰無效或已撤銷", 401);
  await db(`aiwb_agent_keys?id=eq.${q(r[0].id)}`, { method: "PATCH", body: JSON.stringify({ last_used_at: new Date().toISOString() }) });
  return { owner: r[0].owner_id as string, agent: r[0].agent as string };
}
