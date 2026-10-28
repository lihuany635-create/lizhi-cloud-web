// 按需載入與離線快取的一致性檢查。
// 執行：node --test tests/lazy-loader.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function loaderGroups() {
  const sandbox = { window: {}, document: {}, Promise };
  vm.runInNewContext(read("loader.js"), sandbox);
  const loader = sandbox.window.LizhiLoader;
  const source = read("loader.js");
  const groups = JSON.parse(source.slice(source.indexOf("const GROUPS=") + 13, source.indexOf(";\n  const ROUTE_GROUP")));
  return { loader, groups };
}

test("首頁只載入核心 script（不超過 12 個）", () => {
  const count = (read("index.html").match(/<script\b/g) || []).length;
  assert.ok(count <= 12, `index.html 有 ${count} 個 script`);
});

test("每個功能群組的檔案都存在，且沒有重複", () => {
  const { groups } = loaderGroups();
  const seen = new Set();
  for (const [group, list] of Object.entries(groups)) {
    assert.ok(list.length > 0, `${group} 是空的`);
    for (const src of list) {
      const file = src.replace(/^\.\//, "").split("?")[0];
      assert.ok(fs.existsSync(path.join(root, file)), `${group}: 找不到 ${file}`);
      assert.ok(!seen.has(file), `重複載入 ${file}`);
      seen.add(file);
    }
  }
});

test("每個功能路由都有對應群組，且群組名稱正確", () => {
  const { loader, groups } = loaderGroups();
  for (const route of ["finance", "knowledge", "library", "engineering", "weave", "phoneagent", "cad"]) {
    const group = loader.groupFor(route);
    assert.ok(group && groups[group], `${route} 沒有群組`);
  }
  assert.equal(loader.groupFor("home"), null);
  assert.equal(loader.groupFor("media"), null);
});

test("app.js 的功能啟動程式都在 registerFeatureActivators 裡", () => {
  const app = read("app.js");
  const start = app.indexOf("function registerFeatureActivators(){");
  const end = app.indexOf("async function boot(){");
  assert.ok(start > 0 && end > start);
  const outside = app.slice(0, start) + app.slice(end);
  for (const name of ["FinanceHome.", "KnowledgeHome.", "KnowledgeEditor.", "EngineeringHub.", "AiCenter.", "KnowledgeWeaving.", "LibraryHome."]) {
    assert.ok(!outside.includes(name), `${name} 在啟動函式之外被直接使用`);
  }
});

test("離線快取清單的版本號與實際載入的版本號一致", () => {
  const want = new Map();
  const refs = [...read("index.html").matchAll(/(?:src|href)="\.\/([^"]+)\?v=(\d+)"/g), ...read("loader.js").matchAll(/"\.\/([^"]+)\?v=(\d+)"/g)];
  for (const [, file, version] of refs) want.set(file, version);
  const mismatched = [];
  for (const [, file, version] of read("sw.js").matchAll(/"([^"?]+)\?v=(\d+)"/g)) {
    if (want.has(file) && want.get(file) !== version) mismatched.push(`${file}: sw v${version}，實際 v${want.get(file)}`);
  }
  assert.deepEqual(mismatched, []);
});
