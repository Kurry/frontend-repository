import { store } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (req: any) => Promise<any>;
  }
}

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-data-tracking-water-intake-pattern-map-spatial-composer-rn-provenance-artifact",
});

window.webmcp_list_tools = async () => ({
  tools: [
    {
      name: "editor_select",
      description: "Select an intake record.",
      inputSchema: {
        type: "object",
        properties: {
          editor_object_type: { type: "string" },
          id: { type: "string" }
        },
        required: ["editor_object_type", "id"]
      }
    },
    {
      name: "editor_update_property",
      description: "Update spatial position or capacity.",
      inputSchema: {
        type: "object",
        properties: {
          editor_object_type: { type: "string" },
          id: { type: "string" },
          property: { type: "string" },
          value: { type: "object" }
        },
        required: ["editor_object_type", "id", "property", "value"]
      }
    },
    {
      name: "entity_create",
      description: "Create an intake event.",
      inputSchema: {
        type: "object",
        properties: {
          entity: { type: "string" },
          fields: {
            type: "object",
            properties: {
              status: { type: "string" },
              amount: { type: "number" },
              capacity: { type: "number" },
              date: { type: "string" }
            }
          }
        },
        required: ["entity", "fields"]
      }
    },
    {
      name: "entity_update",
      description: "Update an intake event.",
      inputSchema: {
        type: "object",
        properties: {
          entity: { type: "string" },
          id: { type: "string" },
          fields: {
            type: "object",
            properties: {
              status: { type: "string" },
              amount: { type: "number" },
              capacity: { type: "number" },
              date: { type: "string" }
            }
          }
        },
        required: ["entity", "id", "fields"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete an intake event.",
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
      name: "entity_select",
      description: "Select an intake event.",
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
      name: "artifact_export",
      description: "Export session artifact to JSON.",
      inputSchema: {
        type: "object",
        properties: {
           format: { type: "string" }
        }
      }
    },
    {
      name: "artifact_import",
      description: "Import session artifact.",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string" },
          data: { type: "object" }
        },
        required: ["mode", "data"]
      }
    }
  ]
});

window.webmcp_invoke_tool = async (req: any) => {
  const { name, arguments: args } = req;

  if (name === "editor_select") {
    return { content: [{ type: "text", text: `Selected record ${args.id} in composer` }] };
  }

  if (name === "editor_update_property") {
    if (args.property === 'position') {
       store.placeInComposer(args.id, args.value.position, args.value.capacity);
    }
    return { content: [{ type: "text", text: `Updated property ${args.property}` }] };
  }

  if (name === "entity_create") {
    if (args.entity !== 'intake-event') throw new Error("Invalid entity");
    store.createEvent({
      status: args.fields.status || 'draft',
      amount: args.fields.amount || 0,
      capacity: args.fields.capacity || 50,
      date: args.fields.date || new Date().toISOString(),
      position: null
    });
    return { content: [{ type: "text", text: `Created record` }] };
  }

  if (name === "entity_update") {
    if (args.entity !== 'intake-event') throw new Error("Invalid entity");
    store.updateEvent(args.id, {
      status: args.fields.status,
      amount: args.fields.amount,
      capacity: args.fields.capacity,
      date: args.fields.date
    });
    return { content: [{ type: "text", text: `Updated record ${args.id}` }] };
  }

  if (name === "entity_delete") {
    if (args.entity !== 'intake-event') throw new Error("Invalid entity");
    if (!args.confirm) throw new Error("Delete requires confirm=true");
    store.deleteEvent(args.id);
    return { content: [{ type: "text", text: `Deleted record ${args.id}` }] };
  }

  if (name === "entity_select") {
    return { content: [{ type: "text", text: `Selected record ${args.id}` }] };
  }

  if (name === "artifact_export") {
    const data = store.export();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }

  if (name === "artifact_import") {
    const res = store.import(args.data);
    if (!res.success) {
      throw new Error(`Import failed: ${res.errors.join(', ')}`);
    }
    return { content: [{ type: "text", text: "Imported successfully" }] };
  }

  throw new Error(`Tool not found: ${name}`);
};

export {};
