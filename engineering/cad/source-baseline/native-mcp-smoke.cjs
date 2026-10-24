"use strict";
// E2E against the CADCraft v0.12.0 source-built *native* stdio MCP, not a mock.
// Run: node native-mcp-smoke.cjs /path/to/cadcraft-cli [evidence/dir]
const assert=require("node:assert/strict");
const fs=require("node:fs/promises"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");
const bin=process.argv[2];
const evidence=process.argv[3]||null;
if(!bin)throw Error("Supply path to SOURCE-BUILT cadcraft-cli");
async function main(){
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),"cadcraft-native-mcp-"));
  let child=null,timer=null;
  try{
    const pending=new Map();
    let nextId=1,stdout="",stderr="";
    child=spawn(bin,["mcp"],{stdio:["pipe","pipe","pipe"],shell:false,env:{PATH:process.env.PATH||"",HOME:temp,CADCRAFT_CONFIG_DIR:temp}});
    const failAll=(reason)=>{for(const p of pending.values())p.reject(new Error(reason));pending.clear();};
    child.on("error",err=>failAll("CADCraft MCP spawn: "+err.message));
    child.on("close",(code,signal)=>failAll("CADCraft MCP exited: "+code+"/"+signal+" "+stderr.slice(-300)));
    child.stderr.on("data",b=>{stderr=(stderr+b.toString()).slice(-4000);});
    child.stdout.on("data",b=>{
      stdout+=b.toString("utf8");
      if(stdout.length>8*1024*1024){failAll("MCP stdout buffer exceeded 8 MiB");child.kill("SIGKILL");return;}
      let i;
      while((i=stdout.indexOf("\n"))>=0){
        const raw=stdout.slice(0,i).trim();stdout=stdout.slice(i+1);
        if(!raw)continue;
        let data;try{data=JSON.parse(raw);}catch(e){failAll("Invalid JSON-RPC response from MCP");return;}
        const p=pending.get(data.id);if(!p)continue;pending.delete(data.id);p.resolve(data);
      }
    });
    timer=setTimeout(()=>{failAll("MCP smoke timed out");child?.kill("SIGKILL");},75000);
    const send=(method,params={})=>new Promise((resolve,reject)=>{
      const id=nextId++;pending.set(id,{resolve,reject});
      child.stdin.write(JSON.stringify({jsonrpc:"2.0",id,method,params})+"\n",err=>{if(err){pending.delete(id);reject(err);}});
    });
    async function rpc(method,params={}){
      const out=await send(method,params);assert.equal(out.jsonrpc,"2.0");
      assert.ok(!out.error,method+" returned error "+JSON.stringify(out.error));
      return out.result;
    }
    async function tool(name,args={}){
      const r=await rpc("tools/call",{name,arguments:args});
      assert.notEqual(r.isError,true,"MCP tool returned failure "+name);
      const v=r.content?.[0];assert.ok(v,"Missing MCP content for "+name);
      return v.type==="text"?JSON.parse(v.text):v;
    }
    const init=await rpc("initialize",{protocolVersion:"2025-06-18",clientInfo:{name:"lizhi-source-baseline",version:"1.0"},capabilities:{}});
    assert.equal(init.serverInfo?.name,"cadcraft");
    assert.equal(init.protocolVersion,"2025-06-18");
    child.stdin.write(JSON.stringify({jsonrpc:"2.0",method:"notifications/initialized"})+"\n");
    const tools=await rpc("tools/list");
    const names=tools.tools.map(x=>x.name);
    for(const name of ["command_line","execute","inspect_drawing","query_entities","render","new_drawing","save","open"])
      assert.ok(names.includes(name),"Missing native MCP tool "+name);
    assert.ok(!names.includes("ui_click"),"Headless MCP must not expose desktop click tools");
    await tool("new_drawing",{metric:true});
    await tool("command_line",{text:"rectang 0,0 800,900"});
    const a=await tool("inspect_drawing",{entities:false});
    assert.equal(a.entityCount,1,JSON.stringify(a).slice(0,300));
    const entities=await tool("query_entities",{type:"Polyline",limit:10});
    assert.equal(entities.count,1,JSON.stringify(entities).slice(0,300));
    await tool("execute",{command:"circle",params:{center:[100,100],radius:25}});
    const b=await tool("inspect_drawing",{entities:false});
    assert.equal(b.entityCount,2,JSON.stringify(b).slice(0,300));
    const image=await tool("render",{width:320,height:240});
    assert.equal(image.type,"image");
    assert.equal(image.mimeType,"image/png");
    assert.ok(image.data.length>100,"Empty PNG rendered");
    const file=path.join(temp,"native-mcp-test.dxf");
    await tool("save",{path:file});
    assert.ok((await fs.stat(file)).size>200,"DXF not saved");
    await tool("open",{path:file});
    const c=await tool("inspect_drawing",{entities:false});
    assert.equal(c.entityCount,2,"MCP reopened DXF changed geometry");
    const report={source:"Official CADCraft v0.12.0 source-built Rust binary",engine:"native cadcraft-cli mcp",protocol:init.protocolVersion,tool_names:names,rectangles:entities.count,entity_count_before:a.entityCount,entity_count_after:c.entityCount,headless_ui_click_exposed:false,actual_dxf_reopened:true,render_png_bytes:Buffer.from(image.data,"base64").length};
    if(evidence){
      await fs.mkdir(evidence,{recursive:true});
      await fs.writeFile(path.join(evidence,"native-mcp-smoke.json"),JSON.stringify(report,null,2));
      await fs.copyFile(file,path.join(evidence,"native-mcp-smoke.dxf"));
      await fs.writeFile(path.join(evidence,"native-mcp-smoke.png"),Buffer.from(image.data,"base64"));
    }
    console.log("CADCRAFT_SOURCE_BUILT_NATIVE_MCP_PASS",JSON.stringify({entity_count:report.entity_count_after,tools:names.length,dxf_reopen:report.actual_dxf_reopened,png_bytes:report.render_png_bytes}));
  }finally{
    if(timer)clearTimeout(timer);
    if(child){child.kill("SIGKILL");child.stdin?.destroy();}
    await fs.rm(temp,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
