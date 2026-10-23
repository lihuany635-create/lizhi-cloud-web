#!/usr/bin/env python3
"""Academy full campus V8 PBR color contrast after inspecting REAL mobile screenshot.
Only changes selected glTF material PBR baseColorFactor, not geometry or camera.
Keep all 8 wings and 77 compact campus batches.
"""
from pathlib import Path
import sys,json,struct,hashlib,copy
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
SRC=Path("model-viewer/staged-output/academy-entire-campus-optimized-v7/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_OPTIMIZED_v7.glb")
SHA="14f564dd0a2e85c40105d7565ad04a0bf1bb2949d15ec05f96aa45ebf31cdddf"
DST=Path("candidate-output/academy-contrast-v8")
MODEL="lahudi-academy_ENTIRE-GOTHIC-CAMPUS_CONTRAST_v8.glb"
# Explicitly cool gray stone, warm dark sandstone, deep slate roof, warmer trims.
COLOR={
 "ACADEMY_REBUILD_V5__snow":(.21,.26,.32,1),
 "ACADEMY_REBUILD_V5__stone":(.27,.33,.41,1),
 "ACADEMY_REBUILD_V5__stone_highlight":(.40,.45,.48,1),
 "ACADEMY_REBUILD_V5__foundation":(.16,.20,.25,1),
 "ACADEMY_REBUILD_V5__roof":(.035,.065,.105,1),
 "ACADEMY_REBUILD_V5__glass":(.13,.35,.55,.82),
 "ACADEMY_CAMPUS_V6__ash_stone":(.22,.28,.36,1),
 "ACADEMY_CAMPUS_V6__sand_stone":(.36,.25,.16,1),
 "ACADEMY_CAMPUS_V6__cream_trim":(.53,.41,.26,1),
 "ACADEMY_CAMPUS_V6__blue_trim":(.34,.41,.48,1),
 "ACADEMY_CAMPUS_V6__slate":(.028,.053,.090,1),
 "ACADEMY_CAMPUS_V6__copper_roof":(.12,.23,.19,1),
 "ACADEMY_CAMPUS_V6__plaza":(.14,.18,.24,1),
 "ACADEMY_CAMPUS_V6__plaza_band":(.07,.10,.14,1),
 "ACADEMY_CAMPUS_V6__grass":(.12,.21,.16,1),
 "ACADEMY_CAMPUS_V6__snowbank":(.46,.51,.57,1),
 "ACADEMY_CAMPUS_V6__gothic_glass":(.13,.29,.50,.78),
 "ACADEMY_CAMPUS_V6__stained_glass":(.21,.31,.50,.88)
}
def main():
 assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SHA
 m,buf,_=glb.load_glb(SRC)
 before=copy.deepcopy(m["nodes"])
 original_meshes=copy.deepcopy(m["meshes"])
 materials={a.get("name"):a for a in m["materials"]}
 assert set(COLOR).issubset(materials)
 changes={}
 for k,new in COLOR.items():
  p=materials[k]["pbrMetallicRoughness"]
  prev=p.get("baseColorFactor")
  assert prev is not None
  assert list(new)!=list(prev)
  p["baseColorFactor"]=list(new)
  changes[k]={"old":prev,"new":list(new)}
 # Validate large visual contrast ratios in base PBR factors.
 assert COLOR["ACADEMY_CAMPUS_V6__sand_stone"][0]>COLOR["ACADEMY_CAMPUS_V6__ash_stone"][0]+.10
 assert COLOR["ACADEMY_CAMPUS_V6__slate"][0]<COLOR["ACADEMY_CAMPUS_V6__cream_trim"][0]/10
 assert COLOR["ACADEMY_REBUILD_V5__snow"][0]<.25
 assert COLOR["ACADEMY_CAMPUS_V6__plaza"][0]<.17
 assert m["nodes"]==before and m["meshes"]==original_meshes
 m["buffers"][0]["byteLength"]=len(buf)
 js=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
 js+=b" "*((-len(js))%4)
 buf+=b"\x00"*((-len(buf))%4)
 binary=b"".join((struct.pack("<4sII",glb.MAGIC,2,12+8+len(js)+8+len(buf)),
                  struct.pack("<II",len(js),glb.CHUNK_JSON),js,
                  struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)))
 DST.mkdir(parents=True,exist_ok=True)
 (DST/MODEL).write_bytes(binary)
 back,bb,_=glb.load_glb(DST/MODEL)
 assert back["nodes"]==before and back["meshes"]==original_meshes
 assert len(bb)==len(buf)
 report={"school":"拉乎迪學院","scene":"RG-GAME-02",
   "version":"ACADEMY-RB2-ENTIRE-CAMPUS-CONTRAST-V8",
   "model":MODEL,"sha256":hashlib.sha256(binary).hexdigest(),
   "bytes":len(binary),"source_v7_sha256":SHA,
   "pbr_color_revisions":changes,
   "same_eight_wing_building_geometry":True,
   "same_77_batched_campus_meshes":True,
   "source_mesh_geometry_buffer_unchanged":True,
   "node_structure_unchanged":True,
   "GLB_roundtrip":"PASS",
   "rendering":"NOT_RUN",
   "live_visual_approval":"PENDING"}
 (DST/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in report.items() if k!="pbr_color_revisions"},ensure_ascii=False))
if __name__=="__main__":main()
