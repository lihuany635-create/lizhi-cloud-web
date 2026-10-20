const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const assetFolders=p=>p.asset_folders??[];
export const assetFolderId=a=>a.folder_id??null;
export const folderParentId=f=>f.parent_id??null;
export function validateAssetFolders(p){
 const folders=assetFolders(p);
 if(!Array.isArray(folders)||folders.length>200)throw Error('資料夾數量或格式無效（最多 200 個）');
 const ids=new Set();
 for(const f of folders){
  if(!f||typeof f.id!=='string'||!UUID.test(f.id)||ids.has(f.id))throw Error('資料夾識別碼無效或重複');
  if(typeof f.name!=='string'||!f.name.trim()||f.name!==f.name.trim()||f.name.length>80)throw Error('資料夾名稱須為 1～80 字');
  ids.add(f.id);
 }
 const byId=new Map(folders.map(f=>[f.id,f])),names=new Map();
 for(const f of folders){
  const parent=folderParentId(f);if(parent!==null&&!ids.has(parent))throw Error('上層資料夾不存在');
  const siblings=names.get(parent)||new Set(),name=f.name.toLocaleLowerCase();if(siblings.has(name))throw Error('同一層的資料夾名稱重複');siblings.add(name);names.set(parent,siblings);
 }
 for(const f of folders){
  const seen=new Set([f.id]);let next=folderParentId(f);
  while(next!==null){if(seen.has(next))throw Error('資料夾不可循環或放在自己裡面');seen.add(next);next=folderParentId(byId.get(next))}
 }
 for(const a of p.assets)if(assetFolderId(a)!==null&&!ids.has(a.folder_id))throw Error('素材所屬資料夾不存在');
 return folders;
}
export function folderName(p,value,exceptId,parentId=null){
 const name=String(value??'').trim();
 if(!name||name.length>80)throw Error('請填寫 1～80 字的資料夾名稱');
 if(assetFolders(p).some(f=>f.id!==exceptId&&folderParentId(f)===parentId&&f.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('這一層已有同名資料夾，請使用其他名稱');
 return name;
}
export function createAssetFolder(p,name,id,parentId=null){
 if(assetFolders(p).length>=200)throw Error('每個專案最多 200 個資料夾');
 if(parentId!==null&&!assetFolders(p).some(f=>f.id===parentId))throw Error('找不到上層資料夾');
 const folder={id,name:folderName(p,name,null,parentId),parent_id:parentId};
 if(typeof id!=='string'||!UUID.test(id)||assetFolders(p).some(f=>f.id===id))throw Error('資料夾識別碼無效或重複');
 p.asset_folders=[...assetFolders(p),folder];return folder;
}
export function renameAssetFolder(p,id,name){
 const folder=assetFolders(p).find(f=>f.id===id);if(!folder)throw Error('找不到資料夾');
 folder.name=folderName(p,name,id,folderParentId(folder));return folder;
}
export function folderPath(p,id){
 const byId=new Map(assetFolders(p).map(f=>[f.id,f])),path=[],seen=new Set();let current=id;
 while(current!==null&&byId.has(current)&&!seen.has(current)){seen.add(current);const f=byId.get(current);path.unshift(f);current=folderParentId(f)}return path;
}
export const folderPathLabel=(p,id)=>folderPath(p,id).map(f=>f.name).join(' / ');
export function folderTree(p){
 const folders=assetFolders(p),result=[],seen=new Set(),stack=folders.filter(f=>folderParentId(f)===null).reverse();
 while(stack.length){const f=stack.pop();if(seen.has(f.id))continue;seen.add(f.id);result.push(f);stack.push(...folders.filter(c=>folderParentId(c)===f.id).reverse())}return result;
}
export function folderBranchIds(p,id){
 const ids=new Set([id]);let size=0;while(size!==ids.size){size=ids.size;for(const f of assetFolders(p))if(ids.has(folderParentId(f)))ids.add(f.id)}return ids;
}
export function moveAssetsToFolder(p,ids,folderId){
 if(folderId!==null&&!assetFolders(p).some(f=>f.id===folderId))throw Error('找不到目標資料夾');
 const selected=new Set(ids);let count=0;
 for(const a of p.assets)if(selected.has(a.id)&&assetFolderId(a)!==folderId){a.folder_id=folderId;count++}
 return count;
}
export function removeAssetFolder(p,id){
 if(!assetFolders(p).some(f=>f.id===id))throw Error('找不到資料夾');
 const removed=folderBranchIds(p,id),count=moveAssetsToFolder(p,p.assets.filter(a=>removed.has(assetFolderId(a))).map(a=>a.id),null);
 p.asset_folders=assetFolders(p).filter(f=>!removed.has(f.id));return count;
}
export function filterFolderAssets(p,folder='all',kind='all',query=''){
 const q=query.trim().toLocaleLowerCase();return p.assets.filter(a=>(folder==='all'||assetFolderId(a)===(folder==='unfiled'?null:folder))&&(kind==='all'||a.kind===kind)&&a.name.toLocaleLowerCase().includes(q));
}
