#!/usr/bin/env bash
# Assemble the reviewed, already-compiled native Hew WebAssembly editor at the
# SAME ORIGIN as LiZhi Cloud. This never fetches or uses a model service token.
set -euo pipefail
HEW_SOURCE="${1:-.hew-model-build}"
DEST="hew-editor"
if [[ "${HEW_SOURCE}" != ".hew-model-build" ]]; then
  echo 'REFUSING_UNTRUSTED_BUILD_SOURCE' >&2; exit 2
fi
test -s "${HEW_SOURCE}/app/dist/index.html"
test -s "${HEW_SOURCE}/LICENSE"
test -f "${HEW_SOURCE}/app/dist/favicon.svg"
python3 - <<'PY'
from pathlib import Path
from html.parser import HTMLParser
import re
base=Path('.hew-model-build/app/dist')
html=(base/'index.html').read_text(encoding='utf-8')
assert 'src="./assets/' in html, 'Root-relative JS URL would break nested Hew origin'
assert 'href="./assets/' in html, 'Root-relative CSS URL would break nested Hew origin'
assert 'href="./favicon.svg"' in html, 'Nested favicon not configured'
assert 'href="./manifest.webmanifest"' in html
assert any((base/'assets').glob('*.wasm')), 'Missing native Hew WASM binary'
assert 'LIZHI_MODEL_SITE_MCP_TOKEN' not in html
assert 'SUPABASE_SERVICE_ROLE_KEY' not in html
for name in ['index.html','favicon.svg','manifest.webmanifest']:
    assert (base/name).is_file()
print('LIZHI_HEW_NESTED_ASSET_CONTRACT_PASS')
PY
if [[ -e "${DEST}" ]]; then
  # Only a generated path owned by this branch can be replaced, never a user
  # GLB model folder, CADCraft runtime or current deployed site directory.
  test -f "${DEST}/.generated-by-lizhi-hew" || {
    echo 'REFUSING_TO_OVERWRITE_NONGENERATED_HEW_EDITOR' >&2; exit 3;
  }
  rm -rf -- "${DEST}"
fi
mkdir -p "${DEST}"
cp -a "${HEW_SOURCE}/app/dist/." "${DEST}/"
cp "${HEW_SOURCE}/LICENSE" "${DEST}/AGPL-3.0.txt"
PIN=$(git -C "${HEW_SOURCE}" rev-parse HEAD)
printf 'Origin: https://github.com/lihuany635-create/lizhi-hew\nSource commit: %s\nLicense: AGPL-3.0-only\n' "${PIN}" > "${DEST}/SOURCE.txt"
printf 'Generated from pinned, independently verified Hew fork source.\n' > "${DEST}/.generated-by-lizhi-hew"
test -s "${DEST}/index.html"
test "$(find "${DEST}" -type f -name '*.wasm' | wc -l)" -ge 1
echo 'LIZHI_HEW_EDITOR_ASSEMBLED' "${PIN}"
