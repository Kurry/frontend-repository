import type { AppState } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
    __get_store_state: () => AppState;
    __dispatch: (action: any) => void;
  }
}

export function initWebMCP() {
  window.webmcp_list_tools = async () => [
    {
      name: "entity_create_record",
      description: "Create a new sleep record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string" },
          lane: { type: "string" },
          data: {
            type: "object",
            properties: {
              durationHours: { type: "number" },
              quality: { type: "number" }
            }
          }
        },
        required: ["id", "status", "lane", "data"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an existing sleep record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string" },
          lane: { type: "string" },
          data: {
            type: "object",
            properties: {
              durationHours: { type: "number" },
              quality: { type: "number" }
            }
          }
        },
        required: ["id"]
      }
    },
    {
        name: "artifact_export_session_json",
        description: "Export the current session state as JSON artifact.",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "artifact_import_session_json",
        description: "Import a session state from a JSON artifact.",
        inputSchema: {
            type: "object",
            properties: {
                artifact: { type: "string" }
            },
            required: ["artifact"]
        }
    }
  ];

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    if (name === "entity_create_record") {
        if (!window.__dispatch) throw new Error("Store not connected");
        window.__dispatch({ type: 'ADD_RECORD', payload: args });
        return { success: true };
    }

    if (name === "entity_update_record") {
        if (!window.__dispatch) throw new Error("Store not connected");
        const state = window.__get_store_state();
        const existing = state.records.find(r => r.id === args.id);
        if (!existing) throw new Error("Record not found");
        const updated = {
            ...existing,
            ...args
        };
        window.__dispatch({ type: 'UPDATE_RECORD', payload: updated });
        return { success: true };
    }

    if (name === "artifact_export_session_json") {
        if (!window.__get_store_state) throw new Error("Store not connected");
        const state = window.__get_store_state();
        const artifact = {
            schemaVersion: 'shapeshift-session-v1',
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived: state.derived,
            history: state.history,
        };
        return { artifact: JSON.stringify(artifact) };
    }

    if (name === "artifact_import_session_json") {
        if (!window.__dispatch) throw new Error("Store not connected");
        const json = JSON.parse(args.artifact);

        // Field-level validation check (same as UI)
        if (json.schemaVersion !== 'shapeshift-session-v1') {
            throw new Error('Invalid schema version');
        }
        if (!Array.isArray(json.records) || !json.derived || !Array.isArray(json.history)) {
            throw new Error('Malformed schema: missing required fields');
        }
        const uniqueIds = new Set();
        for (const record of json.records) {
            if (uniqueIds.has(record.id)) throw new Error('Duplicate IDs found');
            uniqueIds.add(record.id);
            if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(record.status)) {
                throw new Error('Invalid status enum');
            }
            if (record.data.durationHours < 0 || record.data.quality < 0 || record.data.quality > 10) {
                throw new Error('Invalid bounds in data');
            }
        }

        const validState: AppState = {
            records: json.records,
            derived: json.derived,
            history: json.history,
            conflictId: null,
            exportedAt: new Date().toISOString()
        };

        window.__dispatch({ type: 'IMPORT', payload: validState });
        return { success: true };
    }

    throw new Error(`Unknown tool: ${name}`);
  };
}
