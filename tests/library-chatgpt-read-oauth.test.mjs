import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const sql=await readFile("supabase/migrations/20261103062000_library_chatgpt_read_oauth_hotfix.sql","utf8");
test("exact ChatGPT client only, preserves verified owner identity",()=>{
  assert.match(sql,/0e595d24-4691-4be6-a9b9-0716302d216a/);
  assert.match(sql,/lihuany635@gmail\.com/);
  assert.match(sql,/auth\.uid\(\)/);
  assert.doesNotMatch(sql,/cc3b5ceb-087a-4a37-bbcd-599ca4b05d62/);
  assert.match(sql,/public\.lizhi_web_is_allowed\(\) OR public\.lizhi_library_chatgpt_read_allowed\(\)/);
});
test("read policy is SELECT only, writes keep restrictive OAuth prohibition",()=>{
  assert.match(sql,/CREATE POLICY "library_chatgpt_owner_read"[\s\S]*FOR SELECT TO authenticated/);
  for(const op of ["INSERT","UPDATE","DELETE"]){
    assert.match(sql,new RegExp('CREATE POLICY "library_oauth_no_'+op.toLowerCase()+'"[\\s\\S]*AS RESTRICTIVE FOR '+op+' TO authenticated'));
  }
  assert.match(sql,/WITH CHECK \(\(auth\.jwt\(\)->>'client_id'\) IS NULL\)/);
  assert.match(sql,/USING \(user_id = \(SELECT auth\.uid\(\)\)/);
});
test("minimal fix changes neither other application schemas nor Storage",()=>{
  assert.doesNotMatch(sql,/library_official_docs|licut|storage\.objects|DROP TABLE|DELETE FROM public\.lizhi_library_items|TRUNCATE|service_role\) DO UPDATE/i);
  assert.doesNotMatch(sql,/GRANT (?:INSERT|UPDATE|DELETE) ON public\.lizhi_library_items/i);
  assert.match(sql,/COMMIT/);
});
