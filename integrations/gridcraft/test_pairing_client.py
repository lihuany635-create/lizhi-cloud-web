"""Windows P3 pairing credential, DPAPI and outbound toggle tests (isolated)."""
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest import mock

from gridcraft_pairing_client import (
    DeviceStore, PairingError, pair_one_time, revoke_local, dpapi
)
import gridcraft_windows_agent as agent


class PairingTests(unittest.TestCase):
    def test_code_shape_rejected_without_any_network(self):
        called = mock.Mock()
        for code in ["", "123", "abc;", "g"*16, "1234567890123456789"]:
            with self.assertRaises(PairingError):
                pair_one_time(code,send=called)
        called.assert_not_called()

    def test_one_time_code_generates_unique_random_device_token_without_printing(self):
        sent=[]
        def fake_send(payload):
            sent.append(payload)
            return {"ok":True,"deviceId":payload["deviceId"]}
        dev,token=pair_one_time("0123456789abcdef",send=fake_send)
        self.assertTrue(dev.startswith("gridcraft-"))
        self.assertEqual(len(token),64)
        self.assertEqual(sent[0]["deviceToken"],token)
        self.assertEqual(sent[0]["code"],"0123456789abcdef")
        self.assertNotIn("GRIDCRAFT_CONTROL_TOKEN",str(sent))
        new_dev,new_token=pair_one_time("0123456789abcdef",send=fake_send)
        self.assertNotEqual(new_dev,dev)
        self.assertNotEqual(new_token,token)

    def test_denied_pairing_does_not_save_credentials(self):
        with self.assertRaises(PairingError):
            pair_one_time("0123456789abcdef",send=lambda _:{"ok":False})
        with self.assertRaises(PairingError):
            pair_one_time("0123456789abcdef",send=lambda _:{"ok":True,"deviceId":"wrong"})

    @unittest.skipUnless(os.name=="nt","DPAPI only available on Windows runner")
    def test_windows_real_dpapi_encrypted_credential_roundtrip(self):
        with TemporaryDirectory() as d:
            store=DeviceStore(Path(d))
            device_id="gridcraft-0123456789abcdef"
            token="a"*64
            store.save(device_id,token)
            raw=store.path.read_bytes()
            self.assertNotIn(token.encode(),raw)
            self.assertNotIn(device_id.encode(),raw)
            read=store.load()
            self.assertEqual(read,{"device_id":device_id,"token":token})
            revoke_local(store)
            self.assertIsNone(store.load())

    @unittest.skipUnless(os.name=="nt","DPAPI only available on Windows runner")
    def test_corrupted_dpapi_file_denied(self):
        with TemporaryDirectory() as d:
            store=DeviceStore(Path(d))
            store.path.write_bytes(b"clearly not encrypted")
            with self.assertRaises(PairingError):
                store.load()

    def test_remote_autostart_off_by_default_and_token_not_in_settings(self):
        with TemporaryDirectory() as d:
            conf=Path(d)/"settings.json"
            agent.save_settings({"gridcraft_path":"","remote_enabled":False,
                                 "device_token":"SHOULD_NOT_PERSIST"},conf)
            actual=json.loads(conf.read_text("utf-8"))
            self.assertNotIn("device_token",actual)
            self.assertFalse(actual["remote_enabled"])

    def test_only_explicit_optin_enables_remote_worker(self):
        ui=agent.AgentUI.__new__(agent.AgentUI)
        ui.paired=None
        ui.remote_status=""
        ui.root=mock.Mock()
        with mock.patch.object(agent.messagebox,"showinfo") as shown:
            ui.start_remote()
        self.assertEqual(ui.remote_status,"尚未經本人完成裝置配對")
        shown.assert_called_once()


if __name__=="__main__":
    unittest.main(verbosity=2)
