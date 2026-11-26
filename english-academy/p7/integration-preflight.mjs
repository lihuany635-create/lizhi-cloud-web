// P7 read-only snapshot evaluator; never calls Supabase or deploys.
// All inputs must be collected from actual sources by the engineer.
const gates=[
 ['englishMainRoute','雲端庫正式 main 已含英語路由及身份重導'],
 ['englishSchema','正式 Supabase 本人隔離 English schema 與 RLS'],
 ['englishEdge','正式 Supabase 英語 Edge 安全驗證'],
 ['oauthOwnerLink','網站 Google 與 ChatGPT Site 本人身份連結及撤銷'],
 ['siteCompatibility','原有私人 Site AI 工作台／照片工具回歸'],
 ['independentSecurity','獨立安全複核'],
 ['formalApproval','本人分項批准'],
 ['backupRollback','正式資料備份及回退驗收'],
 ['androidVerified','Android A22 真實實機測試'],
 ['mcpEndToEnd','ChatGPT 真正連線及回傳驗證']
];
export const P7_DEPLOY_REQUIREMENTS=Object.freeze(gates.map(([id,label])=>({id,label})));
export function evaluateP7Integration(snapshot={}){
 const yes=k=>snapshot?.[k]===true;
 const blocked=P7_DEPLOY_REQUIREMENTS.filter(g=>!yes(g.id)).map(g=>g.id);
 const expected=Array.isArray(snapshot?.evidence)?snapshot.evidence:[];
 const fake=expected.filter(e=>e?.source==='mock'||e?.source==='synthetic'||e?.verifiedBy==='self');
 return {
   readiness:'BLOCKED_UNTIL_OWNER_APPROVAL_AND_REAL_VERIFICATION',
   blockers:blocked,
   invalidEvidence:fake.map(e=>e.id??'unknown'),
   draftDevelopmentAllowed:true,
   canWriteProduction:false,canMergeMain:false,canDeploy:false,
   reason:blocked.length?'REQUIRED_REAL_WORLD_GATES_OPEN':'GATE_MODULE_NEVER_DEPLOYS'
 };
}
