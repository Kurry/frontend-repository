import { useStore } from './store';

// We bind to the window object to expose standard WebMCP methods
declare global {
  interface Window {
    webmcp_session_info: () => Record<string, any>;
    webmcp_list_tools: () => Record<string, any>[];
    webmcp_invoke_tool: (toolName: string, args: Record<string, any>) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    name: "Soundscape Scene Composer",
    version: "1.0.0",
    schemaVersion: "soundscape-scene-v1"
  });

  window.webmcp_list_tools = () => [
    {
      name: "query_state",
      description: "Get the current full application state including records, history, and selected record ID.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "create_record",
      description: "Create a new sound layer record",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          volume: { type: "number" }
        },
        required: ["name"]
      }
    },
    {
      name: "update_record",
      description: "Update a sound layer record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          volume: { type: "number" },
          status: { type: "string", enum: ['empty', 'draft', 'ready', 'changed', 'archived'] }
        },
        required: ["id"]
      }
    },
    {
      name: "delete_record",
      description: "Delete a sound layer record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "attach_evidence_and_resolve",
      description: "Attach evidence to a selected record and resolve an audit discrepancy",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          evidence: { type: "string" },
          discrepancy: { type: "string" }
        },
        required: ["id", "evidence", "discrepancy"]
      }
    },
    {
      name: "undo",
      description: "Undo the last state mutation",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "export_session",
      description: "Export the full session to JSON",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "import_session",
      description: "Import a session from JSON text",
      inputSchema: {
        type: "object",
        properties: {
          jsonText: { type: "string" }
        },
        required: ["jsonText"]
      }
    }
  ];

  window.webmcp_invoke_tool = (toolName: string, args: Record<string, any>) => {
    const store = useStore.getState();

    switch (toolName) {
      case "query_state":
        return {
          records: store.records,
          history: store.history,
          selectedRecordId: store.selectedRecordId
        };

      case "create_record": {
        const id = Math.random().toString(36).substr(2, 9);
        store.addRecord({
          id,
          name: args.name,
          volume: args.volume ?? 50,
          status: 'empty',
          auditLensState: { evidence: '', discrepancy: '', resolved: false }
        });
        return { success: true, id };
      }

      case "update_record": {
        store.updateRecord(args.id, {
          name: args.name,
          volume: args.volume,
          status: args.status
        });
        return { success: true };
      }

      case "delete_record": {
        store.deleteRecord(args.id);
        return { success: true };
      }

      case "attach_evidence_and_resolve": {
        store.attachEvidenceAndResolve(args.id, args.evidence, args.discrepancy);
        return { success: true };
      }

      case "undo": {
        store.undo();
        return { success: true };
      }

      case "export_session": {
        const json = store.exportSession();
        return { success: true, data: JSON.parse(json) };
      }

      case "import_session": {
        const result = store.importSession(args.jsonText);
        return result;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
