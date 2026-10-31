# 3D Viewer cloud CPU render — deployment candidate, NOT deployed

Goal: the original fifteen MCP tools manage cloud avatars and return a JPEG rendered from the private canonical GLB while the owner's computer and personal browser are off. No browser-upload fallback is read. The original Site and single `/mcp` are retained.

## Contract and provenance

`viewer_get_screenshot` requires `model_key` (2–80 lowercase letters/digits/underscore/hyphen) and `model_sha` (64 lowercase hex). Omission is rejected by BOTH Site and Edge before rendering; the AI first reads `viewer_list_models` and `viewer_get_scene`. Optional `expected_revision` and `avatar_id` default only the avatar to the selected avatar. Missing avatars are refused, never invented.

Success contains `source:'cloud_cpu_render'`, `requires_browser:false`, `real_screenshot:true`, `render_attested:true` (server-produced, not an independent cryptographic attestation), model key/SHA, scene revision, avatar ID, camera position/target/mode/FOV/dimensions, capture timestamp, limitations and an image/jpeg. The Site validates the request-bound metadata and actual JPEG markers/dimensions and emits separate MCP text and `type:'image'` blocks. Bad images are never echoed as base64 text. Browser-upload images are explicitly refused by the Site candidate.

The Edge reads the owner-isolated scene, SHA-verifies the private GLB, renders its geometry, and checks the scene revision and a freshly loaded canonical manifest again before returning. A concurrent scene/model change returns a conflict without an image. No frame is stored.

## Geometry and camera

GLB node matrix/TRS transforms are applied in glTF world space; the model's lowest vertex is shifted to y=0, matching the viewer/nav convention. Position is in metres, +Y up. The CPU rasteriser has a z-buffer, near-plane clipping, base colors, sun/hemisphere light and a translucent pass. Unsupported skinning/morph/compressed/non-triangle primitives and invalid accessors/indices/empty geometry fail closed instead of returning an unrelated sky image.

First person: feet+[0,1.6,0], yaw/pitch look direction. Third: 3.2m behind that direction and 0.5m above, aimed at the eye. Top: 10m above the eye, looking down (45-degree perspective). The original web cloud-follow top mode was a third-person alias; this candidate corrects cloud top mode. `free` retains the existing third-person fallback because this tool contract has no independent free-camera position/target fields; this is disclosed in response limitations. Other avatars use simple geometric mannequins; selected avatar is hidden in first person.

No textures, shadows, reflections, glass refraction or camera collision. These are inspection-quality geometry views, not photorealistic output or proof that all rooms have been inspected.

## Resources and errors

- Bounded streamed private download: at most 16 MiB; no redirects, no public model URL, actual bytes must match the requested canonical SHA.
- At most 300,000 triangles; accessor allocation and bounds are checked before large geometry arrays are made. All five current canonical models fit (39,590–172,214 triangles).
- One render admitted per isolate, no render queue; overlap returns `CLOUD_RENDER_BUSY`. Cache retains one verified model; old model references are cleared before replacement. This is not a global rate limiter across isolates.
- Cooperative parse/render wall-time checks (700/900ms respectively) fail with `CLOUD_RENDER_BUDGET_EXCEEDED`. JPEG encoding has fixed dimensions and is synchronous. These checks are NOT proof of staying within Supabase's actual 2s CPU limit. The hosted runtime must be measured after approval.
- Reused JPEG encoder lookup tables avoid rebuilding ~65k bitcode entries per frame; writer state resets for each image and output buffers are released. BSD-3/vendor notices remain in `jpeg-encoder.mjs`.
- Unexpected upstream/network exceptions are sanitized; only internal errors and an explicit render-error allowlist are returned. No token/URL/error body is exposed.

## Stop and revocation — do not call the old stop no-op a revocation

`viewer_stop` remains a read-only report: no persistent queue exists. It does not change authorization or undo delivered images/committed writes.

Two owner-managed controls exist:
1. Existing Edge `LIZHI_VIEWER_RENDER_DISABLED=1` denies cloud rendering. It is checked before rendering and before return. Management-tool support for changing Edge secrets is not exposed in this session.
2. The Site integration candidate adds `VIEWER_RENDER_DISABLED=1`, denying screenshot calls before any upstream request while preserving status/navigation. The existing Sites `update_environment_variables` tool can set this single key; redeploy the saved private Site version to apply that environment revision. AI can perform this authorized administrative test; the user need not enter any key or run a personal browser. Restore the prior key value (or remove it if originally absent) and redeploy after the test. These production setting changes require the rollout approval.

Requests admitted by an old version before a configuration deployment, and images already delivered, cannot be recalled. A new screenshot request after the gate revision is active must be refused; test this explicitly.

## Evidence checked in this review

- Baseline `b9880061e2f619d99f3fb4ecf37634bfaf82d623`: GitHub CI 41170327025/job124446695653 explicitly records 19 tests / 19 pass. Local rerun matched. The PR body's former “90/90” has no matching independently located run and is not adopted.
- Revised candidate: run the exact command in `.github/workflows/viewer-cloud-direct-qa.yml`; local result 33/33, including original navigation, original Worker route, required/optional fields, stale in-flight revision/manifest, JPEG provenance/dimensions, revoke gate, download limits/SHA/network failures and lock recovery, geometry transforms, camera differences and encoder reuse.
- Original Site checkout based on `bd47852ea5c68da150fb459f25d92cf97970b1a4`: prepared with the reproducible script below; original + new contract suites 18/18, assemble/build/ESM validation PASS. These use mock upstream fixtures and are not production image receipt.
- `scripts/viewer-cloud-render-qa.mjs`: five local Node processes, one current SHA-verified model each, five frames each with a synthetic QA avatar/camera. Parse 32–77ms; encode/render 40–267ms per frame; end-of-run process RSS 122–186 MiB in this run. Node RSS includes runtime allocations and is NOT the Supabase isolate's peak memory. First-model parse+frame is NOT a measurement of full cloud cold start. Reports explicitly label this scope.
- The actual 640x360 academy JPEG was opened and visually checked: corridor, doorway and side windows visible. First/third/top images differ. This is local geometry-render evidence only, not a current production avatar or ChatGPT MCP receipt.
- Formal model list SHA agrees with the five local GLBs. At review time academy has revision25 and zero avatars; no production avatar, GLB, scene or checkpoint was changed.

## Original Site integration preparation

Sites tools are available. Exact Site ID `appgprj_6ae0c336243881919e9ba2bbf450f1fb`, one owner, no external visitors, access revision1. Latest SAVED version10 is not live version10: rollback deployment `appgdep_6ae56def65588191bc75b82e7c20f856` succeeded for saved v9/source `51a466d68012a990c9100a8d0981d1774b629b60`. Source repository HEAD is the earlier v10 candidate `bd47852ea5c68da150fb459f25d92cf97970b1a4`.

After the source helper opens that SAME Site, run:

```
node sites-migration/viewer-cloud-direct/original-site-integration/prepare-original-site.mjs <existing-site-checkout>
```

It asserts Site identity and the known source base, preserves the original authentication and full safety suite, copies only reviewed schema/adapter/server/page files, and generates a synthetic JPEG test fixture. It never pushes, publishes, changes Secrets or creates a Site. Then run `npm test`, `node scripts/assemble.mjs`, `npm run build`, `npm run validate` inside that checkout. The informational page is corrected to describe cloud CPU capture; no connection/share button is added.

## Approval plan, backup and rollback

No formal rollout is authorized by this review. Lock the exact latest PR47 SHA and CI result before approval/deployment.

1. Verify/refresh backup of production Edge v5 (all three original files), current Pages main `77edd4a6aedb3361e6dc1dcbd5cce8c5033239dc`, original saved Site v9 plus its private access/config revision, and the source base. No new migration is required for this renderer. Existing browser snapshots/cron are not read by it and are not deleted without separate approval.
2. Deploy the reviewed five-file Edge bundle (index/nav/render/jpeg-encoder/deno), keeping existing authentication/Secrets. Measure actual cold request, repeated frames and model switches on Supabase; any resource/security failure stops rollout and restores Edge v5. Mock/Node/Deno timings cannot pass this gate.
3. Merge only the approved PR47 head. The existing Pages workflow may republish; verify exact merge SHA, private-file exclusions and unchanged canonical GLBs/index (no model-viewer source changes are proposed here).
4. Prepare/package and privately republish the SAME Site. Verify fifteen schemas, required screenshot fields, original `/mcp`, access revision and Secrets. No parallel Site or duplicate tool.
5. Use true owner MCP identity, with the personal browser closed/unneeded. The AI may create/clean up one explicitly approved temporary TEST avatar (academy is currently empty), read revision/SHA, walk and set first/third/top views, request fresh JPEGs and inspect actual MCP image blocks in ChatGPT. Verify different cameras/avatars change frames. Negative tests: absent/wrong owner, SHA/revision/avatar mismatch, invalid JPEG and disabled gate; perform authorized gate disable/restore through Sites management and verify normal navigation is preserved. No personal browser, sharing button, user key entry or browser upload is required.

Rollback is Edge v5 + original saved Site v9, with the prior single gate-key value restored; restore previous Pages source if necessary. Do not automatically drop SQL tables, delete production avatars/models or enable a paid service. Retain test request IDs and readback evidence. Formal acceptance must remain NOT_TESTED until actual owner ChatGPT receives and recognizes the cloud image.

## Cost and outstanding limits

No new paid renderer, GPU, website, database, subscription or billing setting is introduced. Rendering uses existing Edge CPU, private Storage downloads, two scene reads and fresh manifest reads per screenshot, plus existing Site/API/egress allowances. This may consume quota; zero charges or future capacity are not guaranteed. Actual hosted performance, quota usage, cross-account denial and full ChatGPT image acceptance remain NOT_TESTED. Independent review is still pending.
