import { useStore, getDerivedState } from './store';
import { exportSession, validateAndImportSession } from './utils/exportImport';

export const setupWebMCP = () => {
  if (typeof window !== 'undefined') {
    (window as any).webmcp_session_info = () => ({
      app: 'Ceramic Glaze Test Atlas — Constraint Canvas',
      schemaVersion: 'glaze-atlas-session-v1'
    });

    (window as any).webmcp_list_tools = () => [
      {
        name: 'queryState',
        description: 'Queries the current session state including records and derived properties.',
        parameters: {}
      },
      {
        name: 'exportSession',
        description: 'Exports the current state as a JSON session artifact.',
        parameters: {}
      },
      {
        name: 'importSession',
        description: 'Clears and imports a JSON session artifact.',
        parameters: { jsonString: 'string' }
      },
      {
        name: 'mutateRecord',
        description: 'Updates a record directly simulating UI edit.',
        parameters: { id: 'string', updates: 'object' }
      }
    ];

    (window as any).webmcp_invoke_tool = (toolName: string, params: any) => {
      if (toolName === 'queryState') {
        return {
          records: useStore.getState().records,
          derived: getDerivedState(),
          history: useStore.getState().history
        };
      }

      if (toolName === 'exportSession') {
        return exportSession();
      }

      if (toolName === 'importSession') {
        const { success, error } = validateAndImportSession(params.jsonString);
        if (success) {
            return { result: 'Session imported successfully' };
        } else {
            return { error };
        }
      }

      if (toolName === 'mutateRecord') {
         useStore.getState().updateRecord(params.id, params.updates);
         return { result: 'Record mutated' };
      }

      throw new Error(`Tool not found: ${toolName}`);
    };
  }
};
