import {test} from "node:test";
import assert from "node:assert/strict";
import {resolveUsageOwner,WORKBENCH_USAGE_PROJECT_ID} from "../supabase/functions/_shared/lizhi-ai-owner-binding.mjs";
const uuid="7ee9b650-4b22-4c13-ba46-9ceefa9deaaa";
test("binds to original project id, not another site",()=>assert.equal(WORKBENCH_USAGE_PROJECT_ID,"879209cd-8c8a-46ba-903e-74ccaa93710f"));
test("accepts exactly one original project owner",async()=>assert.equal(
 await resolveUsageOwner({queryProject:async()=>[{owner_id:uuid}]}),uuid));
test("rejects missing workbench record",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>[]}),x=>x.status===503));
test("rejects multiple owner records",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>[{owner_id:uuid},{owner_id:uuid}]}),x=>x.status===503));
test("rejects invalid owner id",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>[{owner_id:"attacker"}]}),x=>x.status===503));
test("rejects malformed backend response",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>({owner_id:uuid})}),x=>x.status===503));
test("rejects backend query failure and fails closed",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>{throw Error("db offline")}}),x=>x.status===503));
test("rejects explicit owner setting mismatch",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>[{owner_id:uuid}],
 ownerUid:"b3db4b43-c7fa-4c31-8159-f63f77f9852e"}),x=>x.status===503));
test("rejects malformed explicit owner setting",async()=>assert.rejects(
 resolveUsageOwner({queryProject:async()=>[{owner_id:uuid}],ownerUid:"invalid"}),x=>x.status===503));
test("honors matching verified server owner setting",async()=>assert.equal(
 await resolveUsageOwner({queryProject:async()=>[{owner_id:uuid}],ownerUid:uuid}),uuid));
