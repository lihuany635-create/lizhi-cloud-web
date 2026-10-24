"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const cp=require("node:child_process");
const current=path.resolve(__dirname,"..");
const group=process.argv[2] || "engineering";
assert.ok(["engineering","finance"].includes(group),"unsupported test group");
const baseline=path.resolve(process.env.CAD_BASELINE_ROOT||path.join(current,"_cad-baseline-main"));
function run(root,tag) {
  const dir=path.join(root,group,"tests");
  const files=fs.readdirSync(dir).filter(name=>name.endsWith(".test.mjs") || name.endsWith(".test.js")).sort().map(name=>path.join(dir,name));
  const child=cp.spawnSync(process.execPath,["--test","--test-reporter=tap",...files],{cwd:root,encoding:"utf8",maxBuffer:32*1024*1024,timeout:180000});
  if(child.error)throw child.error;
  const output=(child.stdout||"")+"\n"+(child.stderr||"");
  const failures=output.split(/\r?\n/).flatMap(line=>{
    const match=line.match(/^not ok \d+ - (.+)$/);
    return match ? [match[1].replace(/ \(\d+(?:\.\d+)?ms\)$/,"")] : [];
  }).sort();
  const n=key=>{const m=output.match(new RegExp("^# "+key+" (\\d+)$","m"));return m?Number(m[1]):null;};
  const result={tag,files:files.length,tests:n("tests"),pass:n("pass"),fail:n("fail"),failures,exit:child.status};
  assert.ok(result.tests!==null&&result.fail!==null,tag+": Node TAP summary missing\n"+output.slice(-6000));
  assert.equal(result.failures.length,result.fail,tag+": TAP failure names missing");
  if(child.status!==0 && child.status!==1)throw Error(tag+": abnormal Node status "+child.status);
  return result;
}
const a=run(baseline,"main");
const b=run(current,"cad-candidate");
console.log("CAD_CROSS_MODULE_REGRESSION_BASELINE",JSON.stringify({baseline:a,candidate:b}));
assert.equal(b.tests,a.tests,"Changed "+group+" test total");
assert.deepEqual(b.failures,a.failures,"CAD candidate introduced or removed a "+group+" regression");
console.log("CAD_"+group.toUpperCase()+"_NO_NEW_FAILURES_PASS");
