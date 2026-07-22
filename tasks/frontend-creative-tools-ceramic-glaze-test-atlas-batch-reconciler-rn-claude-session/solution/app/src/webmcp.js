import { useStore } from './store';

window.webmcp_session_info = {
    name: "Ceramic Glaze Test Atlas",
    version: "1.0.0"
};

window.webmcp_list_tools = () => [
  { name: 'listTests', description: 'Returns all glaze tests.' },
  { name: 'createTest', description: 'Create a new test. Pass record data.' },
  { name: 'updateTest', description: 'Update a test. Pass id and updates.' },
  { name: 'deleteTest', description: 'Archive/Delete a test. Pass id.' },
  { name: 'reconcileBatch', description: 'Group selected tests into a batch. Pass selectedIds array and batchName.' },
  { name: 'exportSession', description: 'Exports session data as JSON.' },
  { name: 'importSession', description: 'Imports session data from JSON. Pass data.' }
];

window.webmcp_invoke_tool = async (toolName, args) => {
  const store = useStore.getState();

  try {
    switch (toolName) {
      case 'listTests':
        return { success: true, result: store.records };
      case 'createTest':
        store.createRecord(args);
        return { success: true, result: 'Created' };
      case 'updateTest':
        store.updateRecord(args.id, args.updates);
        return { success: true, result: 'Updated' };
      case 'deleteTest':
        store.archiveRecord(args.id);
        return { success: true, result: 'Archived' };
      case 'reconcileBatch':
        store.reconcileBatch(args.selectedIds, args.batchName);
        return { success: true, result: 'Batched' };
      case 'exportSession':
        return { success: true, result: {
          schemaVersion: store.schemaVersion,
          exportedAt: store.exportedAt,
          records: store.records,
          derived: store.derived,
          history: store.history
        }};
      case 'importSession':
        store.importState(args.data);
        return { success: true, result: 'Imported' };
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
