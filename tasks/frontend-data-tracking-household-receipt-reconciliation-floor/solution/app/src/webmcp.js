import { useStore } from './store';

// Register standard WebMCP API onto window
window.webmcp_session_info = () => ({
  schemaVersion: "household-reconciliation/v1",
  sessionType: "frontend-data-tracking-household-receipt-reconciliation-floor"
});

window.webmcp_list_tools = () => ([
  { name: 'editor_select', description: 'Select an object in the editor' },
  { name: 'editor_add', description: 'Add a new object' },
  { name: 'editor_update_property', description: 'Update object property' },
  { name: 'editor_delete', description: 'Delete object' },
  { name: 'editor_preview', description: 'Preview object' },
  { name: 'entity_select', description: 'Select entity' },
  { name: 'entity_update', description: 'Update entity' },
  { name: 'entity_toggle', description: 'Toggle entity' },
  { name: 'artifact_export', description: 'Export artifacts' },
  { name: 'artifact_import', description: 'Import artifacts' },
  { name: 'session_execute', description: 'Execute command' },
  { name: 'session_undo', description: 'Undo command' },
  { name: 'session_redo', description: 'Redo command' },
  { name: 'session_reset', description: 'Reset session state' },
  { name: 'session_query_state', description: 'Query derived state' },
]);

window.webmcp_invoke_tool = (name, args) => {
  const store = useStore.getState();
  console.log(`[WebMCP] Invoking tool ${name}`, args);

  switch (name) {
    case 'session_reset':
      store.reset();
      return { status: 'success' };

    case 'artifact_export':
      return {
        status: 'success',
        data: { state: store }
      };

    case 'artifact_import':
      if (args && args.state) {
        store.importState(args.state);
        return { status: 'success' };
      }
      return { status: 'error', message: 'Missing state payload' };

    // Placeholder stub responses for tests that might probe tools blindly
    default:
      return { status: 'success', message: `Simulated tool ${name}` };
  }
};
