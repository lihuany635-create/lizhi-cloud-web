"""P4 strictly scoped local GridCraft control socket adapter, never published as MCP.

P3 GridCraftLocal remains READ ONLY. This subclass exposes only full XLSX
snapshot and bounded range.setValues to the P4SafeWriter. The official
engine.execute does not allow arbitrary command IDs from network JSON.
"""
from __future__ import annotations

import base64
import json
import re
import socket

from gridcraft_desktop_local import GridCraftLocal, GridCraftConnectionError, GridCraftOffline, GridCraftUnauthorized
from gridcraft_p4_safe_write import MAX_SNAPSHOT, P4Denied, valid_doc, valid_sheet, clean_values

MAX_SNAPSHOT_RESPONSE = (MAX_SNAPSHOT * 4 // 3) + 2048
MAX_WRITE_REQUEST = 6500

class P4Local(GridCraftLocal):
    def _targeted(self, method, params, max_reply, max_request=MAX_WRITE_REQUEST):
        # Private calls only. This never expands GridCraftLocal.ALLOWED_METHODS.
        if method not in ("file.saveBytes", "engine.execute"):
            raise P4Denied("METHOD_DENIED")
        doc=params.get("doc")
        if not isinstance(doc,int) or isinstance(doc,bool) or not 1<=doc<=(1<<64)-1:
            raise P4Denied("INVALID_DOC")
        if method=="file.saveBytes":
            if set(params)!={"doc","format"} or params["format"]!="xlsx":
                raise P4Denied("SNAPSHOT_METHOD_DENIED")
        else:
            if set(params)!={"doc","command","params"} or params["command"]!="range.setValues":
                raise P4Denied("WRITE_METHOD_DENIED")
            p=params["params"]
            if not isinstance(p,dict) or set(p)!={"sheet","range","values","parse"} or p["parse"] is not False:
                raise P4Denied("WRITE_ARGS_DENIED")
            valid_sheet(p["sheet"])
            clean_values(p["range"],p["values"])
        encoded=json.dumps({"id":1,"method":method,"params":params},
                           separators=(",",":"),ensure_ascii=False).encode("utf-8")+b"\n"
        if len(encoded)>max_request:
            raise P4Denied("WRITE_REQUEST_LIMIT")
        # Never expose 7979 over LAN/public Internet: this is loopback only.
        try:
            connection=socket.create_connection(("127.0.0.1",self.port),timeout=self.timeout)
        except OSError:
            raise GridCraftOffline("GridCraft localhost is not online") from None
        with connection:
            connection.settimeout(self.timeout)
            with connection.makefile("rb") as stream:
                hello=json.dumps({"id":0,"method":"auth","params":{"token":self._token()}},
                                 separators=(",",":")).encode("utf-8")+b"\n"
                connection.sendall(hello)
                auth=self._bounded_reply(stream,4096)
                if auth.get("id")!=0 or auth.get("ok") is not True or auth.get("result",{}).get("authenticated") is not True:
                    raise GridCraftUnauthorized("GridCraft control token not valid")
                connection.sendall(encoded)
                resp=self._bounded_reply(stream,max_reply)
                if resp.get("id")!=1 or resp.get("ok") is not True:
                    raise GridCraftConnectionError("GridCraft controlled command was refused")
                return resp.get("result")

    @staticmethod
    def _bounded_reply(stream,max_bytes):
        b=stream.readline(max_bytes+1)
        if not b or len(b)>max_bytes:
            raise GridCraftConnectionError("bounded response length exceeded")
        try:
            obj=json.loads(b)
        except ValueError:
            raise GridCraftConnectionError("GridCraft response was not JSON") from None
        if not isinstance(obj,dict):
            raise GridCraftConnectionError("invalid response")
        return obj

    def snapshot_bytes(self, doc: str) -> bytes:
        valid_doc(doc)
        if doc not in {w["doc"] for w in self.windows()}:
            raise P4Denied("WORKBOOK_CLOSED")
        o=self._targeted("file.saveBytes",{"doc":int(doc),"format":"xlsx"},
                         max_reply=MAX_SNAPSHOT_RESPONSE,max_request=1024)
        if not isinstance(o,dict) or not isinstance(o.get("base64"),str):
            raise P4Denied("SNAPSHOT_NOT_AVAILABLE")
        if len(o["base64"])>MAX_SNAPSHOT_RESPONSE:
            raise P4Denied("SNAPSHOT_LIMIT")
        try:
            data=base64.b64decode(o["base64"],validate=True)
        except (ValueError,base64.binascii.Error):
            raise P4Denied("SNAPSHOT_INVALID") from None
        if len(data)>MAX_SNAPSHOT:
            raise P4Denied("SNAPSHOT_LIMIT")
        return data

    def write_range(self,doc:str,sheet:str,region:str,values,parse:bool=False):
        valid_doc(doc)
        valid_sheet(sheet)
        if parse is not False:
            raise P4Denied("WRITE_PARSE_DENIED")
        clean_values(region,values)
        if doc not in {w["doc"] for w in self.windows()}:
            raise P4Denied("WORKBOOK_CLOSED")
        # Uses actual official desktop control engine.execute command.
        # The doc is a JSON u64 number, not a potentially rounded JS number.
        return self._targeted("engine.execute",{
            "doc":int(doc),"command":"range.setValues",
            "params":{"sheet":sheet,"range":region,"values":values,"parse":False}
        },max_reply=8192)
