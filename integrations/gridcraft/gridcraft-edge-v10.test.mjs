// Node >= 23.6 (type stripping): node --test integrations/gridcraft/gridcraft-edge-v10.test.mjs
// Mock PostgREST only; no production URL, key or workbook is used.
import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createHandler, formulaGuard} from "./gridcraft-edge-v10-readonly-candidate.ts";

const SECRET = "a".repeat(64);
const OWNER = "gridcraft-owner-test-0001";
const base = {siteSecretSha256: createHash("sha256").update(SECRET).digest("hex"), owner: OWNER,
  enabled: true, pairingEnabled: false, p4Enabled: false, dbUrl: "https://mock.supabase.co", serviceKey: "k"};

function mockDb() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const u = new URL(url); calls.push({path: u.pathname + u.search, method: init.method, body: init.body && JSON.parse(init.body)});
    let out = null;
    if (u.pathname.endsWith("/lz_gridcraft_devices")) out = [{device_id: "dev-1", last_status: "READY", last_seen: new Date().toISOString()}];
    else if (u.pathname.endsWith("/lz_gridcraft_jobs") && init.method === "GET") out = [{state: "completed", result: {ok: true}}];
    else if (u.pathname.endsWith("/lz_gridcraft_jobs")) out = [{}];
    return new Response(JSON.stringify(out), {status: 200});
  };
  return {calls, fetchImpl};
}

async function call(config, name, args, auth = SECRET) {
  const m = mockDb();
  const handler = createHandler({...config, fetchImpl: m.fetchImpl});
  const res = await handler(new Request("https://x.supabase.co/functions/v1/lizhi-gridcraft-bridge/site/dispatch", {
    method: "POST", headers: {"x-lizhi-gridcraft-actor": OWNER, "x-lizhi-gridcraft-bridge": auth},
    body: JSON.stringify({jsonrpc: "2.0", id: 7, method: "tools/call",
      params: {name, arguments: args, requestId: crypto.randomUUID()}})}));
  const queued = m.calls.find(c => c.method === "POST" && c.path.endsWith("/lz_gridcraft_jobs"));
  return {status: res.status, body: await res.json(), queued: queued?.body};
}

test("gate OFF: v9 behaviour kept, new tools and mode refused before any queue", async () => {
  let r = await call(base, "gridcraft_inspect_workbook", {doc: "42"});
  assert.deepEqual([r.status, r.body.error, r.queued], [400, "METHOD_DENIED", undefined]);
  r = await call(base, "gridcraft_evaluate_formula", {doc: "42", formula: "=1"});
  assert.equal(r.body.error, "METHOD_DENIED");
  r = await call(base, "gridcraft_read_range", {doc: "42", sheet: "S", range: "A1", mode: "formulas"});
  assert.deepEqual([r.body.error, r.queued], ["BAD_ARGS", undefined]);
  r = await call(base, "gridcraft_read_range", {doc: "42", sheet: "S", range: "A1:B2"});
  assert.equal(r.status, 200);
  assert.deepEqual(r.queued.arguments, {doc: "42", sheet: "S", range: "A1:B2"});
});

const on = {...base, readonlyV055Enabled: true};

test("gate ON: inspect and evaluate queue only bounded arguments", async () => {
  let r = await call(on, "gridcraft_inspect_workbook", {doc: "42"});
  assert.deepEqual([r.status, r.queued.tool, r.queued.arguments], [200, "gridcraft_inspect_workbook", {doc: "42"}]);
  r = await call(on, "gridcraft_evaluate_formula", {doc: "42", formula: "=SUM(C5:C10)", cell: "H20"});
  assert.deepEqual(r.queued.arguments, {doc: "42", formula: "=SUM(C5:C10)", cell: "H20"});
  r = await call(on, "gridcraft_read_range", {doc: "42", sheet: "S", range: "A1", mode: "formatted"});
  assert.deepEqual(r.queued.arguments, {doc: "42", sheet: "S", range: "A1", mode: "formatted"});
});

test("gate ON: unsafe input refused without a job row", async () => {
  for (const [name, args, code] of [
    ["gridcraft_evaluate_formula", {doc: "42", formula: '=CELL("filename")'}, "FORMULA_FUNCTION_DENIED"],
    ["gridcraft_evaluate_formula", {doc: "42", formula: "=[b.xlsx]S!A1"}, "FORMULA_EXTERNAL_DENIED"],
    ["gridcraft_evaluate_formula", {doc: "42", formula: "SUM(A1)"}, "FORMULA_INVALID"],
    ["gridcraft_evaluate_formula", {doc: "42", formula: "=1", path: "C:/x"}, "BAD_ARGS"],
    ["gridcraft_inspect_workbook", {doc: "0"}, "BAD_ARGS"],
    ["gridcraft_inspect_workbook", {}, "BAD_ARGS"],
    ["gridcraft_read_range", {doc: "42", sheet: "S", range: "A1", mode: "raw"}, "BAD_ARGS"],
    ["gridcraft_read_range", {doc: "42", sheet: "S", range: "A1:Z99", mode: "formulas"}, "RANGE_LIMIT"],
  ]) {
    const r = await call(on, name, args);
    assert.deepEqual([r.status, r.body.error, r.queued], [400, code, undefined], name + JSON.stringify(args));
  }
});

test("site secret still required", async () => {
  const r = await call(on, "gridcraft_inspect_workbook", {doc: "42"}, "b".repeat(64));
  assert.deepEqual([r.status, r.body.error], [401, "UNAUTHORIZED"]);
});

test("formula guard matches agent deny-list", () => {
  for (const f of ['=INFO("x")', "=_xlfn.WEBSERVICE(A1)", "=cubevalue(1)", "=INDIRECT(A1)"])
    assert.throws(() => formulaGuard(f), /FORMULA_FUNCTION_DENIED/);
  assert.equal(formulaGuard("=XLOOKUP(A1,B:B,C:C)"), "=XLOOKUP(A1,B:B,C:C)");
});
