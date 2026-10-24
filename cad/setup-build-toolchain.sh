#!/usr/bin/env bash
set -euo pipefail
rustup toolchain install 1.95.0 --profile minimal
rustup override set 1.95.0
rustup target add wasm32-unknown-unknown --toolchain 1.95.0
BASE="https://github.com/trunk-rs/trunk/releases/download/v0.22.0"
ASSET="trunk-x86_64-unknown-linux-gnu.tar.gz"
curl --fail --location --retry 3 --silent --show-error "$BASE/$ASSET" -o "$RUNNER_TEMP/$ASSET"
curl --fail --location --retry 3 --silent --show-error "$BASE/$ASSET.sha256" -o "$RUNNER_TEMP/$ASSET.sha256"
EXPECTED="$(awk 'NR==1 { print $1 }' "$RUNNER_TEMP/$ASSET.sha256")"
test "${#EXPECTED}" -eq 64
echo "$EXPECTED  $RUNNER_TEMP/$ASSET" | sha256sum --check
mkdir -p "$RUNNER_TEMP/trunk-bin"
tar -xzf "$RUNNER_TEMP/$ASSET" -C "$RUNNER_TEMP/trunk-bin"
find "$RUNNER_TEMP/trunk-bin" -type f -name trunk -exec chmod +x {} \;
BIN="$(find "$RUNNER_TEMP/trunk-bin" -type f -name trunk | head -n 1)"
test -x "$BIN"
echo "$(dirname "$BIN")" >> "$GITHUB_PATH"
