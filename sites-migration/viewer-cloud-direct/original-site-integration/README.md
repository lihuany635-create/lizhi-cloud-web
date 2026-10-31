# Original private Site — cloud CPU integration candidate

Use only existing project `appgprj_6ae0c336243881919e9ba2bbf450f1fb`. Live rollback baseline is saved v9/source `51a466d68012a990c9100a8d0981d1774b629b60`; source repository base is the prior v10 candidate `bd47852ea5c68da150fb459f25d92cf97970b1a4`. Latest saved number does not prove the live version.

Read `docs/ai-agent-guides/VIEWER_CLOUD_RENDER_20261031.md` for the verified scope, exact contract, resources, stop/revocation semantics and approval plan. `prepare-original-site.mjs` prepares that known original checkout, then the existing assemble/build scripts produce its Worker. It performs no deployment/push/Secrets mutation.

`viewer_get_screenshot` requires model_key + model_sha at both Site and Edge; expected_revision/avatar_id remain optional and are checked when supplied. The `/mcp` route emits genuine 640x360 JPEG image blocks and text metadata; `/api/tool` stays JSON text. Browser-upload results cannot satisfy cloud provenance. Original fifteen tool names, identity-derived owner, server Secrets, origin checks and no-retry behavior are retained.

Owner-managed `VIEWER_RENDER_DISABLED=1` on this Site can revoke new screenshot requests using existing Sites management, after applying the environment revision via private redeployment. It preserves navigation. The read-only `viewer_stop` reports the gate but does not mutate it. Requests already admitted by an older deployment and images already delivered cannot be recalled.

No private Site publication or Edge/main/Pages deployment is authorized in this preparation. Keep v9 available for rollback and get one explicit rollout approval; no personal browser or sharing button is part of the final design.
