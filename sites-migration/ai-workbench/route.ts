// 立之 AI 工作台 v2 — 私人 ChatGPT Site 的 /mcp 轉接（取代原 app/mcp/route.ts）
// Site 只負責 ChatGPT OAuth 本人驗證；工具清單與所有規則都在 Supabase Edge Function
// lizhi-ai-workbench。之後新增或修改工具只要重新部署 Edge，不必再改 Site。
// 沿用原 Site 的 Secrets：PRODUCTION_BRIDGE_KEY（lzp_ 開頭）、PRODUCTION_CHATGPT_OWNER。
import {env} from 'cloudflare:workers';
import {identity} from '@/lib/store';
export const dynamic = 'force-dynamic';

const UPSTREAM = 'https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-ai-workbench/mcp';

export async function POST(req: Request) {
  let id: unknown = null;
  try {
    const body = await req.json() as {id?: unknown; method?: string};
    id = body?.id ?? null;
    const e = env as unknown as Record<string, string>;
    if (!e.PRODUCTION_BRIDGE_KEY || !e.PRODUCTION_CHATGPT_OWNER) throw new Error('工作台轉接尚未設定');
    // 與原 Site 相同：只有本人 ChatGPT 帳號能呼叫工具；initialize / tools/list 不需要身分。
    let actor = e.PRODUCTION_CHATGPT_OWNER;
    if (body?.method === 'tools/call') {
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
    if (!r.ok) {
      let msg = 'AI 工作台暫時無法使用';
      try { msg = (JSON.parse(text) as {error?: string}).error || msg; } catch { /* keep default */ }
      throw new Error(msg);
    }
    return new Response(text, {headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}});
  } catch (error) {
    const message = (error as Error)?.message || 'AI 工作台暫時無法使用';
    return Response.json({jsonrpc: '2.0', id, result: {content: [{type: 'text', text: message}], isError: true}});
  }
}
