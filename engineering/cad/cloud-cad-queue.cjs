"use strict";
// Storage port: production adapter MUST implement atomic insert-if-absent and compare-and-swap.
const {prepare,transition,CadJobError}=require("./cloud-cad-job.cjs");
class CadQueueError extends Error{constructor(code,message){super(message);this.name="CadQueueError";this.code=code;}}
function createQueue(storage){
 if(!storage||typeof storage.insertIfAbsent!=="function"||typeof storage.get!=="function"||typeof storage.compareAndSwap!=="function")throw new CadQueueError("CAD_STORAGE_PORT_INVALID","Requires atomic storage port");
 async function enqueue(input){
  const job=prepare(input);
  // Duplicate requests return the original job; the storage must enforce uniqueness atomically.
  const inserted=await storage.insertIfAbsent(job.idempotency_key,job);
  return inserted?job:await storage.get(job.idempotency_key);
 }
 async function change(key,to,options){
  if(typeof key!=="string"||!/^[a-f0-9]{64}$/.test(key))throw new CadQueueError("CAD_JOB_KEY_INVALID","Invalid key");
  const current=await storage.get(key);
  if(!current)throw new CadQueueError("CAD_JOB_NOT_FOUND","Unknown job");
  const next=transition(current,to,{...options,expectedStatus:current.status});
  // CAS must compare the *entire record version*, not just status, preventing ABA races.
  const ok=await storage.compareAndSwap(key,current,next);
  if(!ok)throw new CadJobError("CAD_JOB_CONFLICT","Concurrent job transition");
  return next;
 }
 async function read(key){return storage.get(key);}
 return Object.freeze({enqueue,change,read});
}
// Test-only adapter. Never use for production or multi-process workers.
function createMemoryStorage(){
 const data=new Map();
 return {
  async insertIfAbsent(k,v){if(data.has(k))return false;data.set(k,v);return true;},
  async get(k){return data.get(k)||null;},
  async compareAndSwap(k,oldValue,newValue){if(data.get(k)!==oldValue)return false;data.set(k,newValue);return true;}
 };
}
module.exports=Object.freeze({createQueue,createMemoryStorage,CadQueueError});
