# Lizhi Cloud CAD — staged OAuth 2.1 and MCP deployment gate

**Status (2026-10-24): CODE/CI ONLY. NO LIVE DEPLOYMENT.**
Do not run against live Lizhi Supabase until explicitly approved.
CAD users must eventually operate via **ordinary ChatGPT dialogue**, without ChatGPT Work or their own PC.

## What has been tested
- Official CADCraft v0.12.0 Linux binary through loopback MCP and disposable PostgreSQL 16 + Moto S3 HTTP (Actions 40093445080). Temporary Linux E2E, not production.
- Authenticated MCP project grant checks, signed RS256 OAuth-client JWT, OAuth resource discovery, revoked grants and permission denial through actual PostgreSQL 16 + local HTTP (Actions 40095274596).
- Node 20/22 CAD contracts **79/79 each** (Actions 40095400844).
- These do NOT verify the live Supabase project's OAuth settings, ChatGPT login handshake, permanent host, or production storage.

## Critical OAuth compatibility findings
- Supabase Auth OAuth Server supports PKCE authorization code, consent UI, OAuth client IDs, JWKS, and discovery.
- **Custom cad:read/cad:write OAuth scopes are not supported** as of documentation checked 2026-10-24. Do not advertise them or require them. Supabase documents openid, email, profile, and phone scopes.
- Server-side PostgreSQL grants are scoped to owner UUID + project ID + verified OAuth client_id. Read-only clients cannot create/modify; revocation is immediate independent of JWT expiry.
- Strict staging host requires signed RS256/ES256 tokens and client_id. A legacy HS256 project with empty asymmetric JWKS cannot use this verifier without an approved migration or separately verified strategy.
- A normal Supabase login JWT without OAuth client_id is not an authenticated MCP client session.
- ChatGPT needs resource metadata at GET https://CAD_HOST/.well-known/oauth-protected-resource, a 401 WWW-Authenticate challenge, and a PKCE-enabled OAuth 2.1 authorization server. The consent UI is separate. This repo hosts the protected-resource side, NOT the authorization server.
- Never substitute a static API key, shared service key or fake ChatGPT session for the production OAuth flow.

## Staging modules
- cloud-cad-mcp-host.cjs: binds verified user identity, OAuth client ID, Postgres ACL, durable queue/intents and MCP HTTP.
- cloud-cad-mcp-server.cjs: loopback-only staging entrypoint; CAD_DEPLOYMENT_MODE=staging is mandatory.
- sql/001_staging_cad_oauth_grants.sql: deny-by-default privileges/RLS, no browser-accessible grant RPC.
- The API host supports submit/status only. A separate CADCraft Worker and S3/object store are necessary to complete jobs.
- This owner-scoped data model is not a fully collaborative cross-user workspace.

## Staging run instructions — NEVER live Supabase
1. Start an isolated PostgreSQL database. Apply sql/000_staging_cloud_cad_jobs.sql and sql/001_staging_cad_oauth_grants.sql only there.
2. Provision project grants from a trusted admin backend only after verifying project ownership; NEVER from raw user input or JWT user_metadata.
3. Configure an isolated Supabase Auth OAuth 2.1 project, asymmetric signing keys, and user-facing OAuth consent UI. Verify JWKS/authorization-server discovery.
4. Provide a separate TLS reverse proxy for public HTTPS. Add rate limits, request/timeouts, redacted audit logs, proxy identity and origin controls. The Node entrypoint binds 127.0.0.1 only and has no TLS listener.
5. Keep DB credentials in the host secret manager; do not commit or display tokens.
6. Install a pinned pg runtime dependency and start the private MCP server in staging.

Environment placeholders:
    CAD_DEPLOYMENT_MODE=staging
    CAD_MCP_LOOPBACK_PORT=9876
    CAD_PUBLIC_RESOURCE_URL=https://cad.staging.example.test/mcp
    CAD_OAUTH_ISSUER=https://STAGING_PROJECT.supabase.co/auth/v1
    CAD_STAGING_DATABASE_URL=SECRET_FROM_STAGING_SECRET_MANAGER
    CAD_ALLOWED_ORIGINS=https://chatgpt.com

Start via:
    node engineering/cad/cloud-cad-mcp-server.cjs

## Acceptance & rollback
- Resource discovery advertises the exact HTTPS resource and trusted issuer; 401 includes resource_metadata.
- ChatGPT authenticates using interactive OAuth 2.1 PKCE and consent, using a staging issuer, and the verified access token carries an approved client_id.
- Test unauthorized user, unrelated project, read-only client, revoked client, and spoofed clientId.
- Repeat create → status → Linux CADCraft DXF/SVG/PNG → revision 1 → edit revision 2 → readback while personal Windows is OFF.
- Confirm audit, timeouts, storage quotas, cancellation, heartbeat, backup, object lifecycle, rollback and cost limits.
- Fail closed and rollback on broken OAuth identity binding or unexpected permissions. No automatic production migrations or paid resources.

References:
- https://developers.openai.com/plugins/build/auth
- https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- https://supabase.com/docs/guides/auth/oauth-server/oauth-flows
- https://supabase.com/docs/guides/auth/jwts
