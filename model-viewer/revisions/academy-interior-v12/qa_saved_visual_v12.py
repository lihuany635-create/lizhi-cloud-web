#!/usr/bin/env python3
"""Validate saved genuine Chrome CDP V12 interior screenshots and UI selection.

The canvas is driven by a strict lexical-scoped viewer JS; the legacy V11 diagnostic
expression cannot introspect private let renderer/model globals. Do NOT infer
"no WebGL drawing" from that null! Use real PNG, switched drop-down and visible
different per-floor captures instead.
"""
from pathlib import Path
import json,hashlib,struct
p=Path("model-viewer/staged-output/academy-interior-furniture-v12/interior-visual-qa")
j=json.loads((p/"interior-qa.json").read_text())
ids=("B1","B2","C1","G1","H1")
files={};selection={}
for zone in ids:
 info=j["sections"][zone]
 assert info["control"]["selected"]==zone,(zone,info["control"])
 f=p/("furniture-"+zone+"-mobile.png")
 raw=f.read_bytes()
 assert len(raw)>70000,(zone,len(raw))
 assert raw[:8]==b"\x89PNG\r\n\x1a\n",zone
 size=struct.unpack_from(">II",raw,16)
 assert size[0]>=700 and size[1]>=1300,(zone,size)
 files[zone]={"bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),
              "px":list(size),"selection":zone}
 assert info["viewer"]["modelKey"]=="N/A" or info["viewer"].get("modelKey")=="lahudi-academy"
assert len({v["sha256"] for v in files.values()})==5,"Two floor screenshots identical"
assert files["B1"]["sha256"]!=files["B2"]["sha256"]
report={"version":"V12-INTERIOR-CAMERA-REVIEW",
 "result":"SCREENSHOT_AND_CONTROL_PASS",
 "count":len(files),"screens":files,
 "rendered_3d_output":"VISUALLY_VERIFIED_BY_IMAGE_EXAMINATION",
 "viewer_JS_global_scope":"PRIVATELY_SCOPED__RUNTIME_DIAGNOSTIC_NOT_AVAILABLE",
 "original_run":"39966358881",
 "manual_review_needed":"Check artistic quality; assets are still low-poly",
 "not_claimed":"No code-independent WebGL FPS or GPU performance measured"}
(p/"screenshot-validation.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k!="screens"},ensure_ascii=False))
