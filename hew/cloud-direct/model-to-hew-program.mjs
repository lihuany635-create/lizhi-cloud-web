/**
 * Pure cloud-snapshot -> Hew API protocol-1 adapter.
 *
 * This produces a SCRIPT, not a .hew file. A separate trusted headless
 * Hew CLI worker must execute the frames, verify results and persist bytes.
 * Never invoke this converter as proof that native geometry exists.
 *
 * Hew API coordinates are metres (+Z up); cloud source uses millimetres.
 * Regenerate from a COMPLETE revisioned snapshot, not a delta/queue.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLOUD_ENTITY = /^obj_[0-9a-f]{32}$/;
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const invalid = code => { throw new Error(code); };
const asMetres = mm => mm / 1000;
const pos = vec => vec.map(asMetres);

function validateCloudSnapshot(scene) {
  if (!plain(scene) || scene.format !== 'lizhi-model-cloud-v1' ||
      !UUID.test(scene.document_id ?? '') || !Number.isSafeInteger(scene.revision) ||
      scene.revision < 1 || !Array.isArray(scene.entities) ||
      scene.entities.length > 1000) invalid('MODEL_BRIDGE_INVALID_SNAPSHOT');
  const seen = new Set();
  for (const entity of scene.entities) {
    if (!plain(entity) || entity.kind !== 'box' ||
        !CLOUD_ENTITY.test(entity.id ?? '') || seen.has(entity.id) ||
        typeof entity.name !== 'string' || !entity.name.trim() ||
        entity.name.length > 80 ||
        !Array.isArray(entity.origin_mm) || entity.origin_mm.length !== 3 ||
        !entity.origin_mm.every(n => finite(n) && n >= -100000 && n <= 100000) ||
        !Array.isArray(entity.size_mm) || entity.size_mm.length !== 3 ||
        !entity.size_mm.every(n => finite(n) && n >= 0.1 && n <= 20000))
      invalid('MODEL_BRIDGE_UNSUPPORTED_OR_INVALID_ENTITY');
    seen.add(entity.id);
  }
}

/**
 * Returns ordered JSON-RPC frames consumable by `hew-cli run <script>`.
 * `entity_map` is descriptive only until Hew returns its own object IDs.
 * No output file is written and no user document is replaced.
 */
export function cloudSnapshotToHewProgram(scene) {
  validateCloudSnapshot(scene);
  const commands = [];
  const entityMap = [];
  for (const [i, entity] of scene.entities.entries()) {
    const [x, y, z] = pos(entity.origin_mm);
    const [w, d, h] = pos(entity.size_mm);
    const sketch = `lizhi_sketch_${i}`;
    const solid = `lizhi_solid_${i}`;
    commands.push({
      method: 'hew.sketch.draw_rect', as: sketch,
      params: {
        plane: { origin: [x, y, z], normal: [0, 0, 1] },
        corner_a: [x, y, z],
        corner_b: [x + w, y + d, z]
      }
    });
    commands.push({
      method: 'hew.solid.extrude', as: solid,
      params: { region: { $ref: `${sketch}#/region_id` }, distance: h }
    });
    const target = { $ref: `${solid}#/object_id` };
    commands.push({ method: 'hew.entity.rename', params: { id: target, name: entity.name } });
    // Persist original cloud object identity in Hew's documented attr dictionary.
    // Hew's native numeric/dense IDs may change after save/reopen.
    commands.push({
      method: 'hew.attr.set',
      params: { target, ns: 'tw.lizhi.cloudmodel',
        key: 'cloud_entity_id', value: entity.id }
    });
    entityMap.push({ cloud_entity_id: entity.id, hew_result_alias: solid });
  }
  const frames = [
    { jsonrpc: '2.0', id: 1, method: 'hew.meta.hello',
      params: { protocol: 1, client: { name: 'lizhi-cloud-native-bridge', version: '0.1.0' } } },
    { jsonrpc: '2.0', id: 2, method: 'hew.doc.new', params: {} }
  ];
  if (commands.length) frames.push({
    jsonrpc: '2.0', id: 3, method: 'hew.doc.transact',
    params: { label: `LiZhi cloud revision ${scene.revision}`, commands }
  });
  return {
    source_format: 'lizhi-model-cloud-v1',
    document_id: scene.document_id,
    revision: scene.revision,
    entity_map: entityMap,
    frames,
    native_hew_saved: false
  };
}
