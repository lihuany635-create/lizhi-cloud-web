"""Headless Blender geometry QA for existing EP01 S01 corridor GLB.
Perspective shots are engineering probes, not EP01 1:1 shot overlays.
"""
import bpy, sys, pathlib, math, hashlib, json
from mathutils import Vector
root=pathlib.Path.cwd()
if "--" in sys.argv:
    paths=sys.argv[sys.argv.index("--")+1:]
else:
    paths=[]
source=root/(paths[0] if paths else "candidate-output/lahudi-academy_ep01_s01_corridor_v3_review.glb")
dest=root/"candidate-output"/"blender"
dest.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
scene=bpy.context.scene
all_obj=list(scene.objects)
print("RG_S01_IMPORTED",len(all_obj),flush=True)
# glTF world (x, y, z) -> Blender (x, -z, y)
def cv(p):return Vector((p[0],-p[2],p[1]))
kept=[]
for o in all_obj:
    if o.type!="MESH":
        o.hide_render=True
        continue
    bb=[o.matrix_world @ Vector(v) for v in o.bound_box]
    # Blender x: original x, Blender y: negative of glTF z, Blender z: glTF y.
    xlo,xhi=min(p.x for p in bb),max(p.x for p in bb)
    zlo,zhi=min(-p.y for p in bb),max(-p.y for p in bb)
    ylo,yhi=min(p.z for p in bb),max(p.z for p in bb)
    intersects=xlo<=-68.0 and xhi>=-74.0 and zlo<=13 and zhi>=-9 and ylo<=8 and yhi>=3.5
    # avoid scene ground/nongame components if they sprawl hundreds of meters
    long_span=max(xhi-xlo,zhi-zlo,yhi-ylo)
    valid=intersects and long_span<130
    o.hide_render=not valid
    if valid:kept.append(o.name)
scene.render.engine="BLENDER_WORKBENCH"
scene.display.shading.light="STUDIO"
scene.display.shading.color_type="MATERIAL"
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type="BOTH"
scene.display.shading.background_type="WORLD"
scene.world.color=(0.22,0.26,0.29)
for mat in bpy.data.materials:
 if mat.use_nodes:
  principled=next((n for n in mat.node_tree.nodes if n.type=="BSDF_PRINCIPLED"),None)
  if principled:
   c=principled.inputs["Base Color"].default_value
   mat.diffuse_color=(float(c[0]),float(c[1]),float(c[2]),float(principled.inputs["Alpha"].default_value))
camera_data=bpy.data.cameras.new("S01_QA_camera")
camera=bpy.data.objects.new("S01_QA_camera",camera_data)
scene.collection.objects.link(camera)
scene.camera=camera
scene.render.film_transparent=False
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.resolution_x=1100
scene.render.resolution_y=620
camera_data.type="PERSP"
camera_data.sensor_fit="HORIZONTAL"
camera_data.clip_end=1200
views=[
  {"name":"S01_A01_corridor_look_forward","pos":[-70.37,5.55,-11.7],"target":[-70.49,5.55,9.6],"fov_deg":63},
  {"name":"S01_A02_window_right","pos":[-71.05,5.65,2.0],"target":[-68.7,5.65,6.0],"fov_deg":59},
  {"name":"S01_A03_stair_end","pos":[-70.22,5.45,5.4],"target":[-72.1,4.55,12.1],"fov_deg":65}
]
for view in views:
    camera.location=cv(view["pos"])
    camera.rotation_euler=(cv(view["target"])-camera.location).to_track_quat("-Z","Y").to_euler()
    camera_data.lens=36/(2*math.tan(math.radians(view["fov_deg"])/2))
    scene.render.filepath=str(dest/(view["name"]+".png"))
    bpy.ops.render.render(write_still=True)
    print("RG_S01_RENDERED",view["name"],flush=True)
report={
 "source":str(source.relative_to(root)),
 "source_sha256":hashlib.sha256(source.read_bytes()).hexdigest(),
 "renderer":"Blender Workbench / studio material color",
 "scene_meshes":sum(o.type=="MESH" for o in all_obj),
 "corridor_meshes_rendered":len(kept),
 "reference_camera_match":"NOT_RUN",
 "original_EP01_footage_overlay":"NOT_RUN",
 "source_annotation":"A01/A02/A03 are engineering cameras, not exact film cameras",
 "S06_touched":False,
 "image_files":[str((dest/(v["name"]+".png")).relative_to(root)) for v in views]
}
(dest/"render_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("RG_S01_REPORT",json.dumps(report,ensure_ascii=False),flush=True)
