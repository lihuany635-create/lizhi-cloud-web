import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import Classification from "../sync/data-classification.js";
import Contracts from "../sync/sync-contracts.js";
import Retry from "../sync/retry-policy.js";
import Tombstone from "../sync/tombstone-policy.js";
import LocalAdapter from "../sync/adapters/local-sync-adapter.js";
import OutboxService from "../sync/outbox-service.js";
import InboxService from "../sync/inbox-service.js";
import ConflictService from "../sync/conflict-service.js";
import Checkpoint from "../sync/sync-checkpoint.js";
import SyncAudit from "../sync/sync-audit.js";
import AttachmentSync from "../sync/attachments/attachment-sync-service.js";
import Db from "../storage/engineering-db.js";
import Workspace from "../pages/project-workspace.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const stamp="2026-10-04T00:00:00.000Z";
const item=(overrides={})=>({id:"change-1",entity_type:"notes",entity_id:"note-1",project_id:"project-1",workspace_id:"workspace-1",operation:"update",local_version:1,payload:{id:"note-1",project_id:"project-1",title:"A",content:"B",created_at:stamp,updated_at:stamp},created_at:stamp,attempt_count:0,next_attempt_at:stamp,status:"pending",idempotency_key:"workspace-1:notes:note-1:1:update",last_error:null,...overrides});
function memoryOutbox(rows=[item()]){const map=new Map(rows.map(row=>[row.id,{...row}]));return{async get(id){return map.get(id)||null;},async put(value){map.set(value.id,{...value});return value;},async list(){return[...map.values()];},async listPending(){return[...map.values()].filter(value=>["pending","failed"].includes(value.status));},async countPending(){return[...map.values()].filter(value=>value.status!=="sent").length;},map};}
function memoryKeyed(key="id"){const map=new Map();return{async get(id){return map.get(id)||null;},async put(value){map.set(value[key],JSON.parse(JSON.stringify(value)));return value;},async add(value){map.set(value[key],JSON.parse(JSON.stringify(value)));return value;},async list(){return[...map.values()];},map};}
function inboxFixture({receipt=null,projectAccess=async()=>true}={}){const receipts=memoryKeyed();if(receipt)receipts.map.set(`${receipt.entity_type}:${receipt.entity_id}`,receipt);receipts.get=async(type,id)=>receipts.map.get(`${type}:${id}`)||null;const conflicts=[],applied=[],advanced=[];const service=InboxService.create({receiptRepository:receipts,conflictService:{async detect(value){const conflict={id:`conflict-${conflicts.length+1}`,...value};conflicts.push(conflict);return conflict;}},applyAdapter:{async apply(change){applied.push(change);}},checkpoint:{async advance(scope,value){advanced.push({scope,...value});}},workspaceId:"workspace-1",projectAccess,now:()=>stamp});return{service,receipts,conflicts,applied,advanced};}
const remote=(overrides={})=>({...item(),change_id:"remote-1",server_sequence:1,server_received_at:stamp,remote_base_version:0,...overrides});

test("P10-01 Project is Wave 1 mutable",()=>assert.equal(Classification.get("projects").wave,1));
test("P10-02 Note is Wave 1 bidirectional",()=>assert.equal(Classification.get("notes").direction,"bidirectional"));
test("P10-03 Measurement uses manual conflicts",()=>assert.equal(Classification.get("measurements").conflict_policy,"manual"));
test("P10-04 ProjectRecord uses tombstones",()=>assert.equal(Classification.get("project_records").delete_policy,"tombstone"));
test("P10-05 Published Quote is immutable",()=>assert.equal(Classification.get("published_quotes").conflict_policy,"immutable_reject"));
test("P10-06 Workflow Event is append-only",()=>assert.equal(Classification.get("workflow_events").classification,"append_only"));
test("P10-07 Task requires state-aware conflict handling",()=>assert.equal(Classification.get("tasks").conflict_policy,"manual_state_transition"));
test("P10-08 executed AI Action is not remotely replayed",()=>assert.equal(Classification.get("ai_actions").direction,"none"));
test("P10-09 render cache never synchronizes",()=>assert.equal(Classification.get("render_cache").direction,"none"));
test("P10-10 attachment binary is deferred to Wave 5",()=>assert.equal(Classification.get("attachment_binary").wave,5));
test("P10-11 deferred entity is rejected",()=>assert.throws(()=>Classification.assertRemoteAllowed("tasks"),error=>error.code==="SYNC_WAVE_DEFERRED"));
test("P10-12 unknown entity is rejected",()=>assert.throws(()=>Classification.assertRemoteAllowed("finance_transactions"),error=>error.code==="SYNC_ENTITY_TYPE_UNKNOWN"));
test("P10-13 no policy uses global last-write-wins",()=>assert.ok(Object.values(Classification.DEFINITIONS).every(value=>!String(value.conflict_policy).includes("last_write"))));

test("P10-14 valid Outbox contract normalizes",()=>assert.equal(Contracts.outbox(item()).entity_id,"note-1"));
test("P10-15 Outbox rejects unknown fields",()=>assert.throws(()=>Contracts.outbox({...item(),secret:"x"}),error=>error.code==="SYNC_CONTRACT_UNKNOWN_FIELD"));
test("P10-16 Outbox rejects invalid operation",()=>assert.throws(()=>Contracts.outbox(item({operation:"publish"}))));
test("P10-17 Outbox rejects invalid status",()=>assert.throws(()=>Contracts.outbox(item({status:"loop"}))));
test("P10-18 Outbox requires positive logical version",()=>assert.throws(()=>Contracts.outbox(item({local_version:0}))));
test("P10-19 Delete strips payload",()=>assert.equal(Contracts.outbox(item({operation:"delete",payload:{secret:true}})).payload,null));
test("P10-20 non-delete requires object payload",()=>assert.throws(()=>Contracts.outbox(item({payload:null}))));
test("P10-21 Remote contract validates server sequence",()=>assert.throws(()=>Contracts.remote(remote({server_sequence:0}))));
test("P10-22 Remote contract validates base version",()=>assert.throws(()=>Contracts.remote(remote({remote_base_version:-1}))));
test("P10-23 Remote contract rejects forged unknown fields",()=>assert.throws(()=>Contracts.remote(remote({workspace_admin:true})),error=>error.code==="SYNC_CONTRACT_UNKNOWN_FIELD"));

test("P10-24 retry delay is exponential",()=>assert.equal(Retry.delay(3),8000));
test("P10-25 retry delay is capped",()=>assert.equal(Retry.delay(99),Retry.MAX_DELAY_MS));
test("P10-26 network failure is retryable",()=>assert.equal(Retry.retryable({code:"SYNC_NETWORK_OFFLINE"}),true));
test("P10-27 403 is non-retryable",()=>assert.equal(Retry.retryable({code:"SYNC_FORBIDDEN"}),false));
test("P10-28 invalid payload is non-retryable",()=>assert.equal(Retry.retryable({code:"SYNC_PAYLOAD_INVALID"}),false));
test("P10-29 retry updates only safe error code",()=>assert.equal(Retry.next(item(),{code:"SYNC_NETWORK_OFFLINE"},0).last_error,"SYNC_NETWORK_OFFLINE"));
test("P10-30 fifth failure becomes dead letter",()=>assert.equal(Retry.next(item({attempt_count:4}),{code:"SYNC_NETWORK_OFFLINE"},0).status,"dead_letter"));

test("P10-31 local adapter deduplicates duplicate upload",async()=>{const adapter=LocalAdapter.create();const first=await adapter.push([item()]),second=await adapter.push([item()]);assert.equal(first[0].duplicate,false);assert.equal(second[0].duplicate,true);assert.equal(adapter.snapshot().length,1);});
test("P10-32 local adapter assigns server sequence",async()=>{const adapter=LocalAdapter.create();await adapter.push([item(),item({id:"change-2",entity_id:"note-2",idempotency_key:"two"})]);assert.deepEqual(adapter.snapshot().map(row=>row.server_sequence),[1,2]);});
test("P10-33 local adapter cursor pulls only later rows",async()=>{const adapter=LocalAdapter.create();await adapter.push([item(),item({id:"change-2",entity_id:"note-2",idempotency_key:"two"})]);assert.equal((await adapter.pull(1)).changes.length,1);});
test("P10-34 offline adapter fails without busy loop",async()=>{const adapter=LocalAdapter.create({online:false});await assert.rejects(()=>adapter.push([item()]),error=>error.code==="SYNC_NETWORK_OFFLINE");});
test("P10-35 adapter declares simulation not cloud",()=>assert.equal(LocalAdapter.create().isCloud,false));

test("P10-36 Outbox sends once and marks sent",async()=>{const repository=memoryOutbox(),service=OutboxService.create({repository,adapter:LocalAdapter.create(),now:()=>stamp});assert.deepEqual(await service.flush(),{sent:1,failed:0});assert.equal(repository.map.get("change-1").status,"sent");});
test("P10-37 duplicate flush has no business effect",async()=>{const repository=memoryOutbox(),adapter=LocalAdapter.create(),service=OutboxService.create({repository,adapter,now:()=>stamp});await service.flush();await service.flush();assert.equal(adapter.snapshot().length,1);});
test("P10-38 failed push records backoff",async()=>{const repository=memoryOutbox(),service=OutboxService.create({repository,adapter:LocalAdapter.create({online:false}),now:()=>stamp});assert.deepEqual(await service.flush(),{sent:0,failed:1});assert.equal(repository.map.get("change-1").status,"failed");});
test("P10-39 manual retry requeues item",async()=>{const repository=memoryOutbox([item({status:"failed",next_attempt_at:"2999-01-01T00:00:00.000Z"})]),adapter=LocalAdapter.create(),service=OutboxService.create({repository,adapter,now:()=>stamp});await service.retry("change-1");assert.equal(repository.map.get("change-1").status,"sent");});

test("P10-40 tombstone accepts a delete",()=>assert.equal(Tombstone.evaluate({receipt:null,remote:remote({operation:"delete",payload:null})}).allow,true));
test("P10-41 old update cannot resurrect tombstone",()=>assert.equal(Tombstone.evaluate({receipt:{deleted:true,local_version:2},remote:remote({local_version:2})}).reason,"TOMBSTONE_PREVENTS_RESURRECTION"));
test("P10-42 newer update after delete becomes conflict",()=>assert.equal(Tombstone.evaluate({receipt:{deleted:true,local_version:2},remote:remote({local_version:3})}).reason,"DELETE_UPDATE_CONFLICT"));

test("P10-43 Inbox applies a valid remote change",async()=>{const fx=inboxFixture();assert.equal((await fx.service.applyOne(remote())).status,"applied");assert.equal(fx.applied.length,1);});
test("P10-44 Inbox duplicate delivery is idempotent",async()=>{const fx=inboxFixture();await fx.service.applyOne(remote());assert.equal((await fx.service.applyOne(remote())).status,"duplicate");assert.equal(fx.applied.length,1);});
test("P10-45 Inbox rejects cross-workspace payload",async()=>{const fx=inboxFixture();await assert.rejects(()=>fx.service.applyOne(remote({workspace_id:"other"})),error=>error.code==="SYNC_WORKSPACE_FORBIDDEN");});
test("P10-46 Inbox rejects cross-project payload",async()=>{const fx=inboxFixture({projectAccess:async()=>false});await assert.rejects(()=>fx.service.applyOne(remote()),error=>error.code==="SYNC_PROJECT_FORBIDDEN");});
test("P10-47 Inbox rejects deferred Workflow Task",async()=>{const fx=inboxFixture();await assert.rejects(()=>fx.service.applyOne(remote({entity_type:"tasks",entity_id:"task-1",payload:{id:"task-1"}})),error=>error.code==="SYNC_WAVE_DEFERRED");});
test("P10-48 Inbox rejects Published Quote mutation",async()=>{const fx=inboxFixture();await assert.rejects(()=>fx.service.applyOne(remote({entity_type:"published_quotes",entity_id:"quote-1",payload:{id:"quote-1"}})),error=>error.code==="SYNC_IMMUTABLE_CONFLICT");});
test("P10-49 concurrent local update creates conflict",async()=>{const fx=inboxFixture({receipt:{entity_type:"notes",entity_id:"note-1",local_version:2,deleted:false}});assert.equal((await fx.service.applyOne(remote({remote_base_version:1}))).status,"conflict");assert.equal(fx.applied.length,0);});
test("P10-50 delete versus offline update creates conflict",async()=>{const fx=inboxFixture({receipt:{entity_type:"notes",entity_id:"note-1",local_version:2,deleted:true}});assert.equal((await fx.service.applyOne(remote({local_version:3}))).status,"conflict");});
test("P10-51 checkpoint advances only after full batch",async()=>{const fx=inboxFixture();await fx.service.applyBatch("scope",[remote()],1);assert.equal(fx.advanced[0].cursor,1);});
test("P10-52 invalid batch does not advance checkpoint",async()=>{const fx=inboxFixture();await assert.rejects(()=>fx.service.applyBatch("scope",[remote({workspace_id:"other"})],1));assert.equal(fx.advanced.length,0);});
test("P10-53 out-of-order batch is applied by server sequence",async()=>{const fx=inboxFixture();await fx.service.applyBatch("scope",[remote({change_id:"two",entity_id:"note-2",server_sequence:2,idempotency_key:"two",payload:{id:"note-2"}}),remote()],2);assert.deepEqual(fx.applied.map(change=>change.server_sequence),[1,2]);});

test("P10-54 conflict service records minimal conflict",async()=>{const repository=memoryKeyed(),service=ConflictService.create({repository,now:()=>stamp,idGenerator:()=>"c1"});const value=await service.detect({remote:remote(),reason:"CONCURRENT_UPDATE"});assert.equal(value.status,"open");});
test("P10-55 conflict can be deferred",async()=>{const repository=memoryKeyed(),service=ConflictService.create({repository,now:()=>stamp,idGenerator:()=>"c1"});await service.detect({remote:remote(),reason:"CONCURRENT_UPDATE"});assert.equal((await service.resolve("c1","later")).status,"deferred");});
test("P10-56 immutable conflict cannot arbitrary overwrite",async()=>{const repository=memoryKeyed(),service=ConflictService.create({repository,now:()=>stamp,idGenerator:()=>"c1"});await service.detect({remote:remote(),reason:"SYNC_IMMUTABLE_CONFLICT"});await assert.rejects(()=>service.resolve("c1","keep_remote"),error=>error.code==="SYNC_IMMUTABLE_CONFLICT");});

test("P10-57 checkpoint starts at never",async()=>{const service=Checkpoint.create({repository:memoryKeyed("scope_id"),now:()=>stamp});assert.equal((await service.get("scope")).status,"never");});
test("P10-58 checkpoint records cursor",async()=>{const service=Checkpoint.create({repository:memoryKeyed("scope_id"),now:()=>stamp});assert.equal((await service.advance("scope",{cursor:3,workspaceId:"w"})).cursor,3);});
test("P10-59 checkpoint failure preserves safe code",async()=>{const service=Checkpoint.create({repository:memoryKeyed("scope_id"),now:()=>stamp});assert.equal((await service.fail("scope",{code:"SYNC_DOWN"})).last_error,"SYNC_DOWN");});

test("P10-60 audit allowlist excludes payload events",()=>assert.equal(SyncAudit.ALLOWED.has("raw_payload_saved"),false));
test("P10-61 audit stores only bounded diagnostic details",async()=>{const repository=memoryKeyed(),service=SyncAudit.create({repository,now:()=>stamp,idGenerator:()=>"a1"}),value=await service.record("push_failure",{details:{count:1,secret:"no"}});assert.deepEqual(value.details,{count:1});});

test("P10-62 attachment diagnostics explicitly defer cloud upload",async()=>{const service=AttachmentSync.create({projectDataService:{diagnoseAttachments:async()=>({missing_payloads:[],orphan_binary_keys:[]}),cleanupOrphanBinaries:async()=>0}});assert.equal((await service.diagnose("p")).cloud_uploads_deferred,true);});
test("P10-63 interrupted attachment upload has repair plan",()=>{const service=AttachmentSync.create({projectDataService:{}});assert.equal(service.planFailureRecovery("UPLOAD_INTERRUPTED"),"resume-by-object-key-and-checksum");});
test("P10-64 checksum mismatch is quarantined",()=>{const service=AttachmentSync.create({projectDataService:{}});assert.equal(service.planFailureRecovery("CHECKSUM_MISMATCH"),"quarantine-and-reupload");});
test("P10-65 quota exceeded requires user action",()=>{const service=AttachmentSync.create({projectDataService:{}});assert.equal(service.planFailureRecovery("QUOTA_EXCEEDED"),"dead-letter-and-request-user-action");});

test("P10-66 later Engineering DB preserves v8 sync stores",()=>assert.equal(Db.DB_VERSION,12));
test("P10-67 DB exposes five sync stores",()=>{for(const name of["sync_outbox","sync_state","sync_conflicts","sync_receipts","sync_audit"])assert.equal(Db.STORES[name],name);});
test("P10-68 v7 fixture preserves Phase 10 stores while later stores migrate",async()=>{const prior=["projects","settings","calculations","measurements","notes","attachments","project_records","designs","boms","price_entries","quotes","project_members","tasks","task_reviews","workflow_events","ai_drafts","ai_actions","ai_events"],existing=new Set(prior),created=[],db={objectStoreNames:{contains:name=>existing.has(name)},createObjectStore(name){created.push(name);existing.add(name);return{createIndex(){}};},close(){},transaction(){throw new Error("unused");}},request={result:db},indexedDBImpl={open(name,version){assert.equal(version,12);queueMicrotask(()=>{request.onupgradeneeded?.();request.onsuccess?.();});return request;}};await Db.openDatabase(indexedDBImpl);assert.deepEqual(created,["supervision_inspections","supervision_defects","supervision_profiles","supervision_parties","supervision_work_items","supervision_locations","supervision_relations","supervision_inspection_revisions","supervision_inspection_reviews","supervision_inspection_events","supervision_corrective_rounds","supervision_defect_reviews","supervision_defect_events","sync_outbox","sync_state","sync_conflicts","sync_receipts","sync_audit"]);for(const name of prior)assert.ok(existing.has(name));});
test("P10-69 atomic commit spans entity outbox receipt and settings",()=>assert.match(read("engineering/storage/engineering-db.js"),/transaction\(\[storeName,STORES\.settings,STORES\.sync_outbox,STORES\.sync_receipts\],"readwrite"\)/));
test("P10-70 Wave 1 repositories use atomic commit",()=>{const source=read("engineering/storage/project-data-repository.js");assert.match(source,/commitEntityChange/);assert.match(source,/measurements.*notes.*project_records/);});

const project={id:"p",workspace_id:"w",name:"Project",status:"active",module_ids:[],created_at:stamp,updated_at:stamp,metadata:{}};
test("P10-71 UI distinguishes local save from cloud sync",()=>{const html=Workspace.render({project,sync:{online:true,cloud_enabled:false,pending_count:2,conflicts:[]}});assert.match(html,/Saved locally · Cloud not connected/);assert.match(html,/Pending sync: <b>2/);});
test("P10-72 UI displays offline explicitly",()=>assert.match(Workspace.render({project,sync:{online:false,conflicts:[]}}),/>Offline</));
test("P10-73 UI exposes conflict choices",()=>{const html=Workspace.render({project,sync:{online:true,conflicts:[{id:"c",entity_type:"notes",entity_id:"n",reason:"CONCURRENT_UPDATE",local_version:{},remote_version:{}}]}});for(const label of["Keep Local","Keep Remote","Create New Revision","Later"])assert.match(html,new RegExp(label));});
test("P10-74 production loads sync contracts before runtime",()=>{const html=read("index.html");assert.match(html,/data-classification\.js[\s\S]*sync-contracts\.js[\s\S]*inbox-service\.js[\s\S]*project-workspace\.js\?v=17[\s\S]*engineering\.js\?v=16/);});
test("P10-75 service worker caches Phase 10 surface",()=>{const source=read("sw.js");assert.match(source,/lizhi-cloud-v79/);assert.match(source,/sync-service\.js\?v=1/);});
test("P10-76 architecture explicitly says no production cloud",()=>assert.match(read("engineering/phase10-offline-sync-architecture.md"),/not production cloud sync/i));
test("P10-77 architecture defines clock-skew defense",()=>assert.match(read("engineering/phase10-offline-sync-architecture.md"),/Client timestamps are diagnostic only/i));
test("P10-78 architecture defines Cloud RLS gate",()=>assert.match(read("engineering/phase10-offline-sync-architecture.md"),/RLS for SELECT\/INSERT\/UPDATE\/DELETE/));
test("P10-79 generic root sync is not imported by Engineering sync",()=>{const code=fs.readdirSync(path.join(root,"engineering/sync"),{recursive:true}).filter(file=>String(file).endsWith(".js")).map(file=>read(`engineering/sync/${String(file).replaceAll("\\","/")}`)).join("\n");assert.doesNotMatch(code,/require\([^)]*["']\.\.\/\.\.\/sync\.js/);});
test("P10-80 Finance DB remains v1 and Phase 10 writes no Finance data",()=>{assert.match(read("finance/storage/finance-db.js"),/DB_VERSION=1/);const code=fs.readdirSync(path.join(root,"engineering/sync"),{recursive:true}).filter(file=>String(file).endsWith(".js")).map(file=>read(`engineering/sync/${String(file).replaceAll("\\","/")}`)).join("\n");assert.doesNotMatch(code,/FinanceStorage|finance_transactions|write_finance/i);});
