import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const [mcp, ownerTools, sql, store, work] = await Promise.all([
  readFile("supabase/functions/library-mcp/index.ts","utf8"),
  readFile("supabase/functions/library-mcp/owner-tools.ts","utf8"),
  readFile("supabase/migrations/20261103060000_library_mcp_owner_actions.sql","utf8"),
  readFile("library/library-store.js","utf8"),
  readFile("library/library-work.js","utf8"),
]);
const names = [...ownerTools.matchAll(/\bregister\("([^"]+)"/g)].map(x=>x[1]);

test("new tools are scoped to the existing independent library MCP",()=>{
  assert.match(mcp,/registerLibraryOwnerTools\(server, supabase, withRateLimit\)/);
  assert.deepEqual(names,[
    "list_official_docs","get_official_doc",
    "update_library_item","archive_library_item","restore_library_item",
    "create_official_doc","update_official_doc","archive_official_doc",
    "cloud_file_download","cloud_upload_ticket","cloud_upload_finalize",
  ]);
  assert.equal(new Set(names).size,names.length);
  assert.doesNotMatch(ownerTools,/licut|lizhi-licut/i);
  assert.doesNotMatch(sql,/licut|lizhi-licut/i);
});

test("OAuth clients require explicit owner approval; default has zero access",()=>{
  assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.lizhi_library_mcp_clients/);
  assert.match(sql,/REVOKE ALL ON public\.lizhi_library_mcp_clients FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT SELECT ON public\.lizhi_library_mcp_clients TO authenticated/);
  assert.match(sql,/c\.owner_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(sql,/c\.client_id = auth\.jwt\(\)->>'client_id'/);
  assert.match(sql,/AND \(NOT coalesce\(p_write,false\) OR c\.can_write\)/);
  assert.doesNotMatch(sql,/\bINSERT INTO public\.lizhi_library_mcp_clients\b/i);
  assert.match(sql,/No client rows are seeded/);
  assert.match(ownerTools,/lizhi_library_mcp_client_allowed/);
});

test("write RLS separated from read, all paths require owner identity",()=>{
  for(const table of ["library_items","library_official_docs"]){
    for(const op of ["read","insert","update","delete"]){
      assert.match(sql,new RegExp('CREATE POLICY ".*'+table+'.*'+op+'"'));
    }
  }
  assert.match(sql,/library_items_owner_read[\s\S]*auth\.uid\(\)[\s\S]*lizhi_library_mcp_client_allowed\(false\)/);
  assert.match(sql,/library_items_owner_insert[\s\S]*lizhi_library_mcp_client_allowed\(true\)/);
  assert.match(sql,/library_items_owner_update[\s\S]*lizhi_library_mcp_client_allowed\(true\)/);
  assert.match(sql,/library_items_owner_delete[\s\S]*lizhi_library_mcp_client_allowed\(true\)/);
  assert.match(sql,/lizhi_library_objects_owner_read[\s\S]*bucket_id='lizhi-library'/);
  assert.match(sql,/lizhi_library_objects_owner_insert[\s\S]*bucket_id='lizhi-library'/);
  assert.match(sql,/\(storage\.foldername\(name\)\)\[1\] = \(SELECT auth\.uid\(\)\)::text/);
  assert.doesNotMatch(sql,/create policy[\s\S]*to public[\s\S]*using \(true\)/i);
});

test("supersedes already deployed read-only OAuth hotfix without leaving restrictive write blockers",()=>{
  for (const policy of ["library_chatgpt_owner_read","library_oauth_no_insert",
    "library_oauth_no_update","library_oauth_no_delete"]) {
    assert.match(sql, new RegExp('DROP POLICY IF EXISTS "'+policy+'"'));
  }
  assert.match(sql, /DROP FUNCTION IF EXISTS public\.lizhi_library_chatgpt_read_allowed\(\)/);
  assert.match(sql, /CREATE POLICY "library_items_owner_update"[\s\S]*lizhi_library_mcp_client_allowed\(true\)/);
});

test("candidate preserves existing web auth and does not access other services",()=>{
  assert.match(sql,/public\.lizhi_web_is_allowed\(\) OR public\.lizhi_library_mcp_client_allowed\(false\)/);
  assert.match(sql,/public\.lizhi_web_is_allowed\(\) OR public\.lizhi_library_mcp_client_allowed\(true\)/);
  assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.lizhi_web_is_allowed\(/);
  assert.doesNotMatch(ownerTools,/service_role|SUPABASE_SERVICE|secretKey|SUPABASE_SECRET|\.rpc\("execute_sql"/i);
  assert.doesNotMatch(ownerTools,/Google_Drive|github\.com|external.*upload/i);
  assert.match(ownerTools,/const BUCKET="lizhi-library"/);
});

test("soft-archive is opt-in and never deletes original files",()=>{
  assert.match(ownerTools,/archive_library_item[\s\S]*confirm:z\.literal\(true\)/);
  assert.match(ownerTools,/archive_official_doc[\s\S]*confirm:z\.literal\(true\)/);
  assert.match(ownerTools,/restore_library_item[\s\S]*confirm:z\.literal\(true\)/);
  assert.doesNotMatch(ownerTools,/\.storage\.from\([^)]*\)\.remove\(/);
  assert.doesNotMatch(ownerTools,/\.delete\(\)/);
  assert.match(ownerTools,/expected_updated_at/);
});

test("upload requires real file verification, cannot claim ticket as finished upload",()=>{
  assert.match(ownerTools,/createSignedUploadUrl\(path\)/);
  assert.match(ownerTools,/uploaded:false/);
  assert.match(ownerTools,/\.storage\.from\(BUCKET\)\.info\(path\)/);
  assert.match(ownerTools,/Number\(info\.size\)!==size/);
  assert.match(ownerTools,/extract_status:"none"/);
  assert.match(ownerTools,/\.createSignedUrl\(data\.storage_path,60\)/);
  assert.match(ownerTools,/const MAX_SIZE=50\*1024\*1024/);
});

test("existing library and document workflows are not modified",()=>{
  assert.match(store,/const BUCKET="lizhi-library"/);
  assert.match(work,/const TABLE="lizhi_library_official_docs"/);
  assert.doesNotMatch(ownerTools,/window\.|navigator\.|showDirectoryPicker|fileSystemAccess/i);
});
