import { ResponseHandler, CORS_HEADERS } from '../_shared/response-handlers.ts';

// Context7 MCP proxy/health function
// - Uses CONTEXT7_API_KEY stored in Supabase secrets (Project Settings → Secrets)
// - Never expose this key to the client; call this function from server or with auth

const MCP_URL = Deno.env.get('CONTEXT7_MCP_URL') || 'https://mcp.context7.com/mcp';

async function pingMcp(requestId: string) {
  const apiKey = Deno.env.get('CONTEXT7_API_KEY');
  if (!apiKey) throw new Error('Missing CONTEXT7_API_KEY secret');

  const headers = new Headers({
    'CONTEXT7_API_KEY': apiKey,
    'Content-Type': 'application/json',
    // Accept both JSON and SSE per server requirement
    'Accept': 'application/json, text/event-stream',
  });

  const body = JSON.stringify({ jsonrpc: '2.0', id: requestId, method: 'ping', params: {} });

  const res = await fetch(MCP_URL, { method: 'POST', headers, body });
  const ct = res.headers.get('content-type') || '';

  // Handle SSE or JSON
  if (ct.includes('text/event-stream')) {
    const text = await res.text();
    // Expect lines like: "event: message" and "data: {json}"
    const match = text.match(/^data:\s*(\{[\s\S]*?\})/m);
    if (!match) throw new Error('Unexpected SSE format from MCP');
    const payload = JSON.parse(match[1]);
    return payload;
  } else {
    const payload = await res.json().catch(async () => ({ raw: await res.text() }));
    return payload;
  }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return ResponseHandler.corsOptions();

  const requestId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.toLowerCase();

    // Basic auth guard if desired later (keeping default JWT verify via config.toml)

    if (req.method === 'GET' && pathname.endsWith('/health')) {
      const result = await pingMcp(requestId);
      return ResponseHandler.success({ connected: true, result }, undefined, { requestId, mcpUrl: MCP_URL });
    }

    if (req.method === 'POST' && pathname.endsWith('/call')) {
      const apiKey = Deno.env.get('CONTEXT7_API_KEY');
      if (!apiKey) throw new Error('Missing CONTEXT7_API_KEY secret');

      const { method = 'ping', params = {} } = await req.json().catch(() => ({}));

      const headers = new Headers({
        'CONTEXT7_API_KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      });

      const body = JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params });
      const res = await fetch(MCP_URL, { method: 'POST', headers, body });
      const ct = res.headers.get('content-type') || '';

      if (ct.includes('text/event-stream')) {
        const text = await res.text();
        const match = text.match(/^data:\s*(\{[\s\S]*?\})/m);
        if (!match) throw new Error('Unexpected SSE format from MCP');
        const payload = JSON.parse(match[1]);
        return new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: CORS_HEADERS });
      } else {
        const payload = await res.json().catch(async () => ({ raw: await res.text() }));
        return new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: CORS_HEADERS });
      }
    }

    // Default route info
    return ResponseHandler.success({
      info: 'Context7 MCP function',
      endpoints: ['GET /health', 'POST /call { method, params }'],
      mcpUrl: MCP_URL,
    });
  } catch (err: any) {
    return ResponseHandler.handleError(err, { requestId: requestId, mcpUrl: MCP_URL });
  }
});

