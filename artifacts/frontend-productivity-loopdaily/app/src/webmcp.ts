// WebMCP surface for the LoopDaily oracle.
//
// Every tool drives the SAME controls a human uses: form-workflow tools fill
// the real New Habit form inputs and submit the real form element (so the
// same blank-name validation the UI enforces still runs); entity-collection
// tools click the real per-habit buttons (complete/stepper/menu items);
// browse-query tools click the real nav tabs and category filter chips;
// artifact-transfer tools click the real Export/Import/Load Malformed Sample
// buttons and drive the real confirm dialog. Nothing here fabricates a
// success state the UI would not otherwise reach, and habit reorder is
// intentionally NOT exposed here because it is graded as a real drag gesture
// (see mechanics_exclusions in schemas/webmcp-assignments.json).
//
// Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool.

const CONTRACT_VERSION = "zto-webmcp-v1";

function q<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(sel);
}

function qa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

function fireInput(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : el instanceof HTMLSelectElement
    ? HTMLSelectElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter ? setter.call(el, value) : (el.value = value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function click(el: Element | null | undefined) {
  if (el instanceof HTMLElement) el.click();
}

// ---- shared helpers ---------------------------------------------------

function habitCard(habitId: string): HTMLElement | null {
  return q<HTMLElement>(`[data-habit-card][data-habit-id="${habitId}"]`);
}

async function ensureHabitFormOpen(): Promise<HTMLElement | null> {
  let form = q<HTMLElement>("[data-habit-form]");
  if (form) return form;
  const opener =
    q<HTMLElement>('[data-action="open-habit-form"]') ||
    q<HTMLElement>('[data-action="submit-habit"]');
  click(opener);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  form = q<HTMLElement>("[data-habit-form]");
  return form;
}

function goToView(view: "habits" | "stats" | "import") {
  const nav = q<HTMLElement>(`[data-nav="${view}"]`);
  click(nav);
}

// ---- browse-query-v1 ---------------------------------------------------

function browseOpen(args: Record<string, unknown>) {
  const destination = String(args.destination ?? "");
  if (destination === "habits" || destination === "stats" || destination === "import") {
    goToView(destination);
    return { ok: true, destination };
  }
  if (destination === "heatmap") {
    goToView("habits");
    const card = q<HTMLElement>("[data-habit-card]");
    if (!card) return { ok: false, error: "Create a habit before opening its heatmap" };
    const btn = q('[data-action="view-heatmap"]', card);
    if (!btn) return { ok: false, error: "view-heatmap control not found" };
    click(btn);
    return { ok: true, destination };
  }
  return { ok: false, error: `unknown destination: ${destination}` };
}

function browseApplyFilter(args: Record<string, unknown>) {
  const categoryId = args.category_id != null ? String(args.category_id) : "";
  goToView("habits");
  const chip = q<HTMLElement>(`[data-action="filter"][data-category-id="${categoryId}"]`);
  if (!chip) return { ok: false, error: `category filter not found: ${categoryId}` };
  chip.click();
  return { ok: true, categoryId: categoryId || null };
}

function browseClearFilter(_args: Record<string, unknown>) {
  goToView("habits");
  const chip = q<HTMLElement>('[data-action="filter"][data-category-id=""]');
  if (!chip) return { ok: false, error: "All filter chip not found" };
  chip.click();
  return { ok: true, categoryId: null };
}

// ---- entity-collection-v1 (habit) --------------------------------------

function entityToggle(args: Record<string, unknown>) {
  const habitId = String(args.habit_id ?? args.entity_id ?? "");
  const card = habitCard(habitId);
  if (!card) return { ok: false, error: `habit not found: ${habitId}` };
  const btn = q('[data-action="toggle-complete"]', card);
  if (!btn) return { ok: false, error: "habit has no one-tap complete control (numeric-target habit uses quantity)" };
  click(btn);
  return { ok: true, habitId };
}

function entityQuantity(args: Record<string, unknown>) {
  const habitId = String(args.habit_id ?? args.entity_id ?? "");
  const delta = Number(args.delta ?? 1);
  const card = habitCard(habitId);
  if (!card) return { ok: false, error: `habit not found: ${habitId}` };
  const btn = q(delta >= 0 ? '[data-action="step-inc"]' : '[data-action="step-dec"]', card);
  if (!btn) return { ok: false, error: "stepper control not found (habit is not numeric-target, or bound)" };
  const steps = Math.max(1, Math.abs(Math.round(delta)));
  for (let i = 0; i < steps; i++) click(btn);
  return { ok: true, habitId, delta };
}

function entityUpdate(args: Record<string, unknown>) {
  const habitId = String(args.habit_id ?? args.entity_id ?? "");
  const card = habitCard(habitId);
  if (!card) return { ok: false, error: `habit not found: ${habitId}` };

  if (args.paused !== undefined) {
    const wantPaused = Boolean(args.paused);
    const isPaused = card.getAttribute("data-habit-paused") === "true";
    if (wantPaused !== isPaused) {
      click(q('[data-action="pause-resume"]', card));
    }
    return { ok: true, habitId, paused: wantPaused };
  }

  if (args.name !== undefined || args.reminder !== undefined) {
    click(q('[data-action="edit"]', card));
    if (args.name !== undefined) {
      const nameInput = q<HTMLInputElement>('[data-field="edit-name"]', card);
      if (nameInput) fireInput(nameInput, String(args.name));
    }
    if (args.reminder !== undefined) {
      const reminderInput = q<HTMLInputElement>('[data-field="edit-reminder"]', card);
      if (reminderInput) fireInput(reminderInput, String(args.reminder));
    }
    click(q('[data-action="save-edit"]', card));
    return { ok: true, habitId, name: args.name, reminder: args.reminder };
  }

  return { ok: false, error: "update requires paused, name, and/or reminder" };
}

async function entityDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) {
    return { ok: false, error: "delete requires confirm=true" };
  }
  const habitId = String(args.habit_id ?? args.entity_id ?? "");
  const card = habitCard(habitId);
  if (!card) return { ok: false, error: `habit not found: ${habitId}` };
  click(q('[data-action="delete"]', card));
  // The confirmation dialog is portaled by React after the initiating click.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const confirm = q('[data-action="confirm-delete"]');
  if (!confirm) return { ok: false, error: "delete confirmation did not open" };
  click(confirm);
  return { ok: true, habitId, deleted: true };
}

// ---- entity-collection-v1 (category, secondary entity) ------------------

function entityCategoryCreate(args: Record<string, unknown>) {
  const name = String(args.name ?? "");
  if (!name.trim()) return { ok: false, error: "category name is required" };
  goToView("habits");
  click(q('[data-action="add-category-toggle"]'));
  const input = q<HTMLInputElement>('[data-field="category-name"]');
  if (!input) return { ok: false, error: "category name field not found" };
  fireInput(input, name);
  click(q('[data-action="add-category-submit"]'));
  return { ok: true, name };
}

function entityCategoryDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: "delete requires confirm=true" };
  const categoryId = String(args.category_id ?? "");
  goToView("habits");
  click(q('[aria-label="Manage categories"]'));
  const btn = q<HTMLElement>(`[data-action="delete-category"][data-category-id="${categoryId}"]`);
  if (!btn) return { ok: false, error: `category not found: ${categoryId}` };
  click(btn);
  return { ok: true, categoryId, deleted: true };
}

// ---- form-workflow-v1 (New Habit) ---------------------------------------

async function formValidate(args: Record<string, unknown>) {
  const form = await ensureHabitFormOpen();
  if (!form) return { ok: false, error: "New Habit form not found" };
  formFillFields(form, (args.fields as Record<string, unknown>) ?? {});
  const nameInput = q<HTMLInputElement>('[data-field="name"]', form);
  const valid = !!nameInput && nameInput.value.trim().length > 0;
  return { ok: true, operation: "validate", valid };
}

function formFillFields(form: HTMLElement, fields: Record<string, unknown>) {
  if (fields.name !== undefined) {
    const el = q<HTMLInputElement>('[data-field="name"]', form);
    if (el) fireInput(el, String(fields.name));
  }
  if (fields.icon !== undefined) {
    const btn = q<HTMLElement>(`[data-field="icon"][data-value="${fields.icon}"]`, form);
    click(btn);
  }
  if (fields["target-type"] !== undefined || fields.targetType !== undefined) {
    const value = String(fields["target-type"] ?? fields.targetType);
    const radio = q<HTMLInputElement>(`[data-field="target-type"][data-value="${value}"]`, form);
    if (radio) {
      radio.click();
    }
  }
  if (fields["target-count"] !== undefined || fields.targetCount !== undefined) {
    const el = q<HTMLInputElement>('[data-field="target-count"]', form);
    if (el) fireInput(el, String(fields["target-count"] ?? fields.targetCount));
  }
  if (fields.category !== undefined || fields.categoryId !== undefined) {
    const el = q<HTMLSelectElement>('[data-field="category"]', form);
    if (el) fireInput(el, String(fields.category ?? fields.categoryId));
  }
  if (fields.reminder !== undefined) {
    const el = q<HTMLInputElement>('[data-field="reminder"]', form);
    if (el) fireInput(el, String(fields.reminder));
  }
}

async function formSubmit(args: Record<string, unknown>) {
  const form = await ensureHabitFormOpen();
  if (!form) return { ok: false, error: "New Habit form not found" };
  formFillFields(form, (args.fields as Record<string, unknown>) ?? {});
  const submitBtn = q<HTMLElement>('[data-action="submit-habit"]', form);
  if (!submitBtn) return { ok: false, error: "submit control not found" };
  click(submitBtn);
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (!q("[data-habit-form]") || q("[aria-invalid='true']")) break;
  }
  // The real handler blocks blank-name submits and keeps the form open with
  // an inline error instead of closing it — report that faithfully.
  const stillOpen = !!q("[data-habit-form]");
  const hasError = !!q('[role="alert"]', document.body) && !!q("[aria-invalid='true']");
  return { ok: true, operation: "submit", submitted: !stillOpen, blockedByValidation: stillOpen && hasError };
}

function formCancel(_args: Record<string, unknown>) {
  const form = q<HTMLElement>("[data-habit-form]");
  if (!form) return { ok: true, operation: "cancel", wasOpen: false };
  const cancelBtn = q<HTMLElement>('[data-action="cancel-habit"]', form);
  click(cancelBtn);
  return { ok: true, operation: "cancel", wasOpen: true };
}

// ---- artifact-transfer-v1 (export / import / recovery sample) ----------

function artifactExport(_args: Record<string, unknown>) {
  goToView("import");
  const btn = q<HTMLElement>('[data-action="export"]');
  if (!btn) return { ok: false, error: "export control not found" };
  click(btn);
  return { ok: true, operation: "export" };
}

function artifactImport(args: Record<string, unknown>) {
  goToView("import");
  const mode = String(args.mode ?? "malformed-sample");
  if (mode === "malformed-sample") {
    const btn = q<HTMLElement>('[data-action="load-malformed"]');
    if (!btn) return { ok: false, error: "Load Malformed Sample control not found" };
    click(btn);
    const alertEl = q('[role="alert"]');
    return {
      ok: true,
      operation: "import",
      mode,
      recoveryAnnounced: !!alertEl,
      recoveryText: alertEl?.textContent ?? null,
    };
  }
  // "file" mode requires a real file picker, which is a Playwright/browser
  // responsibility per artifact-transfer-v1's restrictions (no raw file
  // contents in WebMCP args). Report that honestly instead of faking it.
  return {
    ok: false,
    error: "file import requires a real file picker; drive it via Playwright, not WebMCP",
  };
}

function artifactImportConfirm(args: Record<string, unknown>) {
  if (args.confirm !== true) return { ok: false, error: "import confirm requires confirm=true" };
  const btn = q<HTMLElement>('[data-action="confirm-import"]');
  if (!btn) return { ok: false, error: "no pending import confirmation dialog is open" };
  click(btn);
  return { ok: true, operation: "confirm-import" };
}

// ---- recovery (RecoveryBanner: Retry / Reset) ---------------------------

function recoveryRetry(_args: Record<string, unknown>) {
  const btn = q<HTMLElement>('[data-action="recovery-retry"]');
  if (!btn) return { ok: false, error: "no active recovery banner" };
  click(btn);
  return { ok: true, operation: "retry" };
}

function recoveryReset(_args: Record<string, unknown>) {
  const btn = q<HTMLElement>('[data-action="recovery-reset"]');
  if (!btn) return { ok: false, error: "no active recovery banner" };
  click(btn);
  return { ok: true, operation: "reset" };
}

// ---- exact compiler-shaped registry -------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;
type Tool = { name: string; description: string; inputSchema: Record<string, unknown>; handler: Handler; allowedFields?: string[] };
const destinations = ["habits", "stats", "import", "heatmap"];
const filters = ["category"];
const entityFields = ["name", "reminder", "paused"];
const formFields = ["name", "icon", "target-type", "target-count", "category", "reminder"];
const objectSchema = (properties: Record<string, unknown> = {}, required: string[] = []) => ({ type: "object", additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const fieldsSchema = { type: "object", additionalProperties: { type: "string", maxLength: 200 } };
const emptySchema = objectSchema();

const TOOLS: Tool[] = [
  { name: "browse.open", description: "Open a declared destination (route, tab, section, or item).", inputSchema: objectSchema({ destination: { type: "string", enum: destinations, description: "Declared destination" } }, ["destination"]), handler: browseOpen },
  { name: "browse.search", description: "Search within the browsable surface.", inputSchema: objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"]), handler: () => ({ ok: false, error: "LoopDaily has no visible search control" }) },
  { name: "browse.apply_filter", description: "Apply a declared filter.", inputSchema: objectSchema({ filter: { type: "string", enum: filters }, value: { type: "string", maxLength: 200 } }, ["filter"]), handler: ({ value }) => browseApplyFilter({ category_id: value || "" }) },
  { name: "browse.clear_filter", description: "Clear one or all declared filters.", inputSchema: objectSchema({ filter: { type: "string", enum: filters } }), handler: browseClearFilter },
  { name: "entity.update", description: "Update declared fields on an entity.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, fields: fieldsSchema }, ["id", "fields"]), allowedFields: entityFields, handler: ({ id, fields = {} }) => { const patch = fields as Record<string, unknown>; if (patch.paused !== undefined && patch.paused !== "true" && patch.paused !== "false") return { ok: false, error: "paused must be true or false" }; return entityUpdate({ habit_id: id, ...patch, paused: patch.paused === undefined ? undefined : patch.paused === "true" }); } },
  { name: "entity.delete", description: "Delete an entity with explicit confirmation.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, confirm: { type: "boolean", const: true } }, ["id", "confirm"]), handler: async ({ id, confirm }) => { const result = await entityDelete({ habit_id: id, confirm }); if (!result.ok) return result; await new Promise((resolve) => setTimeout(resolve, 240)); return habitCard(String(id)) ? { ok: false, error: "Habit remained after confirmation" } : result; } },
  { name: "entity.toggle", description: "Toggle a boolean field on an entity.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, field: { type: "string", enum: entityFields } }, ["id"]), handler: ({ id }) => entityToggle({ habit_id: id }) },
  { name: "entity.quantity", description: "Adjust quantity for an entity.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, quantity: { type: "number" } }, ["id", "quantity"]), handler: ({ id, quantity }) => { if (typeof quantity !== "number" || !Number.isFinite(quantity)) return { ok: false, error: "quantity must be a finite number" }; const card = habitCard(String(id)); if (!card) return { ok: false, error: `habit not found: ${id}` }; const current = Number(card.dataset.habitCount || 0); return entityQuantity({ habit_id: id, delta: Math.round(quantity) - current }); } },
  { name: "form.validate", description: "Run declared form validation.", inputSchema: objectSchema({ fields: fieldsSchema }), allowedFields: formFields, handler: formValidate },
  { name: "form.submit", description: "Submit the form through the visible handler.", inputSchema: objectSchema({ fields: fieldsSchema }), allowedFields: formFields, handler: formSubmit },
  { name: "form.cancel", description: "Cancel the active form workflow.", inputSchema: emptySchema, handler: formCancel },
  { name: "artifact.import", description: "Start a declared import mode (no file bytes in WebMCP).", inputSchema: objectSchema({ mode: { type: "string", enum: ["file", "malformed-sample"] } }, ["mode"]), handler: artifactImport },
  { name: "artifact.export", description: "Export using a declared format (no blob/base64 in results).", inputSchema: objectSchema({ format: { type: "string", enum: ["json"] } }, ["format"]), handler: artifactExport },
];

function validateInput(tool: Tool, input: Record<string, unknown>) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "arguments must be an object";
  const properties = (tool.inputSchema.properties || {}) as Record<string, Record<string, unknown>>;
  const unknown = Object.keys(input).find((key) => !(key in properties)); if (unknown) return `unknown argument: ${unknown}`;
  const missing = ((tool.inputSchema.required || []) as string[]).find((key) => input[key] === undefined); if (missing) return `missing required argument: ${missing}`;
  for (const [key, rule] of Object.entries(properties)) {
    const value = input[key]; if (value === undefined) continue;
    if (rule.type === "string" && typeof value !== "string") return `${key} must be a string`;
    if (rule.type === "boolean" && typeof value !== "boolean") return `${key} must be a boolean`;
    if (rule.type === "number" && typeof value !== "number") return `${key} must be a number`;
    if (rule.enum && !(rule.enum as unknown[]).includes(value)) return `${key} is outside the declared enum`;
    if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`;
    if (rule.type === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) return `${key} must be an object`;
      const values = value as Record<string, unknown>;
      const badField = tool.allowedFields && Object.keys(values).find((field) => !tool.allowedFields!.includes(field)); if (badField) return `Unknown field: ${badField}`;
      const badValue = Object.entries(values).find(([, fieldValue]) => typeof fieldValue !== "string" || fieldValue.length > 200); if (badValue) return `${key}.${badValue[0]} must be a string of at most 200 characters`;
    }
  }
  return "";
}

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
    tool_names: TOOLS.map((t) => t.name),
    tool_count: TOOLS.length,
  });
  w.webmcp_list_tools = () => TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  w.webmcp_invoke_tool = async (name: string | { name?: string; arguments?: Record<string, unknown> }, args: Record<string, unknown> = {}) => {
    if (name && typeof name === "object") { args = name.arguments || {}; name = name.name || ""; }
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown_tool: ${name}` };
    const error = validateInput(tool, args); if (error) return { ok: false, error };
    try {
      return await tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String((err as Error)?.message || err) };
    }
  };
  try {
    const modelContext = (navigator as unknown as { modelContext?: { registerTool: (tool: Record<string, unknown>) => void } }).modelContext;
    if (modelContext?.registerTool) TOOLS.forEach((tool) => modelContext.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, invoke: (args: Record<string, unknown>) => (w.webmcp_invoke_tool as Function)(tool.name, args || {}) }));
  } catch { /* Window bridge remains available without native registration. */ }
}
