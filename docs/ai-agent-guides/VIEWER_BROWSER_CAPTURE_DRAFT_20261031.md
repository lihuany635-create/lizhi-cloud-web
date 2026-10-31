# 3D Viewer Browser Capture Draft (2026-10-31)

This is a **development draft**, not a deployed feature. The original 3D viewer already renders WebGL and has historical JPEG capture tests. The current cloud-direct screenshot tool cannot render on the server.

The branch adds an opt-in, time-limited browser snapshot sender, restricted snapshot receipts, cloud readback for matching model SHA / avatar / scene revision, and a helper for returning MCP image content. Existing avatar movement continues to use the cloud navigation API. The original model files remain unchanged.

**Not tested:** a live logged-in browser with WebGL, applying the database migration, a deployed private Site integration, end-to-end image delivery, or screenshot content quality. Neither production deployment nor official acceptance is authorized.

Next: review SQL and browser privacy behavior, run existing Node and Chromium tests on the branch, verify an actual JPEG reaches the model as an image, and request separate approval before production database / Edge / Site / Pages changes. A running logged-in browser is required for screenshot capture. The old cloud-only error remains in production until deployment.

## 2026-10-31 fixes (still draft, not deployed)

- **Revocation result is shown on screen.** Stopping sharing deletes the last cloud frame; if that delete fails the page says so ("未能刪除…") and the button becomes「重試刪除雲端畫面」. "Stopped" is only reported after a confirmed delete (`revoked: true`).
- **Frames expire automatically.** New SQL function `lizhi_viewer_cloud_snapshot_purge(seconds)` (min 60 s; service role only, not callable from browsers). It runs on every upload (frames > 5 min), on every MCP screenshot read (frames > 90 s, the same window the Edge accepts), and every 5 minutes via pg_cron when the extension is available (migration enables it if allowed; otherwise a NOTICE and the two other sweeps still apply).
- **Tests:** SQL isolation test covers purge permissions, age floor and upload sweep; the WebGL bridge test covers failed revoke → visible error → retry → confirmed delete (verified to fail on the previous viewer code). Local bridge waits use plain polling because in-frame `waitForFunction` starved under the software WebGL renderer.
- **Still NOT_TESTED:** real login/RLS, production migration, Edge deploy, private Site image return, ChatGPT image recognition.
