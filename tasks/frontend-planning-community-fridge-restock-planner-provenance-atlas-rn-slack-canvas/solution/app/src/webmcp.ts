import type { Store } from './store.js';

export function setupWebMCP(getStore: () => Store) {
  // @ts-ignore
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    task_name: "eval-intelligence/frontend-planning-community-fridge-restock-planner-provenance-atlas-rn-slack-canvas",
  });

  // @ts-ignore
  window.webmcp_list_tools = () => [
    {
      name: 'entity.create',
      module: 'entity-collection-v1',
      description: 'Create a restock record',
      schema: {
        type: 'object',
        properties: {
          fields: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'string' },
              source: { type: 'string' },
            }
          }
        }
      }
    },
    {
      name: 'entity.select',
      module: 'entity-collection-v1',
      description: 'Select a record',
      schema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    },
    {
      name: 'entity.update',
      module: 'entity-collection-v1',
      description: 'Update a record',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fields: {
            type: 'object',
            properties: { status: { type: 'string' } }
          }
        },
        required: ['id', 'fields']
      }
    },
    {
      name: 'entity.delete',
      module: 'entity-collection-v1',
      description: 'Delete a record',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          confirm: { type: 'boolean' }
        },
        required: ['id', 'confirm']
      }
    },
    {
      name: 'editor.select',
      module: 'structured-editor-v1',
      description: 'Select lineage in provenance atlas',
      schema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    },
    {
      name: 'editor.switch_mode',
      module: 'structured-editor-v1',
      description: 'Switch mode in provenance atlas (quarantine)',
      schema: {
        type: 'object',
        properties: { mode: { type: 'string' } },
        required: ['mode']
      }
    },
    {
      name: 'artifact.export',
      module: 'artifact-transfer-v1',
      description: 'Export session artifact',
      schema: {
        type: 'object',
        properties: { format: { type: 'string' } },
        required: ['format']
      }
    },
    {
      name: 'artifact.import',
      module: 'artifact-transfer-v1',
      description: 'Import session artifact',
      schema: {
        type: 'object',
        properties: { mode: { type: 'string' } },
        required: ['mode']
      }
    }
  ];

  // @ts-ignore
  window.webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = getStore();

    switch (toolName) {
      case 'entity.create': {
        const { fields } = args;
        store.addRecord({
          name: fields.name,
          quantity: parseInt(fields.quantity, 10),
          source: fields.source,
        });
        return { result: 'created' };
      }
      case 'entity.select': {
        return { result: 'selected', record: store.records.find(r => r.id === args.id) };
      }
      case 'entity.update': {
        store.updateRecord(args.id, args.fields);
        return { result: 'updated' };
      }
      case 'entity.delete': {
        if (args.confirm) {
          store.deleteRecord(args.id);
        }
        return { result: 'deleted' };
      }
      case 'editor.select': {
        store.selectLineage(args.id);
        return { result: 'selected', record: store.records.find(r => r.id === args.id) };
      }
      case 'editor.switch_mode': {
        if (args.mode === 'quarantine' && store.selectedId) {
          store.traceAndQuarantine(store.selectedId);
        }
        return { result: 'mode_switched' };
      }
      case 'artifact.export': {
        const json = store.exportArtifact();
        return { result: 'export_started', artifact: JSON.parse(json) };
      }
      case 'artifact.import': {
        return { result: 'import_started' };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
