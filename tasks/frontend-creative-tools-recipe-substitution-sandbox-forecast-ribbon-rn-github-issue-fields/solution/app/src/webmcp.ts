import { useStore } from './store';

// Helper to access state functions outside components
const getStore = () => useStore.getState();

const tools = [
  // Editor operations (forecast ribbon)
  {
    name: 'editor_select',
    description: 'Select an ingredient to load into the forecast ribbon',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id']
    }
  },
  {
    name: 'editor_update_property',
    description: 'Update substitute properties on the ribbon',
    inputSchema: {
      type: 'object',
      properties: {
        substitute: { type: 'string' },
        substituteAmount: { type: 'number' },
        substituteUnit: { type: 'string' }
      }
    }
  },
  {
    name: 'editor_undo',
    description: 'Undo the last action on the ribbon',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'editor_preview',
    description: 'Get derived state/preview of the current ribbon selection',
    inputSchema: { type: 'object', properties: {} }
  },

  // Entity operations (recipe ingredients list)
  {
    name: 'entity_create',
    description: 'Create a new recipe ingredient',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        amount: { type: 'number' },
        unit: { type: 'string' },
        status: { type: 'string' }
      },
      required: ['name', 'amount', 'unit', 'status']
    }
  },
  {
    name: 'entity_select',
    description: 'Select an entity (duplicate of editor_select but part of entity spec)',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id']
    }
  },
  {
    name: 'entity_update',
    description: 'Update an existing recipe ingredient',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        amount: { type: 'number' },
        unit: { type: 'string' },
        status: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'entity_delete',
    description: 'Delete a recipe ingredient',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id']
    }
  },

  // Artifact operations
  {
    name: 'artifact_export',
    description: 'Export the session artifact',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'artifact_import',
    description: 'Import a session artifact payload',
    inputSchema: {
      type: 'object',
      properties: {
        payload: { type: 'object' }
      },
      required: ['payload']
    }
  }
];

export const initWebMCP = () => {
  (window as any).webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1']
  });

  (window as any).webmcp_list_tools = () => tools;

  (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = getStore();

    switch (toolName) {
      // Editor / Ribbon
      case 'editor_select':
      case 'entity_select':
        store.selectRecord(args.id);
        return { result: `Selected ${args.id}` };

      case 'editor_update_property':
        store.mutateSelectedOnRibbon(args);
        return { result: 'Mutated on ribbon' };

      case 'editor_undo':
        store.undo();
        return { result: 'Undo executed' };

      case 'editor_preview':
        const selected = store.records.find(r => r.id === store.selectedId);
        return { result: selected || null };

      // Entity / Collection
      case 'entity_create':
        store.addRecord(args as any);
        return { result: 'Created' };

      case 'entity_update':
        const { id, ...updates } = args;
        store.updateRecord(id, updates);
        return { result: 'Updated' };

      case 'entity_delete':
        store.deleteRecord(args.id);
        return { result: 'Deleted' };

      // Artifact
      case 'artifact_export':
        store.exportSession();
        const current = getStore();
        return {
          result: {
            schemaVersion: 'v1',
            exportedAt: current.exportedAt,
            records: current.records
          }
        };

      case 'artifact_import':
        store.importSession(args.payload);
        return { result: 'Imported' };

      default:
        throw new Error(`Tool not found: ${toolName}`);
    }
  };
};
