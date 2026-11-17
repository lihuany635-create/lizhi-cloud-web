// Isolated CI browser runner. Uses an ephemeral Chrome profile and localhost HTTP server.
// Does not access or mutate the production site, browser profile or Supabase.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {mkdtempSync,rmSync,existsSync} from "node:fs";
import {spawn,spawnSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join,resolve,dirname,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {once} from "node:events";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../..");
const allowed=new Set([
 "/finance/budget/verification/p1-browser-harness.html",
 "/finance/domain/finance-domain.js",
 "/finance/domain/backup.js",
 "/finance/storage/finance-db.js",
 "/finance/budget/budget-domain.js",
 "/finance/budget/budget-local-store.js"
]);
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,"http://127.0.0.1");
 if(!allowed.has(url.pathname)){res.writeHead(404);res.end("Not found");return;}
 try{
  const file=join(root,url.pathname.slice(1));
  const contents=await readFile(file);
  res.setHeader("Content-Type",extname(file)===".js"?"text/javascript; charset=utf-8":"text/html; charset=utf-8");
  res.end(contents);
 }catch(e){res.writeHead(500);res.end("Fixture read error");}
});
const findChrome=()=>{
 const explicit=process.env.CHROME_BIN;
 if(explicit&&existsSync(explicit))return explicit;
 for(const name of ["google-chrome","google-chrome-stable","chromium","chromium-browser"]){
  const r=spawnSync("which",[name],{encoding:"utf8"});
  if(r.status===0&&r.stdout.trim())return r.stdout.trim();
 }
 throw new Error("CHROME_NOT_AVAILABLE: real browser verification cannot run");
};
const browser=findChrome();
const profile=mkdtempSync(join(tmpdir(),"lizhi-finance-p1-isolated-"));
try{
 server.listen(0,"127.0.0.1");
 await once(server,"listening");
 const address=server.address();
 const page="http://127.0.0.1:"+address.port+"/finance/budget/verification/p1-browser-harness.html";
 const output=await new Promise((resolveOutput,reject)=>{
  const child=spawn(browser,[
    "--headless=new","--disable-gpu","--no-first-run","--disable-background-networking",
    "--disable-dev-shm-usage","--no-sandbox","--disable-extensions",
    "--user-data-dir="+profile,"--virtual-time-budget=15000","--dump-dom",page
  ],{stdio:["ignore","pipe","pipe"]});
  let stdout="",stderr="";
  const watchdog=setTimeout(()=>{child.kill("SIGKILL");reject(new Error("BROWSER_TIMEOUT "+stderr.slice(-600)))},65000);
  child.stdout.on("data",chunk=>stdout+=chunk.toString());
  child.stderr.on("data",chunk=>stderr+=chunk.toString());
  child.on("error",error=>{clearTimeout(watchdog);reject(error)});
  child.on("close",code=>{clearTimeout(watchdog);resolveOutput({code,stdout,stderr})});
 });
 const success=/data-p1-status="PASS"/.test(output.stdout);
 const pre=output.stdout.match(/<pre id="p1-result">([\s\S]*?)<\/pre>/i)?.[1]||"";
 const unescape=t=>t.replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
 console.log("P1_CHROME_STATUS="+(success?"PASS":"FAIL"));
 console.log("P1_CHROME_RESULT="+unescape(pre).slice(0,2500));
 if(output.code!==0||!success)throw new Error("Chrome verification failed (exit "+output.code+"): "+output.stderr.slice(-700));
}finally{
 server.close();
 rmSync(profile,{recursive:true,force:true});
}
