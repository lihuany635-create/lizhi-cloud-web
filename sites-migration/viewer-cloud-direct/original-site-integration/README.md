# Original Site integration candidate (not published)

Source Site: appgprj_6ae0c336243881919e9ba2bbf450f1fb, v9 source 51a466d68012a990c9100a8d0981d1774b629b60.
Retrieved through Sites source helper on 2026-10-31. Owner-only custom access (one owner, zero external visitors) verified; unchanged. No credentials are packaged here.

Replace upstream/cloud-site-server.mjs with this candidate (restore its imports to ./cloud-nav-v9/), and copy parent site-cloud-direct-{mcp,tools}.mjs into upstream/cloud-nav-v9/. Assemble with existing scripts/assemble.mjs. This retains original authentication, Secrets, 15 tools and /mcp. Only /mcp uses image blocks; /api/tool remains JSON text. Use existing Site source only; do not create a Site.

Deployment order after explicit owner approval: apply snapshot migration; verify cleanup scheduler availability/active job and actual successful execution (or explicitly accept no guaranteed deletion deadline); deploy Edge; merge PR and await Pages; assemble and privately republish the same Site. Keep sharing disabled until real-account acceptance. Never enable paid services.

Rollback: disable browser sharing and confirm pending revokes; restore Pages previous main and Edge v3; privately deploy existing Site v9 saved version. Retain additive SQL schema for investigation rather than dropping evidence automatically; disable the named cron job only with approval. SQL removal requires a separate data-aware rollback. Preserve GLB and avatar data. Real owner login, cross-user denial, 90s expiry, SHA/revision/avatar mismatches, stopped share, cleanup and ChatGPT image recognition remain NOT_TESTED until live deployment.
