"""P5 Windows-native >=320-row GridCraft v0.19.1 isolated end-to-end test.

Only synthetic XLSX files under a fresh temporary directory. Never use a user's
open workbook, shared folders, production device credentials, or Site/Edge.
"""
from __future__ import annotations

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
from gridcraft_p4_safe_write import P4SafeWriter, P4Denied
from gridcraft_p2_batch import P2BatchWriter
from gridcraft_xlsx_fidelity import compare, inventory_bytes

ROW_COUNT=320


def request(port,token,method,**params):
    with socket.create_connection(("127.0.0.1",port),timeout=5) as conn:
        with conn.makefile("rb") as stream:
            for i,name,args in ((0,"auth",{"token":token}),(1,method,params)):
                conn.sendall(json.dumps({"id":i,"method":name,"params":args}).encode()+b"\n")
                answer=json.loads(stream.readline(1024*1024))
                if answer.get("id") != i or answer.get("ok") is not True:
                    raise RuntimeError(f"Native {name} returned refusal")
                if i == 0 and answer.get("result",{}).get("authenticated") is not True:
                    raise RuntimeError("Native auth rejected")
            return answer.get("result")


def synthetic_commands():
    yield "range.setValues", {"range":"A1:F1","values":[["Seq","Base","Factor","Calculated","Summary",None]]}
    # Several bounded 40-row native commands avoid a single very large JSON frame.
    for start in range(2,ROW_COUNT+2,40):
        end=min(ROW_COUNT+1,start+39)
        values=[]
        for r in range(start,end+1):
            n=r-1
            values.append([n,n*7,2,f"=B{r}+C{r}",None,None])
        yield "range.setValues",{"range":f"A{start}:F{end}","values":values}
    yield "home.bold",{"range":"A1:F1","on":True}
    yield "home.fillColor",{"range":"A1:D1","color":"#DCE6F1"}
    yield "home.borders",{"range":"A1:D321","preset":"outside","style":"thin","color":"#444444"}
    yield "home.mergeCells",{"range":"E1:F1"}
    yield "pageLayout.pageSetup",{"orientation":"landscape","paper":"A4","printArea":"A1:F321"}


def _protect(k):
    k=k.lower()
    return (k.endswith(":formula") or k.endswith(":style") or
            "merge" in k or "print" in k or "pagesetup" in k or
            "colwidth" in k or "rowheight" in k)


def assert_protected_fields(before,after):
    for key,value in before.fields.items():
        if _protect(key) and after.fields.get(key)!=value:
            raise AssertionError("Protected formatting/formula/merge/print changed: "+key)


def run(exe,root):
    cli=exe.with_name("gridcraft-cli.exe")
    original=root/"Synthetic320Source.xlsx"
    working=root/"Synthetic320Working.xlsx"
    env=os.environ.copy()
    for key in ("APPDATA","LOCALAPPDATA","USERPROFILE"):
        d=root/key;d.mkdir();env[key]=str(d)
    script=root/"synthetic320.jsonl"
    script.write_text("\n".join(json.dumps({"command":name,"params":params},separators=(",",":"))
                    for name,params in synthetic_commands()),encoding="utf-8")
    subprocess.run([str(cli),"run","--script",str(script),"--out",str(original),"--quiet"],
                   env=env,cwd=root,check=True,timeout=75)
    initial=original.read_bytes()
    start_inventory=inventory_bytes(initial)
    assert not start_inventory.warnings
    formulas=[k for k in start_inventory.fields if k.endswith(":formula")]
    assert len(formulas)>=ROW_COUNT, f"Only {len(formulas)} formulas"
    assert any("A321:" in k for k in start_inventory.fields),"Last data row absent"
    assert any("merge" in k.lower() for k in start_inventory.fields),"Merge absent"
    shutil.copyfile(original,working)

    with socket.socket() as sock:
        sock.bind(("127.0.0.1",0))
        port=sock.getsockname()[1]
    token=secrets.token_hex(32)
    env["GRIDCRAFT_CONTROL_TOKEN"]=token
    token_file=root/"synthetic.token"
    token_file.write_text(token,encoding="utf-8")
    log_path=root/"native.log"
    with log_path.open("wb") as log:
        child=subprocess.Popen([str(exe),"--control",str(port)],stdout=log,stderr=log,cwd=root,env=env)
        try:
            deadline=time.monotonic()+35
            while True:
                try:
                    request(port,token,"window.list")
                    break
                except (OSError,ValueError):
                    if child.poll() is not None or time.monotonic()>=deadline:
                        raise RuntimeError("Native desktop failed to start") from None
                    time.sleep(0.25)
            request(port,token,"app.open",path=str(working))
            opened=[w for w in request(port,token,"window.list") if Path(w["title"]).stem==working.stem]
            assert len(opened)==1,"Expected one synthetic working doc"
            win=opened[0];doc=str(win["doc"])
            local=P3Local(port=port,token_path=str(token_file),timeout=5)
            writer=P4SafeWriter(local,root/"P4Backups",{doc})
            batch=P2BatchWriter(writer)
            saver=P4SafeSaveWriter(writer)
            baseline=inventory_bytes(local.snapshot_bytes(doc))
            assert len([k for k in baseline.fields if k.endswith(":formula")])>=ROW_COUNT
            selfread=local.read_range("Sheet1","A321:D321",doc=doc,formulas=True)
            assert isinstance(selfread.get("values"),list) and len(selfread["values"])==1

            # The worker executes three real local paths but the relay is an
            # isolated, in-memory mock: NOT a formal Site/Edge E2E test.
            queue=[];completed=[]
            transport=SimpleNamespace(
                heartbeat_merged=True,poll=lambda:{"job":queue.pop()},
                complete=lambda rid,out: completed.append((rid,out)) or {"accepted":True})
            enabled=True
            worker=OutboundWorker(transport=transport,local=local,approved_docs={doc},
                       p4_writer=writer,p2_batch=batch,p4_saver=saver,
                       p4_enabled=lambda:enabled,clock=lambda:1)
            def job(kind,**args):
                jid=str(uuid.uuid4())
                queue.append({"id":jid,"expiresAt":2000,"name":kind,"args":args})
                done=worker.run_once()
                assert done["executed"] and completed[-1][0]==jid
                return completed[-1][1]

            # P5 rejection matrix before authorized write.
            attempt=job("gridcraft_save_prepare",doc=doc,file_name="P5-WillNotWrite.xlsx")
            assert attempt["ok"]
            refused=job("gridcraft_save_commit",preview_id=attempt["preview_id"],
                  expected_version=attempt["expected_version"],request_id=str(uuid.uuid4()),owner_confirmed=False)
            assert refused=={"ok":False,"error":"OWNER_CONFIRMATION_REQUIRED"},refused
            assert not (saver.root/"P5-WillNotWrite.xlsx").exists()
            bad=job("gridcraft_save_prepare",doc=doc,file_name="../outside.xlsx")
            assert bad.get("ok") is False and bad.get("error")=="SAVE_NAME_DENIED"
            bypass=job("gridcraft_app_save",path="C:\\Windows\\System32\\not-allowed.xlsx")
            assert bypass.get("ok") is False and bypass.get("error")=="METHOD_DENIED"

            # True GridCraft localhost P4 cell write, not just an in-memory fake.
            preview=job("gridcraft_prepare_write",doc=doc,sheet="Sheet1",range="F321",values=[["P5_PASS"]])
            assert preview["ok"],preview
            request_id=str(uuid.uuid4())
            done=job("gridcraft_commit_write",preview_id=preview["preview_id"],
                     expected_version=preview["expected_version"],request_id=request_id,owner_confirmed=True)
            assert done.get("status")=="WRITTEN_NOT_SAVED",done
            assert local.read_range("Sheet1","F321",doc=doc)["values"]==[["P5_PASS"]]

            # Non-overlapping bounded P2 batch, still within documented limits.
            ops=[{"sheet":"Sheet1","range":"E310:E311","values":[["BATCH_A"],["BATCH_B"]]},
                 {"sheet":"Sheet1","range":"E312:E313","values":[["BATCH_C"],["BATCH_D"]]}]
            batch_p=job("gridcraft_batch_prepare",doc=doc,operations=ops)
            assert batch_p.get("ok"),batch_p
            batch_rid=str(uuid.uuid4())
            batch_d=job("gridcraft_batch_commit",preview_id=batch_p["preview_id"],
                expected_version=batch_p["expected_version"],request_id=batch_rid,owner_confirmed=True)
            assert batch_d.get("status")=="VERIFIED_NOT_SAVED",batch_d
            assert local.read_range("Sheet1","E310:E313",doc=doc)["values"]==[["BATCH_A"],["BATCH_B"],["BATCH_C"],["BATCH_D"]]

            # Disk copy, one backup, receipt reconciliation, tamper-free restore.
            p=job("gridcraft_save_prepare",doc=doc,file_name="P5-320-Verified.xlsx")
            assert p.get("ok"),p
            save_id=str(uuid.uuid4())
            saved=job("gridcraft_save_commit",preview_id=p["preview_id"],
                      expected_version=p["expected_version"],request_id=save_id,owner_confirmed=True)
            assert saved.get("status")=="DISK_REOPEN_VERIFIED_COPY_ONLY",saved
            status=job("gridcraft_save_status",request_id=save_id,verify_disk=True)
            assert status.get("disk_verification")=="MATCH",status
            copy=saver.root/saved["file_name"]
            backup=writer.backups/saved["backup_id"]
            assert copy.read_bytes()==backup.read_bytes(),"Backup and export mismatch"
            exported=inventory_bytes(copy.read_bytes())
            assert_protected_fields(baseline,exported)
            assert len([k for k in exported.fields if k.endswith(":formula")])>=ROW_COUNT
            restored=root/"RestoredFromBackup.xlsx"
            shutil.copyfile(backup,restored)
            assert compare(inventory_bytes(restored.read_bytes()),exported)["status"]=="MATCH"
            replay=job("gridcraft_save_commit",preview_id=p["preview_id"],
                 expected_version=p["expected_version"],request_id=save_id,owner_confirmed=True)
            assert replay.get("ok") is False and replay.get("error")=="REPLAY_DENIED",replay
            assert len(list(saver.root.glob("*.xlsx")))==1
            assert original.read_bytes()==initial,"Original test fixture changed"

            # The P4/P2 path correctly leaves the test copy dirty. GridCraft
            # refuses to close dirty workbooks. Save ONLY the isolated working
            # XLSX through the direct native test control channel, never by a
            # remotely exposed MCP route, then close/reopen the exported copy.
            request(port,token,"app.save")
            assert original.read_bytes()==initial,"Original test fixture changed during Save"

            # Never close the last native GridCraft document window.
            request(port,token,"file.new")
            request(port,token,"window.close",window=win["window"])
            assert all(w["doc"]!=win["doc"] for w in request(port,token,"window.list"))
            request(port,token,"app.open",path=str(copy))
            reopened=[w for w in request(port,token,"window.list") if Path(w["title"]).stem==copy.stem]
            assert len(reopened)==1 and reopened[0]["dirty"] is False
            new_snapshot=local.snapshot_bytes(str(reopened[0]["doc"]))
            diff=compare(exported,inventory_bytes(new_snapshot))
            assert diff["status"]=="MATCH" and not diff["warnings"],diff["categories"]
            assert local.read_range("Sheet1","F321",doc=str(reopened[0]["doc"]))["values"]==[["P5_PASS"]]
            cli_report=probe_native_gridcraft(saver.root,copy.name,cli)
            assert cli_report.get("status")=="NATIVE_CLI_ROUNDTRIP_PASS",cli_report
            assert original.read_bytes()==initial,"Original test fixture changed"
            print("PASS P5: GridCraft v0.19.1 native 320 rows, 320 formulas, merged/header/print, P4+P2 write, denied routes, backup restore, disk copy, CLI and GUI close/reopen")
        except Exception:
            print(log_path.read_text(encoding="utf-8",errors="replace")[-2500:])
            raise
        finally:
            if child.poll() is None:
                child.terminate()
                child.wait(timeout=10)


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("gridcraft",type=Path)
    args=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="gridcraft-p5-native-") as folder:
        run(args.gridcraft.resolve(strict=True),Path(folder))
