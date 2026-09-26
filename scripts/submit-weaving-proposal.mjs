import {readFile} from "node:fs/promises";
import path from "node:path";

const file=process.argv[2];
if(!file){console.error("用法：node scripts/submit-weaving-proposal.mjs <proposal.json> [http://127.0.0.1:4180]");process.exit(2);}
const base=process.argv[3]||process.env.LIZHI_LOCAL_URL||"http://127.0.0.1:4180";
const proposal=JSON.parse(await readFile(path.resolve(file),"utf8"));
const response=await fetch(new URL("/api/weaving/inbox",base),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(proposal)});
const result=await response.json();
console.log(JSON.stringify(result,null,2));
if(!response.ok)process.exit(1);
