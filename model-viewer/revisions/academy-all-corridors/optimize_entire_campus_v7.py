#!/usr/bin/env python3
"""RG-GAME-02 Academy V7 mobile-friendly combined mesh optimization.

Keep V6's FULL 8-wing school 3D and all styles, preserve original 11,097 nodes.
Bake the 5,145 new cube-based details into batched material+wing meshes:
  ~5k draw calls -> typically ~100 actual draw calls for whole added campus.
Uses standard glTF mesh primitives, not EXT_mesh_gpu_instancing, because the
official 3D viewer currently uses Three.js r128 with no guaranteed instancing.
No screenshots/rendering. No original classroom/portal/roof location changes.
"""
from pathlib import Path
import hashlib,json,math,struct,collections,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
SRC=Path("model-viewer/staged-output/academy-entire-campus-v6/lahudi-academy_ENTIRE-GOTHIC-CAMPUS_RB2_v6.glb")
SHA="e3d2465807cba69ba52a3d1df2a9e3f84a77a970f94301bdeaecd26537d5a6bc"
OUT=Path("candidate-output/academy-optimized-v7")
NAME="lahudi-academy_ENTIRE-GOTHIC-CAMPUS_OPTIMIZED_v7.glb"
P="RG-GAME-02-CAMPUS-REBUILD-V6__"
C="RG-GAME-02-CAMPUS-OPTIMIZED-V7__"

# 24 flat-shaded vertices for every cube; same winding as original shared cube mesh.
FACES=[
 ((0,0,1),[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),
 ((0,0,-1),[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)]),
 ((1,0,0),[(1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1)]),
 ((-1,0,0),[(-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1)]),
 ((0,1,0),[(-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1)]),
 ((0,-1,0),[(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1)]),
]
CUBE_V=[];CUBE_N=[];CUBE_INDEX=[]
for normal,pts in FACES:
 o=len(CUBE_V)
 for p in pts:
  CUBE_V.append([v*.5 for v in p]);CUBE_N.append(normal)
 CUBE_INDEX.extend([o,o+1,o+2,o,o+2,o+3])
assert len(CUBE_V)==len(CUBE_N)==24 and len(CUBE_INDEX)==36

def normal_rotate(q,p):
 x,y,z,w=q
 r=[
  [1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
  [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
  [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
 return [sum(r[i][j]*p[j] for j in range(3)) for i in range(3)]

def bake_cube(n):
 center=n.get("translation",[0,0,0])
 scale=n.get("scale",[1,1,1])
 rot=n.get("rotation",[0,0,0,1])
 assert len(center)==len(scale)==3
 assert min(scale)>0
 verts=[];normals=[]
 for p,normal in zip(CUBE_V,CUBE_N):
  v=normal_rotate(rot,[p[j]*scale[j] for j in range(3)])
  verts.append([v[j]+center[j] for j in range(3)])
  norm=normal_rotate(rot,normal)
  length=math.sqrt(sum(z*z for z in norm))
  assert abs(length-1)<.0001
  normals.append(norm)
 return verts,normals

def build():
 raw=SRC.read_bytes()
 assert hashlib.sha256(raw).hexdigest()==SHA
 m,buf,_=glb.load_glb(SRC)
 original=len(m["nodes"])
 assert original==16242
 core=11097
 nodes=m["nodes"]
 groups=collections.defaultdict(list)
 for n in nodes[core:]:
  assert n.get("name","").startswith(P)
  assert "mesh" in n
  mesh=m["meshes"][n["mesh"]]
  prims=mesh["primitives"]
  assert len(prims)==1 and prims[0].get("mode",4)==4
  mat=prims[0]["material"]
  region=n["extras"]["area"]
  groups[(region,mat)].append(n)
 assert sum(map(len,groups.values()))==5145
 before_mesh=len(m["meshes"])
 # Remove V6's individual new campus nodes after preserving the exact original.
 m["nodes"]=nodes[:core]
 for scene in m["scenes"]:
  scene["nodes"]=[i for i in scene.get("nodes",[]) if i<core]
 new_meshes=[]
 nodes_by_group={}
 triangle_equivalence=0
 for (region,material),shapes in sorted(groups.items()):
  pvals=[];nvals=[];ivals=[];bmin=[math.inf]*3;bmax=[-math.inf]*3
  for n in shapes:
   v,norm=bake_cube(n)
   offset=len(pvals)//3
   for pos,normal in zip(v,norm):
    pvals.extend(pos);nvals.extend(normal)
    for k in range(3):
     bmin[k]=min(bmin[k],pos[k]);bmax[k]=max(bmax[k],pos[k])
   ivals.extend([offset+k for k in CUBE_INDEX])
  vcount=len(pvals)//3
  assert vcount==len(shapes)*24
  assert len(ivals)==len(shapes)*36
  assert max(ivals)==vcount-1 and min(ivals)==0
  # Prefer unsigned 32-bit to avoid per-region 65k vertex cap.
  pi=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(pvals),*pvals),34962)
  ni=glb.add_buffer_view(m,buf,struct.pack("<%sf"%len(nvals),*nvals),34962)
  ii=glb.add_buffer_view(m,buf,struct.pack("<%sI"%len(ivals),*ivals),34963)
  acc=m.setdefault("accessors",[])
  pa=len(acc);acc.append({"bufferView":pi,"componentType":5126,"count":vcount,
    "type":"VEC3","min":[round(x,6) for x in bmin],"max":[round(x,6) for x in bmax]})
  na=len(acc);acc.append({"bufferView":ni,"componentType":5126,"count":vcount,"type":"VEC3"})
  ia=len(acc);acc.append({"bufferView":ii,"componentType":5125,"count":len(ivals),
    "type":"SCALAR","min":[0],"max":[vcount-1]})
  obj={"name":C+region+"__mat"+str(material),"primitives":[{
    "attributes":{"POSITION":pa,"NORMAL":na},"indices":ia,"material":material,"mode":4}]}
  m["meshes"].append(obj)
  mid=len(m["meshes"])-1
  node={"name":C+region+"__mat"+str(material),
        "mesh":mid,"extras":{
         "area":region,"material":material,
         "merged_original_cubes":len(shapes),"triangles":len(ivals)//3,
         "author_approved":False,
         "semantic_source":"revisions/academy-all-corridors/build_entire_campus_v6.py"}}
  m["nodes"].append(node)
  m["scenes"][m.get("scene",0)].setdefault("nodes",[]).append(len(m["nodes"])-1)
  new_meshes.append(node["name"])
  nodes_by_group[region]=nodes_by_group.get(region,0)+1
  triangle_equivalence+=len(ivals)//3
 assert triangle_equivalence==5145*12
 assert len(new_meshes)<220 and len(new_meshes)>20,new_meshes
 assert len(m["nodes"])==core+len(new_meshes)
 assert len(m["meshes"])==before_mesh+len(new_meshes)
 m["buffers"][0]["byteLength"]=len(buf)
 jb=json.dumps(m,ensure_ascii=False,separators=(",",":")).encode()
 jb+=b" "*((-len(jb))%4)
 buf+=b"\x00"*((-len(buf))%4)
 binary=b"".join((struct.pack("<4sII",glb.MAGIC,2,12+8+len(jb)+8+len(buf)),
                 struct.pack("<II",len(jb),glb.CHUNK_JSON),jb,
                 struct.pack("<II",len(buf),glb.CHUNK_BIN),bytes(buf)))
 OUT.mkdir(parents=True,exist_ok=True)
 file=OUT/NAME;file.write_bytes(binary)
 parsed,binary2,_=glb.load_glb(file)
 assert len(parsed["nodes"])==len(m["nodes"]) and len(binary2)==len(buf)
 assert parsed["nodes"][:core]==nodes[:core]
 report={
  "scene":"RG-GAME-02","version":"ACADEMY-RB2-ENTIRE-CAMPUS-OPTIMIZED-V7",
  "model":NAME,"sha256":hashlib.sha256(binary).hexdigest(),"bytes":len(binary),
  "source_v6_sha256":SHA,
  "original_v6_scene_nodes":original,"retained_core_node_count":core,
  "original_new_campus_nodes":5145,
  "merged_campus_nodes":len(new_meshes),
  "eliminated_draw_call_objects":5145-len(new_meshes),
  "full_school_node_count":len(m["nodes"]),
  "triangles_preserved_new_campus":triangle_equivalence,
  "material_and_region_batches":nodes_by_group,
  "original_core_nodes_untouched":True,
  "native_classrooms_library_roof_stairs_unchanged":True,
  "all_full_v6_campus_features_preserved_geometrically":True,
  "glb_roundtrip":"PASS",
  "rendering":"NOT_RUN",
  "mobile_actual_frame_rate":"NOT_BENCHMARKED",
  "author_approval":"PENDING",
  "limits":["Baked geometry from 5145 original cubes grouped by region/material is pixel-equivalent in position/normal/triangle winding when rendered; Chrome/mobile screenshot still needed.",
    "The 5145 individual V6 semantic nodes are replaced by compact batch nodes, but design source script remains versioned in GitHub.",
    "Original 11097 functional-school nodes are unchanged and still potentially the next performance bottleneck."]
 }
 (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in report.items() if k not in ("material_and_region_batches","limits")},ensure_ascii=False))
if __name__=="__main__":build()
