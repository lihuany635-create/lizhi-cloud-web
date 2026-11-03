import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const edge = fs.readFileSync(path.join(root,"supabase/functions/lizhi-ai-workbench/index.ts"),"utf8");
const html = fs.readFileSync(path.join(root,"licut/index.html"),"utf8");

test("compiled 立剪 browser script parses as JavaScript", () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  const bundle = scripts.at(-1)?.[1];
  assert.ok(bundle?.length > 500000,"expected existing compiled bundle");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),"licut-bridge-"));
  try {
    const target = path.join(dir,"bundle.cjs");
    fs.writeFileSync(target,bundle);
    execFileSync(process.execPath,["--check",target],{stdio:"pipe"});
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test("ChatGPT exposes every existing remote-compatible engine edit operation", () => {
  const en = html.slice(html.indexOf("const en={"),html.indexOf(",Jc=Object.keys(en)"));
  assert.ok(en.length > 10000);
  const engine = [...en.matchAll(/(?:\{|,)([a-z_][a-z0-9_]*)\(n,e\)\{/g)]
    .map(m=>m[1]).filter(n=>!["add_media","update_media","remove_media"].includes(n)).sort();
  const block = edge.match(/const LICUT_OPS = \[([\s\S]*?)\] as const;/)?.[1];
  assert.ok(block,"no declared tool allowlist");
  const tools = JSON.parse("["+block+"]").sort();
  assert.equal(engine.length,47);
  assert.deepEqual(tools,engine,"MCP supported ops and phone engine have drifted");
});

test("MCP tool list, owner binding, and async result polling are wired", () => {
  const names = [...edge.matchAll(/licutTool\("(licut_[a-z_]+)"/g)].map(m=>m[1]);
  assert.equal(names.length,10);
  assert.ok(names.includes("licut_edit"));
  assert.ok(names.includes("licut_transport"));
  assert.ok(names.includes("licut_preview_media"));
  assert.ok(names.includes("licut_command_status"));
  assert.match(edge,/if \(name\.startsWith\("licut_"\)\) return await runLicutTool\(name,a,ownerId\)/);
  assert.match(edge,/user_id=eq\."\+q\(owner\)/);
  assert.match(edge,/chatgpt_owner/);
  assert.match(edge,/x-lizhi-actor/);
  assert.match(edge,/online_verified:false/);
});

test("mobile queue recognizes transport controls but does not execute arbitrary scripts", () => {
  assert.match(html, /b\[0\]\.op==="@transport"/);
  assert.match(html, /window\.licutRemoteControl=async a=>/);
  for (const action of ["play","pause","seek","undo","redo","frame","export_open","export_configure","export_start","export_save","export_status"]) {
    assert.ok(html.includes('action==="'+action+'"'),"missing "+action);
  }
  assert.match(html, /source\.width/);
  assert.match(html, /toDataURL\("image\/jpeg"/);
  assert.match(edge, /LICUT_OP_SET\.has/);
  assert.doesNotMatch(edge, /exec\s*\(|eval\s*\(/);
});

test("no production URL, RLS, or existing project data is altered in candidate", () => {
  assert.match(edge, /const table = "lizhi_licut_"/);
  assert.match(html, /lizhi_licut_projects/);
  assert.match(html, /lizhi_licut_thumbs/);
  assert.match(html, /lizhi_licut_commands/);
  assert.match(edge, /owner_id/);
  assert.match(edge, /keys\[0\]\.owner_id/);
});
