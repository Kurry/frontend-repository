// Global types for WebMCP
export {};

declare global {
  interface Window {
    webmcp_session_info: {
      task: string;
    };
    webmcp_list_tools: () => { name: string; description: string }[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = {
  task: 'eval-intelligence/frontend-planning-community-garden-workday-planner-scenario-weaver-rn-spotify-playlists'
};

const getStoreMethods = () => {
  // We need to access the react state.
  // For a purely browser-based WebMCP without a global store reference,
  // we'll set up a global bridge in the React app.
  return (window as any).__storeBridge;
};

window.webmcp_list_tools = () => [
  {
    name: 'entity_create_record',
    description: 'Creates a new task record in the collection.'
  },
  {
    name: 'entity_update_record',
    description: 'Updates an existing task record in the collection.'
  },
  {
    name: 'artifact_export_session_json',
    description: 'Exports the entire session artifact, including records, derived state, and history.'
  },
  {
    name: 'artifact_import_session_json',
    description: 'Imports a full session artifact JSON to completely replace the current state.'
  }
];

window.webmcp_invoke_tool = (name: string, args: any) => {
  const store = getStoreMethods();
  if (!store) {
    throw new Error('Store bridge not initialized');
  }

  switch (name) {
    case 'entity_create_record': {
      if (!args || !args.record) throw new Error('Missing record argument');
      store.createRecord(args.record);
      return { success: true };
    }
    case 'entity_update_record': {
      if (!args || !args.id || !args.record) throw new Error('Missing arguments');
      store.updateRecord(args.id, args.record);
      return { success: true };
    }
    case 'artifact_export_session_json': {
      return store.exportSession();
    }
    case 'artifact_import_session_json': {
      if (!args || !args.artifact) throw new Error('Missing artifact argument');
      store.importSession(args.artifact);
      return { success: true };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};
