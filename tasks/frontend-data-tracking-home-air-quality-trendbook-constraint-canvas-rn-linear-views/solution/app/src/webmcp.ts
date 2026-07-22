import type { Action } from './store';
import type { AirQualityRecord, AirQualityStatusType, HomeAirQualityTrendbookSession } from './types';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (args: any) => Promise<any>;
    __DISPATCH__?: React.Dispatch<Action>;
    __STATE__?: HomeAirQualityTrendbookSession;
  }
}

window.webmcp_session_info = async () => ({
  task_id: 'frontend-data-tracking-home-air-quality-trendbook-constraint-canvas-rn-linear-views',
});

window.webmcp_list_tools = async () => ({
  tools: [
    {
      name: "entity_create_record",
      description: "Create a new air quality record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["Draft", "Ready", "Changed", "Archived"] },
          reading: { type: "number" },
          room: { type: "string" },
        },
        required: ["id", "status", "reading", "room"]
      }
    },
    {
      name: "entity_select_record",
      description: "Select an air quality record (no-op visual focus for WebMCP).",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an existing air quality record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["Draft", "Ready", "Changed", "Archived"] },
          reading: { type: "number" },
          room: { type: "string" },
        },
        required: ["id", "status", "reading", "room"]
      }
    },
    {
      name: "entity_delete_record",
      description: "Delete an air quality record.",
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
      name: "artifact_export_air_quality_v1_json",
      description: "Export the current session state as air-quality-v1.json",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_air_quality_v1_json",
      description: "Import a session state from air-quality-v1.json payload.",
      inputSchema: {
        type: "object",
        properties: {
          payload: { type: "object" }
        },
        required: ["payload"]
      }
    },
    {
      name: "artifact_copy",
      description: "Copy artifact to clipboard",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "editor_select_constraint_canvas",
      description: "Select an element on the constraint canvas.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "editor_update_property_constraint_canvas",
      description: "Update a property (e.g. lane or position) of a constraint canvas item.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          property: { type: "string" },
          value: { type: "string" }
        },
        required: ["id", "property", "value"]
      }
    }
  ]
});

window.webmcp_invoke_tool = async (args: any) => {
  if (!window.__DISPATCH__ || !window.__STATE__) {
    throw new Error("Application not fully initialized");
  }

  const dispatch = window.__DISPATCH__;
  const state = window.__STATE__;

  switch (args.name) {
    case "entity_create_record": {
      const record: AirQualityRecord = {
        id: args.arguments.id,
        status: args.arguments.status as AirQualityStatusType,
        reading: args.arguments.reading,
        room: args.arguments.room,
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'CREATE_RECORD', payload: record });
      return { success: true, record };
    }
    case "entity_select_record": {
      return { success: true, selectedId: args.arguments.id };
    }
    case "entity_update_record": {
      const existing = state.records.find(r => r.id === args.arguments.id);
      if (!existing) throw new Error("Record not found");
      const record: AirQualityRecord = {
        id: args.arguments.id,
        status: args.arguments.status as AirQualityStatusType,
        reading: args.arguments.reading,
        room: args.arguments.room,
        timestamp: existing.timestamp
      };
      dispatch({ type: 'UPDATE_RECORD', payload: record });
      return { success: true, record };
    }
    case "entity_delete_record": {
      if (args.arguments.confirm) {
        dispatch({ type: 'DELETE_RECORD', payload: { id: args.arguments.id } });
        return { success: true };
      }
      throw new Error("Confirmation required to delete");
    }
    case "artifact_export_air_quality_v1_json": {
      const payload = {
        schemaVersion: state.schemaVersion,
        exportedAt: new Date().toISOString(),
        records: state.records,
        derived: state.derived,
        history: state.history
      };
      return { success: true, payload };
    }
    case "artifact_import_air_quality_v1_json": {
      dispatch({ type: 'IMPORT_SESSION', payload: args.arguments.payload });
      return { success: true };
    }
    case "artifact_copy": {
      const payload = {
        schemaVersion: state.schemaVersion,
        exportedAt: new Date().toISOString(),
        records: state.records,
        derived: state.derived,
        history: state.history
      };
      if (navigator.clipboard) {
         navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
      }
      return { success: true };
    }
    case "editor_select_constraint_canvas": {
      return { success: true, selectedId: args.arguments.id };
    }
    case "editor_update_property_constraint_canvas": {
      if (args.arguments.property === 'lane') {
        const id = args.arguments.id;
        const newStatus = args.arguments.value as AirQualityStatusType;
        const record = state.records.find(r => r.id === id);
        if (!record) throw new Error("Record not found");

        if (record.status === 'Draft' && newStatus === 'Archived') {
            throw new Error("Cannot archive a Draft directly. Move to Ready or Changed first.");
        }
        dispatch({ type: 'UPDATE_RECORD_STATUS', payload: { id, status: newStatus } });
        return { success: true };
      }
      return { success: true, message: `Updated ${args.arguments.property}` };
    }
    default:
      throw new Error(`Unknown tool: ${args.name}`);
  }
};
export {};
