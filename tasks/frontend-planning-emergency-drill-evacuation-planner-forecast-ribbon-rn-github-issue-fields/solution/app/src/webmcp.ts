import { Checkpoint, EvacuationSession, DerivedSummary } from './types';
import { store } from './store';

// Helper function to generate derived summary based on given records
function generateDerivedSummary(records: Checkpoint[]): DerivedSummary {
  const total_checkpoints = records.length;
  const total_headcount = records.reduce((sum, cp) => sum + cp.headcount, 0);
  const max_predicted_time = records.reduce((max, cp) => Math.max(max, cp.predicted_time), 0);
  const avg_target_time = total_checkpoints > 0
    ? records.reduce((sum, cp) => sum + cp.target_time, 0) / total_checkpoints
    : 0;
  const ready_count = records.filter(cp => cp.status === 'ready').length;

  return {
    total_checkpoints,
    total_headcount,
    max_predicted_time,
    avg_target_time,
    ready_count
  };
}

export function initWebMCP() {
  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-planning-emergency-drill-evacuation-planner-forecast-ribbon-rn-github-issue-fields"
  });

  window.webmcp_list_tools = () => {
    return [
      {
        name: "entity_create_record",
        description: "Creates a new drill checkpoint.",
        inputSchema: {
          type: "object",
          properties: {
            entity_name: { type: "string" },
            entity_fields: { type: "object" }
          },
          required: ["entity_name", "entity_fields"]
        }
      },
      {
        name: "entity_read_record",
        description: "Reads a drill checkpoint by ID.",
        inputSchema: {
          type: "object",
          properties: {
            entity_name: { type: "string" },
            id: { type: "string" }
          },
          required: ["entity_name", "id"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates an existing drill checkpoint.",
        inputSchema: {
          type: "object",
          properties: {
            entity_name: { type: "string" },
            id: { type: "string" },
            entity_fields: { type: "object" }
          },
          required: ["entity_name", "id", "entity_fields"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Deletes a drill checkpoint.",
        inputSchema: {
          type: "object",
          properties: {
            entity_name: { type: "string" },
            id: { type: "string" },
            confirm: { type: "boolean" }
          },
          required: ["entity_name", "id", "confirm"]
        }
      },
      {
        name: "entity_list_records",
        description: "Lists all drill checkpoints.",
        inputSchema: {
          type: "object",
          properties: {
            entity_name: { type: "string" }
          },
          required: ["entity_name"]
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
            artifact_content: { type: "string" } // Passed as JSON string
          },
          required: ["artifact_content"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (tool_name: string, args: any) => {
    switch (tool_name) {
      case "entity_create_record": {
        if (args.entity_name !== 'checkpoint') throw new Error("Unknown entity");
        const cp = args.entity_fields as Checkpoint;
        if (!cp.id || !cp.name || cp.predicted_time === undefined) throw new Error("Missing fields");
        store.addCheckpoint(cp);
        return { success: true, record: cp };
      }

      case "entity_read_record": {
        if (args.entity_name !== 'checkpoint') throw new Error("Unknown entity");
        const cp = store.getState().checkpoints.find(c => c.id === args.id);
        if (!cp) throw new Error("Not found");
        return { success: true, record: cp };
      }

      case "entity_update_record": {
        if (args.entity_name !== 'checkpoint') throw new Error("Unknown entity");
        store.updateCheckpoint(args.id, args.entity_fields);
        return { success: true, record: store.getState().checkpoints.find(c => c.id === args.id) };
      }

      case "entity_delete_record": {
        if (args.entity_name !== 'checkpoint') throw new Error("Unknown entity");
        if (!args.confirm) throw new Error("Confirmation required");
        store.deleteCheckpoint(args.id);
        return { success: true };
      }

      case "entity_list_records": {
        if (args.entity_name !== 'checkpoint') throw new Error("Unknown entity");
        return { success: true, records: store.getState().checkpoints };
      }

      case "artifact_export_session_json": {
        if (args.format !== 'evacuation-drill-v1.json') throw new Error("Unsupported format");
        const state = store.getState();
        const records = state.checkpoints;
        const derived = generateDerivedSummary(records);

        const session: EvacuationSession = {
          schemaVersion: "evacuation-drill-v1",
          exportedAt: new Date().toISOString(),
          records: records,
          derived: derived,
          history: [] // Export history omitted for brevity in file payload, though schema allows it
        };

        return { success: true, artifact_content: JSON.stringify(session) };
      }

      case "artifact_import_session_json": {
        let session: EvacuationSession;
        try {
          session = JSON.parse(args.artifact_content);
        } catch (e) {
          throw new Error("Invalid JSON");
        }

        if (session.schemaVersion !== "evacuation-drill-v1") {
          throw new Error("Invalid schemaVersion");
        }

        // Simple validation on required fields
        if (!Array.isArray(session.records)) throw new Error("Invalid records array");

        const ids = new Set();
        for (const r of session.records) {
           if (!r.id || ids.has(r.id)) throw new Error("Duplicate or missing ID");
           ids.add(r.id);

           if (typeof r.predicted_time !== 'number' || typeof r.headcount !== 'number') {
             throw new Error("Invalid boundaries or bounds");
           }
        }

        store.importData(session);
        return { success: true };
      }

      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  };
}
