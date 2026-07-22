export type Tool = {
  name: string;
  description: string;
  inputSchema: any;
};

export const tools: Tool[] = [
  {
    name: "entity_create_record",
    description: "Create a new brew-experiment",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", const: "brew-experiment" },
        fields: {
          type: "object",
          properties: {
            name: { type: "string" },
            bean: { type: "string" },
            roastDate: { type: "string" }
          },
          required: ["name", "bean", "roastDate"]
        }
      },
      required: ["entity", "fields"]
    }
  },
  {
    name: "entity_update_record",
    description: "Update an existing brew-experiment",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", const: "brew-experiment" },
        id: { type: "string" },
        fields: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
            name: { type: "string" },
            bean: { type: "string" },
            roastDate: { type: "string" }
          }
        }
      },
      required: ["entity", "id", "fields"]
    }
  },
  {
    name: "entity_delete_record",
    description: "Delete a brew-experiment",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", const: "brew-experiment" },
        id: { type: "string" },
        confirm: { type: "boolean", const: true }
      },
      required: ["entity", "id", "confirm"]
    }
  },
  {
    name: "entity_select_record",
    description: "Select a brew-experiment",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", const: "brew-experiment" },
        id: { type: "string" }
      },
      required: ["entity", "id"]
    }
  },
  {
    name: "editor_update_property",
    description: "Update a timeline-checkpoint property",
    inputSchema: {
      type: "object",
      properties: {
        object_type: { type: "string", const: "timeline-checkpoint" },
        object_id: { type: "string" },
        property: { type: "string", const: "timeline-state" },
        value: { type: "number" } // the index to restore to
      },
      required: ["object_type", "object_id", "property", "value"]
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the current session as JSON",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", const: "brew-experiment-v1-replay-timeline.json" }
      },
      required: ["format"]
    }
  },
  {
    name: "artifact_import_session_json",
    description: "Import a session from JSON payload",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", const: "brew-experiment-v1-replay-timeline.json" },
        payload: { type: "object" }
      },
      required: ["mode", "payload"]
    }
  }
];

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<{ tools: Tool[] }>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
    _appState?: {
        records: any[];
        setRecords: (records: any[]) => void;
        pushHistory: (records: any[]) => void;
        setSelectedRecordId: (id: string | null) => void;
        setActiveTimelineIndex: (idx: number) => void;
        selectedRecordId: string | null;
        history: any[][];
        historyIndex: number;
    };
  }
}

export function setupWebMCP() {
  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-data-tracking-coffee-brew-experiment-log-replay-timeline-rn-lightroom-editing",
    contract_version: "zto-webmcp-v1",
    capabilities: []
  });

  window.webmcp_list_tools = async () => ({ tools });

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const state = window._appState;
    if (!state) throw new Error("App state not initialized");

    if (name === "entity_create_record") {
      const newRecord = {
        id: "generated-" + Date.now(),
        name: args.fields.name,
        bean: args.fields.bean,
        roastDate: args.fields.roastDate,
        status: "draft",
        timelineState: []
      };
      const newRecords = [...state.records, newRecord];
      state.setRecords(newRecords);
      state.pushHistory(newRecords);
      state.setSelectedRecordId(newRecord.id);
      return { success: true, record: newRecord };
    }

    if (name === "entity_update_record") {
      const newRecords = state.records.map((r: any) =>
        r.id === args.id ? { ...r, ...args.fields } : r
      );
      state.setRecords(newRecords);
      state.pushHistory(newRecords);
      return { success: true };
    }

    if (name === "entity_delete_record") {
      if (!args.confirm) throw new Error("confirm=true required");
      const newRecords = state.records.filter((r: any) => r.id !== args.id);
      state.setRecords(newRecords);
      state.pushHistory(newRecords);
      if (state.selectedRecordId === args.id) {
        state.setSelectedRecordId(null);
      }
      return { success: true };
    }

    if (name === "entity_select_record") {
      state.setSelectedRecordId(args.id);
      return { success: true };
    }

    if (name === "editor_update_property") {
      if (args.object_type === "timeline-checkpoint" && args.property === "timeline-state") {
        const record = state.records.find((r: any) => r.id === args.object_id);
        if (record) {
           const index = args.value;
           if (index >= 0 && index < record.timelineState.length) {
              const newRecords = state.records.map((r: any) =>
                 r.id === record.id ? { ...r, timelineState: r.timelineState.slice(0, index + 1) } : r
              );
              state.setRecords(newRecords);
              state.pushHistory(newRecords);
              state.setActiveTimelineIndex(index);
              return { success: true };
           }
        }
      }
      return { success: false };
    }

    if (name === "artifact_export_session_json") {
      const ready = state.records.filter((r: any) => r.status === 'ready').length;
      const archived = state.records.filter((r: any) => r.status === 'archived').length;
      const allRatings = state.records.flatMap((r: any) => r.timelineState.map((t: any) => t.rating));
      const avgRating = allRatings.length ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length : 0;

      const derivedSummary = {
        total: state.records.length,
        ready,
        archived,
        avgRating: Number(avgRating.toFixed(2))
      };

      const session = {
        schemaVersion: 'brew-experiment-v1',
        exportedAt: new Date().toISOString(),
        records: state.records,
        derived: { summary: derivedSummary },
        history: []
      };

      return { artifact: session };
    }

    if (name === "artifact_import_session_json") {
      const data = args.payload;
      if (data.schemaVersion !== 'brew-experiment-v1' || !Array.isArray(data.records)) {
        throw new Error("Invalid schema");
      }
      state.setRecords(data.records);
      state.pushHistory(data.records);
      state.setSelectedRecordId(null);
      return { success: true };
    }

    throw new Error(`Tool ${name} not implemented`);
  };
}
