import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useStore } from './store.js'

// --- WebMCP Contract Implementation ---
window.webmcp_session_info = {
  protocol_version: '1.0',
  client_id: 'photo-caption-loom-forecast-ribbon'
};

window.webmcp_list_tools = () => {
  return [
    {
      name: 'addRecord',
      description: 'Creates a new empty record in the sequence.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'updateRecord',
      description: 'Updates a record. Required: id. Valid fields: title, caption, status, forecastRibbonState.',
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
      name: 'deleteRecord',
      description: 'Deletes a record by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'undo',
      description: 'Undoes the last state mutation restoring order, selection, and derived values.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'exportArtifact',
      description: 'Exports the current state as a photo-caption-v1-forecast-ribbon.json artifact.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'importArtifact',
      description: 'Imports a valid photo-caption-v1-forecast-ribbon.json artifact.',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'object', description: 'The JSON artifact to import.' }
        },
        required: ['data']
      }
    },
    {
      name: 'queryState',
      description: 'Queries the current derived state summary.',
      parameters: { type: 'object', properties: {} }
    }
  ];
};

window.webmcp_invoke_tool = (toolName, args) => {
  const store = useStore.getState();

  switch (toolName) {
    case 'addRecord':
      store.addRecord();
      return { result: { status: 'success' } };
    case 'updateRecord':
      const updateRes = store.updateRecord(args.id, args.updates);
      if (updateRes?.error) {
        return { error: updateRes.error };
      }
      return { result: { status: 'success' } };
    case 'deleteRecord':
      store.deleteRecord(args.id);
      return { result: { status: 'success' } };
    case 'undo':
      store.undo();
      return { result: { status: 'success' } };
    case 'exportArtifact':
      return { result: store.exportArtifact() };
    case 'importArtifact':
      const success = store.importArtifact(args.data);
      if (success) {
        return { result: { status: 'success' } };
      } else {
        return { error: 'Import failed due to schema validation.' };
      }
    case 'queryState':
      return { result: store.getSummary() };
    default:
      return { error: `Tool ${toolName} not found.` };
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
