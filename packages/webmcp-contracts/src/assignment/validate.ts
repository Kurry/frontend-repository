import {
  CONTRACT_VERSION,
  MAX_MODULES,
  MIN_MODULES,
  MODULE_IDS,
  type ModuleId,
} from "../constants.js";
import { BindingValidationError } from "../errors.js";
import {
  MODULE_BINDING_KEYS,
  MODULE_FACTORIES,
} from "../modules/index.js";
import type { AssignmentMapEntry } from "../types.js";

const TASK_PATTERN = /^frontend-[a-z0-9-]+$/;

export function isModuleId(value: string): value is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(value);
}

/** Validate an assignment-map entry shape and that selected modules accept bindings. */
export function validateAssignmentEntry(
  entry: unknown,
): AssignmentMapEntry {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new BindingValidationError("assignment entry must be an object");
  }
  const obj = entry as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (
      !["task", "modules", "bindings", "mechanics_exclusions"].includes(key)
    ) {
      throw new BindingValidationError(`Unknown assignment key: ${key}`);
    }
  }

  if (typeof obj.task !== "string" || !TASK_PATTERN.test(obj.task)) {
    throw new BindingValidationError(
      'task must match /^frontend-[a-z0-9-]+$/',
    );
  }

  if (!Array.isArray(obj.modules) || obj.modules.length < MIN_MODULES) {
    throw new BindingValidationError(
      `modules must contain ${MIN_MODULES}–${MAX_MODULES} items`,
    );
  }
  if (obj.modules.length > MAX_MODULES) {
    throw new BindingValidationError(
      `modules must contain ${MIN_MODULES}–${MAX_MODULES} items`,
    );
  }

  const modules: ModuleId[] = [];
  const seen = new Set<string>();
  for (const m of obj.modules) {
    if (typeof m !== "string" || !isModuleId(m)) {
      throw new BindingValidationError(`Unknown module: ${String(m)}`);
    }
    if (seen.has(m)) {
      throw new BindingValidationError(`Duplicate module: ${m}`);
    }
    seen.add(m);
    modules.push(m);
  }

  if (!obj.bindings || typeof obj.bindings !== "object" || Array.isArray(obj.bindings)) {
    throw new BindingValidationError("bindings must be an object");
  }
  if (!Array.isArray(obj.mechanics_exclusions)) {
    throw new BindingValidationError("mechanics_exclusions must be an array");
  }
  for (const item of obj.mechanics_exclusions) {
    if (typeof item !== "string" || !item) {
      throw new BindingValidationError(
        "mechanics_exclusions items must be non-empty strings",
      );
    }
  }

  const bindings = obj.bindings as Record<string, unknown>;
  const union = new Set<string>();
  for (const id of modules) {
    for (const k of MODULE_BINDING_KEYS[id]) union.add(k);
  }
  for (const key of Object.keys(bindings)) {
    if (!union.has(key)) {
      throw new BindingValidationError(
        `Unknown binding key "${key}" for modules [${modules.join(", ")}]`,
      );
    }
  }
  for (const id of modules) {
    const sliced: Record<string, unknown> = {};
    for (const k of MODULE_BINDING_KEYS[id]) {
      if (k in bindings) sliced[k] = bindings[k];
    }
    MODULE_FACTORIES[id].validateBindings(sliced);
  }

  return {
    task: obj.task,
    modules,
    bindings,
    mechanics_exclusions: obj.mechanics_exclusions as string[],
  };
}

export function validateAssignmentMap(
  entries: unknown,
): AssignmentMapEntry[] {
  if (!Array.isArray(entries)) {
    throw new BindingValidationError("assignment map must be an array");
  }
  const tasks = new Set<string>();
  const out: AssignmentMapEntry[] = [];
  for (const entry of entries) {
    const validated = validateAssignmentEntry(entry);
    if (tasks.has(validated.task)) {
      throw new BindingValidationError(`Duplicate task: ${validated.task}`);
    }
    tasks.add(validated.task);
    out.push(validated);
  }
  return out;
}

export function contractVersion(): typeof CONTRACT_VERSION {
  return CONTRACT_VERSION;
}
