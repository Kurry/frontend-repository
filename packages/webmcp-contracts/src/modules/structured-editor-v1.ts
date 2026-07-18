import {
  asObject,
  optionalStringList,
  requireEnumSubset,
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
  "select",
  "add",
  "delete",
  "update_property",
  "set_content",
  "switch_mode",
  "preview",
] as const;


export type StructuredEditorBindings = {
  editor_object_types?: string[];
  editor_properties?: string[];
  editor_modes?: string[];
  editor_operations: string[];
  value_bounds?: Record<string, ValueBounds>;
  visible_postconditions?: string[];
};

export type StructuredEditorHandlers = {
  select?: (
    input: { id: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  add?: (
    input: { type: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  delete?: (
    input: { id: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  update_property?: (
    input: { id: string; property: string; value: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  set_content?: (
    input: { id: string; content: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  switch_mode?: (
    input: { mode: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  preview?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
};

function validate(bindings: unknown): StructuredEditorBindings {
  const obj = asObject(bindings, "structured-editor-v1 bindings");
  if (
    obj.editor_operations === undefined &&
    obj.editor_object_types === undefined
  ) {
    throw new BindingValidationError(
      "structured-editor-v1 requires editor_operations or editor_object_types",
    );
  }
  return {
    editor_object_types: optionalStringList(
      obj.editor_object_types,
      "editor_object_types",
    ),
    editor_properties: optionalStringList(
      obj.editor_properties,
      "editor_properties",
    ),
    editor_modes: optionalStringList(obj.editor_modes, "editor_modes"),
    editor_operations: requireEnumSubset(
      obj.editor_operations ?? OPS,
      "editor_operations",
      OPS,
    ),
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
  bindings: StructuredEditorBindings,
  handlers: StructuredEditorHandlers,
): CompiledTool[] {
  const tools: CompiledTool[] = [];
  const ops = bindings.editor_operations;

  if (ops.includes("select")) {
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.select",
        "Select an editor object by public id.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: { id: { type: "string", maxLength: 128 } },
        },
        baseAnnotations({ readOnlyHint: true }),
        async (input, ctx) => {
          ensurePermitted("select", ops);
          const id = assertBoundedString(input.id, "id", 128);
          return runHandler(ctx, handlers.select as never, { id }, "selected");
        },
      ),
    );
  }

  if (ops.includes("add")) {
    const types = bindings.editor_object_types ?? [];
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.add",
        "Add a declared object type.",
        {
          type: "object",
          additionalProperties: false,
          required: ["type"],
          properties: {
            type: types.length
              ? { type: "string", enum: types }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("add", ops);
          const type = types.length
            ? assertEnum(input.type, types, "type")
            : assertBoundedString(input.type, "type", 64);
          return runHandler(ctx, handlers.add as never, { type }, "added");
        },
      ),
    );
  }

  if (ops.includes("delete")) {
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.delete",
        "Delete a declared editor object.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: { id: { type: "string", maxLength: 128 } },
        },
        baseAnnotations({ destructiveHint: true }),
        async (input, ctx) => {
          ensurePermitted("delete", ops);
          const id = assertBoundedString(input.id, "id", 128);
          return runHandler(ctx, handlers.delete as never, { id }, "deleted");
        },
      ),
    );
  }

  if (ops.includes("update_property")) {
    const props = bindings.editor_properties ?? [];
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.update_property",
        "Update a declared property on an object.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "property", "value"],
          properties: {
            id: { type: "string", maxLength: 128 },
            property: props.length
              ? { type: "string", enum: props }
              : { type: "string", maxLength: 64 },
            value: { type: "string", maxLength: 200 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("update_property", ops);
          const id = assertBoundedString(input.id, "id", 128);
          const property = props.length
            ? assertEnum(input.property, props, "property")
            : assertBoundedString(input.property, "property", 64);
          const max =
            readBounds(bindings.value_bounds, property).maxLength ?? 200;
          const value = assertBoundedString(input.value, "value", max);
          return runHandler(
            ctx,
            handlers.update_property as never,
            { id, property, value },
            "property_updated",
          );
        },
      ),
    );
  }

  if (ops.includes("set_content")) {
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.set_content",
        "Set bounded textual content on an object.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "content"],
          properties: {
            id: { type: "string", maxLength: 128 },
            content: { type: "string", maxLength: 200 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("set_content", ops);
          const id = assertBoundedString(input.id, "id", 128);
          const max =
            readBounds(bindings.value_bounds, "content").maxLength ?? 200;
          const content = assertBoundedString(input.content, "content", max);
          return runHandler(
            ctx,
            handlers.set_content as never,
            { id, content },
            "content_set",
          );
        },
      ),
    );
  }

  if (ops.includes("switch_mode")) {
    const modes = bindings.editor_modes ?? [];
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.switch_mode",
        "Switch to a declared editor mode.",
        {
          type: "object",
          additionalProperties: false,
          required: ["mode"],
          properties: {
            mode: modes.length
              ? { type: "string", enum: modes }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("switch_mode", ops);
          const mode = modes.length
            ? assertEnum(input.mode, modes, "mode")
            : assertBoundedString(input.mode, "mode", 64);
          return runHandler(
            ctx,
            handlers.switch_mode as never,
            { mode },
            "mode_switched",
          );
        },
      ),
    );
  }

  if (ops.includes("preview")) {
    tools.push(
      tool(
        "structured-editor-v1",
        "editor.preview",
        "Run or refresh the declared preview.",
        { type: "object", additionalProperties: false, properties: {} },
        baseAnnotations({ readOnlyHint: true }),
        async (_input, ctx) => {
          ensurePermitted("preview", ops);
          return runHandler(ctx, handlers.preview as never, {}, "previewed");
        },
      ),
    );
  }

  return tools;
}

export const structuredEditorV1: ModuleFactory<
  StructuredEditorBindings,
  StructuredEditorHandlers
> = {
  id: "structured-editor-v1",
  validateBindings: validate,
  compile,
};
