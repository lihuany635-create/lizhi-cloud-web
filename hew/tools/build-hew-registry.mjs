#!/usr/bin/env node
/**
 * Builds hew/sites/hew-api-registry.json from Hew's generated API reference
 * (lizhi-hew: docs/API_REFERENCE.gen.md). The registry is what ChatGPT reads
 * through `model_api_reference`, and the allowlist `model_call` validates
 * method names against.
 *
 *   node hew/tools/build-hew-registry.mjs ../lizhi-hew/docs/API_REFERENCE.gen.md
 *
 * Writes the JSON to hew/sites/ and to the Edge Function bundle.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,join} from "node:path";

const src=process.argv[2];
if(!src){console.error("usage: build-hew-registry.mjs <API_REFERENCE.gen.md> [--source <repo@commit>]");process.exit(2);}
const sourceIdx=process.argv.indexOf("--source");
const source=sourceIdx>0?process.argv[sourceIdx+1]:"lihuany635-create/lizhi-hew";
const md=readFileSync(src,"utf8");

export function parseReference(text){
 const methods=[];
 const blocks=text.split(/^### `/m).slice(1);
 for(const block of blocks){
  const name=block.slice(0,block.indexOf("`"));
  if(!/^hew\.[a-z]+\.[a-z_]+$/.test(name))continue;
  const field=k=>(block.match(new RegExp(`^- \\*\\*${k}:\\*\\* (.+)$`,"m"))||[])[1]?.trim()??null;
  const afterMeta=block.split(/\n\n/).slice(1);
  const summary=(afterMeta.find(p=>p.trim()&&!p.startsWith("-")&&!p.startsWith("**")&&!p.startsWith("```"))??"").trim();
  const schema=label=>{
   const m=block.match(new RegExp(`\\*\\*${label} schema:\\*\\*\\s*\\n\\s*\`\`\`json\\n([\\s\\S]*?)\\n\`\`\``));
   return m?JSON.parse(m[1]):null;
  };
  const refusals=[];
  const r=block.match(/\*\*Refusals:\*\*\s*\n((?:- `[^`]+`\n?)+)/);
  if(r)for(const line of r[1].split("\n")){const x=line.match(/`([^`]+)`/);if(x)refusals.push(x[1]);}
  methods.push({
   method:name,namespace:name.split(".")[1],
   tier:field("Tier"),class:field("Class"),served:field("Served"),
   summary:summary.replace(/\s+/g," ").slice(0,1200),
   params:schema("Params"),result:schema("Result"),refusals,
  });
 }
 return methods;
}

const methods=parseReference(md);
if(methods.length<50)throw Error(`only ${methods.length} methods parsed; reference format changed?`);
const registry={source,generated_from:"docs/API_REFERENCE.gen.md",count:methods.length,methods};
const here=dirname(fileURLToPath(import.meta.url));
const out=JSON.stringify(registry,null,1)+"\n";
for(const target of [join(here,"../sites/hew-api-registry.json"),
  join(here,"../../supabase/functions/lizhi-model-site-mcp/hew-api-registry.json")]){
 writeFileSync(target,out);
 console.log(`wrote ${methods.length} methods -> ${target}`);
}
