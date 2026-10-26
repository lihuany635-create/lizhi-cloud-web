import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudSnapshotToHewProgram} from '../hew/cloud-direct/model-to-hew-program.mjs';

const document_id = '11111111-1111-4111-8111-111111111111';
const entity_id = 'obj_11111111111141118111111111111111';
const makeScene = () => ({
  ok: true, format: 'lizhi-model-cloud-v1', document_id,
  name: 'Cloud test', revision: 2, native_hew_saved: false,
  entities: [{id: entity_id, kind:'box', name:'Table block',
    origin_mm:[100,200,50], size_mm:[1200,600,750]}]
});

test('one cloud box translates into Hew protocol 1 with correct mm-to-m geometry', () => {
  const scene = makeScene();
  const original = structuredClone(scene);
  const program = cloudSnapshotToHewProgram(scene);
  assert.deepEqual(scene, original, 'adapter must never change cloud snapshot');
  assert.equal(program.native_hew_saved, false);
  assert.equal(program.document_id, document_id);
  assert.equal(program.revision, 2);
  assert.deepEqual(program.frames.map(x=>x.method), [
    'hew.meta.hello', 'hew.doc.new', 'hew.doc.transact'
  ]);
  const ops = program.frames[2].params.commands;
  assert.deepEqual(ops.map(x=>x.method), [
    'hew.sketch.draw_rect', 'hew.solid.extrude',
    'hew.entity.rename', 'hew.attr.set'
  ]);
  assert.deepEqual(ops[0].params.plane,
    {origin: [0.1,0.2,0.05], normal:[0,0,1]});
  assert.deepEqual(ops[0].params.corner_a,[0.1,0.2,0.05]);
  assert.deepEqual(ops[0].params.corner_b,[1.3,0.8,0.05]);
  assert.equal(ops[1].params.distance, 0.75);
  assert.deepEqual(ops[1].params.region,
    {$ref:'lizhi_sketch_0#/region_id'});
  assert.deepEqual(ops[2].params.id,
    {$ref:'lizhi_solid_0#/object_id'});
  assert.equal(ops[3].params.ns,'tw.lizhi.cloudmodel');
  assert.equal(ops[3].params.key,'cloud_entity_id');
  assert.equal(ops[3].params.value,entity_id);
  assert.deepEqual(program.entity_map,
    [{cloud_entity_id:entity_id, hew_result_alias:'lizhi_solid_0'}]);
});

test('moved full snapshot re-materializes at new position, not a second delta', () => {
  const scene=makeScene();
  scene.revision=3;
  scene.entities[0].origin_mm=[300,400,0];
  const program=cloudSnapshotToHewProgram(scene);
  assert.deepEqual(program.frames[2].params.commands[0].params.corner_a,[0.3,0.4,0]);
  assert.equal(program.frames[2].params.commands[3].params.value,entity_id);
  assert.equal(program.revision,3);
});

test('empty document emits only hello and new; no empty atomic transaction', () => {
  const scene=makeScene();
  scene.entities=[];
  const program=cloudSnapshotToHewProgram(scene);
  assert.equal(program.frames.length,2);
  assert.deepEqual(program.entity_map,[]);
});

test('two boxes use separate aliases and stable cloud entity IDs', () => {
  const scene=makeScene();
  scene.entities.push({ ...scene.entities[0],
    id: 'obj_22222222222242228222222222222222', name:'Second box' });
  const program=cloudSnapshotToHewProgram(scene);
  assert.equal(program.frames[2].params.commands.length,8);
  assert.deepEqual(program.frames[2].params.commands[5].params.region,
    {$ref:'lizhi_sketch_1#/region_id'});
  assert.equal(program.entity_map[1].hew_result_alias,'lizhi_solid_1');
});

test('invalid snapshot and unsupported geometry fail closed', () => {
  const scene=makeScene();
  assert.throws(()=>cloudSnapshotToHewProgram({...scene,format:'hew'}),
    /MODEL_BRIDGE_INVALID_SNAPSHOT/);
  assert.throws(()=>cloudSnapshotToHewProgram({...scene, revision:0}),
    /MODEL_BRIDGE_INVALID_SNAPSHOT/);
  assert.throws(()=>cloudSnapshotToHewProgram({...scene, entities:[{...scene.entities[0],kind:'mesh'}]}),
    /MODEL_BRIDGE_UNSUPPORTED_OR_INVALID_ENTITY/);
  assert.throws(()=>cloudSnapshotToHewProgram({...scene, entities:[{...scene.entities[0],size_mm:[1200,0,750]}]}),
    /MODEL_BRIDGE_UNSUPPORTED_OR_INVALID_ENTITY/);
  assert.throws(()=>cloudSnapshotToHewProgram({...scene, entities:[scene.entities[0],scene.entities[0]]}),
    /MODEL_BRIDGE_UNSUPPORTED_OR_INVALID_ENTITY/);
  assert.throws(()=>cloudSnapshotToHewProgram({...scene, entities:[{...scene.entities[0],origin_mm:[Infinity,0,0]}]}),
    /MODEL_BRIDGE_UNSUPPORTED_OR_INVALID_ENTITY/);
});
