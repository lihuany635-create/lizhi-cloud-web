"""Offline tests: no real Windows computer, no cloud relay, no user Excel."""
import json
import socket
import tempfile
import threading
import unittest
from pathlib import Path

from gridcraft_desktop_local import GridCraftLocal, GridCraftOffline


class MockGridCraft:
    def __init__(self, authorized=True, windows=None):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.bind(("127.0.0.1", 0))
        self.server.listen(2)
        self.server.settimeout(4)
        self.port = self.server.getsockname()[1]
        self.authorized = authorized
        self.windows = windows if windows is not None else [{"doc": "synthetic", "title": "Book1", "dirty": False}]
        self.methods = []
        self.thread = threading.Thread(target=self._serve, daemon=True)
        self.thread.start()

    def _serve(self):
        try:
            conn, _ = self.server.accept()
            with conn:
                f = conn.makefile("rwb")
                with f:
                    first = f.readline()
                    if not first:
                        return
                    hello = json.loads(first)
                    assert hello["method"] == "auth"
                    assert hello["id"] == 0
                    if not self.authorized or hello["params"]["token"] != "t"*32:
                        f.write(b'{"id":0,"ok":false,"error":"authentication required"}\n')
                        f.flush()
                        return
                    f.write(b'{"id":0,"ok":true,"result":{"authenticated":true}}\n')
                    f.flush()
                    cmd = json.loads(f.readline())
                    self.methods.append(cmd["method"])
                    if cmd["method"] == "window.list":
                        result = self.windows
                    elif cmd["method"] == "sheet.read":
                        result = {"range": cmd["params"]["range"], "values": [[2300]]}
                    elif cmd["method"] == "document.inspect":
                        result = {"sheets": ["估價清單"]}
                    elif cmd["method"] == "cell.get":
                        result = {"value": 2300}
                    else:
                        result = {"unexpected": True}
                    f.write(json.dumps({"id": 1, "ok": True, "result": result}).encode() + b"\n")
                    f.flush()
        finally:
            self.server.close()

    def wait(self):
        self.thread.join(timeout=5)
        assert not self.thread.is_alive()


class LocalDesktopTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.tokenfile = Path(self.tmp.name) / "control-7979.token"
        self.tokenfile.write_text("t"*32, encoding="utf-8")

    def test_ready_and_status(self):
        server = MockGridCraft()
        client = GridCraftLocal(port=server.port, token_path=str(self.tokenfile))
        self.assertEqual(client.status(), {"status": "READY", "backend": "desktop", "window_count": 1})
        server.wait()
        self.assertEqual(server.methods, ["window.list"])

    def test_read_range(self):
        server = MockGridCraft()
        client = GridCraftLocal(port=server.port, token_path=str(self.tokenfile))
        self.assertEqual(client.read_range("估價清單", "B3")["values"], [[2300]])
        server.wait()
        self.assertEqual(server.methods, ["sheet.read"])

    def test_offline_when_no_listener(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(("127.0.0.1", 0))
        port = server.getsockname()[1]
        server.close()
        client = GridCraftLocal(port=port, token_path=str(self.tokenfile), timeout=1)
        self.assertEqual(client.status()["status"], "GRIDCRAFT_OFFLINE")
        with self.assertRaises(GridCraftOffline):
            client.windows()

    def test_unauthorized_token(self):
        server = MockGridCraft(authorized=False)
        client = GridCraftLocal(port=server.port, token_path=str(self.tokenfile))
        self.assertEqual(client.status()["status"], "UNAUTHORIZED")
        server.wait()

    def test_forbidden_write_and_arbitrary_path(self):
        client = GridCraftLocal(port=7979, token_path=str(self.tokenfile))
        with self.assertRaises(PermissionError):
            client._request("engine.execute", {"command": "cell.set"})
        with self.assertRaises(PermissionError):
            client._request("app.open", {"path": "C:\\secret.xlsx"})
        with self.assertRaises(PermissionError):
            client._request("ui.key", {"key": "Enter"})
        with self.assertRaises(ValueError):
            client.read_range("Sheet1", "A1:ZZ9999999")
        with self.assertRaises(ValueError):
            client._request("cell.get", {"cell": "A1:B2"})

    def test_token_missing_gives_unauthorized_with_local_listener(self):
        server = MockGridCraft()
        client = GridCraftLocal(port=server.port, token_path=str(Path(self.tmp.name)/"doesnotexist"))
        self.assertEqual(client.status()["status"], "UNAUTHORIZED")
        server.wait()


if __name__ == "__main__":
    unittest.main(verbosity=2)
