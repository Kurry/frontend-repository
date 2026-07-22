import { useStore } from './store';

window.webmcp_session_info = {
  app_name: 'Release Impact Reconciliation Board',
  version: '1.0.0',
};

window.webmcp_list_tools = () => {
  return {
    tools: [
      {
        name: 'query_state',
        description: 'Queries the current canonical state of the impact board.',
        input_schema: {
          type: 'object',
          properties: {},
        }
      },
      {
        name: 'map_impact',
        description: 'Maps an entry to a surface and a rollout stage.',
        input_schema: {
          type: 'object',
          properties: {
            entryId: { type: 'string' },
            surfaceId: { type: 'string' },
            stage: { type: 'string' },
            canaryPercent: { type: 'number' }
          },
          required: ['entryId', 'surfaceId', 'stage']
        }
      }
    ]
  };
};

window.webmcp_invoke_tool = async (tool_name, params) => {
  const store = useStore.getState();

  if (tool_name === 'query_state') {
    return {
      success: true,
      result: {
        entries: store.entries,
        impactLinks: store.impactLinks,
        rolloutEvents: store.rolloutEvents,
        selectedEntryId: store.selectedEntryId
      }
    };
  }

  if (tool_name === 'map_impact') {
    store.mapImpact(params.entryId, params.surfaceId, params.stage, params.canaryPercent);
    return {
      success: true,
      result: { message: 'Impact mapped successfully' }
    };
  }

  return { success: false, error: 'Unknown tool' };
};
