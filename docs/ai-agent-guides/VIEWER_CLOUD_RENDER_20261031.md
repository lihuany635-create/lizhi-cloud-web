# 3D Viewer cloud render (2026-10-31) — draft, not deployed

Goal: `viewer_get_screenshot` returns a real JPEG of the current cloud scene with no owner
computer, browser, GPU or sharing button involved.

## How it works

- `supabase/functions/lizhi-viewer-cloud/render.mjs` is a CPU rasteriser (z-buffer, near-plane
  clipping, flat shading with sun + hemisphere light, translucent pass). It parses the canonical
  GLB from the private `lizhi-models` bucket, SHA-verified, and places it in viewer coordinates
  (glTF world space shifted so the lowest vertex is y = 0; same rule as the web viewer and nav grid).
- Camera = the web viewer's cloud-follow camera for the avatar: eye = feet + 1.6 m;
  direction from yaw/pitch; `first` looks from the eye, `third`/`free`/`top` sit 3.2 m behind and
  0.5 m above, looking at the eye. Vertical FOV 45°, 640×360. Other avatars are drawn as
  mannequins (selected avatar hidden in first person).
- `jpeg-encoder.mjs` is the vendored jpeg-js 0.4.4 baseline encoder (BSD-3, header kept).
- Parsed geometry and GLB bytes are cached per warm isolate (one model), so repeated screenshots
  do not re-download the model.

## Tool contract (`viewer_get_screenshot`)

Args: `model_key`, `model_sha` (required), optional `expected_revision`, optional `avatar_id`
(default: selected avatar). Unknown args are rejected.

Success: `{ok:true, real_screenshot:true, render_attested:true, requires_browser:false,
source:'cloud_cpu_render', model_key, model_sha, revision, avatar_id, camera{mode,position,target,
vfov_deg,width,height,eye_height_m}, captured_at, triangles_drawn, image{mimeType:'image/jpeg',data},
limitations}`. Rendered on demand from the scene row read in the same request, so a frame can
never belong to an older state. Nothing is stored.

Refusals: `REVISION_CONFLICT` (expected_revision differs), `NO_AVATAR_FOR_SCREENSHOT`,
`MODEL_VERSION_CONFLICT` (SHA not current), `INVALID_ARGUMENTS`, `CLOUD_RENDER_REVOKED`
(owner kill switch: Edge secret `LIZHI_VIEWER_RENDER_DISABLED=1`).

## Evidence (local, 2026-10-31)

- Same gate camera rendered by this module and by the real WebGL viewer (Chromium bridge):
  same corridor, door and arched windows, same framing.
- Deno timing: academy first frame after cold start ≈ 0.41 s parse + 0.38 s render/encode;
  warm 0.1–0.4 s; all five models < 0.5 s per frame. Edge CPU limit is 2 s.
- Unit tests: render on demand, metadata, two avatars give different frames, one GLB download
  for several frames, MCP image block, revision / avatar / SHA / extra-arg refusals, kill switch.

## Private Site changes still required (must be done through ChatGPT Sites)

1. `/mcp` `tools/call` must return `viewerCloudToMcpContent(value)` (text metadata + image block),
   see `sites-migration/viewer-cloud-direct/original-site-integration/cloud-site-server.mjs`.
2. Replace the `viewer_get_screenshot` description/schema with the one in
   `sites-migration/viewer-cloud-direct/site-cloud-direct-tools.mjs` (model_key + model_sha required,
   optional expected_revision / avatar_id).
3. Keep URL, the 15 tools, `/mcp`, owner auth, Secrets and Private settings unchanged.

## Limits

No textures, shadows, reflections or glass refraction; textured materials use a neutral tone.
Third-person cameras can end up inside walls (same as the web viewer, no camera collision).
The browser "共享 AI 巡查畫面" upload path is no longer read by the Edge; it can be removed later.

## NOT_TESTED

Edge deployment and timing on Supabase, Site integration, ChatGPT actually seeing the image,
and the full acceptance run with the owner's computer off.
