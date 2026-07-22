import { useStore } from './store';
import { CoffeeBrewExperimentLogSession } from './types';

// WebMCP Window bindings
declare global {
  interface Window {
    webmcp_session_info: () => {
      task_id: string;
      capabilities: string[];
      state_summary: string;
    };
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

window.webmcp_session_info = () => {
  const state = useStore.getState();
  return {
    task_id: "frontend-data-tracking-coffee-brew-experiment-log-scenario-weaver-rn-spotify-playlists",
    capabilities: ["collection_management", "scenario_branching", "artifact_export"],
    state_summary: `Managing ${state.records.length} experiments, ${state.selection.length} selected.`
  };
};

window.webmcp_list_tools = () => [
  {
    name: "query_experiments",
    description: "Queries all brew experiments in the current session.",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "create_experiment",
    description: "Creates a new brew experiment.",
    inputSchema: {
      type: "object",
      properties: {
        record: { type: "object" }
      },
      required: ["record"]
    }
  },
  {
    name: "update_experiment",
    description: "Updates an existing brew experiment.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        updates: { type: "object" }
      },
      required: ["id", "updates"]
    }
  },
  {
    name: "branch_scenario",
    description: "Branches an existing brew experiment into a scenario for comparison.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "undo_mutation",
    description: "Undoes the last state mutation.",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "export_artifact",
    description: "Exports the session as a CoffeeBrewExperimentLogSession JSON object.",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "import_artifact",
    description: "Imports a CoffeeBrewExperimentLogSession JSON object.",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "object" }
      },
      required: ["data"]
    }
  }
];

window.webmcp_invoke_tool = async (name: string, args: any) => {
  const store = useStore.getState();

  switch (name) {
    case 'query_experiments':
      return { records: store.records, selection: store.selection };

    case 'create_experiment':
      store.createRecord(args.record);
      return { success: true };

    case 'update_experiment':
      store.updateRecord(args.id, args.updates);
      return { success: true };

    case 'branch_scenario':
      store.branchScenario(args.id);
      return { success: true };

    case 'undo_mutation':
      store.undoLastMutation();
      return { success: true };

    case 'export_artifact':
      return store.exportArtifact();

    case 'import_artifact':
      if (args.data.schemaVersion === 'v1' && Array.isArray(args.data.records)) {
        store.importArtifact(args.data as CoffeeBrewExperimentLogSession);
        return { success: true };
      }
      return { error: 'Invalid artifact format' };

    default:
      throw new Error(`Tool ${name} not found`);
  }
};
