import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"../.."),read=file=>readFileSync(path.join(root,file),"utf8"),require=createRequire(import.meta.url);
const {prepareJob}=require("./cadcraft-export-job.cjs");
const spec={schema_version:"cad-drawing-spec@1",units:"mm",view:"front",source_identity:{design_id:"d1",template_id:"t",template_version:"1",revision:1},entities:[{type:"polyline",closed:true,layer:"FURNITURE",points:[[0,0],[10,0],[10,10],[0,10]]}]};

test("M2 export job carries structured MCP operations",()=>{const job=prepareJob(spec,{projectId:"p1"});assert.equal(job.operations.length,1);assert.deepEqual(job.operations[0],{command:"pline",params:{vertices:spec.entities[0].points,closed:true}});assert.equal(Object.isFrozen(job.operations),true);});
test("M2 UI exposes generation downloads and version history",()=>{const page=read("engineering/pages/project-workspace.js");for(const value of["產生 CAD 圖","下載 ${format.toUpperCase()}","CAD 版本記錄"])assert.ok(page.includes(value),value);assert.match(read("engineering/engineering.js"),/EngineeringCadDrawingSpec\.createFromDesign/);});
test("M2 browser scripts load before Engineering runtime",()=>{const index=read("index.html"),specIndex=index.indexOf("cad-drawing-spec.js"),clientIndex=index.indexOf("cad-browser-client.js"),runtime=index.indexOf("engineering/engineering.js");assert.ok(specIndex>0&&specIndex<clientIndex&&clientIndex<runtime);});
test("M2 artifacts stay behind the local guarded API",()=>{const server=read("server.mjs"),api=read("engineering/cad/cad-api.mjs"),store=read("engineering/cad/cad-job-store.mjs");assert.match(server,/\.local-data","engineering-cad/);assert.match(api,/x-content-type-options":"nosniff"/);assert.match(api,/content-security-policy":"default-src 'none'; sandbox"/);assert.match(store,/\^\[0-9a-f\]\{64\}\$/);});
test("M2 service worker caches browser-only CAD adapters",()=>{const sw=read("sw.js");assert.match(sw,/engineering\/cad\/cad-drawing-spec\.js\?v=1/);assert.match(sw,/engineering\/cad\/cad-browser-client\.js\?v=1/);assert.doesNotMatch(sw,/cadcraft-runner|cad-job-store|cad-api\.mjs/);});
