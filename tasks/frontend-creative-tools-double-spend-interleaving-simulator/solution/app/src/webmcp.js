import { state, movePhase, updateStrategy } from './store.js';

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    app_version: "1.0",
    supported_modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => {
    return [
      { name: "editor_select", description: "Select a phase" },
      { name: "editor_update_property", description: "Update phase slot" },
      { name: "entity_create", description: "Create decision or scenario" },
      { name: "entity_select", description: "Select entity" },
      { name: "entity_update", description: "Update entity (strategy_mode, etc)" },
      { name: "artifact_export", description: "Export scenario-json" },
      { name: "artifact_import", description: "Import scenario-json" }
    ];
  };

  window.webmcp_invoke_tool = (tool_name, args) => {
    try {
      switch (tool_name) {
        case "editor_update_property":
          if (args.object_type === 'phase' && args.property === 'slot') {
             // Expects object_id like "tx1-begin"
             const parts = args.object_id.split('-');
             if (parts.length > 1) {
                const txId = parts[0];
                movePhase(txId, args.object_id, args.value);
                return { success: true, message: `Moved ${args.object_id} to slot ${args.value}` };
             }
          }
          return { success: false, error: "Invalid phase update" };

        case "entity_update":
          if (args.entity_type === 'strategy' || args.entity === 'strategy') {
            updateStrategy(args.updates.strategy_mode || args.value);
            return { success: true, message: `Updated strategy` };
          }
          return { success: false, error: "Unsupported entity update" };

        case "artifact_export":
          const exported = {
            schemaVersion: "transaction-interleaving/v1",
            id: `scenario-${Date.now()}`,
            name: "Exported Scenario",
            strategy: state.strategy,
            transactions: JSON.parse(JSON.stringify(state.transactions)),
            decisions: [],
            exportedAt: new Date().toISOString()
          };
          return { success: true, data: JSON.stringify(exported) };

        case "artifact_import":
          return { success: true, message: "Import not fully implemented in mock" };

        default:
          return { success: false, error: "Tool not implemented" };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  };
}
