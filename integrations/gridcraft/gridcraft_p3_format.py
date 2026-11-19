"""GridCraft v0.5.4 P3 candidate: bounded, *single-command* format operations.

No remote MCP publication or automatic disk save. Depends on existing P4 safety
writer and P1 read-only OOXML inventory. Its result is NOT proof of visual or
native Excel roundtrip fidelity. One operation per preview avoids falsely
claiming multi-command atomicity. A failed command is NEVER replayed.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import threading
import time
import uuid

from gridcraft_p4_safe_write import (P4Denied, TTL_SECONDS, bounded_region,
    valid_doc, valid_sheet, check_request_id)
from gridcraft_p2_batch import BatchReceiptStore
from gridcraft_xlsx_fidelity import inventory_bytes, WorkbookInvalid

FIELDS = frozenset({"bold", "italic", "underline", "wrapText", "fontName", "fontSize",
    "fontColor", "fillColor", "borders", "numberFormat", "verticalAlign"})
PRINT_FIELDS = frozenset({"orientation", "paper", "printArea", "centerH", "centerV"})
UNSUPPORTED = frozenset({"horizontalAlign", "images", "shapes", "pageBreaks",
    "sheetProtection", "conditionalFormatting", "headerFooter", "formulaEdit"})
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
COL = re.compile(r"^[A-Z]{1,3}$")
ROW_RANGE = re.compile(r"^([1-9][0-9]{0,5}):([1-9][0-9]{0,5})$")
COL_RANGE = re.compile(r"^([A-Z]{1,3}):([A-Z]{1,3})$")
A1 = re.compile(r"^([A-Z]{1,3})([1-9][0-9]{0,6})$")


def _json(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _digest(obj):
    return hashlib.sha256(_json(obj).encode("utf-8")).hexdigest()


def _col(s):
    n = 0
    for x in s:
        n = n * 26 + ord(x) - 64
    return n


def _all_cells(region):
    a,b,c,d=bounded_region(region)
    if d>16384 or c>1048576:
        raise P4Denied("RANGE_LIMIT")
    def letter(v):
        out = ""
        while v:
            v,r=divmod(v-1,26)
            out=chr(65+r)+out
        return out
    return [f"{letter(col)}{row}" for row in range(a,c+1) for col in range(b,d+1)]


def compile_format(spec):
    """Strict enum-to-one-native-command compiler. Never accept raw command IDs."""
    if not isinstance(spec,dict) or set(spec) not in (
        {"kind","sheet","range","field","value"},
        {"kind","sheet","range","action"},
        {"kind","sheet","rows","points"},
        {"kind","sheet","cols","chars"},
        {"kind","sheet","field","value"}):
        raise P4Denied("FORMAT_ARGS_DENIED")
    sheet=valid_sheet(spec["sheet"])
    kind=spec["kind"]
    if kind=="style" and set(spec)=={"kind","sheet","range","field","value"}:
        rg=spec["range"]
        _all_cells(rg)
        field=spec["field"]
        if field in UNSUPPORTED:
            return {"supported":False,"reason":"UNSUPPORTED", "field":field}
        if field not in FIELDS:
            raise P4Denied("FORMAT_FIELD_DENIED")
        v=spec["value"]
        p={"sheet":sheet,"range":rg}
        if field in ("bold","italic","wrapText"):
            if type(v) is not bool: raise P4Denied("FORMAT_VALUE_DENIED")
            p["on"]=v
            cmd={"bold":"home.bold","italic":"home.italic","wrapText":"home.wrapText"}[field]
        elif field=="underline":
            if type(v) is not bool: raise P4Denied("FORMAT_VALUE_DENIED")
            cmd="home.underline";p.update({"on":v,"style":"single"})
        elif field=="fontName":
            if not isinstance(v,str) or not 1<=len(v)<=60 or any(ord(c)<32 for c in v):
                raise P4Denied("FORMAT_VALUE_DENIED")
            cmd="home.fontName";p["name"]=v
        elif field=="fontSize":
            if type(v) not in (int,float) or not math.isfinite(v) or not 6<=v<=72:
                raise P4Denied("FORMAT_VALUE_DENIED")
            cmd="home.fontSize";p["size"]=v
        elif field in ("fontColor","fillColor"):
            if not isinstance(v,str) or (v not in ("auto","none") and not HEX.fullmatch(v)):
                raise P4Denied("FORMAT_VALUE_DENIED")
            if field=="fontColor" and v=="none":raise P4Denied("FORMAT_VALUE_DENIED")
            cmd="home."+field;p["color"]=v
        elif field=="borders":
            if not isinstance(v,dict) or set(v)-{"preset","style","color"}:
                raise P4Denied("FORMAT_VALUE_DENIED")
            if v.get("preset") not in ("all","outside","insideHorizontal","insideVertical","top","bottom","left","right"):
                raise P4Denied("FORMAT_VALUE_DENIED")
            if "style" in v and v["style"] not in ("thin","medium","thick","dashed","dotted","double"):
                raise P4Denied("FORMAT_VALUE_DENIED")
            if "color" in v and (not isinstance(v["color"],str) or not HEX.fullmatch(v["color"])):
                raise P4Denied("FORMAT_VALUE_DENIED")
            cmd="home.borders";p.update(v)
        elif field=="numberFormat":
            if not isinstance(v,str) or not 1<=len(v)<=60 or any(ord(c)<32 for c in v):
                raise P4Denied("FORMAT_VALUE_DENIED")
            if any(x in v for x in ("\\r","\\n")):
                raise P4Denied("FORMAT_VALUE_DENIED")
            cmd="home.numberFormat";p["code"]=v
        elif field=="verticalAlign":
            if v not in ("top","middle","bottom"):
                raise P4Denied("FORMAT_VALUE_DENIED")
            cmd={"top":"home.alignTop","middle":"home.alignMiddle","bottom":"home.alignBottom"}[v]
        else:
            raise P4Denied("FORMAT_FIELD_DENIED")
        return {"supported":True,"command":cmd,"params":p,"kind":kind,"sheet":sheet,"range":rg}
    if kind=="merge" and set(spec)=={"kind","sheet","range","action"}:
        rg=spec["range"];cells=_all_cells(rg)
        if len(cells)<2:raise P4Denied("MERGE_RANGE_TOO_SMALL")
        if spec["action"] not in ("merge","unmerge"):
            raise P4Denied("FORMAT_VALUE_DENIED")
        return {"supported":True,"command":"home.mergeCells" if spec["action"]=="merge" else "home.unmergeCells",
                "params":{"sheet":sheet,"range":rg},"kind":kind,"sheet":sheet,"range":rg}
    if kind=="rowHeight" and set(spec)=={"kind","sheet","rows","points"}:
        m=ROW_RANGE.fullmatch(spec["rows"])
        if not m or int(m[1])>int(m[2]) or int(m[2])-int(m[1])>39 or int(m[2])>1048576:
            raise P4Denied("FORMAT_RANGE_DENIED")
        p=spec["points"]
        if type(p) not in (int,float) or not math.isfinite(p) or not 6<=p<=120:
            raise P4Denied("FORMAT_VALUE_DENIED")
        return {"supported":True,"command":"home.rowHeight","params":{"sheet":sheet,"rows":spec["rows"],"points":p},"kind":kind,"sheet":sheet}
    if kind=="columnWidth" and set(spec)=={"kind","sheet","cols","chars"}:
        m=COL_RANGE.fullmatch(spec["cols"])
        if not m or _col(m[1])>_col(m[2]) or _col(m[2])-_col(m[1])>15 or _col(m[2])>16384:
            raise P4Denied("FORMAT_RANGE_DENIED")
        p=spec["chars"]
        if type(p) not in (int,float) or not math.isfinite(p) or not 1<=p<=80:
            raise P4Denied("FORMAT_VALUE_DENIED")
        return {"supported":True,"command":"home.columnWidth","params":{"sheet":sheet,"cols":spec["cols"],"chars":p},"kind":kind,"sheet":sheet}
    if kind=="pageSetup" and set(spec)=={"kind","sheet","field","value"}:
        field=spec["field"]
        if field in UNSUPPORTED:
            return {"supported":False,"reason":"UNSUPPORTED","field":field}
        if field not in PRINT_FIELDS:raise P4Denied("FORMAT_FIELD_DENIED")
        v=spec["value"]
        if field=="orientation" and v not in ("portrait","landscape"):
            raise P4Denied("FORMAT_VALUE_DENIED")
        if field=="paper" and v not in ("A4","A3","A5","Letter","Legal"):
            raise P4Denied("FORMAT_VALUE_DENIED")
        if field=="printArea":
            if not isinstance(v,str) or len(v)>24:raise P4Denied("FORMAT_VALUE_DENIED")
            if v!="":
                parts=v.split(":")
                if len(parts)>2:raise P4Denied("FORMAT_VALUE_DENIED")
                ma=[A1.fullmatch(a) for a in (parts[0],parts[-1])]
                if not all(ma):raise P4Denied("FORMAT_VALUE_DENIED")
                r0,c0=int(ma[0][2]),_col(ma[0][1]);r1,c1=int(ma[1][2]),_col(ma[1][1])
                if r0>r1 or c0>c1 or c1>16384 or r1>1048576 or (r1-r0+1)*(c1-c0+1)>200000:
                    raise P4Denied("FORMAT_RANGE_DENIED")
        if field in ("centerH","centerV") and type(v) is not bool:
            raise P4Denied("FORMAT_VALUE_DENIED")
        return {"supported":True,"command":"pageLayout.pageSetup","params":{"sheet":sheet,field:v},"kind":kind,"sheet":sheet}
    raise P4Denied("FORMAT_ARGS_DENIED")


def _inv(local,doc):
    try:
        return inventory_bytes(local.snapshot_bytes(doc), path="<local-only>")
    except (WorkbookInvalid,ValueError,OSError):
        raise P4Denied("FORMAT_SNAPSHOT_INVALID") from None


def _fingerprint(inv):
    # A semantic fingerprint instead of the binary ZIP hash: ZIP timestamps may change.
    return _digest(inv.fields)


def _content_fields(inv):
    out={}
    for k,v in inv.fields.items():
        # New style-only empty cell records are not content changes.
        if k.endswith(":value") and v == ("no_value",None):continue
        if k.endswith(":type") and v == "n" and inv.fields.get(k[:-5]+":value") == ("no_value",None):continue
        if k.endswith((":value",":type",":formula",":formula_kind",":formula_attributes",":formula_unresolved")):
            out[k]=v
    return out


def _sheetkey(inv,name):
    for s in inv.stats.get("sheets",[]):
        if s["name"]==name:return "sheet:"+s["sheet_id"]
    raise P4Denied("FORMAT_SHEET_NOT_FOUND")


def _merge_preflight(inv,op):
    if op.get("kind")!="merge":return
    key=_sheetkey(inv,op["sheet"])
    rg=op["range"]
    merges=inv.fields.get(key+":merges",())
    # Reject intersection with other merges; do not let a command remove a merge off-target.
    rect=bounded_region(rg)
    def intersects(a,b):
        return not (a[2]<b[0] or b[2]<a[0] or a[3]<b[1] or b[3]<a[1])
    for existing in merges:
        # A preexisting merge may exceed the P4 50-cell *write* limit.
        ends=existing.split(":")
        mm=[A1.fullmatch(a) for a in (ends[0],ends[-1])]
        if not all(mm):raise P4Denied("MERGE_SOURCE_INVALID")
        existing_rect=(int(mm[0][2]),_col(mm[0][1]),int(mm[1][2]),_col(mm[1][1]))
        if intersects(rect,existing_rect) and existing!=rg:
            raise P4Denied("MERGE_OVERLAP_DENIED")
    if op["action"]=="unmerge":
        if rg not in merges:raise P4Denied("MERGE_NOT_FOUND")
        return
    if rg in merges:raise P4Denied("MERGE_ALREADY_PRESENT")
    for addr in _all_cells(rg)[1:]:
        pfx=f"{key}:cell:{addr}"
        val=inv.fields.get(pfx+":value")
        if (val is not None and val!=("no_value",None)) or inv.fields.get(pfx+":formula"):
            raise P4Denied("MERGE_WOULD_ERASE_DATA")


def _effect(inv0,inv1,command):
    """A bounded structural effect check; not a rendered-layout fidelity proof."""
    if _content_fields(inv0)!=_content_fields(inv1):
        return "CELL_CONTENT_CHANGED"
    if inv0.warnings or inv1.warnings:
        return "UNRESOLVED_SOURCE_WARNING"
    key=_sheetkey(inv0,command["sheet"])
    if command["kind"]=="style":
        keys=[k for k in inv0.fields.keys()|inv1.fields.keys() if k.startswith(key+":cell:") and k.endswith(":style")]
    elif command["kind"]=="merge":
        keys=[key+":merges"]
    elif command["kind"]=="rowHeight":
        keys=[k for k in inv0.fields.keys()|inv1.fields.keys() if k.startswith(key+":row:")]
    elif command["kind"]=="columnWidth":
        keys=[key+":columns"]
    elif command["kind"]=="pageSetup":
        keys=[key+":pageSetup",key+":pageMargins",key+":printOptions","workbook:defined_names"]
    else: return "UNSUPPORTED"
    if not any(inv0.fields.get(k)!=inv1.fields.get(k) for k in keys):
        return "NO_VERIFIABLE_EFFECT"
    return "STRUCTURAL_EFFECT_OBSERVED"


class P3FormatWriter:
    def __init__(self,p4,*,clock=time.monotonic):
        self.p4=p4
        self.clock=clock
        self._lock=p4._lock
        self._previews={}
        self.session=uuid.uuid4().hex
        # Separate ledger from P2; P4 global index rejects cross-phase duplicate IDs.
        self.receipts=BatchReceiptStore(p4.backups / "p3-format-receipts")

    def invalidate_previews(self):
        with self._lock:
            self._previews.clear()
            self.session=uuid.uuid4().hex

    def prepare(self,doc,spec):
        doc=valid_doc(doc)
        cmd=compile_format(spec)
        if not cmd["supported"]:
            return {"ok":False,"status":"UNSUPPORTED","field":cmd["field"]}
        with self._lock:
            self.p4._authorized(doc)
            inv=_inv(self.p4.local,doc)
            if inv.warnings:raise P4Denied("FORMAT_SOURCE_UNRESOLVED")
            _merge_preflight(inv,spec)
            pid=str(uuid.uuid4())
            version=_fingerprint(inv)
            self._previews.clear()
            self._previews[pid]={"doc":doc,"spec":spec,"compiled":cmd,"version":version,
                                 "expires":self.clock()+TTL_SECONDS}
            return {"ok":True,"preview_id":pid,"expected_version":version,
                    "operation":dict(spec),
                    "document":doc,"expires_in_seconds":TTL_SECONDS,
                    "requires_local_write_enable":True,"requires_owner_confirmation":True,
                    "privacy":"WORKBOOK_VALUES_REDACTED"}

    def commit(self,preview_id,expected_version,request_id,*,write_enabled,owner_confirmed):
        rid=check_request_id(request_id)
        if type(write_enabled) is not bool or type(owner_confirmed) is not bool or not write_enabled or not owner_confirmed:
            raise P4Denied("OWNER_CONFIRMATION_REQUIRED")
        with self._lock:
            if self.receipts.get(rid) is not None:
                raise P4Denied("REPLAY_DENIED")
            plan=self._previews.pop(preview_id,None)
            if not plan:raise P4Denied("PREVIEW_NOT_FOUND")
            if self.clock()>plan["expires"]:raise P4Denied("PREVIEW_EXPIRED")
            if expected_version!=plan["version"]:raise P4Denied("VERSION_MISMATCH")
            doc=plan["doc"]
            self.p4._authorized(doc)
            inv0=_inv(self.p4.local,doc)
            if _fingerprint(inv0)!=expected_version:raise P4Denied("VERSION_CONFLICT")
            _merge_preflight(inv0,plan["spec"])
            backup=self.p4._save_backup(doc)
            inv1=_inv(self.p4.local,doc)
            if _fingerprint(inv1)!=expected_version:raise P4Denied("VERSION_CONFLICT_AFTER_SNAPSHOT")
            record={"version":1,"session":self.session,"doc":doc,"state":"RESERVED",
                    "command":plan["compiled"]["command"],"target":{k:v for k,v in plan["spec"].items() if k!="value"},
                    "expected_version":expected_version,"backup_id":backup["backup_id"],
                    "backup_sha256":backup["backup_sha256"],"observed_version":None}
            self.receipts.reserve(rid,record)
            try:
                self.p4.receipts.reserve(rid,preview_id,backup["backup_sha256"])
            except Exception:
                self.receipts.update(rid,state="ABORTED_NO_WRITE")
                raise
            try:
                self.receipts.update(rid,state="ATTEMPTING")
                # This local call is a strict command whitelist, not arbitrary execute.
                self.p4.local.format_command(doc,plan["compiled"]["command"],plan["compiled"]["params"])
                inv_after=_inv(self.p4.local,doc)
                effect=_effect(inv0,inv_after,plan["compiled"])
                if effect!="STRUCTURAL_EFFECT_OBSERVED":
                    self.receipts.update(rid,state="UNVERIFIED",failure=effect)
                    return {"ok":False,"status":"UNVERIFIED","reason":effect,
                            "backup_id":backup["backup_id"],"request_id":rid}
                final_digest=_fingerprint(inv_after)
                self.receipts.update(rid,state="EFFECT_OBSERVED_NOT_SAVED",observed_version=final_digest)
                return {"ok":True,"status":"EFFECT_OBSERVED_NOT_SAVED","request_id":rid,
                        "backup_id":backup["backup_id"],"verification":"OOXML_STRUCTURAL_ONLY"}
            except Exception:
                try:self.receipts.update(rid,state="OUTCOME_UNKNOWN")
                except Exception:pass
                return {"ok":False,"status":"OUTCOME_UNKNOWN","request_id":rid,
                        "backup_id":backup["backup_id"]}

    def status(self,request_id,*,reconcile=False):
        rid=check_request_id(request_id)
        with self._lock:
            rec=self.receipts.get(rid)
            if rec is None:return {"ok":False,"error":"RECEIPT_NOT_FOUND"}
            reply={"ok":True,"request_id":rid,"state":rec["state"],"backup_id":rec["backup_id"]}
            if not reconcile:return reply
            if rec["session"]!=self.session:return {**reply,"reconciliation":"SESSION_CHANGED_NOT_VERIFIED"}
            try:
                self.p4._authorized(rec["doc"])
                digest=_fingerprint(_inv(self.p4.local,rec["doc"]))
            except Exception:return {**reply,"reconciliation":"READBACK_UNAVAILABLE"}
            if rec.get("observed_version") and digest==rec["observed_version"]:
                state="CURRENT_SNAPSHOT_MATCHES_OBSERVED"
            elif digest==rec["expected_version"]:
                state="CURRENT_SNAPSHOT_MATCHES_BEFORE"
            else:state="DIFFERENT_OR_PARTIAL"
            return {**reply,"reconciliation":state}
