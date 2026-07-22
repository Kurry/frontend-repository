#!/usr/bin/env node
// MCP stdio server exposing the app-under-test's in-page WebMCP surface
// (window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool, per the
// instruction's <webmcp_action_contract>).
//
// It attaches to the shared judge Chrome over CDP ($WEBMCP_CDP_ENDPOINT, started
// by tests/test.sh) via playwright-core connectOverCDP, scanning every browser
// context so it finds the SAME page the Playwright MCP is driving — the app
// keeps state client-side, so invoking tools on any other page would mutate a
// different app instance than the one being observed.
//
// Zero npm deps of its own: resolves the playwright package that test.sh
// installs globally. Speaks newline-delimited JSON-RPC 2.0 (MCP stdio framing).

import { createRequire } from 'node:module';
import readline from 'node:readline';

const requireCjs = createRequire(import.meta.url);
const GLOBAL_ROOTS = ['', '/usr/lib/node_modules/', '/usr/local/lib/node_modules/'];

function resolveGlobal(pkg) {
  for (const root of GLOBAL_ROOTS) {
    try { return requireCjs(root ? root + pkg : pkg); } catch { /* next */ }
  }
  return null;
}

const CDP_ENDPOINT = process.env.WEBMCP_CDP_ENDPOINT || 'http://127.0.0.1:9222';
const APP_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

let browser = null;

async function appPage() {
  const mod = resolveGlobal('playwright') || resolveGlobal('playwright-core');
  if (!mod) throw new Error('playwright not found (expected global install from test.sh)');
  if (!browser || !browser.isConnected()) {
    browser = await mod.chromium.connectOverCDP(CDP_ENDPOINT);
  }
  const pages = browser.contexts().flatMap((ctx) => ctx.pages());
  const matches = pages.filter((p) => APP_ORIGINS.some((o) => p.url().startsWith(o)));
  if (!matches.length) {
    throw new Error(
      'No open page at http://localhost:3000 — navigate there with the Playwright browser first, then retry.'
    );
  }
  if (matches.length === 1) return matches[0];
  // Multiple matching tabs exist (e.g. an app-launched tab plus the judge's
  // isolated Playwright tab). Tools MUST run on the tab the judge observes,
  // or state mutates an unobserved twin of the app. Prefer the visible/
  // focused document; fall back to the most recently opened match.
  const states = await Promise.all(matches.map(async (p) => {
    try { return await p.evaluate(() => document.visibilityState); }
    catch { return 'hidden'; }
  }));
  const visible = matches.filter((_, i) => states[i] === 'visible');
  const pool = visible.length ? visible : matches;
  return pool[pool.length - 1];
}

async function callSurface(fn, args) {
  const page = await appPage();
  return page.evaluate(
    ([fnName, fnArgs]) => {
      const w = window;
      const surface = {
        session_info: w.webmcp_session_info || (w.webmcp && w.webmcp.sessionInfo?.bind(w.webmcp)),
        list_tools: w.webmcp_list_tools || (w.webmcp && w.webmcp.listTools?.bind(w.webmcp)),
        invoke_tool: w.webmcp_invoke_tool || (w.webmcp && w.webmcp.invokeTool?.bind(w.webmcp)),
      };
      const target = surface[fnName];
      if (typeof target !== 'function') {
        throw new Error(`Page does not expose the WebMCP surface (window.webmcp_${fnName})`);
      }
      return fnName === 'invoke_tool' ? target(fnArgs.name, fnArgs.arguments || {}) : target();
    },
    [fn, args || {}]
  );
}

const TOOLS = [
  {
    name: 'webmcp_session_info',
    description:
      'Return the WebMCP session info the app registered (contract version, modules, tool names).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'webmcp_list_tools',
    description:
      'List the WebMCP tools the app under test registered (name, description, inputSchema).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'webmcp_invoke_tool',
    description:
      "Invoke one of the app's registered WebMCP tools on the live page and return its result. " +
      'Drives the same application logic as the visible UI.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Registered WebMCP tool name' },
        arguments: { type: 'object', description: 'Arguments per the tool inputSchema' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
];

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function replyError(id, message, code = -32000) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    reply(id, {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'webmcp', version: '2.0.0' },
    });
  } else if (method === 'tools/list') {
    reply(id, { tools: TOOLS });
  } else if (method === 'tools/call') {
    const name = params?.name;
    try {
      let out;
      if (name === 'webmcp_session_info') out = await callSurface('session_info');
      else if (name === 'webmcp_list_tools') out = await callSurface('list_tools');
      else if (name === 'webmcp_invoke_tool') out = await callSurface('invoke_tool', params?.arguments);
      else throw new Error(`Unknown tool: ${name}`);
      reply(id, { content: [{ type: 'text', text: JSON.stringify(out ?? null, null, 2) }] });
    } catch (err) {
      reply(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
    }
  } else if (method === 'ping') {
    reply(id, {});
  } else if (id !== undefined) {
    replyError(id, `Method not found: ${method}`, -32601);
  } // notifications (no id) are ignored
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try { msg = JSON.parse(trimmed); } catch { return; }
  handle(msg).catch((err) => {
    if (msg.id !== undefined) replyError(msg.id, err.message);
  });
});
rl.on('close', () => process.exit(0));
