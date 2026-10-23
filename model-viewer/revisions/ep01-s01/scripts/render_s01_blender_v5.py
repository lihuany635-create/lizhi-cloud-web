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
source=root/(paths[0] if paths else "candidate-output/lahudi-academy_ep01_s01_corridor_v5_art_review.glb")
dest=root/"candidate-output"/"blender_v5"
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
    intersects=xlo<=-65.0 and xhi>=-74.0 and zlo<=13 and zhi>=-15 and ylo<=8 and yhi>=3.5
    # avoid scene ground/nongame components if they sprawl hundreds of meters
    long_span=max(xhi-xlo,zhi-zlo,yhi-ylo)
    valid=intersects and long_span<130
    o.hide_render=not valid
    if valid:kept.append(o.name)
scene.render.engine="BLENDER_EEVEE"\nscene.eevee.taa_render_samples=24\nscene.eevee.use_gtao=True\nscene.view_settings.view_transform="Standard"\nscene.view_settings.look="Medium High Contrast"\nscene.view_settings.exposure=.2
scene.display.shading.light="STUDIO"
scene.display.shading.color_type="MATERIAL"
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type="BOTH"
scene.display.shading.background_type="WORLD"
scene.world=bpy.data.worlds.new("S01_geometry_QA")
scene.world.color=(0.65,0.74,0.82)
scene.world.use_nodes=True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value=(.53,.64,.76,1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value=.8
# All original GLB point lights stay hidden in this neutral QA scene.
# Add controlled warm sun and soft fill to test winter exterior/indoor contrast.
sun_data=bpy.data.lights.new("EP01_WINTER_GOLDEN_SUN","SUN")
sun_data.energy=2.0
sun_data.color=(1.0,.76,.48)
sun_data.angle=.12
sun=bpy.data.objects.new("EP01_WINTER_GOLDEN_SUN",sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler=(.52,.72,.10)
fill_data=bpy.data.lights.new("EP01_INTERIOR_SOFT_FILL","AREA")
fill_data.energy=1800
fill_data.color=(.65,.75,1.0)
fill_data.shape="DISK"
fill_data.size=18
fill=bpy.data.objects.new("EP01_INTERIOR_SOFT_FILL",fill_data)
scene.collection.objects.link(fill)
fill.location=(-71.5,2.8,9.2)
fill.rotation_euler=(Vector((-70.5,0,5.4))-fill.location).to_track_quat("-Z","Y").to_euler()
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
  {"name":"S01_V5_A01_left_doors_right_windows","pos":[-70.55,5.52,9.6],"target":[-70.54,5.48,-8.4],"fov_deg":64},
  {"name":"S01_V5_A02_right_high_windows","pos":[-70.95,5.48,7.8],"target":[-68.68,5.86,4.1],"fov_deg":62},
  {"name":"S01_V5_A03_far_ascending_stair","pos":[-70.48,5.42,0.9],"target":[-70.91,5.50,-10.6],"fov_deg":64}
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
 "renderer":"Blender Eevee / actual glTF PBR textures / controlled winter sun",
 "scene_meshes":sum(o.type=="MESH" for o in all_obj),
 "corridor_meshes_rendered":len(kept),
 "reference_camera_match":"NOT_RUN",
 "proposed_camera_direction":"+Z->-Z",
 "source_stair_conflict":"ORIGINAL_SIDE_STAIR_PRESENT",
 "original_EP01_footage_overlay":"NOT_RUN",
 "source_annotation":"A01/A02/A03 are engineering cameras, not exact film cameras",
 "S06_touched":False,
 "image_files":[str((dest/(v["name"]+".png")).relative_to(root)) for v in views]
}
(dest/"render_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("RG_S01_REPORT",json.dumps(report,ensure_ascii=False),flush=True)
