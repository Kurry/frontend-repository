// WebMCP surface for the MineClash oracle.
//
// Every tool drives the SAME store-mutation functions the visible controls call
// (initNewMatch / resetMatch for Start & Rematch, the Pause/Resume toggle, the
// New-Match reset, the difficulty selector, and the phase navigation the nav
// buttons use). No tool fakes a success path the UI could not otherwise reach,
// and NO tool reveals tiles or replays gameplay — gameplay reveals stay on the
// real board (Playwright-observed). Exposed on window as
// webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

import type { AppStore, Difficulty } from './types';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['command-session-v1', 'browse-query-v1'];

// The App component publishes this API object once mounted. Each function calls
// the identical exported gameLogic action / store mutation the on-screen button
// invokes, so a tool call and a human click follow one code path.
export interface MineClashApi {
  store: AppStore;
  startMatch: () => void;   // "Start match" / setup entry (initNewMatch)
  restartMatch: () => void; // "Rematch" (resetMatch, keeps difficulty)
  newMatch: () => void;     // "New match" reset -> setup screen
  setPaused: (v: boolean) => void; // Pause / Resume toggle
  setDifficulty: (d: Difficulty) => void; // difficulty selector (setup only)
  goto: (dest: 'game-board' | 'stats') => void; // nav (View stats / back)
}

const DESTINATIONS = ['game-board', 'stats'] as const;
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DEFAULT_DIFFICULTY: Difficulty = 'easy';

function api(): MineClashApi | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.__mineclashApi as MineClashApi) || null;
}

// ---- command-session-v1 ----------------------------------------------------

function sessionStart() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const phase = a.store.phase;
  if (phase !== 'setup' && phase !== 'match-complete') {
    return { ok: false, error: `cannot start: a match is already in phase "${phase}"` };
  }
  a.startMatch();
  return { ok: true, operation: 'start', phase: a.store.phase, roundNumber: a.store.roundNumber };
}

function sessionPause() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  if (a.store.phase !== 'playing') return { ok: false, error: 'no active round to pause' };
  if (a.store.paused) return { ok: false, error: 'already paused' };
  a.setPaused(true);
  return { ok: true, operation: 'pause', paused: a.store.paused };
}

function sessionResume() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  if (a.store.phase !== 'playing') return { ok: false, error: 'no active round to resume' };
  if (!a.store.paused) return { ok: false, error: 'not paused' };
  a.setPaused(false);
  return { ok: true, operation: 'resume', paused: a.store.paused };
}

function sessionRestart() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  a.restartMatch();
  return { ok: true, operation: 'restart', phase: a.store.phase, roundNumber: a.store.roundNumber };
}

function sessionStop() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  a.newMatch();
  return { ok: true, operation: 'stop', phase: a.store.phase };
}

// ---- browse-query-v1 -------------------------------------------------------

function browseOpen(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const destination = String(args.destination ?? args.section ?? '');
  if (!DESTINATIONS.includes(destination as (typeof DESTINATIONS)[number])) {
    return { ok: false, error: `unknown destination: ${destination}` };
  }
  a.goto(destination as 'game-board' | 'stats');
  return { ok: true, operation: 'open', destination, phase: a.store.phase };
}

function browseApplyFilter(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const difficulty = String(args.difficulty ?? args.value ?? '');
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) {
    return { ok: false, error: `unknown difficulty filter: ${difficulty}` };
  }
  if (a.store.phase !== 'setup') {
    return { ok: false, error: 'difficulty can only be changed on the setup screen' };
  }
  a.setDifficulty(difficulty as Difficulty);
  return { ok: true, operation: 'apply_filter', filter: 'difficulty', difficulty: a.store.difficulty };
}

function browseClearFilter() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  if (a.store.phase !== 'setup') {
    return { ok: false, error: 'difficulty can only be changed on the setup screen' };
  }
  a.setDifficulty(DEFAULT_DIFFICULTY);
  return { ok: true, operation: 'clear_filter', filter: 'difficulty', difficulty: a.store.difficulty };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: 'session-start',
    description: 'Start a new best-of-3 match from the setup screen (same as the "Start match" button).',
    handler: sessionStart,
  },
  {
    name: 'session-pause',
    description: 'Pause the active round, freezing the board and the Rival (same as the Pause button).',
    handler: sessionPause,
  },
  {
    name: 'session-resume',
    description: 'Resume a paused round (same as the Resume button).',
    handler: sessionResume,
  },
  {
    name: 'session-restart',
    description: 'Restart the match at the current difficulty, resetting scores and strikes (same as "Rematch").',
    handler: sessionRestart,
  },
  {
    name: 'session-stop',
    description: 'Stop the match and return to the setup screen (same as the "New match" reset).',
    handler: sessionStop,
  },
  {
    name: 'browse-open',
    description: 'Navigate to a destination. args.destination is one of: game-board, stats.',
    handler: browseOpen,
  },
  {
    name: 'browse-apply_filter',
    description: 'Set the match difficulty filter on setup. args.difficulty is one of: easy, medium, hard.',
    handler: browseApplyFilter,
  },
  {
    name: 'browse-clear_filter',
    description: 'Clear the difficulty filter back to the default (easy) on setup.',
    handler: browseClearFilter,
  },
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
