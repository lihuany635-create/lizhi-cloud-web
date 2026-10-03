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
const Model=require("../core/project-model.js");
const Validator=require("../core/projects/project-validator.js");
const Repository=require("../core/projects/project-repository.js");
const Service=require("../core/projects/project-service.js");
const Database=require("../storage/engineering-db.js");
const Home=require("../pages/engineering-home.js");
const Workspace=require("../pages/project-workspace.js");
const Woodworking=require("../modules/woodworking/module.js");

function memoryPersistence(){
  const rows=new Map();
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  return {
    async addProject(project){if(rows.has(project.id)){const error=new Error("duplicate");error.name="ConstraintError";throw error;}rows.set(project.id,clone(project));return project.id;},
    async putProject(project){rows.set(project.id,clone(project));return project.id;},
    async getProject(id){return clone(rows.get(id));},
    async listProjects(){return clone([...rows.values()]);}
  };
}
function fixture(){
  const registry=Registry.createRegistry();registry.register(Woodworking);
  const persistence=memoryPersistence(),repository=Repository.create({persistence});
  const times=["2026-10-03T01:00:00.000Z","2026-10-03T01:01:00.000Z","2026-10-03T01:02:00.000Z","2026-10-03T01:03:00.000Z"];
  const service=Service.create({repository,registry,workspaceId:"workspace-1",now:()=>times.shift()||"2026-10-03T02:00:00.000Z",idGenerator:(()=>{let n=0;return()=>`project-${++n}`;})()});
  return {registry,persistence,repository,service};
}

test("E1-01 contract v1 has only neutral canonical fields",()=>{
  const project=Model.create({id:"p1",workspace_id:"w1",name:"Project",module_ids:[]});
  assert.deepEqual(Object.keys(project),Model.FIELDS);
  assert.doesNotMatch(JSON.stringify(project),/woodType|boardSize|furnitureType|hardware|timberVolume|woodworkingQuote/);
});
test("E1-02 project name cannot be blank",()=>{
  const registry=Registry.createRegistry();
  assert.throws(()=>Validator.validate(Model.create({id:"p1",workspace_id:"w1",name:"  "}),{registry}),error=>error.code==="PROJECT_NAME_REQUIRED");
});
test("E1-03 invalid status is rejected",()=>{
  const registry=Registry.createRegistry();
  assert.throws(()=>Validator.validate(Model.create({id:"p1",workspace_id:"w1",name:"P",status:"deleted"}),{registry}),error=>error.code==="PROJECT_STATUS_INVALID");
});
test("E1-04 unknown module id is rejected",()=>{
  const registry=Registry.createRegistry();
  assert.throws(()=>Validator.validate(Model.create({id:"p1",workspace_id:"w1",name:"P",module_ids:["unknown"]}),{registry}),error=>error.code==="PROJECT_MODULE_UNKNOWN");
});
test("E1-05 create generates stable unique ids",async()=>{
  const {service}=fixture(),a=await service.createProject({name:"A"}),b=await service.createProject({name:"B"});
  assert.notEqual(a.id,b.id);assert.equal((await service.getProject(a.id)).id,a.id);
});
test("E1-06 create associates a registered module",async()=>{
  const {service}=fixture(),project=await service.createProject({name:"A",module_ids:["woodworking"]});
  assert.deepEqual(project.module_ids,["woodworking"]);
});
test("E1-07 repository data can be read by a new repository instance",async()=>{
  const {service,persistence}=fixture(),project=await service.createProject({name:"Persistent"});
  const reloaded=Repository.create({persistence});assert.equal((await reloaded.getById(project.id)).name,"Persistent");
});
test("E1-08 repository list returns created projects",async()=>{
  const {service,repository}=fixture();await service.createProject({name:"A"});await service.createProject({name:"B"});assert.equal((await repository.list()).length,2);
});
test("E1-09 update preserves id and created_at",async()=>{
  const {service}=fixture(),created=await service.createProject({name:"Before"}),updated=await service.updateProject(created.id,{name:"After"});
  assert.equal(updated.id,created.id);assert.equal(updated.created_at,created.created_at);assert.equal(updated.name,"After");assert.notEqual(updated.updated_at,created.updated_at);
});
test("E1-10 archive is non-destructive and preserves id",async()=>{
  const {service}=fixture(),created=await service.createProject({name:"A"}),archived=await service.archiveProject(created.id);
  assert.equal(archived.id,created.id);assert.equal(archived.status,"archived");assert.equal((await service.listProjects()).length,1);
});
test("E1-11 reopen restores the same project",async()=>{
  const {service}=fixture(),created=await service.createProject({name:"A"});await service.archiveProject(created.id);const reopened=await service.reopenProject(created.id);
  assert.equal(reopened.id,created.id);assert.equal(reopened.status,"active");
});
test("E1-12 missing project has an explicit result",async()=>{
  const {service}=fixture();await assert.rejects(service.getProject("missing"),error=>error.code==="PROJECT_NOT_FOUND");
});
test("E1-13 associateModule uses the generic registry",async()=>{
  const {service,registry}=fixture();registry.register({id:"civil",name:"土木",version:"0.0.1",status:"registered",capabilities:[]});const project=await service.createProject({name:"A"});
  assert.deepEqual((await service.associateModule(project.id,"civil")).module_ids,["civil"]);
});
test("E1-14 removeModule does not delete the project",async()=>{
  const {service}=fixture(),project=await service.createProject({name:"A",module_ids:["woodworking"]});const updated=await service.removeModule(project.id,"woodworking");
  assert.deepEqual(updated.module_ids,[]);assert.equal((await service.getProject(project.id)).id,project.id);
});
test("E1-15 invalid data cannot be written through the service",async()=>{
  const {service}=fixture();await assert.rejects(service.createProject({name:" ",module_ids:["woodworking"]}),error=>error.code==="PROJECT_NAME_REQUIRED");
});
test("E1-16 duplicate repository ids are rejected",async()=>{
  const {repository,registry}=fixture(),project=Validator.validate(Model.create({id:"same",workspace_id:"w1",name:"A"}),{registry});await repository.create(project);
  await assert.rejects(repository.create(project),error=>error.code==="PROJECT_ALREADY_EXISTS");
});
test("E1-17 active and archived lists render separately",()=>{
  const modules=[Woodworking],base={workspace_id:"w1",module_ids:[],created_at:"2026-10-03T00:00:00Z",updated_at:"2026-10-03T00:00:00Z",metadata:{}};
  const html=Home.render({modules,projects:[Model.create({...base,id:"a",name:"Active",status:"active"}),Model.create({...base,id:"b",name:"Archived",status:"archived"})]});
  assert.match(html,/進行中[\s\S]*Active/);assert.match(html,/已封存[\s\S]*Archived/);
});
test("E1-18 workspace preserves basic project data as professional tools evolve",()=>{
  const project=Model.create({id:"p1",workspace_id:"w1",name:"A",module_ids:["woodworking"],created_at:"2026-10-03T00:00:00Z",updated_at:"2026-10-03T00:00:00Z"});
  const html=Workspace.render({project,modules:[Woodworking]});assert.match(html,/Project ID/);assert.match(html,/3 項能力可用/);assert.doesNotMatch(html,/BOM|報價|材料/);
});
test("E1-19 repository failures stay inside Engineering UI boundary",()=>{
  const source=read("engineering/engineering.js");assert.match(source,/Engineering projects failed safely/);assert.match(read("workspace-ui.js"),/Engineering Hub failed safely/);
});
test("E1-20 persistence remains a dedicated versioned Engineering database",()=>{
  assert.equal(Database.DB_NAME,"lizhi-engineering");assert.ok(Database.DB_VERSION>=2);assert.equal(Database.STORES.projects,"projects");assert.equal(Database.STORES.settings,"settings");
});
test("E1-21 production load order preserves UI-Service-Repository-Persistence",()=>{
  const index=read("index.html");assert.match(index,/engineering-db\.js[\s\S]*project-repository\.js[\s\S]*project-service\.js[\s\S]*engineering-home\.js[\s\S]*engineering\.js/);
});
test("E1-22 UI has no direct IndexedDB or Supabase access",()=>{
  const source=["engineering/pages/engineering-home.js","engineering/pages/project-workspace.js","engineering/engineering.js"].map(read).join("\n");assert.doesNotMatch(source,/indexedDB|supabase\.from/);
});
test("E1-23 repository contains no UI, AI, or woodworking rules",()=>{
  const source=read("engineering/core/projects/project-repository.js");assert.doesNotMatch(source,/document\.|innerHTML|woodworking|木工|fetch\(|callAI/);
});
test("E1-24 Phase 1 does not modify existing sync or Finance storage",()=>{
  assert.match(read("finance/storage/finance-db.js"),/DB_VERSION=1/);assert.doesNotMatch(read("sync.js"),/engineering/i);assert.doesNotMatch(read("engineering/storage/engineering-db.js"),/lizhi-finance|lizhi-local-cloud/);
});
test("E1-25 later phases do not add forbidden project fields or platform features",()=>{
  const source=fs.readdirSync(path.join(root,"engineering"),{recursive:true}).filter(file=>/\.js$/.test(file)&&!String(file).includes("tests")).map(file=>read(path.join("engineering",String(file)))).join("\n");
  assert.doesNotMatch(source,/woodType|boardSize|furnitureType|timberVolume|woodworkingQuote|MediaRecorder|getUserMedia|callAI\(/);
});
