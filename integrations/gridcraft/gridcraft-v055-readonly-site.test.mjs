// node --test integrations/gridcraft/gridcraft-v055-readonly-site.test.mjs  (mock fetch only)
import test from "node:test";
import assert from "node:assert/strict";
import {V055_READONLY_TOOLS, V055_READ_RANGE_TOOL, validateV055Call, callV055FromPrivateSite, formulaGuard}
  from "../../sites-migration/ai-workbench/gridcraft-v055-readonly-addon.mjs";
import {formulaGuard as edgeGuard} from "./gridcraft-edge-v10-readonly-candidate.ts";

const P = "owner-principal-01", SECRET = "c".repeat(64);
const ok = (sent) => async (url, init) => { sent.push({url, body: JSON.parse(init.body), headers: init.headers});
  return new Response(JSON.stringify({jsonrpc: "2.0", id: 1, result: {content: [], isError: false}}), {status: 200}); };

test("tools are read-only and schemas are closed", () => {
  for (const t of [...V055_READONLY_TOOLS, V055_READ_RANGE_TOOL]) {
    assert.equal(t.annotations.readOnlyHint, true);
    assert.equal(t.inputSchema.additionalProperties, false);
  }
  assert.deepEqual(V055_READONLY_TOOLS.map(t => t.name), ["gridcraft_inspect_workbook", "gridcraft_evaluate_formula"]);
});

test("gate OFF and identity checks fail closed before network", async () => {
  const sent = [];
  const base = {rpcId: 1, name: "gridcraft_inspect_workbook", args: {doc: "42"}, verifiedPrincipal: P,
    expectedPrincipal: P, bridgeSecret: SECRET, fetchImpl: ok(sent)};
  await assert.rejects(callV055FromPrivateSite(base), /V055_READONLY_GATE_OFF/);
  await assert.rejects(callV055FromPrivateSite({...base, readonlyV055Enabled: true, verifiedPrincipal: "someone-else"}), /UNAUTHORIZED/);
  await assert.rejects(callV055FromPrivateSite({...base, readonlyV055Enabled: true, bridgeSecret: "short"}), /BRIDGE_NOT_CONFIGURED/);
  assert.equal(sent.length, 0);
});

test("valid calls forward only validated arguments", async () => {
  const sent = [];
  const base = {rpcId: 1, verifiedPrincipal: P, expectedPrincipal: P, bridgeSecret: SECRET,
    readonlyV055Enabled: true, fetchImpl: ok(sent)};
  await callV055FromPrivateSite({...base, name: "gridcraft_evaluate_formula", args: {doc: "42", formula: "=SUM(A1:A3)"}});
  await callV055FromPrivateSite({...base, name: "gridcraft_read_range", args: {doc: "42", sheet: "S", range: "A1", mode: "formulas"}});
  await callV055FromPrivateSite({...base, name: "gridcraft_read_range", args: {doc: "42", sheet: "S", range: "A1", mode: "values"}});
  assert.deepEqual(sent.map(s => s.body.params.arguments), [
    {doc: "42", formula: "=SUM(A1:A3)"},
    {doc: "42", sheet: "S", range: "A1", mode: "formulas"},
    {doc: "42", sheet: "S", range: "A1"}]);
  assert.equal(sent[0].headers["x-lizhi-gridcraft-actor"], P);
});

test("unsafe arguments refused", () => {
  for (const [n, a, e] of [
    ["gridcraft_evaluate_formula", {doc: "42", formula: '=CELL("filename")'}, /FORMULA_FUNCTION_DENIED/],
    ["gridcraft_evaluate_formula", {doc: "42", formula: "='C:\\a\\[b.xlsx]S'!A1"}, /FORMULA_EXTERNAL_DENIED/],
    ["gridcraft_evaluate_formula", {doc: "42", formula: "=1", cell: "A1:B2"}, /INVALID_CELL/],
    ["gridcraft_inspect_workbook", {doc: "42", sheet: "x"}, /INVALID_ARGS/],
    ["gridcraft_read_range", {doc: "42", sheet: "S", range: "A1", mode: "raw"}, /INVALID_MODE/],
    ["gridcraft_read_range", {doc: "42", sheet: "S", range: "A1:Z99"}, /RANGE_LIMIT/],
    ["gridcraft_prepare_write", {}, /METHOD_DENIED/],
  ]) assert.throws(() => validateV055Call(n, a), e, n);
});

test("Site and Edge formula guards agree", () => {
  const cases = ["=SUM(A1)", '=CELL("x")', "=_xlfn.WEBSERVICE(1)", "=[a]S!A1", "=a\\b", "=CUBESET(1)",
    "=INDIRECT(A1)", "=LET(x,1,x+1)", '="https://x"', "=" + "9".repeat(600)];
  const outcome = f => { try { return formulaGuard(f); } catch (e) { return e.message; } };
  const edge = f => { try { return edgeGuard(f); } catch (e) { return e.message; } };
  for (const f of cases) assert.equal(outcome(f), edge(f), f);
});
