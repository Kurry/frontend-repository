import { encodeTheme } from "./theme-codec.js";

export function registerWebMCP(state, mutateActive, setActiveTheme, addCustomFromActive, renderAll, serializeTheme, themeToCss, removeActiveTheme) {
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
        mutateActive({ [args.token]: args.value });
        return { success: true };
      }

      case "entity_create": {
        const base = state.active || state.builtins[0];
        const newTheme = {
           ...JSON.parse(JSON.stringify(base)),
           id: (crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`),
           type: "custom",
           name: args.name || "My Theme"
        };
        state.customs.unshift(newTheme);
        setActiveTheme(newTheme);
        renderAll();
        return { success: true, id: newTheme.id };
      }

      case "entity_update": {
        if (!state.active) return { error: "No active theme" };
        if (args.name) mutateActive({ name: args.name });
        return { success: true };
      }

      case "entity_delete": {
        if (!args.confirm) return { error: "Requires confirm=true" };
        const idx = state.customs.findIndex(t => t.id === args.id);
        if (idx > -1) {
          state.customs.splice(idx, 1);
          if (state.active?.id === args.id) {
             setActiveTheme(state.customs[0] || state.builtins[0]);
          }
          renderAll();
          return { success: true };
        }
        return { error: "Theme not found" };
      }

      case "artifact_export": {
        const theme = state.builtins.find(t => t.id === args.id) || state.customs.find(t => t.id === args.id) || state.active;
        if (!theme) return { error: "Theme not found" };

        if (args.format === 'json') {
            const clone = serializeTheme(theme);
            delete clone.id; delete clone.type;
            return { success: true, data: JSON.stringify(clone) };
        } else if (args.format === 'css') {
            return { success: true, data: themeToCss(serializeTheme(theme)) };
        } else if (args.format === 'theme-extension') {
            return { success: true, data: encodeTheme(serializeTheme(theme)) };
        }
        return { error: "Unknown format" };
      }

      case "artifact_import": {
        if (args.mode !== 'declared-theme' || !args.data) return { error: "Unsupported" };
        try {
          const data = typeof args.data === 'string' ? JSON.parse(args.data) : args.data;
          const theme = {
            ...state.builtins[0],
            ...data,
            id: (crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`),
            type: "custom",
            name: data.name || "Imported Theme"
          };
          state.customs.unshift(theme);
          setActiveTheme(theme);
          renderAll();
          return { success: true };
        } catch(e) {
          return { error: "Invalid payload" };
        }
      }

      case "artifact_copy": {
        return { success: true };
      }

      default:
        return { error: `Unknown tool ${tool_name}` };
    }
  };
}
