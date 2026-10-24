"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {parseConfig}=require("./cloud-cad-mcp-server.cjs");
const env={
 CAD_DEPLOYMENT_MODE:"staging",CAD_MCP_LOOPBACK_PORT:"9876",
 CAD_PUBLIC_RESOURCE_URL:"https://cad.example.test/mcp",
 CAD_OAUTH_ISSUER:"https://id.example.test/auth/v1",
 CAD_STAGING_DATABASE_URL:"postgres://ci:secret@127.0.0.1:5432/cad_ci",
 CAD_ALLOWED_ORIGINS:"https://chatgpt.com,https://example.test"
};
test("accepts trusted staging configuration with an HTTPS OAuth authority",()=>{
 const x=parseConfig(env);
 assert.equal(x.port,9876);
 assert.deepEqual(x.allowedOrigins,["https://chatgpt.com","https://example.test"]);
 assert.equal(x.authorizationServer,"https://id.example.test/auth/v1");
});
test("refuses absent staging approval",()=>{
 for(const mode of [undefined,"production","development","", "PRODUCTION"])
  assert.throws(()=>parseConfig({...env,CAD_DEPLOYMENT_MODE:mode}),{code:"CAD_STAGING_ONLY"});
});
test("rejects missing or non-HTTPS resource and OAuth issuer",()=>{
 for(const change of [
  {CAD_PUBLIC_RESOURCE_URL:"http://localhost/mcp"},
  {CAD_PUBLIC_RESOURCE_URL:"https://cad.example.test/wrong"},
  {CAD_OAUTH_ISSUER:"http://localhost/auth/v1"},
  {CAD_OAUTH_ISSUER:"https://identity.test/not-auth"},
  {CAD_ALLOWED_ORIGINS:"https://safe.test,https://evil.test/path"},
  {CAD_STAGING_DATABASE_URL:""},
  {CAD_MCP_LOOPBACK_PORT:"0"},
  {CAD_MCP_LOOPBACK_PORT:"65536"}
 ])assert.throws(()=>parseConfig({...env,...change}));
});
