# 3D Viewer Browser Capture Draft (2026-10-31)

This is a **development draft**, not a deployed feature. The original 3D viewer already renders WebGL and has historical JPEG capture tests. The current cloud-direct screenshot tool cannot render on the server.

The branch adds an opt-in, time-limited browser snapshot sender, restricted snapshot receipts, cloud readback for matching model SHA / avatar / scene revision, and a helper for returning MCP image content. Existing avatar movement continues to use the cloud navigation API. The original model files remain unchanged.

**Not tested:** a live logged-in browser with WebGL, applying the database migration, a deployed private Site integration, end-to-end image delivery, or screenshot content quality. Neither production deployment nor official acceptance is authorized.

Next: review SQL and browser privacy behavior, run existing Node and Chromium tests on the branch, verify an actual JPEG reaches the model as an image, and request separate approval before production database / Edge / Site / Pages changes. A running logged-in browser is required for screenshot capture. The old cloud-only error remains in production until deployment.
