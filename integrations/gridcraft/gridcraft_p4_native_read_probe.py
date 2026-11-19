"""Optional LOCAL-ONLY native GridCraft CLI read/roundtrip probe for a P4 copy.

Does not control, close, save, or reopen any live GridCraft UI workbook.
Never add this probe as a remotely exposed command without independent review.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess

from gridcraft_p4_safe_save import (
    _file_inventory, _is_reparse, _safe_directory, safe_basename,
)
from gridcraft_p4_safe_write import P4Denied

OUTPUT_LIMIT = 2 * 1024 * 1024
PINNED_VERSION = "0.19.1"


def _native_binary(path: Path) -> Path:
    binary = Path(path)
    if binary.name.casefold() not in {"gridcraft-cli", "gridcraft-cli.exe"}:
        raise P4Denied("NATIVE_CLI_NAME_DENIED")
    try:
        st = binary.lstat()
        if not stat.S_ISREG(st.st_mode) or binary.is_symlink() or _is_reparse(st):
            raise P4Denied("NATIVE_CLI_UNSAFE")
    except OSError:
        raise P4Denied("NATIVE_CLI_MISSING") from None
    return binary.resolve(strict=True)


def _call(binary: Path, args: list[str], *, timeout: int, cwd: Path):
    try:
        p = subprocess.run([str(binary), *args], cwd=str(cwd),
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                           timeout=timeout, shell=False, check=False,
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except (OSError, subprocess.TimeoutExpired):
        raise P4Denied("NATIVE_CLI_UNAVAILABLE") from None
    if len(p.stdout) > OUTPUT_LIMIT or len(p.stderr) > OUTPUT_LIMIT:
        raise P4Denied("NATIVE_CLI_OUTPUT_LIMIT")
    # No CLI output (which may include private spreadsheet contents) is logged.
    return p.returncode, p.stdout


def probe_native_gridcraft(export_root: Path, file_name: str, cli_binary: Path) -> dict:
    """Inspect an *existing copy* using the installed official v0.19.1 CLI.

    `export_root` and `cli_binary` are LOCAL configuration, never Site/MCP args.
    `gridcraft-cli check` performs an in-memory roundtrip and reports fidelity,
    without saving to the original workbook. Does not perform GUI open/close.
    """
    root = Path(export_root)
    _safe_directory(root)
    name = safe_basename(file_name)
    target = root / name
    try:
        st = target.lstat()
        if not stat.S_ISREG(st.st_mode) or target.is_symlink() or _is_reparse(st):
            raise P4Denied("SAVE_DISK_UNSAFE")
    except OSError:
        raise P4Denied("SAVE_DISK_REOPEN_FAILED") from None
    content, inventory = _file_inventory(target)
    if inventory.warnings:
        raise P4Denied("SAVE_SOURCE_UNRESOLVED")
    binary = _native_binary(cli_binary)
    rc, output = _call(binary, ["version"], timeout=5, cwd=root)
    version = output.decode("utf-8", "replace").strip()
    if rc or not re.fullmatch(r"gridcraft-cli\s+" + re.escape(PINNED_VERSION), version):
        raise P4Denied("NATIVE_CLI_VERSION_MISMATCH")
    rc, output = _call(binary, ["info", str(target), "--json"], timeout=20, cwd=root)
    if rc:
        return {"status":"NATIVE_CLI_OPEN_FAILED", "native_gui_close_reopen":"NOT_TESTED",
                "source_document_saved":False}
    try:
        info = json.loads(output)
        if not isinstance(info, dict):
            raise ValueError()
    except (ValueError, UnicodeDecodeError):
        raise P4Denied("NATIVE_CLI_INVALID_JSON") from None
    rc, output = _call(binary, ["check", str(target), "--json", "--max-report", "0"],
                       timeout=90, cwd=root)
    try:
        result = json.loads(output)
        if not isinstance(result, dict):
            raise ValueError()
    except (ValueError, UnicodeDecodeError):
        raise P4Denied("NATIVE_CLI_INVALID_JSON") from None
    return {"status":"NATIVE_CLI_ROUNDTRIP_PASS" if rc == 0 else "NATIVE_CLI_FIDELITY_DIFFERENCES",
            "cli_version": PINNED_VERSION, "copy_sha256": hashlib.sha256(content).hexdigest(),
            "native_gui_close_reopen":"NOT_TESTED", "source_document_saved":False,
            "cli_check_exit_code": rc}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Read-only native GridCraft CLI probe of an existing P4 export copy")
    parser.add_argument("--export-folder", required=True, type=Path)
    parser.add_argument("--file-name", required=True)
    parser.add_argument("--cli-bin", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        result = probe_native_gridcraft(args.export_folder,args.file_name,args.cli_bin)
    except P4Denied as exc:
        print(json.dumps({"ok":False,"error":str(exc),"native_gui_close_reopen":"NOT_TESTED"}))
        return 2
    print(json.dumps({"ok": result["status"] == "NATIVE_CLI_ROUNDTRIP_PASS", **result},sort_keys=True))
    return 0 if result["status"] == "NATIVE_CLI_ROUNDTRIP_PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
