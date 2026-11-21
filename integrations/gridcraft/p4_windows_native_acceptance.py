"""P4 acceptance against a fresh GridCraft process and a generated workbook."""
import argparse
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
from types import SimpleNamespace
import uuid

from gridcraft_outbound_worker import OutboundWorker
from gridcraft_p3_desktop import P3Local
from gridcraft_p4_native_read_probe import probe_native_gridcraft
from gridcraft_p4_safe_save import P4SafeSaveWriter
from gridcraft_p4_safe_write import P4SafeWriter


def request(port, token, method, **params):
    with socket.create_connection(("127.0.0.1", port), timeout=5) as conn:
        with conn.makefile("rb") as stream:
            for request_id, name, args in (
                (0, "auth", {"token": token}), (1, method, params),
            ):
                conn.sendall(json.dumps({"id": request_id, "method": name, "params": args}).encode() + b"\n")
                reply = json.loads(stream.readline(1024 * 1024))
                if reply.get("id") != request_id or reply.get("ok") is not True:
                    raise RuntimeError(f"{name} refused")
                if request_id == 0 and reply.get("result", {}).get("authenticated") is not True:
                    raise RuntimeError("GridCraft authentication failed")
            return reply.get("result")


def run(exe, root):
    cli = exe.with_name("gridcraft-cli.exe")
    original = root / "Original.xlsx"
    working = root / "P4Test.xlsx"
    env = os.environ.copy()
    for key in ("APPDATA", "LOCALAPPDATA", "USERPROFILE"):
        directory = root / key
        directory.mkdir()
        env[key] = str(directory)

    fixture = root / "fixture.jsonl"
    fixture.write_text("\n".join(json.dumps({"command": command, "params": params}) for command, params in (
        ("range.setValues", {"range": "A1:C2", "values": [[10, 20, "=A1+B1"], ["Merged", None, None]]}),
        ("home.mergeCells", {"range": "A2:B2"}),
        ("pageLayout.pageSetup", {"orientation": "landscape", "paper": "A4", "printArea": "A1:C2"}),
    )), encoding="utf-8")
    subprocess.run([str(cli), "run", "--script", str(fixture), "--out", str(original), "--quiet"],
                   env=env, cwd=root, check=True, timeout=30)
    initial = original.read_bytes()
    shutil.copyfile(original, working)

    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    token = secrets.token_hex(32)
    env["GRIDCRAFT_CONTROL_TOKEN"] = token
    token_file = root / "fixture.token"
    token_file.write_text(token, encoding="utf-8")
    if os.environ.get("GRIDCRAFT_CONTROL_TOKEN"):
        raise RuntimeError("Run the fixture without a pre-existing control token")

    log_path = root / "desktop.log"
    with log_path.open("wb") as log:
        child = subprocess.Popen([str(exe), "--control", str(port)], stdout=log, stderr=log, cwd=root, env=env)
        try:
            deadline = time.monotonic() + 35
            while True:
                try:
                    before = request(port, token, "window.list")
                    break
                except (OSError, ValueError):
                    if child.poll() is not None or time.monotonic() >= deadline:
                        raise RuntimeError("GridCraft desktop did not start") from None
                    time.sleep(0.25)
            request(port, token, "app.open", path=str(working))
            opened = request(port, token, "window.list")
            windows = [w for w in opened if Path(w["title"]).stem == working.stem]
            if len(windows) != 1:
                raise RuntimeError(f"Expected one synthetic workbook, had {len(windows)} (started with {len(before)} windows)")
            window = windows[0]
            doc = str(window["doc"])
            local = P3Local(port=port, token_path=str(token_file), timeout=5)
            writer = P4SafeWriter(local, root / "P4Backups", {doc})
            saver = P4SafeSaveWriter(writer)
            pending, completed = [], []
            def complete(job_id, result):
                completed.append((job_id, result))
                return {"accepted": True}
            transport = SimpleNamespace(
                heartbeat_merged=True, poll=lambda: {"job": pending.pop()}, complete=complete,
            )
            worker = OutboundWorker(transport=transport, local=local, approved_docs={doc},
                                    p4_saver=saver, p4_enabled=lambda: True, clock=lambda: 1)

            def job(kind, **args):
                job_id = str(uuid.uuid4())
                pending.append({"id": job_id, "expiresAt": 2000, "name": "gridcraft_save_" + kind, "args": args})
                result = worker.run_once()
                if not result["executed"] or completed[-1][0] != job_id:
                    raise RuntimeError(f"{kind} queue completion missing")
                reply = completed[-1][1]
                if not reply.get("ok"):
                    raise RuntimeError(f"{kind}: {reply.get('error') or reply.get('status')}")
                return reply

            preview = job("prepare", doc=doc, file_name="P4-Verified.xlsx")
            request_id = str(uuid.uuid4())
            result = job("commit", preview_id=preview["preview_id"], expected_version=preview["expected_version"],
                         request_id=request_id, owner_confirmed=True)
            status = job("status", request_id=request_id, verify_disk=True)
            assert status["disk_verification"] == "MATCH"
            copy = saver.root / result["file_name"]
            assert copy.read_bytes() == (writer.backups / result["backup_id"]).read_bytes()

            request(port, token, "window.close", window=window["window"])
            assert all(w["doc"] != window["doc"] for w in request(port, token, "window.list"))
            request(port, token, "app.open", path=str(copy))
            reopened = [w for w in request(port, token, "window.list") if Path(w["title"]).stem == copy.stem]
            assert len(reopened) == 1 and reopened[0]["dirty"] is False
            reopened_snapshot = local.snapshot_bytes(str(reopened[0]["doc"]))
            from gridcraft_xlsx_fidelity import compare, inventory_bytes
            diff = compare(inventory_bytes(copy.read_bytes()), inventory_bytes(reopened_snapshot))
            assert diff["status"] == "MATCH" and not diff["warnings"], diff["categories"]
            assert probe_native_gridcraft(saver.root, copy.name, cli)["status"] == "NATIVE_CLI_ROUNDTRIP_PASS"
            assert original.read_bytes() == working.read_bytes() == initial
            print("PASS: real Windows GridCraft socket, P4 queue save/verify, desktop reopen, and OOXML comparison")
        except Exception:
            print(log_path.read_text(encoding="utf-8", errors="replace")[-5000:])
            raise
        finally:
            if child.poll() is None:
                child.terminate()
                child.wait(timeout=10)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("gridcraft", type=Path)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="gridcraft-p4-native-") as directory:
        run(args.gridcraft.resolve(strict=True), Path(directory))
