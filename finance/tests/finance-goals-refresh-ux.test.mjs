import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const require=createRequire(import.meta.url);
const goalUi=require("../goals/p5-goals-ui.js");

test("GOALS-UX-01 no false per-record approval labels or prefilled salary",()=>{
 const html=goalUi.render({enabled:true,month:"2026-11",goals:[],plan:null,accounts:[]});
 assert.match(html,/資金預留與釋出/);
 assert.match(html,/記錄規劃預留/);
 assert.match(html,/儲存薪水分配/);
 assert.doesNotMatch(html,/人工確認預留與釋出|記錄已確認預留/);
 assert.match(html,/name="estimated_income"[^>]*value="" placeholder="例如 43000"/);
 const filled=goalUi.render({enabled:true,month:"2026-11",plan:{
   estimated_income:43000,lines:[]},goals:[],accounts:[]});
 assert.match(filled,/name="estimated_income"[^>]*value="43000"/);
});

test("GOALS-UX-02 sticky header cannot cover notices while stage scrolls",()=>{
 const css=read("finance/styles/home.css");
 assert.match(css,/\.finance-stage\{[^}]*overflow:auto/);
 assert.match(css,/\.route-finance \.finance-workspace \.finance-header\{\s*position:relative;\s*top:auto;/);
});

test("GOALS-UX-03 form snapshot is per-owner and cloud revision",()=>{
 const source=read("finance/pages/home.js");
 assert.match(source,/function goalsRevision\(\)/);
 assert.match(source,/ui\.goals\.state==="synced"&&ui\.goals\.ownerId/);
 assert.match(source,/root\.dataset\.goalsRevision!==revision/);
 assert.match(source,/const goalDraft=captureGoalsDraft\(root\)/);
 assert.match(source,/restoreGoalsDraft\(root,goalDraft\)/);
 assert.match(source,/root\.dataset\.goalsRevision=goalsRevision\(\)/);
 assert.match(source,/stage\.scrollTop=oldScroll/);
 assert.match(source,/target\.focus\(\{preventScroll:true\}\)/);
 assert.match(source,/ui\.loaded&&ui\.view!=="goals"\)update\(\)/);
 assert.doesNotMatch(source,/localStorage\.setItem\([^\n]*goalsDraft/);
});

test("GOALS-UX-04 entrypoints and Service Worker preload only the active assets",()=>{
 const index=read("index.html"),loader=read("loader.js"),sw=read("sw.js");
 assert.match(sw,/const CACHE="lizhi-cloud-v171"/);
 for(const [entry,asset,version]of [
   [index,"finance/styles/home.css","63"],
   [index,"loader.js","9"],
   [loader,"finance/pages/home.js","73"],
   [loader,"finance/goals/p5-goals-ui.js","2"]
 ]){
   assert.ok(entry.includes(asset+"?v="+version));
   assert.ok(sw.includes('"'+asset+"?v="+version+'"'));
 }
 assert.doesNotMatch(sw,/finance\/pages\/home\.js\?v=72/);
 assert.doesNotMatch(sw,/finance\/goals\/p5-goals-ui\.js\?v=1/);
});
