"""P3 outbound worker candidate tests with mock local GridCraft and mock TLS transport.

No remote network connection or production credential is used here.
"""
from __future__ import annotations

import unittest
from unittest.mock import Mock
from gridcraft_outbound_worker import (
    OutboundWorker, UnsafeJob, HTTPSDeviceTransport, bounded_range, bounded_reply, BASE
)


class FakeTransport:
    def __init__(self, job=None):
        self.job = job
        self.statuses = []
        self.completions = []

    def heartbeat(self, status):
        self.statuses.append(status)
        return {"state": status}

    def poll(self):
        return {"job": self.job}

    def complete(self, request_id, result):
        self.completions.append((request_id, result))
        return {"accepted": True}


class FakeLocal:
    def __init__(self, status="READY"):
        self.state = status
        self.read_calls = []
        self.windows_calls = 0

    def status(self):
        return {"status": self.state}

    def windows(self):
        self.windows_calls += 1
        return [
            {"doc": "42", "title": "合成估價表", "dirty": False},
            {"doc": "43", "title": "不得外洩的資料", "dirty": False}
        ]

    def read_range(self, sheet, rng, doc=None):
        self.read_calls.append((sheet,rng,doc))
        return {"values": [[2500]]}


def sample_job(name="gridcraft_read_range", args=None, expires_at=1000000):
    return {"id":"p3-device-test-0001", "name":name,
            "args":args if args is not None else
              {"doc":"42","sheet":"估價清單","range":"B3"},
            "expiresAt":expires_at}


class OutboundTests(unittest.TestCase):
    def worker(self, *, job=None, status="READY", approved=None):
        relay, local = FakeTransport(job), FakeLocal(status)
        return (OutboundWorker(transport=relay,local=local,
                               approved_docs=set(approved or {"42"}),
                               clock=lambda: 900),relay,local)

    def test_read_only_granted_workbook(self):
        w,t,l=self.worker(job=sample_job())
        self.assertTrue(w.run_once()["executed"])
        self.assertEqual(t.statuses, ["READY"])
        self.assertEqual(l.read_calls,[("估價清單","B3","42")])
        self.assertEqual(t.completions[0][1]["data"]["values"],[[2500]])

    def test_list_only_local_granted_docs(self):
        w,t,l=self.worker(job=sample_job("gridcraft_list_workbooks",{}))
        self.assertTrue(w.run_once()["executed"])
        books=t.completions[0][1]["workbooks"]
        self.assertEqual(len(books),1)
        self.assertEqual(books[0]["doc"],"42")
        self.assertNotIn("43",str(books))

    def test_offline_never_polls_or_executes(self):
        w,t,l=self.worker(job=sample_job(),status="GRIDCRAFT_OFFLINE")
        self.assertEqual(w.run_once(),{"status":"GRIDCRAFT_OFFLINE","executed":False})
        self.assertEqual(t.completions,[])
        self.assertEqual(l.read_calls,[])

    def test_local_unauthorized_never_executes(self):
        w,t,l=self.worker(job=sample_job(),status="UNAUTHORIZED")
        self.assertFalse(w.run_once()["executed"])
        self.assertEqual(t.statuses,["UNAUTHORIZED"])
        self.assertEqual(l.read_calls,[])

    def test_no_grant_blocks_read_even_if_workbook_open(self):
        w,t,l=self.worker(job=sample_job(),approved={"99"})
        w.run_once()
        self.assertEqual(t.completions[0][1]["error"],"WORKBOOK_NOT_GRANTED")
        self.assertEqual(l.read_calls,[])

    def test_reject_unauthorized_method_and_shell(self):
        for name in ["gridcraft_set_cell","gridcraft_write_range","execute_command","app.open","ui.key"]:
            w,t,l=self.worker(job=sample_job(name))
            w.run_once()
            self.assertEqual(t.completions[0][1]["error"],"METHOD_DENIED")
            self.assertFalse(l.read_calls)

    def test_large_range_and_injected_args_blocked(self):
        for args in [
            {"doc":"42","sheet":"Main","range":"A1:Z1000"},
            {"doc":"42","sheet":"Main","range":"A1","path":"C:/Windows"},
            {"doc":"../../user","sheet":"Main","range":"A1"},
            {"doc":"42","sheet":"Main","range":"A1;open"},
        ]:
            w,t,l=self.worker(job=sample_job(args=args))
            w.run_once()
            self.assertFalse(t.completions[0][1]["ok"])
            self.assertEqual(l.read_calls,[])

    def test_expired_job_rejected_without_result_or_execution(self):
        w,t,l=self.worker(job=sample_job(expires_at=100))
        with self.assertRaisesRegex(UnsafeJob,"EXPIRED_JOB"):
            w.run_once()
        self.assertEqual(t.completions,[])
        self.assertEqual(l.read_calls,[])

    def test_result_limit_and_non_dict_refused(self):
        with self.assertRaises(UnsafeJob):
            bounded_reply({"data":"x"*30000})
        with self.assertRaises(UnsafeJob):
            bounded_reply("raw file")
        with self.assertRaises(UnsafeJob):
            bounded_range("A1:A100000")

    def test_fixed_https_endpoint_and_credential_validation(self):
        token="1"*64
        transport=HTTPSDeviceTransport(device_id="device-A",device_token=token)
        self.assertEqual(transport._endpoint,BASE)
        with self.assertRaises(ValueError):
            HTTPSDeviceTransport(device_id="device-A",device_token=token,endpoint="http://127.0.0.1:9999")
        with self.assertRaises(ValueError):
            HTTPSDeviceTransport(device_id="device-A",device_token="wrong")

    def test_complete_failure_does_not_rerun_operation(self):
        w,t,l=self.worker(job=sample_job())
        t.complete=Mock(return_value={"accepted":False})
        with self.assertRaisesRegex(UnsafeJob,"COMPLETION_NOT_ACKNOWLEDGED"):
            w.run_once()
        self.assertEqual(len(l.read_calls),1)
        self.assertEqual(t.complete.call_count,1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
