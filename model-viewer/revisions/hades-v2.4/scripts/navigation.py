import bpy,json,math,pathlib,sys,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=pathlib.Path.cwd();allreports={};deps=None
# Conservative sampled body clearance; this is animation path screening, not engineering certification.
def cv(p):return Vector((p[0],-p[2],p[1]))
def cast(p,d,length):
 loc,n,face,dist=tree.ray_cast(cv(p),cv(d),length)
 return (face_names[face],[loc.x,loc.z,-loc.y],dist) if loc is not None else None
def pathcheck(name,points,radius=.22):
 fail=[];samples=0
 for a,b in zip(points,points[1:]):
  dist=math.dist(a,b);n=max(1,math.ceil(dist/.10))
  for k in range(n+1):
   t=k/n;p=[a[i]*(1-t)+b[i]*t for i in range(3)];samples+=1
   # downward support at centre and four foot-ring offsets, allowing up to a .24m riser/declared grade
   supports=[]
   for dx,dz in [(0,0),(.22,0),(-.22,0),(0,.22),(0,-.22)]:
    s=cast([p[0]+dx,p[1]+.24,p[2]+dz],[0,-1,0],.51)
    if s and abs(s[1][1]-p[1])<.25:supports.append(s)
   if not supports:fail.append({'kind':'NO_FOOT_SUPPORT','xyz':p});continue
   floor=max(s[1][1] for s in supports)
   blocked=False
   for angle in range(0,360,45):
    dx=radius*math.cos(math.radians(angle));dz=radius*math.sin(math.radians(angle))
    h=cast([p[0]+dx,floor+.07,p[2]+dz],[0,1,0],1.68)
    if h:
     fail.append({'kind':'BODY_OR_HEAD_BLOCKED','xyz':p,'hit':h[0],'hit_xyz':h[1]});blocked=True;break
   if not blocked:
    for hh in [.32,.85,1.5]:
     for angle in range(0,360,45):
      dx=math.cos(math.radians(angle));dz=math.sin(math.radians(angle));h=cast([p[0],floor+hh,p[2]],[dx,0,dz],radius)
      if h:
       fail.append({'kind':'LATERAL_BODY_BLOCKED','xyz':p,'hit':h[0],'hit_xyz':h[1]});blocked=True;break
     if blocked:break
 # compress repetitive hit evidence, keep actual failures count
 unique=[];last=None
 for f in fail:
  key=f.get('hit',f['kind'])
  if key!=last:unique.append(f);last=key
 return {'route':name,'sample_count':samples,'failure_sample_count':len(fail),'status':'PASS_SAMPLED' if not fail else 'FAIL','radius_m':radius,'body_height_m':1.75,'samples_step_m':.10,'points_gltf':points,'evidence':unique[:35]}
def autoroute(start,goal):
 import heapq
 step=.1;cache={};startk=(round(start[0]/step),round(start[2]/step));goalk=(round(goal[0]/step),round(goal[2]/step))
 def valid(k):
  if k in cache:return cache[k]
  x,z=k[0]*step,k[1]*step
  if not(5.88<x<10.75 and -1.7<z<3.85):return False
  supports=[]
  for dx,dz in [(0,0),(.22,0),(-.22,0),(0,.22),(0,-.22)]:
   h=cast([x+dx,3.84,z+dz],[0,-1,0],.51)
   if h and abs(h[1][1]-3.6)<.25:supports.append(h)
  if not supports:cache[k]=False;return False
  floor=max(h[1][1] for h in supports)
  for a in range(0,360,45):
   dx=.22*math.cos(math.radians(a));dz=.22*math.sin(math.radians(a))
   if cast([x+dx,floor+.07,z+dz],[0,1,0],1.68):cache[k]=False;return False
  for hh in [.32,.85,1.5]:
   for a in range(0,360,45):
    if cast([x,floor+hh,z],[math.cos(math.radians(a)),0,math.sin(math.radians(a))],.22):cache[k]=False;return False
  cache[k]=True;return True
 heap=[(0,startk)];cost={startk:0};prev={}
 while heap:
  _,k=heapq.heappop(heap)
  if k==goalk:
   out=[k]
   while k in prev:k=prev[k];out.append(k)
   return [[x*step,3.6,z*step] for x,z in reversed(out)]
  for dx,dz in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)]:
   nk=(k[0]+dx,k[1]+dz)
   if not valid(nk):continue
   if dx and dz and (not valid((k[0]+dx,k[1])) or not valid((k[0],k[1]+dz))):continue
   c=cost[k]+math.hypot(dx,dz)
   if c<cost.get(nk,1e20):cost[nk]=c;prev[nk]=k;heapq.heappush(heap,(c+math.dist(nk,goalk),nk))
 raise RuntimeError('No collision-screened route found between specified real home anchors')

# Current house only: explicit routes, 0.22m body radius /1.75m height, sampled every0.10m.
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/'hades-house.glb'));deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];face_names=[]
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 ev=ob.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles();off=len(verts);verts.extend([ob.matrix_world@v.co for v in me.vertices]);faces.extend([tuple(off+i for i in t.vertices) for t in me.loop_triangles]);face_names.extend([ob.name]*len(me.loop_triangles));ev.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,faces,all_triangles=True)
routes=[
 ('player_to_stair',[[-.1,3.6,1.8],[-.1,3.6,-1.3],[-2.5,3.6,-1.3],[-2.5,3.6,-3.1],[-7.26,3.6,-3.1],[-7.26,3.6,-3.7]]),
 ('father_to_corridor',[[-.35,3.6,-5.1],[-.35,3.6,-3.1]]),
 ('study_to_corridor',[[3.9,3.6,-6.4],[3.5,3.6,-5.3],[3.5,3.6,-3.1]]),
 ('reserve_n_to_corridor',[[8.2,3.6,-5.5],[8.2,3.6,-3.1]]),
 ('lounge_to_corridor',[[-6.6,3.6,-.3],[-7.2,3.6,-1.2],[-7.2,3.6,-3.1]]),
 ('laundry_to_corridor',[[3.45,3.6,2.5],[4.85,3.6,2.6],[4.85,3.6,-3.1]]),
 ('bath_to_corridor',[[2.5,3.6,-.4],[4.85,3.6,-.45],[4.85,3.6,-3.1]]),
 ('reserve_s_to_corridor',[[9.0,3.6,1.8],[9.0,3.6,-.4],[4.85,3.6,-.4],[4.85,3.6,-3.1]]),
 ('stair',[[-7.26,3.60,-3.70]]+[[-7.26,3.6-.18*k,-4.06-.28*k] for k in range(10)]+[[-7.26,1.8,-7.10],[-8.60,1.8,-7.10]]+[[-8.60,1.8-.18*k,-6.86+.28*k] for k in range(10)]+[[-8.60,0,-3.95]]),
 ('stair_to_key',[[-8.6,0,-3.95],[-6.7,0,-3.7],[-4.5,0,-3.7],[-1.9,0,-3.7],[-1.9,0,0],[1.0,0,0],[2.15,0,1.95]]),
 ('key_to_car',[[2.15,0,1.95],[-.87,0,1.95],[-.87,0,3.5],[-.87,0,4.7],[-.87,.11,5.3],[-.87,0,6.5],[-3.8,0,6.5],[-3.8,0,8.2],[-.87,0,8.2]])]
results=[]
for n,p in routes:
 if n=='reserve_s_to_corridor':p=autoroute([9,3.6,1.8],[6.2,3.6,-.4])+[[4.85,3.6,-.4],[4.85,3.6,-3.1]]
 r=pathcheck(n,p);results.append(r);print('NAV',n,r['status'],r['failure_sample_count'],r['evidence'][:1],flush=True)
(root/'reports/navigation.json').write_text(json.dumps({'model_sha256':hashlib.sha256((root/'hades-house.glb').read_bytes()).hexdigest(),'method':'0.10m discrete body/support and lateral clearance probes, radius.22m height1.75m; not continuous actor animation or engineering compliance','routes':results},ensure_ascii=False,indent=2))
