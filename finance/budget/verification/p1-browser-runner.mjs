// Isolated Chrome DevTools Protocol runner. Avoid --dump-dom timing races with IndexedDB async requests.
// Uses only localhost, a new temporary browser profile and test fixtures; never user data.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {mkdtempSync,rmSync,existsSync} from "node:fs";
import {spawn,spawnSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join,resolve,dirname,extname} from "node:path";
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
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function findChrome(){
 const explicit=process.env.CHROME_BIN;
 if(explicit&&existsSync(explicit))return explicit;
 for(const name of ["google-chrome","google-chrome-stable","chromium","chromium-browser"]){
  const r=spawnSync("which",[name],{encoding:"utf8"});
  if(r.status===0&&r.stdout.trim())return r.stdout.trim();
 }
 throw new Error("CHROME_NOT_AVAILABLE: real browser verification cannot run");
}
const profile=mkdtempSync(join(tmpdir(),"lizhi-finance-p1-isolated-"));
let chrome,ws;
try{
 server.listen(0,"127.0.0.1");
 await once(server,"listening");
 const addr=server.address();
 const page="http://127.0.0.1:"+addr.port+"/finance/budget/verification/p1-browser-harness.html";
 chrome=spawn(findChrome(),[
  "--headless=new","--disable-gpu","--no-first-run","--disable-background-networking",
  "--disable-dev-shm-usage","--no-sandbox","--disable-extensions",
  "--remote-allow-origins=*","--remote-debugging-port=0","--user-data-dir="+profile,page
 ],{stdio:["ignore","ignore","pipe"]});
 let chromeErrors="";
 chrome.stderr.on("data",chunk=>chromeErrors+=chunk.toString());
 let port=null,targets=null;
 for(let i=0;i<160;i++){
  if(chrome.exitCode!==null)throw new Error("Chrome exited before DevTools: "+chromeErrors.slice(-700));
  try{
   const data=await readFile(join(profile,"DevToolsActivePort"),"utf8");
   port=Number(data.split("\n")[0]);
   if(Number.isInteger(port)&&port>0){
    const response=await fetch("http://127.0.0.1:"+port+"/json/list");
    if(response.ok){
     targets=await response.json();
     if(targets.some(t=>t.type==="page"))break;
    }
   }
  }catch{}
  await delay(125);
 }
 const target=targets?.find(t=>t.type==="page");
 if(!target?.webSocketDebuggerUrl)throw new Error("CHROME_CDP_TIMEOUT "+chromeErrors.slice(-500));
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolveOpen,rejectOpen)=>{
  ws.addEventListener("open",resolveOpen,{once:true});
  ws.addEventListener("error",rejectOpen,{once:true});
 });
 let id=0;
 const pending=new Map();
 ws.addEventListener("message",event=>{
  let msg;try{msg=JSON.parse(event.data)}catch{return}
  if(msg.id&&pending.has(msg.id)){
   const p=pending.get(msg.id);pending.delete(msg.id);
   if(msg.error)p.reject(new Error(JSON.stringify(msg.error)));
   else p.resolve(msg.result);
  }
 });
 const send=(method,params={})=>new Promise((resolveRequest,rejectRequest)=>{
  const next=++id;pending.set(next,{resolve:resolveRequest,reject:rejectRequest});
  ws.send(JSON.stringify({id:next,method,params}));
 });
 await send("Runtime.enable");
 let last={status:"RUNNING"};
 for(let i=0;i<240;i++){
  const reply=await send("Runtime.evaluate",{
   expression:"({status:document.body?.dataset?.p1Status,details:document.querySelector('#p1-result')?.textContent})",
   returnByValue:true,awaitPromise:false
  });
  last=reply?.result?.value??{status:"UNKNOWN"};
  if(last.status==="PASS"||last.status==="FAIL")break;
  await delay(125);
 }
 console.log("P1_CHROME_STATUS="+last.status);
 console.log("P1_CHROME_RESULT="+String(last.details||"").slice(0,4500));
 if(last.status!=="PASS")throw new Error("Real browser IndexedDB failed: "+String(last.details||last.status));
}finally{
 try{ws?.close()}catch{}
 try{chrome?.kill("SIGTERM")}catch{}
 await delay(250);
 try{chrome?.kill("SIGKILL")}catch{}
 server.close();
 rmSync(profile,{recursive:true,force:true});
}
