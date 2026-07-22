# Bike Maintenance Mileage Map — Recovery Board — Canva Live Preview

<summary>
Manage bike service records through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The signature interaction is to move a failed record into a recovery path and repair its downstream consequences. This concept adapts a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact. Built as a good-app genre frontend-only product using Tailwind CSS 4.3.2 installed via npm-local/no-CDN.
</summary>

<core_features>
- Bike Service Records collection: Create, edit, archive, and filter bike service records with explicit domain statuses. Includes states for empty, draft, ready, changed, archived. Invalid required fields preserve the prior valid record and explain recovery.
- Recovery Board surface: Use the recovery board interaction to derive a decision about the collection. Move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation. Conflicting or incomplete mutations are rejected without partial updates. Undo restores ordering, selection, and derived values.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact; clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
- Tailwind CSS 4.3.2 installed via npm-local/no-CDN.
- The recovery board mutation changes the primary record, linked view, and status together.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The recovery board surface, derived summary, and artifact query share one state.
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</requirements>

## WebMCP Contract

The application must implement the following WebMCP tools on the `window` object:

```javascript
window.webmcp_session_info = {
  task_id: "frontend-data-tracking-bike-maintenance-mileage-map-recovery-board-rn-canva-live-preview",
  session_version: "1.0.0"
};

window.webmcp_list_tools = function() {
  return [
    {
      name: "query_state",
      description: "Query the current state of bike service records and recovery board",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "create_record",
      description: "Create a new bike service record",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          status: { type: "string" },
          distance: { type: "number" },
          notes: { type: "string" }
        },
        required: ["title", "status"]
      }
    },
    {
      name: "update_record",
      description: "Update an existing bike service record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string" },
          distance: { type: "number" },
          notes: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "delete_record",
      description: "Delete a bike service record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "move_to_recovery",
      description: "Move a failed record into a recovery path and repair its downstream consequences",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          recoveryAction: { type: "string" }
        },
        required: ["id", "recoveryAction"]
      }
    },
    {
      name: "undo_last_mutation",
      description: "Undo the last mutation",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "export_artifact",
      description: "Export the portable work artifact",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "import_artifact",
      description: "Import the portable work artifact",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "object" }
        },
        required: ["data"]
      }
    },
    {
      name: "clear_state",
      description: "Clear the current state",
      inputSchema: { type: "object", properties: {} }
    }
  ];
};

window.webmcp_invoke_tool = function(name, args) {
  // Implementation
};
```

<webmcp_action_contract>
```javascript
window.webmcp_session_info = {
  task_id: "frontend-data-tracking-bike-maintenance-mileage-map-recovery-board-rn-canva-live-preview",
  session_version: "1.0.0"
};

window.webmcp_list_tools = function() {
  return [
    {
      name: "query_state",
      description: "Query the current state of bike service records and recovery board",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "create_record",
      description: "Create a new bike service record",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          status: { type: "string" },
          distance: { type: "number" },
          notes: { type: "string" }
        },
        required: ["title", "status"]
      }
    },
    {
      name: "update_record",
      description: "Update an existing bike service record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string" },
          distance: { type: "number" },
          notes: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "delete_record",
      description: "Delete a bike service record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "move_to_recovery",
      description: "Move a failed record into a recovery path and repair its downstream consequences",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          recoveryAction: { type: "string" }
        },
        required: ["id", "recoveryAction"]
      }
    },
    {
      name: "undo_last_mutation",
      description: "Undo the last mutation",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "export_artifact",
      description: "Export the portable work artifact",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "import_artifact",
      description: "Import the portable work artifact",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "object" }
        },
        required: ["data"]
      }
    },
    {
      name: "clear_state",
      description: "Clear the current state",
      inputSchema: { type: "object", properties: {} }
    }
  ];
};

window.webmcp_invoke_tool = function(name, args) {
  // Implementation
};
```
</webmcp_action_contract>
