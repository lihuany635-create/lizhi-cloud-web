import bpy,json,sys,pathlib,math,hashlib
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];jobs=json.load(open(args[0]));quick='quick' in args[1:];root=pathlib.Path.cwd();current=None
for j in jobs:
 source_hash=hashlib.sha256((root/j['path']).read_bytes()).hexdigest()
 mp=root/'previews'/(j['name']+'.meta.json')
 if mp.exists() and (root/'previews'/(j['name']+'.png')).exists() and json.loads(mp.read_text()).get('model_sha256')==source_hash and json.loads(mp.read_text()).get('render_signature')=='v23-clear-glazing-2' and json.loads(mp.read_text()).get('mode')==('QA_workbench' if quick else 'reference') and json.loads(mp.read_text()).get('camera_position_gltf')==j['pos'] and json.loads(mp.read_text()).get('camera_target_gltf')==j['target'] and json.loads(mp.read_text()).get('focal_mm')==j.get('focal_mm'):
  print('RG_SKIPPED_CURRENT',j['name'],flush=True);continue
 if j['path']!=current:
  bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/j['path']));current=j['path'];objs=list(bpy.context.scene.objects)
  for o in objs:o['rg_original_hide_render']=o.hide_render
  scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH' if quick else 'CYCLES';scene.cycles.samples=1 if quick else 8;scene.view_settings.exposure=.7;scene.cycles.use_denoising=not quick;scene.render.resolution_x=960;scene.render.resolution_y=600;scene.render.resolution_percentage=100
  scene.world=bpy.data.worlds.new('Daylight');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.6,.68,.8,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.8
  if quick:
   scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH';scene.display.shading.background_type='WORLD';scene.world.color=(.22,.25,.30)
   for mat in bpy.data.materials:
    if mat.use_nodes:
     bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
     if bs:
      c=list(bs.inputs['Base Color'].default_value);c[3]=bs.inputs['Alpha'].default_value;mat.diffuse_color=c

  for name,loc,energy,size in [('Key',(-20,-10,35),2200,25),('Fill',(15,15,20),1200,20)]:
   data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
  d=bpy.data.lights.new('Sun','SUN');d.energy=2;d.angle=.25;o=bpy.data.objects.new('Sun',d);scene.collection.objects.link(o);o.rotation_euler=(.35,-.4,-.5)
  d=bpy.data.cameras.new('QA');camera=bpy.data.objects.new('QA',d);scene.collection.objects.link(camera);scene.camera=camera
 for o in objs:
  cut=j.get('cut',1e6);bb=[o.matrix_world@Vector(c) for c in o.bound_box] if o.type=='MESH' else []
  # glTF Y is Blender Z. Cutaway hides objects wholly above cut, except long vertical walls kept for context unless explicit.
  glass_clear=quick and o.type=='MESH' and bool(o.data.materials) and all(mat and mat.diffuse_color[3]<.25 for mat in o.data.materials)
  o.hide_render=glass_clear or bool(bb and min(c.z for c in bb)>=cut) or any(s in o.name for s in j.get('hide',[]))
 def cv(p):return Vector((p[0],-p[2],p[1]))
 camera.location=cv(j['pos']);camera.rotation_euler=(cv(j['target'])-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='PERSP';camera.data.lens=36/(2*math.tan(math.radians(j.get('fov',55))/2));camera.data.clip_end=4000
 if 'focal_mm' in j:
  camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=24;camera.data.lens=j['focal_mm'];scene.render.resolution_x=960;scene.render.resolution_y=540
 if quick:scene.render.resolution_x=640;scene.render.resolution_y=360
 if 'size' in j:scene.render.resolution_x,scene.render.resolution_y=j['size']
 scene.render.filepath=str(root/'previews'/(j['name']+'.png'));bpy.ops.render.render(write_still=True);mp.write_text(json.dumps({'render_signature':'v23-clear-glazing-2','transparent_surface_policy':'QA hides low-alpha glazing; no glTF material changed','model':j['path'],'model_sha256':source_hash,'camera_position_gltf':j['pos'],'camera_target_gltf':j['target'],'focal_mm':j.get('focal_mm'),'render_engine':'Blender 4.3.2 Workbench studio material colors' if quick else 'Blender 4.3.2 Cycles CPU','samples':None if quick else 8,'mode':'QA_workbench' if quick else 'reference','image_size':[scene.render.resolution_x,scene.render.resolution_y],'author_approval':'PENDING','visual_qc':'PENDING'},indent=2));print('RG_RENDERED',j['name'],flush=True)
