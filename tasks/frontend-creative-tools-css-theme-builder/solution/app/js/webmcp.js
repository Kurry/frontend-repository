export function registerWebMCP(
  state,
  mutateActive,
  setActiveTheme,
  addCustomFromActive,
  renderAll,
  removeActiveTheme,
  validateThemeName,
  validateThemeDocument,
  importThemeDocument,
  openArtifact,
  copyArtifact,
) {
  const validatePatch = (patch) => {
    const validated = validateThemeDocument({ ...state.active, ...patch });
    const normalized = {};
    for (const key of Object.keys(patch)) {
      if (["default", "prefersdark"].includes(key)) {
        if (typeof patch[key] !== "boolean") {
          throw new Error(`${key}: expected a boolean`);
        }
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
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    { name: "editor_select" },
    { name: "editor_update_property" },
    { name: "editor_preview" },
    { name: "entity_create" },
    { name: "entity_select" },
    { name: "entity_update" },
    { name: "entity_delete" },
    { name: "artifact_export" },
    { name: "artifact_import" },
    { name: "artifact_copy" }
  ];

  window.webmcp_invoke_tool = (tool_name, args) => {
    switch (tool_name) {
      case "editor_select":
      case "entity_select":
      case "editor_preview": {
        const theme = state.builtins.find(t => t.id === args.id) || state.customs.find(t => t.id === args.id);
        if (theme) {
          setActiveTheme(theme);
          return { success: true };
        }
        return { error: "Theme not found" };
      }

      case "editor_update_property": {
        if (!state.active) return { error: "No active theme" };
        try {
          mutateActive(validatePatch({ [args.token]: args.value }));
          return { success: true };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Invalid token value" };
        }
      }

      case "entity_create": {
        try {
          const newTheme = addCustomFromActive(args?.name);
          return { success: true, id: newTheme.id };
        } catch (error) {
          return { error: error.message };
        }
      }

      case "entity_update": {
        if (!state.active) return { error: "No active theme" };
        const patch = {};
        if (typeof args.name === "string") {
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
        try {
          if (Object.keys(patch).length) mutateActive(validatePatch(patch));
          return { success: true };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Invalid theme update" };
        }
      }

      case "entity_delete": {
        if (!args.confirm) return { error: "Requires confirm=true" };
        const idx = state.customs.findIndex(t => t.id === args.id);
        if (idx > -1) {
          if (state.active?.id === args.id) {
            removeActiveTheme();
          } else {
            state.customs.splice(idx, 1);
            renderAll();
          }
          return { success: true };
        }
        return { error: "Theme not found" };
      }

      case "artifact_export": {
        const theme = state.builtins.find(t => t.id === args.id) || state.customs.find(t => t.id === args.id) || state.active;
        if (!theme) return { error: "Theme not found" };

        if (!['json', 'css', 'theme-extension'].includes(args.format)) return { error: "Unknown format" };
        if (state.active?.id !== theme.id) setActiveTheme(theme);
        openArtifact(args.format);
        return { success: true, format: args.format };
      }

      case "artifact_import": {
        if (args.mode !== 'declared-theme' || !args.data) return { error: "Unsupported" };
        try {
          importThemeDocument(args.data);
          return { success: true };
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Invalid payload" };
        }
      }

      case "artifact_copy": {
        const theme = state.builtins.find(t => t.id === args.id) || state.customs.find(t => t.id === args.id) || state.active;
        if (!theme) return { error: "Theme not found" };

        if (!['json', 'css', 'theme-extension'].includes(args.format)) return { error: "Unknown format" };
        if (state.active?.id !== theme.id) setActiveTheme(theme);
        return copyArtifact(args.format)
          .then((success) => success ? { success: true, format: args.format } : { error: "Clipboard write failed" });
      }

      default:
        return { error: `Unknown tool ${tool_name}` };
    }
  };
}
