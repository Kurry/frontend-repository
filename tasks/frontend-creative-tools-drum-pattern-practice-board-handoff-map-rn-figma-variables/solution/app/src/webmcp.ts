import { DrumPattern } from './store';

export function initWebMCP() {
  (window as any).webmcp_session_info = {
    "project": "drum-pattern-practice-board-handoff-map",
    "version": "1.0.0"
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        "name": "query_state",
        "description": "Query the current application state.",
        "inputSchema": { "type": "object", "properties": {} }
      },
      {
        "name": "import_session",
        "description": "Import a session artifact directly to state.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "records": { "type": "array", "description": "Drum pattern records array" }
          },
          "required": ["records"]
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const store = (window as any).__store;
    if (!store) return { error: "Store not found" };

    if (name === "query_state") {
      return {
        result: {
          records: store.records,
          derivedSummary: store.derivedSummary,
          eventHistory: store.eventHistory
        }
      };
    }

    if (name === "import_session") {
      try {
        store.pushHistory(args.records, 'Imported via WebMCP');
        return { result: { success: true } };
      } catch (e: any) {
         return { error: e.message };
      }
    }

    return { error: `Tool ${name} not found` };
  };
}
