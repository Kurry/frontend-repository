// Standard WebMCP Modules integration
export function initializeWebMCP({ session, addRecord, updateRecord, deleteRecord }) {
  const handlers = {
    // structured-editor-v1 & entity-collection-v1
    'create_record': (args) => {
      addRecord(args);
      return { status: 'success', id: args.id };
    },
    'update_record': (args) => {
      updateRecord(args.id, args.updates);
      return { status: 'success', id: args.id };
    },
    'delete_record': (args) => {
      deleteRecord(args.id);
      return { status: 'success', id: args.id };
    },
    'get_records': () => {
      return { records: session.records };
    },

    // artifact-transfer-v1
    'export_artifact': () => {
      return {
        artifact: {
          ...session,
          exportedAt: new Date().toISOString()
        }
      };
    },

    // Custom domain operations
    'resolve_failed_record': (args) => {
      const { id, resolutionType } = args; // 'sync', 'mute', 'archive'

      const record = session.records.find(r => r.id === id);
      if (!record) throw new Error("Record not found");
      if (record.status !== 'failed') throw new Error("Record is not in failed state");

      let updates = { status: 'changed', recoveryNotes: '' };

      if (resolutionType === 'sync') {
        updates = { ...updates, startTime: 0 };
      } else if (resolutionType === 'mute') {
        updates = { ...updates, volume: 0 };
      } else if (resolutionType === 'archive') {
        updates = { status: 'archived', recoveryNotes: 'Archived via recovery board' };
      }

      updateRecord(id, updates);
      return { status: 'success', id };
    },

    'get_summary': () => {
      return { summary: session.derived.summary };
    }
  };

  const toolMeta = [
    { name: 'create_record', module: 'entity-collection-v1', description: 'Create a new sound layer record' },
    { name: 'update_record', module: 'entity-collection-v1', description: 'Update an existing sound layer record' },
    { name: 'delete_record', module: 'entity-collection-v1', description: 'Delete a sound layer record' },
    { name: 'get_records', module: 'entity-collection-v1', description: 'Get all sound layer records' },
    { name: 'export_artifact', module: 'artifact-transfer-v1', description: 'Export the complete session artifact' },
    { name: 'resolve_failed_record', module: 'structured-editor-v1', description: 'Apply a resolution to a failed record via the recovery board' },
    { name: 'get_summary', module: 'structured-editor-v1', description: 'Get the derived session summary' },
  ];

  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    contractVersion: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tool_names: toolMeta.map((tool) => tool.name),
    toolNames: toolMeta.map((tool) => tool.name),
    tools: toolMeta.map((tool) => tool.name),
  });

  window.webmcp_list_tools = async () => toolMeta;

  window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
    const name = typeof request === "string" ? request : request?.name;
    const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
    const handler = handlers[name];
    if (!handler) throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);

    // We need to pick args depending on caller shape
    const pickedArgs = { ...(args.data || args.entity_fields || args.payload || args.fields || {}), ...args };
    return handler(pickedArgs);
  };

  // Expose as an object as well to support different integrations
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
