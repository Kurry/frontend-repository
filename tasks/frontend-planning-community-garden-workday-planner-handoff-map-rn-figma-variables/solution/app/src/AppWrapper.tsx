import { useEffect } from 'react';
import App from './App';
import { useAppStore } from './store';

// Global WebMCP Contracts
declare global {
  interface Window {
    webmcp_session_info?: any;
    webmcp_list_tools?: () => any[];
    webmcp_invoke_tool?: (name: string, args: any) => any;
  }
}

export default function AppWrapper() {
  const store = useAppStore();

  useEffect(() => {
    window.webmcp_session_info = {
      task: "eval-intelligence/frontend-planning-community-garden-workday-planner-handoff-map-rn-figma-variables",
      modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
    };

    window.webmcp_list_tools = () => [
      { name: 'entity_create_record', description: 'Create a new record' },
      { name: 'entity_update_record', description: 'Update an existing record' },
      { name: 'artifact_export_session_json', description: 'Export the session artifact' },
      { name: 'artifact_import_session_json', description: 'Import a session artifact' },
      { name: 'query_state', description: 'Query the current app state' } // For testing
    ];

    window.webmcp_invoke_tool = (name: string, args: any) => {
      try {
        switch (name) {
          case 'entity_create_record': {
            store.addRecord(args);
            return { status: 'success' };
          }
          case 'entity_update_record': {
            store.updateRecord(args.id, args.updates);
            return { status: 'success' };
          }
          case 'artifact_export_session_json': {
            const artifact = store.exportArtifact();
            return { artifact };
          }
          case 'artifact_import_session_json': {
            const success = store.importArtifact(args.artifact);
            return { success };
          }
          case 'query_state': {
             return { records: store.records, derived: store.derived };
          }
          default:
            throw new Error(`Tool ${name} not found`);
        }
      } catch (err: any) {
        return { error: err.message };
      }
    };
  }, [store]); // Re-bind when store changes so closure has fresh state

  return <App store={store} />;
}
