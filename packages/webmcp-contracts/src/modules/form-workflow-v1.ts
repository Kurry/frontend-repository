import {
  asObject,
  optionalStringList,
  requireEnumSubset,
  requireStringList,
} from "../security/validate-bindings.js";
import {
  assertBoundedString,
  assertEnum,
} from "../security/limits.js";
import { BindingValidationError, InputValidationError } from "../errors.js";
import type {
  CompiledTool,
  InvokeContext,
  ModuleFactory,
  ValueBounds,
} from "../types.js";
import {
  baseAnnotations,
  ensurePermitted,
  readBounds,
  runHandler,
  tool,
  type HandlerResult,
} from "./shared.js";

const OPS = [
  "validate",
  "submit",
  "cancel",
  "reset",
  "advance",
  "return",
] as const;


export type FormWorkflowBindings = {
  form_fields?: string[];
  form_operations: string[];
  workflow_steps?: string[];
  value_bounds?: Record<string, ValueBounds>;
  visible_postconditions?: string[];
};

export type FormWorkflowHandlers = {
  validate?: (
    input: { fields?: Record<string, string> },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  submit?: (
    input: { fields?: Record<string, string> },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  cancel?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  reset?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  advance?: (
    input: { step?: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  return?: (
    input: { step?: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
};

function parseFields(
  input: Record<string, unknown>,
  allowed: string[] | undefined,
  bounds: Record<string, ValueBounds> | undefined,
): Record<string, string> {
  const raw = input.fields;
  if (raw === undefined) return {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new InputValidationError("fields must be an object");
  }
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (allowed && !allowed.includes(key)) {
      throw new InputValidationError(`Unknown field: ${key}`);
    }
    const max = readBounds(bounds, key).maxLength ?? 200;
    out[key] = assertBoundedString(val, key, max);
  }
  return out;
}

function validate(bindings: unknown): FormWorkflowBindings {
  const obj = asObject(bindings, "form-workflow-v1 bindings");
  if (obj.form_fields === undefined && obj.form_operations === undefined) {
    throw new BindingValidationError(
      "form-workflow-v1 requires form_fields or form_operations",
    );
  }
  const form_operations = requireEnumSubset(
    obj.form_operations ?? OPS,
    "form_operations",
    OPS,
  );
  return {
    form_fields:
      obj.form_fields === undefined
        ? undefined
        : requireStringList(obj.form_fields, "form_fields"),
    form_operations,
    workflow_steps: optionalStringList(obj.workflow_steps, "workflow_steps"),
    value_bounds:
      obj.value_bounds && typeof obj.value_bounds === "object"
        ? (obj.value_bounds as Record<string, ValueBounds>)
        : undefined,
    visible_postconditions: optionalStringList(
      obj.visible_postconditions,
      "visible_postconditions",
    ),
  };
}

function compile(
  bindings: FormWorkflowBindings,
  handlers: FormWorkflowHandlers,
): CompiledTool[] {
  const tools: CompiledTool[] = [];
  const ops = bindings.form_operations;

  const fieldsSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      fields: {
        type: "object",
        additionalProperties: { type: "string", maxLength: 200 },
      },
    },
  };

  if (ops.includes("validate")) {
    tools.push(
      tool(
        "form-workflow-v1",
        "form.validate",
        "Run declared form validation.",
        fieldsSchema,
        baseAnnotations({ readOnlyHint: true }),
        async (input, ctx) => {
          ensurePermitted("validate", ops);
          const fields = parseFields(
            input,
            bindings.form_fields,
            bindings.value_bounds,
          );
          return runHandler(ctx, handlers.validate as never, { fields }, "validated");
        },
      ),
    );
  }

  if (ops.includes("submit")) {
    tools.push(
      tool(
        "form-workflow-v1",
        "form.submit",
        "Submit the form through the visible handler.",
        fieldsSchema,
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("submit", ops);
          const fields = parseFields(
            input,
            bindings.form_fields,
            bindings.value_bounds,
          );
          return runHandler(ctx, handlers.submit as never, { fields }, "submitted");
        },
      ),
    );
  }

  if (ops.includes("cancel")) {
    tools.push(
      tool(
        "form-workflow-v1",
        "form.cancel",
        "Cancel the active form workflow.",
        { type: "object", additionalProperties: false, properties: {} },
        baseAnnotations(),
        async (_input, ctx) => {
          ensurePermitted("cancel", ops);
          return runHandler(ctx, handlers.cancel as never, {}, "cancelled");
        },
      ),
    );
  }

  if (ops.includes("reset")) {
    tools.push(
      tool(
        "form-workflow-v1",
        "form.reset",
        "Reset the form to its initial state.",
        { type: "object", additionalProperties: false, properties: {} },
        baseAnnotations(),
        async (_input, ctx) => {
          ensurePermitted("reset", ops);
          return runHandler(ctx, handlers.reset as never, {}, "reset");
        },
      ),
    );
  }

  if (ops.includes("advance")) {
    tools.push(
      tool(
        "form-workflow-v1",
        "form.advance",
        "Advance one declared workflow step.",
        {
          type: "object",
          additionalProperties: false,
          properties: {
            step: bindings.workflow_steps
              ? { type: "string", enum: bindings.workflow_steps }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("advance", ops);
          const step =
            input.step === undefined
              ? undefined
              : bindings.workflow_steps
                ? assertEnum(input.step, bindings.workflow_steps, "step")
                : assertBoundedString(input.step, "step", 64);
          return runHandler(
            ctx,
            handlers.advance as never,
            step === undefined ? {} : { step },
            "advanced",
          );
        },
      ),
    );
  }

  if (ops.includes("return")) {
    tools.push(
      tool(
        "form-workflow-v1",
        "form.return",
        "Return one declared workflow step.",
        {
          type: "object",
          additionalProperties: false,
          properties: {
            step: bindings.workflow_steps
              ? { type: "string", enum: bindings.workflow_steps }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("return", ops);
          const step =
            input.step === undefined
              ? undefined
              : bindings.workflow_steps
                ? assertEnum(input.step, bindings.workflow_steps, "step")
                : assertBoundedString(input.step, "step", 64);
          return runHandler(
            ctx,
            handlers.return as never,
            step === undefined ? {} : { step },
            "returned",
          );
        },
      ),
    );
  }

  return tools;
}

export const formWorkflowV1: ModuleFactory<
  FormWorkflowBindings,
  FormWorkflowHandlers
> = {
  id: "form-workflow-v1",
  validateBindings: validate,
  compile,
};
