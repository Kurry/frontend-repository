// WebMCP surface for the LetterDrop oracle.
//
// Contract zto-webmcp-v1. Every tool drives the SAME run-lifecycle functions
// and view controls a human uses — the real Zustand store actions that the
// on-screen "Start game" / "Pause" / "Resume" / "Play again" buttons and the
// Game / History / Achievements tabs are wired to. No tool fakes a success
// state the UI could not otherwise reach, and no tool batches or replays tile
// taps. Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool.

import { useGameStore } from "../store/gameStore";

const CONTRACT_VERSION = "zto-webmcp-v1";

// ---- command-session-v1 (session_operations) -------------------------------
// start | pause | resume | restart — the real run-lifecycle controls.

const SESSION_OPERATIONS = ["start", "pause", "resume", "restart"] as const;
type SessionOperation = (typeof SESSION_OPERATIONS)[number];

function clickByAriaLabel(label: string): boolean {
  const btn = document.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );
  if (btn && !btn.disabled) {
    btn.click();
    return true;
  }
  return false;
}

function sessionSnapshot() {
  const s = useGameStore.getState();
  return {
    gameStarted: s.gameStarted,
    isPaused: s.isPaused,
    isGameOver: s.isGameOver,
    score: s.score,
    tilesCleared: s.tilesCleared,
  };
}

function sessionOperate(args: Record<string, unknown>) {
  const operation = String(
    args.operation ?? args.session_operation ?? args.action ?? "",
  ) as SessionOperation;
  if (!SESSION_OPERATIONS.includes(operation)) {
    return { ok: false, error: `unknown session operation: ${operation}` };
  }
  const store = useGameStore.getState();

  switch (operation) {
    case "start": {
      // Prefer the real on-screen "Start game" button (resets the RAF frame
      // refs in App); fall back to the identical store action it invokes.
      if (!clickByAriaLabel("Start game")) store.startGame();
      break;
    }
    case "pause": {
      if (!clickByAriaLabel("Pause")) store.pauseGame();
      break;
    }
    case "resume": {
      if (!clickByAriaLabel("Resume")) store.resumeGame();
      break;
    }
    case "restart": {
      // Same path as the App's handleRestart / Game Over "Play again":
      // reset the run, then start a fresh one.
      store.resetGame();
      store.startGame();
      break;
    }
  }

  return { ok: true, operation, state: sessionSnapshot() };
}

// ---- browse-query-v1 -------------------------------------------------------
// destinations: game-board | match-history | achievements — drives the real
// view tabs (setView), the same function the on-screen tabs call.

const DESTINATION_TO_VIEW: Record<string, "game" | "history" | "achievements"> = {
  "game-board": "game",
  "match-history": "history",
  achievements: "achievements",
};

function browseOpen(args: Record<string, unknown>) {
  const destination = String(args.destination ?? args.section ?? "");
  const view = DESTINATION_TO_VIEW[destination];
  if (!view) return { ok: false, error: `unknown destination: ${destination}` };
  useGameStore.getState().setView(view);
  return { ok: true, destination, currentView: useGameStore.getState().currentView };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "command-session-operate",
    description:
      "Drive the run lifecycle. args.operation is one of start | pause | resume | restart, invoking the same store actions the Start game / Pause / Resume / Play again controls use.",
    handler: sessionOperate,
  },
  {
    name: "browse-open",
    description:
      "Switch the visible view via the real tab control. args.destination is one of game-board | match-history | achievements.",
    handler: browseOpen,
  },
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  // Read-only debug/testing hook (not a WebMCP tool): lets a test harness
  // read live tile positions so it can aim REAL pointer clicks at falling
  // tiles. It performs no mutations and creates no success path of its own.
  w.__letterdrop_debug_state = () => useGameStore.getState();
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["command-session-v1", "browse-query-v1"],
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () =>
    TOOLS.map((t) => ({ name: t.name, description: t.description }));
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

initWebMcp();
