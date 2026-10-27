# -*- coding: utf-8 -*-
"""G0 驗證截圖：全校俯視、1F 剖切平面、2F 剖切平面、四象限軸測、兩個挑空仰視
python lahudi_g0_render.py <working.blend> <out_dir>"""
import bpy, sys, os, math
from mathutils import Vector
blend, out = sys.argv[-2:]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
for eng in ("BLENDER_WORKBENCH", "BLENDER_WORKBENCH_NEXT"):
    try:
        sc.render.engine = eng; break
    except Exception:
        pass
sh = sc.display.shading
sh.light = "STUDIO"; sh.color_type = "MATERIAL"; sh.show_shadows = False; sh.show_cavity = True
sh.cavity_type = "BOTH"; sh.show_object_outline = True
sc.render.film_transparent = False
sc.world = sc.world or bpy.data.worlds.new("W")
sc.render.image_settings.file_format = "PNG"

def shot(name, loc, target, ortho=None, clip=(0.1, 1000), res=(1600, 1430), lens=24):
    cd = bpy.data.cameras.new(name); cd.clip_start, cd.clip_end = clip
    if ortho:
        cd.type = "ORTHO"; cd.ortho_scale = ortho
    else:
        cd.lens = lens
    co = bpy.data.objects.new(name, cd); sc.collection.objects.link(co)
    co.location = loc
    co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = co
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = os.path.join(out, name + ".png")
    bpy.ops.render.render(write_still=True)

top = 80.0
shot("G3E_01_截圖同角度_校門大道", (0, 3, -0.4), (0, 60, 6), lens=22, res=(1600, 900))
shot("G3E_02_大階梯近景", (2.5, 66, -0.2), (0, 82, -0.2), lens=24, res=(1600, 900))
shot("G3E_03_軸測_東南", (115, -60, 80), (0, 70, 0), lens=33, res=(1600, 1000))
shot("G3E_04_東翼入口階梯", (30, 46, 1.0), (40, 54, -0.8), lens=24, res=(1600, 900))
print("RENDER DONE")
