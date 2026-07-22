#!/usr/bin/env node
// Runtime half of `corpuscheck oracle-ci`: serve/browser smoke, in-page WebMCP
// probes, and the no-secrets judge MCP boot check. Python owns static/build and
// TOML parsing so this file can stay dependency-light and use the repo pin.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import readline from 'node:readline';
import { observePageFailures, resolvePlaywright, waitForServer } from './browser_smoke_shared.mjs';
import {
  analyzeAutonomousSnapshots,
  causalMutationPaths,
  changedPaths,
  isErrorResult,
} from './oracle_ci_semantics.mjs';
import { runE2eSuite } from './oracle_ci_e2e.mjs';
import { isReadOnly, runReadProbe, toolSchema, valueForSchema } from './oracle_ci_probe.mjs';

const { chromium } = resolvePlaywright();
const APP_URL = 'http://127.0.0.1:3000';
const PRIMARY_CDP = 'http://127.0.0.1:9222';
const RM_CDP = 'http://127.0.0.1:9223';
const POINTER_FLAGS =
  '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4';

class StageError extends Error {
  constructor(stage, message) {
    super(message);
    this.stage = stage;
  }
}

function stagePass(config, stage, detail = '') {
  console.log(`ORACLE_CI_STAGE ${config.slug} [${stage}]: PASS${detail ? ` (${detail})` : ''}`);
}

function tail(text, limit = 3000) {
  return text.length > limit ? text.slice(-limit) : text;
}

function processLog(proc) {
  let output = '';
  for (const stream of [proc.stdout, proc.stderr]) {
    stream?.on('data', (chunk) => {
      output = tail(output + chunk.toString(), 12000);
    });
  }
  return () => output.trim();
}

function stopProcess(proc) {
  if (!proc || proc.exitCode !== null) return;
  try {
    process.kill(-proc.pid, 'SIGTERM');
  } catch {
    try { proc.kill('SIGTERM'); } catch { /* already gone */ }
  }
}

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
    ...options,
  });
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function portIsFree(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(true));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(true);
    });
  });
}

async function requireFreePort(port, stage) {
  if (!(await portIsFree(port))) {
    throw new StageError(stage, `port ${port} is already in use`);
  }
}

async function waitForHttp(url, timeoutMs, proc, readLog) {
  const ready = await waitForServer(
    url,
    timeoutMs,
    () => Boolean(proc && proc.exitCode !== null),
  );
  if (ready) return;
  if (proc && proc.exitCode !== null) {
    throw new Error(`process exited ${proc.exitCode}${readLog() ? `: ${readLog()}` : ''}`);
  }
  throw new Error(`timed out waiting for ${url}${readLog?.() ? `: ${readLog()}` : ''}`);
}

function startApp(config) {
  const proc = spawnProcess('npm', ['start'], {
    cwd: config.appDir,
    env: { ...process.env, PORT: '3000' },
  });
  return { proc, readLog: processLog(proc) };
}

async function waitForWebMcp(page) {
  await page.waitForFunction(() =>
    typeof window.webmcp_session_info === 'function' &&
    typeof window.webmcp_list_tools === 'function' &&
    typeof window.webmcp_invoke_tool === 'function',
  null, { timeout: 15000 });
}

function normalizeTools(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.tools)) return raw.tools;
  return [];
}

const MODULE_PREFIX = {
  'browse-query-v1': 'browse',
  'entity-collection-v1': 'entity',
  'form-workflow-v1': 'form',
  'structured-editor-v1': 'editor',
  'command-session-v1': 'session',
  'artifact-transfer-v1': 'artifact',
};

function descriptorModule(tool) {
  if (typeof tool.module === 'string') return tool.module;
  if (typeof tool.moduleId === 'string') return tool.moduleId;
  const name = String(tool.name || '');
  return Object.entries(MODULE_PREFIX).find(([, prefix]) =>
    name.startsWith(`${prefix}.`) || name.startsWith(`${prefix}_`))?.[0];
}

async function invokeTool(page, name, args) {
  return page.evaluate(async ([toolName, toolArgs]) => {
    return await window.webmcp_invoke_tool(toolName, toolArgs);
  }, [name, args]);
}

async function semanticSnapshot(page) {
  return page.evaluate(() => {
    const serialize = (element) => {
      const attributes = {};
      for (const attribute of element.attributes) {
        if (
          attribute.name === 'id' || attribute.name === 'name' ||
          attribute.name === 'type' || attribute.name === 'role' ||
          attribute.name === 'class' || attribute.name === 'style' ||
          attribute.name.startsWith('aria-') || attribute.name.startsWith('data-')
        ) {
          attributes[attribute.name] = attribute.value;
        }
      }
      const state = {
        hidden: Boolean(element.hidden),
        open: element.hasAttribute('open'),
        disabled: Boolean(element.disabled),
      };
      if ('value' in element) state.value = element.value;
      if ('checked' in element) state.checked = Boolean(element.checked);
      if ('selected' in element) state.selected = Boolean(element.selected);
      const text = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .filter(Boolean)
        .join(' ');
      return {
        tag: element.tagName.toLowerCase(),
        attributes,
        state,
        text,
        children: [...element.children].map(serialize),
      };
    };
    return {
      href: location.href,
      title: document.title,
      theme: document.documentElement.getAttribute('data-theme'),
      body: document.body ? serialize(document.body) : null,
    };
  });
}

async function settleSemanticSnapshot(page, waitMs = 400) {
  await page.waitForTimeout(waitMs);
  return semanticSnapshot(page);
}

async function sampleAutonomousSemantics(page, samples = 5) {
  const snapshots = [await semanticSnapshot(page)];
  for (let index = 0; index < samples; index += 1) {
    snapshots.push(await settleSemanticSnapshot(page));
  }
  return analyzeAutonomousSnapshots(snapshots);
}

function mutationPriority(tool) {
  const name = String(tool.name || '');
  const order = [
    /set_theme/, /set-theme/, /set_locale/, /browse[._]open/, /switch_mode/,
    /editor[._]preview/, /artifact[._]export/, /session[._](start|restart|advance)/,
    /clear_filter/, /apply_filter/, /form[._](reset|cancel|advance|return|submit)/,
    /entity[._](toggle|create|update|delete|reorder|quantity)/,
  ];
  const index = order.findIndex((pattern) => pattern.test(name));
  return index === -1 ? 100 : index;
}

async function browserAndWebMcp(config) {
  await requireFreePort(3000, 'serve-browser');
  const app = startApp(config);
  let browser;
  try {
    try {
      await waitForHttp(APP_URL, 240000, app.proc, app.readLog);
    } catch (error) {
      throw new StageError('serve-browser', `npm start failed: ${error.message}`);
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const failures = { consoleErrors: [], pageErrors: [] };
    observePageFailures(page, failures);
    try {
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(750);
    } catch (error) {
      throw new StageError('serve-browser', `browser navigation failed: ${error.message}`);
    }
    const html = await page.locator('body').innerHTML();
    if (!html.trim()) throw new StageError('serve-browser', 'page rendered empty body HTML');
    if (failures.consoleErrors.length || failures.pageErrors.length) {
      throw new StageError(
        'serve-browser',
        `browser errors: console=${JSON.stringify(failures.consoleErrors)} page=${JSON.stringify(failures.pageErrors)}`,
      );
    }
    stagePass(config, 'serve-browser', 'non-empty page; zero console/page errors');

    try {
      await waitForWebMcp(page);
    } catch (error) {
      throw new StageError('webmcp', `required window.webmcp_* surface is not live: ${error.message}`);
    }
    const [sessionInfo, rawTools] = await page.evaluate(async () => [
      await window.webmcp_session_info(),
      await window.webmcp_list_tools(),
    ]);
    const tools = normalizeTools(rawTools);
    if (!tools.length || tools.some((tool) => !tool || typeof tool.name !== 'string')) {
      throw new StageError('webmcp', 'webmcp_list_tools returned no valid tool descriptors');
    }

    const assignments = JSON.parse(fs.readFileSync(config.assignmentsPath, 'utf8'));
    const assignment = assignments.assignments?.find((item) => item.task === config.slug);
    if (!assignment) throw new StageError('webmcp', 'task has no WebMCP assignment');
    const sessionModules = sessionInfo?.modules || sessionInfo?.module_catalog || [];
    const missingSession = assignment.modules.filter((module) => !sessionModules.includes(module));
    const covered = new Set(tools.map(descriptorModule).filter(Boolean));
    const missingTools = assignment.modules.filter((module) => !covered.has(module));
    if (missingSession.length || missingTools.length) {
      throw new StageError(
        'webmcp',
        `assigned module coverage incomplete: session=[${missingSession.join(', ')}] tools=[${missingTools.join(', ')}]`,
      );
    }

    const read = await runReadProbe(tools, (name, args) => invokeTool(page, name, args));
    if (!read.readProbe) {
      throw new StageError('webmcp', `no read-only app tool round-tripped (${read.failures.join('; ') || 'none declared'})`);
    }
    if (read.warning) {
      console.log(`ORACLE_CI_STAGE ${config.slug} [webmcp]: WARNING ${read.warning}`);
    }
    const readProbe = read.readProbe;

    const mutationCandidates = tools
      .filter((tool) => !isReadOnly(tool))
      .map((tool) => ({ tool, args: valueForSchema(toolSchema(tool)) }))
      .filter(({ args }) => args !== undefined)
      .sort((left, right) => mutationPriority(left.tool) - mutationPriority(right.tool));
    let mutationProbe = null;
    const mutationFailures = [];
    for (const candidate of mutationCandidates) {
      try {
        // Establish which semantic paths change without an invocation, then
        // invoke the tool on that same loaded page. The final control sample is
        // the mutation probe's before-state, so child-index paths cannot drift
        // across reloads and impersonate a tool-caused change.
        await page.reload({ waitUntil: 'networkidle' });
        await waitForWebMcp(page);
        await page.waitForTimeout(500);
        const { autonomousPaths, before } = await sampleAutonomousSemantics(page);
        const result = await invokeTool(page, candidate.tool.name, candidate.args);
        const after = await settleSemanticSnapshot(page);
        const causalPaths = causalMutationPaths(before, after, autonomousPaths);
        if (!isErrorResult(result) && causalPaths.length) {
          mutationProbe = candidate.tool.name;
          break;
        }
        const semanticChanged = changedPaths(before, after).length > 0;
        mutationFailures.push(
          `${candidate.tool.name}: ${isErrorResult(result) ? 'error result' : semanticChanged ? 'only autonomous semantic paths changed' : 'semantic DOM unchanged'}`,
        );
      } catch (error) {
        mutationFailures.push(`${candidate.tool.name}: ${error.message}`);
      }
    }
    if (!mutationProbe) {
      throw new StageError(
        'webmcp',
        `no state-mutating app tool returned readable state and visibly changed the DOM (${mutationFailures.join('; ') || 'none invokable'})`,
      );
    }
    stagePass(
      config,
      'webmcp',
      `${tools.length} tools; read=${readProbe}; mutate=${mutationProbe}; assigned modules covered`,
    );
    await browser.close();
    browser = null;
    if (config.runE2e === false) {
      console.log(
        `ORACLE_CI_STAGE ${config.slug} [e2e]: SKIP (delegated to Playwright Tests workflow)`,
      );
    } else {
      await e2eStage(config);
    }
    await judgeSetup(config);
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopProcess(app.proc);
  }
}

// Runs the task's canonical Playwright suite (solution/app/e2e.spec.mjs)
// against the same `npm start` server the serve-browser/webmcp stages used —
// the app process is still alive here, so no second server is started.
async function e2eStage(config) {
  const result = await runE2eSuite({
    slug: config.slug,
    appDir: config.appDir,
    runtimeDir: config.runtimeDir,
  });
  if (result.status === 'skip') {
    console.log(
      `ORACLE_CI_STAGE ${config.slug} [e2e]: SKIP (no e2e.spec.mjs and no e2e/*.spec.*; coverage arrives progressively)`,
    );
    return;
  }
  if (result.status === 'fail') throw new StageError('e2e', result.message);
  if (result.warning) {
    console.log(`ORACLE_CI_STAGE ${config.slug} [e2e]: WARNING ${result.warning}`);
  }
  stagePass(config, 'e2e', result.detail);
}

function startChrome(config, port, reducedMotion) {
  const profile = path.join(config.runtimeDir, reducedMotion ? 'chrome-rm-profile' : 'chrome-profile');
  const logPath = path.join(config.runtimeDir, reducedMotion ? 'chrome-rm.log' : 'chrome.log');
  const out = fs.openSync(logPath, 'a');
  const args = [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    ...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
    POINTER_FLAGS,
    '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, 'about:blank',
  ];
  return spawn(chromium.executablePath(), args, {
    detached: process.platform !== 'win32',
    stdio: ['ignore', out, out],
  });
}

class McpClient {
  constructor(server, config) {
    this.server = server;
    this.nextId = 1;
    this.pending = new Map();
    this.proc = spawnProcess(server.command, server.args, {
      cwd: config.repoRoot,
      env: {
        ...process.env,
        WEBMCP_CDP_ENDPOINT: PRIMARY_CDP,
        WEBMCP_CDP_PORT: '9222',
        WEBMCP_RM_CDP_ENDPOINT: RM_CDP,
        WEBMCP_RM_CDP_PORT: '9223',
      },
    });
    this.readLog = processLog(this.proc);
    const lines = readline.createInterface({ input: this.proc.stdout });
    lines.on('line', (line) => this.onLine(line));
    this.proc.once('exit', (code) => {
      for (const { reject } of this.pending.values()) {
        reject(new Error(`${server.name} exited ${code}: ${this.readLog()}`));
      }
      this.pending.clear();
    });
  }

  onLine(line) {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    clearTimeout(pending.timeout);
    if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
    else pending.resolve(message.result);
  }

  request(method, params = {}, timeoutMs = 45000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.server.name} timed out on ${method}: ${this.readLog()}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }

  notify(method, params = {}) {
    this.proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
  }

  async initialize() {
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'corpuscheck-oracle-ci', version: '1.0.0' },
    });
    this.notify('notifications/initialized');
    return this.request('tools/list');
  }

  close() {
    stopProcess(this.proc);
  }
}

function contentText(result) {
  return (result?.content || []).map((item) => item?.text || '').join('\n');
}

async function judgeSetup(config) {
  await requireFreePort(9222, 'judge-setup');
  await requireFreePort(9223, 'judge-setup');
  fs.mkdirSync(path.join(config.runtimeDir, 'logs'), { recursive: true });
  const primary = startChrome(config, 9222, false);
  const reduced = startChrome(config, 9223, true);
  const clients = [];
  let cdpBrowser;
  try {
    try {
      await Promise.all([
        waitForHttp(`${PRIMARY_CDP}/json/version`, 30000, primary, () => ''),
        waitForHttp(`${RM_CDP}/json/version`, 30000, reduced, () => ''),
      ]);
      cdpBrowser = await chromium.connectOverCDP(PRIMARY_CDP);
      const context = cdpBrowser.contexts()[0];
      const page = context.pages()[0] || await context.newPage();
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await waitForWebMcp(page);
    } catch (error) {
      throw new StageError('judge-setup', `CDP browser boot/connect failed: ${error.message}`);
    }

    const seen = new Set();
    for (const server of config.servers) {
      const client = new McpClient(server, config);
      clients.push(client);
      let listing;
      try {
        listing = await client.initialize();
      } catch (error) {
        throw new StageError('judge-setup', `${server.name} failed to initialize: ${error.message}`);
      }
      const tools = listing?.tools || [];
      if (!tools.length) throw new StageError('judge-setup', `${server.name} exposed an empty tool list`);
      seen.add(server.name);

      if (server.name === 'webmcp') {
        const result = await client.request('tools/call', {
          name: 'webmcp_session_info', arguments: {},
        });
        if (result?.isError) {
          throw new StageError('judge-setup', `webmcp bridge could not reach the primary CDP page: ${contentText(result)}`);
        }
      }
      if (server.name === 'playwright') {
        const result = await client.request('tools/call', {
          name: 'browser_navigate', arguments: { url: APP_URL },
        });
        if (result?.isError) {
          throw new StageError('judge-setup', `playwright could not navigate through primary CDP: ${contentText(result)}`);
        }
      }
      if (server.name === 'playwright_reduced_motion') {
        const navigation = await client.request('tools/call', {
          name: 'browser_navigate', arguments: { url: APP_URL },
        });
        if (navigation?.isError) {
          throw new StageError('judge-setup', `reduced-motion Playwright could not navigate: ${contentText(navigation)}`);
        }
        const evaluation = await client.request('tools/call', {
          name: 'browser_evaluate',
          arguments: { function: "() => window.matchMedia('(prefers-reduced-motion: reduce)').matches" },
        });
        if (evaluation?.isError || !/\btrue\b/i.test(contentText(evaluation))) {
          throw new StageError(
            'judge-setup',
            `reduced-motion MCP did not report prefers-reduced-motion: reduce = true: ${contentText(evaluation)}`,
          );
        }
      }
    }
    const required = ['webmcp', 'playwright', 'playwright_reduced_motion'];
    const missing = required.filter((name) => !seen.has(name));
    if (missing.length) {
      throw new StageError('judge-setup', `dimension TOMLs omit required MCP server(s): ${missing.join(', ')}`);
    }
    stagePass(config, 'judge-setup', `${config.servers.length} unique servers; both CDP browsers live; reduced motion true`);
  } finally {
    for (const client of clients) client.close();
    if (cdpBrowser) await cdpBrowser.close().catch(() => {});
    stopProcess(primary);
    stopProcess(reduced);
  }
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) throw new StageError('serve-browser', 'missing runtime config path');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  await browserAndWebMcp(config);
}

try {
  await main();
} catch (error) {
  const failure = {
    stage: error instanceof StageError ? error.stage : 'serve-browser',
    message: tail(error?.stack || String(error), 6000),
  };
  console.log(`ORACLE_CI_FAILURE ${JSON.stringify(failure)}`);
  process.exitCode = 1;
}
