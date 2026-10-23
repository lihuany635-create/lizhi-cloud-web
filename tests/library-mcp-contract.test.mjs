import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const functionSource = await readFile("supabase/functions/library-mcp/index.ts", "utf8");
const migrationSource = await readFile(
  "supabase/migrations/20261023140244_library_readonly_mcp.sql",
  "utf8",
);
const configSource = await readFile("supabase/config.toml", "utf8");
const consentSource = await readFile("oauth/consent/consent.js", "utf8");

test("exposes exactly the four requested read-only tools", () => {
  const names = [...functionSource.matchAll(/server\.registerTool\(\s*\n\s*"([^"]+)"/g)]
    .map((match) => match[1]);
  assert.deepEqual(names, ["list", "search", "get_excerpt", "status"]);
  assert.equal((functionSource.match(/readOnlyHint:\s*true/g) || []).length, 1);
  assert.match(functionSource, /destructiveHint:\s*false/);
  assert.match(functionSource, /_meta:\s*\{ securitySchemes: oauthSecurity \}/);
});

test("does not create privileged clients or expose original-file paths", () => {
  assert.doesNotMatch(functionSource, /service_role|SUPABASE_SECRET|supabaseAdmin/i);
  assert.doesNotMatch(functionSource, /\.storage\s*\.|storage_path|device_path|computer_path/);
  assert.doesNotMatch(functionSource, /registerTool\([\s\S]{0,80}"(?:delete|remove|update|write|download)/i);
});

test("requires user OAuth middleware, protected-resource discovery and origin checks", () => {
  assert.match(functionSource, /withOAuthProtectedResource\(\{/);
  assert.match(functionSource, /authorizationServer:\s*fromSupabaseUrl\(SUPABASE_URL\)/);
  assert.match(functionSource, /withSupabase\(\{ auth: "user" \}\)/);
  assert.match(functionSource, /Origin not allowed/);
  assert.match(configSource, /\[functions\.library-mcp\][\s\S]*verify_jwt\s*=\s*false/);
  assert.match(configSource, /allow_dynamic_registration\s*=\s*true/);
});

test("database layer keeps RLS queries invoker-scoped and rate state private", () => {
  assert.match(migrationSource, /create schema if not exists lizhi_private/i);
  assert.match(migrationSource, /revoke all on schema lizhi_private from public, anon, authenticated/i);
  assert.match(migrationSource, /security definer[\s\S]*auth\.uid\(\)/i);
  assert.match(migrationSource, /lizhi_library_mcp_search[\s\S]*security invoker/i);
  assert.match(migrationSource, /lizhi_library_mcp_status[\s\S]*security invoker/i);
  assert.match(migrationSource, /grant execute[\s\S]*to authenticated/i);
});

test("consent page preserves the authorization id and allows explicit approve or deny", () => {
  assert.match(consentSource, /authorization_id/);
  assert.match(consentSource, /getAuthorizationDetails/);
  assert.match(consentSource, /approveAuthorization/);
  assert.match(consentSource, /denyAuthorization/);
  assert.match(consentSource, /lihuany635@gmail\.com/);
});
