#!/usr/bin/env tsx
/**
 * Minimal MCP client for Context7 to run locally from this repo.
 * Usage:
 *   - Set CONTEXT7_API_KEY env var
 *   - npm run mcp:ping
 *   - Or: tsx scripts/context7-mcp.ts call methodName '{"foo":"bar"}'
 */

const MCP_URL = process.env.CONTEXT7_MCP_URL || 'https://mcp.context7.com/mcp';
const API_KEY = process.env.CONTEXT7_API_KEY;

if (!API_KEY) {
  console.error('ERROR: CONTEXT7_API_KEY is not set.');
  process.exit(1);
}

type Json = Record<string, any>;

async function callMcp(method: string, params: Json = {}) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: String(Date.now()), method, params });
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'CONTEXT7_API_KEY': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body,
  });

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/event-stream')) {
    const text = await res.text();
    // Find first JSON payload in SSE stream
    const match = text.match(/^data:\s*(\{[\s\S]*?\})/m);
    if (!match) throw new Error('Unexpected SSE response format');
    return JSON.parse(match[1]);
  } else {
    try {
      return await res.json();
    } catch {
      return { raw: await res.text() };
    }
  }
}

async function main() {
  const [,, cmd = 'ping', methodArg, paramsArg] = process.argv;
  if (cmd === 'ping') {
    const result = await callMcp('ping', {});
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (cmd === 'call') {
    const method = methodArg || 'ping';
    let params: Json = {};
    if (paramsArg) {
      try { params = JSON.parse(paramsArg); } catch { console.error('Invalid JSON for params'); process.exit(2); }
    }
    const result = await callMcp(method, params);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.error('Usage: tsx scripts/context7-mcp.ts [ping|call <method> <jsonParams>]');
  process.exit(64);
}

main().catch((err) => {
  console.error('MCP call failed:', err?.message || err);
  process.exit(1);
});

