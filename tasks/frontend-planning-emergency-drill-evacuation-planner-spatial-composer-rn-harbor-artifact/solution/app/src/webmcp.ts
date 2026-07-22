import { useAppStore, getDerivedState } from './state';
import type { EmergencyDrillEvacuationPlannerSession, CheckpointStatus } from './state';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (args: any) => Promise<any>;
  }
}

window.webmcp_session_info = async () => {
  return {
    contract_version: "zto-webmcp-v1",
    task_slug: "frontend-planning-emergency-drill-evacuation-planner-spatial-composer-rn-artifact"
  };
};

window.webmcp_list_tools = async () => {
  return {
    tools: [
      {
        name: "entity_create_record",
        description: "Creates a new drill checkpoint record",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            capacity: { type: "number" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
          },
          required: ["name", "capacity", "status"]
        }
      },
      {
        name: "entity_select_record",
        description: "Selects a record into the composer",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: ["string", "null"] }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates an existing drill checkpoint record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            updates: {
              type: "object",
              properties: {
                name: { type: "string" },
                capacity: { type: "number" },
                status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
              }
            }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Archives a drill checkpoint record",
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
        name: "artifact_export_session_json",
        description: "Exports the current session as JSON text",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "artifact_copy_session_json",
        description: "Copies the current session as JSON text to clipboard/output",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "artifact_import_session_json",
        description: "Imports a session from JSON text",
        inputSchema: {
          type: "object",
          properties: {
            sessionText: { type: "string" }
          },
          required: ["sessionText"]
        }
      }
    ]
  };
};

window.webmcp_invoke_tool = async (args: any) => {
  const store = useAppStore.getState();

  switch (args.name) {
    case "entity_create_record": {
      const { name, capacity, status } = args.arguments;
      if (typeof capacity !== 'number' || capacity < 1 || capacity > 1000) {
        return { error: "Capacity must be between 1 and 1000" };
      }
      store.addRecord({ name, capacity, status: status as CheckpointStatus });
      return { success: true };
    }

    case "entity_select_record": {
      store.selectRecord(args.arguments.id);
      return { success: true };
    }

    case "entity_update_record": {
      const { id, updates } = args.arguments;
      if (updates.capacity !== undefined && (typeof updates.capacity !== 'number' || updates.capacity < 1 || updates.capacity > 1000)) {
        return { error: "Capacity must be between 1 and 1000" };
      }
      store.updateRecord(id, updates);
      return { success: true };
    }

    case "entity_delete_record": {
      const { id, confirm } = args.arguments;
      if (!confirm) {
        return { error: "Delete requires confirm=true" };
      }
      store.deleteRecord(id);
      return { success: true };
    }

    case "artifact_export_session_json": {
      // Export current state
      const records = useAppStore.getState().records;
      const history = useAppStore.getState().history;
      const session: EmergencyDrillEvacuationPlannerSession = {
        schemaVersion: 'evacuation-drill-v1',
        exportedAt: new Date().toISOString(),
        records,
        derived: getDerivedState(records),
        history
      };
      return {
        artifact: JSON.stringify(session, null, 2)
      };
    }

    case "artifact_copy_session_json": {
      const records = useAppStore.getState().records;
      const history = useAppStore.getState().history;
      const session: EmergencyDrillEvacuationPlannerSession = {
        schemaVersion: 'evacuation-drill-v1',
        exportedAt: new Date().toISOString(),
        records,
        derived: getDerivedState(records),
        history
      };
      return {
        artifact: JSON.stringify(session, null, 2)
      };
    }

    case "artifact_import_session_json": {
      try {
        const parsed = JSON.parse(args.arguments.sessionText);
        if (parsed.schemaVersion !== 'evacuation-drill-v1') {
          return { error: "Invalid schemaVersion" };
        }
        if (!Array.isArray(parsed.records)) {
          return { error: "Invalid records array" };
        }

        const validSession: EmergencyDrillEvacuationPlannerSession = {
          ...parsed,
          exportedAt: new Date().toISOString()
        };
        store.importSession(validSession);
        return { success: true };
      } catch (e) {
        return { error: "Malformed JSON" };
      }
    }

    default:
      return { error: `Unknown tool: ${args.name}` };
  }
};
