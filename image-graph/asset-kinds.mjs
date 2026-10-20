import {folderPath} from './asset-folders.mjs';

// Explicit labels only; this is not visual recognition.
export function inferredAssetKind(project,name,folderId=null){
 const labels=[name,...folderPath(project,folderId).map(f=>f.name)].join('/');
 return /場景/.test(labels)?'scene':/動作|姿勢|姿態/.test(labels)?'pose':'identity';
}

export function setSceneDefaults(edge){
 edge.role='scene';
 if(edge.subject==='主角 A')edge.subject='場景 A';
 if(edge.include==='人物外觀、髮色與服裝')edge.include='場景布局、家具位置';
 if(edge.exclude==='背景')edge.exclude='';
}

export function correctSceneAssets(project){
 let changes=0;const sceneVersions=new Set();
 for(const asset of project.assets){
  if(asset.kind_source==='manual'||!['identity','scene'].includes(asset.kind)||inferredAssetKind(project,asset.name,asset.folder_id)!=='scene')continue;
  if(asset.kind!=='scene'){asset.kind='scene';asset.kind_source='scene_label';changes++}
  sceneVersions.add(asset.currentVersionId);
 }
 const nodes=new Set(project.nodes.filter(n=>sceneVersions.has(n.versionId)).map(n=>n.id));
 for(const edge of project.edges){
  if(nodes.has(edge.from)&&edge.role==='identity'&&edge.role_source!=='manual'){setSceneDefaults(edge);changes++}
 }
 return changes;
}
