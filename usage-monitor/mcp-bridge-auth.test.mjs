import {test} from "node:test";
import assert from "node:assert/strict";
import {verifySiteBridge} from "../supabase/functions/_shared/lizhi-usage-mcp-bridge-auth.mjs";
const secret="a".repeat(64);
const actor="chatgpt:verified-owner-123";
const config={secret,actor};
const headers=(key=secret,id=actor)=>new Headers({
 "x-lizhi-usage-bridge":key,"x-lizhi-usage-actor":id
});
test("verified server-to-server secret and actor is accepted",async()=>{
 assert.equal(await verifySiteBridge(headers(),config),true);
});
test("missing secret never passes",async()=>{
 assert.equal(await verifySiteBridge(new Headers(),config),false);
});
test("wrong secret never passes",async()=>{
 assert.equal(await verifySiteBridge(headers("x".repeat(64)),config),false);
});
test("wrong principal never passes",async()=>{
 assert.equal(await verifySiteBridge(headers(secret,"chatgpt:unrelated"),config),false);
});
test("missing principal never passes",async()=>{
 const h=headers();h.delete("x-lizhi-usage-actor");
 assert.equal(await verifySiteBridge(h,config),false);
});
test("missing configured secret never passes",async()=>{
 assert.equal(await verifySiteBridge(headers(),{actor}),false);
});
test("missing actor configuration never passes",async()=>{
 assert.equal(await verifySiteBridge(headers(),{secret}),false);
});
test("short secret is rejected",async()=>{
 assert.equal(await verifySiteBridge(headers("short"),{...config,secret:"short"}),false);
});
test("rejects oversized secret header without throwing",async()=>{
 assert.equal(await verifySiteBridge(headers("a".repeat(2049)),config),false);
});
test("rejects owner who could not have been validated by Site",async()=>{
 assert.equal(await verifySiteBridge(headers(secret,""),config),false);
});
