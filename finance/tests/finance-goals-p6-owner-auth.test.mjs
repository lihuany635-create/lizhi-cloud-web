import test from "node:test";
import assert from "node:assert/strict";
import {verifyGoalsOwnerAccount} from "../../supabase/functions/lizhi-finance-site-mcp/finance-goals-owner-auth.mjs";
const OWNER="11111111-1111-4111-8111-111111111111";
const EMAIL="owner@example.com";
const active={id:OWNER,email:EMAIL,banned_until:null};
const admin=(user=active,error=null)=>({auth:{admin:{
  getUserById:async()=>({data:{user},error})}}});
test("P6-owner-01 accepts the configured current owner without Passkey",async()=>{
 assert.equal(await verifyGoalsOwnerAccount(admin(),OWNER,EMAIL),true);
});
test("P6-owner-02 denies revoked, deleted, or substituted owner",async()=>{
 assert.equal(await verifyGoalsOwnerAccount(admin(null,{message:"not found"}),OWNER,EMAIL),false);
 assert.equal(await verifyGoalsOwnerAccount(admin({...active,id:"22222222-2222-4222-8222-222222222222"}),OWNER,EMAIL),false);
 assert.equal(await verifyGoalsOwnerAccount(admin({...active,email:"attacker@example.com"}),OWNER,EMAIL),false);
 assert.equal(await verifyGoalsOwnerAccount(admin(),OWNER,""),false);
});
test("P6-owner-03 banned or malformed ban date fails closed",async()=>{
 assert.equal(await verifyGoalsOwnerAccount(admin({...active,banned_until:"2099-01-01T00:00:00Z"}),OWNER,EMAIL,Date.UTC(2026,10,19)),false);
 assert.equal(await verifyGoalsOwnerAccount(admin({...active,banned_until:"INVALID"}),OWNER,EMAIL),false);
 assert.equal(await verifyGoalsOwnerAccount(admin({...active,banned_until:"2020-01-01T00:00:00Z"}),OWNER,EMAIL),true);
});
test("P6-owner-04 disabled admin dependency or timeout fails closed",async()=>{
 assert.equal(await verifyGoalsOwnerAccount({},OWNER,EMAIL),false);
 assert.equal(await verifyGoalsOwnerAccount({auth:{admin:{getUserById:async()=>{throw Error("network")}}}},OWNER,EMAIL),false);
});
