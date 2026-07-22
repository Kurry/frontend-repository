export function setupWebMCP(getState, setState) {
  window.webmcp_session_info = () => ({
    status: 'ready',
    api_version: '1.0'
  });

  window.webmcp_list_tools = () => [
    {
      name: 'seed_records',
      description: 'Seeds the initial state with deterministic bike service records for verification.',
      input_schema: {
        type: 'object',
        properties: {
          records: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                state: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived', 'conflict'] },
                details: { type: 'object' }
              },
              required: ['id', 'state', 'details']
            }
          }
        },
        required: ['records']
      }
    },
    {
      name: 'query_state',
      description: 'Returns the current state of the application for verification.',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'export_artifact',
      description: 'Triggers the download of the current session artifact.',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'import_artifact',
      description: 'Simulates a user importing an artifact.',
      input_schema: {
        type: 'object',
        properties: {
          artifact_content: { type: 'string' }
        },
        required: ['artifact_content']
      }
    }
  ];

  window.webmcp_invoke_tool = async (tool_name, args) => {
    switch (tool_name) {
      case 'seed_records':
        setState(prev => ({
          ...prev,
          records: args.records,
          history: [...prev.history, { type: 'seed', state: args.records }]
        }));
        return { success: true };

      case 'query_state':
        const state = getState();
        return {
          records: state.records,
          constraintCanvasState: state.constraintCanvasState,
          derivedSummary: state.derivedSummary,
          history: state.history
        };

      case 'export_artifact':
        const exportState = getState();
        const exportData = {
          schemaVersion: 'bike-maintenance-v1',
          exportedAt: new Date().toISOString(),
          records: exportState.records,
          derived: exportState.derivedSummary,
          history: exportState.history
        };
        // Simulated download handled by app UI, just return the data here
        return { artifact: exportData };

      case 'import_artifact':
        try {
          const data = JSON.parse(args.artifact_content);
          if (data.schemaVersion === 'bike-maintenance-v1') {
            setState(prev => ({
              ...prev,
              records: data.records,
              history: data.history || []
            }));
            return { success: true };
          }
          return { error: 'Invalid schemaVersion' };
        } catch (e) {
          return { error: 'Invalid JSON' };
        }

      default:
        return { error: `Tool ${tool_name} not found` };
    }
  };
}
