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

function ensureHabitFormOpen(): HTMLElement | null {
  let form = q<HTMLElement>("[data-habit-form]");
  if (form) return form;
  const opener =
    q<HTMLElement>('[data-action="open-habit-form"]') ||
    q<HTMLElement>('[data-action="submit-habit"]');
  click(opener);
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
    const habitId = String(args.habit_id ?? args.entity_id ?? "");
    if (!habitId) return { ok: false, error: "heatmap destination requires habit_id" };
    goToView("habits");
    const card = habitCard(habitId);
    if (!card) return { ok: false, error: `habit not found: ${habitId}` };
    click(q('[data-action="menu-toggle"]', card));
    const btn = q('[data-action="view-heatmap"]', card);
    if (!btn) return { ok: false, error: "view-heatmap control not found" };
    click(btn);
    return { ok: true, destination, habitId };
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
      click(q('[data-action="menu-toggle"]', card));
      click(q('[data-action="pause-resume"]', card));
    }
    return { ok: true, habitId, paused: wantPaused };
  }

  if (args.name !== undefined || args.reminder !== undefined) {
    click(q('[data-action="menu-toggle"]', card));
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

function entityDelete(args: Record<string, unknown>) {
  if (args.confirm !== true) {
    return { ok: false, error: "delete requires confirm=true" };
  }
  const habitId = String(args.habit_id ?? args.entity_id ?? "");
  const card = habitCard(habitId);
  if (!card) return { ok: false, error: `habit not found: ${habitId}` };
  click(q('[data-action="menu-toggle"]', card));
  click(q('[data-action="delete"]', card));
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

function formValidate(args: Record<string, unknown>) {
  const form = ensureHabitFormOpen();
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

function formSubmit(args: Record<string, unknown>) {
  const form = ensureHabitFormOpen();
  if (!form) return { ok: false, error: "New Habit form not found" };
  formFillFields(form, (args.fields as Record<string, unknown>) ?? {});
  const submitBtn = q<HTMLElement>('[data-action="submit-habit"]', form);
  if (!submitBtn) return { ok: false, error: "submit control not found" };
  click(submitBtn);
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

// ---- registry ------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "browse-open",
    description:
      "Switch the main canvas (args.destination: habits|stats|import|heatmap; heatmap requires args.habit_id) via the same nav tabs / per-habit menu the UI uses.",
    handler: browseOpen,
  },
  {
    name: "browse-apply_filter",
    description: "Click the category filter chip for args.category_id (a real category id) to show only that category's habits.",
    handler: browseApplyFilter,
  },
  {
    name: "browse-clear_filter",
    description: "Click the \"All\" filter chip to clear the active category filter.",
    handler: browseClearFilter,
  },
  {
    name: "entity-toggle",
    description: "Tap a \"Once a day\" habit's one-tap complete control (args.habit_id) to mark/unmark today done.",
    handler: entityToggle,
  },
  {
    name: "entity-quantity",
    description: "Tap a numeric-target habit's stepper (args.habit_id, args.delta: positive for +1, negative for -1) the requested number of times.",
    handler: entityQuantity,
  },
  {
    name: "entity-update",
    description: "Update a habit (args.habit_id) via its real menu: args.paused toggles Pause/Resume; args.name/args.reminder edits and saves via the real inline editor.",
    handler: entityUpdate,
  },
  {
    name: "entity-delete",
    description: "Delete a habit (args.habit_id) via its real menu's Delete action. Requires args.confirm=true.",
    handler: entityDelete,
  },
  {
    name: "entity-category_create",
    description: "Create a category (args.name) via the real + Category form.",
    handler: entityCategoryCreate,
  },
  {
    name: "entity-category_delete",
    description: "Delete a category (args.category_id) via the real Manage categories panel. Requires args.confirm=true.",
    handler: entityCategoryDelete,
  },
  {
    name: "form-validate",
    description: "Open the New Habit form, fill optional args.fields (name, icon, target-type, target-count, category, reminder), and report whether the name field is non-blank.",
    handler: formValidate,
  },
  {
    name: "form-submit",
    description: "Open the New Habit form, fill optional args.fields, and submit via the real form element (the same blank-name validation applies).",
    handler: formSubmit,
  },
  {
    name: "form-cancel",
    description: "Click Cancel on the open New Habit form.",
    handler: formCancel,
  },
  {
    name: "artifact-export",
    description: "Click \"Export as JSON\" on the Data view to trigger the real Blob/anchor download.",
    handler: artifactExport,
  },
  {
    name: "artifact-import",
    description: "args.mode: \"malformed-sample\" clicks the real \"Load Malformed Sample\" recovery control and reports the role=alert outcome; \"file\" is refused (real file picker required, driven via Playwright).",
    handler: artifactImport,
  },
  {
    name: "artifact-import_confirm",
    description: "Confirm a pending Import & replace dialog. Requires args.confirm=true.",
    handler: artifactImportConfirm,
  },
  {
    name: "artifact-recovery_retry",
    description: "Click Retry on the active data-recovery banner.",
    handler: recoveryRetry,
  },
  {
    name: "artifact-recovery_reset",
    description: "Click Reset on the active data-recovery banner.",
    handler: recoveryReset,
  },
];

export function initWebMcp() {
  (window as any).webmcp_session_info = function webmcp_session_info() { return {
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
    tools: TOOLS.map((t) => t.name),
  }; };
  (window as any).webmcp_list_tools = function webmcp_list_tools() { return TOOLS.map((t) => ({ name: t.name, description: t.description })); };
  (window as any).webmcp_invoke_tool = function webmcp_invoke_tool(name: string, args: Record<string, unknown> = {}) {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
