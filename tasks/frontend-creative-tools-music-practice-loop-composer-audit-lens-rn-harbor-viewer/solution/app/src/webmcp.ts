import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (request: any) => Promise<any>;
  }
}

const toolMeta = [
  {
    name: 'editor_select_loop_segment',
    module: 'structured-editor-v1',
    description: 'Select a loop segment to audit.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'editor_update_property_loop_segment',
    module: 'structured-editor-v1',
    description: 'Update properties on the loop segment (e.g. attach evidence, resolve conflict).',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, evidence: { type: 'string' }, resolve: { type: 'boolean' } }, required: ['id'] }
  },
  {
    name: 'entity_create_practice_segment',
    module: 'entity-collection-v1',
    description: 'Create a new practice segment.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, instrument: { type: 'string' }, bpm: { type: 'number' }, status: { type: 'string' } }, required: ['title', 'instrument', 'bpm'] }
  },
  {
    name: 'entity_select_practice_segment',
    module: 'entity-collection-v1',
    description: 'Select a practice segment from the collection.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'entity_update_practice_segment',
    module: 'entity-collection-v1',
    description: 'Update a practice segment.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, updates: { type: 'object' } }, required: ['id', 'updates'] }
  },
  {
    name: 'entity_delete_practice_segment',
    module: 'entity-collection-v1',
    description: 'Delete a practice segment.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id', 'confirm'] }
  },
  {
    name: 'entity_reorder_practice_segment',
    module: 'entity-collection-v1',
    description: 'Reorder practice segments.',
    inputSchema: { type: 'object', properties: { fromIndex: { type: 'number' }, toIndex: { type: 'number' } }, required: ['fromIndex', 'toIndex'] }
  },
  {
    name: 'artifact_export_session_json',
    module: 'artifact-transfer-v1',
    description: 'Export the session as JSON (stub).',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'artifact_import_session_json',
    module: 'artifact-transfer-v1',
    description: 'Import the session from JSON (stub).',
    inputSchema: { type: 'object', properties: {}, required: [] }
  }
];

export function registerWebMcpTools() {
  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = async () => toolMeta.map(({ name, module, description, inputSchema }) => ({ name, module, description, inputSchema }));

  window.webmcp_invoke_tool = async (request: any) => {
    const { method: name, params: { arguments: args } } = request;
    const store = useStore.getState();

    switch (name) {
      case 'editor_select_loop_segment':
      case 'entity_select_practice_segment':
        store.selectRecordForAudit(args.id);
        return { content: [{ type: 'text', text: `Selected record ${args.id}` }] };

      case 'editor_update_property_loop_segment':
        if (args.evidence) {
          store.attachEvidence(args.id, args.evidence);
          return { content: [{ type: 'text', text: `Attached evidence to ${args.id}` }] };
        }
        if (args.resolve) {
          store.resolveConflict(args.id);
          return { content: [{ type: 'text', text: `Resolved conflict on ${args.id}` }] };
        }
        return { content: [{ type: 'text', text: 'No recognized update property provided.' }] };

      case 'entity_create_practice_segment':
        const newId = crypto.randomUUID();
        store.addRecord({
          id: newId,
          title: args.title,
          instrument: args.instrument,
          bpm: args.bpm,
          status: args.status || 'draft',
        });
        return { content: [{ type: 'text', text: `Created record ${newId}` }] };

      case 'entity_update_practice_segment':
        store.updateRecord(args.id, args.updates);
        return { content: [{ type: 'text', text: `Updated record ${args.id}` }] };

      case 'entity_delete_practice_segment':
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true.");
        store.deleteRecord(args.id);
        return { content: [{ type: 'text', text: `Deleted record ${args.id}` }] };

      case 'entity_reorder_practice_segment':
        const records = [...store.records];
        const temp = records[args.fromIndex];
        records[args.fromIndex] = records[args.toIndex];
        records[args.toIndex] = temp;
        store.reorderRecords(records);
        return { content: [{ type: 'text', text: `Reordered records` }] };

      case 'artifact_export_session_json':
        return { content: [{ type: 'text', text: 'Success (export artifact workflow invoked via WebMCP)' }] };

      case 'artifact_import_session_json':
        return { content: [{ type: 'text', text: 'Success (import artifact workflow invoked via WebMCP)' }] };

      default:
        throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);
    }
  };
}
