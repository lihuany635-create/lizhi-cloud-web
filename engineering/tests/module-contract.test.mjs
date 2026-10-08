import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),Registry=require("../core/module-registry.js"),Woodworking=require("../modules/woodworking/module.js"),Supervision=require("../modules/supervision/module.js"),FormulaRegistry=require("../core/calculation/formula-registry.js"),WoodPack=require("../modules/woodworking/formula-pack.js"),SupervisionPack=require("../modules/supervision/formula-pack.js");
for(const [label,definition] of [["woodworking",Woodworking],["supervision",Supervision]]){
  test(`MC-${label}-id`,()=>assert.equal(definition.id,label));
  test(`MC-${label}-version`,()=>assert.match(definition.version,/^\d+\.\d+\.\d+$/));
  test(`MC-${label}-status`,()=>assert.equal(definition.status,"ready"));
  test(`MC-${label}-capabilities`,()=>assert.ok(Array.isArray(definition.capabilities)&&definition.capabilities.length>0));
  test(`MC-${label}-register`,()=>{const registry=Registry.createRegistry();assert.equal(registry.register(definition).id,label);});
  test(`MC-${label}-safe-normalize`,()=>assert.deepEqual(Registry.normalizeModule(definition),definition));
}
test("MC-13 both modules coexist",()=>{const registry=Registry.createRegistry();registry.register(Woodworking);registry.register(Supervision);assert.deepEqual(registry.list().map(item=>item.id),["woodworking","supervision"]);});
test("MC-14 duplicate id is rejected",()=>{const registry=Registry.createRegistry();registry.register(Woodworking);assert.throws(()=>registry.register({...Supervision,id:"woodworking"}),/already registered/);});
test("MC-15 unavailable module records failure without deleting healthy modules",()=>{const registry=Registry.createRegistry();registry.register(Woodworking);registry.recordFailure(new Error("unavailable"));assert.equal(registry.list().length,1);assert.equal(registry.failures().length,1);});
test("MC-16 both formula packs register",()=>{const modules=Registry.createRegistry();modules.register(Woodworking);modules.register(Supervision);const formulas=FormulaRegistry.createRegistry({moduleRegistry:modules});formulas.registerPack(WoodPack);formulas.registerPack(SupervisionPack);assert.equal(formulas.listByModule("woodworking").length,5);assert.equal(formulas.listByModule("supervision").length,2);});
test("MC-17 formula ids do not collide",()=>assert.equal(new Set([...WoodPack.formulas,...SupervisionPack.formulas].map(item=>item.id)).size,WoodPack.formulas.length+SupervisionPack.formulas.length));
test("MC-18 supervision failure does not prevent woodworking pack",()=>{const modules=Registry.createRegistry();modules.register(Woodworking);const formulas=FormulaRegistry.createRegistry({moduleRegistry:modules});assert.throws(()=>formulas.registerPack(SupervisionPack));formulas.registerPack(WoodPack);assert.equal(formulas.listByModule("woodworking").length,5);});
