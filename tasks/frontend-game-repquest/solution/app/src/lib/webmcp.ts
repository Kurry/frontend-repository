// WebMCP surface for the RepQuest oracle.
//
// Every tool drives the SAME DOM controls a human uses: it clicks the real tab
// buttons, sets the real rep-count input and clicks the real "Log reps"
// button, clicks the real gear-shop Equip/Unlock buttons, clicks the real
// challenge-run Start/Pause/Resume/End controls, and drives the real guarded
// Reset Quest confirmation modal. It never fabricates a success state the UI
// would not otherwise reach. Exposed on window as webmcp_session_info /
// webmcp_list_tools / webmcp_invoke_tool per contract zto-webmcp-v1.

const CONTRACT_VERSION = "zto-webmcp-v1";

type Args = Record<string, unknown>;
type Result = Record<string, unknown>;

// Svelte flushes a $state-triggered re-render on a microtask/animation-frame
// boundary, not synchronously inside the click handler. Tools that switch
// tabs (or game mode) before touching tab-local controls await one frame so
// the real DOM has settled before they query it.
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

function setNumberInput(input: HTMLInputElement, value: number): void {
  const proto = Object.getPrototypeOf(input);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(input, String(value));
  else input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureQuestMode(): void {
  const questModeBtn = q<HTMLButtonElement>('[aria-pressed][onclick], button[aria-pressed]');
  const buttons = qAll<HTMLButtonElement>("button[aria-pressed]");
  const quest = buttons.find((b) => b.textContent?.trim() === "Quest mode");
  if (quest && quest.getAttribute("aria-pressed") !== "true") quest.click();
  void questModeBtn;
}

function ensureChallengeMode(): void {
  const buttons = qAll<HTMLButtonElement>("button[aria-pressed]");
  const challenge = buttons.find((b) => b.textContent?.trim() === "Challenge mode");
  if (challenge && challenge.getAttribute("aria-pressed") !== "true") challenge.click();
}

// ---- browse-query-v1 -------------------------------------------------------

async function browseOpen(args: Args): Promise<Result> {
  const destination = String(args.destination ?? "");
  if (!DESTINATIONS.includes(destination as Destination)) {
    return { ok: false, error: `unknown destination: ${destination}` };
  }
  if (!clickTab(destination)) return { ok: false, error: `tab not found: ${destination}` };
  await nextFrame();
  return { ok: true, destination, activeTab: activeTabId() };
}

// ---- entity-collection-v1 (rep sets + gear) --------------------------------

async function entityCreate(args: Args): Promise<Result> {
  const reps = Number(args.reps);
  if (!Number.isInteger(reps) || reps <= 0) {
    return { ok: false, error: "reps must be a positive whole number" };
  }
  clickTab("quest");
  await nextFrame();
  ensureQuestMode();
  await nextFrame();
  const input = q<HTMLInputElement>("#rep-input");
  const button = q<HTMLButtonElement>('[data-action="log-reps"]');
  if (!input || !button) return { ok: false, error: "log reps control not found" };
  setNumberInput(input, reps);
  button.click();
  return { ok: true, operation: "create", reps };
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
  button.click();
  return { ok: true, operation: "delete", setId };
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
  return { ok: true, operation: "select", gearId };
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
  return { ok: true, operation: "toggle", gearId, unlocked: true };
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
  return { ok: true, operation: "start" };
}

async function sessionPause(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-pause"]');
  if (!button) return { ok: false, error: "challenge pause control not found" };
  if (button.disabled) return { ok: false, error: "no active challenge run to pause" };
  button.click();
  return { ok: true, operation: "pause" };
}

async function sessionResume(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-resume"]');
  if (!button) return { ok: false, error: "challenge resume control not found" };
  if (button.disabled) return { ok: false, error: "no paused challenge run to resume" };
  button.click();
  return { ok: true, operation: "resume" };
}

async function sessionStop(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="challenge-end"]');
  if (!button) return { ok: false, error: "challenge end control not found" };
  if (button.disabled) return { ok: false, error: "no challenge run to end" };
  button.click();
  return { ok: true, operation: "stop" };
}

// Guarded terminal transition: Reset Quest wipes all lifetime progress. Drives
// the same two-step confirmation modal a user sees; confirm=true is required
// to actually complete the reset (mirrors the entity-delete confirm gate).
async function sessionRestart(args: Args): Promise<Result> {
  const confirm = args.confirm === true;
  clickTab("settings");
  await nextFrame();
  const openBtn = q<HTMLButtonElement>('[data-action="reset-quest"]');
  if (!openBtn) return { ok: false, error: "reset quest control not found" };
  openBtn.click();
  await nextFrame();
  if (!confirm) {
    const cancelBtn = q<HTMLButtonElement>('[data-action="cancel-reset"]');
    cancelBtn?.click();
    return { ok: false, error: "restart requires confirm=true", opened: true, cancelled: true };
  }
  const confirmBtn = q<HTMLButtonElement>('[data-action="confirm-reset"]');
  if (!confirmBtn) return { ok: false, error: "reset confirmation control not found" };
  confirmBtn.click();
  return { ok: true, operation: "restart" };
}

// Advanced-interaction "Apply Scenario Change" action, part of the branching
// history mandate alongside the (Playwright-only) Undo/Redo panel.
async function sessionTriggerDemo(_args: Args): Promise<Result> {
  clickTab("quest");
  await nextFrame();
  const button = q<HTMLButtonElement>('[data-action="apply-scenario-change"]');
  if (!button) return { ok: false, error: "apply scenario change control not found" };
  button.click();
  return { ok: true, operation: "trigger_demo" };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Args) => Result | Promise<Result>;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "browse-open",
    description: "Switch the main tab (args.destination: quest|history|gear|settings) via the real tab button.",
    handler: browseOpen,
  },
  {
    name: "entity-create",
    description: "Log a rep set in quest mode (args.reps: positive whole number) via the real Log reps control.",
    handler: entityCreate,
  },
  {
    name: "entity-delete",
    description: "Delete a rep-history entry (args.setId, args.confirm must be true) via the real History Delete control.",
    handler: entityDelete,
  },
  {
    name: "entity-select",
    description: "Equip an unlocked gear outfit (args.gearId) via the real Gear Shop Equip control.",
    handler: entitySelect,
  },
  {
    name: "entity-toggle",
    description: "Unlock a locked gear outfit by spending quest points (args.gearId) via the real Gear Shop Unlock control.",
    handler: entityToggle,
  },
  {
    name: "session-start",
    description: "Start a boss-challenge run via the real Start run control (switches to Challenge mode first).",
    handler: sessionStart,
  },
  {
    name: "session-pause",
    description: "Pause the active boss-challenge run via the real Pause control.",
    handler: sessionPause,
  },
  {
    name: "session-resume",
    description: "Resume a paused boss-challenge run via the real Resume control.",
    handler: sessionResume,
  },
  {
    name: "session-stop",
    description: "End the current boss-challenge run via the real End run control.",
    handler: sessionStop,
  },
  {
    name: "session-restart",
    description:
      "Guarded terminal transition: reset the whole quest (lifetime reps, streak, quest points, zones, gear, history). Requires args.confirm=true or it opens the modal and cancels.",
    handler: sessionRestart,
  },
  {
    name: "session-trigger_demo",
    description: "Apply a scenario change via the real 'Apply scenario change' control (branching history mandate).",
    handler: sessionTriggerDemo,
  },
];

export function initWebMcp(): void {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "entity-collection-v1", "command-session-v1"],
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
