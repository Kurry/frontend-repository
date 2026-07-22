import { photoSequenceCaptionLoomSessionSchema } from './schemas';

export function initializeWebMCP(dispatch, getState) {
  window.webmcp_session_info = {
    "status": "ready",
    "artifacts": ["photo-caption-v1-constraint-canvas.json"]
  };

  window.webmcp_list_tools = () => {
    return [
      {
        "name": "get_state",
        "description": "Retrieves the full in-memory state of the application.",
        "input_schema": { "type": "object", "properties": {} }
      },
      {
        "name": "import_state",
        "description": "Imports a full session state JSON matching the schema.",
        "input_schema": {
          "type": "object",
          "properties": {
            "session": { "type": "object", "description": "The PhotoSequenceCaptionLoomSession JSON object" }
          },
          "required": ["session"]
        }
      },
      {
        "name": "export_state",
        "description": "Returns the derived export state.",
        "input_schema": { "type": "object", "properties": {} }
      },
      {
        "name": "create_record",
        "description": "Creates a new photo sequence record.",
        "input_schema": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "status": { "type": "string" }
          },
          "required": ["title", "status"]
        }
      },
      {
        "name": "update_record",
        "description": "Updates an existing photo sequence record.",
        "input_schema": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "updates": {
              "type": "object",
              "properties": {
                "title": { "type": "string" },
                "status": { "type": "string" }
              }
            }
          },
          "required": ["id", "updates"]
        }
      },
      {
        "name": "delete_record",
        "description": "Deletes an existing photo sequence record.",
        "input_schema": {
          "type": "object",
          "properties": {
            "id": { "type": "string" }
          },
          "required": ["id"]
        }
      },
      {
        "name": "resolve_constraint",
        "description": "Simulates dragging a record to a new constraint lane.",
        "input_schema": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "targetLane": { "type": "string" }
          },
          "required": ["id", "targetLane"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (tool_name, params) => {
    try {
      if (tool_name === 'get_state') {
        return { result: getState() };
      }

      if (tool_name === 'export_state') {
        const state = getState();
        const data = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived: {
            summary: `Exported ${state.records.length} records.`,
            stats: {
              total: state.records.length,
              resolved: state.records.filter(r => r.canvasState === 'resolved').length
            }
          },
          history: state.history
        };
        return { result: data };
      }

      if (tool_name === 'import_state') {
        const parsed = photoSequenceCaptionLoomSessionSchema.parse(params.session);
        dispatch({
          type: 'IMPORT',
          payload: {
            records: parsed.records,
            history: parsed.history,
          }
        });
        return { result: "Import successful" };
      }

      if (tool_name === 'create_record') {
        if (!params.title || params.title.trim() === '') {
           throw new Error("Validation failed: Title is required.");
        }
        dispatch({
          type: 'CREATE_RECORD',
          payload: {
            id: Math.random().toString(36).substring(7),
            title: params.title,
            status: params.status
          }
        });
        return { result: "Record created" };
      }

      if (tool_name === 'update_record') {
        if (params.updates.title !== undefined && params.updates.title.trim() === '') {
           throw new Error("Validation failed: Title cannot be empty.");
        }
        dispatch({
          type: 'UPDATE_RECORD',
          payload: {
            id: params.id,
            updates: params.updates
          }
        });
        return { result: "Record updated" };
      }

      if (tool_name === 'delete_record') {
        dispatch({
          type: 'DELETE_RECORD',
          payload: { id: params.id }
        });
        return { result: "Record deleted" };
      }

      if (tool_name === 'resolve_constraint') {
        const state = getState();
        const record = state.records.find(r => r.id === params.id);
        if (!record) throw new Error("Record not found");
        if (params.targetLane === 'conflict') throw new Error("Conflict lane drop rejected.");
        dispatch({
          type: 'RESOLVE_CONSTRAINT',
          payload: { id: params.id, targetLane: params.targetLane, originalLane: record.canvasState }
        });
        return { result: "Constraint resolved" };
      }

      throw new Error(`Unknown tool: ${tool_name}`);
    } catch (e) {
      return { error: e.message || String(e) };
    }
  };
}
