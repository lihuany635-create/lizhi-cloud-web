import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const ModuleRegistry=require("../core/module-registry.js");
const FormulaRegistry=require("../core/calculation/formula-registry.js");
const Engine=require("../core/calculation/calculation-engine.js");
const Repository=require("../storage/calculation-repository.js");
const Database=require("../storage/engineering-db.js");
const Record=require("../core/calculation/calculation-record.js");
const Workspace=require("../pages/project-workspace.js");
const Woodworking=require("../modules/woodworking/module.js");
const Pack=require("../modules/woodworking/formula-pack.js");
const BoardArea=require("../modules/woodworking/formulas/board-area.js");
const BoardQuantity=require("../modules/woodworking/formulas/board-quantity.js");
const WasteFactor=require("../modules/woodworking/formulas/waste-factor.js");
const TimberWeight=require("../modules/woodworking/formulas/timber-weight.js");
const SlopeAngle=require("../modules/woodworking/formulas/slope-angle.js");

const formulas=[BoardArea,BoardQuantity,WasteFactor,TimberWeight,SlopeAngle];
function formulaRegistry(){const modules=ModuleRegistry.createRegistry();modules.register(Woodworking);const registry=FormulaRegistry.createRegistry({moduleRegistry:modules});registry.registerPack(Pack);return registry;}
function memoryPersistence(){const rows=new Map(),clone=value=>value==null?value:JSON.parse(JSON.stringify(value));return{async addCalculation(row){if(rows.has(row.id))throw new Error("duplicate");rows.set(row.id,clone(row));return row.id;},async getCalculation(id){return clone(rows.get(id));},async listCalculations(projectId){return clone([...rows.values()].filter(row=>row.project_id===projectId));}};}
function fixture(options={}){const persistence=options.persistence||memoryPersistence(),repository=Repository.create({persistence});let id=0;return{engine:Engine.create({formulaRegistry:options.registry||formulaRegistry(),calculationRepository:repository,now:()=>"2026-10-04T00:00:00.000Z",idGenerator:()=>`wood-${++id}`}),repository,persistence};}
async function calculate(formula,input,options={}){return fixture(options).engine.calculate({project_id:"project-a",formula_id:formula.definition.id,input});}
function assertExpected(actual,expected,tolerance=0){for(const [key,value] of Object.entries(expected)){if(typeof value==="number")assert.ok(Math.abs(actual[key]-value)<=tolerance,`${key}: ${actual[key]} != ${value}`);else assert.equal(actual[key],value);}}
const project=(moduleIds=["woodworking"])=>({id:"p",workspace_id:"w",name:"木工作業",status:"active",module_ids:moduleIds,created_at:"2026-10-04T00:00:00Z",updated_at:"2026-10-04T00:00:00Z",metadata:{}});

test("E3-01 definition review keeps timber volume unapproved",()=>{const review=read("engineering/modules/woodworking/formula-definition-review.md");assert.match(review,/木料材積／才[\s\S]*NEEDS_CONFIRMATION/);assert.equal(fs.existsSync(path.join(root,"engineering/modules/woodworking/formulas/timber-volume.js")),false);});
test("E3-02 pack contains five approved formulas",()=>assert.equal(Pack.formulas.length,5));
test("E3-03 every formula belongs to woodworking",()=>assert.ok(Pack.formulas.every(formula=>formula.module_id==="woodworking")));
test("E3-04 pack registers through the generic registry",()=>assert.equal(formulaRegistry().listByModule("woodworking").length,5));
test("E3-05 duplicate pack registration is rejected atomically",()=>{const registry=formulaRegistry();assert.throws(()=>registry.registerPack(Pack),error=>error.code==="FORMULA_DUPLICATE");assert.equal(registry.listFormulas().length,5);});
test("E3-06 invalid pack does not partially register",()=>{const modules=ModuleRegistry.createRegistry();modules.register(Woodworking);const registry=FormulaRegistry.createRegistry({moduleRegistry:modules});const invalid={...Pack,formulas:[BoardArea.definition,{...BoardQuantity.definition,id:"Invalid ID"}]};assert.throws(()=>registry.registerPack(invalid));assert.equal(registry.listFormulas().length,0);});
test("E3-07 all definitions satisfy the professional quality contract",()=>{for(const {definition,goldenSamples} of formulas){assert.equal(definition.status,"production");assert.ok(definition.version);assert.ok(definition.description);assert.ok(definition.applicability);assert.ok(definition.assumptions.length);assert.ok(Object.keys(definition.input_schema.fields).length);assert.ok(Object.keys(definition.output_schema.fields).length);assert.ok(definition.rounding_policy);assert.ok(goldenSamples.length>=3);assert.ok(goldenSamples.every(sample=>sample.formula_id===definition.id&&sample.formula_version===definition.version));}});
test("E3-08 no published formula claims timber volume or Taiwanese 才",()=>assert.ok(Pack.formulas.every(formula=>!/(timber-volume|材積|才)/i.test(`${formula.id}${formula.name}`))));

test("E3-09 board area converts centimeters to square meters",async()=>{const result=await calculate(BoardArea,{length:244,width:122,quantity:1,unit:"cm"});assert.equal(result.ok,true);assert.equal(result.result.total_area_m2,2.9768);});
test("E3-10 board area supports millimeters and quantity",async()=>{const result=await calculate(BoardArea,{length:2400,width:1200,quantity:3,unit:"mm"});assert.equal(result.result.total_area_m2,8.64);});
test("E3-11 board area rejects zero dimensions",async()=>assert.equal((await calculate(BoardArea,{length:0,width:100,quantity:1,unit:"cm"})).errors[0].code,"VALIDATION_ERROR"));
test("E3-12 board area requires an integer quantity",async()=>{const result=await calculate(BoardArea,{length:100,width:100,quantity:1.5,unit:"cm"});assert.equal(result.ok,false);assert.equal(result.errors[0].rule,"integer");});
test("E3-13 board area rejects unknown units",async()=>assert.equal((await calculate(BoardArea,{length:1,width:1,quantity:1,unit:"yard"})).errors[0].code,"VALIDATION_ERROR"));
test("E3-14 board area carries its applicability warning",async()=>assert.equal((await calculate(BoardArea,{length:1,width:1,quantity:1,unit:"m"})).warnings[0].code,"AREA_ESTIMATE_ONLY"));
test("E3-15 board area golden samples pass",async()=>{for(const sample of BoardArea.goldenSamples)assertExpected((await calculate(BoardArea,sample.input)).result,sample.expected_result,sample.tolerance);});

test("E3-16 waste factor uses decimal rate semantics",async()=>assert.deepEqual((await calculate(WasteFactor,{base_amount:100,waste_rate:0.1})).result,{adjusted_amount:110,waste_amount:10,rate_decimal:0.1}));
test("E3-17 zero waste is valid",async()=>assert.equal((await calculate(WasteFactor,{base_amount:12.5,waste_rate:0})).result.adjusted_amount,12.5));
test("E3-18 high waste returns a warning",async()=>assert.equal((await calculate(WasteFactor,{base_amount:10,waste_rate:0.75})).warnings[0].code,"HIGH_WASTE_RATE"));
test("E3-19 negative waste is invalid",async()=>assert.equal((await calculate(WasteFactor,{base_amount:10,waste_rate:-0.1})).ok,false));
test("E3-20 waste above the documented bound is invalid",async()=>assert.equal((await calculate(WasteFactor,{base_amount:10,waste_rate:2.01})).ok,false));
test("E3-21 waste factor golden samples pass",async()=>{for(const sample of WasteFactor.goldenSamples)assertExpected((await calculate(WasteFactor,sample.input)).result,sample.expected_result,sample.tolerance);});

test("E3-22 board quantity returns raw and recommended counts",async()=>{const result=await calculate(BoardQuantity,{required_area_m2:10,board_length:244,board_width:122,unit:"cm",waste_rate:0.1});assert.equal(result.result.raw_board_count,3.6952);assert.equal(result.result.recommended_board_count,4);});
test("E3-23 board quantity count policy is explicit ceil",()=>assert.equal(BoardQuantity.definition.output_schema.fields.recommended_board_count.count_policy,"ceil"));
test("E3-24 board quantity warns that it is not cutting optimization",async()=>assert.match((await calculate(BoardQuantity,{required_area_m2:1,board_length:1,board_width:1,unit:"m",waste_rate:0})).warnings[0].message,/Cutting Optimization/));
test("E3-25 board quantity rejects invalid board geometry",async()=>assert.equal((await calculate(BoardQuantity,{required_area_m2:1,board_length:0,board_width:1,unit:"m",waste_rate:0})).ok,false));
test("E3-26 board quantity golden samples pass",async()=>{for(const sample of BoardQuantity.goldenSamples)assertExpected((await calculate(BoardQuantity,sample.input)).result,sample.expected_result,sample.tolerance);});

test("E3-27 timber weight uses user supplied density",async()=>{const result=await calculate(TimberWeight,{length:2000,width:100,thickness:50,unit:"mm",density_kg_m3:600});assert.deepEqual(result.result,{volume_m3:0.01,mass_kg:6,mass_unit:"kg"});});
test("E3-28 timber weight always records the density warning",async()=>assert.equal((await calculate(TimberWeight,{length:1,width:1,thickness:1,unit:"m",density_kg_m3:600})).warnings[0].code,"USER_SUPPLIED_DENSITY"));
test("E3-29 timber weight rejects missing or impossible density",async()=>{assert.equal((await calculate(TimberWeight,{length:1,width:1,thickness:1,unit:"m"})).ok,false);assert.equal((await calculate(TimberWeight,{length:1,width:1,thickness:1,unit:"m",density_kg_m3:6000})).ok,false);});
test("E3-30 timber weight golden samples pass",async()=>{for(const sample of TimberWeight.goldenSamples)assertExpected((await calculate(TimberWeight,sample.input)).result,sample.expected_result,sample.tolerance);});

test("E3-31 slope angle calculates a defined 45 degree triangle",async()=>assert.equal((await calculate(SlopeAngle,{rise:100,run:100,unit:"mm"})).result.angle_degrees,45));
test("E3-32 slope angle allows zero rise",async()=>assert.equal((await calculate(SlopeAngle,{rise:0,run:2,unit:"m"})).result.angle_degrees,0));
test("E3-33 slope angle rejects zero run",async()=>assert.equal((await calculate(SlopeAngle,{rise:1,run:0,unit:"m"})).ok,false));
test("E3-34 slope angle is invariant across equal input units",async()=>{const mm=await calculate(SlopeAngle,{rise:3,run:4,unit:"mm"}),m=await calculate(SlopeAngle,{rise:3,run:4,unit:"m"});assert.equal(mm.result.angle_degrees,m.result.angle_degrees);});
test("E3-35 slope angle golden samples pass",async()=>{for(const sample of SlopeAngle.goldenSamples)assertExpected((await calculate(SlopeAngle,sample.input)).result,sample.expected_result,sample.tolerance);});

test("E3-36 warnings persist in CalculationRecord history",async()=>{const {engine,repository}=fixture();await engine.calculate({project_id:"a",formula_id:TimberWeight.definition.id,input:{length:1,width:1,thickness:1,unit:"m",density_kg_m3:500}});assert.equal((await repository.listByProject("a"))[0].warnings[0].code,"USER_SUPPLIED_DENSITY");});
test("E3-37 woodworking history remains isolated by project",async()=>{const {engine,repository}=fixture();await engine.calculate({project_id:"a",formula_id:BoardArea.definition.id,input:{length:1,width:1,quantity:1,unit:"m"}});await engine.calculate({project_id:"b",formula_id:SlopeAngle.definition.id,input:{rise:1,run:1,unit:"m"}});assert.equal((await repository.listByProject("a")).length,1);assert.equal((await repository.listByProject("a"))[0].formula_id,BoardArea.definition.id);});
test("E3-38 one broken formula does not stop another formula",async()=>{const registry=formulaRegistry();registry.registerFormula({id:"woodworking.broken",module_id:"woodworking",name:"Broken",version:"1",input_schema:{fields:{value:{type:"number",required:true}}},output_schema:{fields:{}},execute(){throw new Error("boom");}});const engine=Engine.create({formulaRegistry:registry});assert.equal((await engine.calculate({project_id:"p",formula_id:"woodworking.broken",input:{value:1}})).errors[0].code,"FORMULA_EXECUTION_ERROR");assert.equal((await engine.calculate({project_id:"p",formula_id:BoardArea.definition.id,input:{length:1,width:1,quantity:1,unit:"m"}})).ok,true);});
test("E3-39 history save failure keeps the woodworking result",async()=>{const persistence={addCalculation:async()=>{throw new Error("disk");},getCalculation:async()=>null,listCalculations:async()=>[]};const result=await calculate(BoardArea,{length:1,width:1,quantity:1,unit:"m"},{persistence});assert.equal(result.ok,true);assert.equal(result.meta.saved,false);assert.equal(result.warnings.at(-1).code,"HISTORY_NOT_SAVED");});
test("E3-40 runtime isolates a woodworking pack registration failure",()=>{const source=read("engineering/engineering.js");assert.match(source,/Woodworking Formula Pack failed safely/);assert.match(source,/recordFailure/);});
test("E3-41 calculation core has no woodworking pollution",()=>{for(const file of fs.readdirSync(path.join(root,"engineering/core/calculation")))if(file.endsWith(".js"))assert.doesNotMatch(read(path.join("engineering/core/calculation",file)),/woodworking|木工|board-area|timber-weight/i);assert.doesNotMatch(read("engineering/core/project-model.js"),/woodType|boardThickness|timber|木材|板材/);});
test("E3-42 linked projects display Woodworking Tools",()=>{const html=Workspace.render({project:project(),modules:[Woodworking],formulas:formulaRegistry().listFormulas()});assert.match(html,/木工工具/);assert.match(html,/板材面積/);assert.match(html,/坡度角/);});
test("E3-43 unlinked projects do not expose woodworking formulas",()=>{const html=Workspace.render({project:project([]),modules:[Woodworking],formulas:formulaRegistry().listFormulas()});assert.doesNotMatch(html,/板材面積|板材用量估算|坡度角/);});
test("E3-44 history UI reproduces saved professional warnings",()=>{const history=[Record.create({id:"r",project_id:"p",module_id:"woodworking",formula_id:TimberWeight.definition.id,formula_version:"1.0.0",input:{},result:{mass_kg:1},warnings:[TimberWeight.DENSITY_WARNING],created_at:"2026-10-04T00:00:00Z"})];const html=Workspace.render({project:project(),modules:[Woodworking],formulas:Pack.formulas,history});assert.match(html,/密度為使用者輸入/);});
test("E3-45 production assets load formula pack before Engineering runtime",()=>{const index=read("index.html");assert.match(index,/board-area\.js[\s\S]*formula-pack\.js[\s\S]*engineering\.js\?v=13/);});
test("E3-46 later DB versions preserve all Phase 3 stores",()=>{assert.ok(Database.DB_VERSION>=2);assert.equal(Database.STORES.projects,"projects");assert.equal(Database.STORES.settings,"settings");assert.equal(Database.STORES.calculations,"calculations");});
test("E3-47 protected domains and Finance DB remain isolated",()=>{assert.match(read("finance/storage/finance-db.js"),/DB_VERSION=1/);assert.doesNotMatch(read("sync.js"),/engineering|woodworking/i);for(const file of ["board-area.js","board-quantity.js","waste-factor.js","timber-weight.js","slope-angle.js"])assert.doesNotMatch(read(`engineering/modules/woodworking/formulas/${file}`),/indexedDB|supabase|fetch\(|document\./);});
