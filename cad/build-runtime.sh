#!/usr/bin/env bash
# Build the actual CADCraft WASM bundle into the existing LiZhi Cloud Pages tree.
# Build-time compilation only; no remote CAD engine, user drawing uploads or secrets.
set -euo pipefail
CAD_REF="6873f47bfc5228c91d4b59bf869c5cb2b1c1ea1d"
CAD_REPO="https://github.com/lihuany635-create/lizhi-cad.git"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT
git clone --filter=blob:none --no-checkout "$CAD_REPO" "$TEMP_DIR/source"
git -C "$TEMP_DIR/source" fetch --depth 1 origin "$CAD_REF"
git -C "$TEMP_DIR/source" checkout --detach "$CAD_REF"
test "$(git -C "$TEMP_DIR/source" rev-parse HEAD)" = "$CAD_REF"
# The source lives outside the checkout's rustup override; pin its build toolchain explicitly.
export RUSTUP_TOOLCHAIN=1.95.0
(cd "$TEMP_DIR/source/apps/cadcraft-web" && trunk build --release)
WEB="$TEMP_DIR/source/dist/web"
test -s "$WEB/index.html"
test "$(find "$WEB" -maxdepth 1 -name '*.wasm' -type f | wc -l)" -ge 1
test "$(find "$WEB" -maxdepth 1 -name '*.js' -type f | wc -l)" -ge 1
grep -q "立之 CAD" "$WEB/index.html"
mkdir -p cad/runtime
find cad/runtime -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a "$WEB"/. cad/runtime/
printf '{"repository":"lihuany635-create/lizhi-cad","sourceSha":"%s","build":"trunk build --release","mode":"same-origin-static-wasm","remoteCadWorker":false,"saveAckProtocol":2,"engineDurableAck":true}\n' "$CAD_REF" > cad/runtime/build-source.json
test -s cad/runtime/build-source.json
du -sh cad/runtime
echo "LiZhi CAD WASM + correlated save-ack compiled from pinned source $CAD_REF"
