import { getState, dispatch } from './state';

export const setupWebMCP = () => {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    {
      name: "entity_create_record",
      description: "Create a new record",
      inputSchema: { type: "object", properties: { payload: { type: "object" } } },
      moduleId: "entity-collection-v1"
    },
    {
      name: "entity_select_record",
      description: "Select a record",
      inputSchema: { type: "object", properties: { id: { type: "string" } } },
      moduleId: "entity-collection-v1"
    },
    {
      name: "entity_update_record",
      description: "Update a record",
      inputSchema: { type: "object", properties: { id: { type: "string" }, updates: { type: "object" } } },
      moduleId: "entity-collection-v1"
    },
    {
      name: "entity_delete_record",
      description: "Delete a record",
      inputSchema: { type: "object", properties: { id: { type: "string" } } },
      moduleId: "entity-collection-v1"
    },
    {
      name: "artifact_export_brew_experiment_v1_batch_reconciler",
      description: "Export artifact",
      inputSchema: { type: "object", properties: {} },
      moduleId: "artifact-transfer-v1"
    },
    {
      name: "artifact_import_brew_experiment_v1_batch_reconciler",
      description: "Import artifact",
      inputSchema: { type: "object", properties: { data: { type: "object" } } },
      moduleId: "artifact-transfer-v1"
    }
  ];

  window.webmcp_invoke_tool = async (toolName, args, ctx) => {
    switch (toolName) {
      case "entity_create_record":
        dispatch({ type: 'CREATE_RECORD', payload: args.payload || {} });
        return { ok: true, status: 'success', navigation_epoch: ctx.navigationEpoch };
      case "entity_update_record":
        dispatch({ type: 'UPDATE_RECORD', payload: { id: args.id, ...args.updates } });
        return { ok: true, status: 'success', navigation_epoch: ctx.navigationEpoch };
      case "entity_delete_record":
        dispatch({ type: 'DELETE_RECORD', payload: { id: args.id } });
        return { ok: true, status: 'success', navigation_epoch: ctx.navigationEpoch };
      case "artifact_export_brew_experiment_v1_batch_reconciler":
        const state = getState();
        const exportData = {
          ...state,
          exportedAt: new Date().toISOString()
        };
        return { ok: true, status: 'success', data: exportData, navigation_epoch: ctx.navigationEpoch };
      case "artifact_import_brew_experiment_v1_batch_reconciler":
        dispatch({ type: 'IMPORT', payload: args.data });
        return { ok: true, status: 'success', navigation_epoch: ctx.navigationEpoch };
      default:
        return { ok: false, status: 'unknown_tool', navigation_epoch: ctx.navigationEpoch };
    }
  };
};
