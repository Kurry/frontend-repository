import { tasks, getTask, getTrial } from "./seed";
import {
  useReviewStore,
  currentContext,
  buildReviewPackage,
  buildMemo,
  summaryCounts,
  computeRollup,
} from "./store";
import { adjudicationFormSchema, bulkSchema, classifications } from "./schemas";

const destinations = [
  "task-list",
  "task-detail",
  "review-workspace",
  "agent-trajectory-pane",
  "scorer-trajectory-pane",
  "verdict-table",
  "export-drawer",
  "import-surface",
  "command-palette",
];
const filters = ["active-label", "comparison-labels", "flips-only"];
const allTrials = tasks.flatMap((task) =>
  task.trials.map((trial) => ({ task, trial })),
);

function result(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

function unavailable(operation, reason) {
  return result({ ok: false, operation, unavailable: true, reason });
}

function active() {
  return currentContext(useReviewStore.getState());
}

function findTrial(trialId) {
  return allTrials.find((item) => item.trial.id === trialId);
}

function navigate(destination, args = {}) {
  const store = useReviewStore.getState();
  if (destination === "task-list") store.backToTasks();
  if (destination === "task-detail") {
    const taskId = args.taskId || store.activeTaskId;
    if (!getTask(taskId))
      return {
        ok: false,
        field: "taskId",
        error: "taskId must name a seeded task",
      };
    store.selectTask(taskId);
  }
  if (destination === "review-workspace") {
    const found = findTrial(args.trialId || store.activeTrialId);
    if (!found)
      return {
        ok: false,
        field: "trialId",
        error: "trialId must name a seeded trial",
      };
    store.selectTask(found.task.id);
    store.openTrial(found.trial.id);
  }
  if (
    [
      "agent-trajectory-pane",
      "scorer-trajectory-pane",
      "verdict-table",
      "export-drawer",
      "import-surface",
      "command-palette",
    ].includes(destination) &&
    !store.activeTrialId
  )
    return {
      ok: false,
      field: "destination",
      error: "Open a trial before this destination",
    };
  if (destination === "agent-trajectory-pane") store.setFocusedPane("agent");
  if (destination === "scorer-trajectory-pane") store.setFocusedPane("scorer");
  if (destination === "verdict-table")
    setTimeout(
      () =>
        document
          .getElementById("verdict-table")
          ?.scrollIntoView({ block: "start" }),
      0,
    );
  if (destination === "export-drawer") store.openOverlay("export");
  if (destination === "import-surface") store.openOverlay("import");
  if (destination === "command-palette") store.openOverlay("palette");
  return { ok: true, destination, visible: true };
}

function applyFilter(args) {
  const store = useReviewStore.getState();
  const { trial, ui } = active();
  if (!trial)
    return { ok: false, error: "Open a trial before applying a filter" };
  if (args.filter === "active-label") {
    if (!trial.labelNames.includes(args.value))
      return {
        ok: false,
        field: "value",
        error: "value must name a scoring label in this trial",
      };
    store.setActiveLabel(args.value);
  } else if (args.filter === "comparison-labels") {
    if (
      !Array.isArray(args.values) ||
      args.values.length !== 2 ||
      args.values[0] === args.values[1] ||
      args.values.some((v) => !trial.labelNames.includes(v))
    )
      return {
        ok: false,
        field: "values",
        error: "values must contain exactly two distinct trial labels",
      };
    store.patchTrial(trial.id, {
      comparedLabels: [...args.values],
      selectedFlips: [],
    });
  } else if (args.filter === "flips-only") {
    const desired = args.enabled !== false;
    if (ui.flipsOnly !== desired) store.toggleFlips();
  } else return { ok: false, field: "filter", error: "filter is not declared" };
  return { ok: true, filter: args.filter, visible: true };
}

function clearFilter(filter) {
  const store = useReviewStore.getState();
  const { trial, ui } = active();
  if (!trial)
    return { ok: false, error: "Open a trial before clearing a filter" };
  if (filter === "active-label") store.setActiveLabel(trial.labelNames[0]);
  else if (filter === "comparison-labels")
    store.patchTrial(trial.id, {
      comparedLabels: [trial.labelNames[0], trial.labelNames[1]],
      selectedFlips: [],
    });
  else if (filter === "flips-only" && ui.flipsOnly) store.clearFlips();
  else if (!filters.includes(filter))
    return { ok: false, field: "filter", error: "filter is not declared" };
  return { ok: true, filter, cleared: true };
}

function adjudicationBody(args) {
  const { trial } = active();
  if (!trial)
    return {
      success: false,
      errors: ["trialId: open a trial before adjudicating"],
    };
  const candidate = {
    criterionId: args.criterionId,
    classification: args.classification,
    rationale: args.rationale,
    evidenceStepIds: args.evidenceStepIds,
  };
  const parsed = adjudicationFormSchema.safeParse(candidate);
  if (!parsed.success)
    return {
      success: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  if (
    !trial.criteria.some(
      (criterion) => criterion.id === parsed.data.criterionId,
    )
  )
    return {
      success: false,
      errors: ["criterionId: must exist in the active trial"],
    };
  const maxIndex =
    Math.max(trial.agentSteps.length, trial.scorerSteps.length) - 1;
  if (parsed.data.evidenceStepIds?.some((id) => id > maxIndex))
    return {
      success: false,
      errors: [`evidenceStepIds: entries must exist between 0 and ${maxIndex}`],
    };
  return {
    success: true,
    body: {
      ...parsed.data,
      rationale: parsed.data.rationale.trim(),
      reviewedAt: new Date().toISOString(),
    },
  };
}

function recordOne(args, mode) {
  const checked = adjudicationBody(args);
  if (!checked.success) return { ok: false, errors: checked.errors };
  useReviewStore
    .getState()
    .recordAdjudications(
      [checked.body],
      mode === "update" ? "Replaced adjudication" : "Recorded adjudication",
    );
  const { ui } = active();
  return {
    ok: true,
    adjudication: checked.body,
    summaryCounts: summaryCounts(ui.adjudications),
    visible: true,
  };
}

const definitions = [
  {
    name: "browse_open",
    description:
      "Open a declared Traceframe destination using the same navigation handlers as the visible UI.",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string", enum: destinations },
        taskId: { type: "string", enum: tasks.map((t) => t.id) },
        trialId: { type: "string", enum: allTrials.map((x) => x.trial.id) },
      },
      required: ["destination"],
      additionalProperties: false,
    },
    execute: (args) => result(navigate(args.destination, args)),
  },
  {
    name: "browse_search",
    description: "Search the bounded seeded task and trial catalog.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", minLength: 1, maxLength: 120 } },
      required: ["query"],
      additionalProperties: false,
    },
    execute: ({ query }) => {
      const q = query.toLowerCase();
      return result({
        ok: true,
        matches: allTrials
          .filter(({ task, trial }) =>
            `${task.id} ${task.title} ${trial.id} ${trial.model}`
              .toLowerCase()
              .includes(q),
          )
          .map(({ task, trial }) => ({
            taskId: task.id,
            trialId: trial.id,
            model: trial.model,
          })),
      });
    },
  },
  {
    name: "browse_apply_filter",
    description: "Apply a declared review filter with the visible UI handler.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", enum: filters },
        value: { type: "string", maxLength: 80 },
        values: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "string", maxLength: 80 },
        },
        enabled: { type: "boolean" },
      },
      required: ["filter"],
      additionalProperties: false,
    },
    execute: (args) => result(applyFilter(args)),
  },
  {
    name: "browse_clear_filter",
    description: "Clear one declared review filter.",
    inputSchema: {
      type: "object",
      properties: { filter: { type: "string", enum: filters } },
      required: ["filter"],
      additionalProperties: false,
    },
    execute: ({ filter }) => result(clearFilter(filter)),
  },
  {
    name: "browse_sort",
    description: "Report sort availability for this fixed benchmark register.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable("sort", "No sort binding is declared for this product."),
  },
  {
    name: "browse_set_locale",
    description:
      "Report locale availability for this single-locale review surface.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "set_locale",
        "No locale binding is declared for this product.",
      ),
  },
  {
    name: "browse_set_theme",
    description:
      "Report theme availability for the fixed review instrument theme.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "set_theme",
        "No theme binding is declared for this product.",
      ),
  },

  {
    name: "entity_create",
    description:
      "Create one adjudication with the same validation and mutation handler as the visible form.",
    inputSchema: adjudicationInputSchema(),
    execute: (args) => result(recordOne(args, "create")),
  },
  {
    name: "entity_update",
    description:
      "Replace an existing criterion adjudication using the visible mutation handler.",
    inputSchema: adjudicationInputSchema(),
    execute: (args) => result(recordOne(args, "update")),
  },
  {
    name: "entity_select",
    description:
      "Select a criterion and link its agent and scorer evidence steps.",
    inputSchema: {
      type: "object",
      properties: {
        criterionId: { type: "string", minLength: 1, maxLength: 40 },
      },
      required: ["criterionId"],
      additionalProperties: false,
    },
    execute: ({ criterionId }) => {
      const { trial } = active();
      if (!trial?.criteria.some((c) => c.id === criterionId))
        return result({
          ok: false,
          field: "criterionId",
          error: "criterionId must exist in the active trial",
        });
      useReviewStore.getState().selectCriterion(criterionId);
      const { ui } = active();
      return result({
        ok: true,
        criterionId,
        agentStepIndex: ui.agentStep,
        scorerStepIndex: ui.scorerStep,
        visible: true,
      });
    },
  },
  {
    name: "entity_delete",
    description: "Report adjudication deletion availability.",
    inputSchema: {
      type: "object",
      properties: { confirm: { type: "boolean" } },
      required: ["confirm"],
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "delete",
        "Delete is not a declared adjudication operation; use Undo for session mutations.",
      ),
  },
  {
    name: "entity_toggle",
    description: "Report entity toggle availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable("toggle", "Toggle is not a declared adjudication operation."),
  },
  {
    name: "entity_quantity",
    description: "Report entity quantity availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "quantity",
        "Quantity is not a declared adjudication operation.",
      ),
  },
  {
    name: "entity_reorder",
    description: "Report entity reorder availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "reorder",
        "Reorder is not a declared adjudication operation.",
      ),
  },

  {
    name: "form_validate",
    description:
      "Validate classification and rationale with the same Zod contract as visible adjudication forms.",
    inputSchema: {
      type: "object",
      properties: {
        classification: { type: "string", enum: classifications },
        rationale: { type: "string", maxLength: 2200 },
      },
      additionalProperties: false,
    },
    execute: (args) => {
      const parsed = bulkSchema.safeParse(args);
      return result(
        parsed.success
          ? { ok: true, valid: true }
          : {
              ok: false,
              valid: false,
              errors: parsed.error.issues.map(
                (i) => `${i.path.join(".")}: ${i.message}`,
              ),
            },
      );
    },
  },
  {
    name: "form_submit",
    description:
      "Submit a single adjudication through the same domain command as the visible form.",
    inputSchema: adjudicationInputSchema(),
    execute: (args) => result(recordOne(args, "create")),
  },
  {
    name: "form_cancel",
    description: "Cancel the currently open import or export workflow.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () => {
      const store = useReviewStore.getState();
      store.closeOverlay("import");
      store.closeOverlay("export");
      return result({ ok: true, cancelled: true, visible: true });
    },
  },
  {
    name: "form_reset",
    description: "Reset the review package import draft and visible errors.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () => {
      const store = useReviewStore.getState();
      store.setImportDraft("");
      store.setImportErrors([]);
      return result({ ok: true, reset: true });
    },
  },
  {
    name: "form_advance",
    description: "Report multi-step form availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable("advance", "No multi-step form binding is declared."),
  },
  {
    name: "form_return",
    description: "Report multi-step form return availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable("return", "No multi-step form binding is declared."),
  },

  {
    name: "artifact_export",
    description:
      "Open the live export preview for a declared review package format; artifact content remains in the visible drawer.",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["review-package-json", "review-memo-markdown"],
        },
      },
      required: ["format"],
      additionalProperties: false,
    },
    execute: ({ format }) => {
      const store = useReviewStore.getState();
      if (!store.activeTrialId)
        return result({ ok: false, error: "Open a trial before export" });
      store.setExportTab(format === "review-package-json" ? "json" : "memo");
      store.openOverlay("export");
      const pkg = buildReviewPackage(store);
      return result({
        ok: true,
        format,
        previewVisible: true,
        trialId: pkg.trialId,
        adjudicationCount: pkg.adjudications.length,
      });
    },
  },
  {
    name: "artifact_import",
    description:
      "Open the review-package import surface; pasted artifact contents remain a Playwright responsibility.",
    inputSchema: {
      type: "object",
      properties: { mode: { type: "string", enum: ["review-package"] } },
      required: ["mode"],
      additionalProperties: false,
    },
    execute: () => {
      const store = useReviewStore.getState();
      if (!store.activeTrialId)
        return result({ ok: false, error: "Open a trial before import" });
      store.openOverlay("import");
      return result({ ok: true, mode: "review-package", surfaceVisible: true });
    },
  },
  {
    name: "artifact_copy",
    description:
      "Open the requested export preview ready for the visible Copy control; clipboard content is excluded from WebMCP.",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["review-package-json", "review-memo-markdown"],
        },
      },
      required: ["format"],
      additionalProperties: false,
    },
    execute: ({ format }) => {
      const store = useReviewStore.getState();
      store.setExportTab(format === "review-package-json" ? "json" : "memo");
      store.openOverlay("export");
      return result({
        ok: true,
        format,
        previewVisible: true,
        clipboardActionRequired: true,
      });
    },
  },
  {
    name: "artifact_print_preview",
    description: "Report print preview availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "print_preview",
        "Print preview is not a declared artifact operation.",
      ),
  },
  {
    name: "artifact_convert",
    description: "Report conversion availability.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: () =>
      unavailable(
        "convert",
        "Conversion is not a declared artifact operation.",
      ),
  },
];

function adjudicationInputSchema() {
  return {
    type: "object",
    properties: {
      criterionId: { type: "string", minLength: 1, maxLength: 40 },
      classification: { type: "string", enum: classifications },
      rationale: { type: "string", minLength: 20, maxLength: 2000 },
      evidenceStepIds: {
        type: "array",
        minItems: 1,
        items: { type: "integer", minimum: 0 },
      },
    },
    required: ["criterionId", "classification", "rationale"],
    additionalProperties: false,
  };
}

let registered = false;

export function registerWebMCP() {
  window.webmcp_session_info = async () => ({
    contractVersion: "zto-webmcp-v1",
    modules: [
      "browse-query-v1",
      "entity-collection-v1",
      "form-workflow-v1",
      "artifact-transfer-v1",
    ],
    toolNames: definitions.map((definition) => definition.name),
  });
  window.webmcp_list_tools = async () =>
    definitions.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  window.webmcp_invoke_tool = async (nameOrRequest, maybeArguments = {}) => {
    const name =
      typeof nameOrRequest === "object" ? nameOrRequest.name : nameOrRequest;
    const args =
      typeof nameOrRequest === "object"
        ? (nameOrRequest.arguments ?? {})
        : maybeArguments;
    const definition = definitions.find((candidate) => candidate.name === name);
    if (!definition) throw new Error(`Unknown WebMCP tool: ${name}`);
    return definition.execute(args);
  };
  if (registered) return;
  const context = navigator.modelContext || window.modelContext;
  if (!context?.registerTool) return;
  registered = true;
  for (const definition of definitions) {
    try {
      context.registerTool(definition);
    } catch (error) {
      try {
        context.registerTool(
          {
            name: definition.name,
            description: definition.description,
            inputSchema: definition.inputSchema,
          },
          definition.execute,
        );
      } catch {
        /* Older browsers without WebMCP remain fully usable through the visible UI. */
      }
    }
  }
}
