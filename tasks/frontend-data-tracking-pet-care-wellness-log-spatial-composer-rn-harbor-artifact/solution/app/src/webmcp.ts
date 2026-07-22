import { getSessionData, setGlobalStateForWebMCP, PetCareEvent, EventStatus } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

export const initWebMCP = () => {
  window.webmcp_session_info = async () => {
    return {
      task_id: "eval-intelligence/frontend-data-tracking-pet-care-wellness-log-spatial-composer-rn-provenance-artifact",
      state: getSessionData()
    };
  };

  window.webmcp_list_tools = async () => {
    return {
      tools: [
        {
          name: "entity_create_record",
          description: "Create a new pet care wellness log record",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
              capacity: { type: "number" }
            },
            required: ["title", "status", "capacity"]
          }
        },
        {
          name: "entity_update_record",
          description: "Update an existing pet care wellness log record",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
              capacity: { type: "number" },
              position: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                }
              }
            },
            required: ["id"]
          }
        },
        {
          name: "artifact_export_session_json",
          description: "Export the current session state as JSON",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "artifact_import_session_json",
          description: "Import a session state from JSON",
          inputSchema: {
            type: "object",
            properties: {
              session_data: { type: "string" }
            },
            required: ["session_data"]
          }
        }
      ]
    };
  };

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const currentData = getSessionData();
    const currentRecords = [...currentData.records];

    if (name === 'entity_create_record') {
        const { title, status, capacity } = args;
        const newRecord: PetCareEvent = {
            id: Date.now().toString(),
            title,
            status: status as EventStatus,
            capacity: Number(capacity)
        };
        currentRecords.push(newRecord);
        setGlobalStateForWebMCP(currentRecords);
        // Dispatch an event so React re-renders
        window.dispatchEvent(new CustomEvent('webmcp_state_update'));
        return { result: { success: true, id: newRecord.id } };
    }

    if (name === 'entity_update_record') {
        const { id, status, capacity, position } = args;
        const recordIndex = currentRecords.findIndex(r => r.id === id);
        if (recordIndex === -1) {
            throw new Error(`Record with id ${id} not found`);
        }

        const record = currentRecords[recordIndex];
        if (status) record.status = status as EventStatus;
        if (capacity !== undefined) record.capacity = Number(capacity);
        if (position) record.position = position;

        setGlobalStateForWebMCP(currentRecords);
        window.dispatchEvent(new CustomEvent('webmcp_state_update'));
        return { result: { success: true } };
    }

    if (name === 'artifact_export_session_json') {
        return { result: getSessionData() };
    }

    if (name === 'artifact_import_session_json') {
        try {
            const data = JSON.parse(args.session_data);
            if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
                throw new Error('Invalid schema');
            }
            setGlobalStateForWebMCP(data.records);
            window.dispatchEvent(new CustomEvent('webmcp_state_update'));
            return { result: { success: true } };
        } catch (e: any) {
            throw new Error('Invalid import data: ' + e.message);
        }
    }

    throw new Error(`Unknown tool: ${name}`);
  };
};
