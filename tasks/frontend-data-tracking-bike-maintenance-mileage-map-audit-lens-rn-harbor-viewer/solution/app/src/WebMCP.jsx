import { useEffect } from 'react';
import { useStore } from './store';

export function WebMCP() {
  const store = useStore();

  useEffect(() => {
    // Standard module definitions
    window.webmcp_session_info = () => {
      return {
        schemaVersion: "v1",
        exportedAt: new Date().toISOString(),
        records: store.state.records,
        derived: store.derivedState,
        historyCount: store.state.history.length
      };
    };

    window.webmcp_list_tools = () => {
      return [
        {
          name: 'get_state',
          description: 'Get the current application state.',
          parameters: {}
        },
        {
          name: 'import_artifact',
          description: 'Import an artifact payload.',
          parameters: {
            type: 'object',
            properties: {
              artifact: { type: 'object' }
            },
            required: ['artifact']
          }
        },
        {
          name: 'add_record',
          description: 'Add a new record.',
          parameters: {
            type: 'object',
            properties: {
              record: { type: 'object' }
            },
            required: ['record']
          }
        },
        {
          name: 'select_record',
          description: 'Select a record for the audit lens.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'resolve_audit',
          description: 'Resolve audit discrepancy for a record.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              evidence: { type: 'boolean' },
              status: { type: 'string' }
            },
            required: ['id', 'evidence', 'status']
          }
        },
        {
          name: 'undo',
          description: 'Undo the last action.',
          parameters: {}
        }
      ];
    };

    window.webmcp_invoke_tool = (tool_name, args) => {
      switch (tool_name) {
        case 'get_state':
          return window.webmcp_session_info();

        case 'import_artifact':
          // validation logic here
          const { artifact } = args;
          if (artifact && artifact.schemaVersion === 'v1' && Array.isArray(artifact.records)) {
             // valid import
             store.importState({
               records: artifact.records,
               history: artifact.history || [],
               auditLensState: { selectedRecordId: null, isResolving: false },
               exportedAt: new Date().toISOString()
             });
             return { success: true };
          }
          return { success: false, error: 'Malformed schema or invalid artifact.' };

        case 'add_record':
          store.addRecord(args.record);
          return { success: true };

        case 'select_record':
          store.selectRecord(args.id);
          return { success: true };

        case 'resolve_audit':
          store.resolveAudit({ id: args.id, evidence: args.evidence, status: args.status });
          return { success: true };

        case 'undo':
          store.undo();
          return { success: true };

        default:
          throw new Error(`Tool ${tool_name} not found`);
      }
    };

    return () => {
      delete window.webmcp_session_info;
      delete window.webmcp_list_tools;
      delete window.webmcp_invoke_tool;
    };
  }, [store]); // Re-bind when store changes

  return null;
}
