import { useEffect } from 'react';
import { useStore } from './store';

export function useWebMCP() {
  const store = useStore();

  useEffect(() => {
    (window as any).webmcp_session_info = {
      tools: [
        { name: "exportSession", description: "Exports the current state as a JSON session document." },
        { name: "importSession", description: "Imports a JSON session document." },
        { name: "branchScenario", description: "Branch a selected record into a scenario." },
        { name: "queryState", description: "Query current app state." },
        { name: "addRecord", description: "Add a new record." },
        { name: "updateRecord", description: "Update a record." }
      ]
    };

    (window as any).webmcp_list_tools = () => (window as any).webmcp_session_info.tools;

    (window as any).webmcp_invoke_tool = (toolName: string, args: any) => {
      try {
        switch (toolName) {
          case 'exportSession':
            return store.exportSession();
          case 'importSession':
            store.importSession(args.session);
            return { success: true };
          case 'branchScenario':
            store.branchScenario(args.recordId, args.outcome);
            return { success: true };
          case 'queryState':
            return store.exportSession();
          case 'addRecord':
            store.addRecord(args.record);
            return { success: true };
          case 'updateRecord':
            store.updateRecord(args.id, args.updates);
            return { success: true };
          default:
            throw new Error(`Tool ${toolName} not found`);
        }
      } catch (err: any) {
        return { error: err.message };
      }
    };
  }, [store]);

  return null;
}
