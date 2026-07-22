import { getGlobalStore } from './store/useStore';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
  }
}

export const initWebMCP = () => {
  window.webmcp_session_info = async () => {
    return {
      task_id: "eval-intelligence/frontend-data-tracking-home-energy-peak-observatory-provenance-atlas-rn-slack-canvas",
      modules: ["entity-collection-v1", "artifact-transfer-v1"]
    };
  };

  window.webmcp_list_tools = async () => {
    return [
      {
        name: "entity_create_record",
        description: "Create an energy reading record",
        inputSchema: {
          type: "object",
          properties: {
            value: { type: "number" },
            timestamp: { type: "string" },
            status: { type: "string" }
          },
          required: ["value", "timestamp", "status"]
        }
      },
      {
        name: "entity_select_record",
        description: "Select an energy reading record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update an energy reading record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            value: { type: "number" },
            timestamp: { type: "string" },
            status: { type: "string" }
          },
          required: ["id", "value", "timestamp", "status"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Delete an energy reading record",
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
        name: "entity_quarantine_lineage",
        description: "Quarantine a lineage entry for a record",
        inputSchema: {
          type: "object",
          properties: {
            recordId: { type: "string" },
            lineageId: { type: "string" }
          },
          required: ["recordId", "lineageId"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Export the current session as JSON",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "artifact_import_session_json",
        description: "Import session data from JSON",
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

  window.webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = getGlobalStore();
    if (!store) throw new Error("Store not initialized");

    switch (toolName) {
      case "entity_create_record": {
        const newRecord = {
          id: `r-${Date.now()}`,
          value: args.value,
          timestamp: args.timestamp,
          status: args.status,
          lineage: [{
            id: `l-${Date.now()}`,
            source: 'ManualEntry',
            timestamp: new Date().toISOString(),
            status: 'valid'
          }]
        };
        store.addRecord(newRecord);
        return { success: true, result: newRecord };
      }

      case "entity_select_record": {
        store.setSelectedRecordId(args.id);
        return { success: true };
      }

      case "entity_update_record": {
        const record = store.records.find((r: any) => r.id === args.id);
        if (!record) throw new Error("Record not found");
        const updated = {
          ...record,
          value: args.value,
          timestamp: args.timestamp,
          status: args.status
        };
        store.updateRecord(updated);
        return { success: true, result: updated };
      }

      case "entity_delete_record": {
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true.");
        store.deleteRecord(args.id);
        return { success: true };
      }

      case "entity_quarantine_lineage": {
        store.quarantineLineage(args.recordId, args.lineageId);
        return { success: true };
      }

      case "artifact_export_session_json": {
        const data = store.exportData();
        return { success: true, result: data };
      }

      case "artifact_import_session_json": {
        if (args.data.schemaVersion !== 'v1') throw new Error("Invalid schema");
        store.importData(args.data);
        return { success: true };
      }

      default:
        throw new Error(`Tool not found: ${toolName}`);
    }
  };
};
