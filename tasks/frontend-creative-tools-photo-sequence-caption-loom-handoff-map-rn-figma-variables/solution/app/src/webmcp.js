export function initWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'artifact-transfer-v1', 'structured-editor-v1'],
    status: 'ready'
  });

  window.webmcp_list_tools = () => ([
    {
      name: 'entity_create',
      description: 'Create a new record',
      input_schema: { type: 'object', properties: { title: { type: 'string' } } }
    },
    {
      name: 'entity_select',
      description: 'Select a record by ID',
      input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
    },
    {
      name: 'entity_update',
      description: 'Update a record',
      input_schema: { type: 'object', properties: { id: { type: 'string' }, updates: { type: 'object' } }, required: ['id', 'updates'] }
    },
    {
      name: 'entity_delete',
      description: 'Delete a record',
      input_schema: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id', 'confirm'] }
    },
    {
      name: 'artifact_export',
      description: 'Export session as JSON',
      input_schema: { type: 'object', properties: { format: { type: 'string' } }, required: ['format'] }
    },
    {
      name: 'artifact_import',
      description: 'Import session from JSON data',
      input_schema: { type: 'object', properties: { data: { type: 'object' } }, required: ['data'] }
    },
    {
      name: 'editor_add',
      description: 'Add handoff connection',
      input_schema: { type: 'object', properties: { id: { type: 'string' }, owner: { type: 'string' }, readiness: { type: 'string' } }, required: ['id', 'owner', 'readiness'] }
    }
  ]);

  window.webmcp_invoke_tool = (tool_name, arguments_obj) => {
    const state = window.__APP_STATE;
    const actions = window.__APP_ACTIONS;

    if (!state || !actions) {
      throw new Error("Application state not initialized.");
    }

    switch (tool_name) {
      case 'entity_create': {
        const id = Date.now().toString();
        const record = {
          id,
          title: arguments_obj.title || 'New Sequence',
          status: 'draft',
          owner: ''
        };
        actions.addRecord(record);
        return { result: record };
      }
      case 'entity_select': {
        // We simulate selection by returning the selected item.
        // Full UI selection might require exposing setSelectedId, but for MCP returning data is often enough.
        const record = state.records.find(r => r.id === arguments_obj.id);
        if (!record) throw new Error(`Record ${arguments_obj.id} not found.`);
        return { result: record };
      }
      case 'entity_update': {
        const record = state.records.find(r => r.id === arguments_obj.id);
        if (!record) throw new Error(`Record ${arguments_obj.id} not found.`);
        actions.updateRecord(arguments_obj.id, arguments_obj.updates);
        return { result: 'success' };
      }
      case 'entity_delete': {
        if (!arguments_obj.confirm) throw new Error("Delete requires confirm=true.");
        actions.deleteRecord(arguments_obj.id);
        return { result: 'success' };
      }
      case 'artifact_export': {
        if (arguments_obj.format !== 'photo-caption-v1-handoff-map.json') {
          throw new Error("Invalid export format.");
        }
        return {
          result: {
            schemaVersion: "v1",
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived: state.derived,
            history: state.history
          }
        };
      }
      case 'artifact_import': {
        actions.importData(arguments_obj.data);
        return { result: 'success' };
      }
      case 'editor_add': {
        const { id, owner, readiness } = arguments_obj;
        const record = state.records.find(r => r.id === id);
        if (!record) throw new Error(`Record ${id} not found.`);
        if (record.status === 'archived') throw new Error(`Cannot map handoff for archived records.`);

        actions.updateHandoff(id, {
          owner,
          status: readiness === 'resolved' ? 'ready' : 'changed',
          handoffState: readiness
        });
        return { result: 'success' };
      }
      default:
        throw new Error(`Tool ${tool_name} not found.`);
    }
  };
}
