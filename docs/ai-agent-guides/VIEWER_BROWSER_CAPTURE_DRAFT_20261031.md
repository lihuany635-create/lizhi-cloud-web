# 3D Viewer Browser Capture Draft (2026-10-31)

This is a **development draft**, not a deployed feature. The original 3D viewer already renders WebGL and has historical JPEG capture tests. The current cloud-direct screenshot tool cannot render on the server.

The branch adds an opt-in, time-limited browser snapshot sender, restricted snapshot receipts, cloud readback for matching model SHA / avatar / scene revision, and a helper for returning MCP image content. Existing avatar movement continues to use the cloud navigation API. The original model files remain unchanged.

**Not tested:** a live logged-in browser with WebGL, applying the database migration, a deployed private Site integration, end-to-end image delivery, or screenshot content quality. Neither production deployment nor official acceptance is authorized.

Next: review SQL and browser privacy behavior, run existing Node and Chromium tests on the branch, verify an actual JPEG reaches the model as an image, and request separate approval before production database / Edge / Site / Pages changes. A running logged-in browser is required for screenshot capture. The old cloud-only error remains in production until deployment.

## 2026-10-31 fixes (still draft, not deployed)

- **Revocation result is shown on screen.** Stopping sharing deletes the last cloud frame; if that delete fails the page says so ("未能刪除…") and the button becomes「重試刪除雲端畫面」. "Stopped" is only reported after a confirmed delete (`revoked: true`).
- **Read expiry and physical deletion are separate.** New SQL function `lizhi_viewer_cloud_snapshot_purge(seconds)` (min 60 s; service role only, not callable from browsers). It runs on every upload (frames > 5 min), on every MCP screenshot read (frames > 90 s, the same window the Edge accepts), and every 5 minutes via pg_cron when the extension is available (migration enables it if allowed; otherwise a NOTICE and the two other sweeps still apply).
- **Tests:** SQL isolation test covers purge permissions, age floor and upload sweep; the WebGL bridge test covers failed revoke → visible error → retry → confirmed delete (verified to fail on the previous viewer code). Local bridge waits use plain polling because in-frame `waitForFunction` starved under the software WebGL renderer.
- **Still NOT_TESTED:** real login/RLS, production migration, Edge deploy, private Site image return, ChatGPT image recognition.

## Retention policy — no guaranteed physical deletion deadline

- Edge rejects frames older than 90 seconds, or mismatching model SHA, revision or selected avatar. Read expiry does not prove deletion.
- Confirmed revoke deletes the matching model/SHA frame. Failed revoke retains that immutable target for explicit retry, even after switching models. Multiple pending targets are drained separately; one success cannot clear another failure.
- Successful uploads delete frames older than 300 seconds; MCP screenshot reads attempt a 90-second sweep. Failed/rolled-back requests do not prove a sweep committed.
- Optional pg_cron runs every five minutes and deletes frames older than five minutes. With healthy execution a frame can remain nearly ten minutes; scheduler delay/failure can extend that. There is no hard physical deletion deadline.
- Without an active successful scheduler and without further successful upload/read/revoke activity, frames can remain indefinitely, including after unexpected tab closure. Closing a tab is not confirmed revocation. Pending retries are in memory and do not survive page closure.
- Before formal enablement, inspect cron.job for the exact named job, active=true, schedule and command, then cron.job_run_details for a successful actual run and confirm expired fixture deletion. The current SQL CI reports pg_cron unavailable: it verifies fallback cleanup only. Do not report cron execution PASS from that CI.
