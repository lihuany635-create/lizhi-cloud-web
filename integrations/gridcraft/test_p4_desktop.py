"""GridCraft P4 official localhost protocol tests; fake 127.0.0.1 socket only."""
from __future__ import annotations
import base64
import io
import json
from pathlib import Path
import socket
import tempfile
import threading
import unittest
import zipfile
from gridcraft_p4_desktop import P4Local
from gridcraft_p4_safe_write import P4Denied

def synthetic_xlsx():
    file=io.BytesIO()
    with zipfile.ZipFile(file,"w") as x:
        x.writestr("[Content_Types].xml","<Types/>")
    return file.getvalue()

class FakeControl:
    def __init__(self):
        self.sock=socket.socket()
        self.sock.bind(("127.0.0.1",0))
        self.sock.listen(1)
        self.sock.settimeout(4)
        self.port=self.sock.getsockname()[1]
        self.request=None
        self.thread=threading.Thread(target=self.serve,daemon=True)
        self.thread.start()
    def serve(self):
        try:
            c,_=self.sock.accept()
            with c,c.makefile("rwb") as f:
                auth=json.loads(f.readline())
                assert auth["id"]==0 and auth["method"]=="auth" and auth["params"]["token"]=="t"*32
                f.write(b'{"id":0,"ok":true,"result":{"authenticated":true}}\n')
                f.flush()
                self.request=json.loads(f.readline())
                if self.request["method"]=="file.saveBytes":
                    result={"base64":base64.b64encode(synthetic_xlsx()).decode()}
                else:
                    result={"written":2}
                f.write(json.dumps({"id":1,"ok":True,"result":result}).encode()+b"\n")
                f.flush()
        finally:
            self.sock.close()
    def wait(self):
        self.thread.join(timeout=5)
        assert not self.thread.is_alive()

class TestTargetedP4(unittest.TestCase):
    def setUp(self):
        self.folder=tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.token=Path(self.folder.name)/"auth.token"
        self.token.write_text("t"*32)
    def client(self,srv):
        l=P4Local(port=srv.port,token_path=str(self.token))
        l.windows=lambda:[{"doc":"1","title":"synthetic"}]
        return l

    def test_readonly_snapshot_method_returns_bounded_full_xlsx(self):
        server=FakeControl()
        data=self.client(server).snapshot_bytes("1")
        server.wait()
        self.assertEqual(data,synthetic_xlsx())
        self.assertEqual(server.request["method"],"file.saveBytes")
        self.assertEqual(server.request["params"]["doc"],1)
        self.assertEqual(server.request["params"]["format"],"xlsx")

    def test_exact_cell_range_write_uses_only_engine_range_set_values(self):
        server=FakeControl()
        result=self.client(server).write_range("1","Sheet1","A3:B3",[["立之測試",456]],parse=False)
        server.wait()
        self.assertEqual(result,{"written":2})
        self.assertEqual(server.request["method"],"engine.execute")
        self.assertEqual(server.request["params"]["command"],"range.setValues")
        self.assertEqual(server.request["params"]["doc"],1)
        self.assertEqual(server.request["params"]["params"]["sheet"],"Sheet1")
        self.assertIs(server.request["params"]["params"]["parse"],False)

    def test_arbitrary_commands_and_injected_paths_denied_locally(self):
        l=P4Local(port=7979,token_path=str(self.token))
        with self.assertRaises(P4Denied):
            l._targeted("engine.execute",{"doc":1,"command":"file.open","params":{}},4096)
        with self.assertRaises(P4Denied):
            l._targeted("app.open",{"doc":1},4096)
        with self.assertRaises(P4Denied):
            l._targeted("engine.execute",{"doc":1,"command":"range.setValues",
               "params":{"sheet":"Sheet1","range":"A1","values":[["=NOW()"]],"parse":False}},4096)

if __name__=="__main__":
    unittest.main(verbosity=2)
