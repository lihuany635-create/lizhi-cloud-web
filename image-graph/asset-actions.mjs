import {allProjectRuns} from './task-actions.mjs';
// Return a deletion plan without changing the project or its historical runs.
export function planAssetDeletion(project,selectedIds){
 const ids=new Set(selectedIds);
 const removedAssets=project.assets.filter(a=>ids.has(a.id));
 const assets=project.assets.filter(a=>!ids.has(a.id));
 const removedVersionIds=new Set(removedAssets.map(a=>a.currentVersionId));
 const shared=new Set(assets.map(a=>a.currentVersionId));
 const removedNodes=project.nodes.filter(n=>n.id!=='generation'&&removedVersionIds.has(n.versionId)&&!shared.has(n.versionId));
 const removedNodeIds=new Set(removedNodes.map(n=>n.id));
 const nodes=project.nodes.filter(n=>!removedNodeIds.has(n.id));
 const edges=project.edges.filter(e=>!removedNodeIds.has(e.from)&&!removedNodeIds.has(e.to));
 const used=new Set([...assets.map(a=>a.currentVersionId),...nodes.map(n=>n.versionId)]);
 const history=new Set();
 for(const run of allProjectRuns(project)){
  for(const ref of run.spec.references){used.add(ref.asset_version_id);history.add(ref.asset_version_id)}
  for(const output of run.outputs??[])used.add(output.version?.id);
 }
 const deletedVersions=project.versions.filter(v=>removedVersionIds.has(v.id)&&!used.has(v.id));
 const purgedIds=new Set(deletedVersions.map(v=>v.id));
 return {assets,nodes,edges,versions:project.versions.filter(v=>!purgedIds.has(v.id)),removedAssets,removedNodes,removedEdgeCount:project.edges.length-edges.length,deletedVersions,retainedHistoryCount:[...removedVersionIds].filter(id=>history.has(id)).length};
}
