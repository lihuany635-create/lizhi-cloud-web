import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { validateSnapshot, errorForHttp } from "../usage-monitor/monitor-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = name => readFileSync(resolve(root, name), "utf8");

test("usage route is allowlisted for first render and Google OAuth return", () => {
  const app = read("app.js");
  const auth = read("auth.js");
  assert.match(app, /"phoneagent","usage","trash"/);
  assert.match(auth, /"phoneagent","usage","trash"/);
  assert.match(app, /\["usage","量","Supabase 流量監控"\]/);
  assert.match(app, /route==="usage"/);
});

test("main panel mounts protected usage iframe without destroying existing workspace", () => {
  const app = read("app.js");
  const workspace = read("workspace-ui.js");
  assert.match(app, /function renderUsageMonitor\(\)/);
  assert.match(app, /src="\.\/usage-monitor\/\?v=1"/);
  assert.match(app, /referrerpolicy="same-origin"/);
  assert.match(workspace, /state\.route === 'usage' \? renderUsageMonitor\(\)/);
  assert.match(workspace, /state\.route === 'animationflow' \|\| state\.route === 'usage'/);
});

test("style, assets and cache versions are aligned on desktop/mobile", () => {
  const index = read("index.html");
  const css = read("study.css");
  const sw = read("sw.js");
  assert.match(index, /study\.css\?v=18/);
  assert.match(index, /workspace-ui\.js\?v=40/);
  const appVersion=index.match(/app\\.js\\?v=(\\d+)/)?.[1];
  assert.ok(appVersion, "Portal entry must version its app script");
  assert.ok(sw.includes('"app.js?v='+appVersion+'"'), "SW and HTML app.js versions must match");
  assert.match(css, /\.route-usage \.main/);
  assert.match(css, /\.route-usage \.workspace-panel/);
  assert.match(sw, /usage-monitor\/\?v=1/);
  assert.match(sw, /usage-monitor\/monitor\.js/);
  assert.match(sw, /workspace-ui\.js\?v=40/);
});

test("dashboard does not contain a service key, request body logging, or a fake monthly total", () => {
  for(const file of ["usage-monitor/index.html", "usage-monitor/monitor.js",
                     "usage-monitor/monitor-core.mjs"]) {
    const src = read(file);
    assert.doesNotMatch(src, /sb_secret_|service_role|SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(src, /localStorage\.setItem\(['"]?usage/);
  }
  const page=read("usage-monitor/index.html");
  assert.doesNotMatch(page, /免費參考上限：500,000/);
  assert.match(page, /非官方計費/);
  assert.match(page, /不顯示模擬流量/);
});

test("failed /snapshot stays unavailable, not a fabricated zero", () => {
  assert.match(errorForHttp(404), /後端尚未部署/);
  assert.throws(()=>validateSnapshot({month:"2026-11",summary:{request_count:0}},"2026-11"));
});

test("frontend retains auth and stale-response protection", () => {
  const src = read("usage-monitor/monitor.js");
  assert.match(src, /auth\.requireUser\(\)/);
  assert.match(src, /session\.access_token/);
  assert.match(src, /seq!==readSequence/);
  assert.match(src, /clearSnapshot\(\)/);
  assert.match(src, /event\.origin!==window\.location\.origin/);
  assert.doesNotMatch(src, /fetch\([^)]+\/rest\/v1\/lz_usage/);
});
