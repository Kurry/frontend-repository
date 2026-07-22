import { useEffect } from 'react';
import { useStore } from './store';

export function WebMCP() {
  const store = useStore();

  useEffect(() => {
    (window as any).webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-data-tracking-home-library-lending-ledger-handoff-map-rn-figma-variables"
    });

    (window as any).webmcp_list_tools = async () => {
      return [
        {
          name: "entity_create_record",
          description: "Create a new book record.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              status: { type: "string" },
              owner: { type: "string" },
              readiness: { type: "string" }
            },
            required: ["title"]
          }
        },
        {
          name: "entity_update_record",
          description: "Update a book record.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              status: { type: "string" },
              owner: { type: "string" },
              readiness: { type: "string" }
            },
            required: ["id"]
          }
        },
        {
          name: "entity_delete_record",
          description: "Delete a book record.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              confirm: { type: "boolean" }
            },
            required: ["id", "confirm"]
          }
        },
        {
          name: "entity_select_record",
          description: "Select a book record.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" }
            },
            required: ["id"]
          }
        },
        {
          name: "artifact_export_session_json",
          description: "Export the current session state as JSON.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "artifact_import_session_json",
          description: "Import session state from JSON.",
          inputSchema: {
            type: "object",
            properties: {
              data: { type: "object" }
            },
            required: ["data"]
          }
        }
      ];
    };

    (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
      const state = useStore.getState();

      switch (toolName) {
        case "entity_create_record": {
          state.addRecord({
            title: args.title,
            status: args.status || 'draft',
            owner: args.owner || 'Unassigned',
            readiness: args.readiness || 'idle'
          });
          return { success: true };
        }
        case "entity_update_record": {
          const { id, ...updates } = args;
          state.updateRecord(id, updates);
          return { success: true };
        }
        case "entity_delete_record": {
          if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
          state.deleteRecord(args.id);
          return { success: true };
        }
        case "entity_select_record": {
          state.selectRecord(args.id);
          return { success: true };
        }
        case "artifact_export_session_json": {
          const data = {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: state.records
          };
          return { data };
        }
        case "artifact_import_session_json": {
          state.importSession(args.data);
          return { success: true };
        }
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    };
  }, []);

  return null;
}
