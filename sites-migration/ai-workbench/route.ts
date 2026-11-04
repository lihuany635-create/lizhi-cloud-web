// Existing private Site /mcp: retain legacy-route.ts for the seven photo tools.
// Identity headers are supplied by Sites. Secrets remain server-only and unchanged.
import {env} from 'cloudflare:workers';
import {identity} from '@/lib/store';
import {POST as legacyPOST} from './legacy-route';
export const dynamic = 'force-dynamic';

const UPSTREAM = 'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-ai-workbench/mcp';
const PHOTO_SHEET_TOOLS = new Set(['list_projects', 'get_project', 'create_project', 'list_project_images', 'read_project_image', 'import_project_image', 'update_project_image']);
const HEADERS = {'Cache-Control': 'no-store'};
type Rpc = {jsonrpc?: string; id?: string | number | null; method: string; params?: {name?: string; arguments?: Record<string, unknown>; protocolVersion?: string}};
class RelayError extends Error { constructor(message: string, public code = -32603) { super(message); } }
const reply = (body: unknown) => Response.json(body, {headers: HEADERS});
const legacy = (req: Request, body: Rpc) => legacyPOST(new Request(req.url, {method: 'POST', headers: req.headers, body: JSON.stringify(body)}));

async function upstream(body: Rpc, toolCall = false): Promise<any> {
  const e = env as unknown as Record<string, string>;
  if (!e.PRODUCTION_BRIDGE_KEY || !e.PRODUCTION_CHATGPT_OWNER) throw new RelayError('工作台轉接尚未設定');
  const r = await fetch(UPSTREAM, {
    method: 'POST',
    headers: {Authorization: 'Bearer ' + e.PRODUCTION_BRIDGE_KEY, 'x-lizhi-actor': e.PRODUCTION_CHATGPT_OWNER, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  let data: any;
  try { data = await r.json(); } catch { throw new RelayError('AI 工作台回應格式錯誤'); }
  if (!r.ok) throw new RelayError(r.status === 401 || r.status === 403 ? '工作台轉接憑證或本人綁定驗證失敗' : 'AI 工作台暫時無法使用');
  if (data?.error) throw new RelayError('AI 工作台協定回應失敗');
  if (!data?.result || (!toolCall && data.result.isError)) throw new RelayError('AI 工作台回應失敗');
  return data;
}

export async function POST(req: Request) {
  let id: string | number | null = null;
  let method = '';
  try {
    let body: Rpc;
    try { body = await req.json(); } catch { throw new RelayError('JSON 格式錯誤', -32700); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.method !== 'string' ||
      (body.id !== undefined && body.id !== null && typeof body.id !== 'string' && typeof body.id !== 'number')) throw new RelayError('無效的 MCP 請求', -32600);
    id = body.id ?? null;
    method = body.method;
    if (method === 'tools/call') {
      const e = env as unknown as Record<string, string>;
      if (!e.PRODUCTION_CHATGPT_OWNER) throw new RelayError('工作台轉接尚未設定');
      const who = identity(req, 'ai');
      if (who.id !== e.PRODUCTION_CHATGPT_OWNER) throw new RelayError('此帳號尚未連接 AI 工作台');
      // All calls, including the legacy photo tools, pass the same owner check.
      if (PHOTO_SHEET_TOOLS.has(String(body.params?.name ?? ''))) return await legacy(req, body);
    }
    // Current Sites discovery protocol; legacy initialize remains supported by Edge.
    if (method === 'server/discover') return reply({jsonrpc: '2.0', id, result: {supportedVersions: ['2026-07-28'], capabilities: {tools: {}}}});
    if (method === 'notifications/initialized') return new Response(null, {status: 202, headers: HEADERS});
    if (method === 'tools/list') {
      const aiwb = await upstream(body);
      if (!Array.isArray(aiwb.result.tools) || !aiwb.result.tools.length) throw new RelayError('AI 工作台工具清單無效');
      const old = await legacy(req, body);
      const photoRpc = await old.json() as any;
      if (!old.ok || !Array.isArray(photoRpc?.result?.tools)) throw new RelayError('施工照片工具清單無法讀取');
      const photo = photoRpc.result.tools.filter((t: {name: string}) => PHOTO_SHEET_TOOLS.has(t.name));
      if (photo.length !== PHOTO_SHEET_TOOLS.size) throw new RelayError('施工照片工具清單不完整');
      return reply({jsonrpc: '2.0', id, result: {tools: [...aiwb.result.tools, ...photo]}});
    }
    if (!['initialize', 'ping', 'tools/call'].includes(method)) throw new RelayError('Method not found', -32601);
    // Tool failures retain isError, images and structuredContent.
    if (method === 'tools/call') return reply(await upstream(body, true));
    return reply(await upstream(body));
  } catch (error) {
    const message = error instanceof RelayError ? error.message : 'AI 工作台暫時無法使用';
    if (method === 'tools/call') return reply({jsonrpc: '2.0', id, result: {content: [{type: 'text', text: message}], isError: true}});
    return reply({jsonrpc: '2.0', id, error: {code: error instanceof RelayError ? error.code : -32603, message}});
  }
}
