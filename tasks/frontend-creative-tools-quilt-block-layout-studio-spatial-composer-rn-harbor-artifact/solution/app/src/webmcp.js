import { useStore } from './store.js';

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    name: 'quilt-block-layout-studio',
    version: '1.0.0'
  });

  window.webmcp_list_tools = () => {
    return [
      {
        name: 'seed_records',
        description: 'Seed initial records for testing',
        inputSchema: {
          type: 'object',
          properties: {
            records: { type: 'array' },
            capacity: { type: 'number' }
          },
          required: ['records']
        }
      },
      {
        name: 'query_state',
        description: 'Query current state',
        inputSchema: { type: 'object', properties: {} }
      },
      {
         name: 'import_artifact',
         description: 'Import artifact JSON',
         inputSchema: {
             type: 'object',
             properties: {
                 data: { type: 'object' }
             },
             required: ['data']
         }
      }
    ];
  };

  window.webmcp_invoke_tool = async (toolName, args) => {
    const store = useStore.getState();

    if (toolName === 'seed_records') {
      store.setRecords(args.records);
      if (args.capacity) {
        useStore.setState(state => ({
            spatialComposerState: {
                ...state.spatialComposerState,
                capacity: args.capacity
            },
            derived: {
                ...state.derived,
                summary: {
                    ...state.derived.summary,
                    totalBlocks: args.records.length,
                    remainingCapacity: args.capacity - state.derived.summary.usedCapacity
                }
            }
        }));
      }
      return { result: 'ok' };
    }

    if (toolName === 'query_state') {
      return {
          result: {
              records: store.records,
              spatialComposerState: store.spatialComposerState,
              derived: store.derived
          }
      };
    }

    if (toolName === 'import_artifact') {
        const data = args.data;
        if (!data || data.schemaVersion !== 'v1') {
            return { result: 'error', error: 'Invalid schema' };
        }

        // Field validation: reject if duplicate IDs
        const ids = new Set();
        for (let r of (data.records || [])) {
            if (ids.has(r.id)) return { result: 'error', error: 'Duplicate IDs' };
            ids.add(r.id);
        }

        store.importArtifact(data);
        return { result: 'ok' };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  };
}
