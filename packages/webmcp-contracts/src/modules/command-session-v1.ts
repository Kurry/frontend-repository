import {
  asObject,
  optionalStringList,
  requireEnumSubset,
} from "../security/validate-bindings.js";
import {
  assertBoundedString,
  assertEnum,
} from "../security/limits.js";
import type { CompiledTool, InvokeContext, ModuleFactory } from "../types.js";
import {
  baseAnnotations,
  emptyObjectSchema,
  ensurePermitted,
  runHandler,
  tool,
  type HandlerResult,
} from "./shared.js";

const OPS = [
  "start",
  "pause",
  "resume",
  "stop",
  "restart",
  "advance",
  "trigger_demo",
  "connect",
  "disconnect",
] as const;


export type CommandSessionBindings = {
  session_operations: string[];
  demos?: string[];
  visible_postconditions?: string[];
};

export type CommandSessionHandlers = {
  start?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  pause?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  resume?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  stop?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  restart?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  advance?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  trigger_demo?: (
    input: { demo: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  connect?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  disconnect?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
};

function validate(bindings: unknown): CommandSessionBindings {
  const obj = asObject(bindings, "command-session-v1 bindings");
  return {
    session_operations: requireEnumSubset(
      obj.session_operations,
      "session_operations",
      OPS,
    ),
    demos: optionalStringList(obj.demos, "demos"),
    visible_postconditions: optionalStringList(
      obj.visible_postconditions,
      "visible_postconditions",
    ),
  };
}

function simpleOp(
  op: (typeof OPS)[number],
  status: string,
  handlers: CommandSessionHandlers,
  ops: string[],
): CompiledTool {
  return tool(
    "command-session-v1",
    `session.${op}`,
    `Invoke session operation: ${op}.`,
    emptyObjectSchema(`session.${op}`),
    baseAnnotations({
      readOnlyHint: false,
      // Acknowledgements are never proof of playback/connection success.
      openWorldHint: op === "connect" || op === "start",
    }),
    async (_input, ctx) => {
      ensurePermitted(op, ops);
      const handler = handlers[op as keyof CommandSessionHandlers];
      return runHandler(ctx, handler as never, {}, status);
    },
  );
}

function compile(
  bindings: CommandSessionBindings,
  handlers: CommandSessionHandlers,
): CompiledTool[] {
  const tools: CompiledTool[] = [];
  const ops = bindings.session_operations;

  for (const op of [
    "start",
    "pause",
    "resume",
    "stop",
    "restart",
    "advance",
    "connect",
    "disconnect",
  ] as const) {
    if (ops.includes(op)) {
      tools.push(simpleOp(op, op, handlers, ops));
    }
  }

  if (ops.includes("trigger_demo")) {
    const demos = bindings.demos ?? [];
    tools.push(
      tool(
        "command-session-v1",
        "session.trigger_demo",
        "Trigger a declared demo.",
        {
          type: "object",
          additionalProperties: false,
          required: ["demo"],
          properties: {
            demo: demos.length
              ? { type: "string", enum: demos }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("trigger_demo", ops);
          const demo = demos.length
            ? assertEnum(input.demo, demos, "demo")
            : assertBoundedString(input.demo, "demo", 64);
          return runHandler(
            ctx,
            handlers.trigger_demo as never,
            { demo },
            "demo_triggered",
          );
        },
      ),
    );
  }

  return tools;
}

export const commandSessionV1: ModuleFactory<
  CommandSessionBindings,
  CommandSessionHandlers
> = {
  id: "command-session-v1",
  validateBindings: validate,
  compile,
};
