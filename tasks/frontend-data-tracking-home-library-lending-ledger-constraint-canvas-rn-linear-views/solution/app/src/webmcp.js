// webmcp.js
export function registerWebMCP() {
  if (typeof window === 'undefined') return;

  function pickArgs(args = {}) {
    const nested = args.data || args.entity_fields || args.payload || args.fields || {};
    return { ...nested, ...args };
  }

  const handlers = {
    editor_select: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;
      const state = app.getState();
      const record = state.records.find(r => r.id === args.id || r.title === args.id || r.title === args.title);
      if (!record) throw new Error('Record not found');
      return { success: true, selected: record };
    },
    editor_update_property: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;

      const property = String(args.property ?? "").toLowerCase();
      const value = String(args.value ?? "");
      const id = args.id;

      if (property === 'constraintlane' || property === 'constraint-lane') {
        const state = app.getState();
        const record = state.records.find(r => r.id === id || r.title === id);
        if (!record) throw new Error('Record not found');

        let newStatus = record.status;
        if (value === 'conflict') newStatus = 'changed';
        else if (value === 'available' && record.constraintLane === 'conflict') newStatus = 'ready';

        app.dispatch('UPDATE_RECORD_LANE', { id: record.id, constraintLane: value, status: newStatus });
        return { success: true };
      }
      throw new Error(`Unsupported property update via WebMCP: ${property}`);
    },
    entity_create: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;
      app.dispatch('CREATE_RECORD', { record: args });
      return { success: true };
    },
    entity_select: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;
      const state = app.getState();
      const records = args.filters ? state.records.filter(r => r.status === args.filters.status) : state.records;
      return { success: true, entities: records };
    },
    entity_update: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;
      app.dispatch('UPDATE_RECORD', { id: args.id, data: args });
      return { success: true };
    },
    entity_delete: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      if (!args.confirm) throw new Error('Explicit confirm=true required to delete');
      const app = window.__APP_STATE__;
      app.dispatch('DELETE_RECORD', { id: args.id });
      return { success: true };
    },
    artifact_export: async (raw = {}) => {
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;
      const state = app.getState();
      const exportPayload = {
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records: state.records,
        derived: {
          summary: {
            total: state.records.length,
            available: state.records.filter(r => r.constraintLane === 'available').length,
            borrowed: state.records.filter(r => r.constraintLane === 'borrowed').length,
            conflict: state.records.filter(r => r.constraintLane === 'conflict').length,
          }
        },
        history: state.history
      };
      return { success: true, artifact: exportPayload };
    },
    artifact_import: async (raw = {}) => {
      const args = pickArgs(raw);
      if (!window.__APP_STATE__) throw new Error('App not ready');
      const app = window.__APP_STATE__;
      const data = args.artifact || args;
      if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
      app.dispatch('IMPORT', { records: data.records });
      return { success: true };
    }
  };

  const toolMeta = [
    { name: "editor_select", module: "structured-editor-v1" },
    { name: "editor_update_property", module: "structured-editor-v1" },
    { name: "entity_create", module: "entity-collection-v1" },
    { name: "entity_select", module: "entity-collection-v1" },
    { name: "entity_update", module: "entity-collection-v1" },
    { name: "entity_delete", module: "entity-collection-v1" },
    { name: "artifact_export", module: "artifact-transfer-v1" },
    { name: "artifact_import", module: "artifact-transfer-v1" }
  ];

  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    contractVersion: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tool_names: toolMeta.map((tool) => tool.name),
    toolNames: toolMeta.map((tool) => tool.name),
    tools: toolMeta.map((tool) => tool.name),
  });

  window.webmcp_list_tools = async () => toolMeta.map(({ name, module, description, inputSchema }) => ({ name, module, description, inputSchema }));

  window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
    const name = typeof request === "string" ? request : request?.name;
    const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
    const handler = handlers[name];
    if (!handler) throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);
    return handler(args);
  };

  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
