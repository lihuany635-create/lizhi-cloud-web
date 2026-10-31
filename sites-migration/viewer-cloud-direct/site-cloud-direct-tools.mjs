// Drop-in contract for the ORIGINAL private "立之 3D 檢視器代理" Site.
// Replace existing browser-session viewer tools; do NOT create a new Site.
// The Site MUST establish authenticated owner; never accept owner from MCP args.
const str=(maxLength=200)=>({type:'string',minLength:1,maxLength});
const num={type:'number',minimum:-10000,maximum:10000},vec={type:'array',items:num,minItems:3,maxItems:3};
const model={model_key:{type:'string',minLength:2,maxLength:80,pattern:'^[a-z0-9_-]{2,80}$'},model_sha:{type:'string',pattern:'^[a-f0-9]{64}$'}};
const write={...model,request_id:{type:'string',format:'uuid'},expected_revision:{type:'integer',minimum:0}};
const defs=[
 ['viewer_status','直接讀取雲端模型操作狀態；不需瀏覽器或連線按鈕。',{},[],true],
 ['viewer_list_models','列出 GitHub Pages 官方 GLB 模型及 SHA。',{},[],true],
 ['viewer_get_scene','讀取雲端人偶／視角狀態；可選擇真正下載 GLB 解析節點名稱，不等於畫面或幾何碰撞驗收。',{...model,include_model_index:{type:'boolean'},offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:100}},[],true],
 ['viewer_list_avatars','取得官方模型 SHA 對應的人偶狀態。',{...model},[],true],
 ['viewer_create_avatar','在雲端新增人偶座標。尚未做 GLB 地面或碰撞驗證。',{...write,name:{type:'string',minLength:1,maxLength:40},position:vec,yaw:{type:'number',minimum:-7,maximum:7}},['model_key','model_sha','expected_revision','request_id','name','position'],false],
 ['viewer_select_avatar','在雲端選取人偶。',{...write,avatar_id:str()},['model_key','model_sha','expected_revision','request_id','avatar_id'],false],
 ['viewer_move_avatar','沿地板水平移動人偶，每次最多10m；delta 的 y 忽略，自動跟隨樓梯高度，撞牆或遇到落差會停下並回報 blocked。依 GLB 靜態可行走地圖，非物理或畫面驗證。',{...write,avatar_id:str(),delta:vec},['model_key','model_sha','expected_revision','request_id','avatar_id','delta'],false],
 ['viewer_teleport_avatar','把人偶放到絕對座標，自動貼到最接近 y 的可行走地板；該處沒有地板會拒絕並回報 near 建議位置。',{...write,avatar_id:str(),position:vec},['model_key','model_sha','expected_revision','request_id','avatar_id','position'],false],
 ['viewer_walk_to','只給目的地 [x,z] 或 [x,y,z]，雲端自動找路（含上下樓梯、繞過牆和家具）並走過去；回傳實際路徑。y 用來選樓層。',{...write,avatar_id:str(),target:{type:'array',items:num,minItems:2,maxItems:3}},['model_key','model_sha','expected_revision','request_id','avatar_id','target'],false],
 ['viewer_walk_path','依序直線走過最多30個路點 [x,z] 或 [x,y,z]，遇牆或落差即停在最後可達位置並回報 blocked。',{...write,avatar_id:str(),waypoints:{type:'array',minItems:1,maxItems:30,items:{type:'array',items:num,minItems:2,maxItems:3}}},['model_key','model_sha','expected_revision','request_id','avatar_id','waypoints'],false],
 ['viewer_set_camera','儲存該人偶第一／第三人稱、自由或俯視的鏡頭配置。',{...write,avatar_id:str(),mode:{type:'string',enum:['first','third','top','free']},yaw:{type:'number',minimum:-7,maximum:7},pitch:{type:'number',minimum:-1.35,maximum:1.35}},['model_key','model_sha','expected_revision','request_id','avatar_id','mode'],false],
 ['viewer_get_screenshot','由雲端伺服器載入正式 GLB，依目前雲端場景與所選人偶的鏡頭（第一人稱／第三人稱）即時渲染一張 640×360 JPEG 並以圖片回傳；不需電腦或瀏覽器在線。可帶 expected_revision 確認狀態，不符即拒絕；可帶 avatar_id 指定人偶（預設為目前選取）。簡化渲染：基本色與光照，無貼圖、陰影、反射。',{...model,expected_revision:{type:'integer',minimum:0},avatar_id:str()},['model_key','model_sha'],true],
 ['viewer_save_checkpoint','儲存雲端巡查位置及未視覺驗證筆記；截圖綁定的發現目前拒絕。',{...write,note:{type:'string',maxLength:2000},findings:{type:'array',maxItems:30,items:{type:'object'}}},['model_key','model_sha','expected_revision','request_id'],false],
 ['viewer_delete_avatar','從雲端狀態中刪除指定人偶，不修改 GLB。',{...write,avatar_id:str()},['model_key','model_sha','expected_revision','request_id','avatar_id'],false],
 ['viewer_stop','讀取無持續佇列的狀態及管理停用結果；此唯讀工具不會自行撤銷雲端渲染。需停止截圖時由 AI 依授權操作既有 Sites 管理停用設定，再驗證截圖拒絕。',{},[],true]
];
export const VIEWER_CLOUD_TOOLS=defs.map(([name,description,properties,required,readonly])=>({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:readonly,destructiveHint:name==='viewer_delete_avatar',idempotentHint:readonly}}));
export const VIEWER_CLOUD_EDGE='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-viewer-cloud';
