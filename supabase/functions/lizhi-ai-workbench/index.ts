// 立之 AI 工作台 v2 — 專案經理／顧問／工程師三角色協作用
// 工作台只放待辦、勾選與完成狀態；詳細內容在 Google Drive 報告書，這裡只存連結。
//  POST /mcp     ChatGPT 私人 Site 轉接（Bearer lzp_ 工具憑證 + x-lizhi-actor）
//  GET  /board   網頁看板（雲端庫登入 JWT）
//  GET  /task    網頁任務詳情
//  POST /approve 本人批准／退回「待本人批准」任務
//  POST /archive 本人封存／還原專案
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const URL_BASE = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ORIGINS = new Set(["https://lihuany635-create.github.io"]);
const admin = { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" };

const ROLES = ["manager", "advisor", "engineer"] as const;
const ROLE_ZH: Record<string, string> = { manager: "專案經理", advisor: "顧問", engineer: "工程師", user: "本人" };
const STATUSES = ["todo", "doing", "blocked", "review", "done"] as const;
const KINDS = ["dispatch", "analysis", "execution", "blocked", "acceptance"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class Fail extends Error { constructor(msg: string, public status = 400) { super(msg); } }

async function db(path: string, init: RequestInit = {}): Promise<any> {
  const r = await fetch(URL_BASE + "/rest/v1/" + path, { ...init, headers: { ...admin, ...(init.headers ?? {}) } });
  const text = await r.text();
  if (!r.ok) {
    if (r.status === 409 || text.includes("duplicate key")) throw new Fail("資料重複：" + text.slice(0, 160), 409);
    throw new Fail("工作台資料庫錯誤：" + text.slice(0, 200), 503);
  }
  return text ? JSON.parse(text) : null;
}
const q = (v: string) => encodeURIComponent(v);
const insert = (table: string, row: unknown) => db(table, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }).then((r) => r[0]);
const patch = (table: string, filter: string, row: unknown) => db(table + "?" + filter, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
const digest = async (s: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");

// ---------- 驗證工具 ----------
function str(v: unknown, name: string, max: number, required = true): string {
  if (v === undefined || v === null || v === "") { if (required) throw new Fail(`缺少 ${name}`); return ""; }
  if (typeof v !== "string") throw new Fail(`${name} 必須是文字`);
  const s = v.trim();
  if (required && !s) throw new Fail(`缺少 ${name}`);
  if (s.length > max) throw new Fail(`${name} 超過 ${max} 字`);
  return s;
}
function url(v: unknown, name: string, required = true): string | null {
  const s = str(v, name, 2000, required);
  if (!s) return null;
  if (!/^https:\/\/[^\s]+$/.test(s)) throw new Fail(`${name} 必須是 https:// 開頭的網址（例如 Google Drive 報告）`);
  return s;
}
function oneOf<T extends string>(v: unknown, list: readonly T[], name: string): T {
  if (typeof v !== "string" || !(list as readonly string[]).includes(v)) throw new Fail(`${name} 必須是 ${list.join("／")} 之一`);
  return v as T;
}
function id(v: unknown, name: string): string {
  if (typeof v !== "string" || !UUID.test(v)) throw new Fail(`${name} 格式錯誤（應為 UUID，可先用 aiwb_list_tasks 查）`);
  return v;
}

// ---------- 資料存取 ----------
async function log(owner: string, actor: string, action: string, detail: Record<string, unknown>, projectId?: string | null, taskId?: string | null) {
  await insert("aiwb_events", { owner_id: owner, actor, action, detail, project_id: projectId ?? null, task_id: taskId ?? null });
}
async function getProject(owner: string, projectId: string) {
  const r = await db(`aiwb_projects?id=eq.${q(projectId)}&owner_id=eq.${q(owner)}&select=*`);
  if (r.length !== 1) throw new Fail("找不到專案", 404);
  return r[0];
}
async function getTask(owner: string, taskId: string) {
  const r = await db(`aiwb_tasks?id=eq.${q(taskId)}&owner_id=eq.${q(owner)}&select=*`);
  if (r.length !== 1) throw new Fail("找不到任務", 404);
  return r[0];
}
async function taskDetail(owner: string, taskId: string, events = 30) {
  const task = await getTask(owner, taskId);
  const [project, checks, reports, notices, log] = await Promise.all([
    getProject(owner, task.project_id),
    db(`aiwb_checks?task_id=eq.${q(taskId)}&owner_id=eq.${q(owner)}&select=id,position,text,checked,evidence_url,checked_by,checked_at&order=position`),
    db(`aiwb_reports?task_id=eq.${q(taskId)}&owner_id=eq.${q(owner)}&select=id,role,kind,title,version,url,created_at&order=created_at`),
    db(`aiwb_notices?task_id=eq.${q(taskId)}&owner_id=eq.${q(owner)}&select=id,from_role,to_role,next_step,report_id,status,created_at,read_at&order=created_at.desc&limit=20`),
    db(`aiwb_events?task_id=eq.${q(taskId)}&owner_id=eq.${q(owner)}&select=actor,action,detail,at&order=at.desc&limit=${events}`),
  ]);
  return { task, project: { id: project.id, title: project.title, drive_folder_url: project.drive_folder_url }, checks, reports, notices, events: log };
}
function blockersForDone(t: any, checks: any[], reports: any[]): string[] {
  const out: string[] = [];
  if (!reports.some((r) => r.kind === "acceptance")) out.push("尚未掛上專案經理的驗收報告（attach_report kind=acceptance）");
  const open = checks.filter((c) => !c.checked);
  if (open.length) out.push(`還有 ${open.length} 個勾選項未完成`);
  if (t.needs_approval && !t.approved_at) out.push("此任務需要本人批准，本人尚未在網頁按批准");
  return out;
}

// ---------- MCP 工具 ----------
type Ctx = { owner: string; role: string; actor: string };
const roleProp = { type: "string", enum: [...ROLES], description: "你這次的角色：manager 專案經理／advisor 顧問／engineer 工程師。依你所在的 ChatGPT 專案自行判斷。" };
const S = { type: "string" };
function tool(name: string, description: string, properties: Record<string, unknown>, required: string[], readOnly: boolean) {
  return { name, description, inputSchema: { type: "object", properties: { role: roleProp, ...properties }, required: ["role", ...required], additionalProperties: false }, annotations: { readOnlyHint: readOnly, destructiveHint: false } };
}
const TOOLS = [
  tool("aiwb_overview", "總覽：所有進行中專案、每個專案的任務進度，以及寄給你這個角色的未讀通知與指派給你的待辦。每次開工先呼叫。", {}, [], true),
  tool("aiwb_save_project", "（限專案經理）建立或更新專案。只放專案名稱、目標、Drive 報告資料夾連結；詳細規劃寫在 Drive。", { project_id: S, title: S, goal: S, drive_folder_url: S }, ["title"], false),
  tool("aiwb_list_tasks", "列出任務（可依專案、狀態、負責角色篩選），含勾選進度。預設不含已完成。", { project_id: S, status: { type: "string", enum: [...STATUSES] }, assignee: { type: "string", enum: [...ROLES, "user"] }, include_done: { type: "boolean" } }, [], true),
  tool("aiwb_get_task", "讀取單一任務：勾選清單、報告連結、通知與最近紀錄。接手任務前必讀。", { task_id: S }, ["task_id"], true),
  tool("aiwb_create_task", "（限專案經理）建立任務，系統自動編號 TASK-001。可一次帶入檢查清單。涉及正式部署、費用、授權或重大決策時設 needs_approval=true。", {
    project_id: S, title: S, assignee: { type: "string", enum: [...ROLES, "user"] }, next_step: S,
    checks: { type: "array", items: S, maxItems: 30, description: "檢查清單項目（每項一句）" },
    needs_approval: { type: "boolean" }, approval_reason: S,
  }, ["project_id", "title", "assignee"], false),
  tool("aiwb_update_task", "更新任務：改負責角色、狀態、下一步，或新增勾選項。狀態 done 只有專案經理能設，且必須已有驗收報告、全部勾選完成、需批准者已獲本人批准。已完成的任務要先由經理改回其他狀態才能再修改。", {
    task_id: S, assignee: { type: "string", enum: [...ROLES, "user"] }, status: { type: "string", enum: [...STATUSES] }, next_step: S,
    add_checks: { type: "array", items: S, maxItems: 30 }, needs_approval: { type: "boolean" }, approval_reason: S,
  }, ["task_id"], false),
  tool("aiwb_tick_check", "勾選或取消勾選一個檢查項。打勾時必須附上證據網址（Drive 報告、PR、截圖等 https 連結），沒有證據不能打勾。", { check_id: S, checked: { type: "boolean" }, evidence_url: S }, ["check_id", "checked"], false),
  tool("aiwb_attach_report", "把已存到 Google Drive 的報告書連結掛到任務上（只存連結，不存內文）。kind：dispatch 派工／analysis 分析／execution 執行／blocked 阻礙／acceptance 驗收（限經理）。", {
    task_id: S, kind: { type: "string", enum: [...KINDS] }, title: S, url: S, version: S,
  }, ["task_id", "kind", "title", "url"], false),
  tool("aiwb_notify", "通知下一位角色：只送收件者、任務、報告與下一步，收件者自行打開報告才算已讀。dedupe_key 相同的通知只會送一次。", {
    task_id: S, to_role: { type: "string", enum: [...ROLES, "user"] }, next_step: S, report_id: S, dedupe_key: S,
  }, ["task_id", "to_role", "next_step", "dedupe_key"], false),
  tool("aiwb_inbox", "讀取寄給你這個角色的通知。實際打開報告後，再用 ack_ids 標記已讀。", { ack_ids: { type: "array", items: S, maxItems: 50 }, include_read: { type: "boolean" } }, [], false),
];
const INSTRUCTIONS = [
  "立之 AI 工作台 v2：三角色（專案經理／顧問／工程師）協作。工作台只放待辦、勾選與完成狀態；詳細過程、測試結果與交接一律寫成 Google Drive 報告書，這裡只掛連結。",
  "每次呼叫都要帶 role，依你所在的 ChatGPT 專案判斷自己的角色。開工先 aiwb_overview，接手任務先 aiwb_get_task 並實際打開相關報告。",
  "流程：經理 create_task + 派工報告 → notify 顧問/工程師 → 對方寫報告、attach_report、tick_check（必附證據網址）→ notify 經理 → 經理驗收報告後 update_task status=done。",
  "卡住：保留任務、寫阻礙報告（kind=blocked）、status=blocked、通知經理。牽涉正式部署、費用、授權的任務要 needs_approval=true，等本人在網頁批准。",
  "紀錄不可刪除；模擬或未驗證的結果不可打勾；收到通知但未打開報告不可 ack。",
].join("\n");

async function runTool(name: string, a: Record<string, unknown>, ownerId: string): Promise<unknown> {
  const role = oneOf(a.role, ROLES, "role");
  const c: Ctx = { owner: ownerId, role, actor: role };
  const managerOnly = (what: string) => { if (role !== "manager") throw new Fail(`只有專案經理可以${what}`, 403); };

  switch (name) {
    case "aiwb_overview": {
      const [projects, tasks, checks, inbox] = await Promise.all([
        db(`aiwb_projects?owner_id=eq.${q(c.owner)}&archived=eq.false&select=id,title,goal,drive_folder_url,updated_at&order=updated_at.desc`),
        db(`aiwb_tasks?owner_id=eq.${q(c.owner)}&select=id,project_id,code,title,assignee,status,next_step,needs_approval,approved_at,updated_at&order=updated_at.desc&limit=500`),
        db(`aiwb_checks?owner_id=eq.${q(c.owner)}&select=task_id,checked&limit=5000`),
        db(`aiwb_notices?owner_id=eq.${q(c.owner)}&to_role=eq.${role}&status=eq.sent&select=id,task_id,from_role,next_step,report_id,created_at&order=created_at`),
      ]);
      const prog: Record<string, [number, number]> = {};
      for (const k of checks) { const p = (prog[k.task_id] ??= [0, 0]); p[1]++; if (k.checked) p[0]++; }
      const live = new Set(projects.map((p: any) => p.id));
      const open = tasks.filter((t: any) => live.has(t.project_id));
      return {
        projects: projects.map((p: any) => {
          const ts = open.filter((t: any) => t.project_id === p.id);
          const count = (s: string) => ts.filter((t: any) => t.status === s).length;
          return { ...p, tasks: { todo: count("todo"), doing: count("doing"), blocked: count("blocked"), review: count("review"), done: count("done") } };
        }),
        my_tasks: open.filter((t: any) => t.assignee === role && t.status !== "done").map((t: any) => ({ ...t, checks: prog[t.id] ? `${prog[t.id][0]}/${prog[t.id][1]}` : "0/0" })),
        inbox,
        waiting_user_approval: open.filter((t: any) => t.needs_approval && !t.approved_at && t.status !== "done").map((t: any) => ({ id: t.id, code: t.code, title: t.title })),
      };
    }
    case "aiwb_save_project": {
      managerOnly("建立或修改專案");
      const row = { title: str(a.title, "title", 120), goal: str(a.goal, "goal", 2000, false), drive_folder_url: url(a.drive_folder_url, "drive_folder_url", false) };
      if (a.project_id) {
        const p = await getProject(c.owner, id(a.project_id, "project_id"));
        const r = await patch("aiwb_projects", `id=eq.${q(p.id)}&owner_id=eq.${q(c.owner)}`, { ...row, updated_at: new Date().toISOString() });
        await log(c.owner, c.actor, "update_project", row, p.id);
        return r[0];
      }
      const p = await insert("aiwb_projects", { ...row, owner_id: c.owner });
      await log(c.owner, c.actor, "create_project", row, p.id);
      return p;
    }
    case "aiwb_list_tasks": {
      let filter = `owner_id=eq.${q(c.owner)}`;
      if (a.project_id) filter += `&project_id=eq.${q(id(a.project_id, "project_id"))}`;
      if (a.status) filter += `&status=eq.${oneOf(a.status, STATUSES, "status")}`;
      else if (!a.include_done) filter += `&status=neq.done`;
      if (a.assignee) filter += `&assignee=eq.${oneOf(a.assignee, [...ROLES, "user"] as const, "assignee")}`;
      const tasks = await db(`aiwb_tasks?${filter}&select=id,project_id,code,title,assignee,status,next_step,needs_approval,approved_at,updated_at&order=updated_at.desc&limit=200`);
      if (!tasks.length) return { tasks: [] };
      const checks = await db(`aiwb_checks?owner_id=eq.${q(c.owner)}&task_id=in.(${tasks.map((t: any) => t.id).join(",")})&select=task_id,checked`);
      return { tasks: tasks.map((t: any) => { const cs = checks.filter((k: any) => k.task_id === t.id); return { ...t, checks: `${cs.filter((k: any) => k.checked).length}/${cs.length}` }; }) };
    }
    case "aiwb_get_task":
      return await taskDetail(c.owner, id(a.task_id, "task_id"));
    case "aiwb_create_task": {
      managerOnly("建立任務");
      const p = await getProject(c.owner, id(a.project_id, "project_id"));
      if (p.archived) throw new Fail("專案已封存");
      const items = Array.isArray(a.checks) ? a.checks.map((x, i) => str(x, `checks[${i}]`, 300)) : [];
      if (items.length > 30) throw new Fail("檢查清單最多 30 項");
      const needs = a.needs_approval === true;
      const code = await db("rpc/aiwb_next_task_code", { method: "POST", body: JSON.stringify({ p_project: p.id, p_owner: c.owner }) });
      const t = await insert("aiwb_tasks", {
        owner_id: c.owner, project_id: p.id, code, title: str(a.title, "title", 200), assignee: oneOf(a.assignee, [...ROLES, "user"] as const, "assignee"),
        next_step: str(a.next_step, "next_step", 1000, false), needs_approval: needs, approval_reason: needs ? str(a.approval_reason, "approval_reason", 1000) : "", created_by: c.actor,
      });
      if (items.length) await db("aiwb_checks", { method: "POST", body: JSON.stringify(items.map((text, i) => ({ owner_id: c.owner, task_id: t.id, position: i + 1, text, created_by: c.actor }))) });
      await log(c.owner, c.actor, "create_task", { code, title: t.title, assignee: t.assignee, checks: items.length, needs_approval: needs }, p.id, t.id);
      return await taskDetail(c.owner, t.id, 5);
    }
    case "aiwb_update_task": {
      const t = await getTask(c.owner, id(a.task_id, "task_id"));
      const change: Record<string, unknown> = {};
      if (a.status !== undefined) change.status = oneOf(a.status, STATUSES, "status");
      if (t.status === "done" && !(role === "manager" && change.status && change.status !== "done")) throw new Fail("任務已完成；需由專案經理先把狀態改回其他狀態才能修改", 409);
      if (a.assignee !== undefined) change.assignee = oneOf(a.assignee, [...ROLES, "user"] as const, "assignee");
      if (a.next_step !== undefined) change.next_step = str(a.next_step, "next_step", 1000, false);
      if (a.needs_approval !== undefined) {
        if (a.needs_approval === false && t.needs_approval && role !== "manager") throw new Fail("只有專案經理可以取消『需本人批准』", 403);
        change.needs_approval = a.needs_approval === true;
        if (change.needs_approval) change.approval_reason = str(a.approval_reason, "approval_reason", 1000);
        if (change.needs_approval && !t.needs_approval) change.approved_at = null;
      }
      const add = Array.isArray(a.add_checks) ? a.add_checks.map((x, i) => str(x, `add_checks[${i}]`, 300)) : [];
      if (change.status === "done") {
        if (role !== "manager") throw new Fail("只有專案經理可以把任務標為完成", 403);
        if (add.length) throw new Fail("要標完成時不能同時新增勾選項");
        const [checks, reports] = await Promise.all([
          db(`aiwb_checks?task_id=eq.${q(t.id)}&select=checked`), db(`aiwb_reports?task_id=eq.${q(t.id)}&select=kind`),
        ]);
        const b = blockersForDone({ ...t, ...change }, checks, reports);
        if (b.length) throw new Fail("還不能標完成：" + b.join("；"), 409);
      }
      if (!Object.keys(change).length && !add.length) throw new Fail("沒有要更新的內容");
      if (Object.keys(change).length) await patch("aiwb_tasks", `id=eq.${q(t.id)}&owner_id=eq.${q(c.owner)}`, { ...change, updated_at: new Date().toISOString() });
      if (add.length) {
        const last = await db(`aiwb_checks?task_id=eq.${q(t.id)}&select=position&order=position.desc&limit=1`);
        const start = last[0]?.position ?? 0;
        await db("aiwb_checks", { method: "POST", body: JSON.stringify(add.map((text, i) => ({ owner_id: c.owner, task_id: t.id, position: start + i + 1, text, created_by: c.actor }))) });
        if (!Object.keys(change).length) await patch("aiwb_tasks", `id=eq.${q(t.id)}`, { updated_at: new Date().toISOString() });
      }
      await log(c.owner, c.actor, "update_task", { ...change, add_checks: add }, t.project_id, t.id);
      return await taskDetail(c.owner, t.id, 5);
    }
    case "aiwb_tick_check": {
      const checkId = id(a.check_id, "check_id");
      const r = await db(`aiwb_checks?id=eq.${q(checkId)}&owner_id=eq.${q(c.owner)}&select=*`);
      if (r.length !== 1) throw new Fail("找不到勾選項", 404);
      const t = await getTask(c.owner, r[0].task_id);
      if (t.status === "done") throw new Fail("任務已完成，不能再改勾選；需由經理先重開任務", 409);
      if (typeof a.checked !== "boolean") throw new Fail("checked 必須是 true 或 false");
      const row = a.checked
        ? { checked: true, evidence_url: url(a.evidence_url, "evidence_url"), checked_by: c.actor, checked_at: new Date().toISOString() }
        : { checked: false, evidence_url: null, checked_by: c.actor, checked_at: new Date().toISOString() };
      await patch("aiwb_checks", `id=eq.${q(checkId)}`, row);
      await patch("aiwb_tasks", `id=eq.${q(t.id)}`, { updated_at: new Date().toISOString() });
      await log(c.owner, c.actor, a.checked ? "tick_check" : "untick_check", { text: r[0].text, evidence_url: row.evidence_url }, t.project_id, t.id);
      return await taskDetail(c.owner, t.id, 5);
    }
    case "aiwb_attach_report": {
      const t = await getTask(c.owner, id(a.task_id, "task_id"));
      const kind = oneOf(a.kind, KINDS, "kind");
      if (kind === "acceptance" && role !== "manager") throw new Fail("驗收報告只能由專案經理掛上", 403);
      const rep = await insert("aiwb_reports", { owner_id: c.owner, task_id: t.id, role, kind, title: str(a.title, "title", 200), url: url(a.url, "url"), version: str(a.version, "version", 20, false) || "v1" });
      await patch("aiwb_tasks", `id=eq.${q(t.id)}`, { updated_at: new Date().toISOString() });
      await log(c.owner, c.actor, "attach_report", { kind, title: rep.title, version: rep.version, url: rep.url }, t.project_id, t.id);
      return rep;
    }
    case "aiwb_notify": {
      const t = await getTask(c.owner, id(a.task_id, "task_id"));
      const key = str(a.dedupe_key, "dedupe_key", 120);
      const existing = await db(`aiwb_notices?owner_id=eq.${q(c.owner)}&dedupe_key=eq.${q(key)}&select=*`);
      if (existing.length) return { duplicate: true, notice: existing[0], message: "相同 dedupe_key 的通知已送過，未重複送出" };
      let reportId: string | null = null;
      if (a.report_id) {
        reportId = id(a.report_id, "report_id");
        const r = await db(`aiwb_reports?id=eq.${q(reportId)}&task_id=eq.${q(t.id)}&select=id`);
        if (r.length !== 1) throw new Fail("report_id 不屬於這個任務", 404);
      }
      const n = await insert("aiwb_notices", { owner_id: c.owner, task_id: t.id, report_id: reportId, from_role: role, to_role: oneOf(a.to_role, [...ROLES, "user"] as const, "to_role"), next_step: str(a.next_step, "next_step", 500), dedupe_key: key });
      await log(c.owner, c.actor, "notify", { to_role: n.to_role, next_step: n.next_step, report_id: reportId }, t.project_id, t.id);
      return { duplicate: false, notice: n };
    }
    case "aiwb_inbox": {
      const acks = Array.isArray(a.ack_ids) ? a.ack_ids.map((x, i) => id(x, `ack_ids[${i}]`)) : [];
      let acked = 0;
      if (acks.length) {
        const done = await patch("aiwb_notices", `owner_id=eq.${q(c.owner)}&to_role=eq.${role}&status=eq.sent&id=in.(${acks.join(",")})`, { status: "read", read_at: new Date().toISOString() });
        for (const n of done) await log(c.owner, c.actor, "ack_notice", { notice_id: n.id }, null, n.task_id);
        acked = done.length;
      }
      const notices = await db(`aiwb_notices?owner_id=eq.${q(c.owner)}&to_role=eq.${role}${a.include_read ? "" : "&status=eq.sent"}&select=id,task_id,report_id,from_role,next_step,status,created_at,read_at&order=created_at.desc&limit=50`);
      const taskIds = [...new Set(notices.map((n: any) => n.task_id))];
      const reportIds = [...new Set(notices.map((n: any) => n.report_id).filter(Boolean))];
      const [tasks, reports] = await Promise.all([
        taskIds.length ? db(`aiwb_tasks?id=in.(${taskIds.join(",")})&select=id,code,title,status`) : [],
        reportIds.length ? db(`aiwb_reports?id=in.(${reportIds.join(",")})&select=id,title,version,url`) : [],
      ]);
      return { acknowledged: acked, notices: notices.map((n: any) => ({ ...n, task: tasks.find((t: any) => t.id === n.task_id), report: reports.find((r: any) => r.id === n.report_id) ?? null })) };
    }
  }
  throw new Fail("未知的工具：" + name, 404);
}

async function handleMcp(body: any, owner: string) {
  const rpcId = body?.id ?? null;
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: rpcId, result });
  const method = body?.method;
  if (method === "initialize") return reply({ protocolVersion: body?.params?.protocolVersion ?? "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "lizhi-ai-workbench", version: "2.0.0" }, instructions: INSTRUCTIONS });
  if (method === "notifications/initialized" || method === "ping") return reply({});
  if (method === "tools/list") return reply({ tools: TOOLS });
  if (method !== "tools/call") return { jsonrpc: "2.0", id: rpcId, error: { code: -32601, message: "Method not found" } };
  const name = String(body?.params?.name ?? "");
  try {
    const result = await runTool(name, body?.params?.arguments ?? {}, owner);
    return reply({ content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
  } catch (e) {
    const msg = e instanceof Fail ? e.message : "工作台暫時無法處理：" + String((e as Error)?.message ?? e).slice(0, 200);
    return reply({ content: [{ type: "text", text: msg }], isError: true });
  }
}

// ---------- 網頁 ----------
async function board(owner: string) {
  const [projects, tasks, checks, reports, notices, events] = await Promise.all([
    db(`aiwb_projects?owner_id=eq.${q(owner)}&select=id,title,goal,drive_folder_url,archived,updated_at&order=updated_at.desc`),
    db(`aiwb_tasks?owner_id=eq.${q(owner)}&select=id,project_id,code,title,assignee,status,next_step,needs_approval,approval_reason,approved_at,updated_at&order=updated_at.desc&limit=1000`),
    db(`aiwb_checks?owner_id=eq.${q(owner)}&select=task_id,checked&limit=10000`),
    db(`aiwb_reports?owner_id=eq.${q(owner)}&select=task_id&limit=10000`),
    db(`aiwb_notices?owner_id=eq.${q(owner)}&to_role=eq.user&status=eq.sent&select=id,task_id,from_role,next_step,created_at&order=created_at.desc`),
    db(`aiwb_events?owner_id=eq.${q(owner)}&select=actor,action,detail,task_id,at&order=at.desc&limit=30`),
  ]);
  const prog: Record<string, [number, number]> = {}, reps: Record<string, number> = {};
  for (const k of checks) { const p = (prog[k.task_id] ??= [0, 0]); p[1]++; if (k.checked) p[0]++; }
  for (const r of reports) reps[r.task_id] = (reps[r.task_id] ?? 0) + 1;
  return { projects, tasks: tasks.map((t: any) => ({ ...t, checks_done: prog[t.id]?.[0] ?? 0, checks_total: prog[t.id]?.[1] ?? 0, reports: reps[t.id] ?? 0 })), notices, events };
}

async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Origin" };
  if (origin && ORIGINS.has(origin)) Object.assign(headers, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  try {
    if (origin && !ORIGINS.has(origin)) throw new Fail("來源驗證失敗", 403);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const part = new URL(req.url).pathname.split("/").filter(Boolean).at(-1);
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "";
    if (!token || token.length > 5000) throw new Fail("請先登入立之雲端庫", 401);

    if (part === "mcp") {
      if (origin || !token.startsWith("lzp_")) throw new Fail("此介面僅供已授權的 AI 工具使用", 403);
      const keys = await db(`lizhi_production_ai_keys?key_hash=eq.${await digest(token)}&select=owner_id,chatgpt_owner`);
      if (keys.length !== 1) throw new Fail("工具憑證無效", 401);
      const actor = req.headers.get("x-lizhi-actor") ?? "";
      if (!actor || actor !== keys[0].chatgpt_owner) throw new Fail("此 ChatGPT 帳號尚未連接工作台", 403);
      const text = await req.text();
      if (text.length > 200_000) throw new Fail("請求過大", 413);
      return json(await handleMcp(JSON.parse(text || "{}"), keys[0].owner_id));
    }

    if (token.startsWith("lzp_")) throw new Fail("工具憑證不可用於網頁介面", 403);
    const u = await fetch(URL_BASE + "/auth/v1/user", { headers: { apikey: SERVICE, Authorization: "Bearer " + token } });
    if (!u.ok) throw new Fail("登入已失效，請重新登入雲端庫", 401);
    const user = await u.json() as { id?: string; email?: string; is_anonymous?: boolean };
    if (!user.id || !user.email || user.is_anonymous) throw new Fail("需要已核准的雲端庫帳號", 403);
    const owner = user.id, who = "user";

    if (part === "board" && req.method === "GET") return json(await board(owner));
    if (part === "task" && req.method === "GET") return json(await taskDetail(owner, id(new URL(req.url).searchParams.get("id"), "id"), 50));
    if (req.method !== "POST") throw new Fail("不支援的方法", 405);
    const b = await req.json().catch(() => ({}));
    if (part === "approve") {
      const t = await getTask(owner, id(b.task_id, "task_id"));
      if (!t.needs_approval) throw new Fail("這個任務不需要批准");
      const note = str(b.note, "note", 1000, false);
      if (b.approve === true) await patch("aiwb_tasks", `id=eq.${q(t.id)}`, { approved_at: new Date().toISOString(), approval_note: note, updated_at: new Date().toISOString() });
      else if (b.approve === false) await patch("aiwb_tasks", `id=eq.${q(t.id)}`, { approved_at: null, approval_note: note || "本人退回", status: t.status === "done" ? t.status : "blocked", updated_at: new Date().toISOString() });
      else throw new Fail("approve 必須是 true 或 false");
      await log(owner, who, b.approve ? "user_approve" : "user_reject", { note }, t.project_id, t.id);
      return json(await taskDetail(owner, t.id, 50));
    }
    if (part === "ack") {
      const ids = Array.isArray(b.ids) ? b.ids.map((x: unknown, i: number) => id(x, `ids[${i}]`)) : [];
      if (ids.length) await patch("aiwb_notices", `owner_id=eq.${q(owner)}&to_role=eq.user&id=in.(${ids.join(",")})`, { status: "read", read_at: new Date().toISOString() });
      return json({ ok: true });
    }
    if (part === "archive") {
      const p = await getProject(owner, id(b.project_id, "project_id"));
      await patch("aiwb_projects", `id=eq.${q(p.id)}`, { archived: b.archived === true, updated_at: new Date().toISOString() });
      await log(owner, who, b.archived ? "archive_project" : "unarchive_project", {}, p.id);
      return json({ ok: true });
    }
    throw new Fail("找不到此介面", 404);
  } catch (e) {
    const status = e instanceof Fail ? e.status : 500;
    return json({ error: e instanceof Fail ? e.message : "工作台暫時無法使用" }, status);
  }
}

Deno.serve(handler);
