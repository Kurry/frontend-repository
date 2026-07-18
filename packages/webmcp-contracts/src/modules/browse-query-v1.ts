import { BindingValidationError } from "../errors.js";
import {
  asObject,
  optionalString,
  optionalStringList,
  requireStringList,
} from "../security/validate-bindings.js";
import type { CompiledTool, InvokeContext, ModuleFactory } from "../types.js";
import {
  assertBoundedString,
  assertEnum,
} from "../security/limits.js";
import {
  baseAnnotations,
  runHandler,
  tool,
  type HandlerResult,
} from "./shared.js";


export type BrowseQueryBindings = {
  destinations: string[];
  browsable_entity?: string;
  filters?: string[];
  sorts?: string[];
  locales?: string[];
  themes?: string[];
  visible_postconditions?: string[];
};

export type BrowseQueryHandlers = {
  open?: (
    input: { destination: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  search?: (
    input: { query: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  apply_filter?: (
    input: { filter: string; value?: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  clear_filter?: (
    input: { filter?: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  sort?: (
    input: { sort: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  set_locale?: (
    input: { locale: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
  set_theme?: (
    input: { theme: string },
    ctx: InvokeContext,
  ) => Promise<HandlerResult> | HandlerResult;
};

function validate(bindings: unknown): BrowseQueryBindings {
  const obj = asObject(bindings, "browse-query-v1 bindings");
  const destinations = requireStringList(obj.destinations, "destinations");
  return {
    destinations,
    browsable_entity: optionalString(obj.browsable_entity, "browsable_entity"),
    filters: optionalStringList(obj.filters, "filters"),
    sorts: optionalStringList(obj.sorts, "sorts"),
    locales: optionalStringList(obj.locales, "locales"),
    themes: optionalStringList(obj.themes, "themes"),
    visible_postconditions: optionalStringList(
      obj.visible_postconditions,
      "visible_postconditions",
    ),
  };
}

function compile(
  bindings: BrowseQueryBindings,
  handlers: BrowseQueryHandlers,
): CompiledTool[] {
  const tools: CompiledTool[] = [
    tool(
      "browse-query-v1",
      "browse.open",
      "Open a declared destination (route, tab, section, or item).",
      {
        type: "object",
        additionalProperties: false,
        required: ["destination"],
        properties: {
          destination: {
            type: "string",
            enum: bindings.destinations,
            description: "Declared destination",
          },
        },
      },
      baseAnnotations({ readOnlyHint: false }),
      async (input, ctx) => {
        const destination = assertEnum(
          input.destination,
          bindings.destinations,
          "destination",
        );
        return runHandler(ctx, handlers.open as never, { destination }, "opened");
      },
    ),
    tool(
      "browse-query-v1",
      "browse.search",
      "Search within the browsable surface.",
      {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: {
          query: { type: "string", maxLength: 200 },
        },
      },
      baseAnnotations({ readOnlyHint: true }),
      async (input, ctx) => {
        const query = assertBoundedString(input.query, "query", 200);
        return runHandler(ctx, handlers.search as never, { query }, "searched");
      },
    ),
  ];

  if (bindings.filters?.length) {
    tools.push(
      tool(
        "browse-query-v1",
        "browse.apply_filter",
        "Apply a declared filter.",
        {
          type: "object",
          additionalProperties: false,
          required: ["filter"],
          properties: {
            filter: { type: "string", enum: bindings.filters },
            value: { type: "string", maxLength: 200 },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          const filter = assertEnum(input.filter, bindings.filters!, "filter");
          const value =
            input.value === undefined
              ? undefined
              : assertBoundedString(input.value, "value", 200);
          return runHandler(
            ctx,
            handlers.apply_filter as never,
            value === undefined ? { filter } : { filter, value },
            "filter_applied",
          );
        },
      ),
      tool(
        "browse-query-v1",
        "browse.clear_filter",
        "Clear one or all declared filters.",
        {
          type: "object",
          additionalProperties: false,
          properties: {
            filter: { type: "string", enum: bindings.filters },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          const filter =
            input.filter === undefined
              ? undefined
              : assertEnum(input.filter, bindings.filters!, "filter");
          return runHandler(
            ctx,
            handlers.clear_filter as never,
            filter === undefined ? {} : { filter },
            "filter_cleared",
          );
        },
      ),
    );
  }

  if (bindings.sorts?.length) {
    tools.push(
      tool(
        "browse-query-v1",
        "browse.sort",
        "Apply a declared sort order.",
        {
          type: "object",
          additionalProperties: false,
          required: ["sort"],
          properties: {
            sort: { type: "string", enum: bindings.sorts },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          const sort = assertEnum(input.sort, bindings.sorts!, "sort");
          return runHandler(ctx, handlers.sort as never, { sort }, "sorted");
        },
      ),
    );
  }

  if (bindings.locales?.length) {
    tools.push(
      tool(
        "browse-query-v1",
        "browse.set_locale",
        "Switch to a declared locale.",
        {
          type: "object",
          additionalProperties: false,
          required: ["locale"],
          properties: {
            locale: { type: "string", enum: bindings.locales },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          const locale = assertEnum(input.locale, bindings.locales!, "locale");
          return runHandler(
            ctx,
            handlers.set_locale as never,
            { locale },
            "locale_set",
          );
        },
      ),
    );
  }

  if (bindings.themes?.length) {
    tools.push(
      tool(
        "browse-query-v1",
        "browse.set_theme",
        "Switch to a declared theme.",
        {
          type: "object",
          additionalProperties: false,
          required: ["theme"],
          properties: {
            theme: { type: "string", enum: bindings.themes },
          },
        },
        baseAnnotations(),
        async (input, ctx) => {
          const theme = assertEnum(input.theme, bindings.themes!, "theme");
          return runHandler(
            ctx,
            handlers.set_theme as never,
            { theme },
            "theme_set",
          );
        },
      ),
    );
  }

  if (!bindings.destinations.length) {
    throw new BindingValidationError("destinations must not be empty");
  }

  return tools;
}

export const browseQueryV1: ModuleFactory<
  BrowseQueryBindings,
  BrowseQueryHandlers
> = {
  id: "browse-query-v1",
  validateBindings: validate,
  compile,
};
