"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),crypto=require("node:crypto");
const {parseWorkerConfig}=require("./cloud-cad-worker-server.cjs");
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"lizhi-cad-config-"));
const exe=path.join(dir,"cadcraft-cli");
fs.writeFileSync(exe,"CI-FIXTURE-NOT-A-REAL-EXECUTABLE");
const hash=crypto.createHash("sha256").update(fs.readFileSync(exe)).digest("hex");
const config={
 CAD_DEPLOYMENT_MODE:"staging",CAD_WORKER_STAGING_CONFIRM:"isolated-only",
 CAD_STAGING_DATABASE_URL:"postgres://ci:secret@127.0.0.1:5432/cad_ci",
 CAD_STAGING_S3_ENDPOINT:"http://127.0.0.1:9000",
 CAD_STAGING_S3_BUCKET:"cad-ci-only",CAD_STAGING_S3_REGION:"us-east-1",
 CAD_STAGING_S3_ACCESS_KEY_ID:"ci",CAD_STAGING_S3_SECRET_ACCESS_KEY:"ci-secret",
 CAD_WORKER_OWNER_ID:"aabbccdd-1234-4abc-8abc-abc123456789",
 CAD_WORKER_ID:"staging_worker",CADCRAFT_BIN:exe,CADCRAFT_BIN_SHA256:hash
};
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
test("worker requires explicit isolated staging and pinned executable",()=>{
 const x=parseWorkerConfig(config);
 assert.equal(x.binPath,exe);assert.equal(x.ownerId,config.CAD_WORKER_OWNER_ID);assert.equal(x.pollMs,5000);
});
test("rejects changed or unverified binary",()=>{
 assert.throws(()=>parseWorkerConfig({...config,CADCRAFT_BIN_SHA256:"a".repeat(64)}),{code:"CAD_CADCRAFT_HASH_MISMATCH"});
 assert.throws(()=>parseWorkerConfig({...config,CADCRAFT_BIN:"/no-such-file"}),{code:"CAD_CADCRAFT_BIN_INVALID"});
});
test("rejects known production database, unsafe S3 endpoints, and non-staging runtime",()=>{
 for(const patch of [
  {CAD_DEPLOYMENT_MODE:"production"},
  {CAD_WORKER_STAGING_CONFIRM:""},
  {CAD_STAGING_DATABASE_URL:"postgres://host/hrdzywkihfqggiwjgavi"},
  {CAD_STAGING_S3_ENDPOINT:"http://public.example.com"},
  {CAD_STAGING_S3_ENDPOINT:"https://user:password@storage.example.com"},
  {CAD_WORKER_POLL_MS:"1"},
  {CAD_STAGING_S3_SECRET_ACCESS_KEY:""}
 ])assert.throws(()=>parseWorkerConfig({...config,...patch}));
});
