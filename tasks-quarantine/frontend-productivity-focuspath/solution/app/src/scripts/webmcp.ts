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

const MODULES = ["entity-collection-v1", "browse-query-v1", "command-session-v1", "artifact-transfer-v1"];

const DESTINATIONS = ["goals-overview", "goal-detail", "completed-goals", "export-drawer", "command-palette"];
const ENTITY_TYPES = ["goal", "milestone", "step"];
const EXPORT_FORMATS = ["path-pack-json", "markdown-report"];

interface FocusPathUi {
  openExport: () => unknown;
  setExportTab: (tab: string) => unknown;
  copyExport: () => unknown | Promise<unknown>;
  openImport: () => unknown;
  openPalette: () => unknown;
  setPaletteQuery: (query: string) => unknown;
}

function ui(): FocusPathUi | null {
  const bridge = (window as unknown as Record<string, unknown>).__focuspath_ui;
  return (bridge as FocusPathUi) ?? null;
}

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
    accentColor: typeof args.accent_color === "string" ? args.accent_color : undefined,
    createdAt: typeof args.created_at === "string" ? args.created_at : undefined,
    lastCompletedAt: typeof args.last_completed_at === "string" ? args.last_completed_at : undefined,
    completionDate: typeof args.completion_date === "string" ? args.completion_date : undefined,
    completed: typeof args.completed === "boolean" ? args.completed : undefined,
    focusToday: typeof args.focus_today === "boolean" ? args.focus_today : undefined,
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
  if (destination === "export-drawer") {
    const u = ui();
    return u ? { ok: true, destination, ...(u.openExport() as object) } : { ok: false, error: "ui bridge not ready" };
  }
  if (destination === "command-palette") {
    const u = ui();
    return u ? { ok: true, destination, ...(u.openPalette() as object) } : { ok: false, error: "ui bridge not ready" };
  }
  return a.open(destination);
}

// ---- artifact-transfer-v1 --------------------------------------------------
// No raw file/blob/base64/contents cross this surface (mechanics exclusion):
// export opens the live-derived drawer, import opens the confirm-gated picker.
// copy triggers the visible Copy affordance's full behavior — including the
// actual navigator.clipboard.writeText — so it leaves the clipboard in the
// same state a real click would. File picking/downloads stay with Playwright.

function artifactExport(args: Record<string, unknown>) {
  const u = ui();
  if (!u) return { ok: false, error: "ui bridge not ready" };
  const format = str(args.format, "path-pack-json");
  if (!EXPORT_FORMATS.includes(format)) return { ok: false, error: `unknown format: ${format}` };
  u.openExport();
  u.setExportTab(format === "markdown-report" ? "markdown" : "json");
  return { ok: true, operation: "export", format };
}

function artifactImport(args: Record<string, unknown>) {
  const u = ui();
  if (!u) return { ok: false, error: "ui bridge not ready" };
  const mode = str(args.mode, "path-pack");
  if (mode !== "path-pack") return { ok: false, error: `unknown import mode: ${mode}` };
  u.openImport();
  return { ok: true, operation: "import", mode };
}

async function artifactCopy() {
  const u = ui();
  if (!u) return { ok: false, error: "ui bridge not ready" };
  u.openExport();
  u.setExportTab("json");
  // Await so the clipboard write (now performed by copyExport) has landed
  // before this tool call resolves — otherwise a caller reading the
  // clipboard right after invoke_tool returns could race the write.
  await u.copyExport();
  return { ok: true, operation: "copy", format: "path-pack-json" };
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
// ---- exact compiler-shaped registry ---------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;
type Schema = Record<string, unknown>;
type Snapshot = {
  view: string;
  activeGoalId: string;
  goals: Array<{ id: string; completed: boolean; milestones: Array<{ id: string; completed: boolean; steps: Array<{ id: string; completed: boolean; focusToday: boolean }> }> }>;
};
type Located = { entity: "goal" | "milestone" | "step"; goalId: string; milestoneId?: string; stepId?: string };

const ENTITY_FIELDS = ["title", "target-date", "accent-color", "motivation", "completed", "focus-today", "created-at", "last-completed-at", "completion-date"];
const objectSchema = (properties: Record<string, unknown> = {}, required: string[] = []): Schema => ({ type: "object", additionalProperties: false, ...(required.length ? { required } : {}), properties });
const fieldsSchema = { type: "object", additionalProperties: { type: "string", maxLength: 200 } };
const emptySchema = objectSchema();

function snapshot(): Snapshot | null {
  const value = api()?.snapshot();
  return value && typeof value === "object" ? value as Snapshot : null;
}

function locate(id: string): Located | null {
  const data = snapshot();
  if (!data) return null;
  for (const goal of data.goals) {
    if (goal.id === id) return { entity: "goal", goalId: goal.id };
    for (const milestone of goal.milestones) {
      if (milestone.id === id) return { entity: "milestone", goalId: goal.id, milestoneId: milestone.id };
      const step = milestone.steps.find((item) => item.id === id);
      if (step) return { entity: "step", goalId: goal.id, milestoneId: milestone.id, stepId: step.id };
    }
  }
  return null;
}

function parseBooleanField(value: unknown, name: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
}

function canonicalCreate(args: Record<string, unknown>) {
  const a = api(); const data = snapshot();
  if (!a || !data) return { ok: false, error: "bridge not ready" };
  const fields = (args.fields ?? {}) as Record<string, string>;
  const title = fields.title ?? "";
  const active = data.goals.find((goal) => goal.id === data.activeGoalId);
  if (!active || fields["accent-color"] !== undefined || fields.motivation !== undefined) {
    return a.createGoal({ title, targetDate: fields["target-date"], accentColor: fields["accent-color"], motivation: fields.motivation });
  }
  if (fields["target-date"] !== undefined || active.milestones.length === 0) {
    return a.createMilestone(active.id, { title, targetDate: fields["target-date"] });
  }
  const milestone = active.milestones.find((item) => !item.completed) ?? active.milestones.at(-1);
  return milestone ? a.createStep(active.id, milestone.id, title) : { ok: false, error: "no milestone available for step creation" };
}

function canonicalSelect({ id }: Record<string, unknown>) {
  const a = api(); const found = locate(str(id));
  if (!a) return { ok: false, error: "bridge not ready" };
  if (!found) return { ok: false, error: "entity not found" };
  return a.select(found.goalId);
}

function canonicalUpdate({ id, fields: rawFields }: Record<string, unknown>) {
  const a = api(); const found = locate(str(id));
  if (!a) return { ok: false, error: "bridge not ready" };
  if (!found) return { ok: false, error: "entity not found" };
  const fields = (rawFields ?? {}) as Record<string, string>;
  return a.update({
    entity: found.entity, goalId: found.goalId, milestoneId: found.milestoneId, stepId: found.stepId,
    title: fields.title, targetDate: fields["target-date"], accentColor: fields["accent-color"], motivation: fields.motivation,
    completed: parseBooleanField(fields.completed, "completed"), focusToday: parseBooleanField(fields["focus-today"], "focus-today"),
    createdAt: fields["created-at"], lastCompletedAt: fields["last-completed-at"], completionDate: fields["completion-date"],
  });
}

function canonicalDelete({ id, confirm }: Record<string, unknown>) {
  const a = api(); const found = locate(str(id));
  if (!a) return { ok: false, error: "bridge not ready" };
  if (!found) return { ok: false, error: "entity not found" };
  return a.remove({ entity: found.entity, goalId: found.goalId, milestoneId: found.milestoneId, stepId: found.stepId, confirm: confirm === true });
}

function canonicalToggle({ id, field }: Record<string, unknown>) {
  const a = api(); const found = locate(str(id));
  if (!a) return { ok: false, error: "bridge not ready" };
  if (!found) return { ok: false, error: "entity not found" };
  if (found.entity === "goal" && (field === undefined || field === "completed")) return a.markGoalComplete(found.goalId);
  if (found.entity !== "step") return { ok: false, error: "this entity has no visible toggle command" };
  if (field === "focus-today") return a.toggleFocusToday(found.goalId, found.milestoneId!, found.stepId!);
  if (field === undefined || field === "completed") return a.toggleStepComplete(found.goalId, found.milestoneId!, found.stepId!);
  return { ok: false, error: `unsupported toggle field: ${String(field)}` };
}

function canonicalReorder({ id, to_index }: Record<string, unknown>) {
  const a = api(); const found = locate(str(id));
  if (!a) return { ok: false, error: "bridge not ready" };
  if (!found || found.entity !== "milestone") return { ok: false, error: "milestone not found" };
  const target = Number(to_index);
  let data = snapshot(); let goal = data?.goals.find((item) => item.id === found.goalId); let index = goal?.milestones.findIndex((item) => item.id === found.milestoneId) ?? -1;
  if (!goal || target < 0 || target >= goal.milestones.length) return { ok: false, error: "to_index is outside the milestone list" };
  while (index !== target) {
    const result = a.reorderMilestone(found.goalId, found.milestoneId!, target < index ? "up" : "down") as { ok?: boolean; error?: string };
    if (!result?.ok) return result;
    index += target < index ? -1 : 1;
  }
  return { ok: true, id: found.milestoneId, to_index: target };
}

function browseSearch({ query }: Record<string, unknown>) {
  const u = ui();
  return u ? u.setPaletteQuery(str(query)) : { ok: false, error: "ui bridge not ready" };
}

type Tool = { name: string; description: string; inputSchema: Schema; handler: Handler };
const TOOLS: Tool[] = [
  { name: "entity.create", description: "Create an entity using declared fields.", inputSchema: objectSchema({ fields: fieldsSchema }), handler: canonicalCreate },
  { name: "entity.select", description: "Select an entity by public id.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 } }, ["id"]), handler: canonicalSelect },
  { name: "entity.update", description: "Update declared fields on an entity.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, fields: fieldsSchema }, ["id", "fields"]), handler: canonicalUpdate },
  { name: "entity.delete", description: "Delete an entity with explicit confirmation.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, confirm: { type: "boolean", const: true } }, ["id", "confirm"]), handler: canonicalDelete },
  { name: "entity.toggle", description: "Toggle a boolean field on an entity.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, field: { type: "string", enum: ENTITY_FIELDS } }, ["id"]), handler: canonicalToggle },
  { name: "entity.reorder", description: "Reorder an entity by index when gesture mechanics are excluded.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, to_index: { type: "integer", minimum: 0 } }, ["id", "to_index"]), handler: canonicalReorder },
  { name: "browse.open", description: "Open a declared destination (route, tab, section, or item).", inputSchema: objectSchema({ destination: { type: "string", enum: DESTINATIONS, description: "Declared destination" } }, ["destination"]), handler: browseOpen },
  { name: "browse.search", description: "Search within the browsable surface.", inputSchema: objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"]), handler: browseSearch },
  { name: "session.start", description: "Invoke session operation: start.", inputSchema: emptySchema, handler: sessionStart },
  { name: "session.pause", description: "Invoke session operation: pause.", inputSchema: emptySchema, handler: sessionPause },
  { name: "session.resume", description: "Invoke session operation: resume.", inputSchema: emptySchema, handler: sessionResume },
  { name: "session.connect", description: "Invoke session operation: connect.", inputSchema: emptySchema, handler: sessionConnect },
  { name: "session.disconnect", description: "Invoke session operation: disconnect.", inputSchema: emptySchema, handler: sessionDisconnect },
  { name: "artifact.import", description: "Start a declared import mode (no file bytes in WebMCP).", inputSchema: objectSchema({ mode: { type: "string", enum: ["path-pack"] } }, ["mode"]), handler: artifactImport },
  { name: "artifact.export", description: "Export using a declared format (no blob/base64 in results).", inputSchema: objectSchema({ format: { type: "string", enum: EXPORT_FORMATS } }, ["format"]), handler: artifactExport },
  { name: "artifact.copy", description: "Trigger copy via the visible control (clipboard verified in Playwright).", inputSchema: emptySchema, handler: artifactCopy },
];

function validateInput(schema: Schema, input: Record<string, unknown>): string {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "arguments must be an object";
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const unknown = Object.keys(input).find((key) => !(key in properties)); if (unknown) return `unknown argument: ${unknown}`;
  const missing = ((schema.required ?? []) as string[]).find((key) => input[key] === undefined); if (missing) return `missing required argument: ${missing}`;
  for (const [key, rule] of Object.entries(properties)) {
    const value = input[key]; if (value === undefined) continue;
    if (rule.type === "string" && typeof value !== "string") return `${key} must be a string`;
    if (rule.type === "boolean" && typeof value !== "boolean") return `${key} must be a boolean`;
    if ((rule.type === "integer" && (!Number.isInteger(value) || Number(value) < Number(rule.minimum ?? 0)))) return `${key} must be a non-negative integer`;
    if (rule.maxLength && typeof value === "string" && value.length > Number(rule.maxLength)) return `${key} is too long`;
    if (rule.enum && !(rule.enum as unknown[]).includes(value)) return `${key} is outside the declared enum`;
    if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${String(rule.const)}`;
    if (rule.type === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) return `${key} must be an object`;
      const badField = Object.keys(value).find((field) => !ENTITY_FIELDS.includes(field)); if (badField) return `Unknown field: ${badField}`;
      const badValue = Object.entries(value).find(([, fieldValue]) => typeof fieldValue !== "string" || fieldValue.length > 200); if (badValue) return `${key}.${badValue[0]} must be a string of at most 200 characters`;
    }
  }
  return "";
}

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({ contract_version: CONTRACT_VERSION, modules: MODULES, tool_names: TOOLS.map((tool) => tool.name), tool_count: TOOLS.length });
  w.webmcp_list_tools = () => TOOLS.map(({ handler: _handler, ...tool }) => tool);
  w.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((candidate) => candidate.name === name);
    if (!tool) return { ok: false, error: `unknown_tool: ${name}` };
    const error = validateInput(tool.inputSchema, args); if (error) return { ok: false, error };
    try { return await tool.handler(args); } catch (cause) { return { ok: false, error: String((cause as Error)?.message ?? cause) }; }
  };
  try {
    const context = (navigator as unknown as { modelContext?: { registerTool: (tool: Record<string, unknown>) => void } }).modelContext;
    if (context?.registerTool) TOOLS.forEach((tool) => context.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, invoke: (args: Record<string, unknown>) => (w.webmcp_invoke_tool as (name: string, args: Record<string, unknown>) => unknown)(tool.name, args ?? {}) }));
  } catch { /* self-test globals remain available when native WebMCP is absent */ }
}

initWebMcp();
