import { useStore } from './store';

// Handlers for the tools
const handlers: Record<string, (args?: any) => any> = {
  entity_create_record: ({ record }: { record: any }) => {
    useStore.getState().addRecord(record);
    return { ok: true, message: `Created record for ${record.speakerName}` };
  },
  entity_update_record: ({ id, updates }: { id: string; updates: any }) => {
    useStore.getState().updateRecord(id, updates);
    return { ok: true, message: `Updated record ${id}` };
  },
  entity_delete_record: ({ id }: { id: string }) => {
    useStore.getState().deleteRecord(id);
    return { ok: true, message: `Deleted record ${id}` };
  },
  batch_reconcile_aggregate_totals: ({ ids }: { ids: string[] }) => {
    const state = useStore.getState();
    // Clear existing selection and select new ones
    state.clearSelection();
    ids.forEach(id => state.toggleSelection(id));
    // Reconcile
    useStore.getState().reconcileBatch();
    return { ok: true, message: `Batch reconciled ${ids.length} records.` };
  },
  artifact_export_session_json: () => {
    const data = useStore.getState().exportSession();
    return { ok: true, data };
  },
  artifact_import_session_json: ({ session }: { session: any }) => {
    const result = useStore.getState().importSession(session);
    return result;
  }
};

const definitions = [
  {
    name: 'entity_create_record',
    description: 'Create a new speaker slot record.',
    inputSchema: { type: 'object', properties: { record: { type: 'object' } }, required: ['record'] }
  },
  {
    name: 'entity_update_record',
    description: 'Update a speaker slot record.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, updates: { type: 'object' } }, required: ['id', 'updates'] }
  },
  {
    name: 'entity_delete_record',
    description: 'Delete a speaker slot record.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'batch_reconcile_aggregate_totals',
    description: 'Group selected records into a batch and reconcile aggregate totals.',
    inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } }, required: ['ids'] }
  },
  {
    name: 'artifact_export_session_json',
    description: 'Export the session to JSON.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'artifact_import_session_json',
    description: 'Import session from JSON.',
    inputSchema: { type: 'object', properties: { session: { type: 'object' } }, required: ['session'] }
  }
];

let registered = false;

export function registerWebMCPTools() {
  if (registered) return;
  registered = true;

  (window as any).webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    app: 'eval-intelligence/frontend-planning-conference-speaker-greenroom-board-batch-reconciler-rn-claude-session',
    toolNames: definitions.map((d) => d.name),
    tools: definitions,
  });

  (window as any).webmcp_list_tools = () => definitions;

  (window as any).webmcp_invoke_tool = async (name: string, args: any = {}) => {
    if (!handlers[name]) throw new Error(`Unknown WebMCP tool: ${name}`);
    return handlers[name](args);
  };
}
