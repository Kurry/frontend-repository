import { store, addRecord, updateRecord, deleteRecord, selectRecord, importArtifact } from './store.js';

export function setupWebMCP() {
  window.webmcp_session_info = {
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  };

  const tools = [
    {
      name: 'entity_create_record',
      description: 'Create a new record',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          capacity: { type: 'number' },
          used: { type: 'number' },
          status: { type: 'string' }
        },
        required: ['name', 'capacity', 'used']
      }
    },
    {
      name: 'entity_select_record',
      description: 'Select a record to place in the spatial composer',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'entity_update_record',
      description: 'Update a record',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          updates: { type: 'object' }
        },
        required: ['id', 'updates']
      }
    },
    {
      name: 'entity_delete_record',
      description: 'Delete a record',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'artifact_export_energy-peak-v1-spatial-composer-json',
      description: 'Export session artifact',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'artifact_import_energy-peak-v1-spatial-composer-json',
      description: 'Import session artifact',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'object' }
        },
        required: ['data']
      }
    }
  ];

  window.webmcp_list_tools = () => {
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.parameters
    }));
  };

  window.webmcp_invoke_tool = async (toolName, args) => {
    switch (toolName) {
      case 'entity_create_record': {
        const newRecord = {
          id: 'rec-' + Date.now(),
          name: args.name,
          capacity: args.capacity,
          used: args.used,
          status: args.status || (args.used === 0 ? 'empty' : 'ready')
        };
        addRecord(newRecord);
        return { success: true, record: newRecord };
      }

      case 'entity_select_record': {
        selectRecord(args.id);
        return { success: true };
      }

      case 'entity_update_record': {
        updateRecord(args.id, args.updates);
        return { success: true };
      }

      case 'entity_delete_record': {
        deleteRecord(args.id);
        return { success: true };
      }

      case 'artifact_export_energy-peak-v1-spatial-composer-json': {
        const payload = {
          schemaVersion: store.schemaVersion,
          exportedAt: new Date().toISOString(),
          records: store.records,
          derived: store.derived,
          history: store.history
        };
        return { success: true, artifact: payload };
      }

      case 'artifact_import_energy-peak-v1-spatial-composer-json': {
        const success = importArtifact(args.data);
        return { success };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
