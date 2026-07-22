# Task: Bike Maintenance Mileage Map — Spatial Composer — Artifact Provenance

<summary>
Build a fully working, self-contained single-page application for managing bike service records using a domain-native spatial composer interaction. The application implements a canonical mutation where a user can place a selected record in a spatial composer and rebalance capacity, updating linked views, a derived capacity summary, and an interoperable portable artifact (bike-maintenance-v1-spatial-composer.json). The application is in-memory only (no localStorage), fully reactive, accessible, and requires an exact artifact round trip. It must use Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Bike Service Records collection: Complete CRUD for bike service records with fields for mileage, service type, and explicitly defined domain statuses (e.g., draft, ready, changed, archived). Required fields have strict validation and boundaries. A dedicated query module provides access.
Spatial Composer surface: A dedicated drag-and-drop workspace where a selected record is visually placed, triggering a rebalance of maintenance capacity. This shared canonical mutation is fully reactive and reflected in the record derived spatial state, capacity summaries, and global history.
Derived State Linked Views: The primary workspace, summary statistics, and JSON export reflect identical state data exactly at the same time. Editing a draft updates derived counters immediately without partial state.
Portable Work Artifact: A robust JSON export/import mechanism. The resulting bike-maintenance-v1-spatial-composer.json artifact preserves spatial coordinates, authored order, unique IDs, explicit enums, and a regenerated RFC3339 exportedAt timestamp. Invalid uploads do not mutate the application state.
Undo Pipeline: Ctrl/Cmd+Z explicitly reverses the last applied geometry mutation and restores previous ordering/capacity states.
</core_features>

<visual_design>
Visual Hierarchy: Features a distinctive domain-specific workbench tailored to maintenance capacity tracking, employing clear status tokens, intentional density, and a focused canvas layout to distinguish between unassigned and resolved states.
Layout Adaptation: Presents a primary workspace alongside a linked summary and details inspector on desktop viewports. On narrower mobile screens, the secondary interfaces transform into accessible drawers or stacked steppers to prevent horizontal overflow.
Theming: Employs an accessible contrast palette and clear typographical distinctions mapping purely semantic states.
</visual_design>

<motion>
Causal Morphing: Dropping or placing a selected record triggers explicit spatial motion, where the item physically transforms into its new status presentation inside the Spatial Composer.
Reduced Motion: Provides an immediate feedback substitute devoid of coordinate transforms when system reduced motion preferences are engaged.
</motion>

<requirements>
The app must run exclusively in-memory, relying neither on localStorage nor external network/backend dependencies. All assets must be loaded locally without CDNs.
Implementation must strictly restrict file manipulation to its explicit solution/app directory scope.
Forms must reject invalid required fields, provide field-level context for recovery, and never propagate partial state to the linked views or export artifact.
Semantic accessibility controls and complete keyboard navigation parity are mandatory for the Spatial Composer interaction. Focus must track with spatial transitions dynamically.
Upon importing bike-maintenance-v1-spatial-composer.json, the payload is fully validated (verifying enums, boundaries, IDs, and cross-references). Invalid loads are ignored, treating them as no-op.
The exact domain consequence must be precisely mapped and displayed by UI copy when boundary violations occur.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
<webmcp_action_contract>
The system requires an observable interaction API for validation. Implement the following functions on the `window` object:
- `window.webmcp_session_info()`: returns a stable object containing identifying info for the task session.
- `window.webmcp_list_tools()`: returns an array of objects describing the tool schemas.
- `window.webmcp_invoke_tool(toolName, args)`: executes a tool synchronously or via Promise.

Required tool schemas for the Bike Maintenance App:
```json
[
  {
    "name": "create_record",
    "description": "Creates a new bike service record",
    "parameters": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "mileage": { "type": "number" },
        "service_type": { "type": "string" },
        "status": { "type": "string", "enum": ["draft", "ready", "changed", "archived"] }
      },
      "required": ["id", "mileage", "service_type", "status"]
    }
  },
  {
    "name": "query_records",
    "description": "Queries all existing bike service records.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "mutate_spatial_composer",
    "description": "Places a selected record in a spatial composer and rebalances capacity.",
    "parameters": {
      "type": "object",
      "properties": {
        "record_id": { "type": "string" },
        "x": { "type": "number" },
        "y": { "type": "number" }
      },
      "required": ["record_id", "x", "y"]
    }
  },
  {
    "name": "query_derived_state",
    "description": "Queries the derived spatial capacity summary and state.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "undo_mutation",
    "description": "Reverses the last recorded mutation.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "export_artifact",
    "description": "Exports the full portable artifact to a JSON string payload.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "import_artifact",
    "description": "Imports and loads a previously exported portable JSON payload.",
    "parameters": {
      "type": "object",
      "properties": {
        "payload": { "type": "string" }
      },
      "required": ["payload"]
    }
  }
]
```
</webmcp_action_contract>
</delivery>
