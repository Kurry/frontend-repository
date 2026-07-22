export function initWebMCP() {
  window.webmcp_list_tools = async () => {
    return [
      {
        name: "entity_create_record",
        description: "Creates a new event record in the collection.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            petName: { type: "string" },
            date: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "failed"] },
            description: { type: "string" },
            errorReason: { type: "string" }
          },
          required: ["title", "date", "status"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates an existing event record in the collection.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            petName: { type: "string" },
            date: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "failed", "archived"] },
            description: { type: "string" },
            errorReason: { type: "string" },
            resolutionNote: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Deletes an existing event record from the collection.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_list_records",
        description: "Lists all event records in the collection.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "artifact_export",
        description: "Exports the current state as a pet-wellness-v1 artifact.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "artifact_import",
        description: "Imports a pet-wellness-v1 artifact.",
        inputSchema: {
          type: "object",
          properties: {
            artifact: { type: "object" }
          },
          required: ["artifact"]
        }
      },
      {
        name: "artifact_clear",
        description: "Clears the current state.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (name, args) => {
    if (!window.__APP_STATE__) {
      throw new Error("Application state not available yet.");
    }

    const { events, setEvents, history, setHistory } = window.__APP_STATE__;
    const pushHistory = (newEvents) => {
        setHistory([...history, events]);
        setEvents(newEvents);
    };

    switch (name) {
      case "entity_create_record": {
        const newEvent = { ...args, id: `evt-${Date.now()}` };
        pushHistory([...events, newEvent]);
        return { success: true, record: newEvent };
      }
      case "entity_update_record": {
        const { id, ...updates } = args;
        const newEvents = events.map(e => e.id === id ? { ...e, ...updates } : e);
        pushHistory(newEvents);
        return { success: true, record: newEvents.find(e => e.id === id) };
      }
      case "entity_delete_record": {
        const { id } = args;
        const newEvents = events.filter(e => e.id !== id);
        pushHistory(newEvents);
        return { success: true };
      }
      case "entity_list_records": {
        return { success: true, records: events };
      }
      case "artifact_export": {
        const derived = {
          totalEvents: events.length,
          failedEvents: events.filter(e => e.status === 'failed').length,
          recoveredEvents: events.filter(e => e.resolutionNote).length
        };
        const artifact = {
          schemaVersion: "v1",
          exportedAt: new Date().toISOString(),
          records: events,
          derived,
          history: history.map((s, i) => ({ step: i, state: 'snapshot' }))
        };
        return { success: true, artifact };
      }
      case "artifact_import": {
        const { artifact } = args;
        if (artifact.schemaVersion !== 'v1' || !Array.isArray(artifact.records)) {
          throw new Error('Invalid artifact schema. Expected v1.');
        }
        pushHistory(artifact.records);
        return { success: true };
      }
      case "artifact_clear": {
        pushHistory([]);
        return { success: true };
      }
      default:
        throw new Error(`Tool ${name} not implemented.`);
    }
  };
}
