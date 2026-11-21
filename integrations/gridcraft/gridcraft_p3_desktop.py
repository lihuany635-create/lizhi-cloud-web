"""Local-only P3 whitelist adapter for GridCraft 0.19.1.

No arbitrary engine.execute: compiler-selected commands only. Uses the original
P4 authenticated 127.0.0.1 transport; never opens a listener and cannot save.
"""
from __future__ import annotations

import json
import socket

from gridcraft_p4_desktop import P4Local
from gridcraft_desktop_local import GridCraftConnectionError, GridCraftOffline, GridCraftUnauthorized
from gridcraft_p4_safe_write import P4Denied, valid_doc
from gridcraft_p3_format import compile_format


class P3Local(P4Local):
    MAX_FORMAT_REQUEST = 4096
    MAX_FORMAT_REPLY = 8192

    def format_command(self, doc: str, command: str, params: dict):
        valid_doc(doc)
        if doc not in {x["doc"] for x in self.windows()}:
            raise P4Denied("WORKBOOK_CLOSED")
        # NEVER accept command/params independently from untrusted JSON: each
        # command must be the output of the strict format compiler.
        if not isinstance(params,dict) or not isinstance(command,str):
            raise P4Denied("FORMAT_COMMAND_DENIED")
        matched=False
        candidates=[]
        sheet=params.get("sheet")
        if "range" in params:
            rg=params["range"]
            if command=="home.mergeCells":
                candidates.append({"kind":"merge","sheet":sheet,"range":rg,"action":"merge"})
            elif command=="home.unmergeCells":
                candidates.append({"kind":"merge","sheet":sheet,"range":rg,"action":"unmerge"})
            else:
                for k in ("bold","italic","underline","wrapText","fontName","fontSize","fontColor","fillColor","borders","numberFormat","verticalAlign"):
                    v=params.get({"bold":"on","italic":"on","underline":"on","wrapText":"on",
                                  "fontName":"name","fontSize":"size","fontColor":"color","fillColor":"color",
                                  "borders":"preset","numberFormat":"code","verticalAlign":"align"}[k])
                    if k=="verticalAlign":
                        v={"home.alignTop":"top","home.alignMiddle":"middle","home.alignBottom":"bottom"}.get(command)
                    if v is not None:
                        if k=="borders":v={key:params[key] for key in ("preset","style","color") if key in params}
                        if k=="verticalAlign":
                            v={"home.alignTop":"top","home.alignMiddle":"middle","home.alignBottom":"bottom"}.get(command)
                        if v is not None:
                            candidates.append({"kind":"style","sheet":sheet,"range":rg,"field":k,"value":v})
        elif "rows" in params:
            candidates.append({"kind":"rowHeight","sheet":sheet,"rows":params["rows"],"points":params.get("points")})
        elif "cols" in params:
            candidates.append({"kind":"columnWidth","sheet":sheet,"cols":params["cols"],"chars":params.get("chars")})
        else:
            for k in ("orientation","paper","printArea","centerH","centerV"):
                if k in params:
                    candidates.append({"kind":"pageSetup","sheet":sheet,"field":k,"value":params[k]})
        for spec in candidates:
            try:
                compiled=compile_format(spec)
                if compiled.get("supported") and compiled["command"]==command and compiled["params"]==params:
                    matched=True;break
            except (ValueError,P4Denied,TypeError):
                continue
        if not matched:
            raise P4Denied("FORMAT_COMMAND_DENIED")
        body=json.dumps({"id":1,"method":"engine.execute",
                          "params":{"doc":int(doc),"command":command,"params":params}},
                         separators=(",",":"),ensure_ascii=False).encode("utf-8")+b"\n"
        if len(body)>self.MAX_FORMAT_REQUEST:
            raise P4Denied("FORMAT_COMMAND_LIMIT")
        try:
            connection=socket.create_connection(("127.0.0.1",self.port),timeout=self.timeout)
        except OSError:
            raise GridCraftOffline("GridCraft localhost offline") from None
        with connection:
            connection.settimeout(self.timeout)
            with connection.makefile("rb") as stream:
                token=self._token()
                connection.sendall(json.dumps({"id":0,"method":"auth","params":{"token":token}},
                                               separators=(",",":")).encode("utf-8")+b"\n")
                auth=self._bounded_reply(stream,4096)
                if auth.get("id")!=0 or auth.get("ok") is not True or auth.get("result",{}).get("authenticated") is not True:
                    raise GridCraftUnauthorized("Invalid local control token")
                connection.sendall(body)
                answer=self._bounded_reply(stream,self.MAX_FORMAT_REPLY)
                if answer.get("id")!=1 or answer.get("ok") is not True:
                    raise GridCraftConnectionError("GridCraft format command refused")
                return answer.get("result")
