import type { ModuleId } from "../constants.js";
import type { CompiledTool, ModuleFactory } from "../types.js";
import { BindingValidationError } from "../errors.js";
import { artifactTransferV1 } from "./artifact-transfer-v1.js";
import { browseQueryV1 } from "./browse-query-v1.js";
import { commandSessionV1 } from "./command-session-v1.js";
import { entityCollectionV1 } from "./entity-collection-v1.js";
import { formWorkflowV1 } from "./form-workflow-v1.js";
import { structuredEditorV1 } from "./structured-editor-v1.js";

export { artifactTransferV1 } from "./artifact-transfer-v1.js";
export { browseQueryV1 } from "./browse-query-v1.js";
export { commandSessionV1 } from "./command-session-v1.js";
export { entityCollectionV1 } from "./entity-collection-v1.js";
export { formWorkflowV1 } from "./form-workflow-v1.js";
export { structuredEditorV1 } from "./structured-editor-v1.js";
export type { BrowseQueryBindings, BrowseQueryHandlers } from "./browse-query-v1.js";
export type {
  EntityCollectionBindings,
  EntityCollectionHandlers,
} from "./entity-collection-v1.js";
export type {
  FormWorkflowBindings,
  FormWorkflowHandlers,
} from "./form-workflow-v1.js";
export type {
  StructuredEditorBindings,
  StructuredEditorHandlers,
} from "./structured-editor-v1.js";
export type {
  CommandSessionBindings,
  CommandSessionHandlers,
} from "./command-session-v1.js";
export type {
  ArtifactTransferBindings,
  ArtifactTransferHandlers,
} from "./artifact-transfer-v1.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODULE_FACTORIES: Record<ModuleId, ModuleFactory<any, any>> = {
  "browse-query-v1": browseQueryV1,
  "entity-collection-v1": entityCollectionV1,
  "form-workflow-v1": formWorkflowV1,
  "structured-editor-v1": structuredEditorV1,
  "command-session-v1": commandSessionV1,
  "artifact-transfer-v1": artifactTransferV1,
};

export type ModuleHandlersById = {
  "browse-query-v1": import("./browse-query-v1.js").BrowseQueryHandlers;
  "entity-collection-v1": import("./entity-collection-v1.js").EntityCollectionHandlers;
  "form-workflow-v1": import("./form-workflow-v1.js").FormWorkflowHandlers;
  "structured-editor-v1": import("./structured-editor-v1.js").StructuredEditorHandlers;
  "command-session-v1": import("./command-session-v1.js").CommandSessionHandlers;
  "artifact-transfer-v1": import("./artifact-transfer-v1.js").ArtifactTransferHandlers;
};

/**
 * Compile selected modules against shared product bindings + builder handlers.
 * Handlers must be the same functions wired to visible controls.
 */
/** Binding keys accepted by each module (for multi-module composition). */
export const MODULE_BINDING_KEYS: Record<ModuleId, readonly string[]> = {
  "browse-query-v1": [
    "browsable_entity",
    "destinations",
    "filters",
    "sorts",
    "locales",
    "themes",
    "visible_postconditions",
  ],
  "entity-collection-v1": [
    "entity",
    "entity_operations",
    "entity_fields",
    "value_bounds",
    "visible_postconditions",
  ],
  "form-workflow-v1": [
    "form_fields",
    "form_operations",
    "workflow_steps",
    "value_bounds",
    "visible_postconditions",
  ],
  "structured-editor-v1": [
    "editor_object_types",
    "editor_properties",
    "editor_modes",
    "editor_operations",
    "value_bounds",
    "visible_postconditions",
  ],
  "command-session-v1": [
    "session_operations",
    "demos",
    "visible_postconditions",
  ],
  "artifact-transfer-v1": [
    "artifact_operations",
    "import_modes",
    "export_formats",
    "conversion_modes",
    "visible_postconditions",
  ],
};

function pickModuleBindings(
  bindings: Record<string, unknown>,
  moduleId: ModuleId,
): Record<string, unknown> {
  const allowed = new Set(MODULE_BINDING_KEYS[moduleId]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(bindings)) {
    if (allowed.has(key)) out[key] = value;
  }
  return out;
}

function assertNoForeignKeys(
  bindings: Record<string, unknown>,
  moduleIds: ModuleId[],
): void {
  const union = new Set<string>();
  for (const id of moduleIds) {
    for (const k of MODULE_BINDING_KEYS[id]) union.add(k);
  }
  for (const key of Object.keys(bindings)) {
    if (!union.has(key)) {
      throw new BindingValidationError(
        `Unknown binding key "${key}" for modules [${moduleIds.join(", ")}]`,
      );
    }
  }
}

export function compileModules(
  moduleIds: ModuleId[],
  bindings: Record<string, unknown>,
  handlers: Partial<ModuleHandlersById> = {},
): CompiledTool[] {
  if (moduleIds.length < 1 || moduleIds.length > 4) {
    throw new BindingValidationError("Select between 1 and 4 modules");
  }
  const seen = new Set<ModuleId>();
  assertNoForeignKeys(bindings, moduleIds);
  const tools: CompiledTool[] = [];
  for (const id of moduleIds) {
    if (seen.has(id)) {
      throw new BindingValidationError(`Duplicate module: ${id}`);
    }
    seen.add(id);
    const factory = MODULE_FACTORIES[id];
    if (!factory) {
      throw new BindingValidationError(`Unknown module: ${id}`);
    }
    const sliced = pickModuleBindings(bindings, id);
    const validated = factory.validateBindings(sliced);
    const compiled = factory.compile(validated, handlers[id] ?? {});
    tools.push(...compiled);
  }
  return tools;
}
