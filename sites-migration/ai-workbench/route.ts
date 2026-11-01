// 立之 AI 工作台 v2 — 私人 ChatGPT Site 的 /mcp 轉接（取代原 app/mcp/route.ts）
// 部署前：把原本的 app/mcp/route.ts 改名為 app/mcp/legacy-route.ts（內容不動），再放入本檔。
// - aiwb_* 工具：轉接到 Supabase Edge lizhi-ai-workbench（工具清單與規則都在 Edge，之後改工具不必再改 Site）。
// - 施工照片工具：保留原 Site 的 7 個工具，照舊走 legacy-route → Edge lizhi-production，只供「施工照片工作區」使用。
// 沿用原 Site 的 Secrets：PRODUCTION_BRIDGE_KEY（lzp_ 開頭）、PRODUCTION_CHATGPT_OWNER。
import {env} from 'cloudflare:workers';
import {identity} from '@/lib/store';
import {POST as legacyPOST} from './legacy-route';
export const dynamic = 'force-dynamic';

const UPSTREAM = 'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-ai-workbench/mcp';
const PHOTO_SHEET_TOOLS = new Set(['list_projects', 'get_project', 'create_project', 'list_project_images', 'read_project_image', 'import_project_image', 'update_project_image']);

type Rpc = {jsonrpc?: string; id?: unknown; method?: string; params?: {name?: string; arguments?: Record<string, unknown>; protocolVersion?: string}};

function legacy(req: Request, body: Rpc) {
  return legacyPOST(new Request(req.url, {method: 'POST', headers: req.headers, body: JSON.stringify(body)}));
}

async function upstream(req: Request, body: Rpc): Promise<Rpc & {result?: any; error?: any}> {
  const e = env as unknown as Record<string, string>;
  if (!e.PRODUCTION_BRIDGE_KEY || !e.PRODUCTION_CHATGPT_OWNER) throw new Error('工作台轉接尚未設定');
  // 與原 Site 相同：只有本人 ChatGPT 帳號能呼叫工具；initialize / tools/list 不需要身分。
  let actor = e.PRODUCTION_CHATGPT_OWNER;
  if (body.method === 'tools/call') {
    const who = identity(req, 'ai');
    if (who.id !== e.PRODUCTION_CHATGPT_OWNER) throw new Error('此帳號尚未連接 AI 工作台');
    actor = who.id;
  }
  const r = await fetch(UPSTREAM, {
    method: 'POST',
    headers: {Authorization: 'Bearer ' + e.PRODUCTION_BRIDGE_KEY, 'x-lizhi-actor': actor, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { /* handled below */ }
  if (!r.ok) throw new Error(data?.error || 'AI 工作台暫時無法使用');
  return data;
}

export async function POST(req: Request) {
  let id: unknown = null;
  try {
    const body = await req.json() as Rpc;
    id = body?.id ?? null;
    if (body.method === 'tools/call' && PHOTO_SHEET_TOOLS.has(String(body.params?.name ?? ''))) return legacy(req, body);
    if (body.method === 'tools/list') {
      const [aiwb, old] = await Promise.all([upstream(req, body), legacy(req, body).then((r) => r.json() as Promise<any>).catch(() => null)]);
      const photo = (old?.result?.tools ?? []).filter((t: {name: string}) => PHOTO_SHEET_TOOLS.has(t.name));
      return Response.json({jsonrpc: '2.0', id, result: {tools: [...(aiwb.result?.tools ?? []), ...photo]}}, {headers: {'Cache-Control': 'no-store'}});
    }
    return Response.json(await upstream(req, body), {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    const message = (error as Error)?.message || 'AI 工作台暫時無法使用';
    return Response.json({jsonrpc: '2.0', id, result: {content: [{type: 'text', text: message}], isError: true}});
  }
}
