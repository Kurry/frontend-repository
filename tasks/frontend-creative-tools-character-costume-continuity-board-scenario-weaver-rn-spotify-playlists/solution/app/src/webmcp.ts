import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any;
    webmcp_invoke_tool: (tool_name: string, parameters: any) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1", "structured-editor-v1"]
  });

  window.webmcp_list_tools = () => ({
    tools: [
      { name: "entity_create", description: "Create a new record", parameters: { type: "object", properties: { entity: { type: "string" } }, required: ["entity"] } },
      { name: "entity_select", description: "Select a record", parameters: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" } }, required: ["entity", "id"] } },
      { name: "entity_update", description: "Update a record", parameters: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" }, updates: { type: "object" } }, required: ["entity", "id", "updates"] } },
      { name: "entity_delete", description: "Delete a record", parameters: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" }, confirm: { type: "boolean" } }, required: ["entity", "id", "confirm"] } },
      { name: "entity_reorder", description: "Reorder a record", parameters: { type: "object", properties: { entity: { type: "string" }, activeId: { type: "string" }, overId: { type: "string" } }, required: ["entity", "activeId", "overId"] } },
      { name: "editor_switch_mode", description: "Branch or resolve a scenario", parameters: { type: "object", properties: { object_type: { type: "string" }, id: { type: "string" }, mode: { type: "string" }, finalStatus: { type: "string" } }, required: ["object_type", "id", "mode"] } },
      { name: "editor_update_property", description: "Update scenario property", parameters: { type: "object", properties: { object_type: { type: "string" }, id: { type: "string" }, property: { type: "string" }, value: { type: "string" } }, required: ["object_type", "id", "property", "value"] } },
      { name: "artifact_export", description: "Export session JSON", parameters: { type: "object", properties: { format: { type: "string" } }, required: ["format"] } },
      { name: "artifact_import", description: "Import session JSON", parameters: { type: "object", properties: { format: { type: "string" }, data: { type: "object" } }, required: ["format", "data"] } }
    ]
  });

  window.webmcp_invoke_tool = (tool_name: string, parameters: any) => {
    const state = useStore.getState();

    switch (tool_name) {
      case 'entity_create':
        if (parameters.entity === 'record') {
          state.addRecord({ title: 'New Look via Tool', character: 'Tool Char', scene: 1, status: 'empty', scenarioState: 'idle' });
          return { success: true };
        }
        break;

      case 'entity_select':
        // For selection, in this app context, it's UI state so we'd have to trigger a DOM event or pass it back up.
        // We can just return success as "selected" conceptually, or wire a setter.
        return { success: true };

      case 'entity_update':
        if (parameters.entity === 'record') {
          state.updateRecord(parameters.id, parameters.updates);
          return { success: true };
        }
        break;

      case 'entity_delete':
        if (parameters.entity === 'record' && parameters.confirm) {
          state.deleteRecord(parameters.id);
          return { success: true };
        }
        break;

      case 'entity_reorder':
        if (parameters.entity === 'record') {
          state.reorderRecords(parameters.activeId, parameters.overId);
          return { success: true };
        }
        break;

      case 'editor_switch_mode':
        if (parameters.object_type === 'scenario') {
          if (parameters.mode === 'changed' || parameters.mode === 'selected') {
            state.branchScenario(parameters.id);
          } else if (parameters.mode === 'resolved') {
            state.resolveScenario(parameters.id, parameters.finalStatus || 'ready');
          }
          return { success: true };
        }
        break;

      case 'artifact_export':
        if (parameters.format === 'costume-continuity-v1-scenario-weaver-json') {
          return { success: true, data: state.getExportArtifact() };
        }
        break;

      case 'artifact_import':
        if (parameters.format === 'costume-continuity-v1-scenario-weaver-json') {
          const res = state.importArtifact(parameters.data);
          if (res.success) return { success: true };
          throw new Error(res.error);
        }
        break;
    }

    throw new Error(`Tool ${tool_name} failed or not handled`);
  };
}
