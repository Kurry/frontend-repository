// WebMCP surface for the FandangoFury oracle.
//
// Every tool invokes the SAME store/navigation commands the visible Svelte
// controls call — game.startStage (stage node click / Try again), the screen
// transitions App.svelte's state machine drives from real buttons, and
// game.equipMask (the Masks screen Equip/Unequip buttons) — so a tool can never
// reach a success path the UI lacks.
//
// KEPT OUT of WebMCP on purpose (they stay Playwright-driven through the real
// controls, per command-session-v1's timing/animation/repeated-input
// restrictions): every combat mechanic (light/heavy attack, Fiesta Combo chain,
// block, dodge cooldown, Fury meter fill, Fiesta Fury, boss telegraph, health
// depletion), the Cantina upgrade purchase (escalating-cost economy), the
// Undo/Redo/branch-selection History panel, and the confirmation-guarded Reset
// progress control.
//
// Exposed on window as webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

import { game, gameState, STAGES, MASK_DEFS } from './game-store.svelte.ts';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['command-session-v1', 'browse-query-v1', 'entity-collection-v1'];

const DESTINATIONS = ['stage-map', 'masks', 'cantina'] as const;

type Result = Record<string, unknown>;

// The navigation bridge is the exact set of screen transitions App.svelte wires
// to its visible controls; WebMCP calls these same handlers so there is no
// navigation path a user could not reach by clicking.
export interface NavBridge {
  currentScreen: () => string;
  startStage: (stageId: number) => void; // stage node click
  restartStage: () => void; // Defeat "Try again"
  continueFromVictory: () => void; // Victory "Continue"
  retreatToMap: () => void; // Combat "Retreat to map"
  openMap: () => void; // close Shop/Masks -> map
  openMasks: () => void; // "Open masks"
  openCantina: () => void; // "Open cantina"
}

let nav: NavBridge | null = null;

// ---- command-session-v1 (stage/run lifecycle) ------------------------------

function sessionStart(args: Result): Result {
  const stage = Math.trunc(Number(args.stage ?? args.stageId ?? args.id));
  if (!Number.isFinite(stage) || stage < 1 || stage > STAGES.length) {
    return { ok: false, error: `stage must be an integer from 1 to ${STAGES.length}` };
  }
  if (!gameState.unlockedStages.includes(stage)) {
    return { ok: false, error: `stage ${stage} is locked` };
  }
  nav?.startStage(stage);
  return { ok: true, operation: 'start', stage, screen: nav?.currentScreen() };
}

function sessionRestart(): Result {
  nav?.restartStage();
  return { ok: true, operation: 'restart', stage: gameState.currentStage, screen: nav?.currentScreen() };
}

function sessionAdvance(): Result {
  if (nav?.currentScreen() !== 'VICTORY') {
    return { ok: false, error: 'advance is only available from the victory screen' };
  }
  nav.continueFromVictory();
  return { ok: true, operation: 'advance', screen: nav.currentScreen() };
}

function sessionStop(): Result {
  const screen = nav?.currentScreen();
  if (screen !== 'COMBAT') {
    return { ok: false, error: 'stop (retreat to map) is only available during a combat stage' };
  }
  nav?.retreatToMap();
  return { ok: true, operation: 'stop', screen: nav?.currentScreen() };
}

// ---- browse-query-v1 (screen navigation) -----------------------------------

function browseOpen(args: Result): Result {
  const destination = String(args.destination ?? args.to ?? '');
  if (!(DESTINATIONS as readonly string[]).includes(destination)) {
    return { ok: false, error: `destination must be one of ${DESTINATIONS.join(', ')}` };
  }
  const screen = nav?.currentScreen();
  if (destination === 'stage-map') {
    nav?.openMap();
    return { ok: true, operation: 'open', destination, screen: nav?.currentScreen() };
  }
  // Masks and Cantina open from the stage map, matching the visible buttons that
  // only exist there.
  if (screen !== 'MAP') {
    return { ok: false, error: `open ${destination} is available from the stage map; go to stage-map first` };
  }
  if (destination === 'masks') nav?.openMasks();
  else nav?.openCantina();
  return { ok: true, operation: 'open', destination, screen: nav?.currentScreen() };
}

// ---- entity-collection-v1 (entity: mask) -----------------------------------

function maskView(id: string) {
  const def = MASK_DEFS.find((m) => m.id === id);
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    bonus: def.bonus,
    equipped: gameState.equippedMask === def.id,
    unlocked: gameState.ownedMasks.includes(def.id),
  };
}

function entitySelect(args: Result): Result {
  const id = String(args.id ?? args.mask ?? '');
  const view = maskView(id);
  if (!view) return { ok: false, error: `unknown mask: ${id}` };
  if (!view.unlocked) return { ok: false, error: `mask ${id} is locked; defeat its stage boss to unlock it` };
  // Same command path as the Masks screen "Equip" button.
  game.equipMask(id);
  return { ok: true, operation: 'select', id, entity: maskView(id) };
}

function entityToggle(args: Result): Result {
  const id = String(args.id ?? args.mask ?? '');
  const view = maskView(id);
  if (!view) return { ok: false, error: `unknown mask: ${id}` };
  if (!view.unlocked) return { ok: false, error: `mask ${id} is locked; defeat its stage boss to unlock it` };
  // Same command paths as the "Equip" / "Unequip" buttons.
  game.equipMask(view.equipped ? null : id);
  return { ok: true, operation: 'toggle', id, entity: maskView(id) };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Result) => Result;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: 'session-start',
    description:
      'Start (or select) a stage and enter its combat run. args.stage is an unlocked stage number (1-3). Same path as clicking a stage node on the map.',
    handler: sessionStart,
  },
  {
    name: 'session-restart',
    description: 'Restart the current stage from its first wave with full health. Same path as the Derrota "Try again" control.',
    handler: sessionRestart,
  },
  {
    name: 'session-advance',
    description: 'Advance past a cleared stage from the Victory screen back to the stage map. Same path as the Victory "Continue" control.',
    handler: sessionAdvance,
  },
  {
    name: 'session-stop',
    description: 'Retreat from the current combat stage back to the stage map. Same path as the combat "Retreat to map" control.',
    handler: sessionStop,
  },
  {
    name: 'browse-open',
    description: 'Navigate to a screen: stage-map, masks, or cantina. Masks and cantina open from the stage map. Same path as the visible navigation buttons.',
    handler: browseOpen,
  },
  {
    name: 'entity-select',
    description: 'Equip an owned mask by args.id (solar|luna|fuego). Same path as the Masks screen "Equip" button.',
    handler: entitySelect,
  },
  {
    name: 'entity-toggle',
    description: 'Toggle an owned mask equipped/unequipped by args.id (solar|luna|fuego). Same paths as the "Equip" / "Unequip" buttons.',
    handler: entityToggle,
  },
];

export function initWebMcp(bridge: NavBridge) {
  nav = bridge;
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = (name: string, args: Result = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
