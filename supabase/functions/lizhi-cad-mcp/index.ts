import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createMcpHandler, McpServer} from "npm:@modelcontextprotocol/server@2.3.1";
import {pipeline} from "npm:@supabase/middleware@1.0.0";
import {fromSupabaseUrl, withOAuthProtectedResource, withSupabase} from "npm:@supabase/server@1.9.2";
import {z} from "npm:zod@4.6.7";

// Private OAuth user-scoped command relay ONLY. CADCraft Rust/WASM stays in the user's browser.
// No DXF, filesystem contents, screenshot or local OS path may pass through this MCP endpoint.
const SUPABASE_URL=Deno.env.get("SUPABASE_URL");
if(!SUPABASE_URL)throw new Error("SUPABASE_URL required");
const RESOURCE_SERVER=Deno.env.get("CAD_MCP_RESOURCE_SERVER")||SUPABASE_URL+"/functions/v1/lizhi-cad-mcp";
const ALLOWED_ORIGINS=new Set([
  "https://lihuany635-create.github.io","https://chatgpt.com",
  "https://chat.openai.com","http://127.0.0.1:54321",
  ...(Deno.env.get("CAD_MCP_ALLOWED_ORIGINS")||"").split(",").map(s=>s.trim()).filter(Boolean),
]);
const security=[{type:"oauth2" as const,scopes:["email"]}];
const readAnnotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const writeAnnotations={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
const uuid=z.string().uuid();
const coord=z.number().finite().min(-1_000_000).max(1_000_000);
const point=z.tuple([coord,coord]);
const radius=z.number().finite().positive().max(1_000_000);
const json=(value:Record<string,unknown>)=>({
  content:[{type:"text" as const,text:JSON.stringify(value)}],
  structuredContent:value,
});
const error=(message:string)=>({
  isError:true,content:[{type:"text" as const,text:message}],
});
type ServiceResult=ReturnType<typeof json>|ReturnType<typeof error>;
const app=pipeline(
  [
    withOAuthProtectedResource({
      resourceServer:RESOURCE_SERVER,
      authorizationServer:fromSupabaseUrl(SUPABASE_URL),
    }),
    withSupabase({auth:"user"}),
  ],
  async(req,{supabase})=>{
    const run=async(fn:()=>PromiseLike<{data:unknown,error:unknown}>,
      success:(data:unknown)=>ServiceResult):Promise<ServiceResult>=>{
      try{
        const {data,error:problem}=await fn();
        if(problem)return error("CAD 命令中繼暫時不可用或本次指令未獲授權。");
        return success(data);
      }catch{return error("CAD 命令中繼發生錯誤，未承諾已執行繪圖。");}
    };
    const serverFactory=()=>{
      const server=new McpServer({name:"lizhi-cad",version:"0.1.0"},{
        instructions:"立之 CAD 幾何命令中繼。使用者必須先在立之雲端庫的 CAD 頁面手動允許 AI 操作並保持該頁開啟。本服務只傳遞 new/line/rectang/circle 的數值參數，從不接受程式碼、AutoLISP、任意檔案路徑或 DXF 原圖。工具回覆 queued 只代表入列，必須以 get_command_result 確認繪圖真正完成；不得說『已畫完』。"
      });
      server.registerTool("status",{
        title:"查看已授權 CAD 工作階段",
        description:"列出此登入者於立之雲端庫明確開啟 AI 操作且仍在線的 CAD 分頁，僅回傳 session ID 與活動時間。",
        inputSchema:z.object({}),
        _meta:{securitySchemes:security},annotations:readAnnotations,
      },async()=>run(()=>supabase.rpc("lizhi_cad_active_sessions"),data=>json({sessions:data||[],note:"沒有在線授權分頁時請在立之 CAD 按『允許 AI 操作』"})));
      server.registerTool("draw_rectangle",{
        title:"畫矩形",
        description:"在明確已授權的立之 CAD 工作階段送入一個幾何矩形；回傳 queued/job_id 後必須查結果。單位依目前 CAD 圖面（預設 mm）。",
        inputSchema:z.object({session_id:uuid,p1:point,p2:point,request_id:uuid}),
        _meta:{securitySchemes:security},annotations:writeAnnotations,
      },async({session_id,p1,p2,request_id})=>enqueue(session_id,"rectang",{p1,p2},request_id));
      server.registerTool("draw_line",{
        title:"畫線或封閉折線",
        description:"最多 64 個有限座標頂點，需事先啟用 CAD AI 操作。",
        inputSchema:z.object({session_id:uuid,points:z.array(point).min(2).max(64),closed:z.boolean().default(false),request_id:uuid}),
        _meta:{securitySchemes:security},annotations:writeAnnotations,
      },async({session_id,points,closed,request_id})=>enqueue(session_id,"line",{points,closed},request_id));
      server.registerTool("draw_circle",{
        title:"畫圓",
        description:"正半徑，以當前 CAD 圖面單位計。",
        inputSchema:z.object({session_id:uuid,center:point,radius,request_id:uuid}),
        _meta:{securitySchemes:security},annotations:writeAnnotations,
      },async({session_id,center,radius,request_id})=>enqueue(session_id,"circle",{center,radius},request_id));
      server.registerTool("new_drawing",{
        title:"建立空白 CAD 圖面",
        description:"建立新的空白 CAD 圖面；可能替換目前工作圖面，請先確認已儲存。",
        inputSchema:z.object({session_id:uuid,request_id:uuid,metric:z.boolean().default(true)}),
        _meta:{securitySchemes:security},annotations:writeAnnotations,
      },async({session_id,request_id,metric})=>enqueue(session_id,"new",{metric},request_id));
      server.registerTool("get_command_result",{
        title:"檢查 CAD 指令是否真的完成",
        description:"依 job_id 查工作狀態 queued、claimed、succeeded、failed、expired 或 cancelled。不能把 queued 說成已繪圖。",
        inputSchema:z.object({job_id:uuid}),
        _meta:{securitySchemes:security},annotations:readAnnotations,
      },async({job_id})=>run(()=>supabase.rpc("lizhi_cad_job_status",{p_job:job_id}),data=>json({job:data||null})));
      const enqueue=(session_id:string,command:string,params:Record<string,unknown>,request_id:string)=>run(
        ()=>supabase.rpc("lizhi_cad_enqueue",{p_session:session_id,p_command:command,p_params:params,p_request_id:request_id}),
        data=>json({job_id:data,queued:true,completed:false,
          note:"僅已接受排隊；使用 get_command_result 確認是否實際執行成功。若失聯或逾時，請查既有 job_id，不要自動用新 request_id 重試。"})
      );
      return server;
    };
    return createMcpHandler(serverFactory).fetch(req);
  }
);

Deno.serve(async(req)=>{
  const origin=req.headers.get("origin");
  if(origin&&!ALLOWED_ORIGINS.has(origin))return new Response("Origin not allowed",{status:403});
  if(req.method==="OPTIONS"){
    return new Response(null,{status:204,headers:{
      "Access-Control-Allow-Origin":origin||"",
      "Access-Control-Allow-Headers":"authorization,content-type,mcp-protocol-version,mcp-session-id",
      "Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin",
    }});
  }
  const response=await app(req);
  if(!origin)return response;
  const headers=new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin",origin);
  headers.set("Vary","Origin");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
});
