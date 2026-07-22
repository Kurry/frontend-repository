import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useStore } from './store'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// WebMCP bindings
declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = {
  task: 'frontend-creative-tools-board-game-scenario-builder-handoff-map-rn-figma-variables',
  schemaVersion: 'v1'
};

window.webmcp_list_tools = () => {
  return [
    {
      name: 'seed_collection',
      description: 'Seeds the collection with 100+ records',
      parameters: {}
    },
    {
      name: 'query_state',
      description: 'Returns the current records, selected record, and derived state',
      parameters: {}
    },
    {
      name: 'select_record',
      description: 'Selects a record by ID',
      parameters: { id: { type: 'string' } }
    },
    {
      name: 'connect_owner',
      description: 'Connects a selected record to an owner ID (or null to unassign)',
      parameters: { recordId: { type: 'string' }, ownerId: { type: 'string', nullable: true } }
    },
    {
      name: 'update_record',
      description: 'Updates record properties',
      parameters: { id: { type: 'string' }, updates: { type: 'object' } }
    },
    {
      name: 'add_record',
      description: 'Adds a new record',
      parameters: { record: { type: 'object' } }
    },
    {
      name: 'delete_record',
      description: 'Deletes a record',
      parameters: { id: { type: 'string' } }
    },
    {
      name: 'undo',
      description: 'Reverts the last action',
      parameters: {}
    },
    {
      name: 'clear_session',
      description: 'Clears the session',
      parameters: {}
    },
    {
      name: 'export_artifact',
      description: 'Returns the JSON artifact string',
      parameters: {}
    },
    {
      name: 'import_artifact',
      description: 'Imports a JSON artifact string',
      parameters: { json: { type: 'string' } }
    }
  ];
};

window.webmcp_invoke_tool = (name: string, args: any) => {
  const store = useStore.getState();
  try {
    switch (name) {
      case 'seed_collection':
        store.seedCollection();
        return { success: true };
      case 'query_state':
        return {
          records: store.records,
          selectedRecordId: store.selectedRecordId,
          derived: store.getDerivedState(),
          error: store.error
        };
      case 'select_record':
        store.selectRecord(args.id);
        return { success: true };
      case 'connect_owner':
        store.connectOwner(args.recordId, args.ownerId);
        return { success: true };
      case 'update_record':
        store.updateRecord(args.id, args.updates);
        return { success: true };
      case 'add_record':
        store.addRecord(args.record);
        return { success: true };
      case 'delete_record':
        store.deleteRecord(args.id);
        return { success: true };
      case 'undo':
        store.undo();
        return { success: true };
      case 'clear_session':
        store.clearSession();
        return { success: true };
      case 'export_artifact':
        return { artifact: store.exportArtifact() };
      case 'import_artifact':
        store.importArtifact(args.json);
        return { success: true };
      default:
        throw new Error(`Tool ${name} not found`);
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
