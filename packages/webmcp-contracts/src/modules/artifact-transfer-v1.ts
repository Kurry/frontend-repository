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

const OPS = ["import", "export", "copy", "print_preview", "convert"] as const;


export type ArtifactTransferBindings = {
  artifact_operations: string[];
  import_modes?: string[];
  export_formats?: string[];
  conversion_modes?: string[];
  visible_postconditions?: string[];
};

export type ArtifactTransferHandlers = {
  import?: (
    input: { mode: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  export?: (
    input: { format: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  copy?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  print_preview?: (
    input: Record<string, never>,
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  convert?: (
    input: { mode: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
};

function validate(bindings: unknown): ArtifactTransferBindings {
  const obj = asObject(bindings, "artifact-transfer-v1 bindings");
  return {
    artifact_operations: requireEnumSubset(
      obj.artifact_operations,
      "artifact_operations",
      OPS,
    ),
    import_modes: optionalStringList(obj.import_modes, "import_modes"),
    export_formats: optionalStringList(obj.export_formats, "export_formats"),
    conversion_modes: optionalStringList(
      obj.conversion_modes,
      "conversion_modes",
    ),
    visible_postconditions: optionalStringList(
      obj.visible_postconditions,
      "visible_postconditions",
    ),
  };
}

function compile(
  bindings: ArtifactTransferBindings,
  handlers: ArtifactTransferHandlers,
): CompiledTool[] {
  const tools: CompiledTool[] = [];
  const ops = bindings.artifact_operations;

  if (ops.includes("import")) {
    const modes = bindings.import_modes ?? [];
    tools.push(
      tool(
        "artifact-transfer-v1",
        "artifact.import",
        "Start a declared import mode (no file bytes in WebMCP).",
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
          ensurePermitted("import", ops);
          const mode = modes.length
            ? assertEnum(input.mode, modes, "mode")
            : assertBoundedString(input.mode, "mode", 64);
          return runHandler(ctx, handlers.import as never, { mode }, "import_started");
        },
      ),
    );
  }

  if (ops.includes("export")) {
    const formats = bindings.export_formats ?? [];
    tools.push(
      tool(
        "artifact-transfer-v1",
        "artifact.export",
        "Export using a declared format (no blob/base64 in results).",
        {
          type: "object",
          additionalProperties: false,
          required: ["format"],
          properties: {
            format: formats.length
              ? { type: "string", enum: formats }
              : { type: "string", maxLength: 64 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          ensurePermitted("export", ops);
          const format = formats.length
            ? assertEnum(input.format, formats, "format")
            : assertBoundedString(input.format, "format", 64);
          return runHandler(
            ctx,
            handlers.export as never,
            { format },
            "export_started",
          );
        },
      ),
    );
  }

  if (ops.includes("copy")) {
    tools.push(
      tool(
        "artifact-transfer-v1",
        "artifact.copy",
        "Trigger copy via the visible control (clipboard verified in Playwright).",
        emptyObjectSchema("artifact.copy"),
        baseAnnotations(),
        async (_input, ctx) => {
          ensurePermitted("copy", ops);
          return runHandler(ctx, handlers.copy as never, {}, "copy_triggered");
        },
      ),
    );
  }

  if (ops.includes("print_preview")) {
    tools.push(
      tool(
        "artifact-transfer-v1",
        "artifact.print_preview",
        "Open print preview through the product handler.",
        emptyObjectSchema("artifact.print_preview"),
        baseAnnotations({ readOnlyHint: true }),
        async (_input, ctx) => {
          ensurePermitted("print_preview", ops);
          return runHandler(
            ctx,
            handlers.print_preview as never,
            {},
            "print_preview",
          );
        },
      ),
    );
  }

  if (ops.includes("convert")) {
    const modes = bindings.conversion_modes ?? [];
    tools.push(
      tool(
        "artifact-transfer-v1",
        "artifact.convert",
        "Run a declared conversion mode.",
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
          ensurePermitted("convert", ops);
          const mode = modes.length
            ? assertEnum(input.mode, modes, "mode")
            : assertBoundedString(input.mode, "mode", 64);
          return runHandler(
            ctx,
            handlers.convert as never,
            { mode },
            "converted",
          );
        },
      ),
    );
  }

  return tools;
}

export const artifactTransferV1: ModuleFactory<
  ArtifactTransferBindings,
  ArtifactTransferHandlers
> = {
  id: "artifact-transfer-v1",
  validateBindings: validate,
  compile,
};
