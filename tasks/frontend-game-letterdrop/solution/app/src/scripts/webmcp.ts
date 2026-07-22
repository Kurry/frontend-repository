// WebMCP surface for the LetterDrop oracle — contract zto-webmcp-v1.
//
// Every tool drives the SAME store actions and view/export controls a human
// uses: the real "Start game" / "Pause" / "Resume" / "Play again" buttons and
// the Game / History / Achievements tabs (command-session-v1, browse-query-v1),
// and the real Export Run / Export History / Copy / Import surfaces
// (artifact-transfer-v1). No tool fakes a success state the UI could not reach,
// and no tool batches or replays tile taps. Tool results carry a *fresh*
// visibleState read synchronously from the store after the action so the
// reported state always matches the rendered app (no stale lag). Artifact
// results never include the JSON body — per the contract, file bytes and
// clipboard contents stay Playwright's responsibility; import only makes the
// import surface visible and hands control back for the file upload.

import { useGameStore } from "../store/gameStore";

const CONTRACT_VERSION = "zto-webmcp-v1";

function clickByAriaLabel(label: string): boolean {
  const btn = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (btn && !btn.disabled) {
    btn.click();
    return true;
  }
  return false;
}

// Fresh, accurate projection of the rendered app — read straight from the
// store, which Zustand updates synchronously, so it reflects the action that
// just ran rather than a previous frame.
function visibleState() {
  const s = useGameStore.getState();
  return {
    phase: s.isGameOver ? "gameover" : s.isPaused ? "paused" : s.gameStarted ? "running" : "idle",
    currentView: s.currentView,
    score: s.score,
    streak: s.streak,
    multiplier: s.multiplier,
    tierIndex: s.difficulty,
    tierName: `Tier ${s.difficulty + 1}`,
    tilesOnBoard: s.tiles.length,
    selectedLetters: s.selectedWord.map((t) => t.letter).join(""),
    gameStarted: s.gameStarted,
    isPaused: s.isPaused,
    isGameOver: s.isGameOver,
    checkpointAvailable: s.checkpoint !== null,
    settingsOpen: s.settingsOpen,
    exportPreviewOpen: s.exportPreview !== null,
    importSurfaceVisible: s.importSurfaceVisible,
    historyCount: s.matchHistory.length,
  };
}

// ---- command-session-v1 ----------------------------------------------------
const SESSION_OPERATIONS = ["start", "pause", "resume", "restart"] as const;
type SessionOperation = (typeof SESSION_OPERATIONS)[number];

function sessionOperate(args: Record<string, unknown>) {
  const operation = String(args.operation ?? args.session_operation ?? args.action ?? "") as SessionOperation;
  if (!(SESSION_OPERATIONS as readonly string[]).includes(operation)) {
    return { ok: false, error: `unknown session operation: ${operation}`, visibleState: visibleState() };
  }
  let activated = false;
  switch (operation) {
    case "start":
      activated = clickByAriaLabel("Start game");
      break;
    case "pause":
      activated = clickByAriaLabel("Pause");
      break;
    case "resume":
      activated = clickByAriaLabel("Resume");
      break;
    case "restart":
      activated = clickByAriaLabel("Play again");
      break;
  }
  if (!activated) {
    return { ok: false, error: `${operation} is not available in the current visible state`, visibleState: visibleState() };
  }
  return { ok: true, operation, visibleState: visibleState() };
}

// ---- browse-query-v1 -------------------------------------------------------
const DESTINATION_TO_VIEW: Record<string, "game" | "history" | "achievements"> = {
  "game-board": "game",
  "match-history": "history",
  achievements: "achievements",
};

function browseOpen(args: Record<string, unknown>) {
  const destination = String(args.destination ?? args.section ?? "");
  const view = DESTINATION_TO_VIEW[destination];
  if (!view) {
    return { ok: false, error: `unknown destination: ${destination} (allowed: game-board, match-history, achievements)`, visibleState: visibleState() };
  }
  useGameStore.getState().setView(view);
  return { ok: true, destination, visibleState: visibleState() };
}

// ---- artifact-transfer-v1 --------------------------------------------------
const ARTIFACT_OPERATIONS = ["export", "import", "copy"] as const;
type ArtifactOperation = (typeof ARTIFACT_OPERATIONS)[number];

async function artifactOperate(args: Record<string, unknown>) {
  const operation = String(args.operation ?? args.artifact_operation ?? args.action ?? "") as ArtifactOperation;
  if (!(ARTIFACT_OPERATIONS as readonly string[]).includes(operation)) {
    return { ok: false, error: `unknown artifact operation: ${operation}`, visibleState: visibleState() };
  }
  const store = useGameStore.getState();
  const format = String(args.format ?? args.mode ?? "");

  if (operation === "export") {
    if (format === "history-json") {
      store.openExportHistory();
    } else if (format === "run-json" || format === "") {
      const opened = store.openExportRun();
      if (!opened) {
        return { ok: false, error: "no finished run to export yet — finish a run first", visibleState: visibleState() };
      }
    } else {
      return { ok: false, error: `unknown export format: ${format} (allowed: run-json, history-json)`, visibleState: visibleState() };
    }
    const st = useGameStore.getState();
    return { ok: true, operation, format: format || "run-json", previewVisible: st.exportPreview !== null, visibleState: visibleState() };
  }

  if (operation === "copy") {
    const st0 = useGameStore.getState();
    if (!st0.exportPreview) {
      return { ok: false, error: "copy is unavailable until an export preview is open", visibleState: visibleState() };
    }
    const copied = await useGameStore.getState().copyExport();
    return { ok: copied, operation, copied, visibleState: visibleState() };
  }

  // import — raw bytes cannot cross WebMCP, so we make the import surface
  // visible and operable, then hand the file upload back to Playwright. We do
  // NOT claim the import succeeded.
  if (format && format !== "run-json" && format !== "history-json") {
    return { ok: false, error: `unknown import mode: ${format} (allowed: run-json, history-json)`, visibleState: visibleState() };
  }
  store.setView("history");
  useGameStore.setState({ importSurfaceVisible: true });
  return {
    ok: true,
    operation,
    importSurfaceVisible: true,
    note: "Import control is now visible and focused; supply the file via the file input (Playwright upload). Raw file bytes are not accepted over WebMCP.",
    visibleState: visibleState(),
  };
}

// ---- registry --------------------------------------------------------------
type Handler = (args: Record<string, unknown>) => unknown | Promise<unknown>;

type Tool = {
  name: string;
  description: string;
  module: string;
  handler: Handler;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
};

const EMPTY_INPUT_SCHEMA = { type: "object", properties: {}, additionalProperties: false };

const TOOLS: Tool[] = [
  {
    name: "session.start",
    description: "Start a run through the visible Start game control.",
    module: "command-session-v1",
    handler: () => sessionOperate({ operation: "start" }),
  },
  {
    name: "session.pause",
    description: "Pause the active run through the visible Pause control.",
    module: "command-session-v1",
    handler: () => sessionOperate({ operation: "pause" }),
  },
  {
    name: "session.resume",
    description: "Resume the paused run through the visible Resume control.",
    module: "command-session-v1",
    handler: () => sessionOperate({ operation: "resume" }),
  },
  {
    name: "session.restart",
    description: "Restart after Game Over through the visible Play again control.",
    module: "command-session-v1",
    handler: () => sessionOperate({ operation: "restart" }),
  },
  {
    name: "browse.open",
    description:
      "Switch the visible view via the real tab control. args.destination is one of game-board | match-history | achievements. Returns a fresh visibleState.",
    module: "browse-query-v1",
    handler: browseOpen,
  },
  {
    name: "browse.inspect",
    description: "Read the current visible game and navigation state without changing the app.",
    module: "browse-query-v1",
    inputSchema: EMPTY_INPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    handler: () => ({ ok: true, visibleState: visibleState() }),
  },
  {
    name: "artifact.export",
    description: "Open the visible export preview for args.format run-json or history-json; no JSON is returned.",
    module: "artifact-transfer-v1",
    handler: (args) => artifactOperate({ ...args, operation: "export" }),
  },
  {
    name: "artifact.import",
    description: "Reveal and focus the visible Import control for args.mode run-json or history-json; raw bytes remain Playwright-only.",
    module: "artifact-transfer-v1",
    handler: (args) => artifactOperate({ ...args, operation: "import" }),
  },
  {
    name: "artifact.copy",
    description: "Copy from the currently visible export preview and report the settled clipboard result without returning its contents.",
    module: "artifact-transfer-v1",
    handler: (args) => artifactOperate({ ...args, operation: "copy" }),
  },
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["command-session-v1", "browse-query-v1", "artifact-transfer-v1"],
    tools: TOOLS.map((t) => t.name),
    visibleState: visibleState(),
  });
  w.webmcp_list_tools = () =>
    TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      module: t.module,
      inputSchema: t.inputSchema ?? EMPTY_INPUT_SCHEMA,
      parameters: t.inputSchema ?? EMPTY_INPUT_SCHEMA,
      annotations: t.annotations ?? {},
    }));
  w.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return await tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err), visibleState: visibleState() };
    }
  };
}

initWebMcp();
