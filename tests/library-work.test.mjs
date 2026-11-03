import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const W=require("../library/library-work.js");
const today=new Date("2026-11-03T10:00:00+08:00");
const docs=[
  {id:"a",direction:"incoming",status:"todo",issuer:"臺北市政府工務局",subject:"施工計畫審查意見",doc_no:"府工字第1150001234號",doc_date:"2026-11-01",due_date:"2026-11-02",created_at:"2026-11-01T01:00:00Z"},
  {id:"b",direction:"outgoing",status:"doing",issuer:"本公司",subject:"函復修正施工計畫",doc_date:"2026-10-20",due_date:"2026-11-05",created_at:"2026-10-20T01:00:00Z"},
  {id:"c",direction:"incoming",status:"closed",issuer:"臺北市政府工務局",subject:"材料送審核定",doc_date:"2025-06-01",due_date:"2025-06-05",created_at:"2025-06-01T01:00:00Z"},
  {id:"d",direction:"incoming",status:"todo",ai_status:"inbox",file_name:"掃描0001.pdf",created_at:"2026-11-03T01:00:00Z"}
];

test("期限狀態：逾期、即將到期、已結案不算",()=>{
  assert.equal(W.dueState(docs[0],today),"overdue");
  assert.equal(W.dueState(docs[1],today),"soon");
  assert.equal(W.dueState(docs[2],today),"none");
  assert.equal(W.dueState(docs[3],today),"none");
});

test("篩選：收發文、狀態、逾期、機關、期間、搜尋",()=>{
  const ids=opts=>W.filterDocs(docs,{today,...opts}).map(d=>d.id);
  assert.deepEqual(ids({direction:"outgoing"}),["b"]);
  assert.deepEqual(ids({status:"overdue"}),["a"]);
  assert.deepEqual(ids({status:"closed"}),["c"]);
  assert.deepEqual(ids({issuer:"臺北市政府工務局"}).sort(),["a","c"]);
  assert.deepEqual(ids({period:"30"}).sort(),["a","b","d"]);
  assert.deepEqual(ids({query:"1150001234"}),["a"]);
  assert.deepEqual(ids({query:"內文才有",hits:new Map([["c","…內文才有…"]])}),["c"]);
  assert.deepEqual(ids({sort:"due"}).slice(0,2),["c","a"]);
});

test("統計",()=>{
  assert.deepEqual(W.counts(docs,today),{todo:2,doing:1,closed:1,overdue:1,inbox:1});
});

test("Drive 連結解析",()=>{
  assert.equal(W.driveFileId(""),null);
  assert.equal(W.driveFileId("https://drive.google.com/file/d/1AbCdEfGhIjK_lm-n/view?usp=sharing"),"1AbCdEfGhIjK_lm-n");
  assert.equal(W.driveFileId("https://drive.google.com/open?id=1AbCdEfGhIjK"),"1AbCdEfGhIjK");
  assert.equal(W.driveFileId("1AbCdEfGhIjK"),"1AbCdEfGhIjK");
  assert.equal(W.driveFileId("https://evil.example.com/file/d/1AbCdEfGhIjK/view"),undefined);
  assert.equal(W.driveFileId("not a link"),undefined);
});

test("表單清理：空字串轉 null、選項與日期檢查、超長拒絕",()=>{
  assert.deepEqual(W.sanitize({direction:"incoming",status:"todo",subject:"  主旨 ",speed:"",due_date:""}),
    {direction:"incoming",status:"todo",subject:"主旨",speed:null,due_date:null});
  assert.throws(()=>W.sanitize({speed:"超級急件"}),/速別/);
  assert.throws(()=>W.sanitize({due_date:"115/11/10"}),/日期/);
  assert.throws(()=>W.sanitize({status:"done"}),/狀態/);
  assert.throws(()=>W.sanitize({doc_no:"x".repeat(121)}),/太長/);
  assert.equal("drive_file_id" in W.sanitize({drive_file_id:"x"}),false);
});
