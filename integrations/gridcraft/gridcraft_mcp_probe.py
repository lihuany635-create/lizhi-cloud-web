#!/usr/bin/env python3
"""GridCraft v0.19.1 headless MCP probe: synthetic data only, no network/secrets."""
import argparse
import json
import os
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
import zipfile
from pathlib import Path


class MCPError(RuntimeError):
    pass


class MCP:
    def __init__(self, cli: str, timeout: float):
        self.timeout = timeout
        self.n = 0
        self.lines: queue.Queue = queue.Queue()
        self.proc = subprocess.Popen(
            [cli, "mcp"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", bufsize=1,
        )
        self.errors = []
        threading.Thread(target=self._read, daemon=True).start()
        threading.Thread(target=self._stderr, daemon=True).start()

    def _read(self):
        try:
            for line in self.proc.stdout:
                if line.strip():
                    try:
                        self.lines.put(json.loads(line))
                    except json.JSONDecodeError:
                        self.lines.put(MCPError("Non-JSON output on MCP stdout"))
        finally:
            self.lines.put(MCPError("MCP stdout closed"))

    def _stderr(self):
        for line in self.proc.stderr:
            if len(self.errors) < 12:
                self.errors.append(line.rstrip()[:240])

    def send(self, method, params=None, notification=False):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if not notification:
            self.n += 1
            payload["id"] = self.n
        if self.proc.poll() is not None:
            raise MCPError("GridCraft exited before request")
        assert self.proc.stdin is not None
        self.proc.stdin.write(json.dumps(payload, separators=(",", ":")) + "\n")
        self.proc.stdin.flush()
        if notification:
            return None
        while True:
            try:
                response = self.lines.get(timeout=self.timeout)
            except queue.Empty as err:
                raise MCPError("Timeout waiting for MCP response") from err
            if isinstance(response, Exception):
                raise response
            if response.get("id") != self.n:
                # Server notifications can arrive while waiting; ignore those.
                if "id" not in response:
                    continue
                raise MCPError("Mismatched MCP response id")
            if "error" in response:
                raise MCPError(f"{method}: {response['error']}")
            if not isinstance(response.get("result"), dict):
                raise MCPError(f"{method}: missing result")
            return response["result"]

    def tool(self, name, arguments=None):
        result = self.send("tools/call", {"name": name, "arguments": arguments or {}})
        if result.get("isError"):
            snippets = [v.get("text", "") for v in result.get("content", []) if v.get("type") == "text"]
            raise MCPError(f"{name}: {'; '.join(snippets)[:400]}")
        return result

    def close(self):
        try:
            if self.proc.poll() is None:
                self.proc.terminate()
                self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait(timeout=5)
        finally:
            for pipe in (self.proc.stdin, self.proc.stdout, self.proc.stderr):
                if pipe:
                    pipe.close()


def run(cli: str, timeout: float):
    client = MCP(cli, timeout)
    try:
        client.send("initialize", {
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": {"name": "lizhi-gridcraft-p0", "version": "0.1.0"},
        })
        client.send("notifications/initialized", notification=True)
        listed = client.send("tools/list")
        tools = {v.get("name") for v in listed.get("tools", [])}
        required = {"new_workbook", "write_range", "read_range", "save_workbook"}
        missing = required - tools
        if missing:
            raise MCPError(f"Required tools missing: {sorted(missing)}")
        print("PASS: MCP initialize and required tools listed")
        with tempfile.TemporaryDirectory(prefix="lizhi-gridcraft-probe-") as tmp:
            client.tool("new_workbook")
            client.tool("write_range", {
                "range": "A1:B3",
                "values": [
                    ["Item", "Amount"],
                    ["Synthetic test", 2],
                    ["Total", "=SUM(B2:B2)"],
                ],
            })
            read = client.tool("read_range", {"range": "A1:B3"})
            if not read.get("content"):
                raise MCPError("read_range returned empty content")
            print("PASS: synthetic workbook write_range/read_range")
            path = Path(tmp) / "sample.xlsx"
            client.tool("save_workbook", {"path": str(path)})
            if not path.is_file() or path.stat().st_size == 0:
                raise MCPError("save_workbook did not produce a nonempty XLSX")
            if not zipfile.is_zipfile(path):
                raise MCPError("output is not a valid XLSX/ZIP archive")
            with zipfile.ZipFile(path) as z:
                names = set(z.namelist())
                if "[Content_Types].xml" not in names or not any(
                    n.startswith("xl/worksheets/") for n in names
                ):
                    raise MCPError("missing XLSX core entries")
            print("PASS: save_workbook produced structurally valid XLSX")
        print("PASS: GridCraft Headless P0 smoke test (not a full fidelity test)")
    finally:
        client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", default=os.environ.get("GRIDCRAFT_CLI") or shutil.which("gridcraft-cli"))
    parser.add_argument("--timeout", type=float, default=30.0)
    args = parser.parse_args()
    if not args.cli or not Path(args.cli).is_file() and shutil.which(args.cli) is None:
        sys.exit("NOT_TESTED: gridcraft-cli not found; pass --cli /path/to/gridcraft-cli")
    try:
        run(args.cli, args.timeout)
    except (MCPError, OSError) as exc:
        sys.exit(f"FAIL: {exc}")
