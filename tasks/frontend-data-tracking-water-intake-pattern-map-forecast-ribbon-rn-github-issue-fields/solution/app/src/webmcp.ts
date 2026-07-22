import type { WaterIntakePatternMapSession } from './types';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<{ task_id: string }>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
    __appState: {
        exportData: () => WaterIntakePatternMapSession;
        importData: (data: WaterIntakePatternMapSession) => boolean;
        clearData: () => void;
        getRecords: () => any[];
        addRecord: (record: any) => void;
        updateRecord: (id: string, updates: any) => void;
    };
  }
}

export function initWebMCP() {
  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-data-tracking-water-intake-pattern-map-forecast-ribbon-rn-github-issue-fields"
  });

  window.webmcp_list_tools = async () => [
    {
      name: "entity_create_record",
      description: "Create a new record",
      inputSchema: {
        type: "object",
        properties: {
          timestamp: { type: "string" },
          amountMl: { type: "number" },
          source: { type: "string" }
        },
        required: ["timestamp", "amountMl", "source"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an existing record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          updates: { type: "object" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Export the current session state as JSON",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Import a session state from JSON",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "object" }
        },
        required: ["data"]
      }
    }
  ];

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    switch (name) {
      case "entity_create_record":
        if (window.__appState) {
           window.__appState.addRecord(args);
           return { success: true };
        }
        throw new Error("App not ready");
      case "entity_update_record":
        if (window.__appState) {
            window.__appState.updateRecord(args.id, args.updates);
            return { success: true };
        }
        throw new Error("App not ready");
      case "artifact_export_session_json":
        if (window.__appState) {
          return window.__appState.exportData();
        }
        throw new Error("App not ready");
      case "artifact_import_session_json":
        if (window.__appState) {
          const success = window.__appState.importData(args.data);
          if (!success) throw new Error("Invalid import data");
          return { success: true };
        }
        throw new Error("App not ready");
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
