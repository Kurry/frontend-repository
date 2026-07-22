const WEBMCP_TOOLS = [
  {
    name: 'seed_records',
    description: 'Seeds the application with a list of records.',
    parameters: {
      type: 'object',
      properties: {
        records: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              location: { type: 'string' },
              aqi: { type: 'number' },
              pm25: { type: 'number' },
              status: { type: 'string' },
              scenarioWeaverState: { type: 'string' }
            },
            required: ['id', 'location', 'aqi', 'status']
          }
        }
      },
      required: ['records']
    }
  },
  {
    name: 'branch_scenario',
    description: 'Branch a selected record into a scenario and compare linked outcomes.',
    parameters: {
      type: 'object',
      properties: {
        recordId: { type: 'string' },
        variantUpdates: {
          type: 'object',
          properties: {
            aqi: { type: 'number' }
          }
        }
      },
      required: ['recordId', 'variantUpdates']
    }
  },
  {
    name: 'query_state',
    description: 'Queries the current application state including records and derived summary.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
      name: 'import_artifact',
      description: 'Imports a complete artifact state.',
      parameters: {
          type: 'object',
          properties: {
              payload: {
                  type: 'object',
                  properties: {
                      schemaVersion: { type: 'string' },
                      records: { type: 'array' },
                      derived: { type: 'object' },
                      history: { type: 'array' }
                  },
                  required: ['schemaVersion', 'records']
              }
          },
          required: ['payload']
      }
  }
];

window.webmcp_session_info = {
    "supported_tools": WEBMCP_TOOLS.map(t => t.name),
    "version": "1.0.0"
};

window.webmcp_list_tools = async () => {
  return WEBMCP_TOOLS;
};

window.webmcp_invoke_tool = async (name, args) => {
  const state = window.__APP_STATE__;
  if (!state) {
    throw new Error("Application state is not initialized yet.");
  }

  switch (name) {
    case 'seed_records':
      state.setFullState({ records: args.records, derived: { summary: {} }, history: [] });
      state.records = args.records; // force immediate sync for derived update
      const summary = args.records.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
      }, {});
      state.setFullState({ records: args.records, derived: { summary }, history: [] });
      return { success: true, count: args.records.length };

    case 'branch_scenario':
      state.branchScenario(args.recordId, args.variantUpdates);
      return { success: true };

    case 'query_state':
      return {
        records: state.records,
        derived: state.derived,
        history: state.history,
        scenarioState: state.scenarioState
      };

    case 'import_artifact':
      if (args.payload.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion");
      const data = args.payload;
      data.exportedAt = new Date().toISOString();
      state.setFullState(data);
      return { success: true };

    default:
      throw new Error(`Tool ${name} not found`);
  }
};
