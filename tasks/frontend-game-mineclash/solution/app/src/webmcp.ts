// WebMCP surface for the MineClash oracle.
//
// Every tool drives the SAME store-mutation functions the visible controls call
// (initNewMatch / resetMatch for Start & Rematch, the Pause/Resume toggle, the
// New-Match reset, the difficulty selector, the phase navigation the nav buttons
// use, and the export/import/copy handlers shared with the Export centre). No
// tool fakes a success path the UI could not otherwise reach, and NO tool
// reveals tiles, replays gameplay, or returns raw artifact contents / ground
// truth through its result — exports are rendered in the DOM as a readable,
// copyable preview that Playwright reads directly. Exposed on window as exactly
// webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool (the bridge
// surface only; nothing else leaks internal state).

import type { AppStore, Difficulty, MatchLogEntry } from './types';
import {
  applyImport, copyArtifact, exportArchive, exportMatch, goBack, initNewMatch,
  latestMatch, navigateTo, resetMatch,
} from './gameLogic';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['command-session-v1', 'browse-query-v1', 'artifact-transfer-v1'];

// The App component builds one of these, bound to the real store, then hands it
// to initWebMcp so the tools close over it. Nothing is attached to window.
export interface MineClashApi {
  store: AppStore;
  startMatch: () => void;   // "Start match" / setup entry (initNewMatch)
  restartMatch: () => void; // "Rematch" (resetMatch, keeps difficulty)
  newMatch: () => void;     // "New match" reset -> setup screen
  setPaused: (v: boolean) => void; // Pause / Resume toggle
  setDifficulty: (d: Difficulty) => void; // difficulty selector (setup only)
  navigate: (dest: NavDest) => void; // nav (same handler the visible nav uses)
  back: () => void; // "← Go back" (returnToGame-aware)
}

type NavDest = 'game-board' | 'stats' | 'match-log' | 'export-center' | 'setup';
const DESTINATIONS: NavDest[] = ['game-board', 'stats', 'match-log', 'export-center'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DEFAULT_DIFFICULTY: Difficulty = 'easy';
const EXPORT_FORMATS = ['match-json', 'match-archive-json'] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

let _api: MineClashApi | null = null;
function api(): MineClashApi | null { return _api; }

// ---- command-session-v1 ----------------------------------------------------

function sessionStart() {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const phase = a.store.phase;
  if (phase !== 'setup' && phase !== 'match-complete') {
    return { ok: false, error: `cannot start: a match is already in phase "${phase}"` };
  }
  const playerName = a.store.playerName.trim();
  if (playerName.length < 2 || playerName.length > 20) {
    return { ok: false, error: 'playerName field must be 2 to 20 non-space characters' };
  }
  a.store.playerName = playerName;
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
  if (a.store.phase !== 'match-complete') {
    return { ok: false, error: 'rematch is only available after a completed match' };
  }
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
  if (!DESTINATIONS.includes(destination as NavDest)) {
    return { ok: false, error: `unknown destination: ${destination}` };
  }
  if (
    destination === 'game-board' &&
    !a.store.returnToGame &&
    a.store.phase !== 'playing' &&
    a.store.phase !== 'round-result'
  ) {
    return { ok: false, error: 'no active round to open' };
  }
  a.navigate(destination as NavDest);
  return { ok: true, operation: 'open', destination, phase: a.store.phase };
}

function browseSearch(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const query = String(args.query ?? '').trim().toLowerCase();
  if (!query || query.length > 200) {
    return { ok: false, error: 'query must be 1 to 200 characters' };
  }
  const destinations = DESTINATIONS.filter((destination) => destination.includes(query));
  return {
    ok: true,
    operation: 'search',
    query,
    phase: a.store.phase,
    difficulty: a.store.difficulty,
    destinations,
    matchCount: a.store.matchLog.length,
  };
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

// ---- artifact-transfer-v1 --------------------------------------------------
// Results never carry the artifact body (raw files / blobs / base64 / contents
// are forbidden in WebMCP results per the contract). The matching artifact is
// rendered in the DOM as a readable preview; clipboard copy is performed by the
// same handler the on-screen Copy button uses.

function resolveExportEntry(a: MineClashApi, entryId: unknown): { entry: MatchLogEntry | null; error: string | null } {
  if (entryId === undefined || entryId === null || entryId === '') {
    return { entry: latestMatch(a.store), error: null };
  }
  const idx = typeof entryId === 'number' ? entryId : Number(entryId);
  if (Number.isFinite(idx) && a.store.matchLog[idx]) {
    return { entry: a.store.matchLog[idx], error: null };
  }
  if (typeof entryId === 'string') {
    const byEnded = a.store.matchLog.find((m) => m.endedAt === entryId);
    if (byEnded) return { entry: byEnded, error: null };
  }
  return { entry: null, error: `no match log entry matches id "${String(entryId)}"` };
}

function artifactExport(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const format = String(args.format ?? 'match-json');
  if (format === 'match-archive-json') {
    if (a.store.matchLog.length === 0) return { ok: false, error: 'no finished matches to export' };
    exportArchive(a.store);
    return { ok: true, operation: 'export', format, matches: a.store.matchLog.length };
  }
  if (format !== 'match-json') return { ok: false, error: `unknown export format: ${format}` };
  const { entry, error } = resolveExportEntry(a, args.entryId);
  if (error || !entry) return { ok: false, error: error || 'no finished match to export' };
  exportMatch(a.store, entry);
  return { ok: true, operation: 'export', format, playerName: entry.playerName, difficulty: entry.difficulty };
}

function artifactCopy(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const format = String(args.format ?? 'match-json');
  let text = '';
  if (format === 'match-archive-json') {
    if (a.store.matchLog.length === 0) return { ok: false, error: 'no finished matches to copy' };
    text = JSON.stringify({ matches: a.store.matchLog }, null, 2);
  } else if (format === 'match-json') {
    const { entry, error } = resolveExportEntry(a, args.entryId);
    if (error || !entry) return { ok: false, error: error || 'no finished match to copy' };
    text = JSON.stringify(entry, null, 2);
  } else {
    return { ok: false, error: `unknown copy format: ${format}` };
  }
  // Fire-and-forget; the result must not carry the copied contents.
  void copyArtifact(a.store, text, 'Copied');
  return { ok: true, operation: 'copy', format };
}

function artifactImport(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const mode = String(args.mode ?? 'match-json');
  if (mode !== 'match-json' && mode !== 'match-archive-json') {
    return { ok: false, error: `unknown import mode: ${mode}` };
  }
  // The text to import must already be in the import textarea (Playwright types
  // it the same way a human pastes). The handler is identical to the Import
  // button; we never accept raw contents through WebMCP arguments.
  const result = applyImport(a.store);
  return { ok: result.ok, operation: 'import', mode, imported: result.imported, message: a.store.importMessage };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

type ModuleId = (typeof MODULES)[number];
type ToolDescriptor = {
  name: string;
  module: ModuleId;
  operation: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  handler: Handler;
};

const EMPTY_INPUT = { type: 'object', additionalProperties: false };

const TOOLS: ToolDescriptor[] = [
  {
    name: 'session.start',
    module: 'command-session-v1',
    operation: 'start',
    description: 'Start a new best-of-3 match from the setup screen (same as the "Start match" button).',
    inputSchema: EMPTY_INPUT,
    handler: sessionStart,
  },
  {
    name: 'session.pause',
    module: 'command-session-v1',
    operation: 'pause',
    description: 'Pause the active round, freezing the board and the Rival (same as the Pause button).',
    inputSchema: EMPTY_INPUT,
    handler: sessionPause,
  },
  {
    name: 'session.resume',
    module: 'command-session-v1',
    operation: 'resume',
    description: 'Resume a paused round (same as the Resume button).',
    inputSchema: EMPTY_INPUT,
    handler: sessionResume,
  },
  {
    name: 'session.restart',
    module: 'command-session-v1',
    operation: 'restart',
    description: 'Restart the match at the current difficulty, resetting scores and strikes (same as "Rematch").',
    inputSchema: EMPTY_INPUT,
    handler: sessionRestart,
  },
  {
    name: 'session.stop',
    module: 'command-session-v1',
    operation: 'stop',
    description: 'Stop the match and return to the setup screen (same as the "New match" reset).',
    inputSchema: EMPTY_INPUT,
    handler: sessionStop,
  },
  {
    name: 'browse.open',
    module: 'browse-query-v1',
    operation: 'open',
    description: 'Navigate to a destination. args.destination is one of: game-board, stats, match-log, export-center. Works mid-round; use the visible Go back control to return to the round.',
    inputSchema: {
      type: 'object', additionalProperties: false, default: { destination: 'stats' }, required: ['destination'],
      properties: { destination: { type: 'string', enum: DESTINATIONS } },
    },
    handler: browseOpen,
  },
  {
    name: 'browse.search',
    module: 'browse-query-v1',
    operation: 'search',
    description: 'Search declared MineClash destinations and return the current visible session summary.',
    inputSchema: {
      type: 'object', additionalProperties: false, required: ['query'],
      properties: { query: { type: 'string', minLength: 1, maxLength: 200 } },
    },
    annotations: { readOnlyHint: true },
    handler: browseSearch,
  },
  {
    name: 'browse.apply_filter',
    module: 'browse-query-v1',
    operation: 'apply_filter',
    description: 'Set the match difficulty filter on setup. args.difficulty is one of: easy, medium, hard.',
    inputSchema: {
      type: 'object', additionalProperties: false, required: ['difficulty'],
      properties: { difficulty: { type: 'string', enum: DIFFICULTIES, default: 'medium' } },
    },
    handler: browseApplyFilter,
  },
  {
    name: 'browse.clear_filter',
    module: 'browse-query-v1',
    operation: 'clear_filter',
    description: 'Clear the difficulty filter back to the default (easy) on setup.',
    inputSchema: EMPTY_INPUT,
    handler: browseClearFilter,
  },
  {
    name: 'artifact.export',
    module: 'artifact-transfer-v1',
    operation: 'export',
    description: 'Show an export artifact in the DOM as a readable/copyable preview (same as the Export Match / Export Archive controls). args.format is match-json or match-archive-json; match-json may pass args.entryId (index into the Match log, or an endedAt string). No raw JSON is returned.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: { format: { type: 'string', enum: EXPORT_FORMATS }, entryId: { type: ['number', 'string'] } },
    },
    handler: artifactExport,
  },
  {
    name: 'artifact.copy',
    module: 'artifact-transfer-v1',
    operation: 'copy',
    description: 'Copy an export artifact to the clipboard (same as the on-screen Copy button). args.format is match-json or match-archive-json. The copied text is NOT returned.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: { format: { type: 'string', enum: EXPORT_FORMATS }, entryId: { type: ['number', 'string'] } },
    },
    handler: artifactCopy,
  },
  {
    name: 'artifact.import',
    module: 'artifact-transfer-v1',
    operation: 'import',
    description: 'Import the JSON currently in the import textarea (same handler as the Import button; type the text first the way a human pastes). args.mode is match-json or match-archive-json. Returns ok/imported/message only — never the parsed contents.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: { mode: { type: 'string', enum: ['match-json', 'match-archive-json'] } },
    },
    handler: artifactImport,
  },
];

export function initWebMcp(app: MineClashApi) {
  _api = app;
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map(({ handler: _handler, ...descriptor }) => descriptor);
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
