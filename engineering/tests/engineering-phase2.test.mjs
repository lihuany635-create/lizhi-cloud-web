import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const FormulaValidator=require("../core/calculation/formula-validator.js");
const FormulaPack=require("../core/calculation/formula-pack.js");
const FormulaRegistry=require("../core/calculation/formula-registry.js");
const InputValidator=require("../core/calculation/input-validator.js");
const Units=require("../core/calculation/unit-converter.js");
const Rounding=require("../core/calculation/rounding-policy.js");
const Engine=require("../core/calculation/calculation-engine.js");
const Record=require("../core/calculation/calculation-record.js");
const Repository=require("../storage/calculation-repository.js");
const Database=require("../storage/engineering-db.js");
const Rectangle=require("../formulas/demo/rectangle-area.js");
const DemoPack=require("../formulas/demo/demo-formula-pack.js");
const Workspace=require("../pages/project-workspace.js");

function registry(){const value=FormulaRegistry.createRegistry();value.registerPack(DemoPack);return value;}
function memoryPersistence(){
  const rows=new Map(),clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  return {async addCalculation(row){if(rows.has(row.id)){const error=new Error("duplicate");error.name="ConstraintError";throw error;}rows.set(row.id,clone(row));return row.id;},async getCalculation(id){return clone(rows.get(id));},async listCalculations(projectId){return clone([...rows.values()].filter(row=>row.project_id===projectId));}};
}
function engineFixture(options={}){
  const persistence=options.persistence||memoryPersistence(),repository=Repository.create({persistence});let number=0;
  const engine=Engine.create({formulaRegistry:options.registry||registry(),calculationRepository:repository,now:()=>"2026-10-03T12:00:00.000Z",idGenerator:()=>`calculation-${++number}`});
  return {engine,repository,persistence};
}
const baseInputSchema={fields:{value:{label:"Value",type:"number",required:true}}};
const formula=changes=>({id:"demo.test",module_id:"demo",name:"Test",version:"1.0.0",description:"",input_schema:baseInputSchema,output_schema:{fields:{value:{type:"number"}}},supported_units:{},rounding_policy:{type:"none"},execute:input=>({result:{value:input.value},warnings:[]}),...changes});

test("E2-01 valid Formula Definition is normalized",()=>assert.equal(FormulaValidator.validate(Rectangle.definition).version,"1.0.0"));
test("E2-02 Formula Definition requires id",()=>assert.throws(()=>FormulaValidator.validate(formula({id:""})),error=>error.code==="FORMULA_ID_INVALID"));
test("E2-03 Formula Definition requires version",()=>assert.throws(()=>FormulaValidator.validate(formula({version:""})),error=>error.code==="FORMULA_VERSION_REQUIRED"));
test("E2-04 Formula Definition requires executable function",()=>assert.throws(()=>FormulaValidator.validate(formula({execute:null})),error=>error.code==="FORMULA_EXECUTE_INVALID"));
test("E2-05 Formula Registry rejects duplicate ids",()=>{const value=FormulaRegistry.createRegistry();value.registerFormula(Rectangle.definition);assert.throws(()=>value.registerFormula(Rectangle.definition),error=>error.code==="FORMULA_DUPLICATE");});
test("E2-06 Formula Registry supports lookup and module lists",()=>{const value=registry();assert.equal(value.getFormula("demo.rectangle-area").name,"矩形面積");assert.equal(value.listFormulas().length,1);assert.equal(value.listByModule("demo").length,1);assert.equal(value.hasFormula("demo.rectangle-area"),true);});
test("E2-07 Formula Pack rejects module mismatch",()=>assert.throws(()=>FormulaPack.validate({module_id:"demo",version:"1",formulas:[formula({module_id:"civil"})]}),error=>error.code==="FORMULA_PACK_MODULE_MISMATCH"));
test("E2-08 required input is enforced",()=>{const result=InputValidator.validate(baseInputSchema,{});assert.equal(result.ok,false);assert.equal(result.errors[0].rule,"required");});
test("E2-09 numeric strings normalize to finite numbers",()=>{const result=InputValidator.validate(baseInputSchema,{value:"12.5"});assert.equal(result.ok,true);assert.equal(result.value.value,12.5);});
test("E2-10 NaN and Infinity are rejected",()=>{assert.equal(InputValidator.validate(baseInputSchema,{value:NaN}).ok,false);assert.equal(InputValidator.validate(baseInputSchema,{value:Infinity}).ok,false);});
test("E2-11 min and max are enforced",()=>{const schema={fields:{value:{type:"number",min:1,max:5}}};assert.equal(InputValidator.validate(schema,{value:0}).ok,false);assert.equal(InputValidator.validate(schema,{value:6}).ok,false);assert.equal(InputValidator.validate(schema,{value:3}).ok,true);});
test("E2-12 enum and unit values are enforced",()=>{const schema={fields:{unit:{type:"unit",required:true,enum:["mm","m"]}}};assert.equal(InputValidator.validate(schema,{unit:"kg"}).ok,false);assert.equal(InputValidator.validate(schema,{unit:"mm"}).ok,true);});
test("E2-13 unknown input fields are rejected",()=>assert.equal(InputValidator.validate(baseInputSchema,{value:1,extra:2}).ok,false));
test("E2-14 same-unit conversion is stable",()=>assert.equal(Units.convert(125,"mm","mm","length"),125));
test("E2-15 length conversion uses canonical factors",()=>assert.equal(Units.convert(2500,"mm","m","length"),2.5));
test("E2-16 incompatible dimensions are rejected",()=>assert.throws(()=>Units.convert(1,"kg","m"),error=>error.code==="UNIT_INCOMPATIBLE"));
test("E2-17 unknown units are rejected",()=>assert.throws(()=>Units.convert(1,"yard","m"),error=>error.code==="UNIT_UNKNOWN"));
test("E2-18 no-rounding preserves the raw number",()=>assert.equal(Rounding.roundNumber(1.23456,{type:"none"}),1.23456));
test("E2-19 decimal-place rounding is deterministic",()=>assert.equal(Rounding.roundNumber(1.005,{type:"decimal_places",places:2}),1.01));
test("E2-20 significant-digit rounding is available",()=>assert.equal(Rounding.roundNumber(1234.56,{type:"significant_digits",digits:3}),1230));
test("E2-21 Rectangle Area calculates a standard saved result",async()=>{const {engine}=engineFixture();const result=await engine.calculate({project_id:"a",formula_id:"demo.rectangle-area",input:{length:2,width:3,unit:"m"}});assert.equal(result.ok,true);assert.deepEqual(result.result,{area:6,area_unit:"m²"});assert.equal(result.formula_version,"1.0.0");assert.equal(result.meta.saved,true);});
test("E2-22 Formula not found returns a typed error",async()=>{const {engine}=engineFixture();const result=await engine.calculate({project_id:"a",formula_id:"missing",input:{}});assert.equal(result.ok,false);assert.equal(result.errors[0].code,"FORMULA_NOT_FOUND");});
test("E2-23 validation failure never executes a formula",async()=>{let called=false;const value=FormulaRegistry.createRegistry();value.registerFormula(formula({execute:()=>{called=true;return{result:{value:1}};}}));const result=await Engine.create({formulaRegistry:value}).calculate({project_id:"a",formula_id:"demo.test",input:{}});assert.equal(result.errors[0].code,"VALIDATION_ERROR");assert.equal(called,false);});
test("E2-24 unit failure returns UNIT_ERROR",async()=>{const value=FormulaRegistry.createRegistry();value.registerFormula(formula({input_schema:{fields:{value:{type:"number",required:true,unit_field:"unit",canonical_unit:"m",dimension:"length"},unit:{type:"unit",required:true,enum:["m","kg"]}}}}));const result=await Engine.create({formulaRegistry:value}).calculate({project_id:"a",formula_id:"demo.test",input:{value:1,unit:"kg"}});assert.equal(result.errors[0].code,"UNIT_ERROR");});
test("E2-25 formula throws become FORMULA_EXECUTION_ERROR",async()=>{const value=FormulaRegistry.createRegistry();value.registerFormula(formula({execute:()=>{throw new Error("boom");}}));const result=await Engine.create({formulaRegistry:value}).calculate({project_id:"a",formula_id:"demo.test",input:{value:1}});assert.equal(result.ok,false);assert.equal(result.errors[0].code,"FORMULA_EXECUTION_ERROR");});
test("E2-26 CalculationRecord retains formula identity and version",()=>{const record=Record.create({id:"r",project_id:"p",module_id:"demo",formula_id:"demo.rectangle-area",formula_version:"1.0.0",input:{length:2},result:{area:4},warnings:[],created_at:"2026-10-03T00:00:00Z"});assert.equal(record.formula_version,"1.0.0");assert.deepEqual(Object.keys(record),Record.FIELDS);});
test("E2-27 formula updates cannot rewrite old records",async()=>{const {engine,repository}=engineFixture();await engine.calculate({project_id:"p",formula_id:"demo.rectangle-area",input:{length:2,width:2,unit:"m"}});const rows=await repository.listByProject("p");assert.equal(rows[0].formula_version,"1.0.0");assert.equal(rows[0].result.area,4);});
test("E2-28 history is isolated by project_id",async()=>{const {engine,repository}=engineFixture();await engine.calculate({project_id:"a",formula_id:"demo.rectangle-area",input:{length:2,width:2,unit:"m"}});await engine.calculate({project_id:"b",formula_id:"demo.rectangle-area",input:{length:3,width:3,unit:"m"}});assert.equal((await repository.listByProject("a")).length,1);assert.equal((await repository.listByProject("a"))[0].result.area,4);});
test("E2-29 history reloads through a new repository",async()=>{const {engine,persistence}=engineFixture();await engine.calculate({project_id:"a",formula_id:"demo.rectangle-area",input:{length:1,width:5,unit:"m"}});assert.equal((await Repository.create({persistence}).listByProject("a"))[0].result.area,5);});
test("E2-30 storage failure keeps result and marks it unsaved",async()=>{const persistence={addCalculation:async()=>{throw new Error("disk");},getCalculation:async()=>null,listCalculations:async()=>[]};const {engine}=engineFixture({persistence});const result=await engine.calculate({project_id:"a",formula_id:"demo.rectangle-area",input:{length:2,width:3,unit:"m"}});assert.equal(result.ok,true);assert.equal(result.meta.saved,false);assert.equal(result.warnings.at(-1).code,"HISTORY_NOT_SAVED");});
test("E2-31 every Rectangle Area golden sample passes",async()=>{for(const sample of Rectangle.goldenSamples){const result=await Engine.create({formulaRegistry:registry()}).calculate({project_id:"golden",formula_id:"demo.rectangle-area",input:sample.input});assert.equal(result.formula_version,sample.formula_version);assert.ok(Math.abs(result.result.area-sample.expected_result.area)<=sample.tolerance);assert.equal(result.result.area_unit,sample.expected_result.area_unit);}});
test("E2-32 invalid Rectangle Area sample is rejected",async()=>{const result=await Engine.create({formulaRegistry:registry()}).calculate({project_id:"golden",formula_id:"demo.rectangle-area",input:{length:0,width:2,unit:"m"}});assert.equal(result.ok,false);assert.equal(result.errors[0].code,"VALIDATION_ERROR");});
test("E2-33 Formula execute stays pure",()=>{const source=read("engineering/formulas/demo/rectangle-area.js");assert.doesNotMatch(source,/document\.|indexedDB|localStorage|supabase|fetch\(|callAI|woodworking/i);});
test("E2-34 Calculation Engine has no Woodworking dependency",()=>assert.doesNotMatch(read("engineering/core/calculation/calculation-engine.js"),/woodworking|木工/i));
test("E2-35 Engineering DB v2 adds calculations without replacing v1 stores",()=>{const source=read("engineering/storage/engineering-db.js");assert.equal(Database.DB_VERSION,2);assert.deepEqual(Database.STORES,{projects:"projects",settings:"settings",calculations:"calculations"});assert.match(source,/if\(!db\.objectStoreNames\.contains\(STORES\.projects\)\)/);assert.match(source,/if\(!db\.objectStoreNames\.contains\(STORES\.calculations\)\)/);});
test("E2-36 calculations store has project, formula and time indexes",()=>{const source=read("engineering/storage/engineering-db.js");assert.match(source,/createIndex\("project_id"/);assert.match(source,/createIndex\("formula_id"/);assert.match(source,/createIndex\("created_at"/);});
test("E2-37 Project Workspace renders generic Calculation UI and History",()=>{const project={id:"p",workspace_id:"w",name:"P",status:"active",module_ids:[],created_at:"2026-10-03T00:00:00Z",updated_at:"2026-10-03T00:00:00Z",metadata:{}};const html=Workspace.render({project,formulas:[Rectangle.definition],history:[Record.create({id:"r",project_id:"p",module_id:"demo",formula_id:"demo.rectangle-area",formula_version:"1.0.0",input:{length:2,width:2,unit:"m"},result:{area:4,area_unit:"m²"},created_at:"2026-10-03T00:00:00Z"})]});assert.match(html,/矩形面積/);assert.match(html,/最近計算/);assert.match(html,/demo\.rectangle-area/);});
test("E2-38 UI never calls formula execute or IndexedDB directly",()=>{const source=[read("engineering/pages/project-workspace.js"),read("engineering/engineering.js")].join("\n");assert.doesNotMatch(source,/\.execute\(|indexedDB/);assert.match(source,/calculationEngine\.calculate/);});
test("E2-39 production assets load engine before demo pack and UI",()=>{const index=read("index.html");assert.match(index,/calculation-engine\.js[\s\S]*rectangle-area\.js[\s\S]*demo-formula-pack\.js[\s\S]*project-workspace\.js[\s\S]*engineering\.js/);});
test("E2-40 redline schemas remain isolated",()=>{assert.match(read("finance/storage/finance-db.js"),/DB_VERSION=1/);assert.doesNotMatch(read("sync.js"),/engineering|calculation/i);assert.doesNotMatch(read("engineering/core/calculation/calculation-engine.js"),/finance/i);});
