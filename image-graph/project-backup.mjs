import {projectVersions} from './project-store.mjs';
import {dataBytes,hash} from './core.mjs';
import {sourceReference} from './source-folders.mjs';
import {returnedReference} from './returned-images.mjs';
import {originalLocation} from './original-store.mjs';
import {PROJECT_IMAGE_BYTES} from './limits.mjs';
export function validateExternalVersion(v){
 if(!v||!Number.isSafeInteger(v.byte_size)||v.byte_size<1||v.byte_size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(v.mime)||!/^[a-f0-9]{64}$/.test(v.sha256))throw Error('外部原圖索引損壞');
 if(v.retained_ref)returnedReference(v.retained_ref);
 else if(v.fs_ref)sourceReference(v.fs_ref);
 else if(v.returned_ref)returnedReference(v.returned_ref);
 else if(v.disk_ref)originalLocation(v);
 else throw Error('備份缺少原圖或有效來源');
 if(v.thumbnail&&(typeof v.thumbnail!=='string'||v.thumbnail.length>180000||!/^data:image\/(png|jpeg|webp);base64,/.test(v.thumbnail)))throw Error('備份縮圖無效');
}
// A reference backup never asks for device access or downloads remote originals.
// Inline originals remain portable; references keep the exact hash and location.
export async function projectBackupFiles(project,{maxBrowserBytes=PROJECT_IMAGE_BYTES,includeOriginals=false,readOriginal}={}){
 const snapshot=structuredClone(project),files={},manifest=[];let total=0;
 delete snapshot.storage_token;delete snapshot.cloud_project;
 if(includeOriginals){if(projectVersions(snapshot).reduce((sum,v)=>sum+v.byte_size,0)>maxBrowserBytes)throw Error('完整原圖 ZIP 最多 256 MiB；可改用一般專案備份，並保留裝置資料夾');delete snapshot.image_storage}
 for(const v of projectVersions(snapshot)){
  delete v.path;
  if(!v.data&&!includeOriginals){validateExternalVersion(v);continue}
  const bytes=v.data?dataBytes(v.data):await readOriginal(project,v);if(bytes.length!==v.byte_size||await hash(bytes)!==v.sha256)throw Error('備份原圖校驗失敗：'+v.name);
  total+=bytes.length;if(total>maxBrowserBytes)throw Error('瀏覽器原圖超過可還原容量，請先將原圖保存到裝置資料夾');
  const path='assets/'+v.id+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[v.mime]||'invalid');
  files[path]=bytes;v.path=path;delete v.data;manifest.push({path,sha256:v.sha256,byte_size:bytes.length});
 }
 files['project.json']=JSON.stringify(snapshot);
 files['backup-manifest.json']=JSON.stringify({schema_version:'0.1',mode:includeOriginals?'complete-v1':'references-v1',files:manifest});
 files['README.md']='# 映構專案備份\n保留畫布、任務、驗收、縮圖與原圖來源。瀏覽器內的原圖已隨包保存；裝置原圖請連同來源資料夾保留，還原後可重新連接。私人交接原圖仍需原帳號。\n';
 return files;
}
