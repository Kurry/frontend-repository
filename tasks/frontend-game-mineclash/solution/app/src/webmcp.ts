import type { AppStore, Difficulty } from './types';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['command-session-v1', 'browse-query-v1', 'artifact-transfer-v1'];

export interface MineClashApi {
  store: AppStore;
  startMatch: () => void;
  restartMatch: () => void;
  newMatch: () => void;
  setPaused: (v: boolean) => void;
  setDifficulty: (d: Difficulty) => void;
  goto: (dest: 'game-board' | 'stats' | 'match-log' | 'export-center') => void;
}

const DESTINATIONS = ['game-board', 'stats', 'match-log', 'export-center'] as const;
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DEFAULT_DIFFICULTY: Difficulty = 'easy';

function api(): MineClashApi | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.__mineclashApi as MineClashApi) || null;
}

function sessionStart(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };

  const playerName = typeof args.playerName === 'string' ? args.playerName.trim() : a.store.playerName;
  const difficulty = (typeof args.difficulty === 'string' && DIFFICULTIES.includes(args.difficulty as Difficulty))
    ? (args.difficulty as Difficulty)
    : a.store.difficulty;

  if (!playerName || playerName.length < 2 || playerName.length > 20) {
    return { ok: false, error: 'Start unavailable: valid playerName and difficulty are required' };
  }

  const phase = a.store.phase;
  if (phase !== 'setup' && phase !== 'match-complete') {
    return { ok: false, error: `cannot start: a match is already in phase "${phase}"` };
  }

  a.store.playerName = playerName;
  a.setDifficulty(difficulty);

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

function browseOpen(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const destination = String(args.destination ?? args.section ?? '');
  if (!DESTINATIONS.includes(destination as (typeof DESTINATIONS)[number])) {
    return { ok: false, error: `unknown destination: ${destination}` };
  }
  a.goto(destination as 'game-board' | 'stats' | 'match-log' | 'export-center');
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

function artifactExport(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const format = args.format;
  if (format === 'match-json') {
    if (a.store.matchLog.length === 0) return { ok: false, error: 'no match to export' };
    const latestMatch = a.store.matchLog[0];
    return { ok: true, operation: 'export', format, artifact: latestMatch };
  } else if (format === 'match-archive-json') {
    return { ok: true, operation: 'export', format, artifact: { matches: a.store.matchLog } };
  }
  return { ok: false, error: `unknown export format: ${format}` };
}

function artifactImport(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: 'app not ready' };
  const format = args.format;
  const artifact = args.artifact as any;
  if (!artifact) return { ok: false, error: 'no artifact provided' };

  if (format === 'match-json') {
    if (!artifact.playerName || !artifact.difficulty || artifact.winner === undefined) {
      return { ok: false, error: 'invalid match json' };
    }
    a.store.matchLog = [artifact, ...a.store.matchLog];
    return { ok: true, operation: 'import', format };
  } else if (format === 'match-archive-json') {
    if (!artifact.matches || !Array.isArray(artifact.matches)) {
      return { ok: false, error: 'invalid archive json' };
    }
    a.store.matchLog = artifact.matches;
    return { ok: true, operation: 'import', format };
  }
  return { ok: false, error: `unknown import format: ${format}` };
}

function artifactCopy() {
  return { ok: true, operation: 'copy', message: 'Copied' };
}

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler; schema?: any }[] = [
  {
    name: 'session-start',
    description: 'Start a new best-of-3 match from the setup screen (same as the "Start match" button).',
    handler: sessionStart,
    schema: {
      type: 'object',
      properties: {
        playerName: { type: 'string' },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
      },
      required: ['playerName', 'difficulty']
    }
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
    description: 'Navigate to a destination. args.destination is one of: game-board, stats, match-log, export-center.',
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
  {
    name: 'artifact-export',
    description: 'Export an artifact. format is match-json or match-archive-json.',
    handler: artifactExport,
  },
  {
    name: 'artifact-import',
    description: 'Import an artifact. format is match-json or match-archive-json.',
    handler: artifactImport,
  },
  {
    name: 'artifact-copy',
    description: 'Copy an artifact to clipboard.',
    handler: artifactCopy,
  },
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.schema || { type: 'object' } }));
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
