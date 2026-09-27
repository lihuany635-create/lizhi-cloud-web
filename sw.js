const CACHE="lizhi-cloud-v61";
const FILES=["","index.html","styles.css?v=15","theme.css?v=15","study.css?v=15","chat.css?v=15","knowledge-weaving.css?v=20","finance/styles/home.css?v=55","workspace-ui.css?v=18","supabase-config.js?v=2","auth.js?v=2","sync.js?v=1","cloud-chat.js?v=18","knowledge-weaving-validator.js?v=20","knowledge-weaving.js?v=20","finance/domain/finance-domain.js?v=30","finance/domain/backup.js?v=30","finance/storage/finance-db.js?v=43","finance/ui-model.js?v=30","finance/domain/finance-transaction-template.js?v=1","finance/domain/finance-ai-draft.js?v=51","finance/ai/ollama-connector.js?v=56","finance/pages/home.js?v=55","workspace-ui.js?v=21","app.js?v=30","schemas/weaving-proposal.schema.json","manifest.webmanifest","media-manifest.json","a4-editor/?v=14","a4-editor/index.html","a4-editor/styles.css?v=14","a4-editor/app.js?v=14","a4-editor/docx-builder.js?v=14"].map(file=>new URL(file,self.registration.scope).href);
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
});
self.addEventListener("activate",event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==self.location.origin||url.pathname.endsWith('/upload-status.json'))return;
  if(event.request.headers.has('range'))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}return response;}).catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?await caches.match(new URL('index.html',self.registration.scope).href):null)||new Response('離線且尚未快取此內容',{status:503})));
});
