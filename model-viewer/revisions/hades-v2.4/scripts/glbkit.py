import json,struct,pathlib,copy,numpy as np,hashlib
DT={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
class GLB:
 def __init__(self,p):
  self.path=pathlib.Path(p); b=self.path.read_bytes();magic,v,n=struct.unpack_from('<4sII',b);assert magic==b'glTF' and v==2 and n==len(b)
  jn,jt=struct.unpack_from('<II',b,12);self.g=json.loads(b[20:20+jn]);off=20+jn;bn,bt=struct.unpack_from('<II',b,off);self.bin=bytearray(b[off+8:off+8+bn]);self.update()
 def acc(self,i):
  a=self.g['accessors'][i];v=self.g['bufferViews'][a['bufferView']];d=np.dtype(DT[a['componentType']]);n=NC[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0)
  return np.ndarray((a['count'],n),dtype=d,buffer=self.bin,offset=off,strides=(v.get('byteStride',n*d.itemsize),d.itemsize)).copy()
 def update(self):
  self.world={};self.parents={};self.bounds={}
  def walk(i,parent):
   n=self.g['nodes'][i];m=np.eye(4)
   if 'matrix' in n:m=np.array(n['matrix']).reshape(4,4).T
   else:
    x,y,z,w=n.get('rotation',[0,0,0,1]);r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    m[:3,:3]=r@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
   wm=parent@m;self.world[i]=wm
   if 'mesh' in n:
    vs=[self.acc(p['attributes']['POSITION']) for p in self.g['meshes'][n['mesh']]['primitives']];v=np.concatenate(vs);v=v@wm[:3,:3].T+wm[:3,3];self.bounds[i]=np.array([v.min(0),v.max(0)])
   for c in n.get('children',[]):self.parents[c]=i;walk(c,wm)
  for root in self.g['scenes'][self.g.get('scene',0)]['nodes']:walk(root,np.eye(4))
 def inventory(self):
  return [{'i':i,'name':self.g['nodes'][i].get('name',''),'parent':self.parents.get(i),'bbox':b.tolist(),'size':(b[1]-b[0]).tolist(),'center':b.mean(0).tolist(),'materials':[self.g['materials'][p.get('material',0)].get('name','') for p in self.g['meshes'][self.g['nodes'][i]['mesh']]['primitives']]} for i,b in self.bounds.items()]
 def add_acc(self,a,typ,ct=5126,target=None):
  a=np.array(a,dtype=DT[ct]);pad=(-len(self.bin))%4;self.bin.extend(b'\0'*pad);v={'buffer':0,'byteOffset':len(self.bin),'byteLength':a.nbytes}
  if target:v['target']=target
  vi=len(self.g['bufferViews']);self.g['bufferViews'].append(v);self.bin.extend(a.tobytes());ac={'bufferView':vi,'componentType':ct,'count':len(a),'type':typ}
  if typ=='VEC3':ac.update(min=a.min(0).tolist(),max=a.max(0).tolist())
  ai=len(self.g['accessors']);self.g['accessors'].append(ac);return ai
 def mat(self,name,color,metal=0,rough=.7):
  i=len(self.g['materials']);self.g['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':list(color)+[1],'metallicFactor':metal,'roughnessFactor':rough},'doubleSided':True});return i
 def add_geom(self,name,v,f,mat,extra=None):
  v=np.asarray(v);f=np.asarray(f);tri=v[f];norm=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);valid=np.linalg.norm(norm,axis=1)>1e-12;tri=tri[valid];norm=norm[valid];norm/=np.linalg.norm(norm,axis=1,keepdims=True)
  pos=tri.reshape(-1,3);nor=np.repeat(norm,3,axis=0);p={'attributes':{'POSITION':self.add_acc(pos,'VEC3',target=34962),'NORMAL':self.add_acc(nor,'VEC3',target=34962)},'material':mat,'mode':4}
  mi=len(self.g['meshes']);self.g['meshes'].append({'name':name,'primitives':[p]});ni=len(self.g['nodes']);self.g['nodes'].append({'name':name,'mesh':mi,'extras':extra or {'status':'CANDIDATE','author_approval':'PENDING'}});self.g['scenes'][self.g.get('scene',0)]['nodes'].append(ni);return ni
 def box(self,name,c,s,mat,extra=None):
  import trimesh
  t=trimesh.creation.box(extents=s);return self.add_geom(name,t.vertices+np.array(c),t.faces,mat,extra)
 def cyl(self,name,c,r,h,mat,sections=20):
  import trimesh
  t=trimesh.creation.cylinder(radius=r,height=h,sections=sections);v=t.vertices[:,[0,2,1]]+np.array(c);return self.add_geom(name,v,t.faces[:,::-1],mat)
 def save(self,path):
  self.g['buffers'][0]['byteLength']=len(self.bin);j=json.dumps(self.g,ensure_ascii=False,separators=(',',':')).encode();j+=b' '*((-len(j))%4);b=bytes(self.bin);b+=b'\0'*((-len(b))%4);data=struct.pack('<4sII',b'glTF',2,28+len(j)+len(b))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(b),b'BIN\0')+b;pathlib.Path(path).write_bytes(data)
if __name__=='__main__':
 for p in pathlib.Path('original').glob('*.glb'):
  g=GLB(p);inv=g.inventory();pathlib.Path('reports',p.stem+'_inventory.json').write_text(json.dumps(inv,ensure_ascii=False,indent=2));print(p.name,len(inv),np.array(list(g.bounds.values())).min(0)[0],np.array(list(g.bounds.values())).max(0)[1])
