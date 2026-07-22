import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useStore } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// --- WebMCP Contract Bindings ---
window.webmcp_session_info = {
  version: '1.0',
  description: 'Storyboard Camera Path Editor - Batch Reconciler session bound via WebMCP'
};

window.webmcp_list_tools = () => {
  return [
    {
      name: 'createBeat',
      description: 'Create a new story beat',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived'] }
        },
        required: ['title', 'description', 'status']
      }
    },
    {
      name: 'updateBeat',
      description: 'Update an existing story beat',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          updates: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived'] }
            }
          }
        },
        required: ['id', 'updates']
      }
    },
    {
      name: 'archiveBeat',
      description: 'Archive a story beat by id',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'batchReconcileRecords',
      description: 'Group selected records into a batch and reconcile aggregate totals (signature mutation)',
      inputSchema: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['ids']
      }
    },
    {
      name: 'undo',
      description: 'Undo the last mutation',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'exportSession',
      description: 'Export the current artifact',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'importSession',
      description: 'Import an artifact',
      inputSchema: {
        type: 'object',
        properties: {
          jsonString: { type: 'string' }
        },
        required: ['jsonString']
      }
    },
    {
      name: 'queryState',
      description: 'Get the current application state',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ];
};

window.webmcp_invoke_tool = (name: string, args: any) => {
  const currentStore = useStore.getState();

  try {
    switch (name) {
      case 'createBeat':
        currentStore.createBeat(args);
        return { success: true, message: 'Beat created' };
      case 'updateBeat':
        currentStore.updateBeat(args.id, args.updates);
        return { success: true, message: 'Beat updated' };
      case 'archiveBeat':
        currentStore.archiveBeat(args.id);
        return { success: true, message: 'Beat archived' };
      case 'batchReconcileRecords':
        currentStore.batchReconcileRecords(args.ids);
        return { success: true, message: 'Records batch reconciled' };
      case 'undo':
        currentStore.undo();
        return { success: true, message: 'Undo performed' };
      case 'exportSession': {
        const data = currentStore.exportSession();
        return { success: true, data };
      }
      case 'importSession': {
        const success = currentStore.importSession(args.jsonString);
        if (success) {
          return { success: true, message: 'Session imported' };
        } else {
          return { success: false, message: 'Invalid import data' };
        }
      }
      case 'queryState':
        return {
          success: true,
          data: {
            records: currentStore.records,
            selectedIds: currentStore.selectedIds,
            historyLength: currentStore.history.length,
            undoStackLength: currentStore.undoStack.length
          }
        };
      default:
        throw new Error(`Tool ${name} not found`);
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unknown error' };
  }
};
