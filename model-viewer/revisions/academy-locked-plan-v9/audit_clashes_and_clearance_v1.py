#!/usr/bin/env python3
"""RG-GAME-02 V9 non-rendered geometry clash + prevention audit.

Scope: verified canonical V9 GLB exact SHA; real AABBs of visible named meshes
via glTF POSITION min/max and node TRS (not guessed box dimensions).
Walkable link: 10 structural slab rectangles. Probe nominal corridor body
Y=0.18..2.30, width full nominal slab minus 0.06m edge; overlap with
low walls, tall piers, existing castle doors and other 1F solid geometry.
AABB false positives are retained as candidates, not called triangle collisions.
Also compare exact portal cut spans, existing second-floor corridor, roof/ceiling.
"""
from pathlib import Path
from collections import Counter,defaultdict
import json, math, hashlib,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"ep01-s01"/"scripts"))
import build_s01_candidate as glb
BASE=Path("model-viewer/staged-output/academy-locked-plan-v9")
META=json.loads((BASE/"report.json").read_text())
FILE=BASE/META["file"]
SHA="ada3ae9c9e55f995b4c8c60f63655c01e572561e523e199ef1cdf298c7e668c3"
assert hashlib.sha256(FILE.read_bytes()).hexdigest()==SHA==META["output_sha256"]
m,bb,_=glb.load_glb(FILE)
assert len(m["nodes"])==11775 and META["new_structure_nodes"]==678
P="RG-GAME-02-PLAN-LOCK-V9__"
meshes=m["meshes"];acc=m["accessors"]
memo={}
def meshbounds(meshid):
 if meshid in memo:return memo[meshid]
 bounds=[]
 for p in meshes[meshid]["primitives"]:
  id=p.get("attributes",{}).get("POSITION")
  if id is None:continue
  a=acc[id]
  if "min" in a and "max" in a:bounds.append((a["min"],a["max"]))
 if not bounds:return None
 val=[[min(b[0][i] for b in bounds) for i in range(3)],
      [max(b[1][i] for b in bounds) for i in range(3)]]
 memo[meshid]=val
 return val
def nodebounds(n):
 src=meshbounds(n["mesh"])
 if src is None:return None
 lo,hi=src
 t=n.get("translation",[0,0,0]);scale=n.get("scale",[1,1,1])
 x,y,z,w=n.get("rotation",[0,0,0,1])
 R=((1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)),
   (2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)),
   (2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)))
 cen=[(lo[i]+hi[i])*scale[i]/2 for i in range(3)]
 ext=[(hi[i]-lo[i])*abs(scale[i])/2 for i in range(3)]
 wc=[t[i]+sum(R[i][k]*cen[k] for k in range(3)) for i in range(3)]
 we=[sum(abs(R[i][k])*ext[k] for k in range(3)) for i in range(3)]
 return [[wc[i]-we[i] for i in range(3)],[wc[i]+we[i] for i in range(3)]]
arr=[]
for i,n in enumerate(m["nodes"]):
 if "mesh" not in n:continue
 bn=nodebounds(n)
 if not bn:continue
 arr.append({"id":i,"name":n.get("name",""),"kind":n.get("extras",{}).get("kind",""),
             "zone":n.get("extras",{}).get("zone",""),"box":bn})
def box_for_route(x0,x1,z0,z1,y0=.19,y1=2.34,padding=.055):
 return [[x0+padding,y0,z0+padding],[x1-padding,y1,z1-padding]]
def overlap(a,b):
 return [round(min(a[1][i],b[1][i])-max(a[0][i],b[0][i]),4) for i in range(3)]
# blocker whitelist is conservative; don't call slabs/windows a collision.
def obstruction(n):
 if n["name"].startswith(P):
  return n["kind"] in {"low_wall","real_passage_jamb","pilaster","party_wall_pier",
                       "arcade_support","foundation_slab"}
 if "RG-GAME-02-EXTERIOR-REBUILD-V5__" in n["name"]:
  return any(t in n["name"] for t in (
   "lower_cladding","north_end_","south_end_","tower_front_",
   "tower_wall_","library_plinth_","library_endwall_",
   "tower_strut_","corner_buttress_","bay_pilaster_"))
 return False
solid=[n for n in arr if obstruction(n)]
routes=[]
for rid,co in META["new_real_connector_slabs"].items():
 xa,xb,za,zb=co
 nominal=[round(xb-xa,3),round(zb-za,3)]
 body=box_for_route(xa,xb,za,zb)
 hits=[]
 for n in solid:
  d=overlap(body,n["box"])
  if min(d)>.045:
   hits.append({
    "mesh":n["name"],"kind":n["kind"] or "original_solid",
    "zone":n["zone"] or "preserved_core","overlap_m_xyz":d,
    "bbox_m_xyz":n["box"],
    "center_xyz":[round((n["box"][0][i]+n["box"][1][i])/2,3) for i in range(3)]
   })
  # keep just significant (>= .2m) intrusion for prioritized human review
 priority=sorted(hits,key=lambda x:(max(x["overlap_m_xyz"][0],x["overlap_m_xyz"][2])*x["overlap_m_xyz"][1]),reverse=True)
 routes.append({
  "route":rid,"nominal_rect_xz_m":co,
  "nominal_width_m":round(min(xb-xa,zb-za),3),
  "body_check_y_m":[.19,2.34],
  "aabb_candidates":len(hits),
  "significant_examples":priority[:14],
  "likely_congestion":bool(hits)
 })
def route(rid):
 return next(r for r in routes if r["route"]==rid)
# portal plans extracted from code/report; centering mismatch rather than triple intersection
known=[
 {"id":"P01","description":"主樓西、東側連接入口 1F","category":"GEOMETRY","risk":"HIGH",
  "position_xyz":[-87.95,1.8,-10.2],"status":"AABB_AND_SOURCE",
  "condition":"新主樓門洞與校舍低牆已切開，但原有主樓壁柱與窗台需逐件查核",
  "prevention":"在 B/C 進入主樓的 Z=-12.2..-8.2 設置2.1m高通行包絡；碰到的V5柱/護牆局部改框而非削弱主柱"},
 {"id":"P02","description":"主樓北端入口接 E 前廳","category":"WIDTH_AND_LEVEL","risk":"HIGH",
  "position_xyz":[-84,0,-67.85],"status":"MEASURED_CODE_GEOMETRY",
  "condition":"主樓原北入口 X[-85.60,-82.40] 寬3.20m，連接地坪X[-86,-82]寬4.00m，差0.80m；兩端各0.40m被原牆控制",
  "prevention":"採3.00~3.20m的頸縮過渡並保持兩側內縮柱，或按結構校核將門洞改為4m；不可將4m地坪當4m有效淨寬"},
 {"id":"P03","description":"E 前廳到禮堂 G 門洞軸線偏差","category":"DOORWAY_ALIGNMENT","risk":"HIGH",
  "position_xyz":[-105,-.0,-112],"status":"MEASURED_CODE_GEOMETRY",
  "condition":"E_WEST北門 X[-108,-104]，連通廊 X[-107,-103]；相對平移1.0m，重疊寬3.0m（其餘1m對著低牆）",
  "prevention":"保留原座標，將廊道中心改至X=-106並於轉角設斜接/過渡平台，或同步修改E門洞到[-107,-103]"},
 {"id":"P04","description":"西側翼連接南入口 D 的西側外牆","category":"BLOCKED_PORTAL","risk":"CRITICAL",
  "position_xyz":[-98,1.5,38],"status":"MEASURED_CODE_GEOMETRY",
  "condition":"WEST_TO_D_WEST_X 沿 X[-125,-90]、Z[36,40] 進入 D_WEST_ENTRY 西立面 X=-98；此立面 V9 無 west_doors，低牆未開口",
  "prevention":"在 D_WEST_ENTRY 的西外牆 X=-98、Z[36,40] 開足夠寬實門洞並補門楣；保護柱位後再做局部牆洞，避免走廊穿牆"},
 {"id":"P05","description":"主樓二樓走廊與一樓連接廊高差","category":"VERTICAL_ROUTE","risk":"CRITICAL",
  "position_xyz":[-84,0,-67.85],"status":"MODEL_SECTION_INFERENCE",
  "condition":"原RB2主走廊板面約Y=4.0m，新連通廊地坪Y=0.13m，上下落差約3.87m；若規劃由2F直接進廊則會懸空",
  "prevention":"圖上明確把V9連廊定為1F、與2F專用走廊分開；設具踏步/平台/出入口的垂直交通，兩端節點都需能通行"},
 {"id":"P06","description":"A01二樓高拱頂與第三層樓板","category":"FUTURE_3F_VAULT","risk":"CRITICAL",
  "position_xyz":[-70.25,8,-25],"status":"DESIGN_PROPOSAL_NOT_CONSTRUCTED",
  "condition":"二樓地坪Y=4，動畫候選最高拱頂相對+9.2=>Y=13.2，若整片3F樓板Y=8則直接貫入預留拱頂4m~5.2m",
  "prevention":"A01設『二樓挑高雙層廊』保留3F樓板洞口，必要時調整坡屋頂高程；3F樓板不得跨越拱頂空間"},
 {"id":"P07","description":"南入口 D 偏心鐘樓與兩翼收邊","category":"MASSING_AND_ROOF","risk":"MEDIUM",
  "position_xyz":[-70.1,14,35],"status":"MODEL_REVIEW",
  "condition":"既有鐘樓 X≈-74.2..-65.8；新增 D 西翼 X[-98,-75]、東翼 X[-65,-22]，雙側最短間隙約0.8m，尚不能證明包板/排水/門樓空間足夠",
  "prevention":"鐘樓與兩翼建立結構伸縮/收邊節點與屋簷排水空間；以屋頂AABB和三視圖檢查，不硬拉鐘樓到X=-60"},
 {"id":"P08","description":"圖書館東側連通 H 及南入口","category":"ENTRY_AND_TRACERY","risk":"HIGH",
  "position_xyz":[-2.2,1.5,-151],"status":"CUT_AND_REFRAME",
  "condition":"原東牆兩個舊模數網格已停用，新門洞Z[-154,-149]；原高窗立柱/玻璃仍需查核是否堵塞門洞及水平轉角",
  "prevention":"逐件查核窗楣、窗柱、門框與角色1.9m×0.8m包絡；門前後至少留轉身平台，不以窗框當門扇"},
 {"id":"P09","description":"走廊淨寬尺寸來源衝突","category":"DIMENSION_CONFLICT","risk":"HIGH",
  "position_xyz":[-70.25,4,-25],"status":"VERIFIED_PLAN_CONFLICT",
  "condition":"既有RB2走廊模型跨度4.50m，手冊A01動畫建議淨寬5.20m；差0.70m，尚不確定原模型牆內淨空",
  "prevention":"固定角色1.70m比例量規，先量走廊真實牆內淨空；選擇維持4.5m鏡頭還是局部擴寬，不得兩個尺寸並存"},
 {"id":"P10","description":"V9有頂連接廊與地面通道淨空","category":"COLUMN_SWEEP","risk":"MEDIUM",
  "position_xyz":[-45,2,-127],"status":"CHECKED_BY_AABB",
  "condition":"廊道地坪厚0.13m，屋頂中心Y=5.13厚0.24m；純剖面高差約4.88m，但檐柱在廊道邊線外偏0.19m，柱寬0.30m仍可能侵入通行邊界",
  "prevention":"實測柱/窗突出與整段可行走寬度；通路淨寬以最窄斷面為準，角色碰撞膠囊沿轉角連續掃掠"},
]
for it in known:
 # attach evidence routes to normalized issues
 relation={"P01":"WEST_TO_MAIN","P02":"MAIN_TO_E_SOUTH","P03":"E_TO_G_CHAPEL",
           "P04":"WEST_TO_D_WEST_X","P05":"MAIN_TO_E_SOUTH","P08":"F_TO_H_ARCHIVE","P10":"E_NORTH_TO_LIBRARY"}
 if it["id"] in relation:
  rt=route(relation[it["id"]])
  it["route_id"]=rt["route"]
  it["route_aabb_candidates"]=rt["aabb_candidates"]
# broadphase peer intersection among distinct V9 zones: geometry contacts can be intentional
zone_collisions=Counter();examples=defaultdict(list)
v9=[n for n in arr if n["name"].startswith(P) and n["kind"] in {"low_wall","pilaster","wall_band","real_passage_jamb","party_wall_pier","covered_connector_roof","arcade_support","pitched_roof"}]
for i,a in enumerate(v9):
 for b in v9[i+1:]:
  if a["zone"]==b["zone"]:continue
  d=overlap(a["box"],b["box"])
  if all(v>.075 for v in d):
   pair=" + ".join(sorted([a["zone"],b["zone"]]))
   zone_collisions[pair]+=1
   if len(examples[pair])<4:
    examples[pair].append({"a":a["name"],"b":b["name"],"penetration_aabb_xyz_m":d})
# We will not confuse band/pier design contacts for defects.
result={
 "model":"拉乎迪學院 V9","audit":"V9_CLASH_PREVENTION_01",
 "source_sha256":SHA,
 "method":"glTF node mesh local extrema + node TRS transformed to world AABB; corridor walk volumes and architectural envelope comparisons",
 "bounds_scope":"only meshes without complex parent transforms for hotspot estimates; V9 new construction root-level",
 "visible_nodes_aabb_evaluated":len(arr),
 "v9_structural_nodes":len(v9),
 "solid_nodes_screened":len(solid),
 "routes":routes,
 "issues":known,
 "zone_aabb_contact_counts":dict(zone_collisions.most_common(30)),
 "zone_aabb_contact_examples":dict(examples),
 "source_notes":[
  "AABB intersections are conservative, may include sloping-roof false positives; not triangle-triangle collision.",
  "Portals and path widths are based on exact construction code and GLB node coordinates.",
  "Second-floor Y=4 to first-floor Y=0.13 is a route design conflict, not evidence an unbuilt stair physically collides.",
  "Third floor Y=8 and A01 vault crown Y=13.2 are animation proposal, not both built; flag preconstruction only.",
  "Character body/shoulder collision is not yet simulated; no physical structural safety approval."
 ],
 "recommended_gate":{
  "design_capsule":{"radius_m":.4,"height_m":1.9,"status":"TEST_ASSUMPTION"},
  "minimum_provisional_clear_passage_m":1.2,
  "door_clearance_test":"3-dimensional swept capsule sampled every 0.25m along all 10 links, check y=0 to 1.9",
  "floor_level_gate":"any adjacent walking segments >.15m rise require explicitly modeled steps/ramps and landing",
  "intersections_gate":"new structural walls vs route capsules (NOT wall/jamb intentional joints)",
  "A01_animation_gate":"overlay door/human/arch/keyframe viewpoints before finalizing span and story height",
  "not_code_compliance":True
 },
 "qa_status":"AABB_BROADPHASE_AND_DESIGN_RISK_COMPLETED__TRIANGLE_AND_CHARACTER_SWEEP_NOT_RUN"
}
BASE.joinpath("collision-audit-v1.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
txt=[]
txt.append("V9 collision and obstruction audit for RG-GAME-02")
txt.append(f"visible AABB nodes={len(arr)}, blocker candidates={len(solid)}, V9 targeted={len(v9)}")
txt.append("Walkable link AABB collisions by route:")
for r in routes:
 txt.append(f"  {r['route']:<28} width {r['nominal_width_m']:>5.2f}m  blockers={r['aabb_candidates']:>3}")
 for s in r["significant_examples"][:4]:
  txt.append(f"    {s['kind']:<22} ({', '.join(map(str,s['center_xyz']))}) overlap={s['overlap_m_xyz']} {s['mesh'][:93]}")
txt.append("Prioritized risks:")
for issue in known:
 txt.append(f"  {issue['id']} {issue['risk']:8} {issue['description']}: {issue['condition']}")
BASE.joinpath("collision-audit-v1.txt").write_text("\n".join(txt)+"\n")
print("\n".join(txt)[:15000])
