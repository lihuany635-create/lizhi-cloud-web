import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const Registry=require("../core/module-registry.js");
const Projects=require("../core/project-model.js");
const Adapter=require("../integration/platform-adapter.js");
const Woodworking=require("../modules/woodworking/module.js");
const Home=require("../pages/engineering-home.js");

test("E0-01 registry accepts the generic module contract",()=>{
  const registry=Registry.createRegistry();
  assert.equal(registry.register(Woodworking).id,"woodworking");
  assert.equal(registry.list().length,1);
});

test("E0-02 woodworking still satisfies the metadata contract",()=>{
  assert.deepEqual(Object.keys(Woodworking),["id","name","version","status","capabilities"]);
  assert.ok(Array.isArray(Woodworking.capabilities));
});

test("E0-03 registry contains no woodworking special case",()=>{
  assert.doesNotMatch(read("engineering/core/module-registry.js"),/woodworking|木工/i);
});

test("E0-04 registry works without woodworking",()=>{
  const registry=Registry.createRegistry();
  registry.register({id:"civil",name:"土木",version:"0.0.1",status:"registered",capabilities:[]});
  assert.equal(registry.get("civil").name,"土木");
});

test("E0-05 EngineeringProject remains domain neutral",()=>{
  const project=Projects.create({id:"p1",workspace_id:"w1",name:"測試工程",module_ids:["civil"]});
  assert.equal(project.status,"active");
  assert.doesNotMatch(read("engineering/core/project-model.js"),/木材|板材|五金|家具|報價/);
});

test("E0-06 platform adapter fails predictably for unavailable capabilities",async()=>{
  const adapter=Adapter.create();
  await assert.rejects(adapter.sync(),error=>error.code==="ENGINEERING_CAPABILITY_UNAVAILABLE");
});

test("E0-07 home renders registered modules through metadata",()=>{
  const html=Home.render({modules:[Woodworking]});
  assert.match(html,/木工/);
  assert.match(html,/3 項能力/);
  assert.match(html,/data-route="home"/);
});

test("E0-08 empty registry degrades safely",()=>{
  assert.match(Home.render(),/尚無可用專業模組/);
});

test("E0-09 workspace exposes an isolated Engineering renderer",()=>{
  const workspace=read("workspace-ui.js");
  assert.match(workspace,/engineering:renderEngineeringHub/);
  assert.match(workspace,/Engineering Hub failed safely/);
});

test("E0-10 production entry loads Engineering before workspace",()=>{
  const index=read("index.html");
  assert.match(index,/engineering\/engineering\.js\?v=12[\s\S]*workspace-ui\.js\?v=24/);
});

test("E0-11 Phase 0 does not introduce persistence or AI",()=>{
  const source=["engineering/engineering.js","engineering/core/module-registry.js","engineering/core/project-model.js","engineering/integration/platform-adapter.js","engineering/pages/engineering-home.js","engineering/modules/woodworking/module.js"].map(read).join("\n");
  assert.doesNotMatch(source,/indexedDB\.open|localStorage\.(setItem|removeItem)|supabase\.from|fetch\(|MediaRecorder|getUserMedia/);
});

test("E0-12 existing storage and Finance DB versions remain unchanged",()=>{
  assert.match(read("app.js"),/const DB_VERSION=1/);
  assert.match(read("finance/storage/finance-db.js"),/DB_VERSION=1/);
});
