import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

export function initWebmcp() {
  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    task_id: "eval-intelligence/frontend-planning-community-fridge-restock-planner-constraint-canvas-rn-linear-views",
  });

  window.webmcp_list_tools = async () => {
    return [
      {
        name: "entity_create_record",
        description: "Creates a new restock task.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            quantity: { type: "number" },
            status: { type: "string" }
          },
          required: ["entity", "title", "quantity", "status"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates an existing restock task.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            quantity: { type: "number" }
          },
          required: ["entity", "id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Deletes a restock task.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            id: { type: "string" },
            confirm: { type: "boolean" }
          },
          required: ["entity", "id", "confirm"]
        }
      },
      {
        name: "entity_select_record",
        description: "Selects a restock task.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            id: { type: "string" }
          },
          required: ["entity", "id"]
        }
      },
      {
        name: "editor_update_property",
        description: "Update editor property (e.g. status).",
        inputSchema: {
          type: "object",
          properties: {
            object_type: { type: "string" },
            id: { type: "string" },
            property: { type: "string" },
            value: { type: "string" }
          },
          required: ["object_type", "id", "property", "value"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Exports the session artifact.",
        inputSchema: {
          type: "object",
          properties: {
            format: { type: "string" }
          },
          required: ["format"]
        }
      },
      {
        name: "artifact_import_session_json",
        description: "Imports a session artifact.",
        inputSchema: {
          type: "object",
          properties: {
            mode: { type: "string" },
            artifact: { type: "object" }
          },
          required: ["mode", "artifact"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case "entity_create_record": {
        if (args.entity !== 'restock-task') throw new Error("Invalid entity");
        const id = store.addRecord({
          title: args.title,
          description: args.description || '',
          quantity: args.quantity,
          status: args.status
        });
        return { success: true, id };
      }

      case "entity_update_record": {
        if (args.entity !== 'restock-task') throw new Error("Invalid entity");
        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.quantity !== undefined) updates.quantity = args.quantity;
        store.updateRecord(args.id, updates);
        return { success: true };
      }

      case "entity_delete_record": {
        if (args.entity !== 'restock-task') throw new Error("Invalid entity");
        if (args.confirm !== true) throw new Error("Must confirm delete");
        store.deleteRecord(args.id);
        return { success: true };
      }

      case "entity_select_record": {
        if (args.entity !== 'restock-task') throw new Error("Invalid entity");
        store.selectRecord(args.id);
        return { success: true };
      }

      case "editor_update_property": {
        if (args.object_type !== 'constraint-canvas' && args.object_type !== 'lane') {
          throw new Error("Invalid object_type");
        }
        if (args.property === 'status') {
          store.moveRecord(args.id, args.value);
        }
        return { success: true };
      }

      case "artifact_export_session_json": {
        if (args.format !== 'session-json') throw new Error("Invalid format");

        const derivedSummary = {
          totalTasks: store.records.length,
          byStatus: {
            empty: store.records.filter((r) => r.status === 'empty').length,
            draft: store.records.filter((r) => r.status === 'draft').length,
            ready: store.records.filter((r) => r.status === 'ready').length,
            changed: store.records.filter((r) => r.status === 'changed').length,
            archived: store.records.filter((r) => r.status === 'archived').length,
          },
        };

        const sessionData = {
          schemaVersion: 'fridge-restock-v1',
          exportedAt: new Date().toISOString(),
          records: store.records,
          derived: derivedSummary,
          history: store.history,
        };

        return { artifact: sessionData };
      }

      case "artifact_import_session_json": {
        if (args.mode !== 'session-json') throw new Error("Invalid mode");
        const parsed = args.artifact;

        if (parsed.schemaVersion !== 'fridge-restock-v1') {
          throw new Error('Invalid schemaVersion');
        }

        store.importSession(parsed);
        return { success: true };
      }

      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
