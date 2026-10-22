const test=require('node:test'),assert=require('node:assert/strict');
require('../viewer-inspection.js');
const policy=global.GLBInspection;
// Bounds are from exact HADES-v2.4 SHA 3e995493...21c; no rendering claim.
const meshes=[
 {name:'H24_F2_roof_1',min:[-11.15,6.8,-9.95]},
 {name:'H24_F2_roof_cornice_1',min:[-11.2,6.695,-9.98]},
 {name:'F2_slab_S',min:[-11.15,3.21,-4.09]},
 {name:'ceiling_1F_S',min:[-11.15,3.19,-4.09]},
 {name:'first_floor_prop',min:[0,.02,0]},
 {name:'second_floor_prop',min:[0,3.61,0]},
 {name:'stair_crossing_slice',min:[-8,0,-6]}
];
test('1F inspection hides roof, 2F slab and 1F ceiling while retaining low props and stairs',()=>{
 const visible=meshes.filter(x=>policy.keepMesh(x,3.12)).map(x=>x.name);
 assert.deepEqual(visible,['first_floor_prop','stair_crossing_slice']);
});
test('2F inspection hides roof and cornice while preserving second-floor props and floor',()=>{
 const visible=meshes.filter(x=>policy.keepMesh(x,6.60)).map(x=>x.name);
 assert(!visible.includes('H24_F2_roof_1'));assert(!visible.includes('H24_F2_roof_cornice_1'));
 assert(visible.includes('second_floor_prop'));assert(visible.includes('F2_slab_S'));
});
test('turning off cut restores every originally visible mesh',()=>{assert(meshes.every(x=>policy.keepMesh(x,null)));});
test('inspection light mode disables embedded lights, restoring does not reveal originally hidden lights',()=>{
 assert.equal(policy.lightVisible(true,true),false);assert.equal(policy.lightVisible(true,false),true);assert.equal(policy.lightVisible(false,false),false);
});
test('unexpected deployed model hash is rejected',()=>{assert.equal(policy.checkHash('expected','other'),false);assert.equal(policy.checkHash('expected','expected'),true);});
