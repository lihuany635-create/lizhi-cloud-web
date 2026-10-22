import ast,pathlib,sys,json,copy,math,hashlib
import numpy as np,trimesh
from glbkit import GLB
R=pathlib.Path.cwd();import hades_helpers;ns=vars(hades_helpers)
g=GLB(R/'backups/hades-house_v2_3.glb');old=copy.deepcopy(g.g['nodes']);world={i:m.copy() for i,m in g.world.items()};start=len(old)
def evidence(asset,reason='Household layout inferred from chapters3,4,8',major=False):return {'asset_id':asset,'revision':'HADES-v2.4','basis':reason,'inferred':True,'user_authorized':'Complete upper envelope and infer whole-house furniture','author_full_canon_approval':'PENDING','world':'GAME'}
ns['extra']=evidence;M=ns['common'](g)
for n,c in [('oak',[.36,.23,.14]),('plaster',[.76,.73,.66]),('trim',[.84,.81,.74]),('linen',[.73,.72,.65]),('rug',[.20,.29,.33]),('tile',[.48,.51,.49]),('leaf',[.12,.24,.16]),('wine',[.33,.12,.11])]:M[n]=g.mat('H24_'+n,c)
M['navy']=g.mat('H24_navy',[.12,.22,.30])
M['glass']=g.mat('H24_clear_glass',[.74,.84,.88],rough=.1);g.g['materials'][M['glass']]['alphaMode']='BLEND';g.g['materials'][M['glass']]['pbrMetallicRoughness']['baseColorFactor'][3]=.15
counts={}
def B(n,c,s,m='wood'):
 assert not isinstance(m,str) or m in M,m
 counts[n]=counts.get(n,0)+1;return ns['box'](g,'H24_'+n+'_'+str(counts[n]),c,s,M.get(m,m),True)
def C(n,c,r,h,m='metal'):
 i=g.cyl('H24_'+n,c,r,h,M[m]);g.g['nodes'][i]['extras']=evidence(n);return i
def lamp(n,x,y,z,h=.42):C(n+'base',[x,y+.015,z],.1,.03);C(n+'stem',[x,y+h/2,z],.013,h);C(n+'shade',[x,y+h,z],.2 if h>1 else .14,.23,'linen')
def plant(n,x,y,z):
 C(n+'pot',[x,y+.15,z],.16,.3,'tile')
 for k in range(5):
  t=trimesh.creation.icosphere(subdivisions=1,radius=1);t.vertices*=np.array([.16,.24,.085]);t.vertices+=np.array([x+.16*math.cos(k*2.4),y+.50+.04*k,z+.16*math.sin(k*2.4)]);g.add_geom('H24_'+n+'_leaf',t.vertices,t.faces,M['leaf'],evidence(n))
def clone(ids,n,origin,target,scale=1,angle=0):
 a=math.radians(angle);T=np.eye(4);T[:3,:3]=np.array([[math.cos(a),0,math.sin(a)],[0,1,0],[-math.sin(a),0,math.cos(a)]])*scale;T[:3,3]=np.array(target)-T[:3,:3]@origin
 for i in ids:
  q=copy.deepcopy(old[i])
  if 'mesh' not in q:continue
  q['name']='H24_REUSE_'+n+'__'+str(i);q.pop('children',None)
  for k in ['translation','rotation','scale']:q.pop(k,None)
  q['matrix']=(T@world[i]).T.flatten().tolist();q['extras']=evidence(n,'Existing detailed furniture repositioned in inferred household layout');j=len(g.g['nodes']);g.g['nodes'].append(q);g.g['scenes'][g.g.get('scene',0)]['nodes'].append(j)
def books(n,x,y,z,w=1,axis='z'):
 for k in range(max(5,int(w/.075))):
  num=max(5,int(w/.075));p=(k+.5)*w/num-w/2;h=.24+.02*(k%4);B(n,[x+p,y+h/2,z] if axis=='z' else [x,y+h/2,z+p],[w/num*.80,h,.16] if axis=='z' else [.16,h,w/num*.8],['blue','wine','linen'][k%3])
def shelf(n,x,y,z,w=1.5,h=1.8,axis='z'):
 if axis=='z':
  B(n+'back',[x,y+h/2,z+(-.16 if n=='study_books' else .16)],[w,h,.045]);
  for a in [-1,1]:B(n+'side',[x+a*(w/2-.025),y+h/2,z],[.05,h,.4])
 else:
  B(n+'back',[x-.16,y+h/2,z],[.045,h,w]);
  for a in [-1,1]:B(n+'side',[x,y+h/2,z+a*(w/2-.025)],[.4,h,.05])
 for yy in np.arange(0,h+.01,.42):
  B(n+'shelf',[x,y+yy,z],[w,.04,.4] if axis=='z' else [.4,.04,w]);
  if yy+.35<h:books(n+'books',x,y+yy+.021,z,w-.12,axis)
 B(n+'top',[x,y+h,z],[w,.05,.4] if axis=='z' else [.4,.05,w])
def wardrobe(n,x,y,z,w=1.8,axis='z',facing=1):
 B(n+'body',[x,y+1.1,z],[w,2.2,.60] if axis=='z' else [.60,2.2,w])
 for k in range(3):
  a=(k-1)*w/3
  B(n+'door',[x+a,y+1.1,z-.32*facing] if axis=='z' else [x+.32*facing,y+1.1,z+a],[w/3-.025,2.12,.035] if axis=='z' else [.035,2.12,w/3-.025],'oak')
  B(n+'handle',[x+a+.1,y+1.1,z-.35*facing] if axis=='z' else [x+.35*facing,y+1.1,z+a+.1],[.018,.16,.025] if axis=='z' else [.025,.16,.018],'metal')
def printframe(n,x,y,z,w=1,h=.7):
 B(n+'print',[x,y,z],[w,h,.02],'paper')
 for a in [-1,1]:B(n+'side',[x+a*w/2,y,z],[.05,h+.08,.05]);B(n+'edge',[x,y+a*h/2,z],[w+.08,.05,.05])
def wall(n,axis,c,lo,hi,doors=[],windows=[],exterior=False):
 thick=.24 if exterior else .14
 def part(a,b,y,h,m='plaster',d=None):
  if b-a<=.001:return
  B(n,[((a+b)/2),y,c] if axis=='z' else [c,y,(a+b)/2],[b-a,h,d or thick] if axis=='z' else [d or thick,h,b-a],m)
 cuts=sorted([(a,b,'door') for a,b in doors]+[(a,b,'window') for a,b in windows])+[(hi,hi,'end')];last=lo
 for a,b,typ in cuts:
  part(last,a,5.2,3.2);part(last,a,3.68,.16,'trim',thick+.025);part(last,a,6.71,.18,'trim',thick+.025)
  if typ=='door':
   part(a,b,6.32,.96)
   for p in [a,b]:part(p-.035,p+.035,4.73,2.26,'trim')
   part(a-.05,b+.05,5.88,.08,'trim')
   if axis=='z':
    sg=-1 if n in ['F2_north_rooms','F2_linen_entry','F2_father_ensuite_south'] else 1
    B(n+'_open_leaf',[a+.055,4.70,c+sg*.44],[.055,2.18,b-a-.08]);B(n+'_handle',[a+.10,4.65,c+sg*.78],[.035,.04,.1],'metal')
   else:
    sg=-1 if n in ['F2_services','F2_master_west'] else 1
    B(n+'_open_leaf',[c+sg*.44,4.70,a+.055],[b-a-.08,2.18,.055]);B(n+'_handle',[c+sg*.78,4.65,a+.10],[.1,.04,.035],'metal')
  elif typ=='window':
   part(a,b,4.05,.9);part(a,b,6.58,.44)
   for p in [a,b,(a+b)/2]:part(p-.032,p+.032,5.4,1.8,'trim',thick+.025)
   for y in [4.5,6.3]:part(a,b,y,.07,'trim',thick+.03)
   part(a,b,5.4,1.8,'glass',.025)
  last=b
removed=[]
for i,q in enumerate(g.g['nodes'][:start]):
 if 568<=i<=2199 or 2210<=i<=2214 or (i>=2215 and q.get('extras',{}).get('asset_id','').startswith(('RG-GAME-HOUSE-DESK','RG-GAME-HOUSE-BED','RG-GAME-HOUSE-WARD'))):
  if 'mesh' in q:removed.append(i);q.pop('mesh');q.setdefault('extras',{})['replaced_by_h24']=True
rooms=[('father',[-6.35,-9.65,1.35,-4.15]),('study',[1.55,-9.65,6.35,-4.15]),('reserve_n',[6.55,-9.65,10.85,-4.15]),('lounge',[-10.85,-1.85,-4.5,4.02]),('protagonist',[-4.3,-1.85,.5,4.02]),('bath',[.7,-1.85,4,1]),('laundry',[.7,1.2,4,4.02]),('reserve_s',[5.75,-1.85,10.85,4.02]),('service_hall',[4.15,-1.85,5.55,4.02]),('main_hall',[-10.85,-4.02,10.85,-2.02]),('linen',[-10.85,-9.65,-9.4,-4.2]),('stair_north_storage',[-9.25,-9.65,-6.55,-8.17])]
for n,(xa,za,xb,zb) in rooms:B('F2_'+n+'_floor',[(xa+xb)/2,3.596,(za+zb)/2],[xb-xa,.008,zb-za],'tile' if n in ['bath','laundry'] else 'oak')
wall('F2_front','z',4.17,-11,11,windows=[(-10.2,-8.5),(-7.8,-5.5),(-3.95,.05),(1.3,3.45),(6.2,8),(8.6,10.2)],exterior=True)
wall('F2_back','z',-9.8,-11,11,windows=[(-10.5,-9.7),(-5.9,-3.8),(-3,.7),(2.1,5.8),(7.1,10.2)],exterior=True)
wall('F2_west','x',-11,-9.8,4.17,windows=[(-7.4,-5),(-.8,2.5)],exterior=True)
wall('F2_east','x',11,-9.8,4.17,windows=[(-8.7,-6),(-.8,2.5)],exterior=True)
wall('F2_north_rooms','z',-4.12,-6.45,11,doors=[(-.85,.15),(3,4),(7.7,8.7)])
wall('F2_linen_entry','z',-4.12,-11,-9.3,doors=[(-10.55,-9.7)])
wall('F2_master_west','x',-6.45,-9.8,-4.12,doors=[(-9.25,-8.4)])
wall('F2_master_study','x',1.45,-9.8,-4.12);wall('F2_study_reserve','x',6.45,-9.8,-4.12)
wall('F2_south_rooms','z',-1.95,-11,11,doors=[(-8.1,-6.7),(-3,-2),(4.35,5.35)])
wall('F2_lounge_player','x',-4.4,-1.95,4.17);wall('F2_player_bath','x',.60,-1.95,4.17)
wall('F2_services','x',4.08,-1.95,4.17,doors=[(-.95,.05),(2.1,3.1)])
wall('F2_service_reserve','x',5.65,-1.95,4.17,doors=[(-.9,.1)])
wall('F2_bath_laundry','z',1.10,.6,4.08)
wall('F2_father_ensuite_south','z',-7,-6.45,-3.7,doors=[(-5.5,-4.6)])
wall('F2_father_ensuite_east','x',-3.7,-9.8,-7)
B('F2_roof',[0,6.88,-2.815],[22.3,.16,14.27],'trim')
for z in [-9.8,4.17]:B('F2_roof_cornice',[0,6.76,z],[22.4,.13,.36],'trim')
for x in [-11,11]:B('F2_roof_cornice',[x,6.76,-2.815],[.36,.13,14.27],'trim')
# Retain detailed furniture and textures by rescaling existing asset groups to human dimensions.
for n,target,scale in [('player_bed',[-1.8,3.6,.25],.62),('father_bed',[-1,3.6,-7.45],.68),('reserve_n_bed',[8.7,3.6,-7.3],.52),('reserve_s_bed',[7.7,3.6,.35],.54)]:clone(range(1101,1264),n,[-1.28,3.6,-.33],target,scale)
for n,target,scale in [('player_desk',[-2.6,3.6,3.22],1),('study_desk',[3.9,3.6,-8.1],1),('reserve_s_desk',[9,3.6,3.25],1),('downstairs_desk',[-7.1,0,3.2],1)]:clone(range(1996,2014),n,[-4.872,3.6,2.795],target,scale)
ids=[i for i,n in enumerate(old) if n.get('extras',{}).get('asset_id','').startswith('RG-GAME-HOUSE-DESK')];clone(ids,'student_props',[-4.872,3.6,2.795],[-2.6,3.6,3.22],1)
wardrobe('player_wardrobe',-3.9,3.6,-.35,1.65,'x');plant('player_plant',-.05,3.6,3.65)
wardrobe('father_wardrobe',-6.05,3.6,-5.5,2,'x');clone(range(1414,1438),'father_reading',[-4.2,3.6,-2.8],[.45,3.6,-5.45],.7,180)
shelf('study_books',1.73,3.6,-7.1,3.9,2.1,'x');clone(range(1414,1438),'study_reading',[-4.2,3.6,-2.8],[5.4,3.6,-5.6],.65,180);lamp('study_floor_lamp',4.5,3.6,-5.3,1.5)
wardrobe('reserve_n_wardrobe',10.4,3.6,-5.25,1.55,'x',-1);wardrobe('reserve_s_wardrobe',9.6,3.6,-1.5,1.8,'z',-1)
clone(range(1996,2014),'reserve_n_desk',[-4.872,3.6,2.795],[10.4,3.6,-8.0],1,90)
# Shared lounge with couch, reading chair, library shelves and low table.
clone(range(395,402),'family_sofa',[-2.2,0,-8.7],[-10,3.6,.5],1,90)
clone(range(1414,1438),'family_reading',[-4.2,3.6,-2.8],[-5.5,3.6,1.2],.8,-90)
B('lounge_rug',[-7.7,3.607,.9],[4.7,.012,4],'rug');B('lounge_table_top',[-7.7,4.04,.7],[1.4,.05,.7]);
for xx in [-8.25,-7.15]:
 for zz in [.47,.93]:B('lounge_table_leg',[xx,3.81,zz],[.05,.42,.05])
B('lounge_magazine',[-7.5,4.073,.7],[.32,.01,.24],'paper')
shelf('lounge_books',-7.7,3.6,3.7,3.9,.84);lamp('lounge_lamp',-5.1,3.6,3.3,1.5);plant('lounge_plant',-10.3,3.6,3.4)
# Master ensuite and shared bath are inferred utility spaces, not new story events.
B('master_shower_base',[-5.5,3.65,-9],[1.1,.10,1.1],'tile');B('master_shower_glass',[-4.92,4.65,-9],[.025,2,1.15],'glass');B('master_shower_glass',[-5.5,4.65,-8.42],[1.15,2,.025],'glass')
B('master_vanity',[-4.18,4,-8.05],[.65,.8,.8]);C('master_basin',[-4.18,4.45,-8.05],.22,.10,'white');B('master_mirror',[-3.79,5.1,-8.05],[.03,.9,.75],'metal')
def wc(n,x,z):B(n+'_base',[x,3.85,z],[.38,.5,.58],'white');C(n+'_seat',[x,4.10,z],.22,.06,'white');B(n+'_tank',[x,4.18,z-.28],[.44,.60,.18],'white')
wc('master_wc',-5.9,-7.65);wc('family_wc',3.45,-1.15)
clone(range(2167,2172),'family_tub',[3.91,3.6,3.18],[2.5,3.6,.35],.70)
B('family_vanity',[1,4,-.75],[.6,.8,1.15]);C('family_basin',[1,4.46,-.75],.23,.10,'white');B('family_mirror',[.71,5.1,-.75],[.03,1,.95],'metal')
for x in [1.3,2.25]:
 B('laundry_machine',[x,4.025,3.5],[.72,.85,.72],'white');t=trimesh.creation.cylinder(radius=.24,height=.035,sections=24);t.vertices+=np.array([x,4.02,3.12]);g.add_geom('H24_laundry_front_drum',t.vertices,t.faces,M['dark'],evidence('laundry'))
B('laundry_counter',[2.3,4.52,3.5],[2.75,.06,.8],'oak')
for k in range(4):B('laundry_towels',[3.05,4.58+k*.045,3.5],[.45,.04,.35],'linen')
wardrobe('laundry_cleaning',1.05,3.6,2,.9,'x');ns['table'](g,'H24_laundry_fold',2.1,3.6,1.6,1.3,.6,M['wood'])
wardrobe('linen_storage',-10.1,3.6,-9.3,1.25,'z',-1);B('linen_low_storage',[-10.58,4.01,-6.5],[.45,.82,2.4]);B('stair_north_storage',[-7.9,4.35,-9.3],[1.9,1.5,.5])
for x in [-9.9,-5,1.1,6,10.4]:B('hall_sconce',[x,5.35,-2.10],[.20,.34,.12],'linen')
for x,z in [(-2,-3),(3.4,-3),(8.3,-3),(-7.7,.5),(-1.8,.5),(3.8,-7.1),(8.3,-7.2),(7.5,.2),(2,-.4),(2,2.5)]:C('ceiling_fixture',[x,6.72,z],.25,.16,'linen')
# Upgrade original solid dining table/chair placeholders to legged furniture at identical top heights.
g.g['nodes'][440].pop('mesh',None);B('dining_table_top',[7.1,.73,-7.1],[3,.06,1],'oak')
for xx in [5.82,8.38]:
 for zz in [-7.45,-6.75]:B('dining_table_leg',[xx,.35,zz],[.08,.70,.08])
for i in [441,443,445,447,449,451]:
 c=(g.bounds[i][0]+g.bounds[i][1])/2;g.g['nodes'][i].pop('mesh',None);B('dining_chair_seat',[float(c[0]),.43,float(c[2])],[.48,.06,.5],'navy')
 for dx in [-.17,.17]:
  for dz in [-.18,.18]:B('dining_chair_leg',[float(c[0])+dx,.20,float(c[2])+dz],[.04,.40,.04])
# Ground floor: actual open bookcase, neutral reading/work room, and breakfast routine.

for i in range(421,426):g.g['nodes'][i].pop('mesh',None)
shelf('living_bookcase',-5.85,0,-7,3.6,2.1,'x')
B('living_console',[-1.8,.4,-4.65],[2.65,.8,.43]);B('living_console_top',[-1.8,.82,-4.65],[2.75,.045,.48],'oak')
for x in [-2.6,-1.8,-1]:B('living_console_door',[x,.42,-4.42],[.74,.67,.035],'oak')
printframe('living_print',-1.8,1.245,-4.64,1.3,.8);plant('living_console_plant',-.80,.845,-4.65)
shelf('downstairs_books',-10.45,0,2.65,2,2.1,'x');clone(range(1414,1438),'downstairs_reading',[-4.2,3.6,-2.8],[-8.9,0,1.6],.8,20);lamp('downstairs_lamp',-10.1,0,1.15,1.5);printframe('downstairs_print',-8,1.8,1.01,1.2,.8);plant('downstairs_plant',-5.05,0,3.7)
B('father_newspaper',[6.85,.772,-7.1],[.5,.008,.35],'paper')
for dx in [-.055,.055]:
 t=trimesh.creation.torus(major_radius=.032,minor_radius=.004,major_sections=20,minor_sections=6);t.vertices=t.vertices[:,[0,2,1]]+np.array([7+dx,.789,-7.08]);g.add_geom('H24_father_spectacles',t.vertices,t.faces,M['dark'],evidence('breakfast','chapter8 father reading newspaper with black-framed glasses'))
B('glasses_bridge',[7,.791,-7.08],[.035,.008,.008],'dark')
for x in [5.95,8.25]:ns['bowl'](g,'H24_breakfast_cereal',[x,.768,-7.1],.10,M['white']);ns['mug'](g,'H24_breakfast_mug',[x-.19,.768,-7.1],M['white']);B('breakfast_spoon',[x+.16,.778,-7.1],[.018,.009,.16],'metal')
B('kitchen_hob',[8,.957,1.1],[.72,.025,.60],'dark')
for x in [7.82,8.18]:
 for z in [.94,1.26]:C('hob_ring',[x,.978,z],.085,.015)
B('hood',[8,2.18,1.1],[.85,.2,.65],'metal');B('hood_flue',[8,2.74,1.1],[.25,.92,.25],'metal');B('cutting_board',[6.85,.955,1.1],[.42,.025,.30],'oak');B('dish_drain',[10.45,.96,2.75],[.46,.05,.55],'metal')
for k in range(5):B('drain_plate',[10.45,1.0,2.56+k*.09],[.28,.08,.025],'white')
wardrobe('kitchen_pantry',3.8,0,1.1,.8,'x')
# Existing foyer, key, car, yard, stairs and anti-slip strips retain original transforms.
for p in [[-7.7,6.3,.5],[-1.8,6.3,.5],[-1,6.3,-7],[3.8,6.3,-7],[8.3,6.3,-7.2],[7.5,6.3,.2],[2,6.3,-.4],[2,6.3,2.5],[-5,6.3,-3],[4,6.3,-3],[-7,2.9,2]]:ns['light'](g,'H24_warm_practical',p,1100)
g.g.setdefault('extras',{}).update({'revision':'HADES-v2.4','upper_envelope_matches_lower':{'x':[-11,11],'z':[-9.8,4.17]},'source_base_sha256':hashlib.sha256((R/'backups/hades-house_v2_3.glb').read_bytes()).hexdigest(),'novel_bound':['chapter3 small tidy bedroom, student desk, uniform, student ID, prospectus and black car','chapter4 evening bedroom return','chapter8 father breakfast newspaper and black glasses'],'layout_inference':'Father bedroom/study, unassigned reserve rooms, lounge, baths and laundry inferred under user request; no new resident identities.'})
g.update();g.save(R/'hades-house.glb');(R/'reports/inventory.json').write_text(json.dumps(g.inventory(),ensure_ascii=False,indent=2));report={'revision':'HADES-v2.4','lower_envelope_xz':[-11,-9.8,11,4.17],'upper_envelope_xz':[-11,-9.8,11,4.17],'floor_y':3.6,'rooms':[{'name':n,'bounds_xz':b,'area_m2':round((b[2]-b[0])*(b[3]-b[1]),2),'inferred':True} for n,b in rooms],'old_player_room_m2':63.97,'new_player_room_m2':28.18,'removed_mesh_nodes':removed,'candidate_nodes':len(g.g['nodes']),'sha256':hashlib.sha256((R/'hades-house.glb').read_bytes()).hexdigest()};(R/'reports/design.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('BUILT',len(g.g['nodes']),len(g.world),(R/'hades-house.glb').stat().st_size)
