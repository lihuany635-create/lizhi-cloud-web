import {ASSET_OPS} from '@/lib/project-assets';
import {MANAGED_OPS} from '@/lib/project-management';
import {identity,errorResponse,workspaceOperation} from '@/lib/store';
import {FlowError} from '@/lib/workflow';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const id=new URL(req.url).searchParams.get('id');return Response.json(await workspaceOperation(new URL(req.url).searchParams.get('view')==='managed'?(id?'getManagedProject':'listManagedProjects'):(id?'getWorkspaceProject':'listWorkspaceProjects'),id?[id]:[],identity(req,'author')),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
export async function POST(req:Request){try{if(req.headers.get('origin')!==new URL(req.url).origin)throw new FlowError('來源驗證失敗',403);const body=await req.text();if(body.length>1800000)throw new FlowError('資料過大',413);const b=JSON.parse(body);if(![...ASSET_OPS,...MANAGED_OPS,'createWorkspaceProject','updateWorkspaceProject','appendWorkspaceRecord','saveWorkspaceTask'].includes(b.action))throw new FlowError('未知專案操作');return Response.json(await workspaceOperation(b.action,['createWorkspaceProject','createManagedProject'].includes(b.action)?[b.args??{}]:[b.id,b.revision,b.args??{}],identity(req,'author')),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
