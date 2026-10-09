const CACHE="lizhi-cloud-v78";
const FILES=[
  "","index.html","styles.css?v=15","theme.css?v=15","study.css?v=15","chat.css?v=15",
  "knowledge-weaving.css?v=20","finance/styles/home.css?v=61","workspace-ui.css?v=18","engineering/engineering.css?v=10","engineering/sync/sync.css?v=1","engineering/modules/supervision/supervision.css?v=1",
  "supabase-config.js?v=2","auth.js?v=2","sync.js?v=1","cloud-chat.js?v=18",
  "knowledge-weaving-validator.js?v=20","knowledge-weaving.js?v=20",
  "finance/domain/finance-domain.js?v=30","finance/domain/backup.js?v=30",
  "finance/storage/finance-db.js?v=44","finance/ui-model.js?v=30",
  "finance/domain/finance-transaction-template.js?v=1","finance/parsers/finance-amount-parser.js?v=2",
  "finance/parsers/finance-date-parser.js?v=1","finance/rules/account-aliases.js?v=1",
  "finance/rules/card-aliases.js?v=1","finance/rules/merchant-rules.js?v=1",
  "finance/rules/category-rules.js?v=1","finance/rules/transaction-keywords.js?v=1",
  "finance/domain/finance-rule-engine.js?v=1","finance/rule-memory/finance-rule-memory.js?v=1","finance/rule-memory/finance-rule-memory-store.js?v=1","finance/rule-memory/finance-rule-memory-sync.js?v=1","finance/ai/finance-ai-context.js?v=3",
  "finance/ai/finance-ai-prompt.js?v=1","finance/ai/finance-ai-output-guard.js?v=1",
  "finance/ai/finance-ai-gateway-connector.js?v=2","finance/remote/finance-ai-host-id.js?v=1",
  "finance/remote/finance-ai-job-store.js?v=2","finance/remote/finance-ai-job-connector.js?v=2",
  "finance/remote/finance-ai-host.js?v=3","finance/ai/finance-small-model-parser.js?v=4",
  "finance/domain/finance-ai-draft.js?v=54","finance/domain/finance-entity-resolver.js?v=1",
  "finance/domain/finance-draft-validator.js?v=1","finance/domain/finance-commit-payload.js?v=1",
  "finance/domain/finance-commit-controller.js?v=1","finance/voice/finance-voice-input.js?v=1",
  "finance/sync/finance-sync-store.js?v=1","finance/sync/finance-sync.js?v=1",
  "finance/pages/home.js?v=66","engineering/storage/engineering-db.js?v=12","engineering/core/module-entity-registry.js?v=1","engineering/sync/data-classification.js?v=1","engineering/sync/sync-contracts.js?v=1","engineering/sync/retry-policy.js?v=1","engineering/storage/sync-outbox-repository.js?v=1","engineering/storage/sync-state-repository.js?v=1","engineering/storage/sync-conflict-repository.js?v=1","engineering/storage/sync-receipt-repository.js?v=1","engineering/storage/sync-audit-repository.js?v=1","engineering/sync/sync-audit.js?v=1","engineering/sync/tombstone-policy.js?v=1","engineering/sync/conflict-service.js?v=1","engineering/sync/sync-checkpoint.js?v=1","engineering/sync/adapters/local-sync-adapter.js?v=1","engineering/sync/adapters/domain-apply-adapter.js?v=1","engineering/sync/outbox-service.js?v=1","engineering/sync/inbox-service.js?v=1","engineering/sync/attachments/attachment-sync-service.js?v=1","engineering/sync/sync-service.js?v=1","engineering/modules/supervision/checklists/site-inspection-checklist.js?v=1","engineering/modules/supervision/inspections/inspection-model.js?v=1","engineering/modules/supervision/inspections/inspection-workflow-models.js?v=1","engineering/modules/supervision/defects/defect-model.js?v=2","engineering/modules/supervision/defects/defect-workflow-models.js?v=1","engineering/modules/supervision/defects/defect-attachment-reference-guard.js?v=1","engineering/modules/supervision/defects/defect-workflow-service.js?v=1","engineering/modules/supervision/foundation-models.js?v=1","engineering/modules/supervision/storage/supervision-repository.js?v=1","engineering/modules/supervision/supervision-service.js?v=1","engineering/modules/supervision/formulas/gradient-percent.js?v=1","engineering/modules/supervision/formulas/percentage-deviation.js?v=1","engineering/modules/supervision/formula-pack.js?v=1","engineering/modules/supervision/module.js?v=3","engineering/pages/project-workspace.js?v=17","engineering/engineering.js?v=16","workspace-ui.js?v=24","app.js?v=33",
  "schemas/weaving-proposal.schema.json","manifest.webmanifest","media-manifest.json",
  "a4-editor/?v=14","a4-editor/index.html","a4-editor/styles.css?v=14",
  "a4-editor/app.js?v=14","a4-editor/docx-builder.js?v=14"
].map(file=>new URL(file,self.registration.scope).href);
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
});
self.addEventListener("activate",event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==self.location.origin||url.pathname.endsWith("/upload-status.json"))return;
  if(event.request.headers.has("range"))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}return response;}).catch(async()=>await caches.match(event.request)||(event.request.mode==="navigate"?await caches.match(new URL("index.html",self.registration.scope).href):null)||new Response("離線且尚未快取此內容",{status:503})));
});
