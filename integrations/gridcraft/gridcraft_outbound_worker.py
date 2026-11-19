"""GridCraft v0.5.3 authenticated P3/P4 outbound worker.

The existing private owner-paired Edge is contacted only by outbound HTTPS.
No new listener, endpoint, or document credential exposure is introduced.
New server optimizations are optional; the active v6 relay remains supported.
"""
from __future__ import annotations

import inspect
import json
import random
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import re
import ssl
import time
import urllib.error
import urllib.request
from typing import Protocol

from gridcraft_desktop_local import GridCraftLocal

DEVICE_ID = re.compile(r"^[A-Za-z0-9._:-]{1,100}$")
WORKBOOK_UID = re.compile(r"^[1-9][0-9]{0,19}$")
REQUEST_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{7,95}$")
TOKEN = re.compile(r"^[a-fA-F0-9]{64}$")
A1 = re.compile(r"^([A-Z]{1,3})([1-9][0-9]{0,5})(?::([A-Z]{1,3})([1-9][0-9]{0,5}))?$")
BASE = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-gridcraft-bridge/device"
READ_TOOLS = frozenset({"gridcraft_list_workbooks", "gridcraft_read_range"})
P4_TOOLS = frozenset({"gridcraft_prepare_write","gridcraft_commit_write"})
RESPONSE_LIMIT = 24 * 1024


class UnsafeJob(ValueError):
    pass


class RelayTransportError(UnsafeJob):
    """Safe error code and optional retry metadata; no URL or token."""
    def __init__(self, code="BACKEND_UNAVAILABLE", status_code=None, retry_after=None):
        super().__init__(code)
        self.status_code = status_code
        self.retry_after = retry_after


def parse_retry_after(value, *, now=None):
    """Retry-After seconds or HTTP-date, max 24 hours."""
    if value is None:
        return None
    try:
        n = float(value)
        if 0 <= n <= 86400:
            return n
    except (TypeError, ValueError):
        pass
    if not isinstance(value, str) or len(value) > 100:
        return None
    try:
        when = parsedate_to_datetime(value)
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        now = now or datetime.now(timezone.utc)
        return max(0.0, min(86400.0, (when-now).total_seconds()))
    except (TypeError, ValueError, OverflowError):
        return None


def reconnect_delay(failures, retry_after=None, *, random_fraction=None):
    """6, 12, 24, 48, 60s exponential retry with 0–20% jitter."""
    if retry_after is not None:
        return max(0.0, float(retry_after))
    failures = max(1, int(failures))
    base = min(60, 6 * 2 ** min(failures-1, 4))
    fraction = random.uniform(0, .2) if random_fraction is None else random_fraction
    if not 0 <= fraction <= .2:
        raise ValueError("INVALID_JITTER")
    return base * (1 + fraction)


def poll_delay(since_last_job, *, since_start=None, long_poll=False):
    """2s during 60s after work, 6s normally, 20s after 10m idle."""
    if long_poll:
        return 0.0
    if since_last_job is not None and since_last_job < 60:
        return 2.0
    idle = since_last_job if since_last_job is not None else since_start
    if idle is not None and idle >= 600:
        return 20.0
    return 6.0


def bounded_range(s: str):
    if not isinstance(s, str) or len(s) > 22:
        raise UnsafeJob("INVALID_RANGE")
    m = A1.fullmatch(s)
    if m is None:
        raise UnsafeJob("INVALID_RANGE")
    def col(x):
        n = 0
        for ch in x:
            n = n * 26 + ord(ch) - 64
        return n
    rows = int(m[4] or m[2]) - int(m[2]) + 1
    cols = col(m[3] or m[1]) - col(m[1]) + 1
    if rows < 1 or cols < 1 or rows > 50 or cols > 20 or rows * cols > 200:
        raise UnsafeJob("RANGE_LIMIT")


def bounded_reply(data):
    # Reject responses with unexpected binary-like or oversized content.
    if not isinstance(data, dict):
        raise UnsafeJob("RESULT_INVALID")
    encoded = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if len(encoded.encode("utf-8")) > RESPONSE_LIMIT:
        raise UnsafeJob("RESULT_LIMIT")
    return data


class Transport(Protocol):
    def heartbeat(self, status: str) -> dict: ...
    def poll(self, status: str = "READY") -> dict: ...
    def complete(self, request_id: str, result: dict) -> dict: ...


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise UnsafeJob("REDIRECT_DENIED")


class HTTPSDeviceTransport:
    """Existing authenticated owner-paired Edge transport, with fallbacks."""
    def __init__(self, *, device_id: str, device_token: str, endpoint: str = BASE):
        if not DEVICE_ID.fullmatch(device_id) or not TOKEN.fullmatch(device_token):
            raise ValueError("Missing device pairing credentials")
        if endpoint != BASE:
            raise ValueError("Unapproved device relay endpoint")
        self.device_id = device_id
        self._device_token = device_token
        self._endpoint = endpoint
        self.heartbeat_merged = False
        self.long_poll = False
        self._opener = urllib.request.build_opener(
            urllib.request.HTTPSHandler(context=ssl.create_default_context()),
            NoRedirect(),
        )

    def _post(self, action: str, payload: dict, *, timeout: float = 7):
        if action not in ("heartbeat", "poll", "complete"):
            raise UnsafeJob("METHOD_DENIED")
        body = json.dumps({"deviceId": self.device_id, **payload}, ensure_ascii=False,
                          separators=(",", ":")).encode("utf-8")
        if len(body) > RESPONSE_LIMIT + 2048:
            raise UnsafeJob("REQUEST_LIMIT")
        request = urllib.request.Request(
            self._endpoint + "/" + action,
            data=body, method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json",
                     "Authorization": "Bearer " + self._device_token,
                     "Cache-Control": "no-store"},
        )
        try:
            with self._opener.open(request, timeout=timeout) as r:
                if r.status != 200:
                    raise UnsafeJob("BACKEND_UNAVAILABLE")
                raw = r.read(RESPONSE_LIMIT + 1)
                if len(raw) > RESPONSE_LIMIT:
                    raise UnsafeJob("RESULT_LIMIT")
        except urllib.error.HTTPError as exc:
            # Return only status and Retry-After; never expose URL, token or body.
            retry = parse_retry_after(exc.headers.get("Retry-After") if exc.headers else None)
            raise RelayTransportError("BACKEND_UNAVAILABLE", exc.code, retry) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise RelayTransportError("BACKEND_UNAVAILABLE") from None
        try:
            response = json.loads(raw)
        except (ValueError, UnicodeDecodeError):
            raise UnsafeJob("INVALID_RELAY_RESPONSE") from None
        if not isinstance(response, dict):
            raise UnsafeJob("INVALID_RELAY_RESPONSE")
        return response

    def heartbeat(self, status: str):
        return self._post("heartbeat", {"status": status})

    def poll(self, status="READY"):
        if status not in ("READY","GRIDCRAFT_OFFLINE","UNAUTHORIZED","CONTROL_ERROR"):
            raise UnsafeJob("INVALID_STATUS")
        reply = self._post("poll", {"status":status},
                           timeout=30 if self.long_poll else 7)
        # Existing Edge v6 ignores status and returns no opt-in flags.
        if reply.get("heartbeatMerged") is True:
            self.heartbeat_merged = True
        if reply.get("longPoll") is True:
            self.long_poll = True
        return reply

    def complete(self, request_id: str, result: dict):
        return self._post("complete", {"id": request_id, "result": bounded_reply(result)})


class OutboundWorker:
    """Only a trusted local UI may populate approved_docs after explicit consent."""
    def __init__(self, *, transport: Transport, local: GridCraftLocal,
                 approved_docs: set[str] | frozenset[str] | None = None,
                 clock=time.time, p4_writer=None, p4_enabled=lambda: False,
                 grant_checker=None):
        self.transport = transport
        self.local = local
        self.approved_docs = frozenset(approved_docs or [])
        self.clock = clock
        self.p4_writer = p4_writer
        self.p4_enabled = p4_enabled
        self.grant_checker = grant_checker
        # Detect compatibility once. An internal TypeError must not lead to
        # an accidental SECOND server poll / duplicate claimed job.
        try:
            self._poll_accepts_status = "status" in inspect.signature(
                self.transport.poll).parameters
        except (AttributeError, TypeError, ValueError):
            # Tests intentionally use transport=None when testing purely local
            # P3/P4 job validation; this is never used for a network run.
            self._poll_accepts_status = False

    def run_once(self):
        status = self.local.status().get("status", "CONTROL_ERROR")
        if status not in ("READY", "GRIDCRAFT_OFFLINE", "UNAUTHORIZED", "CONTROL_ERROR"):
            status = "CONTROL_ERROR"
        merged = getattr(self.transport, "heartbeat_merged", False)
        if not merged:
            self.transport.heartbeat(status)
        if status != "READY":
            if merged:
                # After server opt-in, poll carries the status even while
                # offline. Never silently leave stale READY in the Edge DB.
                if self._poll_accepts_status:
                    self.transport.poll(status=status)
                else:
                    self.transport.heartbeat(status)
            return {"status":status,"executed":False}
        received = (self.transport.poll(status=status) if self._poll_accepts_status
                    else self.transport.poll())
        job = received.get("job")
        if not job:
            return {"status":"IDLE","executed":False}
        req = job.get("id")
        if not isinstance(req, str) or not REQUEST_ID.fullmatch(req):
            raise UnsafeJob("INVALID_REQUEST_ID")
        if (not isinstance(job.get("expiresAt"), (int, float)) or
                self.clock()*1000 > job["expiresAt"]):
            raise UnsafeJob("EXPIRED_JOB")
        try:
            result = self.execute_job(job)
        except (UnsafeJob, ValueError, PermissionError) as exc:
            result = {"ok": False, "error": str(exc)[:80]}
        except Exception:
            result = {"ok": False, "error": "LOCAL_CONTROL_UNAVAILABLE"}
        # Never execute a remote write, and never retry after an uncertain result.
        response = self.transport.complete(req, bounded_reply(result))
        if response.get("accepted") is not True:
            raise UnsafeJob("COMPLETION_NOT_ACKNOWLEDGED")
        code = result.get("status") or result.get("error") or ("OK" if result.get("ok") else "UNKNOWN")
        return {"status":"DONE","executed":True,"requestId":req,
                "resultCode":str(code)[:48], "backupId":str(result.get("backup_id",""))[:100]}

    def execute_job(self, job):
        if not isinstance(job, dict) or job.get("name") not in READ_TOOLS | P4_TOOLS:
            raise UnsafeJob("METHOD_DENIED")
        name = job["name"]
        args = job.get("args", {})
        if not isinstance(args, dict):
            raise UnsafeJob("INVALID_ARGS")
        # Re-evaluate the exact saved local workbook identity before EVERY job.
        # Closing/replacing a workbook cannot silently inherit its old doc ID.
        if self.grant_checker is not None:
            self.approved_docs = frozenset(self.grant_checker())
        if name in P4_TOOLS:
            if self.p4_writer is None:
                raise UnsafeJob("P4_GATE_OFF")
            # This grant is populated only by the local Windows UI, never by
            # a device job or untrusted remote document contents.
            self.p4_writer.approved_docs = frozenset(self.approved_docs)
            if name == "gridcraft_prepare_write":
                if set(args) != {"doc","sheet","range","values"}:
                    raise UnsafeJob("INVALID_ARGS")
                return bounded_reply(self.p4_writer.prepare(
                    args["doc"],args["sheet"],args["range"],args["values"]))
            if set(args) != {"preview_id","expected_version","request_id","owner_confirmed"}:
                raise UnsafeJob("INVALID_ARGS")
            return bounded_reply(self.p4_writer.commit(
                args["preview_id"],args["expected_version"],args["request_id"],
                write_enabled=self.p4_enabled(),
                owner_confirmed=args["owner_confirmed"]))
        if name == "gridcraft_list_workbooks":
            if args:
                raise UnsafeJob("INVALID_ARGS")
            windows = self.local.windows()
            # List only specifically granted docs; no absolute paths/tokens.
            result = [{"doc":w["doc"], "title":str(w.get("title", ""))[:80],
                       "dirty":w.get("dirty") is True}
                      for w in windows if w.get("doc") in self.approved_docs][:20]
            return bounded_reply({"ok":True,"workbooks":result})
        if set(args) != {"doc","sheet","range"}:
            raise UnsafeJob("INVALID_ARGS")
        doc, sheet, rng = args["doc"], args["sheet"], args["range"]
        if not isinstance(doc, str) or not WORKBOOK_UID.fullmatch(doc) or int(doc) > (1 << 64) - 1:
            raise UnsafeJob("INVALID_DOC")
        if doc not in self.approved_docs:
            raise UnsafeJob("WORKBOOK_NOT_GRANTED")
        if not isinstance(sheet, str) or len(sheet) < 1 or len(sheet) > 80 or any(ord(c)<32 for c in sheet):
            raise UnsafeJob("INVALID_SHEET")
        bounded_range(rng)
        result = self.local.read_range(sheet, rng, doc=doc)
        return bounded_reply({"ok": True, "doc": doc, "sheet": sheet, "range": rng, "data": result})
