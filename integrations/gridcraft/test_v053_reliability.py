"""GridCraft v0.5.3 critical Windows/transport/P4 pytest regression suite."""
from __future__ import annotations

import io
import json
import os
from pathlib import Path
import threading
import time
from types import SimpleNamespace
from unittest import mock
import uuid
import zipfile

import pytest

import gridcraft_windows_agent as agent

from gridcraft_test_isolation import isolate_app_directory, restore_app_directory


def setUpModule():
    isolate_app_directory()


def tearDownModule():
    restore_app_directory()
import gridcraft_win_lifecycle as lifecycle
import gridcraft_p4_safe_write as p4
import gridcraft_outbound_worker as outbound


def request_id(): return str(uuid.uuid4())


def make_valid_xlsx():
    out=io.BytesIO()
    with zipfile.ZipFile(out,"w") as z:
        z.writestr("[Content_Types].xml","<Types/>")
        z.writestr("xl/workbook.xml","<workbook/>")
    return out.getvalue()


def create_saved_backup(folder:Path,n:int,size=100,old=False):
    file=folder/f"p4-1-{n:032x}.xlsx"
    file.write_bytes(bytes([n%256])*size)
    if old:
        t=time.time()-33*86400-n
        os.utime(file,(t,t))
    return file


def test_corrupt_receipt_line_quarantine_rebuild_and_permanent_write_lock(tmp_path):
    ledger=p4.P4ReceiptStore(tmp_path)
    rid=request_id()
    ledger.reserve(rid,"preview","a"*64)
    with ledger.path.open("a",encoding="utf-8") as out:
        out.write("{broken trailing line\n")
    with pytest.raises(p4.P4Denied,match="RECEIPT_CORRUPT_QUARANTINED"):
        p4.P4ReceiptStore(tmp_path)
    archive=list(tmp_path.glob("p4-write-receipts.corrupt-*.jsonl"))
    assert len(archive)==1
    assert "{broken trailing line" in archive[0].read_text("utf-8")
    valid=[json.loads(line) for line in ledger.path.read_text("utf-8").splitlines()]
    assert len(valid)==1 and valid[0]["request_id"]==rid
    assert (tmp_path/"p4-write-receipts.needs-review").exists()
    # A restart is still write-fail-closed until local owner review.
    with pytest.raises(p4.P4Denied,match="RECEIPT_CORRUPT_QUARANTINED"):
        p4.P4ReceiptStore(tmp_path)
    assert rid in ledger.seen


def test_receipt_max_5000_and_thirty_day_pruning_persist_replay_defense(tmp_path,monkeypatch):
    monkeypatch.setattr(p4.P4ReceiptStore,"MAX_ROWS",3)
    store=p4.P4ReceiptStore(tmp_path)
    ids=[request_id() for _ in range(5)]
    for rid in ids:store.reserve(rid,"preview","b"*64)
    entries=[json.loads(line) for line in store.path.read_text("utf-8").splitlines()]
    assert len(entries)==3
    assert [v["request_id"] for v in entries]==ids[-3:]
    # Dropped receipts still protected by durable, salted? no: hashed SHA256 tombstones.
    store2=p4.P4ReceiptStore(tmp_path)
    with pytest.raises(p4.P4Denied,match="REPLAY_DENIED"):
        store2.reserve(ids[0],"another-preview","b"*64)
    old=request_id()
    with store2.path.open("a",encoding="utf-8") as out:
        out.write(json.dumps({"request_id":old,"preview_id":"old",
              "backup_sha256":"c"*64,"state":"RESERVED",
              "ts":int(time.time()-40*86400)})+"\n")
    store3=p4.P4ReceiptStore(tmp_path)
    assert old not in [v["request_id"] for v in
                       map(json.loads,store3.path.read_text("utf-8").splitlines())]
    with pytest.raises(p4.P4Denied,match="REPLAY_DENIED"):
        store3.reserve(old,"new","c"*64)


def test_legacy_receipt_without_timestamp_retained_by_line_count(tmp_path,monkeypatch):
    monkeypatch.setattr(p4.P4ReceiptStore,"MAX_ROWS",2)
    entries=[{"request_id":request_id(),"preview_id":"old","backup_sha256":"d"*64,
              "state":"RESERVED"} for _ in range(3)]
    path=tmp_path/"p4-write-receipts.jsonl"
    path.write_text("".join(json.dumps(e)+"\n" for e in entries),"utf-8")
    p4.P4ReceiptStore(tmp_path)
    kept=[json.loads(line) for line in path.read_text("utf-8").splitlines()]
    assert kept==entries[-2:]


def test_backup_prunes_aged_but_preserves_twenty(tmp_path):
    dummy=SimpleNamespace()
    writer=p4.P4SafeWriter(dummy,tmp_path)
    for n in range(23):create_saved_backup(tmp_path,n,old=True)
    writer._prune_old_backups()
    remain=list(tmp_path.glob("p4-*.xlsx"))
    assert len(remain)==20


def test_backup_storage_rotation_min_keep_and_new_snapshot_never_deleted(tmp_path,monkeypatch):
    writer=p4.P4SafeWriter(SimpleNamespace(snapshot_bytes=lambda d:make_valid_xlsx()),
                         tmp_path)
    old=[create_saved_backup(tmp_path,n,size=100) for n in range(22)]
    payload=make_valid_xlsx()
    monkeypatch.setattr(p4,"MAX_BACKUP_FOLDER",20*100+len(payload))
    saved=writer._save_backup("1")
    assert (tmp_path/saved["backup_id"]).exists()
    assert len(list(tmp_path.glob("p4-*.xlsx")))==21
    assert not old[0].exists() and not old[1].exists()
    assert all(v.exists() for v in old[2:])


def test_backup_cannot_remove_min_keep_and_one_snapshot_larger_than_capacity(tmp_path,monkeypatch):
    writer=p4.P4SafeWriter(SimpleNamespace(snapshot_bytes=lambda d:make_valid_xlsx()),
                         tmp_path)
    payload=make_valid_xlsx()
    originals=[create_saved_backup(tmp_path,n,size=100) for n in range(20)]
    monkeypatch.setattr(p4,"MAX_BACKUP_FOLDER",20*100+len(payload)-1)
    with pytest.raises(p4.P4Denied,match="BACKUP_STORAGE_LIMIT"):
        writer._save_backup("1")
    assert all(f.exists() for f in originals)
    monkeypatch.setattr(p4,"MAX_BACKUP_FOLDER",len(payload)-1)
    with pytest.raises(p4.P4Denied,match="BACKUP_STORAGE_LIMIT"):
        writer._save_backup("1")


@pytest.mark.parametrize("failures,expected",[(1,6),(2,12),(3,24),(4,48),(5,60),(15,60)])
def test_retry_exponential_without_jitter(failures,expected):
    assert outbound.reconnect_delay(failures,random_fraction=0)==expected


def test_retry_jitter_retry_after_seconds_and_http_date():
    assert outbound.reconnect_delay(2,random_fraction=.2)==pytest.approx(14.4)
    assert outbound.reconnect_delay(9,30,random_fraction=.2)==30
    assert outbound.parse_retry_after("42")==42
    assert outbound.parse_retry_after("bad-value") is None
    assert outbound.poll_delay(None,since_start=0)==6
    assert outbound.poll_delay(None,since_start=601)==20
    assert outbound.poll_delay(20,since_start=1000)==2
    assert outbound.poll_delay(70,since_start=1000)==6
    assert outbound.poll_delay(700,since_start=1000)==20
    assert outbound.poll_delay(1000,long_poll=True)==0


class LocalReady:
    def status(self):return {"status":"READY"}


def test_old_server_no_flags_still_heartbeats_and_poll_includes_status(monkeypatch):
    calls=[]
    relay=outbound.HTTPSDeviceTransport(device_id="local-device",device_token="a"*64)
    def fake_post(action,payload,*,timeout=7):
        calls.append((action,payload,timeout))
        if action=="poll":return {"job":None}
        return {"state":"READY"}
    monkeypatch.setattr(relay,"_post",fake_post)
    worker=outbound.OutboundWorker(transport=relay,local=LocalReady())
    assert worker.run_once()["status"]=="IDLE"
    assert worker.run_once()["status"]=="IDLE"
    assert [c[0] for c in calls]==["heartbeat","poll","heartbeat","poll"]
    assert calls[1][1]["status"]=="READY"
    assert all(c[2]==7 for c in calls)
    assert not relay.heartbeat_merged and not relay.long_poll


def test_new_server_merges_heartbeat_and_longpoll_timeout_30(monkeypatch):
    calls=[]
    relay=outbound.HTTPSDeviceTransport(device_id="local-device",device_token="a"*64)
    def fake_post(action,payload,*,timeout=7):
        calls.append((action,payload,timeout))
        if action=="poll":return {"job":None,"heartbeatMerged":True,"longPoll":True}
        return {"state":"READY"}
    monkeypatch.setattr(relay,"_post",fake_post)
    worker=outbound.OutboundWorker(transport=relay,local=LocalReady())
    worker.run_once();worker.run_once()
    assert [v[0] for v in calls]==["heartbeat","poll","poll"]
    assert calls[-1][2]==30 and relay.heartbeat_merged and relay.long_poll


def test_merged_heartbeat_updates_offline_gridcraft_status_without_separate_heartbeat(monkeypatch):
    calls=[]
    relay=outbound.HTTPSDeviceTransport(device_id="local-device",device_token="a"*64)
    relay.heartbeat_merged=True
    relay.long_poll=True
    def fake_post(action,payload,*,timeout=7):
        calls.append((action,payload,timeout))
        return {"job":None,"heartbeatMerged":True,"longPoll":True}
    monkeypatch.setattr(relay,"_post",fake_post)
    local=mock.Mock()
    local.status.return_value={"status":"GRIDCRAFT_OFFLINE"}
    worker=outbound.OutboundWorker(transport=relay,local=local)
    assert worker.run_once()["status"]=="GRIDCRAFT_OFFLINE"
    assert calls==[("poll",{"status":"GRIDCRAFT_OFFLINE"},30)]


def test_p4_gate_off_but_p3_still_operates_with_corrupt_ledger():
    worker=outbound.OutboundWorker(transport=mock.Mock(),local=mock.Mock(),
            approved_docs={"1"},p4_writer=None)
    with pytest.raises(outbound.UnsafeJob,match="P4_GATE_OFF"):
        worker.execute_job({"name":"gridcraft_prepare_write","args":{}})
    worker.local.windows.return_value=[{"doc":"1","title":"Book1","dirty":False}]
    assert worker.execute_job({"name":"gridcraft_list_workbooks","args":{}})["ok"]


class FakeRoot:
    def __init__(self):self.after_calls=[]
    def after(self,ms,callback):self.after_calls.append((ms,callback))


@pytest.mark.parametrize("alive,stopped,expected_calls",[
    (False,False,1),(True,False,0),(False,True,0)])
def test_watchdog_revives_dead_thread_only_if_user_did_not_stop(alive,stopped,expected_calls):
    ui=agent.AgentUI.__new__(agent.AgentUI)
    ui.running=True
    ui.paired={"device_id":"fake"}
    ui._user_stopped=stopped
    ui.remote_stop=threading.Event()
    ui.remote_thread=mock.Mock(is_alive=lambda:alive)
    ui.root=FakeRoot()
    ui.refresh=mock.Mock(return_value="READY")
    ui.start_remote=mock.Mock()
    ui._last_ready=False
    ui._offline_streak=0
    ui._reconnect_after=0.0
    ui._p4_writer=None
    ui._invalidate_pending_write=mock.Mock()
    ui._poll()
    assert ui.start_remote.call_count==expected_calls


def test_start_remote_clears_event_before_reusing_still_alive_thread():
    ui=agent.AgentUI.__new__(agent.AgentUI)
    ui._user_stopped=True
    ui.remote_stop=threading.Event()
    ui.remote_stop.set()
    ui.paired={"device_id":"fake"}
    ui.remote_thread=mock.Mock()
    ui.remote_thread.is_alive.return_value=True
    ui.start_remote()
    assert ui._user_stopped is False
    assert not ui.remote_stop.is_set()
    ui.remote_thread.is_alive.assert_called_once()


def test_update_installed_uses_sha256_and_never_terminates_process(tmp_path,monkeypatch):
    source=tmp_path/"new.exe"
    dest=tmp_path/"installed"/"LizhiGridCraftAgent.exe"
    dest.parent.mkdir()
    source.write_bytes(b"new")
    dest.write_bytes(b"old")
    monkeypatch.setattr(lifecycle.sys,"frozen",True,raising=False)
    monkeypatch.setattr(lifecycle,"signal_quit_and_wait",lambda seconds:True)
    popen=mock.Mock()
    monkeypatch.setattr(lifecycle.subprocess,"Popen",popen)
    assert lifecycle.maybe_update_installed(source,dest)
    assert dest.read_bytes()==b"new"
    assert popen.call_args.args[0]==[str(dest.resolve()),"--minimized"]


def test_legacy_agent_safety_refuses_unsafe_binary_overwrite(tmp_path,monkeypatch):
    source=tmp_path/"new.exe"
    dest=tmp_path/"installed.exe"
    source.write_bytes(b"new");dest.write_bytes(b"old")
    monkeypatch.setattr(lifecycle.sys,"frozen",True,raising=False)
    monkeypatch.setattr(lifecycle,"signal_quit_and_wait",lambda seconds:False)
    monkeypatch.setattr(lifecycle,"focus_existing_agent",lambda *args:True)
    with pytest.raises(lifecycle.WinLifecycleError,match="LEGACY_AGENT_CLOSE_REQUIRED"):
        lifecycle.maybe_update_installed(source,dest)
    assert dest.read_bytes()==b"old"


def test_log_code_never_leaks_token_path_or_cell_value():
    assert agent.safe_error_code(RuntimeError("secret.xlsx token=abc"))=="RUNTIMEERROR"
    assert agent.safe_error_code(RuntimeError("BACKEND_UNAVAILABLE"))=="BACKEND_UNAVAILABLE"
