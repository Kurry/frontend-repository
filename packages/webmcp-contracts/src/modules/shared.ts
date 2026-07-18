import { FORBIDDEN_INPUT_KEYS } from "../constants.js";
import { AbortedError, InputValidationError } from "../errors.js";
import { ackOk, ackRejected } from "../runtime/acknowledgements.js";
import {
  assertBoundedNumber,
  assertBoundedString,
  assertEnum,
  assertNoForbiddenInputKeys,
} from "../security/limits.js";
import type { ModuleId } from "../constants.js";
import type {
  Acknowledgement,
  CompiledTool,
  InvokeContext,
  JsonSchema,
  ToolAnnotations,
  ValueBounds,
} from "../types.js";

export type HandlerResult =
  | void
  | {
      public_ids?: string[];
      message?: string;
      status?: string;
    };

export function baseAnnotations(
  partial?: Omit<ToolAnnotations, "untrustedOutput">,
): ToolAnnotations {
  return {
    untrustedOutput: true,
    ...partial,
  };
}

export function enumSchema(values: string[], description: string): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["value"],
    properties: {
      value: { type: "string", enum: values, description },
    },
  };
}

export function emptyObjectSchema(description: string): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    description,
    properties: {},
  };
}

export async function runHandler(
  ctx: InvokeContext,
  handler: ((input: Record<string, unknown>, ctx: InvokeContext) => Promise<HandlerResult> | HandlerResult) | undefined,
  input: Record<string, unknown>,
  fallbackStatus = "ok",
): Promise<Acknowledgement> {
  if (ctx.signal.aborted) throw new AbortedError();
  if (!handler) {
    return ackRejected(ctx.navigationEpoch, "handler_missing", "No handler bound");
  }
  try {
    const result = await handler(input, ctx);
    if (ctx.signal.aborted) throw new AbortedError();
    return ackOk(ctx.navigationEpoch, result?.status ?? fallbackStatus, {
      public_ids: result?.public_ids,
      message: result?.message,
    });
  } catch (err) {
    if (err instanceof InputValidationError || err instanceof AbortedError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "handler_error";
    return ackRejected(ctx.navigationEpoch, "handler_error", message);
  }
}

export function tool(
  moduleId: ModuleId,
  name: string,
  description: string,
  inputSchema: JsonSchema,
  annotations: ToolAnnotations,
  execute: CompiledTool["execute"],
): CompiledTool {
  return {
    moduleId,
    name,
    description,
    inputSchema,
    annotations,
    execute: async (input, ctx) => {
      // Reject forbidden keys on the raw invoke payload (before field parsing).
      assertNoForbiddenInputKeys(input, FORBIDDEN_INPUT_KEYS);
      return execute(input, ctx);
    },
  };
}

export function readBounds(
  bounds: Record<string, ValueBounds> | undefined,
  field: string,
): ValueBounds {
  return bounds?.[field] ?? {};
}

export function parseOptionalStringField(
  input: Record<string, unknown>,
  field: string,
  maxLength: number,
): string | undefined {
  if (input[field] === undefined) return undefined;
  return assertBoundedString(input[field], field, maxLength);
}

export function parseRequiredEnumField(
  input: Record<string, unknown>,
  field: string,
  allowed: readonly string[],
): string {
  return assertEnum(input[field], allowed, field);
}

export function parseQuantity(
  input: Record<string, unknown>,
  bounds?: ValueBounds,
): number {
  return assertBoundedNumber(
    input.quantity,
    "quantity",
    bounds?.min ?? 0,
    bounds?.max ?? 10_000,
  );
}

export function ensurePermitted(
  op: string,
  permitted: readonly string[],
): void {
  if (!permitted.includes(op)) {
    throw new InputValidationError(`Operation not permitted: ${op}`);
  }
}
