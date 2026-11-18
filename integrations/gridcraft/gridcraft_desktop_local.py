"""GridCraft Windows desktop control client: local-only candidate, READ-ONLY by design.

Connects to official GridCraft v0.19.1 control socket at 127.0.0.1:7979.
Does not expose a public listener, cloud endpoint, or arbitrary command execution.
An authenticated outbound cloud relay is a separate, NOT YET IMPLEMENTED stage.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import socket


class GridCraftConnectionError(Exception):
    pass


class GridCraftUnauthorized(GridCraftConnectionError):
    pass


class GridCraftOffline(GridCraftConnectionError):
    pass


ALLOWED_METHODS = frozenset({"window.list", "document.inspect", "sheet.read", "cell.get"})
RANGE = re.compile(r"^\$?[A-Z]{1,3}\$?[1-9][0-9]{0,5}(?::\$?[A-Z]{1,3}\$?[1-9][0-9]{0,5})?$")
MAX_REPLY = 128 * 1024
MAX_REQUEST = 3 * 1024


def _read_response(stream):
    data = stream.readline(MAX_REPLY + 1)
    if not data or len(data) > MAX_REPLY:
        raise GridCraftConnectionError("GridCraft response absent or exceeds safe bound")
    try:
        obj = json.loads(data)
    except ValueError as exc:
        raise GridCraftConnectionError("GridCraft response is not JSON") from exc
    if not isinstance(obj, dict):
        raise GridCraftConnectionError("GridCraft response is not an object")
    return obj


class GridCraftLocal:
    def __init__(self, port: int = 7979, token_path: str | None = None, timeout: float = 2.5):
        if not isinstance(port, int) or not 1 <= port <= 65535:
            raise ValueError("invalid port")
        if timeout <= 0 or timeout > 10:
            raise ValueError("invalid timeout")
        self.port = port
        self.timeout = timeout
        # App's official Windows token file is under the current user's profile.
        self.token_path = Path(token_path) if token_path else Path.home() / ".gridcraft" / f"control-{port}.token"

    def _token(self):
        token = os.environ.get("GRIDCRAFT_CONTROL_TOKEN")
        if not token:
            try:
                token = self.token_path.read_text(encoding="utf-8").strip()
            except OSError as exc:
                raise GridCraftUnauthorized("local GridCraft token unavailable") from exc
        if not isinstance(token, str) or not 16 <= len(token) <= 512:
            raise GridCraftUnauthorized("invalid local GridCraft token format")
        return token

    def _request(self, method: str, params: dict | None = None):
        if method not in ALLOWED_METHODS:
            raise PermissionError("GridCraft method not allowed")
        params = params or {}
        if not isinstance(params, dict):
            raise ValueError("parameters must be an object")
        if method == "sheet.read":
            rg = params.get("range")
            if not isinstance(rg, str) or not RANGE.fullmatch(rg):
                raise ValueError("sheet.read needs bounded A1 range")
            if len(params) > 4 or any(k not in ("range", "sheet", "formulas", "doc") for k in params):
                raise ValueError("unsupported sheet.read parameters")
        if "doc" in params and (not isinstance(params["doc"], str) or
                                not re.fullmatch(r"[A-Za-z0-9._:-]{1,100}", params["doc"])):
            raise ValueError("invalid workbook document id")
        if method == "cell.get" and (not isinstance(params.get("cell"), str)
                                      or not RANGE.fullmatch(params["cell"])
                                      or ":" in params["cell"]):
            raise ValueError("cell.get needs a single A1 cell")
        if method in ("window.list", "document.inspect") and params:
            raise ValueError("parameters not supported for this method")
        data = json.dumps({"id": 1, "method": method, "params": params}, separators=(",", ":")).encode() + b"\n"
        if len(data) > MAX_REQUEST:
            raise ValueError("command too large")
        # Connect ONLY to loopback. Remote control port 7979 must never be NAT-exposed.
        try:
            conn = socket.create_connection(("127.0.0.1", self.port), timeout=self.timeout)
        except (OSError, TimeoutError) as exc:
            raise GridCraftOffline("GridCraft desktop is not listening on localhost") from exc
        with conn:
            conn.settimeout(self.timeout)
            try:
                stream = conn.makefile("rb")
                with stream:
                    token = self._token()
                    hello = json.dumps({"id": 0, "method": "auth", "params": {"token": token}}, separators=(",", ":")).encode()
                    conn.sendall(hello + b"\n")
                    reply = _read_response(stream)
                    if reply.get("id") != 0 or reply.get("ok") is not True or reply.get("result", {}).get("authenticated") is not True:
                        raise GridCraftUnauthorized("GridCraft local authentication rejected")
                    conn.sendall(data)
                    result = _read_response(stream)
                    if result.get("id") != 1:
                        raise GridCraftConnectionError("request id mismatch")
                    if result.get("ok") is not True:
                        raise GridCraftConnectionError("GridCraft method refused")
                    return result.get("result")
            except (OSError, TimeoutError) as exc:
                raise GridCraftOffline("GridCraft desktop disconnected") from exc

    def status(self):
        try:
            windows = self._request("window.list", {})
            return {"status": "READY", "backend": "desktop", "window_count": min(len(windows), 100) if isinstance(windows, list) else 0}
        except GridCraftOffline:
            return {"status": "GRIDCRAFT_OFFLINE", "backend": "desktop"}
        except GridCraftUnauthorized:
            return {"status": "UNAUTHORIZED", "backend": "desktop"}
        except GridCraftConnectionError:
            return {"status": "CONTROL_ERROR", "backend": "desktop"}

    def windows(self):
        windows = self._request("window.list")
        if not isinstance(windows, list):
            raise GridCraftConnectionError("window.list reply must be array")
        return [{"doc": x.get("doc"), "title": str(x.get("title", ""))[:100],
                 "dirty": x.get("dirty") is True} for x in windows[:40] if isinstance(x, dict)]

    def inspect(self):
        return self._request("document.inspect")

    def read_range(self, sheet: str, a1_range: str, doc: str | None = None):
        if not isinstance(sheet, str) or not 1 <= len(sheet) <= 80:
            raise ValueError("invalid sheet")
        arguments = {"sheet": sheet, "range": a1_range}
        if doc is not None:
            if not isinstance(doc, str) or not re.fullmatch(r"[A-Za-z0-9._:-]{1,100}", doc):
                raise ValueError("invalid workbook document id")
            # When remote access is explicitly permitted, refuse a stale or
            # unknown document id rather than silently reading the active book.
            if doc not in {x["doc"] for x in self.windows()}:
                raise GridCraftUnauthorized("requested workbook not open locally")
            arguments["doc"] = doc
        return self._request("sheet.read", arguments)


if __name__ == "__main__":
    # Safe status check only, no arbitrary file opens, writes or credentials printed.
    print(json.dumps(GridCraftLocal().status(), ensure_ascii=False))
