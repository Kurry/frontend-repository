/* Browser WebMCP surface: zto-webmcp-v1.
 * Modules: structured-editor-v1, entity-collection-v1, artifact-transfer-v1.
 * Handlers call the same application logic as the visible UI. */

export function registerWebMCP(api) {
  const {
    state,
    mutateActive,
    selectTheme,
    createTheme,
    removeThemeById,
    importThemeDocument,
    openArtifact,
    copyArtifact,
    validateThemeName,
    validateThemeDocument,
    serializeTheme,
  } = api;

  const findTheme = (args = {}) => {
    if (args.id != null) {
      const byId =
        state.customs.find((t) => t.id === args.id) ||
        state.builtins.find((t) => t.id === args.id);
      if (byId) return byId;
    }
    if (typeof args.name === "string" && args.name.trim()) {
      const needle = args.name.trim();
      const byName =
        state.customs.find((t) => t.name === needle) ||
        state.builtins.find((t) => t.name === needle) ||
        state.customs.find((t) => t.name.toLowerCase() === needle.toLowerCase()) ||
        state.builtins.find((t) => t.name.toLowerCase() === needle.toLowerCase());
      if (byName) return byName;
    }
    return null;
  };

  const validatePatch = (patch) => {
    const validated = validateThemeDocument({ ...serializeTheme(state.active), ...patch });
    const normalized = {};
    for (const key of Object.keys(patch)) {
      if (["default", "prefersdark"].includes(key)) {
        if (typeof patch[key] !== "boolean") throw new Error(`${key}: expected a boolean`);
        normalized[key] = patch[key];
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(validated, key)) {
        throw new Error(`Unknown theme field: ${key}`);
      }
      normalized[key] = validated[key];
    }
    return normalized;
  };

  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    app: "CSS Theme Builder",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tools: TOOL_DEFS.map((t) => t.name),
  });

  const TOOL_DEFS = [
    {
      name: "editor_select",
      module: "structured-editor-v1",
      description: "Select a css-theme object (by id or name) into the editor and live preview.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" } },
      },
    },
    {
      name: "editor_update_property",
      module: "structured-editor-v1",
      description:
        "Update one property of the active css-theme: arguments {token, value}. Token is a Theme JSON field name such as --color-primary or --radius-box.",
      inputSchema: {
        type: "object",
        properties: { token: { type: "string" }, value: { type: ["string", "number", "boolean"] } },
        required: ["token", "value"],
      },
    },
    {
      name: "editor_preview",
      module: "structured-editor-v1",
      description: "Apply a css-theme (by id or name) to the live preview.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" } },
      },
    },
    {
      name: "entity_create",
      module: "entity-collection-v1",
      description: "Create a theme entity in My themes; optional {name} validated against the Theme JSON name contract.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" } },
      },
    },
    {
      name: "entity_select",
      module: "entity-collection-v1",
      description: "Select a theme entity (by id or name) as the active theme.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" } },
      },
    },
    {
      name: "entity_update",
      module: "entity-collection-v1",
      description:
        "Update a theme entity: {id?, name?} to target (defaults to active), plus name and/or tokens fields to change.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          tokens: { type: "object" },
        },
      },
    },
    {
      name: "entity_delete",
      module: "entity-collection-v1",
      description: "Delete a custom theme entity; requires confirm=true. Built-ins cannot be deleted.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, confirm: { type: "boolean" } },
        required: ["confirm"],
      },
    },
    {
      name: "artifact_export",
      module: "artifact-transfer-v1",
      description: "Open the Export dialog on a format: css, json, or theme-extension; optional theme id/name.",
      inputSchema: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["css", "json", "theme-extension"] },
          id: { type: "string" },
          name: { type: "string" },
        },
        required: ["format"],
      },
    },
    {
      name: "artifact_import",
      module: "artifact-transfer-v1",
      description:
        'Import a Theme JSON document (mode "declared-theme"): arguments {mode, data} where data is the Theme JSON object or string.',
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["declared-theme"] },
          data: { type: ["object", "string"] },
        },
        required: ["mode", "data"],
      },
    },
    {
      name: "artifact_copy",
      module: "artifact-transfer-v1",
      description: "Copy an export format (css, json, theme-extension) of a theme to the clipboard.",
      inputSchema: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["css", "json", "theme-extension"] },
          id: { type: "string" },
          name: { type: "string" },
        },
        required: ["format"],
      },
    },
  ];

  window.webmcp_list_tools = () =>
    TOOL_DEFS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

  // Accept both invoke_tool("name", args) and the bridge's invoke_tool({name, arguments}).
  window.webmcp_invoke_tool = (nameOrRequest, maybeArgs) => {
    const toolName =
      typeof nameOrRequest === "string" ? nameOrRequest : String(nameOrRequest?.name ?? "");
    const args =
      (typeof nameOrRequest === "string" ? maybeArgs : nameOrRequest?.arguments) || {};

    switch (toolName) {
      case "editor_select":
      case "editor_preview":
      case "entity_select": {
        const found = findTheme(args);
        if (!found) return { error: "Theme not found — pass a valid id or name" };
        selectTheme(found);
        return { success: true, selected: found.name, id: found.id };
      }

      case "editor_update_property": {
        if (!state.active) return { error: "No active theme" };
        if (args.token == null || args.value == null) {
          return { error: "editor_update_property requires properties token and value" };
        }
        try {
          const patch =
            args.token === "name"
              ? { name: String(args.value) }
              : { [String(args.token)]: args.value };
          if (args.token === "name") {
            const nameError = validateThemeName(String(args.value));
            if (nameError) return { error: nameError };
          }
          mutateActive(patch, { historyKey: `mcp:${args.token}` });
          return { success: true, token: args.token, value: state.active[args.token] ?? args.value };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Invalid token value" };
        }
      }

      case "entity_create": {
        try {
          const created = createTheme(args?.name ?? null);
          return { success: true, id: created.id, name: created.name };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Create failed" };
        }
      }

      case "entity_update": {
        const target = findTheme(args) || state.active;
        if (!target) return { error: "No theme to update" };
        if (target.id !== state.active?.id) selectTheme(target);
        const patch = {};
        if (typeof args.name === "string" && findTheme(args)?.name !== args.name) {
          const nameError = validateThemeName(args.name);
          if (nameError) return { error: nameError };
          patch.name = args.name.trim();
        }
        if (args.tokens && typeof args.tokens === "object" && !Array.isArray(args.tokens)) {
          for (const [key, value] of Object.entries(args.tokens)) {
            if (key.startsWith("--") || ["color-scheme", "default", "prefersdark"].includes(key)) {
              patch[key] = value;
            }
          }
        }
        if (!Object.keys(patch).length) return { error: "Nothing to update — pass name and/or tokens" };
        try {
          mutateActive(patch, { historyKey: "mcp:update" });
          return { success: true, id: state.active.id, name: state.active.name };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Invalid theme update" };
        }
      }

      case "entity_delete": {
        if (args.confirm !== true) return { error: "Delete requires confirm=true" };
        const target = findTheme(args);
        if (!target) return { error: "Theme not found — pass a valid id or name" };
        if (target.type !== "custom") {
          return { error: "Built-in themes cannot be removed — duplicate one to edit it" };
        }
        removeThemeById(target.id, { animate: false });
        return { success: true, removed: target.name };
      }

      case "artifact_export": {
        if (!["json", "css", "theme-extension"].includes(args.format)) {
          return { error: "format must be one of css, json, theme-extension" };
        }
        const target = findTheme(args);
        if (target && target.id !== state.active?.id) selectTheme(target);
        openArtifact(args.format);
        return { success: true, format: args.format };
      }

      case "artifact_import": {
        if (args.mode !== "declared-theme" || args.data == null) {
          return { error: 'import requires mode "declared-theme" and data' };
        }
        try {
          const imported = importThemeDocument(args.data);
          return { success: true, name: imported.name, id: imported.id };
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Invalid payload" };
        }
      }

      case "artifact_copy": {
        if (!["json", "css", "theme-extension"].includes(args.format)) {
          return { error: "format must be one of css, json, theme-extension" };
        }
        const target = findTheme(args);
        if (target && target.id !== state.active?.id) selectTheme(target);
        const result = copyArtifact(args.format);
        if (result && typeof result.then === "function") {
          return result.then((ok) =>
            ok ? { success: true, format: args.format } : { error: "Clipboard write failed" }
          );
        }
        return result ? { success: true, format: args.format } : { error: "Clipboard write failed" };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  };
}
