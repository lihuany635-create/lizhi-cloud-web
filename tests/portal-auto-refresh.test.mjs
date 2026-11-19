import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const html=read("index.html"),sw=read("sw.js");
const app=read("app.js"),workbench=read("production/ai-workbench.js");

test("PORTAL-REFRESH-01 all critical entry asset versions match Service Worker",()=>{
 for(const path of ["loader.js","app.js","finance/pages/home.js","study.css"]){
   const rx=new RegExp(path.replaceAll(".","\\.")+"\\?v=(\\d+)","g");
   const entry=path==="finance/pages/home.js"?read("loader.js"):html;
   const version=[...entry.matchAll(rx)][0]?.[1];
   assert.ok(version,"Missing version for "+path);
   const matches=[...sw.matchAll(rx)].filter(x=>sw[x.index-1]==='"').map(x=>x[1]);
   assert.deepEqual(matches,[version],"SW must cache exactly the active version of "+path);
 }
 assert.match(sw,/const CACHE="lizhi-cloud-v170"/);
});

test("PORTAL-REFRESH-02 new Goals assets are preloaded for owner portal",()=>{
 for(const file of [
   "finance/goals/p3-goals.css","finance/goals/p5-goals.css",
   "finance/goals/p3-goals-ui.js","finance/goals/p5-goals-ui.js",
   "finance/goals/p6-browser-client.js"
 ]){
   assert.ok(existsSync(resolve(root,file)),"Missing "+file);
   assert.ok(sw.includes(file+"?v=1"),"SW needs "+file);
 }
});

test("PORTAL-REFRESH-03 detected upgrades never force reload without click",()=>{
 assert.match(app,/serviceWorker\.addEventListener\("controllerchange"/);
 assert.match(app,/if\(previousController&&next!==previousController\)offerRefresh\(\)/);
 assert.match(app,/button\.addEventListener\("click",\(\)=>location\.reload\(\)\)/);
 assert.match(app,/setInterval\(checkUpdate,600000\)/);
 assert.doesNotMatch(app,/setInterval\([^;]*location\.reload\(/s);
 assert.match(app,/document\.visibilityState!=="visible"\|\|updateRunning/);
});

test("PORTAL-REFRESH-04 workbench poll does not re-render unchanged content",()=>{
 assert.match(workbench,/const sameSnapshot = \(a, b\) => JSON\.stringify\(a\) === JSON\.stringify\(b\)/);
 assert.match(workbench,/if \(!quiet \|\| !unchanged\) render\(\)/);
 assert.match(workbench,/void load\(\{quiet:true\}\)/);
 assert.match(workbench,/seq !== loadSequence \|\| state\.tab !== 'side'/);
});
