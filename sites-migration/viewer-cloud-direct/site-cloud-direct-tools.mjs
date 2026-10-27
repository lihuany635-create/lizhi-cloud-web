// Drop-in contract for the ORIGINAL private "立之 3D 檢視器代理" Site.
// Replace existing browser-session viewer tools; do NOT create a new Site.
// The Site MUST establish authenticated owner; never accept owner from MCP args.
const str=(maxLength=200)=>({type:'string',maxLength});
const num={type:'number',minimum:-10000,maximum:10000},vec={type:'array',items:num,minItems:3,maxItems:3};
const model={model_key:{type:'string',maxLength:80},model_sha:{type:'string',pattern:'^[a-f0-9]{64}$'}};
const write={...model,request_id:{type:'string',format:'uuid'},expected_revision:{type:'integer',minimum:0}};
const defs=[
 ['viewer_status','直接讀取雲端模型操作狀態；不需瀏覽器或連線按鈕。',{},[],true],
 ['viewer_list_models','列出 GitHub Pages 官方 GLB 模型及 SHA。',{},[],true],
 ['viewer_get_scene','讀取雲端人偶／視角狀態；可選擇真正下載 GLB 解析節點名稱，不等於畫面或幾何碰撞驗收。',{...model,include_model_index:{type:'boolean'},offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:100}},[],true],
 ['viewer_list_avatars','取得官方模型 SHA 對應的人偶狀態。',{...model},[],true],
 ['viewer_create_avatar','在雲端新增人偶座標。尚未做 GLB 地面或碰撞驗證。',{...write,name:{type:'string',minLength:1,maxLength:40},position:vec,yaw:{type:'number',minimum:-7,maximum:7}},['model_key','model_sha','expected_revision','request_id','name','position'],false],
 ['viewer_select_avatar','在雲端選取人偶。',{...write,avatar_id:str()},['model_key','model_sha','expected_revision','request_id','avatar_id'],false],
 ['viewer_move_avatar','在雲端更新人偶相對座標，每次水平位移最多3m；尚未物理碰撞驗證。',{...write,avatar_id:str(),delta:vec},['model_key','model_sha','expected_revision','request_id','avatar_id','delta'],false],
 ['viewer_teleport_avatar','在雲端更新人偶絕對座標，地面有效性待驗。',{...write,avatar_id:str(),position:vec},['model_key','model_sha','expected_revision','request_id','avatar_id','position'],false],
 ['viewer_set_camera','儲存該人偶第一／第三人稱、自由或俯視的鏡頭配置。',{...write,avatar_id:str(),mode:{type:'string',enum:['first','third','top','free']},yaw:{type:'number',minimum:-7,maximum:7},pitch:{type:'number',minimum:-1.35,maximum:1.35}},['model_key','model_sha','expected_revision','request_id','avatar_id','mode'],false],
 ['viewer_get_screenshot','此模式目前無雲端 GPU/WebGL 渲染器，明確回報未實作，不提供假截圖。',{},[],true],
 ['viewer_save_checkpoint','儲存雲端巡查位置及未視覺驗證筆記；截圖綁定的發現目前拒絕。',{...write,note:{type:'string',maxLength:2000},findings:{type:'array',maxItems:30,items:{type:'object'}}},['model_key','model_sha','expected_revision','request_id'],false],
 ['viewer_delete_avatar','從雲端狀態中刪除指定人偶，不修改 GLB。',{...write,avatar_id:str()},['model_key','model_sha','expected_revision','request_id','avatar_id'],false],
 ['viewer_stop','確認此雲端模式沒有待執行的瀏覽器操作或持續工作階段。',{},[],true]
];
export const VIEWER_CLOUD_TOOLS=defs.map(([name,description,properties,required,readonly])=>({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:readonly,destructiveHint:name==='viewer_delete_avatar',idempotentHint:readonly}}));
export const VIEWER_CLOUD_EDGE='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-viewer-cloud';
