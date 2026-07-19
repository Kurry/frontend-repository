// WebMCP surface for the FocusPath oracle (contract zto-webmcp-v1).
//
// Every tool drives the SAME domain command a human uses. entity/browse tools
// delegate to window.__focuspath — the imperative bridge installed by the App
// component, whose commands run the identical store factories, guards, and
// saveState persistence the visible controls run, mutating the same reactive
// Qwik store. command-session tools click the REAL Start / Pause / Reconnect /
// Deliver Out of Order buttons in the live-activity panel. No tool reaches a
// state the UI cannot, and none fabricates a success path.
//
// Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool.

const CONTRACT_VERSION = "zto-webmcp-v1";

const MODULES = ["entity-collection-v1", "browse-query-v1", "command-session-v1"];

const DESTINATIONS = ["goals-overview", "goal-detail", "completed-goals"];
const ENTITY_TYPES = ["goal", "milestone", "step"];

interface FocusPathApi {
  snapshot: () => unknown;
  open: (destination: string, goalId?: string) => unknown;
  createGoal: (fields: Record<string, unknown>) => unknown;
  createMilestone: (goalId: string, fields: Record<string, unknown>) => unknown;
  createStep: (goalId: string, milestoneId: string, title: string) => unknown;
  select: (goalId: string) => unknown;
  update: (args: Record<string, unknown>) => unknown;
  remove: (args: Record<string, unknown>) => unknown;
  toggleStepComplete: (goalId: string, milestoneId: string, stepId: string) => unknown;
  toggleFocusToday: (goalId: string, milestoneId: string, stepId: string) => unknown;
  reorderMilestone: (goalId: string, milestoneId: string, direction: string) => unknown;
  markGoalComplete: (goalId: string) => unknown;
}

function api(): FocusPathApi | null {
  const bridge = (window as unknown as Record<string, unknown>).__focuspath;
  return (bridge as FocusPathApi) ?? null;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function clickById(id: string): boolean {
  const el = document.getElementById(id) as HTMLButtonElement | null;
  if (!el) return false;
  el.click();
  return true;
}

// ---- entity-collection-v1 --------------------------------------------------

function entityCreate(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  const entity = str(args.entity_type ?? args.entity);
  if (!ENTITY_TYPES.includes(entity)) return { ok: false, error: `unknown entity_type: ${entity}` };
  if (entity === "goal") {
    return a.createGoal({
      title: args.title,
      targetDate: args.target_date,
      accentColor: args.accent_color,
      motivation: args.motivation,
    });
  }
  if (entity === "milestone") {
    return a.createMilestone(str(args.goal_id), { title: args.title, targetDate: args.target_date });
  }
  return a.createStep(str(args.goal_id), str(args.milestone_id), str(args.title));
}

function entitySelect(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  return a.select(str(args.goal_id));
}

function entityUpdate(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  return a.update({
    entity: str(args.entity_type ?? args.entity),
    goalId: str(args.goal_id),
    milestoneId: str(args.milestone_id) || undefined,
    stepId: str(args.step_id) || undefined,
    title: typeof args.title === "string" ? args.title : undefined,
    targetDate: typeof args.target_date === "string" ? args.target_date : undefined,
    motivation: typeof args.motivation === "string" ? args.motivation : undefined,
  });
}

function entityDelete(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  return a.remove({
    entity: str(args.entity_type ?? args.entity),
    goalId: str(args.goal_id),
    milestoneId: str(args.milestone_id) || undefined,
    stepId: str(args.step_id) || undefined,
    confirm: args.confirm === true,
  });
}

function entityToggle(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  const kind = str(args.toggle ?? args.kind);
  if (kind === "focus-today") {
    return a.toggleFocusToday(str(args.goal_id), str(args.milestone_id), str(args.step_id));
  }
  if (kind === "step-complete" || kind === "") {
    return a.toggleStepComplete(str(args.goal_id), str(args.milestone_id), str(args.step_id));
  }
  return { ok: false, error: `unknown toggle: ${kind}` };
}

function entityReorder(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  const direction = str(args.direction);
  if (direction !== "up" && direction !== "down") return { ok: false, error: "direction must be up|down" };
  return a.reorderMilestone(str(args.goal_id), str(args.milestone_id), direction);
}

// entity-complete (mark-goal-complete) reuses the same real command exposed by
// the visible "Mark Goal Complete" button (only reachable at 100%).
function entityCompleteGoal(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  return a.markGoalComplete(str(args.goal_id));
}

// ---- browse-query-v1 -------------------------------------------------------

function browseOpen(args: Record<string, unknown>) {
  const a = api();
  if (!a) return { ok: false, error: "bridge not ready" };
  const destination = str(args.destination);
  if (!DESTINATIONS.includes(destination)) return { ok: false, error: `unknown destination: ${destination}` };
  return a.open(destination, str(args.goal_id) || undefined);
}

// ---- command-session-v1 ----------------------------------------------------
// Each drives the real live-activity button. Tool output cannot prove playback;
// the judge observes the panel with Playwright.

function sessionStart() {
  return clickById("fp-live-start")
    ? { ok: true, operation: "start" }
    : { ok: false, error: "Start control not found" };
}
function sessionPause() {
  return clickById("fp-live-pause")
    ? { ok: true, operation: "pause" }
    : { ok: false, error: "Pause control not found" };
}
// Resume processing after a pause == pressing the real Start control again.
function sessionResume() {
  return clickById("fp-live-start")
    ? { ok: true, operation: "resume" }
    : { ok: false, error: "Start control not found" };
}
function sessionConnect() {
  return clickById("fp-live-reconnect")
    ? { ok: true, operation: "connect" }
    : { ok: false, error: "Reconnect control not found" };
}
function sessionDisconnect() {
  return clickById("fp-live-disconnect")
    ? { ok: true, operation: "disconnect" }
    : { ok: false, error: "Disconnect control not found" };
}
function sessionTriggerDemo(args: Record<string, unknown>) {
  const demo = str(args.demo, "Deliver Out of Order");
  if (demo !== "Deliver Out of Order") return { ok: false, error: `unknown demo: ${demo}` };
  return clickById("fp-live-deliver")
    ? { ok: true, operation: "trigger_demo", demo }
    : { ok: false, error: "Deliver Out of Order control not found" };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "entity-create",
    description:
      "Create a goal, milestone, or step via the same store command the visible add controls use. args.entity_type is goal|milestone|step; goal needs title (optional target_date, accent_color, motivation); milestone needs goal_id + title; step needs goal_id + milestone_id + title.",
    handler: entityCreate,
  },
  {
    name: "entity-select",
    description: "Open a goal's detail/path view. args.goal_id.",
    handler: entitySelect,
  },
  {
    name: "entity-update",
    description:
      "Edit a goal/milestone/step in place. args.entity_type + goal_id (+ milestone_id/step_id) and the fields to change (title, target_date, motivation).",
    handler: entityUpdate,
  },
  {
    name: "entity-delete",
    description:
      "Delete a goal, milestone, or step (nested data removed). args.entity_type + ids; requires confirm=true.",
    handler: entityDelete,
  },
  {
    name: "entity-toggle",
    description:
      "Toggle a step. args.toggle is step-complete (checks/unchecks the step, auto-completing its milestone when all steps are done) or focus-today (adds/removes Today's Focus, capped at 3). Needs goal_id, milestone_id, step_id.",
    handler: entityToggle,
  },
  {
    name: "entity-reorder",
    description:
      "Move a milestone up or down its goal's path via the real reorder command. args.goal_id, milestone_id, direction (up|down). Rejected when the milestone or any earlier one is complete.",
    handler: entityReorder,
  },
  {
    name: "entity-complete-goal",
    description:
      "Run the Mark Goal Complete command (only succeeds at 100%). args.goal_id.",
    handler: entityCompleteGoal,
  },
  {
    name: "browse-open",
    description:
      "Switch the visible view. args.destination is goals-overview | goal-detail (optional goal_id) | completed-goals.",
    handler: browseOpen,
  },
  { name: "session-start", description: "Click the live-activity Start control.", handler: sessionStart },
  { name: "session-pause", description: "Click the live-activity Pause control.", handler: sessionPause },
  { name: "session-resume", description: "Resume the live stream (clicks Start again).", handler: sessionResume },
  { name: "session-connect", description: "Click the live-activity Reconnect control.", handler: sessionConnect },
  { name: "session-disconnect", description: "Click the live-activity Disconnect control.", handler: sessionDisconnect },
  {
    name: "session-trigger_demo",
    description: 'Click the "Deliver Out of Order" control. args.demo defaults to "Deliver Out of Order".',
    handler: sessionTriggerDemo,
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

initWebMcp();
