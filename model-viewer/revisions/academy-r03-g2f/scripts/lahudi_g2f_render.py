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

top = 60.0
sh.color_type = "MATERIAL"
shot("G2F_01_L04_2F家具俯視", (0, 97, top), (0, 97, 0), ortho=52, clip=(top - 8.0, 200), res=(1600, 1100))
shot("G2F_02_L08_1F家具俯視", (0, 128, top), (0, 128, 0), ortho=64, clip=(top - 4.0, 200), res=(1600, 700))
shot("G2F_03_L06西翼2F俯視", (-55, 52, top), (-55, 52, 0), ortho=34, clip=(top - 8.0, 200), res=(1600, 1100))
shot("G2F_04_教室201室內", (-15.5, 103.8, 7.0), (-21, 110.5, 6.4), lens=18, res=(1400, 1000))
shot("G2F_05_L08閱覽大廳", (-6, 119.3, 1.7), (-6, 132, 3.5), lens=18, res=(1400, 1000))
shot("G2F_06_L08二樓西書庫", (-14.0, 136.5, 7.1), (-27, 122, 6.0), lens=18, res=(1400, 1000))
print("RENDER DONE")
