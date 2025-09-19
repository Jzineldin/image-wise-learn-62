#!/usr/bin/env node
/**
 * Minimal MCP client for Context7 to run locally from this repo.
 * Usage:
 *   - Set CONTEXT7_API_KEY env var
 *   - npm run mcp:ping
 *   - Or: node scripts/context7-mcp.js call methodName '{"foo":"bar"}'
 */

const MCP_URL = process.env.CONTEXT7_MCP_URL || 'https://mcp.context7.com/mcp';
const API_KEY = process.env.CONTEXT7_API_KEY;

if (!API_KEY) {
  console.error('ERROR: CONTEXT7_API_KEY is not set.');
  process.exit(1);
}

function parseSseFirstEvent(text) {
  // Accumulate consecutive data: lines into one JSON string
  const lines = text.split(/\r?\n/);
  let dataLines = [];
  let inEvent = false;
  for (const line of lines) {
    if (line.startsWith('event:')) { inEvent = true; continue; }
    if (line.startsWith('data:')) { dataLines.push(line.replace(/^data:\s?/, '')); inEvent = true; continue; }
    if (inEvent && line.trim() === '') break; // end of first event
  }
  if (dataLines.length === 0) return null;
  return dataLines.join('\n');
}

async function callMcp(method, params = {}) {
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
    const data = parseSseFirstEvent(text);
    if (!data) throw new Error('Unexpected SSE response format: ' + text.slice(0, 200));
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('SSE data parse error. Raw event data:', data);
      throw e;
    }
  } else {
    try {
      return await res.json();
    } catch {
      return { raw: await res.text() };
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'ping';
  if (cmd === 'ping') {
    const result = await callMcp('ping', {});
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (cmd === 'call') {
    const method = args[1] || 'ping';
    let params = {};
    if (args[2]) {
      try {
        // Join all remaining args in case JSON spans multiple args
        const jsonStr = args.slice(2).join(' ');
        params = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Invalid JSON for params:', args.slice(2).join(' '));
        console.error('Parse error:', e.message);
        process.exit(2);
      }
    }
    const result = await callMcp(method, params);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.error('Usage: node scripts/context7-mcp.js [ping|call <method> <jsonParams>]');
  process.exit(64);
}

main().catch((err) => {
  console.error('MCP call failed:', err && err.message ? err.message : err);
  process.exit(1);
});

