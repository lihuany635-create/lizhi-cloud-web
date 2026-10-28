const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'workspace-ui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// 功能 script 改由 loader.js 按需載入（進入 CAD 時才下載）。
const loader = fs.readFileSync(path.join(root, 'loader.js'), 'utf8');
const host = fs.readFileSync(path.join(root, 'cad/cad-host.js'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const builder = fs.readFileSync(path.join(root, 'cad/build-runtime.sh'), 'utf8');

test('CAD route, menu, persistent iframe and same-origin host are wired', () => {
  assert.match(app, /"cad","圖","立之 CAD"/);
  assert.match(app, /function renderCad\(\)/);
  assert.match(app, /id="cad-frame"/);
  assert.match(app, /cad\/runtime\/index\.html\?host=parent/);
  assert.match(ui, /state\.route === 'cad'/);
  assert.match(ui, /LizhiCadHost\?\.mount\(panel\)/);
  assert.match(loader, /cad\/cad-host\.js/);
  assert.match(loader, /cad:"cad"/);
  assert.match(html, /cad\/cad\.css/);
});
test('native pinned WASM build is part of existing Pages deployment', () => {
  assert.match(workflow, /bash cad\/setup-build-toolchain\.sh/);
  assert.match(workflow, /bash cad\/build-runtime\.sh/);
  assert.match(builder, /trunk build --release/);
  assert.match(builder, /cb256cf8a383c422482e8a455e3013887fa39a74/);
  assert.match(builder, /cad\/runtime/);
  assert.doesNotMatch(builder, /docker build|supabase|AWS_SECRET|service.role|remote worker/i);
});
test('host rejects foreign origin and fake frame while receiving legitimate CAD ready', async () => {
  const handlers = {};
  const frameWindow = { postMessage() {} };
  const frame = { contentWindow: frameWindow, addEventListener() {} };
  const status = { textContent: '', dataset: {} };
  const panel = { querySelector(s) { return s === '#cad-frame' ? frame : s === '#cad-status' ? status : null; }, addEventListener() {} };
  const sandbox = {
    window: { addEventListener(name, fn) { handlers[name] = fn; }, showDirectoryPicker: undefined },
    document: {},
    location: { origin: 'https://example.test' },
    indexedDB: { open() { throw Error('test-no-db'); } },
    URL, Blob, setTimeout, crypto: require('node:crypto').webcrypto,
    confirm() { return true; }
  };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(host, sandbox, { filename: 'cad-host.js' });
  sandbox.window.LizhiCadHost.mount(panel);
  // Finish asynchronous permission-restore fallback before testing origin filtering.
  await new Promise(resolve => setImmediate(resolve));
  status.textContent = 'original';
  await handlers.message({ source: {}, origin: 'https://example.test', data: { type: 'cadcraft:ready' } });
  assert.equal(status.textContent, 'original');
  await handlers.message({ source: frameWindow, origin: 'https://foreign.test', data: { type: 'cadcraft:ready' } });
  assert.equal(status.textContent, 'original');
  await handlers.message({ source: frameWindow, origin: 'https://example.test', data: { type: 'cadcraft:ready' } });
  assert.match(status.textContent, /已就緒/);
});
test('host has explicit local-only file and revision safety boundaries', () => {
  assert.match(host, /event\.source !== frame\.contentWindow/);
  assert.match(host, /event\.origin !== location\.origin/);
  assert.match(host, /MAX_BYTES = 32 \* 1024 \* 1024/);
  assert.match(host, /queryPermission/);
  assert.match(host, /showDirectoryPicker/);
  assert.match(host, /createWritable/);
  assert.match(host, /crypto\.randomUUID/);
  assert.match(host, /download\(filename, bytes\)/);
  assert.match(host, /keepExistingData: false/);
  assert.doesNotMatch(host, /fetch\(|XMLHttpRequest|supabase\.from|localStorage\.setItem\(.*dxf/i);
});
