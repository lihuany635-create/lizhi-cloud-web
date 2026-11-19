"""GridCraft P4 bounded desktop write engine, deployed through verified private MCP.

Exact P3 read-only MCP remains untouched until the owner approves a separate
P4 release. Requires two explicit phases:
  prepare (read only; returns short-lived preview_id and expected_version)
  commit  (verified owner call through private Site and local write gate).
No remote path or arbitrary engine method reaches the socket. Full workbook
snapshot uses official non-mutating file.saveBytes BEFORE modifying any cell;
snapshot is stored on the owner's Windows account, never returned to cloud.

LIMITATION: expected_version is a SHA256 of the target cells/formulas rather than
a global revision. It prevents stale writes to the chosen area, not unrelated
edits elsewhere. Snapshot is GridCraft's XLSX export and fidelity on arbitrary
Excel features has NOT been independently certified. Do not auto-save originals.
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import secrets
import threading
import time
import uuid
import zipfile

MAX_SNAPSHOT = 8 * 1024 * 1024
MAX_BACKUP_FOLDER = 512 * 1024 * 1024
MIN_KEEP = 20
BACKUP_MAX_AGE = 30 * 86400
MAX_CELLS = 50
MAX_PAYLOAD = 4096
TTL_SECONDS = 90
CELL = re.compile(r"^([A-Z]{1,3})([1-9][0-9]{0,5})$")
DOC_ID = re.compile(r"^[1-9][0-9]{0,19}$")
REQUEST_ID = re.compile(r"^[0-9a-fA-F-]{36}$")
HASH = re.compile(r"^[a-f0-9]{64}$")

class P4Denied(RuntimeError):
    pass

def _column(s: str) -> int:
    value = 0
    for char in s:
        value = value * 26 + (ord(char) - 64)
    return value

def valid_doc(value: str) -> str:
    if not isinstance(value, str) or not DOC_ID.fullmatch(value) or int(value) > (1 << 64) - 1:
        raise P4Denied("INVALID_DOC")
    return value

def bounded_region(region: str) -> tuple[int, int, int, int]:
    if not isinstance(region, str) or len(region) > 22:
        raise P4Denied("INVALID_RANGE")
    parts = region.split(":")
    if len(parts) > 2:
        raise P4Denied("INVALID_RANGE")
    one = CELL.fullmatch(parts[0])
    two = CELL.fullmatch(parts[-1])
    if not one or not two:
        raise P4Denied("INVALID_RANGE")
    a, b = int(one[2]), _column(one[1])
    c, d = int(two[2]), _column(two[1])
    if c < a or d < b or (c-a+1)*(d-b+1) > MAX_CELLS:
        raise P4Denied("RANGE_LIMIT")
    return a, b, c, d

def valid_sheet(sheet: str) -> str:
    if not isinstance(sheet, str) or not 1 <= len(sheet) <= 80 or any(ord(c) < 32 for c in sheet):
        raise P4Denied("INVALID_SHEET")
    return sheet

def clean_values(region: str, values):
    a,b,c,d = bounded_region(region)
    rows, cols = c-a+1, d-b+1
    if not isinstance(values,list) or len(values)!=rows:
        raise P4Denied("VALUE_SHAPE")
    good=[]
    for row in values:
        if not isinstance(row,list) or len(row)!=cols:
            raise P4Denied("VALUE_SHAPE")
        result=[]
        for value in row:
            if value is not None and not isinstance(value,(str,int,float,bool)):
                raise P4Denied("INVALID_CELL_VALUE")
            if isinstance(value,float) and not math.isfinite(value):
                raise P4Denied("INVALID_CELL_VALUE")
            if isinstance(value,str):
                if len(value)>1000 or value.startswith("=") or "\x00" in value:
                    raise P4Denied("FORMULA_OR_VALUE_DENIED")
            if isinstance(value,int) and not isinstance(value,bool) and abs(value)>2**53:
                raise P4Denied("UNSAFE_NUMBER_PRECISION")
            result.append(value)
        good.append(result)
    if len(json.dumps(good,ensure_ascii=False,separators=(",",":")).encode("utf-8"))>MAX_PAYLOAD:
        raise P4Denied("VALUE_LIMIT")
    return good

def check_request_id(rid: str):
    if not isinstance(rid,str) or not REQUEST_ID.fullmatch(rid):
        raise P4Denied("INVALID_REQUEST_ID")
    try:
        if str(uuid.UUID(rid))!=rid.lower():
            raise ValueError()
    except ValueError:
        raise P4Denied("INVALID_REQUEST_ID")
    return rid.lower()

def fingerprint(doc:str,sheet:str,region:str,values) -> str:
    obj={"doc":doc,"sheet":sheet,"range":region,"before":values}
    return hashlib.sha256(json.dumps(obj,sort_keys=True,ensure_ascii=False,separators=(",",":")).encode()).hexdigest()

class P4ReceiptStore:
    """Crash-safe compact receipt ledger with durable replay hashes.

    Corrupt receipt lines are quarantined and recovered for inspection, but
    writes stay locked out until an owner has reviewed the corruption marker.
    Read-only P3 can continue without this component.
    """
    MAX_ROWS = 5000
    MAX_AGE = 30 * 86400

    def __init__(self,folder:Path):
        self.folder=Path(folder)
        self.path=self.folder/"p4-write-receipts.jsonl"
        self.index_path=self.folder/"p4-write-request-hashes.sha256"
        self.recovery_marker=self.folder/"p4-write-receipts.needs-review"
        self._lock=threading.Lock()
        self.seen=set()
        self._replay_hashes=set()
        self.folder.mkdir(parents=True,exist_ok=True)
        if self.index_path.exists():
            try:
                for line in self.index_path.read_text("ascii").splitlines():
                    if not HASH.fullmatch(line):
                        raise ValueError("REPLAY_INDEX_CORRUPT")
                    self._replay_hashes.add(line)
            except (OSError,UnicodeError,ValueError):
                raise P4Denied("REPLAY_INDEX_CORRUPT") from None
        entries=[]
        bad=False
        if self.path.exists():
            try:
                lines=self.path.read_text("utf-8").splitlines()
            except (OSError,UnicodeError):
                raise P4Denied("RECEIPT_READ_FAILED") from None
            for line in lines:
                try:
                    obj=json.loads(line)
                    if not isinstance(obj,dict):
                        raise ValueError("RECEIPT_INVALID")
                    rid=check_request_id(obj["request_id"])
                    if not isinstance(obj.get("preview_id"),str):
                        raise ValueError("RECEIPT_INVALID")
                    digest=obj.get("backup_sha256")
                    if not isinstance(digest,str) or not HASH.fullmatch(digest):
                        raise ValueError("RECEIPT_INVALID")
                    ts=obj.get("ts")
                    if ts is not None and (isinstance(ts,bool) or not isinstance(ts,(int,float)) or
                                            not math.isfinite(ts) or ts<0):
                        raise ValueError("RECEIPT_TIMESTAMP_INVALID")
                    entries.append(obj)
                    self.seen.add(rid)
                    self._replay_hashes.add(hashlib.sha256(rid.encode("ascii")).hexdigest())
                except (KeyError,TypeError,ValueError,P4Denied):
                    bad=True
        # The compact index preserves replay rejection after record rotation.
        self._write_index()
        kept=self._kept(entries)
        if bad:
            stamp=time.strftime("%Y%m%d-%H%M%S",time.localtime())
            target=self.folder/("p4-write-receipts.corrupt-"+stamp+".jsonl")
            if target.exists():
                raise P4Denied("CORRUPT_BACKUP_ALREADY_EXISTS")
            try:
                os.replace(self.path,target)
                self._atomic_rewrite(kept)
                with self.recovery_marker.open("x",encoding="ascii") as out:
                    out.write("RECEIPT_CORRUPT_QUARANTINED\n")
                    out.flush()
                    os.fsync(out.fileno())
            except OSError:
                raise P4Denied("RECEIPT_RECOVERY_FAILED") from None
        elif len(kept)!=len(entries):
            self._atomic_rewrite(kept)
        if self.recovery_marker.exists():
            raise P4Denied("RECEIPT_CORRUPT_QUARANTINED")

    def _kept(self,entries):
        cutoff=time.time()-self.MAX_AGE
        # Old records without ts are treated by count, newer records by age.
        rows=[item for item in entries
              if item.get("ts") is None or item["ts"]>=cutoff]
        return rows[-self.MAX_ROWS:]

    def _atomic_rewrite(self,entries):
        tmp=self.path.with_suffix(".jsonl.tmp")
        try:
            with tmp.open("w",encoding="utf-8") as out:
                for item in entries:
                    out.write(json.dumps(item,sort_keys=True,separators=(",",":"))+"\n")
                out.flush()
                os.fsync(out.fileno())
            os.replace(tmp,self.path)
        except OSError:
            raise P4Denied("RECEIPT_ATOMIC_WRITE_FAILED") from None
        finally:
            if tmp.exists():
                tmp.unlink()

    def _write_index(self):
        # Existing hashes plus all valid legacy records must be durable
        # BEFORE any receipt compaction drops old lines.
        temp=self.index_path.with_suffix(".tmp")
        try:
            with temp.open("w",encoding="ascii") as out:
                for digest in sorted(self._replay_hashes):
                    out.write(digest+"\n")
                out.flush()
                os.fsync(out.fileno())
            os.replace(temp,self.index_path)
        except OSError:
            raise P4Denied("REPLAY_INDEX_WRITE_FAILED") from None
        finally:
            if temp.exists():
                temp.unlink()

    def reserve(self,request_id:str,preview_id:str,backup_sha:str):
        rid=check_request_id(request_id)
        digest=hashlib.sha256(rid.encode("ascii")).hexdigest()
        with self._lock:
            if digest in self._replay_hashes or rid in self.seen:
                raise P4Denied("REPLAY_DENIED")
            if self.recovery_marker.exists():
                raise P4Denied("RECEIPT_CORRUPT_QUARANTINED")
            # Write replay tombstone first: a crash between files safely
            # rejects the ID rather than enabling replay.
            try:
                with self.index_path.open("a",encoding="ascii") as f:
                    f.write(digest+"\n")
                    f.flush()
                    os.fsync(f.fileno())
                self._replay_hashes.add(digest)
                obj={"request_id":rid,"preview_id":preview_id,
                     "backup_sha256":backup_sha,"state":"RESERVED",
                     "ts":int(time.time())}
                with self.path.open("a",encoding="utf-8") as out:
                    out.write(json.dumps(obj,separators=(",",":"))+"\n")
                    out.flush()
                    os.fsync(out.fileno())
                self.seen.add(rid)
                # Compact on each reserve only once >5000; cost is bounded.
                if len(self.seen)>self.MAX_ROWS:
                    entries=[]
                    for line in self.path.read_text("utf-8").splitlines():
                        entries.append(json.loads(line))
                    self._atomic_rewrite(self._kept(entries))
                    self.seen={check_request_id(x["request_id"]) for x in self._kept(entries)}
            except (OSError,ValueError,KeyError):
                raise P4Denied("RECEIPT_SAVE_FAILED") from None

class P4SafeWriter:
    def __init__(self, local, backup_folder:Path, approved_docs=None, clock=time.monotonic):
        self.local=local
        self.backups=Path(backup_folder)
        self.approved_docs=set(approved_docs or [])
        self.clock=clock
        self._lock=threading.RLock()
        self._previews={}
        self.receipts=P4ReceiptStore(self.backups)

    def invalidate_previews(self):
        """Discard stale previews on local disconnect or workbook switch.

        A new document can reuse the old transient doc ID after restart.
        This method does not alter cells, backups or the replay ledger.
        """
        with self._lock:
            self._previews.clear()

    def _preimage(self, doc, sheet, region):
        # Must preserve formulas in the version hash, not merely their computed values.
        value=self.local.read_range(sheet,region,doc=doc,formulas=True)
        if not isinstance(value,dict) or not isinstance(value.get("values"),list):
            raise P4Denied("READBACK_UNAVAILABLE")
        return value["values"]

    def _authorized(self, doc):
        valid_doc(doc)
        if doc not in self.approved_docs:
            raise P4Denied("WORKBOOK_NOT_GRANTED")
        if doc not in {x["doc"] for x in self.local.windows()}:
            raise P4Denied("WORKBOOK_CLOSED")

    def prepare(self,doc,sheet,region,values):
        doc=valid_doc(doc)
        sheet=valid_sheet(sheet)
        data=clean_values(region,values)
        with self._lock:
            self._authorized(doc)
            before=self._preimage(doc,sheet,region)
            if not isinstance(before,list) or len(before)!=len(data) or any(
                not isinstance(row,list) or len(row)!=len(data[i]) for i,row in enumerate(before)
            ):
                raise P4Denied("READBACK_SHAPE")
            key=fingerprint(doc,sheet,region,before)
            preview_id=str(uuid.uuid4())
            self._previews.clear()  # one pending preview per Windows agent session
            self._previews[preview_id]={
                "doc":doc,"sheet":sheet,"range":region,"values":data,
                "before":before,"expected_version":key,"expires":self.clock()+TTL_SECONDS
            }
            return {
                "ok":True,"preview_id":preview_id,"doc":doc,"sheet":sheet,
                "range":region,"before":before,"after":data,"expected_version":key,
                "expires_in_seconds":TTL_SECONDS,"requires_local_write_enable":True,
                "note":"Review the proposed cells. P4 requires explicit owner approval and local write switch."
            }

    def _save_backup(self, doc):
        data=self.local.snapshot_bytes(doc)
        if not isinstance(data,bytes) or not 1<=len(data)<=MAX_SNAPSHOT:
            raise P4Denied("SNAPSHOT_LIMIT")
        # Check the snapshot is a structurally valid XLSX zip before changing cells.
        if not data.startswith(b"PK\x03\x04"):
            raise P4Denied("SNAPSHOT_INVALID")
        try:
            with zipfile.ZipFile(io.BytesIO(data),"r") as z:
                if "[Content_Types].xml" not in z.namelist() or z.testzip() is not None:
                    raise P4Denied("SNAPSHOT_INVALID")
        except (zipfile.BadZipFile,OSError):
            raise P4Denied("SNAPSHOT_INVALID") from None
        self.backups.mkdir(parents=True,exist_ok=True)
        # Fail closed when local backups are full; never silently delete versions.
        total=sum(p.stat().st_size for p in self.backups.glob("p4-*.xlsx") if p.is_file())
        if total + len(data) > MAX_BACKUP_FOLDER:
            raise P4Denied("BACKUP_STORAGE_LIMIT")
        name="p4-"+doc+"-"+uuid.uuid4().hex+".xlsx"
        filename=self.backups/name
        try:
            with filename.open("xb") as f:
                f.write(data)
                f.flush()
                os.fsync(f.fileno())
        except OSError:
            raise P4Denied("SNAPSHOT_SAVE_FAILED") from None
        digest=hashlib.sha256(data).hexdigest()
        # Never upload/export full workbook to Supabase or ChatGPT.
        return {"backup_id":name,"backup_sha256":digest}

    def commit(self,preview_id,expected_version,request_id,write_enabled:bool,owner_confirmed:bool):
        if not isinstance(preview_id,str) or not re.fullmatch(r"[a-f0-9-]{36}",preview_id):
            raise P4Denied("INVALID_PREVIEW")
        if not isinstance(expected_version,str) or not HASH.fullmatch(expected_version):
            raise P4Denied("INVALID_VERSION")
        rid=check_request_id(request_id)
        if write_enabled is not True or owner_confirmed is not True:
            raise P4Denied("OWNER_CONFIRMATION_REQUIRED")
        with self._lock:
            if rid in self.receipts.seen:
                raise P4Denied("REPLAY_DENIED")
            plan=self._previews.pop(preview_id,None)  # single-use even if write fails
            if not plan:
                raise P4Denied("PREVIEW_NOT_FOUND")
            if self.clock()>plan["expires"]:
                raise P4Denied("PREVIEW_EXPIRED")
            if expected_version!=plan["expected_version"]:
                raise P4Denied("VERSION_MISMATCH")
            self._authorized(plan["doc"])
            current=self._preimage(plan["doc"],plan["sheet"],plan["range"])
            if fingerprint(plan["doc"],plan["sheet"],plan["range"],current)!=expected_version:
                raise P4Denied("VERSION_CONFLICT")
            # No GridCraft cell mutation occurs before this full XLSX snapshot.
            backup=self._save_backup(plan["doc"])
            # A user may edit the sheet while GridCraft serializes the snapshot.
            # Recheck immediately before the single guarded write command.
            after_backup=self._preimage(plan["doc"],plan["sheet"],plan["range"])
            if fingerprint(plan["doc"],plan["sheet"],plan["range"],after_backup)!=expected_version:
                raise P4Denied("VERSION_CONFLICT_AFTER_SNAPSHOT")
            self.receipts.reserve(rid,preview_id,backup["backup_sha256"])
            try:
                self.local.write_range(
                    plan["doc"],plan["sheet"],plan["range"],plan["values"],parse=False)
            except Exception:
                # Possible partial success: never retry automatically.
                return {"ok":False,"error":"WRITE_OUTCOME_UNKNOWN",
                        "backup_id":backup["backup_id"],"request_id":rid}
            try:
                observed=self._preimage(plan["doc"],plan["sheet"],plan["range"])
            except Exception:
                return {"ok":False,"error":"READBACK_UNAVAILABLE",
                        "backup_id":backup["backup_id"],"request_id":rid}
            if observed!=plan["values"]:
                return {"ok":False,"error":"VERIFY_MISMATCH",
                        "backup_id":backup["backup_id"],"request_id":rid}
            return {"ok":True,"status":"WRITTEN_NOT_SAVED","doc":plan["doc"],
                "sheet":plan["sheet"],"range":plan["range"],"request_id":rid,
                "backup_id":backup["backup_id"],"backup_sha256":backup["backup_sha256"],
                "verified_cells":sum(map(len,plan["values"]))}
