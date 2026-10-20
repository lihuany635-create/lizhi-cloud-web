import {hash,stable} from './core.mjs';
import {projectVersions} from './project-store.mjs?v=26';
import {validateTaskCollections,allProjectRuns} from './task-actions.mjs';
import {validateAssetFolders} from './asset-folders.mjs';
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
export async function importExistingProject(store,input){
 const p=structuredClone(input);
 if(!p||p.schema_version!=='0.1'||!UUID.test(p.id||'')||typeof p.name!=='string'||!p.name.trim()||!Number.isInteger(p.revision)||p.revision<0)throw Error('原專案格式無效');
 for(const key of ['versions','assets','nodes','edges','runs'])if(!Array.isArray(p[key])||p[key].length>2000)throw Error('原專案清單無效或過大');
 validateAssetFolders(p);validateTaskCollections(p);
 for(const v of projectVersions(p))if(!UUID.test(v.id||'')||!['image/png','image/jpeg','image/webp'].includes(v.mime)||!/^[a-f0-9]{64}$/.test(v.sha256||'')||!Number.isSafeInteger(v.byte_size)||v.byte_size<1||v.byte_size>10*1024*1024)throw Error('原圖版本索引無效');
 for(const r of allProjectRuns(p))if(await hash(stable(r.spec))!==r.spec_hash)throw Error('原任務規格校驗失敗');
 if(await store.get(p.id))throw Error('此專案已在雲端庫內，不會覆蓋既有內容；請從「專案」開啟');
 // Keep identity and immutable task snapshots so pending handoffs remain attached.
 await store.save(p,false,{expectedAbsent:true});return p;
}
