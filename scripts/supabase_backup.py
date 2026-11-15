"""Owner-dispatched backup. Never print child output or exception details.

All database writes are restricted to the disposable Docker container. The hosted
connection is read-only. Private manifests and diagnostic logs stay in the GPG
archive; public Actions output contains only fixed status messages.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import shutil
import tarfile
from urllib.parse import urlsplit, unquote

PROJECT = "hrdzywkihfqggiwjgavi"
CONTAINER = "supabase_db_lizhi-restore-check"
PHASE = "configuration"
LARGE_OBJECT_SQL = """select oid::bigint, octet_length(lo_get(oid)), md5(lo_get(oid)),
    pg_get_userbyid(lomowner), lomacl::text
    from pg_largeobject_metadata order by oid"""


def require_secrets(env):
    required = ("SUPABASE_DB_URL", "LIZHI_BACKUP_PASSPHRASE")
    if any(not env.get(key) for key in required):
        raise ValueError("Required backup secrets are missing")


def private_subprocess_env(env):
    return {k: v for k, v in env.items()
            if k not in ("SUPABASE_DB_URL", "LIZHI_BACKUP_PASSPHRASE", "PGPASSWORD")}


def validate_url(value):
    u = urlsplit(value)
    if (u.scheme not in ("postgres", "postgresql")
            or unquote(u.username or "") != "postgres." + PROJECT
            or not u.password or u.port != 5432 or u.path != "/postgres"
            or not re.fullmatch(r"aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com", u.hostname or "")
            or u.query or u.fragment):
        raise ValueError("Expected original project's session-pooler URI without query parameters")
    return u


def run(args, *, env=None, stdin=None, output=None):
    # In particular, psql errors may contain COPY row data or SQL credentials.
    result = subprocess.run(args, env=env, input=stdin, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, check=False)
    if result.returncode:
        private_error = result.stderr.decode("utf-8", errors="replace").lower()
        category = next((label for pattern, label in (
            ("password authentication failed", "authentication-failed"),
            ("no password supplied", "password-required"),
            ("peer authentication failed", "peer-authentication-failed"),
            ("permission denied", "permission-denied"),
            ("must be owner", "ownership-required"),
            ("already exists", "object-already-exists"),
            ("not available", "component-unavailable"),
            ("unrecognized configuration parameter", "unknown-setting"),
            ("cannot drop", "drop-failed"),
            ("does not exist", "missing-object"),
            ("syntax error", "sql-syntax-error"),
        ) if pattern in private_error), "unclassified")
        error = RuntimeError("Subprocess failed; private output suppressed")
        error.safe_category = category
        raise error
    if output:
        Path(output).write_bytes(result.stdout)
    return result.stdout


def digest(path):
    with open(path, "rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def extract_checked(archive, target):
    with tarfile.open(archive) as tf:
        for m in tf.getmembers():
            if m.name.startswith("/") or ".." in Path(m.name).parts or not (m.isfile() or m.isdir()):
                raise ValueError("Unsafe archive member")
        tf.extractall(target, filter="data")


def inventory(conn):
    from psycopg import sql
    result = {}
    tables = conn.execute("""select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where c.relkind in ('r','p') and n.nspname !~ '^pg_'
        and n.nspname <> 'information_schema' order by 1,2""").fetchall()
    for schema, table, rls, force_rls in tables:
        # Read hashes, never plaintext rows. Sort in SQL so physical row order is irrelevant.
        h = hashlib.sha256()
        count = 0
        with conn.cursor(name="backup_rows") as cur:
            cur.execute(sql.SQL("select md5(to_jsonb(t)::text) from {}.{} t order by 1")
                        .format(sql.Identifier(schema), sql.Identifier(table)))
            for row in cur:
                h.update(row[0].encode("ascii") + b"\n")
                count += 1
        result[schema + "." + table] = [count, h.hexdigest(), rls, force_rls]
    objects = conn.execute("""select kind, name, definition from (
      select 'policy' as kind, schemaname||'.'||tablename||'.'||policyname as name,
        jsonb_build_array(permissive,roles,cmd,qual,with_check)::text as definition
        from pg_policies
      union all
      select 'function', n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
        pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where p.prokind in ('f','p') and n.nspname !~ '^pg_'
        and n.nspname <> 'information_schema'
        and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass
          and d.objid=p.oid and d.deptype='e')
      union all
      select 'trigger', n.nspname||'.'||c.relname||'.'||t.tgname,pg_get_triggerdef(t.oid)
        from pg_trigger t join pg_class c on c.oid=t.tgrelid
        join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal
      union all
      select 'view', schemaname||'.'||viewname,definition from pg_views
        where schemaname !~ '^pg_' and schemaname <> 'information_schema'
      union all
      select 'constraint', n.nspname||'.'||c.relname||'.'||k.conname,pg_get_constraintdef(k.oid)
        from pg_constraint k join pg_class c on c.oid=k.conrelid
        join pg_namespace n on n.oid=c.relnamespace where n.nspname !~ '^pg_'
        and n.nspname <> 'information_schema'
      union all
      select 'index',schemaname||'.'||indexname,indexdef from pg_indexes
        where schemaname !~ '^pg_' and schemaname <> 'information_schema'
      union all
      select 'extension',extname,extversion from pg_extension
      union all
      select 'sequence',schemaname||'.'||sequencename,
        jsonb_build_array(sequenceowner,data_type,start_value,min_value,max_value,
          increment_by,cycle,cache_size,last_value)::text from pg_sequences
        where schemaname !~ '^pg_' and schemaname <> 'information_schema'
      union all
      select 'table_acl',n.nspname||'.'||c.relname,
        jsonb_build_array(pg_get_userbyid(c.relowner),
          (select jsonb_agg(x::text order by x::text) from unnest(c.relacl) x))::text
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where c.relkind in ('r','p','v','m','S','f') and n.nspname !~ '^pg_'
        and n.nspname <> 'information_schema'
    ) objects order by 1,2""").fetchall()
    large_objects = conn.execute(LARGE_OBJECT_SQL).fetchall()
    return {"tables": result, "objects": objects, "large_objects": large_objects}


def main():
    global PHASE
    import psycopg
    os.umask(0o077)
    restore_capture = os.environ.get("LIZHI_RESTORE_CAPTURE_DIR")
    if not restore_capture:
        require_secrets(os.environ)
    backup_url = os.environ.get("SUPABASE_DB_URL", "")
    passphrase = os.environ["LIZHI_BACKUP_PASSPHRASE"]
    u = validate_url(backup_url) if not restore_capture else None
    if len(passphrase) < 24 or "\n" in passphrase or "\r" in passphrase:
        raise ValueError("Passphrase must contain 24+ characters and no newline")
    root = Path(os.environ["RUNNER_TEMP"]) / "lizhi-backup-private"
    root.mkdir(mode=0o700, exist_ok=False)
    out = Path(os.environ["RUNNER_TEMP"]) / "lizhi-backup-encrypted"
    out.mkdir(mode=0o700, exist_ok=False)
    plain = root / "payload"
    plain.mkdir()
    clean = private_subprocess_env(os.environ)
    gpg = ["gpg", "--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase-fd", "0"]
    if restore_capture:
        PHASE = "reopen-existing-encrypted-capture"
        incoming = Path(restore_capture)
        encrypted = out / "backup.tar.gz.gpg"
        shutil.copyfile(incoming / "backup.tar.gz.gpg", encrypted)
        expected = (incoming / "backup.sha256").read_text().split()[0]
        if digest(encrypted) != expected:
            raise ValueError("Encrypted capture hash mismatch")
        shutil.copyfile(incoming / "backup.sha256", out / "backup.sha256")
        reopened = root / "reopened.tar.gz"
        run(gpg + ["--decrypt", "--output", str(reopened), str(encrypted)],
            env=clean, stdin=(passphrase + "\n").encode())
        restored = root / "reopened"
        restored.mkdir()
        extract_checked(reopened, restored)
        recovered = restored / "payload"
        manifest = json.loads((recovered / "manifest.json").read_text())
        if manifest.get("project") != PROJECT:
            raise ValueError("Original project required")
        source, roles = manifest["snapshot_inventory"], manifest["roles"]
        (out / "capture-status.txt").write_text("CAPTURE_ONLY: existing encrypted capture reopened; restore not yet passed.\n")
        print("Existing encrypted capture SHA256 and decryption: PASS", flush=True)
    else:
        pg = {**clean, "PGHOST": u.hostname, "PGPORT": "5432",
              "PGUSER": unquote(u.username), "PGPASSWORD": unquote(u.password),
              "PGDATABASE": "postgres", "PGSSLMODE": "require", "PGCONNECT_TIMEOUT": "30",
              "PGOPTIONS": "-c default_transaction_read_only=on -c statement_timeout=600000"}
        # Pass secrets only to the operations that need them, not to local restore.
        pg_bin = Path("/usr/lib/postgresql/17/bin")
        PHASE = "hosted-read-only-snapshot-and-dump"
        with psycopg.connect(backup_url, sslmode="require", connect_timeout=30,
                             options="-c default_transaction_read_only=on -c statement_timeout=600000") as conn:
            conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY")
            if int(conn.execute("show server_version_num").fetchone()[0]) // 10000 != 17:
                raise ValueError("Hosted database must be PostgreSQL 17")
            snapshot = conn.execute("select pg_export_snapshot()").fetchone()[0]
            source = inventory(conn)
            roles = [r[0] for r in conn.execute("select rolname from pg_roles where rolname !~ '^pg_' order by 1")]
            extensions = conn.execute("select extname,extversion from pg_extension order by 1").fetchall()
            # Raw custom archive includes managed schemas, history, large objects,
            # ACLs and extension configuration data that CLI migration dumps omit.
            run([str(pg_bin / "pg_dump"), "--format=custom", "--snapshot=" + snapshot,
                 "--file=" + str(plain / "full.dump")], env=pg)
            run([str(pg_bin / "pg_dumpall"), "--roles-only", "--no-role-passwords"],
                env=pg, output=plain / "roles.sql")
            # Keep a separate schema export for review/recovery without exposing it.
            run([str(pg_bin / "pg_restore"), "--schema-only", "--file=" + str(plain / "schema.sql"),
                 str(plain / "full.dump")], env=clean)
            (plain / "manifest.json").write_text(json.dumps({"project": PROJECT,
                "snapshot_inventory": source, "roles": roles, "extensions": extensions,
                "scope": "Full pg_dump logical database. Role passwords, external Vault keys, Storage binaries, Auth provider configuration and Edge secrets are separate."},
                ensure_ascii=True, sort_keys=True), encoding="utf-8")
        # Encrypt before any real database restoration. Only this folder is uploaded.
        PHASE = "encrypt-and-decrypt-verify"
        archive = root / "backup.tar.gz"
        with tarfile.open(archive, "w:gz") as tf:
            tf.add(plain, arcname="payload")
        encrypted = out / "backup.tar.gz.gpg"
        run(gpg + ["--symmetric", "--cipher-algo", "AES256", "--output", str(encrypted), str(archive)],
            env=clean, stdin=(passphrase + "\n").encode())
        (out / "backup.sha256").write_text(digest(encrypted) + "  backup.tar.gz.gpg\n", encoding="ascii")
        reopened = root / "reopened.tar.gz"
        run(gpg + ["--decrypt", "--output", str(reopened), str(encrypted)],
            env=clean, stdin=(passphrase + "\n").encode())
        if digest(archive) != digest(reopened):
            raise ValueError("Decrypted archive differs")
        restored = root / "reopened"
        restored.mkdir()
        extract_checked(reopened, restored)
        recovered = restored / "payload"
        if digest(plain / "full.dump") != digest(recovered / "full.dump"):
            raise ValueError("Archive database digest differs")
        (out / "capture-status.txt").write_text("CAPTURE_ONLY: encrypted and decrypt/hash verified; restore not yet passed.\n")
        print("Encrypted database capture and decrypt/hash verification: PASS", flush=True)
    # CLI is used only to bootstrap the disposable PG17 environment. Never link it.
    local = root / "restore-check"
    PHASE = "disposable-postgresql17-bootstrap"
    local.mkdir()
    run(["supabase", "init", "--workdir", str(local)], env=clean)
    config = local / "supabase/config.toml"
    config.write_text(config.read_text().replace('project_id = "restore-check"',
                      'project_id = "lizhi-restore-check"'), encoding="utf-8")
    if 'project_id = "lizhi-restore-check"' not in config.read_text():
        raise ValueError("Unexpected local CLI config")
    run(["supabase", "db", "start", "--workdir", str(local)], env=clean)
    # No restored cron or database trigger can call the Internet.
    inspect = json.loads(run(["docker", "inspect", CONTAINER], env=clean))
    for network in inspect[0]["NetworkSettings"]["Networks"]:
        run(["docker", "network", "disconnect", network, CONTAINER], env=clean)
    PHASE = "isolated-full-archive-restore"
    def local_sql(query, db="template1"):
        return run(["docker", "exec", "-i", CONTAINER, "psql", "-X", "-q", "-A", "-t",
                    "-v", "ON_ERROR_STOP=1", "-U", "supabase_admin", "-d", db],
                   env=clean, stdin=query.encode())
    PHASE = "isolated-disable-cron"
    local_sql("ALTER SYSTEM SET cron.launch_active_jobs = 'off';\nSELECT pg_reload_conf();")
    # Only the fixed disposable container is a write target. Template0 prevents
    # baseline Auth/Storage migrations from concealing missing source objects.
    PHASE = "isolated-create-clean-database"
    local_sql("DROP DATABASE postgres WITH (FORCE);")
    local_sql("CREATE DATABASE postgres WITH TEMPLATE template0;")
    PHASE = "isolated-create-roles"
    for role in roles:
        ident = '"' + role.replace('"', '""') + '"'
        literal = "'" + role.replace("'", "''") + "'"
        local_sql("SELECT 'CREATE ROLE " + ident.replace("'", "''") +
                  "' WHERE NOT EXISTS(SELECT FROM pg_roles WHERE rolname=" + literal + ");\n\\gexec\n")
    role_sql = (recovered / "roles.sql").read_text()
    role_sql = re.sub(r"^CREATE ROLE .*;\s*$", "", role_sql, flags=re.MULTILINE)
    PHASE = "isolated-restore-role-attributes"
    local_sql(role_sql)
    run(["docker", "cp", str(recovered / "full.dump"), CONTAINER + ":/tmp/full.dump"], env=clean)
    PHASE = "isolated-pg-restore-archive"
    run(["docker", "exec", CONTAINER, "pg_restore", "--exit-on-error", "--single-transaction",
         "-U", "supabase_admin", "-d", "postgres", "/tmp/full.dump"], env=clean)
    # Inventory inside the network-isolated container using its psql, not a
    # connection accidentally redirected to the hosted URL.
    # Compare complete table hashes and definitions via a local pg_dump-to-client
    # inventory helper, with its queries sent only through docker exec.
    PHASE = "complete-data-and-object-comparison"
    actual = local_inventory(local_sql)
    if json.loads(json.dumps(actual)) != json.loads(json.dumps(source)):
        raise ValueError("Restored data or required object inventory differs")
    (out / "restore-status.txt").write_text(
        "PASS: PostgreSQL17 full archive decrypted, restored and table/object inventory matched.\n"
        "BLOCKED: durable private copy, Storage binaries, external keys/config and independent security review require separate evidence.\n")
    print("Isolated PostgreSQL17 restore and complete table/object inventory: PASS", flush=True)


def local_inventory(local_sql):
    # Export the recovered database's inventory using a standalone Python helper
    # is deliberately avoided: the container needs no pip or network access.
    table_rows = json.loads(local_sql("""select coalesce(json_agg(row_to_json(x)), '[]') from (
      select n.nspname as s,c.relname as t,c.relrowsecurity as r,c.relforcerowsecurity as f
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where c.relkind in ('r','p') and n.nspname !~ '^pg_'
      and n.nspname <> 'information_schema' order by 1,2) x;""", "postgres"))
    tables = {}
    for row in table_rows:
        ident = lambda s: '"' + s.replace('"', '""') + '"'
        data = local_sql("select md5(to_jsonb(t)::text) from " + ident(row["s"]) + "." + ident(row["t"]) + " t order by 1;", "postgres")
        tables[row["s"] + "." + row["t"]] = [len(data.splitlines()), hashlib.sha256(data).hexdigest(), row["r"], row["f"]]
    # Run exactly the same static catalog SELECT as the source inventory.
    import ast
    tree = ast.parse(Path(__file__).read_text())
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "inventory")
    assignment = next(n for n in fn.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "objects" for t in n.targets))
    query = assignment.value.func.value.args[0].value
    objects = json.loads(local_sql("select coalesce(json_agg(row_to_json(x)), '[]') from (" + query + ") x;", "postgres"))
    large_objects = json.loads(local_sql("select coalesce(json_agg(row_to_json(x)), '[]') from (" + LARGE_OBJECT_SQL + ") x;", "postgres"))
    return {"tables": tables, "objects": [[r["kind"], r["name"], r["definition"]] for r in objects],
            "large_objects": [list(r.values()) for r in large_objects]}


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Never print exception repr, connection URIs, SQL or plaintext values.
        print("::error::Backup/restore gate FAIL in " + PHASE + ". Private exception details suppressed.", flush=True)
        print("Safe failure category: " + getattr(error, "safe_category", "unclassified"), flush=True)
        sys.exit(1)
