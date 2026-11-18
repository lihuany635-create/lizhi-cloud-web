import test from "node:test";
import assert from "node:assert/strict";
import {P4_TOOLS, P4_TOOL_NAMES, validateP4Call} from "./gridcraft-p4-contract.mjs";
const valid={doc:"1",sheet:"Sheet1",range:"A3:B3",values:[["ChatGPT 測試",456]]};
const commit={preview_id:"12345678-1234-4234-a234-123456789012",
 expected_version:"a".repeat(64),request_id:"4b5db764-3a8b-4a3d-bf09-123456789012",
 owner_confirmed:true};
test("P4 tools named preview+commit; commit explicitly destructive, no direct writes",()=>{
 assert.deepEqual(P4_TOOLS.map(x=>x.name),["gridcraft_prepare_write","gridcraft_commit_write"]);
 assert.equal(P4_TOOLS[0].annotations.readOnlyHint,true);
 assert.equal(P4_TOOLS[1].annotations.destructiveHint,true);
 assert.equal(P4_TOOL_NAMES.has("gridcraft_set_cell"),false);
});
test("valid proposed two-cell range and validated owner-confirmed commit",()=>{
 assert.deepEqual(validateP4Call("gridcraft_prepare_write",valid),valid);
 assert.deepEqual(validateP4Call("gridcraft_commit_write",commit),commit);
});
test("deny command injection, hidden paths, formulas, unsafe numbers",()=>{
 for(const args of [
  {...valid,doc:"../../secrets"},
  {...valid,doc:"0"},
  {...valid,doc:"18446744073709551616"},
  {...valid,values:[["=HYPERLINK(\"https://evil.invalid\")",456]]},
  {...valid,values:[["safe",Number.POSITIVE_INFINITY]]},
  {...valid,values:[["safe",Math.pow(2,54)]]},
  {...valid,range:"A1:Z999"},
  {...valid,range:"A1:B3"},
  {...valid,cmd:"shell"},
  {...valid,sheet:"Sheet1\nx"}
 ])assert.throws(()=>validateP4Call("gridcraft_prepare_write",args));
});
test("no commit without explicit owner_confirmed true and complete arguments",()=>{
 for(const args of [
  {...commit,owner_confirmed:false},
  {...commit,owner_confirmed:undefined},
  {...commit,request_id:"oops"},
  {...commit,expected_version:"x"},
  {...commit,inject:"filename"}
 ])assert.throws(()=>validateP4Call("gridcraft_commit_write",args));
});
test("unknown and unbounded methods never become allowlisted",()=>{
 for(const method of ["execute_command","gridcraft_write_range","shell","file.save","gridcraft_read_range"]){
  assert.throws(()=>validateP4Call(method,{}),/P4_METHOD_DENIED/);
 }
});
