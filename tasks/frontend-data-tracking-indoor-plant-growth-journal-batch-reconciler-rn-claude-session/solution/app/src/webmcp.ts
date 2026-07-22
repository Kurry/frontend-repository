import { useJournalStore } from './store';
import { SessionSchema } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

export function setupWebMCP() {
  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-data-tracking-indoor-plant-growth-journal-batch-reconciler-rn-claude-session",
    contract_version: "zto-webmcp-v1"
  });

  window.webmcp_list_tools = async () => {
    return {
      tools: [
        {
          name: "entity_create_record",
          description: "Create a new record",
          inputSchema: { type: "object", properties: { entity: { type: "object" } } }
        },
        {
          name: "entity_update_record",
          description: "Update a record",
          inputSchema: { type: "object", properties: { id: { type: "string" }, entity: { type: "object" } } }
        },
        {
          name: "entity_delete_record",
          description: "Delete a record",
          inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } } }
        },
        {
           name: "entity_mutate_record",
           description: "Mutate aggregate records via batch reconciler",
           inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } } }
        },
        {
          name: "artifact_export",
          description: "Export the session artifact",
          inputSchema: { type: "object", properties: { format: { type: "string" } } }
        },
        {
          name: "artifact_import",
          description: "Import the session artifact",
          inputSchema: { type: "object", properties: { mode: { type: "string" }, content: { type: "string" } } }
        }
      ]
    };
  };

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useJournalStore.getState();

    switch (name) {
      case 'entity_create_record': {
        store.addRecord(args.entity);
        return { success: true };
      }
      case 'entity_update_record': {
        store.updateRecord(args.id, args.entity);
        return { success: true };
      }
      case 'entity_delete_record': {
        if (!args.confirm) throw new Error("Delete requires confirm=true");
        store.deleteRecord(args.id);
        return { success: true };
      }
      case 'entity_mutate_record': {
        store.batchReconcile(args.ids);
        return { success: true };
      }
      case 'artifact_export': {
        if (args.format !== 'plant-growth-v1-batch-reconciler.json') {
           throw new Error("Unsupported format");
        }
        const session = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: store.records,
          derived: store.derived,
          history: []
        };
        return { result: JSON.stringify(session) };
      }
      case 'artifact_import': {
         try {
           const json = JSON.parse(args.content);
           const result = SessionSchema.safeParse(json);
           if (result.success) {
              const validatedSession = {
                 ...result.data,
                 exportedAt: new Date().toISOString()
              };
              store.clearSession();
              store.importSession(validatedSession);
              return { success: true };
           } else {
             throw new Error("Invalid import schema");
           }
         } catch(e) {
           throw new Error("Invalid import content");
         }
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
