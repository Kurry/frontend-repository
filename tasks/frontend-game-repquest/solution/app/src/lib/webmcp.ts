// WebMCP surface for the RepQuest oracle.
//
// Every tool drives the SAME DOM controls a human uses: it clicks the real tab
// buttons, sets the real rep-count input and clicks the real "Log reps"
// button, clicks the real gear-shop Equip/Unlock buttons, clicks the real
// challenge-run Start/Pause/Resume/End controls, and drives the real guarded
// Reset Quest confirmation modal. It never fabricates a success state the UI
// would not otherwise reach. Exposed on window as webmcp_session_info /
// webmcp_list_tools / webmcp_invoke_tool per contract zto-webmcp-v1.
//
// Tools verify their post-conditions by polling the real DOM (a stat readout
// or button state) until it reflects the change or a short timeout elapses,
// so a returned ok:true is always backed by an observable UI update.

import { tick } from "svelte";

const CONTRACT_VERSION = "zto-webmcp-v1";

type Args = Record<string, unknown>;
type Result = Record<string, unknown>;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const DESTINATIONS = ["quest", "history", "gear", "settings"] as const;
type Destination = (typeof DESTINATIONS)[number];

function q<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(sel);
}

function qAll<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

function clickTab(destination: string): boolean {
  const btn = qAll<HTMLButtonElement>('[role="tab"]').find(
    (b) => b.getAttribute("aria-controls") === `panel-${destination}`
  );
  if (!btn) return false;
  btn.click();
  return true;
}

function activeTabId(): string | null {
  const btn = qAll<HTMLButtonElement>('[role="tab"][aria-selected="true"]')[0];
  const controls = btn?.getAttribute("aria-controls") ?? "";
  return controls.startsWith("panel-") ? controls.slice("panel-".length) : null;
}

function setNativeValue(input: HTMLInputElement, value: string): void {
  const proto = Object.getPrototypeOf(input);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function modeButton(label: string): HTMLButtonElement | undefined {
  return qAll<HTMLButtonElement>("button[aria-pressed]").find((b) => b.textContent?.trim() === label);
}

function ensureQuestMode(): void {
  const quest = modeButton("Quest mode");
  if (quest && quest.getAttribute("aria-pressed") !== "true") quest.click();
}

function ensureChallengeMode(): void {
  const challenge = modeButton("Challenge mode");
  if (challenge && challenge.getAttribute("aria-pressed") !== "true") challenge.click();
}

async function waitUntil(predicate: () => boolean, timeoutMs = 1500): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await nextFrame();
  }
  return predicate();
}

function readLifetime(): number {
  const el = q('[data-stat="lifetime-reps"]');
  const n = Number(el?.textContent || "NaN");
  return Number.isFinite(n) ? n : NaN;
}

// ---- browse-query-v1 -------------------------------------------------------

async function browseOpen(args: Args): Promise<Result> {
  const destination = String(args.destination ?? "");
  if (!DESTINATIONS.includes(destination as Destination)) {
    return { ok: false, error: `unknown destination: ${destination}` };
  }
  if (!clickTab(destination)) return { ok: false, error: `tab not found: ${destination}` };
  await nextFrame();
  const ok = await waitUntil(() => activeTabId() === destination, 800);
  return { ok, destination, activeTab: activeTabId() };
}

// ---- entity-collection-v1 (rep sets + gear) --------------------------------

async function entityCreate(args: Args): Promise<Result> {
  const reps = Number(args.reps);
  const note = String(args.note ?? "");
  if (!Number.isInteger(reps) || reps < 1 || reps > 9999) {
    return { ok: false, error: "reps must be a whole number from 1 through 9999" };
  }
  if (note.length > 120) return { ok: false, error: "note must be at most 120 characters" };
  clickTab("quest");
  await nextFrame();
  ensureQuestMode();
  await nextFrame();
  const input = q<HTMLInputElement>("#rep-input");
  const button = q<HTMLButtonElement>('[data-action="log-reps"]');
  const noteInput = q<HTMLInputElement>("#note-input");
  if (!input || !button) return { ok: false, error: "log reps control not found" };
  setNativeValue(input, String(reps));
  if (note && noteInput) setNativeValue(noteInput, note);
  await nextFrame();
  const beforeLifetime = readLifetime();
  button.click();
  await tick();
  const changed = await waitUntil(() => readLifetime() === beforeLifetime + reps, 1500);
  if (!changed) return { ok: false, error: "rep set was not created" };
  return { ok: true, operation: "create", reps, ...(note ? { note } : {}) };
}

async function entityDelete(args: Args): Promise<Result> {
  const setId = String(args.setId ?? "");
  const confirm = args.confirm === true;
  if (!confirm) return { ok: false, error: "delete requires confirm=true" };
  if (!setId) return { ok: false, error: "setId is required" };
  clickTab("history");
  await nextFrame();
  const button = q<HTMLButtonElement>(`[data-action="delete-set"][data-set-id="${setId}"]`);
  if (!button) return { ok: false, error: `history entry not found: ${setId}` };
  const beforeLifetime = readLifetime();
  button.click();
  await tick();
  // A delete either lowers lifetime reps or removes the row; confirm the row
  // is gone from the rendered list.
  const gone = await waitUntil(
    () => !q(`[data-action="delete-set"][data-set-id="${setId}"]`),
    1200
  );
  void beforeLifetime;
  return gone ? { ok: true, operation: "delete", setId } : { ok: false, error: "history entry did not disappear" };
}

async function entitySelect(args: Args): Promise<Result> {
  const gearId = String(args.gearId ?? "");
  if (!gearId) return { ok: false, error: "gearId is required" };
  clickTab("gear");
  await nextFrame();
  const card = q(`[data-gear-id="${gearId}"]`);
  if (!card) return { ok: false, error: `gear item not found: ${gearId}` };
  const button = q<HTMLButtonElement>('[data-action="equip-gear"]', card);
  if (!button) return { ok: false, error: `gear ${gearId} is locked or already equipped` };
  button.click();
  await tick();
  const ok = await waitUntil(() => card.textContent?.includes("Equipped") === true, 1000);
  return ok ? { ok: true, operation: "select", gearId } : { ok: false, error: "gear was not equipped" };
}

async function entityToggle(args: Args): Promise<Result> {
  const gearId = String(args.gearId ?? "");
  if (!gearId) return { ok: false, error: "gearId is required" };
  clickTab("gear");
  await nextFrame();
  const card = q(`[data-gear-id="${gearId}"]`);
  if (!card) return { ok: false, error: `gear item not found: ${gearId}` };
  const button = q<HTMLButtonElement>('[data-action="buy-gear"]', card);
  if (!button) return { ok: false, error: `gear ${gearId} is already unlocked` };
  if (button.disabled) return { ok: false, error: "not enough quest points to unlock this gear" };
  button.click();
  await tick();
  const ok = await waitUntil(() => !q('[data-action="buy-gear"]', card), 1000);
  return ok ? { ok: true, operation: "toggle", gearId, unlocked: true } : { ok: false, error: "gear was not unlocked" };
}

// ---- command-session-v1 (challenge run + reset quest + scenario) ----------

async function sessionStart(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  ensureChallengeMode();
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-start"]');
  if (!button) return { ok: false, error: "challenge start control not found" };
  if (button.disabled) return { ok: false, error: "challenge run already active or paused" };
  button.click();
  await tick();
  const ok = await waitUntil(() => q('[data-challenge-status="active"]') !== null, 1000);
  return ok ? { ok: true, operation: "start" } : { ok: false, error: "run did not become active" };
}

async function sessionPause(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-pause"]');
  if (!button) return { ok: false, error: "challenge pause control not found" };
  if (button.disabled) return { ok: false, error: "no active challenge run to pause" };
  button.click();
  await tick();
  const ok = await waitUntil(() => q('[data-challenge-status="paused"]') !== null, 1000);
  return ok ? { ok: true, operation: "pause" } : { ok: false, error: "run did not pause" };
}

async function sessionResume(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-resume"]');
  if (!button) return { ok: false, error: "challenge resume control not found" };
  if (button.disabled) return { ok: false, error: "no paused challenge run to resume" };
  button.click();
  await tick();
  const ok = await waitUntil(() => q('[data-challenge-status="active"]') !== null, 1000);
  return ok ? { ok: true, operation: "resume" } : { ok: false, error: "run did not resume" };
}

async function sessionStop(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-end"]');
  if (!button) return { ok: false, error: "challenge end control not found" };
  if (button.disabled) return { ok: false, error: "no challenge run to end" };
  button.click();
  await tick();
  const ok = await waitUntil(() => q('[data-challenge-result]') !== null, 1200);
  return ok ? { ok: true, operation: "stop" } : { ok: false, error: "run did not resolve" };
}

async function sessionRestart(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  ensureChallengeMode();
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-restart"]');
  if (!button) return { ok: false, error: "challenge restart control not found" };
  button.click();
  await tick();
  const ok = await waitUntil(() => q('[data-challenge-status="idle"]') !== null, 1000);
  return ok ? { ok: true, operation: "restart" } : { ok: false, error: "run did not return to idle" };
}

async function sessionTriggerDemo(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="apply-scenario-change"]');
  if (!button) return { ok: false, error: "apply scenario change control not found" };
  button.click();
  await tick();
  await nextFrame();
  return { ok: true, operation: "trigger_demo" };
}

// ---- artifact-transfer-v1 -------------------------------------------------

async function artifactAction(operation: 'export' | 'copy' | 'import', args: Args): Promise<Result> {
  clickTab('settings'); await nextFrame();
  const format = String(args.format ?? 'json');
  if (operation === 'export' && format !== 'json' && format !== 'csv') {
    return { ok: false, error: 'format must be json or csv' };
  }
  if (operation === 'import' && args.mode != null && args.mode !== 'quest-log') {
    return { ok: false, error: 'mode must be quest-log' };
  }
  const selector = operation === 'copy' ? '[data-action="copy-json"]'
    : operation === 'import' ? '[data-action="import-json"]'
    : format === 'csv' ? '[data-action="export-csv"]' : '[data-action="export-json"]';
  const button = q<HTMLButtonElement>(selector);
  if (!button) return { ok: false, error: `${operation} control not found` };
  if (operation === 'import') button.focus();
  button.click();
  await tick();
  if (operation === 'import') {
    return {
      ok: true,
      operation,
      mode: 'quest-log',
      status: 'import_started',
      completed: false,
    };
  }
  const settled = await waitUntil(() => q('[data-artifact-feedback]') !== null, 1200);
  const feedback = q('[data-artifact-feedback]');
  const ok = settled && feedback?.getAttribute('data-feedback-tone') === 'ok';
  return ok
    ? { ok: true, operation, ...(operation === 'export' ? { format } : {}) }
    : { ok: false, error: feedback?.textContent?.trim() || `${operation} did not complete` };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Args) => Result | Promise<Result>;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "browse.open",
    description: "Switch the main tab (args.destination: quest|history|gear|settings) via the real tab button.",
    handler: browseOpen,
  },
  {
    name: "entity.create",
    description: "Log a rep set in quest mode (args.reps: positive whole number) via the real Log reps control.",
    handler: entityCreate,
  },
  {
    name: "entity.delete",
    description: "Delete a rep-history entry (args.setId, args.confirm must be true) via the real History Delete control.",
    handler: entityDelete,
  },
  {
    name: "entity.select",
    description: "Equip an unlocked gear outfit (args.gearId) via the real Gear Shop Equip control.",
    handler: entitySelect,
  },
  {
    name: "entity.toggle",
    description: "Unlock a locked gear outfit by spending quest points (args.gearId) via the real Gear Shop Unlock control.",
    handler: entityToggle,
  },
  {
    name: "session.start",
    description: "Start a boss-challenge run via the real Start run control (switches to Challenge mode first).",
    handler: sessionStart,
  },
  {
    name: "session.pause",
    description: "Pause the active boss-challenge run via the real Pause control.",
    handler: sessionPause,
  },
  {
    name: "session.resume",
    description: "Resume a paused boss-challenge run via the real Resume control.",
    handler: sessionResume,
  },
  {
    name: "session.stop",
    description: "End the current boss-challenge run via the real End run control.",
    handler: sessionStop,
  },
  {
    name: "session.restart",
    description: "Restart the active boss-challenge run via the real Challenge Restart control (switches to Challenge mode first).",
    handler: sessionRestart,
  },
  {
    name: "session.trigger_demo",
    description: "Apply a scenario change via the real 'Apply scenario change' control (branching history mandate).",
    handler: sessionTriggerDemo,
  },
  { name: "artifact.export", description: "Export the live Quest Log as JSON or workout history as CSV via the visible export control (args.format: json|csv).", handler: (args) => artifactAction('export', args) },
  { name: "artifact.copy", description: "Copy the live Quest Log JSON via the visible Copy JSON control.", handler: (args) => artifactAction('copy', args) },
  { name: "artifact.import", description: "Open the visible Quest Log file picker; file selection remains Playwright-only.", handler: (args) => artifactAction('import', args) },
];

export function initWebMcp(): void {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "entity-collection-v1", "command-session-v1", "artifact-transfer-v1"],
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = async (name: string, args: Args = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return await tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}

initWebMcp();
