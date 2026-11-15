import test from 'node:test';
import assert from 'node:assert/strict';
import {makeProtectedResourceMetadata,makeUnauthorizedResponse,LEARNING_SCOPES}
  from '../oauth-resource-metadata.mjs';

test('RFC 9728 metadata declares a concrete secure resource and issuer',()=>{
  const m=makeProtectedResourceMetadata({
    resource:'https://academy.example.invalid/mcp',
    authorizationServer:'https://auth.example.invalid'
  });
  assert.equal(m.resource,'https://academy.example.invalid/mcp');
  assert.deepEqual(m.authorization_servers,['https://auth.example.invalid']);
  assert.deepEqual(m.bearer_methods_supported,['header']);
  assert.deepEqual(m.scopes_supported,LEARNING_SCOPES);
});
test('reject non-HTTPS resource, credentials and query-string tokens',()=>{
  assert.throws(()=>makeProtectedResourceMetadata({
    resource:'http://127.0.0.1:8000/mcp',authorizationServer:'https://auth.example.invalid'
  }),/INVALID_OAUTH/);
  assert.throws(()=>makeProtectedResourceMetadata({
    resource:'https://token@academy.example.invalid/mcp',authorizationServer:'https://auth.example.invalid'
  }),/INVALID_OAUTH/);
  assert.throws(()=>makeProtectedResourceMetadata({
    resource:'https://academy.example.invalid/mcp?token=secret',authorizationServer:'https://auth.example.invalid'
  }),/INVALID_OAUTH/);
});
test('401 exposes authorization discovery instead of leaking a bearer token',()=>{
 const response=makeUnauthorizedResponse({
   resourceMetadataUrl:'https://academy.example.invalid/.well-known/oauth-protected-resource'
 });
 assert.equal(response.status,401);
 assert.match(response.headers.get('www-authenticate'),/resource_metadata=/);
 assert.match(response.headers.get('www-authenticate'),/english:read/);
});
test('cannot issue a scope challenge for destructive permission',()=>{
 assert.throws(()=>makeUnauthorizedResponse({
   resourceMetadataUrl:'https://academy.example.invalid/.well-known/oauth-protected-resource',
   scope:'english:delete'
 }),/INVALID_OAUTH_CHALLENGE/);
});
