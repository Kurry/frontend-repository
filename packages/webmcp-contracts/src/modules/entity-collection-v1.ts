import {
  asObject,
  optionalString,
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
  parseQuantity,
  readBounds,
  runHandler,
  tool,
  type HandlerResult,
} from "./shared.js";

const OPS = [
  "create",
  "select",
  "update",
  "delete",
  "toggle",
  "quantity",
  "reorder",
] as const;


export type EntityCollectionBindings = {
  entity?: string;
  entity_operations: string[];
  entity_fields?: string[];
  value_bounds?: Record<string, ValueBounds>;
  visible_postconditions?: string[];
};

export type EntityCollectionHandlers = {
  create?: (
    input: { fields?: Record<string, string> },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  select?: (
    input: { id: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  update?: (
    input: { id: string; fields: Record<string, string> },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  delete?: (
    input: { id: string; confirm: true },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  toggle?: (
    input: { id: string; field?: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  quantity?: (
    input: { id: string; quantity: number },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  reorder?: (
    input: { id: string; to_index: number },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
};

function parseValueBounds(value: unknown): Record<string, ValueBounds> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BindingValidationError("value_bounds must be an object");
  }
  return value as Record<string, ValueBounds>;
}

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

function validate(bindings: unknown): EntityCollectionBindings {
  const obj = asObject(bindings, "entity-collection-v1 bindings");
  const entity_operations = requireEnumSubset(
    obj.entity_operations ?? OPS,
    "entity_operations",
    OPS,
  );
  return {
    entity: optionalString(obj.entity, "entity"),
    entity_operations,
    entity_fields: optionalStringList(obj.entity_fields, "entity_fields"),
    value_bounds: parseValueBounds(obj.value_bounds),
    visible_postconditions: optionalStringList(
      obj.visible_postconditions,
      "visible_postconditions",
    ),
  };
}

function compile(
  bindings: EntityCollectionBindings,
  handlers: EntityCollectionHandlers,
): CompiledTool[] {
  const tools: CompiledTool[] = [];
  const ops = bindings.entity_operations;

  if (ops.includes("create")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.create",
        "Create an entity using declared fields.",
        {
          type: "object",
          additionalProperties: false,
          properties: {
            fields: {
              type: "object",
              additionalProperties: { type: "string", maxLength: 200 },
            },
          },
        },
        baseAnnotations({ destructiveHint: false }),
        async (input, ctx) => {
          ensurePermitted("create", ops);
          const fields = parseFields(
            input,
            bindings.entity_fields,
            bindings.value_bounds,
          );
          return runHandler(ctx, handlers.create as never, { fields }, "created");
        },
      ),
    );
  }

  if (ops.includes("select")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.select",
        "Select an entity by public id.",
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

  if (ops.includes("update")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.update",
        "Update declared fields on an entity.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "fields"],
          properties: {
            id: { type: "string", maxLength: 128 },
            fields: {
              type: "object",
              additionalProperties: { type: "string", maxLength: 200 },
            },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("update", ops);
          const id = assertBoundedString(input.id, "id", 128);
          const fields = parseFields(
            input,
            bindings.entity_fields,
            bindings.value_bounds,
          );
          return runHandler(
            ctx,
            handlers.update as never,
            { id, fields },
            "updated",
          );
        },
      ),
    );
  }

  if (ops.includes("delete")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.delete",
        "Delete an entity with explicit confirmation.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "confirm"],
          properties: {
            id: { type: "string", maxLength: 128 },
            confirm: { type: "boolean", const: true },
          },
        },
        baseAnnotations({ destructiveHint: true }),
        async (input, ctx) => {
          ensurePermitted("delete", ops);
          if (input.confirm !== true) {
            throw new InputValidationError("delete requires confirm=true");
          }
          const id = assertBoundedString(input.id, "id", 128);
          return runHandler(
            ctx,
            handlers.delete as never,
            { id, confirm: true as const },
            "deleted",
          );
        },
      ),
    );
  }

  if (ops.includes("toggle")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.toggle",
        "Toggle a boolean field on an entity.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: {
            id: { type: "string", maxLength: 128 },
            field: bindings.entity_fields
              ? { type: "string", enum: bindings.entity_fields }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("toggle", ops);
          const id = assertBoundedString(input.id, "id", 128);
          const field =
            input.field === undefined
              ? undefined
              : bindings.entity_fields
                ? assertEnum(input.field, bindings.entity_fields, "field")
                : assertBoundedString(input.field, "field", 64);
          return runHandler(
            ctx,
            handlers.toggle as never,
            field === undefined ? { id } : { id, field },
            "toggled",
          );
        },
      ),
    );
  }

  if (ops.includes("quantity")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.quantity",
        "Adjust quantity for an entity.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "quantity"],
          properties: {
            id: { type: "string", maxLength: 128 },
            quantity: { type: "number" },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("quantity", ops);
          const id = assertBoundedString(input.id, "id", 128);
          const quantity = parseQuantity(
            input,
            readBounds(bindings.value_bounds, "quantity"),
          );
          return runHandler(
            ctx,
            handlers.quantity as never,
            { id, quantity },
            "quantity_set",
          );
        },
      ),
    );
  }

  if (ops.includes("reorder")) {
    tools.push(
      tool(
        "entity-collection-v1",
        "entity.reorder",
        "Reorder an entity by index when gesture mechanics are excluded.",
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "to_index"],
          properties: {
            id: { type: "string", maxLength: 128 },
            to_index: { type: "integer", minimum: 0 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("reorder", ops);
          const id = assertBoundedString(input.id, "id", 128);
          if (typeof input.to_index !== "number" || input.to_index < 0) {
            throw new InputValidationError("to_index must be a non-negative number");
          }
          return runHandler(
            ctx,
            handlers.reorder as never,
            { id, to_index: input.to_index },
            "reordered",
          );
        },
      ),
    );
  }

  return tools;
}

export const entityCollectionV1: ModuleFactory<
  EntityCollectionBindings,
  EntityCollectionHandlers
> = {
  id: "entity-collection-v1",
  validateBindings: validate,
  compile,
};
