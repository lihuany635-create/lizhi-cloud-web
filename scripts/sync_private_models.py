"""Copy model-viewer content (models, previews, version list, review pages) to the
private Supabase bucket `lizhi-models`. The public site no longer serves these files.

Usage (GitHub Actions or locally):
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/sync_private_models.py [--all | FILE ...]
With --all every eligible file is uploaded; otherwise only the given repo paths.
Keys must be ASCII (Supabase storage rule); non-ASCII files are skipped and reported.
"""
import fnmatch, json, os, pathlib, sys, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1] / 'model-viewer'
PATTERNS = ['*.glb', 'current-models.json', 'nav/*.json', 'fallback-previews/*',
            'academy-preview/**', 's01-preview/**', 'revisions/**']
SKIP_SUFFIX = ('.py', '.md', '.sh', '.sql', '.zip')
TYPES = {'.glb': 'model/gltf-binary', '.json': 'application/json', '.jpg': 'image/jpeg',
         '.jpeg': 'image/jpeg', '.png': 'image/png', '.html': 'text/plain; charset=utf-8'}

def current_revision_dirs():
    models = json.loads((ROOT / 'current-models.json').read_text(encoding='utf-8'))['models']
    return {m['review_url'] for m in models if str(m.get('review_url', '')).startswith('revisions/')}

def eligible(rel, review_dirs):
    if rel.endswith(SKIP_SUFFIX) or '/scripts/' in '/' + rel:
        return False
    if rel.startswith('revisions/'):
        return any(rel.startswith(d) for d in review_dirs) and rel.endswith(tuple(TYPES))
    return any(fnmatch.fnmatch(rel, p) for p in PATTERNS) and rel.endswith(tuple(TYPES))

def upload(base, key, rel):
    data = (ROOT / rel).read_bytes()
    url = base + '/storage/v1/object/lizhi-models/' + '/'.join(urllib.parse.quote(p) for p in rel.split('/'))
    req = urllib.request.Request(url, data=data, method='POST', headers={
        'Authorization': 'Bearer ' + key, 'apikey': key, 'x-upsert': 'true',
        'Content-Type': TYPES.get(pathlib.Path(rel).suffix.lower(), 'application/octet-stream'),
        'cache-control': 'private, max-age=31536000'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.status

def main(argv):
    base, key = os.environ.get('SUPABASE_URL', '').rstrip('/'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not base or not key:
        print('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; nothing uploaded.')
        return 0
    review_dirs = current_revision_dirs()
    if argv[:1] == ['--all']:
        rels = [str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file()]
    else:
        rels = [a[len('model-viewer/'):] for a in argv if a.startswith('model-viewer/') and (ROOT / a[len('model-viewer/'):]).is_file()]
    done = skipped = 0
    for rel in sorted(set(rels)):
        if not eligible(rel, review_dirs):
            continue
        if not rel.isascii():
            print('SKIP non-ASCII key:', rel); skipped += 1; continue
        print('upload', rel, upload(base, key, rel)); done += 1
    print(f'uploaded {done}, skipped {skipped}')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
