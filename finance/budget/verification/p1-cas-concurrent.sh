#!/usr/bin/env bash
# Isolated test only: uses the CI PostgreSQL service seeded by p1-isolated-verify.sql.
set -euo pipefail
export PGPASSWORD="${PGPASSWORD:?test-only PGPASSWORD required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TMPDIR_CAS="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_CAS"' EXIT

SQL="set role authenticated;
set \"request.jwt.claim.sub\"='11111111-1111-4111-8111-111111111111';
set \"test.allowed\"='true';
update public.lizhi_finance_budgets set amount=13000,version=version+1
where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and version=2 returning id;"

psql -h 127.0.0.1 -U postgres -d finance_p1_verify -v ON_ERROR_STOP=1 -t -A -c "$SQL" >"$TMPDIR_CAS/one" 2>&1 &
p1=$!
psql -h 127.0.0.1 -U postgres -d finance_p1_verify -v ON_ERROR_STOP=1 -t -A -c "$SQL" >"$TMPDIR_CAS/two" 2>&1 &
p2=$!
wait "$p1"
wait "$p2"
count=$(grep -h -c 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' "$TMPDIR_CAS/one" "$TMPDIR_CAS/two" | awk '{total+=$1} END{print total+0}')
version=$(psql -h 127.0.0.1 -U postgres -d finance_p1_verify -t -A -v ON_ERROR_STOP=1 -c "select version from public.lizhi_finance_budgets where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'")
if [[ "$count" != 1 || "$version" != 3 ]]; then
  echo "P1_PARALLEL_CAS_FAIL successes=$count version=$version"
  echo "writer1: $(cat "$TMPDIR_CAS/one")"
  echo "writer2: $(cat "$TMPDIR_CAS/two")"
  exit 1
fi
echo "P1_PARALLEL_CAS_PASS successes=1 stale_writer=0 version=3"
